'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Check, CheckCircle2, Clock, Loader2, Package, X,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface StockImportItem {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  unitId: number;
  unitName: string;
  quantity: number;
  conversionRate: number;
  baseQuantity: number;
  purchasePrice: number;
  lineTotal: number;
}

interface StockImportDetail {
  id: number;
  importCode: string;
  importDate: string;
  status: string;
  totalAmount: number;
  note: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  items: StockImportItem[];
}

export default function StockImportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const importId = params.id as string;
  const [data, setData] = useState<StockImportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.get<StockImportDetail>(`/api/stock-imports/${importId}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải phiếu nhập kho');
    } finally {
      setLoading(false);
    }
  }, [importId]);

  useEffect(() => { void load(); }, [load]);

  const handleConfirm = async () => {
    if (!data || data.status !== 'DRAFT') return;
    setConfirming(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.post(`/api/stock-imports/${importId}/confirm`);
      setSuccess('Xác nhận nhập kho thành công! Tồn kho đã được cập nhật.');
      setData((d) => d ? { ...d, status: 'CONFIRMED' } : d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setConfirming(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
  const fmtQty = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
  const fmtDate = (s: string) => {
    if (!s) return '—';
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const isDraft = data?.status === 'DRAFT';

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link href="/owner/products/stock-import"
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">KHO HÀNG</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              {data ? `Phiếu ${data.importCode}` : 'Chi tiết phiếu nhập kho'}
            </h1>
          </div>
          {isDraft && (
            <button onClick={handleConfirm} disabled={confirming}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50 shadow-sm">
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Xác nhận nhập kho
            </button>
          )}
        </header>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <X className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
          </div>
        ) : data ? (
          <>
            {/* Info Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-bold text-slate-400">Mã phiếu</p>
                  <p className="mt-1 font-mono font-bold text-slate-900">{data.importCode}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Ngày nhập</p>
                  <p className="mt-1 text-sm text-slate-700">{fmtDate(data.importDate || data.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Trạng thái</p>
                  <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isDraft ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isDraft ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {isDraft ? 'Nháp' : 'Đã nhập kho'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Người tạo</p>
                  <p className="mt-1 text-sm text-slate-700">{data.createdByName}</p>
                </div>
              </div>
              {data.note && (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold text-slate-400 mb-1">Ghi chú</p>
                  <p className="text-sm text-slate-600">{data.note}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Sản phẩm</th>
                    <th className="px-5 py-3">ĐVT</th>
                    <th className="px-5 py-3 text-right">Số lượng</th>
                    <th className="px-5 py-3 text-right">Quy đổi (gốc)</th>
                    <th className="px-5 py-3 text-right">Giá nhập</th>
                    <th className="px-5 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-400 font-mono">{item.productCode}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{item.unitName}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{fmtQty(item.quantity)}</td>
                      <td className="px-5 py-3 text-right text-slate-500">{fmtQty(item.baseQuantity)}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{fmt(item.purchasePrice)} đ</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{fmt(item.lineTotal)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/40 px-5 py-4">
                <p className="text-sm text-slate-500">
                  <span className="font-bold text-slate-700">{data.items.length}</span> sản phẩm
                </p>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Tổng tiền nhập</p>
                  <p className="text-xl font-black text-slate-950">{fmt(data.totalAmount)} đ</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
