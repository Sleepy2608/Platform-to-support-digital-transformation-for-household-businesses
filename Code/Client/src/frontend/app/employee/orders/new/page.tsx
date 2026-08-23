'use client';

import { useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import { ProductSearchPicker, SearchProduct } from '@/app/components/ProductSearchPicker';
import {
  CartItem,
  CartResolvedPrice,
  CartUnit,
  CheckoutData,
  OrderCartDrawer,
} from '@/app/components/OrderCartDrawer';

interface SalesOrderResponse {
  orderCode: string;
}

export default function EmployeeCreateOrderPage() {
  const nextKey = useRef(1);
  const resolveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState('');

  const patchItem = (key: number, patch: Partial<CartItem>) => {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  };

  const resolveItem = async (key: number, productId: number, unitId: number, quantity: string) => {
    const parsed = parseQuantity(quantity);
    if (!parsed) {
      patchItem(key, { resolving: false, resolved: undefined, error: 'Số lượng phải lớn hơn 0' });
      return;
    }
    patchItem(key, { resolving: true, resolved: undefined, error: undefined });
    try {
      const resolved = await apiClient.post<CartResolvedPrice>('/api/product-prices/resolve', {
        productId, unitId, quantity: parsed,
      });
      setItems((current) => current.map((item) => item.key === key
        && item.productId === productId && item.unitId === unitId && item.quantity === quantity
        ? { ...item, resolving: false, resolved, error: undefined }
        : item));
    } catch (err) {
      patchItem(key, {
        resolving: false,
        resolved: undefined,
        error: err instanceof Error ? err.message : 'Không thể tính giá',
      });
    }
  };

  const scheduleResolve = (key: number, productId: number, unitId: number, quantity: string) => {
    clearTimeout(resolveTimers.current[key]);
    resolveTimers.current[key] = setTimeout(
      () => void resolveItem(key, productId, unitId, quantity), 250,
    );
  };

  const maximumQuantity = (item: CartItem, unitId: number) => {
    const selectedUnit = item.units.find((unit) => unit.unitId === unitId);
    const rate = Number(selectedUnit?.conversionRate || 0);
    if (rate <= 0) return 0;
    const used = items
      .filter((candidate) => candidate.productId === item.productId && candidate.key !== item.key)
      .reduce((sum, candidate) => {
        const candidateRate = Number(
          candidate.units.find((unit) => unit.unitId === candidate.unitId)?.conversionRate || 0,
        );
        return sum + parseQuantity(candidate.quantity) * candidateRate;
      }, 0);
    const maximum = Math.max(0, Number(item.quantityOnHand || 0) - used) / rate;
    return allowsFractionalQuantity(selectedUnit?.unitCode)
      ? roundDown3(maximum)
      : Math.floor(maximum);
  };

  const addProduct = async (product: SearchProduct) => {
    setError('');
    if (product.status !== 'ACTIVE' || Number(product.quantityOnHand || 0) < 0.001) {
      setError(`Sản phẩm ${product.productName} đã hết hoặc ngừng bán`);
      return;
    }
    setCartOpen(true);
    const existing = items.find(
      (item) => item.productId === product.id && item.unitId === product.baseUnitId,
    );
    if (existing) {
      changeQuantity(existing.key, String(parseQuantity(existing.quantity) + 1));
      return;
    }
    try {
      const units = await apiClient.get<CartUnit[]>(`/api/products/${product.id}/units`);
      const preferred = units.find((unit) => unit.unitId === product.baseUnitId)
        || units.find((unit) => unit.baseUnit) || units[0];
      if (!preferred) throw new Error('Sản phẩm chưa được cấu hình đơn vị tính');
      const key = nextKey.current++;
      const availableInPreferredUnit = Number(product.quantityOnHand || 0)
        / Number(preferred.conversionRate || 1);
      const preferredAllowsFraction = allowsFractionalQuantity(preferred.unitCode);
      if (!preferredAllowsFraction && Math.floor(availableInPreferredUnit) < 1) {
        throw new Error(`Sản phẩm ${product.productName} không đủ 1 ${preferred.unitName}`);
      }
      const initialQuantity = preferredAllowsFraction
        ? String(roundDown3(Math.min(1, availableInPreferredUnit)))
        : '1';
      const item: CartItem = {
        key,
        productId: product.id,
        productCode: product.productCode,
        productName: product.productName,
        imageUrl: product.imageUrl,
        baseUnitName: product.baseUnitName,
        quantityOnHand: product.quantityOnHand,
        unitId: preferred.unitId,
        quantity: initialQuantity,
        units,
        resolving: true,
      };
      setItems((current) => [...current, item]);
      void resolveItem(key, product.id, preferred.unitId, initialQuantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm sản phẩm vào đơn');
    }
  };

  const changeQuantity = (key: number, raw: string) => {
    const item = items.find((candidate) => candidate.key === key);
    if (!item) return;
    const selectedUnit = item.units.find((unit) => unit.unitId === item.unitId);
    const quantity = normalizeQuantity(raw, allowsFractionalQuantity(selectedUnit?.unitCode));
    if (quantity === null) return;
    const maximum = maximumQuantity(item, item.unitId);
    if (parseQuantity(quantity) > maximum) {
      patchItem(key, { stockWarning: `Tồn kho chỉ đáp ứng tối đa ${formatQuantity(maximum)}` });
      return;
    }
    patchItem(key, {
      quantity, resolving: true, resolved: undefined, error: undefined, stockWarning: undefined,
    });
    scheduleResolve(key, item.productId, item.unitId, quantity);
  };

  const changeUnit = (key: number, unitId: number) => {
    const item = items.find((candidate) => candidate.key === key);
    if (!item) return;
    const maximum = maximumQuantity(item, unitId);
    if (maximum <= 0) {
      patchItem(key, {
        unitId, quantity: '', resolving: false, resolved: undefined,
        error: 'Không đủ tồn kho cho đơn vị đã chọn',
      });
      return;
    }
    const current = parseQuantity(item.quantity);
    const selectedUnit = item.units.find((unit) => unit.unitId === unitId);
    const allowsFraction = allowsFractionalQuantity(selectedUnit?.unitCode);
    const normalizedCurrent = allowsFraction ? current : Math.max(1, Math.floor(current));
    const quantity = normalizedCurrent > maximum ? String(maximum) : String(normalizedCurrent);
    patchItem(key, {
      unitId, quantity, resolving: true, resolved: undefined, error: undefined,
      stockWarning: current > maximum ? `Số lượng đã giảm còn ${formatQuantity(maximum)}` : undefined,
    });
    scheduleResolve(key, item.productId, unitId, quantity);
  };

  const removeItem = (key: number) => {
    clearTimeout(resolveTimers.current[key]);
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const clearCart = () => {
    Object.values(resolveTimers.current).forEach(clearTimeout);
    resolveTimers.current = {};
    setItems([]);
  };

  const checkout = async (data: CheckoutData) => {
    const result = await apiClient.post<SalesOrderResponse>('/api/sales-orders', {
      orderCode: data.orderCode,
      customerId: data.customerId,
      source: data.source,
      paidAmount: data.paidAmount,
      note: data.note,
      items: items.map((item) => ({
        productId: item.productId,
        unitId: item.unitId,
        quantity: parseQuantity(item.quantity),
      })),
    });
    return { orderCode: result.orderCode };
  };

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Bán hàng</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Tạo đơn tại quầy</h1>
            <p className="mt-2 text-sm text-slate-500">Tìm sản phẩm, chọn số lượng và xác nhận đơn ngay trên điện thoại hoặc máy tính.</p>
          </div>
          <button onClick={() => setCartOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            <ShoppingCart className="h-4 w-4" /> Giỏ hàng ({items.length})
          </button>
        </header>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        <ProductSearchPicker
          onSelectProduct={(product) => void addProduct(product)}
          selectedIds={items.map((item) => item.productId)}
        />
      </div>
      <OrderCartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        onChangeUnit={changeUnit}
        onChangeQuantity={changeQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={checkout}
      />
    </div>
  );
}

function parseQuantity(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 1000) / 1000 : 0;
}

function normalizeQuantity(value: string, allowsFraction: boolean): string | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return '';
  const pattern = allowsFraction ? /^\d+(?:\.\d{0,3})?$/ : /^\d+$/;
  if (!pattern.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999_999_999_999_999.999) return null;
  return normalized;
}

function roundDown3(value: number) {
  return Math.floor(Math.max(0, value) * 1000 + Number.EPSILON) / 1000;
}

function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function allowsFractionalQuantity(unitCode?: string) {
  const code = (unitCode || '').trim().toUpperCase();
  return code === 'KG' || code === 'LIT';
}
