'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, Loader2, Minus, Package, Plus, Save, Trash2, X,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/app/lib/apiClient';
import { ProductSearchPicker, SearchProduct } from '@/app/components/ProductSearchPicker';

interface CartUnit {
  id: number;
  unitId: number;
  unitName: string;
  unitCode: string;
  conversionRate: number;
  baseUnit: boolean;
}

interface ImportItem {
  key: number;
  productId: number;
  productCode: string;
  productName: string;
  imageUrl?: string;
  unitId: number;
  units: CartUnit[];
  quantity: string;
  purchasePrice: string;
  conversionRate: number;
  error?: string;
}

interface StockImportResponse {
  id: number;
  importCode: string;
  status: string;
}

export default function StockImportCreatePage() {
  const router = useRouter();
  const nextKey = useRef(1);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const patchItem = (key: number, patch: Partial<ImportItem>) => {
    setItems((c) => c.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };

  const addProduct = async (product: SearchProduct) => {
    setError('');
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setError(`Sản phẩm "${product.productName}" đã có trong danh sách`);
      return;
    }
    try {
      const units = await apiClient.get<CartUnit[]>(`/api/products/${product.id}/units`);
      const preferred = units.find((u) => u.baseUnit) || units[0];
      if (!preferred) throw new Error('SP chưa cấu hình ĐVT');
      const key = nextKey.current++;
      setItems((c) => [...c, {
        key,
        productId: product.id,
        productCode: product.productCode,
        productName: product.productName,
        imageUrl: product.imageUrl,
        unitId: preferred.unitId,
        units,
        quantity: '1',
        purchasePrice: '',
        conversionRate: preferred.conversionRate,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm sản phẩm');
    }
  };

  const changeUnit = (key: number, unitId: number) => {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    const unit = item.units.find((u) => u.unitId === unitId);
    patchItem(key, { unitId, conversionRate: unit?.conversionRate ?? 1 });
  };

  const removeItem = (key: number) => setItems((c) => c.filter((i) => i.key !== key));

  const parseNum = (s: string) => { const n = Number(s.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; };
  const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 0 });

  const totalAmount = items.reduce((sum, i) => sum + parseNum(i.quantity) * parseNum(i.purchasePrice), 0);
  const totalItems = items.reduce((sum, i) => sum + parseNum(i.quantity), 0);

  const canSubmit = items.length > 0 && items.every((i) =>
    parseNum(i.quantity) > 0 && parseNum(i.purchasePrice) >= 0
  );

  const submit = async (confirmImmediately: boolean) => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        note: note.trim() || null,
        items: items.map((i) => ({
          productId: i.productId,
          unitId: i.unitId,
          quantity: parseNum(i.quantity),
          purchasePrice: parseNum(i.purchasePrice),
        })),
      };
      const result = await apiClient.post<StockImportResponse>('/api/stock-imports', body);

      if (confirmImmediately) {
        await apiClient.post(`/api/stock-imports/${result.id}/confirm`);
        setSuccess(`Phiếu ${result.importCode} đã tạo và xác nhận thành công! Tồn kho đã cập nhật.`);
      } else {
        setSuccess(`Phiếu ${result.importCode} đã lưu nháp. Bạn có thể xác nhận sau.`);
      }
      setTimeout(() => router.push(`/owner/products/stock-import/${result.id}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link href="/owner/products/stock-import"
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">KHO HÀNG</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Tạo phiếu nhập kho</h1>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <X className="h-4 w-4 shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto cursor-pointer"><X className="h-4 w-4" /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        {/* Product Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-700">Tìm sản phẩm để thêm vào phiếu nhập</h2>
          <ProductSearchPicker
            onSelectProduct={(p) => void addProduct(p)}
            selectedIds={items.map((i) => i.productId)}
          />
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3 w-36">Đơn vị tính</th>
                    <th className="px-4 py-3 w-28">Số lượng</th>
                    <th className="px-4 py-3 w-36">Giá nhập (đ)</th>
                    <th className="px-4 py-3 w-32 text-right">Thành tiền</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const lineTotal = parseNum(item.quantity) * parseNum(item.purchasePrice);
                    return (
                      <tr key={item.key} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                                <Package className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                              <p className="text-xs text-slate-400 font-mono">{item.productCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.unitId}
                            onChange={(e) => changeUnit(item.key, Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-slate-400"
                          >
                            {item.units.map((u) => (
                              <option key={u.unitId} value={u.unitId}>{u.unitName}{u.baseUnit ? ' (gốc)' : ''}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => patchItem(item.key, { quantity: String(Math.max(1, parseNum(item.quantity) - 1)) })}
                              className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 cursor-pointer">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input type="text" value={item.quantity}
                              onChange={(e) => patchItem(item.key, { quantity: e.target.value })}
                              className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-slate-400" />
                            <button onClick={() => patchItem(item.key, { quantity: String(parseNum(item.quantity) + 1) })}
                              className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 cursor-pointer">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" value={item.purchasePrice}
                            onChange={(e) => patchItem(item.key, { purchasePrice: e.target.value })}
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-right font-bold outline-none focus:border-slate-400" />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(lineTotal)} đ</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => removeItem(item.key)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/40 px-5 py-4">
              <div className="text-sm text-slate-500">
                <span className="font-bold text-slate-700">{items.length}</span> sản phẩm · <span className="font-bold text-slate-700">{fmt(totalItems)}</span> đơn vị
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Tổng tiền nhập</p>
                <p className="text-xl font-black text-slate-950">{fmt(totalAmount)} đ</p>
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-xs font-bold text-slate-500 mb-2">Ghi chú (tùy chọn)</label>
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="VD: Nhập hàng từ nhà cung cấp ABC..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:bg-white transition resize-none"
          />
        </div>

        {/* Actions */}
        {items.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => void submit(false)} disabled={!canSubmit || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu nháp
            </button>
            <button onClick={() => void submit(true)} disabled={!canSubmit || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50 shadow-sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Xác nhận nhập kho ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
