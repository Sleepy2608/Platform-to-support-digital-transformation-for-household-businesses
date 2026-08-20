'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface PageResponse<T> {
  content: T[];
}

interface Product {
  id: number;
  productCode: string;
  productName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface ProductUnit {
  id: number;
  unitId: number;
  unitName: string;
  conversionRate: number;
  baseUnit: boolean;
}

interface ResolvedPrice {
  productId: number;
  productUnitId: number;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  appliedRuleName: string;
}

interface OrderLine {
  key: number;
  productId: string;
  unitId: string;
  quantity: string;
  units: ProductUnit[];
  resolving: boolean;
  resolved?: ResolvedPrice;
  error?: string;
}

interface SalesOrderResponse {
  id: number;
  orderCode: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
}

const createEmptyLine = (key: number): OrderLine => ({
  key,
  productId: '',
  unitId: '',
  quantity: '1',
  units: [],
  resolving: false,
});

export default function CreateSalesOrderPage() {
  const nextKey = useRef(2);
  const resolveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<OrderLine[]>([createEmptyLine(1)]);
  const [orderCode, setOrderCode] = useState('');
  const [source, setSource] = useState('POS');
  const [paidAmount, setPaidAmount] = useState('0');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<SalesOrderResponse | null>(null);

  useEffect(() => {
    const timers = resolveTimers.current;
    apiClient.get<PageResponse<Product>>('/api/products?status=ACTIVE&page=0&size=100&sortBy=productName&direction=asc')
      .then((result) => {
        setProducts(result.content);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải sản phẩm'))
      .finally(() => setLoading(false));
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const totalAmount = useMemo(
    () => lines.reduce((total, line) => total + Number(line.resolved?.lineTotal || 0), 0),
    [lines],
  );

  const debtAmount = Math.max(0, totalAmount - Number(paidAmount || 0));

  const patchLine = (key: number, patch: Partial<OrderLine>) => {
    setLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));
  };

  const resolveLine = async (line: OrderLine) => {
    const productId = Number(line.productId);
    const unitId = Number(line.unitId);
    const quantity = Number(line.quantity.replace(',', '.'));
    if (!productId || !unitId || !Number.isFinite(quantity) || quantity <= 0) {
      patchLine(line.key, { resolving: false, resolved: undefined });
      return;
    }
    patchLine(line.key, { resolving: true, error: undefined });
    try {
      const resolved = await apiClient.post<ResolvedPrice>('/api/product-prices/resolve', {
        productId,
        unitId,
        quantity,
      });
      setLines((current) => current.map((item) => {
        if (item.key !== line.key) return item;
        const isSameInput = item.productId === line.productId
          && item.unitId === line.unitId
          && item.quantity === line.quantity;
        return isSameInput ? { ...item, resolving: false, resolved, error: undefined } : item;
      }));
    } catch (err) {
      setLines((current) => current.map((item) => {
        if (item.key !== line.key) return item;
        const isSameInput = item.productId === line.productId
          && item.unitId === line.unitId
          && item.quantity === line.quantity;
        return isSameInput ? {
          ...item,
          resolving: false,
          resolved: undefined,
          error: err instanceof Error ? err.message : 'Không thể tính giá',
        } : item;
      }));
    }
  };

  const scheduleResolve = (line: OrderLine) => {
    clearTimeout(resolveTimers.current[line.key]);
    resolveTimers.current[line.key] = setTimeout(() => void resolveLine(line), 350);
  };

  const changeProduct = async (line: OrderLine, productId: string) => {
    clearTimeout(resolveTimers.current[line.key]);
    patchLine(line.key, {
      productId,
      unitId: '',
      units: [],
      resolved: undefined,
      error: undefined,
    });
    if (!productId) return;
    try {
      const units = await apiClient.get<ProductUnit[]>(`/api/products/${productId}/units`);
      const preferredUnit = units.find((unit) => unit.baseUnit) || units[0];
      const nextLine = {
        ...line,
        productId,
        unitId: preferredUnit ? String(preferredUnit.unitId) : '',
        units,
        resolved: undefined,
      };
      patchLine(line.key, nextLine);
      scheduleResolve(nextLine);
    } catch (err) {
      patchLine(line.key, {
        error: err instanceof Error ? err.message : 'Không thể tải đơn vị tính',
      });
    }
  };

  const changeUnit = (line: OrderLine, unitId: string) => {
    const nextLine = { ...line, unitId, resolved: undefined, error: undefined };
    patchLine(line.key, nextLine);
    scheduleResolve(nextLine);
  };

  const changeQuantity = (line: OrderLine, quantity: string) => {
    if (!/^\d*(?:[.,]\d{0,3})?$/.test(quantity)) return;
    const nextLine = { ...line, quantity, resolved: undefined, error: undefined };
    patchLine(line.key, nextLine);
    scheduleResolve(nextLine);
  };

  const addLine = () => {
    setLines((current) => [...current, createEmptyLine(nextKey.current++)]);
  };

  const removeLine = (key: number) => {
    clearTimeout(resolveTimers.current[key]);
    setLines((current) => current.length === 1
      ? [createEmptyLine(nextKey.current++)]
      : current.filter((line) => line.key !== key));
  };

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setCreatedOrder(null);
    if (lines.some((line) => !line.productId || !line.unitId || Number(line.quantity.replace(',', '.')) <= 0)) {
      setError('Vui lòng chọn đầy đủ sản phẩm, đơn vị và số lượng');
      return;
    }
    if (lines.some((line) => !line.resolved)) {
      setError('Có sản phẩm chưa được thiết lập giá bán hoặc đang chờ tính giá');
      return;
    }
    const paid = Number(paidAmount.replace(',', '.'));
    if (!Number.isFinite(paid) || paid < 0 || paid > totalAmount) {
      setError('Số tiền khách trả phải từ 0 đến tổng tiền đơn hàng');
      return;
    }
    setSaving(true);
    try {
      const result = await apiClient.post<SalesOrderResponse>('/api/sales-orders', {
        orderCode,
        source,
        paidAmount: paid,
        note,
        items: lines.map((line) => ({
          productId: Number(line.productId),
          unitId: Number(line.unitId),
          quantity: Number(line.quantity.replace(',', '.')),
        })),
      });
      setCreatedOrder(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo đơn hàng');
    } finally {
      setSaving(false);
    }
  };

  const resetOrder = () => {
    setLines([createEmptyLine(nextKey.current++)]);
    setOrderCode('');
    setPaidAmount('0');
    setNote('');
    setCreatedOrder(null);
    setError('');
  };

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Bán hàng</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Tạo đơn hàng</h1><p className="mt-2 text-sm text-slate-500">Chọn đơn vị và nhập số lượng để hệ thống tự động tính thành tiền.</p></div>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {createdOrder && (
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
              <div><p className="font-black text-emerald-900">Đã tạo đơn {createdOrder.orderCode}</p><p className="mt-1 text-sm text-emerald-700">Tổng tiền {formatVnd(createdOrder.totalAmount)} · Còn nợ {formatVnd(createdOrder.debtAmount)}</p></div>
            </div>
            <button onClick={resetOrder} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Tạo đơn mới</button>
          </div>
        )}

        <form onSubmit={submitOrder} className="space-y-6">
          <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Mã đơn hàng"><input required maxLength={50} value={orderCode} onChange={(event) => setOrderCode(event.target.value)} className="form-input" placeholder="Ví dụ: DH-001" /></Field>
            <Field label="Nguồn đơn"><select value={source} onChange={(event) => setSource(event.target.value)} className="form-input"><option value="POS">Bán tại quầy</option><option value="ONLINE">Đơn trực tuyến</option></select></Field>
            <Field label="Khách đã trả"><input type="text" inputMode="decimal" value={paidAmount} onChange={(event) => { if (/^\d*(?:[.,]\d{0,2})?$/.test(event.target.value)) setPaidAmount(event.target.value); }} className="form-input" /></Field>
            <Field label="Còn nợ"><div className="form-input bg-slate-50 font-bold text-slate-700">{formatVnd(debtAmount)}</div></Field>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><h2 className="font-black text-slate-950">Sản phẩm bán</h2><p className="mt-1 text-xs text-slate-400">Đơn giá được lấy từ bảng giá của đơn vị đã chọn.</p></div>
              <button type="button" onClick={addLine} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Thêm dòng</button>
            </div>

            {loading ? <div className="flex h-40 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải sản phẩm...</div> : (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">Đơn vị</th><th className="px-4 py-3">Số lượng</th><th className="px-4 py-3">Đơn giá</th><th className="px-4 py-3">Phép tính</th><th className="px-4 py-3 text-right">Thành tiền</th><th className="w-16 px-4 py-3" /></tr></thead>
                  <tbody className="divide-y divide-slate-100">{lines.map((line) => (
                    <tr key={line.key} className="align-top">
                      <td className="px-4 py-4"><select required value={line.productId} onChange={(event) => void changeProduct(line, event.target.value)} className="form-input"><option value="">Chọn sản phẩm</option>{products.map((product) => <option key={product.id} value={product.id}>{product.productName} ({product.productCode})</option>)}</select></td>
                      <td className="px-4 py-4"><select required disabled={!line.productId} value={line.unitId} onChange={(event) => changeUnit(line, event.target.value)} className="form-input"><option value="">Chọn đơn vị</option>{line.units.map((unit) => <option key={unit.id} value={unit.unitId}>{unit.unitName}</option>)}</select></td>
                      <td className="px-4 py-4"><input required type="text" inputMode="decimal" value={line.quantity} onChange={(event) => changeQuantity(line, event.target.value)} className="form-input w-28" /></td>
                      <td className="whitespace-nowrap px-4 py-5 font-bold text-slate-800">{line.resolving ? 'Đang tính...' : line.resolved ? formatVnd(line.resolved.unitPrice) : '—'}{line.error && <p className="mt-1 max-w-48 whitespace-normal text-xs font-medium text-red-600">{line.error}</p>}</td>
                      <td className="whitespace-nowrap px-4 py-5 text-slate-500">{line.resolved ? `${formatNumber(line.resolved.quantity)} × ${formatVnd(line.resolved.unitPrice)}` : '—'}</td>
                      <td className="whitespace-nowrap px-4 py-5 text-right text-base font-black text-slate-950">{line.resolved ? formatVnd(line.resolved.lineTotal) : '—'}</td>
                      <td className="px-4 py-4"><button type="button" onClick={() => removeLine(line.key)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Xóa dòng"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_360px]">
            <Field label="Ghi chú"><textarea rows={4} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="form-input" placeholder="Thông tin thêm cho đơn hàng" /></Field>
            <div className="space-y-4 rounded-xl bg-slate-50 p-5">
              <div className="flex items-center justify-between text-sm text-slate-500"><span>Tổng số dòng</span><strong className="text-slate-800">{lines.length}</strong></div>
              <div className="flex items-end justify-between border-t border-slate-200 pt-4"><span className="font-bold text-slate-600">Tổng tiền</span><strong className="text-2xl font-black text-slate-950">{formatVnd(totalAmount)}</strong></div>
              <button disabled={saving || loading || Boolean(createdOrder)} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40"><ShoppingCart className="h-4 w-4" /> {saving ? 'Đang tạo đơn...' : 'Tạo đơn hàng'}</button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}
