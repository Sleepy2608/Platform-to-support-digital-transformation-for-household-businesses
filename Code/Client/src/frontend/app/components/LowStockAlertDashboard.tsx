'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BellRing, CheckCircle2, PackageOpen,
  ChevronLeft, ChevronRight, RefreshCw, Save, Search, ShieldCheck, Warehouse,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import {
  calculateLowStockStatistics,
  filterAndSortAlerts,
  paginate,
  shortageAmount,
  stockSeverity,
  validateMinimumStock,
  type LowStockSort,
} from '../lib/lowStockViewModel';

type AlertStatus = 'ACTIVE' | 'RESOLVED';

interface LowStockAlert {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  quantityOnHand: number;
  minimumStock: number;
  status: AlertStatus;
  needsRestock: boolean;
  triggeredAt: string | null;
  lastDetectedAt: string | null;
  resolvedAt: string | null;
}

interface StockThreshold {
  productId: number;
  productCode: string;
  productName: string;
  quantityOnHand: number;
  minimumStock: number | null;
  configured: boolean;
  lowStock: boolean;
}

interface NotificationEvent {
  id: number;
  type: string;
  title: string;
  content: string;
}

function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
}

export default function LowStockAlertDashboard({ canConfigure }: { canConfigure: boolean }) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [thresholds, setThresholds] = useState<StockThreshold[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LowStockSort>('URGENCY');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [liveNotification, setLiveNotification] = useState<NotificationEvent | null>(null);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const [alertData, thresholdData] = await Promise.all([
        apiClient.get<LowStockAlert[]>('/api/inventory/low-stock/alerts'),
        canConfigure
          ? apiClient.get<StockThreshold[]>('/api/inventory/low-stock/thresholds')
          : Promise.resolve([]),
      ]);
      setAlerts(alertData);
      setThresholds(thresholdData);
      setDrafts((current) => {
        const next = { ...current };
        thresholdData.forEach((item) => {
          if (next[item.productId] === undefined) {
            next[item.productId] = item.minimumStock === null ? '' : String(item.minimumStock);
          }
        });
        return next;
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể tải cảnh báo tồn kho',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canConfigure]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadData(), 0);
    const timer = window.setInterval(() => void loadData(true), 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadData]);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const notification = (event as CustomEvent<NotificationEvent>).detail;
      if (!notification) return;
      setLiveNotification(notification);
      void loadData(true);
    };
    window.addEventListener('hbdt-notification', handleNotification);
    return () => window.removeEventListener('hbdt-notification', handleNotification);
  }, [loadData]);

  useEffect(() => {
    if (!message && !liveNotification) return;
    const timer = window.setTimeout(() => {
      setMessage(null);
      setLiveNotification(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [message, liveNotification]);

  const statistics = useMemo(
    () => calculateLowStockStatistics(alerts, thresholds),
    [alerts, thresholds],
  );
  const filteredAlerts = useMemo(
    () => filterAndSortAlerts(alerts, query, sort),
    [alerts, query, sort],
  );
  const alertPage = useMemo(
    () => paginate(filteredAlerts, page, 9),
    [filteredAlerts, page],
  );

  const saveThreshold = async (productId: number) => {
    const raw = drafts[productId]?.trim();
    const validation = validateMinimumStock(raw || '');
    if (!validation.valid || validation.value === null) {
      setMessage({ type: 'error', text: validation.message });
      return;
    }
    setSavingId(productId);
    try {
      await apiClient.put(`/api/inventory/low-stock/thresholds/${productId}`, {
        minimumStock: validation.value,
      });
      setMessage({ type: 'success', text: 'Đã cập nhật ngưỡng tồn kho.' });
      await loadData(true);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể cập nhật ngưỡng',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#ededed] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 px-5 py-6 text-slate-900 shadow-sm sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-slate-50 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
                <BellRing className="h-4 w-4" /> Quản lý kho
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Cảnh báo tồn kho thấp
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Theo dõi sản phẩm sắp hết, thiết lập ngưỡng và chủ động lên kế hoạch nhập hàng.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:shrink-0">
            {canConfigure && (
              <Link href="/owner/products" className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
                <Warehouse className="h-4 w-4" /> Đi đến nhập kho
              </Link>
            )}
            <button onClick={() => void loadData()} disabled={refreshing} className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            </div>
          </div>
        </header>

        {(message || liveNotification) && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${message?.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message?.text || `${liveNotification?.title}: ${liveNotification?.content}`}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard icon={AlertTriangle} label="Cần nhập thêm" value={statistics.activeAlerts} tone="amber" />
          <SummaryCard icon={PackageOpen} label="Sản phẩm theo dõi" value={statistics.trackedProducts} tone="blue" />
          <SummaryCard icon={ShieldCheck} label="Đã cấu hình ngưỡng" value={canConfigure ? statistics.configuredProducts : 'Theo quyền Owner'} tone="emerald" />
        </section>

        {canConfigure && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="font-bold text-slate-900">Cấu hình ngưỡng theo sản phẩm</h2>
              <p className="mt-1 text-xs text-slate-500">Cảnh báo xuất hiện khi tồn thực tế nhỏ hơn ngưỡng.</p>
            </div>
            {thresholds.length === 0 && !loading ? (
              <div className="flex flex-col items-center px-5 py-9 text-center">
                <div className="mb-3 rounded-2xl bg-blue-50 p-3 text-blue-600"><PackageOpen className="h-6 w-6" /></div>
                <p className="font-bold text-slate-900">Chưa có sản phẩm để cấu hình</p>
                <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Tạo sản phẩm trước, sau đó bạn có thể đặt mức tồn kho tối thiểu ngay tại đây.</p>
                <Link href="/owner/products" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
                  <PackageOpen className="h-4 w-4" /> Quản lý sản phẩm
                </Link>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] table-fixed text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="w-[29%] px-4 py-3 sm:px-5">Sản phẩm</th><th className="w-[15%] px-3 py-3">Tồn hiện tại</th><th className="w-[31%] px-3 py-3">Ngưỡng tối thiểu</th><th className="w-[25%] px-3 py-3">Trạng thái</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {thresholds.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 sm:px-5"><p className="truncate font-bold text-slate-900">{item.productName}</p><p className="text-xs text-slate-500">{item.productCode}</p></td>
                      <td className="px-3 py-3 font-semibold">{formatQuantity(item.quantityOnHand)}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-2"><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={15} value={drafts[item.productId] ?? ''} onChange={(event) => { const nextValue = event.target.value; if (nextValue === '' || /^\d+$/.test(nextValue)) setDrafts((current) => ({ ...current, [item.productId]: nextValue })); }} placeholder="Chưa đặt" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-700" /><button aria-label={`Lưu ngưỡng cho ${item.productName}`} title="Lưu ngưỡng" onClick={() => void saveThreshold(item.productId)} disabled={savingId === item.productId} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700 disabled:opacity-60"><Save className="h-4 w-4" /></button></div></td>
                      <td className="px-3 py-3"><StatusBadge low={item.lowStock} configured={item.configured} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Sản phẩm cần nhập thêm</h2>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row lg:w-auto">
              <label className="relative min-w-0 flex-1 lg:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm mã hoặc tên sản phẩm" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-700" /></label>
              <select value={sort} onChange={(event) => { setSort(event.target.value as LowStockSort); setPage(1); }} aria-label="Sắp xếp cảnh báo" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-slate-700">
                <option value="URGENCY">Ưu tiên thiếu nhiều</option>
                <option value="NEWEST">Mới phát hiện</option>
                <option value="NAME">Tên sản phẩm</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center"><CheckCircle2 className="h-10 w-10 text-emerald-500" /><p className="font-bold text-slate-800">{query ? 'Không tìm thấy sản phẩm phù hợp' : 'Không có sản phẩm tồn kho thấp'}</p><p className="text-sm text-slate-500">{query ? 'Thử tìm bằng mã hoặc tên sản phẩm khác.' : 'Kho hiện đang ở mức an toàn.'}</p>{query && <button type="button" onClick={() => setQuery('')} className="mt-2 text-sm font-bold text-blue-700 hover:underline">Xóa bộ lọc</button>}</div>
          ) : (
            <>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {alertPage.items.map((alert) => <AlertCard key={alert.id} alert={alert} canConfigure={canConfigure} />)}
              </div>
              {alertPage.pageCount > 1 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-slate-500">Hiển thị <span className="font-bold text-slate-800">{alertPage.from}–{alertPage.to}</span> trong {alertPage.totalItems} cảnh báo</p>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Trang trước" disabled={alertPage.page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="min-w-20 text-center text-xs font-bold text-slate-600">Trang {alertPage.page}/{alertPage.pageCount}</span>
                    <button type="button" aria-label="Trang sau" disabled={alertPage.page === alertPage.pageCount} onClick={() => setPage((current) => Math.min(alertPage.pageCount, current + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: typeof AlertTriangle; label: string; value: number | string; tone: 'amber' | 'blue' | 'emerald' }) {
  const colors = { amber: 'bg-amber-50 text-amber-700 border-amber-200', blue: 'bg-blue-50 text-blue-700 border-blue-200', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-3"><div className={`inline-flex shrink-0 rounded-xl border p-2.5 ${colors[tone]}`}><Icon className="h-5 w-5" /></div><p className="truncate text-2xl font-black text-slate-950">{value}</p></div><p className="mt-3 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">{label}</p></div>;
}

function StatusBadge({ low, configured }: { low: boolean; configured: boolean }) {
  if (!configured) return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Chưa cấu hình</span>;
  return low ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Cần nhập hàng</span> : <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">An toàn</span>;
}

function AlertCard({ alert, canConfigure }: { alert: LowStockAlert; canConfigure: boolean }) {
  const active = alert.status === 'ACTIVE';
  const severity = stockSeverity(alert);
  const severityText = severity === 'CRITICAL' ? 'Rất thấp' : severity === 'HIGH' ? 'Sắp hết' : severity === 'LOW' ? 'Dưới ngưỡng' : 'Đã xử lý';
  const severityClass = severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : severity === 'LOW' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
  return <article className={`rounded-xl border p-4 ${active ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-slate-900">{alert.productName}</p><p className="text-xs font-semibold text-slate-500">{alert.productCode}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${severityClass}`}>{severityText}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-lg bg-white p-3"><p className="text-[11px] text-slate-500">Tồn hiện tại</p><p className="mt-1 text-lg font-black text-red-700">{formatQuantity(alert.quantityOnHand)}</p></div><div className="rounded-lg bg-white p-3"><p className="text-[11px] text-slate-500">Ngưỡng</p><p className="mt-1 text-lg font-black text-slate-900">{formatQuantity(alert.minimumStock)}</p></div><div className="rounded-lg bg-white p-3"><p className="text-[11px] text-slate-500">Thiếu</p><p className="mt-1 text-lg font-black text-amber-700">{formatQuantity(shortageAmount(alert))}</p></div></div>{active && canConfigure && <Link href="/owner/products" className="mt-3 inline-flex text-xs font-bold text-blue-700 hover:underline">Nhập thêm hàng →</Link>}</article>;
}
