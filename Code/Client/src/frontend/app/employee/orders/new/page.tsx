'use client';

import { useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import { ProductSearchPicker, SearchProduct } from '@/app/components/ProductSearchPicker';
import { AiOrderInput, AiOrderProposal } from '@/app/components/AiOrderInput';
import {
  CartItem,
  CartResolvedPrice,
  CartUnit,
  CheckoutData,
  CustomerOption,
  InitialCheckout,
  OrderCartDrawer,
} from '@/app/components/OrderCartDrawer';

interface SalesOrderResponse {
  orderCode: string;
}

export function CreateOrderPage() {
  const nextKey = useRef(1);
  const resolveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState('');
  const [initialCheckout, setInitialCheckout] = useState<InitialCheckout>();
  const [cartSession, setCartSession] = useState(0);

  const applyAiProposal = async (proposal: AiOrderProposal) => {
    if (!proposal.readyToApply || items.length > 0 || proposal.paymentType === 'UNKNOWN'
        || proposal.items.length === 0 || proposal.items.some((item) => !item.product || !item.price || !item.quantity)) return;
    let selectedCustomer: CustomerOption | undefined = proposal.customer || undefined;
    if (!selectedCustomer && proposal.customerNeedsCreation && proposal.customerName) {
      selectedCustomer = await apiClient.post<CustomerOption>('/api/customers/quick', {
        customerName: proposal.customerName,
        phone: '',
      });
    }
    Object.values(resolveTimers.current).forEach(clearTimeout);
    resolveTimers.current = {};
    const proposedItems: CartItem[] = proposal.items.map((item) => ({
      key: nextKey.current++, productId: item.product!.id, productCode: item.product!.productCode,
      productName: item.product!.productName, imageUrl: item.product!.imageUrl,
      baseUnitName: item.product!.baseUnitName, quantityOnHand: item.product!.quantityOnHand,
      unitId: item.price!.unitId, quantity: String(item.quantity), units: item.units,
      resolving: false, resolved: item.price!,
    }));
    setItems(proposedItems);
    setInitialCheckout({
      orderCode: `AI-${crypto.randomUUID().slice(0, 18)}`,
      customer: selectedCustomer,
      paymentType: proposal.paymentType,
      note: `Đơn được hỗ trợ nhập bằng AI. Thanh toán: ${proposal.paymentType === 'DEBT' ? 'ghi nợ' : proposal.paymentType === 'TRANSFER' ? 'chuyển khoản' : 'tiền mặt'}.`,
    });
    setCartSession((value) => value + 1);
    setCartOpen(true);
    setError('');
  };

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
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none" style={{ userSelect: 'none' }}>
              Tạo đơn tại quầy
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none" style={{ userSelect: 'none' }}>
              Tìm sản phẩm, chọn số lượng và xác nhận đơn ngay trên điện thoại hoặc máy tính
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              Bán hàng
            </span>
            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4" /> Giỏ hàng ({items.length})
            </button>
          </div>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        <AiOrderInput onApply={applyAiProposal} cartHasItems={items.length > 0} />
        <ProductSearchPicker
          onSelectProduct={(product) => void addProduct(product)}
          selectedIds={items.map((item) => item.productId)}
        />
      </div>
      <OrderCartDrawer
        key={cartSession}
        initialCheckout={initialCheckout}
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

export default function EmployeeCreateOrderPage() {
  return <CreateOrderPage />;
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
