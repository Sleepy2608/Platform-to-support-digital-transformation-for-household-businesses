'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownLeft, RotateCcw, AlertCircle, FileText, Calendar
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import {
  InventoryTransactionItem,
  formatCurrency,
  formatQuantity,
  formatDateTime,
  getTransactionTypeBadge,
} from '../lib/inventoryBookkeepingViewModel';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface InventoryTransactionsViewProps {
  initialProductId?: number;
}

export function InventoryTransactionsView({ initialProductId }: InventoryTransactionsViewProps) {
  // Filters
  const [productId, setProductId] = useState<string>(initialProductId ? String(initialProductId) : '');
  const [transactionType, setTransactionType] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  // Data state
  const [transactions, setTransactions] = useState<InventoryTransactionItem[]>([]);
  const [pageMeta, setPageMeta] = useState<{ totalElements: number; totalPages: number }>({
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch transactions from API
  const fetchTransactions = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('size', String(pageSize));

      if (productId.trim()) params.set('productId', productId.trim());
      if (transactionType.trim()) params.set('transactionType', transactionType.trim());
      if (fromDate.trim()) params.set('from', fromDate.trim());
      if (toDate.trim()) params.set('to', toDate.trim());

      const res = await apiClient.get<PageResponse<InventoryTransactionItem>>(
        `/api/inventory/transactions?${params.toString()}`
      );

      if (res && Array.isArray(res.content)) {
        setTransactions(res.content);
        setPageMeta({
          totalElements: res.totalElements ?? res.content.length,
          totalPages: res.totalPages ?? 1,
        });
      } else {
        setTransactions([]);
        setPageMeta({ totalElements: 0, totalPages: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử biến động kho.');
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, productId, transactionType, fromDate, toDate]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  // Quick date presets
  const handlePresetDate = (days: number | 'thisMonth') => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    let startStr = '';

    if (days === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = firstDay.toISOString().split('T')[0];
    } else {
      const past = new Date();
      past.setDate(today.getDate() - days);
      startStr = past.toISOString().split('T')[0];
    }

    setFromDate(startStr);
    setToDate(endStr);
    setPage(0);
  };

  const handleResetFilters = () => {
    setProductId('');
    setTransactionType('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Bộ lọc giao dịch kho
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handlePresetDate(0)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate(7)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate('thisMonth')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Tháng này
              </button>
              {(productId || transactionType || fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter: Product ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mã ID sản phẩm</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => { setProductId(e.target.value); setPage(0); }}
                  placeholder="Nhập ID sản phẩm..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Filter: Transaction Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Loại biến động</label>
              <select
                value={transactionType}
                onChange={(e) => { setTransactionType(e.target.value); setPage(0); }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-purple-600"
              >
                <option value="">Tất cả loại giao dịch</option>
                <option value="STOCK_IN">Nhập kho (STOCK_IN)</option>
                <option value="STOCK_OUT">Xuất kho bán (STOCK_OUT)</option>
                <option value="CANCEL_SALE">Hoàn kho do hủy đơn (CANCEL_SALE)</option>
                <option value="ADJUSTMENT">Điều chỉnh kiểm kê (ADJUSTMENT)</option>
              </select>
            </div>

            {/* Filter: From Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-purple-600"
              />
            </div>

            {/* Filter: To Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Đến ngày</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Danh sách biến động kho</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tổng số <strong className="text-slate-800">{pageMeta.totalElements}</strong> lượt biến động ghi nhận
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchTransactions(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="m-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void fetchTransactions()}
              className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-800 hover:bg-red-200 transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : transactions.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <History className="h-7 w-7" />
            </div>
            <h4 className="mt-4 text-base font-bold text-slate-900">Không có biến động kho nào</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại. Thử thay đổi khoảng ngày hoặc xóa bộ lọc.
            </p>
            {(productId || transactionType || fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Thời gian</th>
                    <th className="px-4 py-3">Chứng từ gốc</th>
                    <th className="px-4 py-3">Loại GD</th>
                    <th className="px-5 py-3">Sản phẩm</th>
                    <th className="px-4 py-3 text-right">Tồn trước</th>
                    <th className="px-4 py-3 text-right">Biến động</th>
                    <th className="px-4 py-3 text-right">Tồn sau</th>
                    <th className="px-4 py-3 text-right">Đơn giá vốn</th>
                    <th className="px-4 py-3 text-right">Giá trị GD</th>
                    <th className="px-5 py-3">Lý do / Diễn giải</th>
                    <th className="px-4 py-3">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const badge = getTransactionTypeBadge(tx.transactionType);
                    const isPositive = tx.quantityChange > 0;
                    const isNegative = tx.quantityChange < 0;

                    return (
                      <tr key={tx.transactionId} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800">
                            <FileText className="h-3 w-3 text-slate-400" />
                            {tx.referenceCode || `${tx.referenceType}-${tx.referenceId}`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.colorClass}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900 line-clamp-1">{tx.productName}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{tx.productCode}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                          {formatQuantity(tx.quantityBefore)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className={`font-black ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-600'}`}>
                            {isPositive ? `+${formatQuantity(tx.quantityChange)}` : formatQuantity(tx.quantityChange)}
                          </span>
                          <span className="ml-1 text-[11px] text-slate-400">{tx.unitName}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatQuantity(tx.quantityAfter)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-slate-600 whitespace-nowrap">
                          {formatCurrency(tx.unitCost)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs font-bold text-slate-800 whitespace-nowrap">
                          {formatCurrency(tx.transactionValue)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate" title={tx.note}>
                          {tx.note || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                          {tx.createdByName || 'Hệ thống'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pageMeta.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-xs font-semibold text-slate-600 bg-slate-50/50">
                <p>
                  Hiển thị trang <strong>{page + 1}</strong> trên tổng số <strong>{pageMeta.totalPages}</strong> trang ({pageMeta.totalElements} bản ghi)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Trước
                  </button>
                  <span className="px-2">
                    {page + 1} / {pageMeta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pageMeta.totalPages - 1}
                    onClick={() => setPage((p) => Math.min(pageMeta.totalPages - 1, p + 1))}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    Sau
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
