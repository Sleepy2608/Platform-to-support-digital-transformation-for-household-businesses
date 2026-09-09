'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes, CheckCircle2, ChevronLeft, ChevronRight,
  PackageX, RefreshCw, Search, Warehouse, Scale,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { isOwner } from '../lib/roles';
import {
  calculateCurrentStockStatistics,
  filterAndSortCurrentStock,
  paginateCurrentStock,
  type CurrentStockListItem,
  type CurrentStockSort,
} from '../lib/currentStockViewModel';
import {
  InventoryAdjustmentModal,
  type SelectedProductInfo,
} from './InventoryAdjustmentModal';

const quantityFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });

function formatQuantity(value: number) {
  return quantityFormatter.format(value);
}

function formatUpdatedAt(value: string | null) {
  if (!value) return 'Chưa phát sinh';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

interface CurrentStockBalanceDashboardProps {
  readOnly?: boolean;
  hideHeader?: boolean;
}

export default function CurrentStockBalanceDashboard({
  readOnly = false,
  hideHeader = false,
}: CurrentStockBalanceDashboardProps) {
  const [items, setItems] = useState<CurrentStockListItem[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CurrentStockSort>('NAME');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Adjustment Modal state
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<SelectedProductInfo | null>(null);

  // Check role: only owner can adjust stock if not readOnly
  const [isOwnerUser, setIsOwnerUser] = useState(false);
  useEffect(() => {
    setIsOwnerUser(isOwner());
  }, []);

  const canAdjust = !readOnly && isOwnerUser;

  const loadBalances = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const data = await apiClient.get<CurrentStockListItem[]>('/api/inventory/balances');
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error
        ? loadError.message
        : 'Không thể tải dữ liệu tồn kho hiện tại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadBalances(), 0);
    const refreshTimer = window.setInterval(() => void loadBalances(true), 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refreshTimer);
    };
  }, [loadBalances]);

  useEffect(() => {
    const refresh = () => void loadBalances(true);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('product-updated', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('product-updated', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadBalances]);

  const statistics = useMemo(() => calculateCurrentStockStatistics(items), [items]);
  const filteredItems = useMemo(
    () => filterAndSortCurrentStock(items, query, sort),
    [items, query, sort],
  );
  const pageData = useMemo(
    () => paginateCurrentStock(filteredItems, page, 12),
    [filteredItems, page],
  );

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <Warehouse className="h-4 w-4" /> Kho hàng
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Tồn kho hiện tại</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Theo dõi số lượng thực tế của từng sản phẩm theo đơn vị cơ sở.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canAdjust && (
              <button
                type="button"
                onClick={() => {
                  setAdjustingProduct(null);
                  setAdjustmentModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition"
              >
                <Scale className="h-4 w-4" />
                Điều chỉnh tồn kho
              </button>
            )}
            <button
              type="button"
              onClick={() => void loadBalances()}
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </header>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold">{error}</span>
          <button type="button" onClick={() => void loadBalances()} className="w-fit font-bold underline">
            Thử lại
          </button>
        </div>
      )}

      <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
        <SummaryCard icon={Boxes} label="Sản phẩm đang hoạt động" value={statistics.totalProducts} />
        <SummaryCard icon={CheckCircle2} label="Còn hàng" value={statistics.inStockProducts} tone="positive" />
        <SummaryCard icon={PackageX} label="Hết hàng" value={statistics.outOfStockProducts} tone="danger" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Chi tiết tồn kho</h2>
            <p className="mt-1 text-xs text-slate-500">Chỉ hiển thị sản phẩm đang hoạt động.</p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Tìm mã, tên hoặc danh mục"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
            </label>
            <select
              value={sort}
              onChange={(event) => { setSort(event.target.value as CurrentStockSort); setPage(1); }}
              aria-label="Sắp xếp tồn kho"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-purple-600"
            >
              <option value="NAME">Tên sản phẩm</option>
              <option value="QUANTITY_ASC">Tồn ít nhất</option>
              <option value="UPDATED_DESC">Cập nhật mới nhất</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-medium text-slate-500">Đang tải dữ liệu tồn kho...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Warehouse className="h-10 w-10 text-slate-400" />
            <p className="font-bold text-slate-800">
              {query ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm đang hoạt động'}
            </p>
            <p className="text-sm text-slate-500">
              {query ? 'Thử từ khóa khác hoặc xóa bộ lọc.' : 'Dữ liệu sẽ xuất hiện sau khi hộ kinh doanh có sản phẩm.'}
            </p>
            {query && (
              <button type="button" onClick={() => setQuery('')} className="mt-2 text-sm font-bold text-purple-700 hover:underline">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Đơn vị</th>
                    <th className="px-4 py-3 text-right">Tồn hiện tại</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Cập nhật</th>
                    {canAdjust && <th className="px-4 py-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageData.items.map((item) => (
                    <tr key={item.productId} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.productCode}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{item.categoryName || 'Chưa phân loại'}</td>
                      <td className="px-4 py-4 text-slate-600">{item.baseUnitName || '—'}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-black ${item.quantityOnHand > 0 ? 'text-slate-900' : 'text-red-700'}`}>
                          {formatQuantity(item.quantityOnHand)}
                        </span>
                      </td>
                      <td className="px-4 py-4"><StockStatus quantity={item.quantityOnHand} /></td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatUpdatedAt(item.updatedAt)}</td>
                      {canAdjust && (
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingProduct({
                                id: item.productId,
                                productCode: item.productCode,
                                productName: item.productName,
                                baseUnitName: item.baseUnitName,
                                baseUnitId: item.baseUnitId,
                                quantityOnHand: item.quantityOnHand,
                              });
                              setAdjustmentModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                          >
                            <Scale className="h-3.5 w-3.5" />
                            Điều chỉnh
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {pageData.items.map((item) => (
                <article key={item.productId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">{item.productName}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.productCode} · {item.categoryName || 'Chưa phân loại'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${item.quantityOnHand > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {item.quantityOnHand > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tồn hiện tại</p>
                      <p className={`mt-1 text-xl font-black ${item.quantityOnHand > 0 ? 'text-slate-950' : 'text-red-700'}`}>
                        {formatQuantity(item.quantityOnHand)} <span className="text-sm font-semibold text-slate-500">{item.baseUnitName || ''}</span>
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {formatUpdatedAt(item.updatedAt)}
                      </p>
                      {canAdjust && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingProduct({
                              id: item.productId,
                              productCode: item.productCode,
                              productName: item.productName,
                              baseUnitName: item.baseUnitName,
                              baseUnitId: item.baseUnitId,
                              quantityOnHand: item.quantityOnHand,
                            });
                            setAdjustmentModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700"
                        >
                          <Scale className="h-3 w-3" />
                          Điều chỉnh
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {pageData.pageCount > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-500">
                  Hiển thị <span className="font-bold text-slate-800">{pageData.from}–{pageData.to}</span> trong {pageData.totalItems} sản phẩm
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Trang trước" disabled={pageData.page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="min-w-20 text-center text-xs font-bold text-slate-600">Trang {pageData.page}/{pageData.pageCount}</span>
                  <button type="button" aria-label="Trang sau" disabled={pageData.page === pageData.pageCount} onClick={() => setPage((current) => Math.min(pageData.pageCount, current + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Stock Adjustment Modal */}
      <InventoryAdjustmentModal
        isOpen={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        initialProduct={adjustingProduct}
        onSuccess={() => void loadBalances(true)}
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone = 'neutral' }: { icon: typeof Boxes; label: string; value: number; tone?: 'neutral' | 'positive' | 'danger' }) {
  const iconTone = tone === 'positive'
    ? 'bg-emerald-50 text-emerald-700'
    : tone === 'danger'
      ? 'bg-red-50 text-red-700'
      : 'bg-slate-100 text-slate-700';
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-lg p-2.5 ${iconTone}`}><Icon className="h-5 w-5" /></div>
        <p className="truncate text-xl font-black text-slate-950 sm:text-2xl">{value}</p>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500 sm:text-sm">{label}</p>
    </div>
  );
}

function StockStatus({ quantity }: { quantity: number }) {
  return quantity > 0
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Còn hàng</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Hết hàng</span>;
}
