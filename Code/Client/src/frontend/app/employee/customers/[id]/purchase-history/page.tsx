'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, RefreshCw, Search, ChevronLeft, ChevronRight,
  TrendingUp, AlertTriangle, CalendarDays, X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/app/lib/apiClient';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface CustomerOption {
  id: number;
  customerCode: string;
  customerName: string;
  phone: string | null;
}

interface PurchaseSummary {
  totalPurchasedAmount: number;
  totalDebtAmount: number;
}

interface PurchaseHistoryItem {
  orderId: number;
  orderCode: string;
  createdAt: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: string;
}

interface PageResponse {
  content: PurchaseHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmt = (v: number) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;
const fmtDate = (v: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(v));

function PaymentBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PARTIALLY_PAID: { label: 'Trả một phần', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    UNPAID: { label: 'Chưa thanh toán', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function EmployeePurchaseHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [history, setHistory] = useState<PageResponse | null>(null);

  const [keyword, setKeyword] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);

  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');

  /* Load customer info via options search */
  useEffect(() => {
    const load = async () => {
      setLoadingCustomer(true);
      try {
        const [opts, sum] = await Promise.all([
          apiClient.get<CustomerOption[]>(`/api/customers/options?limit=50`),
          apiClient.get<PurchaseSummary>(`/api/customers/${customerId}/purchase-summary`),
        ]);
        const found = opts.find((c) => c.id === customerId) ?? null;
        setCustomer(found);
        setSummary(sum);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin khách hàng');
      } finally {
        setLoadingCustomer(false);
      }
    };
    void load();
  }, [customerId]);

  /* Load purchase history */
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (paymentStatus) params.set('paymentStatus', paymentStatus);
      if (startDate) params.set('startDate', `${startDate}T00:00:00`);
      if (endDate) params.set('endDate', `${endDate}T23:59:59`);
      setHistory(await apiClient.get<PageResponse>(`/api/customers/${customerId}/purchase-history?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử giao dịch');
    } finally {
      setLoadingHistory(false);
    }
  }, [customerId, keyword, paymentStatus, startDate, endDate, page]);

  useEffect(() => {
    const timer = setTimeout(() => void loadHistory(), 300);
    return () => clearTimeout(timer);
  }, [loadHistory]);

  const resetFilters = () => {
    setKeyword('');
    setPaymentStatus('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const hasFilters = keyword || paymentStatus || startDate || endDate;

  if (loadingCustomer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-slate-900" />
          <span className="text-sm text-slate-500">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Back link */}
        <Link
          href="/employee/customers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách khách hàng
        </Link>

        {/* Header */}
        <header className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Lịch sử giao dịch</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {customer ? customer.customerName : `Khách hàng #${customerId}`}
          </h1>
          {customer && (
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Mã: <strong className="text-slate-700">{customer.customerCode}</strong></span>
              {customer.phone && <span>SĐT: <strong className="text-slate-700">{customer.phone}</strong></span>}
            </div>
          )}
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng tiền mua hàng</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{fmt(summary.totalPurchasedAmount)}</p>
              </div>
            </div>
            <div className={`flex items-center gap-4 rounded-2xl border p-5 shadow-sm ${summary.totalDebtAmount > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${summary.totalDebtAmount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide ${summary.totalDebtAmount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Tổng công nợ</p>
                <p className={`mt-1 text-2xl font-black ${summary.totalDebtAmount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                  {fmt(summary.totalDebtAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Bộ lọc & Tìm kiếm</span>
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors">
                <X className="h-3.5 w-3.5" /> Xóa lọc
              </button>
            )}
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                placeholder="Tìm mã đơn hàng..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500 transition-colors"
              />
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 transition-colors"
            >
              <option value="">Tất cả trạng thái TT</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PARTIALLY_PAID">Trả một phần</option>
              <option value="PAID">Đã thanh toán</option>
            </select>
            <label className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500 transition-colors"
              />
            </label>
            <label className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500 transition-colors"
              />
            </label>
          </div>
        </section>

        {/* History Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Danh sách giao dịch</span>
            <button
              onClick={() => void loadHistory()}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors"
              title="Tải lại"
            >
              <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải giao dịch...
            </div>
          ) : !history?.content.length ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <p className="font-semibold">{hasFilters ? 'Không có giao dịch phù hợp với bộ lọc' : 'Khách hàng chưa có giao dịch nào'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[750px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-5 py-3">Ngày giao dịch</th>
                    <th className="px-5 py-3 text-right">Tổng tiền</th>
                    <th className="px-5 py-3 text-right">Đã trả</th>
                    <th className="px-5 py-3 text-right">Còn nợ</th>
                    <th className="px-5 py-3">Trạng thái TT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.content.map((item) => (
                    <tr key={item.orderId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-black text-slate-900">{item.orderCode}</td>
                      <td className="px-5 py-4 text-slate-500">{fmtDate(item.createdAt)}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800">{fmt(item.totalAmount)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-emerald-700">{fmt(item.paidAmount)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-amber-700">{fmt(item.debtAmount)}</td>
                      <td className="px-5 py-4"><PaymentBadge status={item.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {history && history.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
              <span>{history.totalElements} giao dịch</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={history.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border p-2 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold">Trang {history.page + 1}/{history.totalPages}</span>
                <button
                  disabled={history.last}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border p-2 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
