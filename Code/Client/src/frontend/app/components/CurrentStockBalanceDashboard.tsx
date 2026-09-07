'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes, CheckCircle2, ChevronLeft, ChevronRight,
  PackageX, RefreshCw, Search, Warehouse, X,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import {
  calculateCurrentStockStatistics,
  filterAndSortCurrentStock,
  paginateCurrentStock,
  type CurrentStockListItem,
  type CurrentStockSort,
} from '../lib/currentStockViewModel';

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

export default function CurrentStockBalanceDashboard() {
  const [items, setItems] = useState<CurrentStockListItem[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CurrentStockSort>('NAME');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
    () => paginateCurrentStock(filteredItems, page, 10),
    [filteredItems, page],
  );

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">KHO HÀNG</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Tồn kho hiện tại</h1>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi số lượng thực tế của từng sản phẩm theo đơn vị cơ sở.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBalances()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => void loadBalances()} className="font-bold underline cursor-pointer">
              Thử lại
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="text-3xl font-black text-slate-950">{statistics.totalProducts}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Sản phẩm đang hoạt động</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-3xl font-black text-emerald-700">{statistics.inStockProducts}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Còn hàng</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                <PackageX className="h-5 w-5" />
              </div>
              <span className="text-3xl font-black text-rose-600">{statistics.outOfStockProducts}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Hết hàng</p>
          </div>
        </section>

        {/* Search & Sort Filter */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Tìm mã, tên hoặc danh mục..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setPage(1); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(event) => { setSort(event.target.value as CurrentStockSort); setPage(1); }}
                aria-label="Sắp xếp tồn kho"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white cursor-pointer"
              >
                <option value="NAME">Tên sản phẩm (A-Z)</option>
                <option value="QUANTITY_ASC">Tồn ít nhất</option>
                <option value="UPDATED_DESC">Cập nhật mới nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải dữ liệu tồn kho...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Warehouse className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-bold text-slate-800">
                {query ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm đang hoạt động'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {query ? 'Thử từ khóa khác hoặc xóa bộ lọc.' : 'Dữ liệu sẽ xuất hiện sau khi hộ kinh doanh có sản phẩm.'}
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-3 inline-flex items-center rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5">Sản phẩm</th>
                      <th className="px-5 py-3.5">Danh mục</th>
                      <th className="px-5 py-3.5">Đơn vị</th>
                      <th className="px-5 py-3.5 text-right">Tồn hiện tại</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pageData.items.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="mt-0.5 font-mono text-xs font-semibold text-slate-400">{item.productCode}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {item.categoryName ? (
                            <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {item.categoryName}
                            </span>
                          ) : (
                            <span className="text-slate-400">Chưa phân loại</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">{item.baseUnitName || '—'}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`font-black text-base ${item.quantityOnHand > 0 ? 'text-slate-950' : 'text-rose-600'}`}>
                            {formatQuantity(item.quantityOnHand)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5"><StockStatus quantity={item.quantityOnHand} /></td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{formatUpdatedAt(item.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="grid gap-3 p-4 md:hidden">
                {pageData.items.map((item) => (
                  <article key={item.productId} className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">{item.productName}</p>
                        <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">{item.productCode} · {item.categoryName || 'Chưa phân loại'}</p>
                      </div>
                      <StockStatus quantity={item.quantityOnHand} />
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tồn hiện tại</p>
                        <p className={`mt-0.5 text-xl font-black ${item.quantityOnHand > 0 ? 'text-slate-950' : 'text-rose-600'}`}>
                          {formatQuantity(item.quantityOnHand)} <span className="text-xs font-semibold text-slate-500">{item.baseUnitName || ''}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cập nhật</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-600">{formatUpdatedAt(item.updatedAt)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pageData.pageCount > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50/40">
                  <p className="text-xs text-slate-500 font-medium">
                    Hiển thị <span className="font-bold text-slate-800">{pageData.from}–{pageData.to}</span> trong tổng số <span className="font-bold text-slate-800">{pageData.totalItems}</span> sản phẩm
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Trang trước"
                      disabled={pageData.page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-16 text-center text-xs font-bold text-slate-600">
                      Trang {pageData.page} / {pageData.pageCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Trang sau"
                      disabled={pageData.page === pageData.pageCount}
                      onClick={() => setPage((current) => Math.min(pageData.pageCount, current + 1))}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StockStatus({ quantity }: { quantity: number }) {
  return quantity > 0 ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Còn hàng
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      Hết hàng
    </span>
  );
}

