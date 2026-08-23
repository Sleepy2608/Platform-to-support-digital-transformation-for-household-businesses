'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Search, X } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface SalesOrderSummary {
  id: number;
  orderCode: string;
  source: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  createdAt: string;
}

interface SalesOrderItem {
  id: number;
  productId: number;
  productName: string;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  pricingRuleName: string;
}

interface SalesOrderDetail extends SalesOrderSummary {
  customerId?: number;
  note?: string;
  items: SalesOrderItem[];
}

export default function SalesOrderHistoryPage() {
  const [orders, setOrders] = useState<PageResponse<SalesOrderSummary> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<SalesOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), size: '15' });
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (status) params.set('status', status);
    if (source) params.set('source', source);
    try {
      setOrders(await apiClient.get<PageResponse<SalesOrderSummary>>(`/api/sales-orders?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [keyword, page, source, status]);

  useEffect(() => {
    const timer = setTimeout(() => void loadOrders(), 250);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const openDetail = async (orderId: number) => {
    setDetailLoading(true);
    setError('');
    try {
      setDetail(await apiClient.get<SalesOrderDetail>(`/api/sales-orders/${orderId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Bán hàng</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Danh sách đơn hàng</h1>
            <p className="mt-2 text-sm text-slate-500">Tra cứu các đơn đã tạo và xem lại giá được lưu tại thời điểm bán.</p>
          </div>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_190px_190px_auto]">
            <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(0); }} placeholder="Tìm theo mã đơn hàng..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500" /></label>
            <select value={source} onChange={(event) => { setSource(event.target.value); setPage(0); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"><option value="">Tất cả nguồn đơn</option><option value="POS">Bán tại quầy</option><option value="ONLINE">Đơn trực tuyến</option></select>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"><option value="">Tất cả trạng thái</option><option value="DRAFT">Nháp</option><option value="CONFIRMED">Đã xác nhận</option><option value="CANCELLED">Đã hủy</option></select>
            <button onClick={() => void loadOrders()} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50" title="Tải lại"><RefreshCw className="h-4 w-4" /></button>
          </div>

          {loading ? <div className="flex h-64 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải đơn hàng...</div> : !orders?.content.length ? <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400"><p className="font-semibold">Chưa có đơn hàng phù hợp</p></div> : (
            <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-3">Mã đơn</th><th className="px-5 py-3">Ngày tạo</th><th className="px-5 py-3">Nguồn đơn</th><th className="px-5 py-3">Tổng tiền</th><th className="px-5 py-3">Đã trả</th><th className="px-5 py-3">Còn nợ</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Chi tiết</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.content.map((order) => <tr key={order.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-black text-slate-900">{order.orderCode}</td><td className="px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td><td className="px-5 py-4 text-slate-600">{sourceLabel(order.source)}</td><td className="px-5 py-4 font-bold">{formatVnd(order.totalAmount)}</td><td className="px-5 py-4 text-emerald-700">{formatVnd(order.paidAmount)}</td><td className="px-5 py-4 font-semibold text-amber-700">{formatVnd(order.debtAmount)}</td><td className="px-5 py-4"><OrderStatus status={order.status} /></td><td className="px-5 py-4 text-right"><button disabled={detailLoading} onClick={() => void openDetail(order.id)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title="Xem chi tiết"><Eye className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
          )}

          {orders && orders.totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500"><span>{orders.totalElements} đơn hàng</span><div className="flex items-center gap-2"><button disabled={orders.first} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-lg border p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span>Trang {orders.page + 1}/{orders.totalPages}</span><button disabled={orders.last} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </section>
      </div>

      {detail && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><div><h2 className="text-lg font-black text-slate-950">Đơn hàng {detail.orderCode}</h2><p className="mt-1 text-xs text-slate-400">{formatDateTime(detail.createdAt)} · {sourceLabel(detail.source)}</p></div><button onClick={() => setDetail(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="space-y-5 p-6"><div className="grid gap-3 sm:grid-cols-4"><Summary label="Tổng tiền" value={formatVnd(detail.totalAmount)} /><Summary label="Đã trả" value={formatVnd(detail.paidAmount)} /><Summary label="Còn nợ" value={formatVnd(detail.debtAmount)} /><Summary label="Trạng thái" value={statusLabel(detail.status)} /></div><div className="overflow-hidden rounded-xl border border-slate-200"><table className="w-full table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">Đơn vị</th><th className="px-4 py-3">Số lượng</th><th className="px-4 py-3">Đơn giá</th><th className="px-4 py-3 text-right">Thành tiền</th></tr></thead><tbody className="divide-y divide-slate-100">{detail.items.map((item) => <tr key={item.id}><td className="break-words px-4 py-4 font-bold text-slate-900">{item.productName}</td><td className="px-4 py-4 text-slate-600">{item.unitName}</td><td className="px-4 py-4">{formatNumber(item.quantity)}</td><td className="px-4 py-4">{formatVnd(item.unitPrice)}</td><td className="px-4 py-4 text-right font-black">{formatVnd(item.lineTotal)}</td></tr>)}</tbody></table></div>{detail.note && <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><strong>Ghi chú:</strong> {detail.note}</div>}</div></div></div>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-2 font-black text-slate-900">{value}</p></div>;
}

function OrderStatus({ status }: { status: string }) {
  const className = status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>{statusLabel(status)}</span>;
}

function statusLabel(status: string) {
  if (status === 'CONFIRMED') return 'Đã xác nhận';
  if (status === 'CANCELLED') return 'Đã hủy';
  return 'Nháp';
}

function sourceLabel(source: string) {
  return source === 'ONLINE' ? 'Đơn trực tuyến' : 'Bán tại quầy';
}

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
