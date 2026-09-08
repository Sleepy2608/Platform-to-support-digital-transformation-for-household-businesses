'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Package,
  Layers,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface RevenueSummary {
  totalRevenue: number;
  totalQuantity: number;
  totalOrders: number;
  totalItems: number;
}

interface RevenueLedgerItem {
  id: number;
  salesOrderId: number;
  salesOrderItemId: number;
  orderCode: string;
  confirmedAt: string;
  customerId: number | null;
  customerName: string | null;
  productId: number;
  productName: string;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  orderTotalAmount: number;
  status: string;
}

interface RevenuePageResponse {
  items: RevenueLedgerItem[];
  summary: RevenueSummary;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface ProductOption {
  id: number;
  productName: string;
  productCode: string;
}

export default function RevenueLedgerView({ role }: { role: 'owner' | 'employee' }) {
  const [data, setData] = useState<RevenuePageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [productId, setProductId] = useState<string>('');
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Fetch product list for filter dropdown
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await apiClient.get<ProductOption[]>('/api/products');
        if (Array.isArray(res)) {
          setProducts(res);
        }
      } catch {
        // Silently ignore product list load error if user lacks permission
      }
    }
    void loadProducts();
  }, []);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      page: String(page),
      size: '15',
    });
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (productId) params.set('productId', productId);

    try {
      const res = await apiClient.get<RevenuePageResponse>(`/api/revenue-ledger?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải sổ chi tiết doanh thu');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, keyword, productId, page]);

  useEffect(() => {
    const timer = setTimeout(() => void loadLedger(), 300);
    return () => clearTimeout(timer);
  }, [loadLedger]);

  const setDatePreset = (preset: 'today' | 'yesterday' | '7days' | 'thisMonth' | 'all') => {
    setPage(0);
    const now = new Date();
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
      return;
    }

    if (preset === 'today') {
      const todayStr = formatDateStr(now);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const str = formatDateStr(yesterday);
      setFromDate(str);
      setToDate(str);
    } else if (preset === '7days') {
      const ago7 = new Date(now);
      ago7.setDate(ago7.getDate() - 6);
      setFromDate(formatDateStr(ago7));
      setToDate(formatDateStr(now));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(now));
    }
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setKeyword('');
    setProductId('');
    setPage(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sổ chi tiết doanh thu</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Tự động tổng hợp và đối soát chi tiết doanh thu theo đơn hàng, sản phẩm và thời gian
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => void loadLedger()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng doanh thu</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                {data?.summary ? formatCurrency(data.summary.totalRevenue) : '0 ₫'}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100/60 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Tính trên kết quả lọc hiện tại</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng số đơn hàng</p>
              <h3 className="text-2xl font-extrabold text-blue-600 mt-1">
                {data?.summary ? data.summary.totalOrders.toLocaleString('vi-VN') : '0'}
              </h3>
            </div>
            <div className="p-3 bg-blue-100/60 text-blue-600 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Số đơn phát sinh doanh thu</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Số lượng sản phẩm</p>
              <h3 className="text-2xl font-extrabold text-purple-600 mt-1">
                {data?.summary ? data.summary.totalQuantity.toLocaleString('vi-VN') : '0'}
              </h3>
            </div>
            <div className="p-3 bg-purple-100/60 text-purple-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Tổng số lượng đã bán</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Số dòng chi tiết</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
                {data?.summary ? data.summary.totalItems.toLocaleString('vi-VN') : '0'}
              </h3>
            </div>
            <div className="p-3 bg-amber-100/60 text-amber-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Mặt hàng ghi sổ chi tiết</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            Bộ lọc doanh thu
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setDatePreset('today')}
              className="px-3 py-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors focus:bg-white focus:shadow-sm"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('yesterday')}
              className="px-3 py-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors focus:bg-white focus:shadow-sm"
            >
              Hôm qua
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('7days')}
              className="px-3 py-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors focus:bg-white focus:shadow-sm"
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('thisMonth')}
              className="px-3 py-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors focus:bg-white focus:shadow-sm"
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('all')}
              className="px-3 py-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors focus:bg-white focus:shadow-sm"
            >
              Tất cả
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search keyword */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Mã đơn / Tên khách hàng..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* From Date */}
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
            />
          </div>

          {/* Product Selector */}
          <div className="flex items-center gap-2">
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 bg-white"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} ({p.productCode})
                </option>
              ))}
            </select>

            {(fromDate || toDate || keyword || productId) && (
              <button
                type="button"
                onClick={clearFilters}
                title="Xóa bộ lọc"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Detailed Revenue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Ngày bán</th>
                <th className="px-4 py-3.5">Mã đơn hàng</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Sản phẩm</th>
                <th className="px-4 py-3.5 text-right">Số lượng</th>
                <th className="px-4 py-3.5 text-right">Đơn giá</th>
                <th className="px-4 py-3.5 text-right">Thành tiền</th>
                <th className="px-4 py-3.5 text-right">Tổng tiền đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (!data || data.items.length === 0) ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                      Đang tải dữ liệu sổ chi tiết doanh thu...
                    </div>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    Chưa có dữ liệu doanh thu phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {formatDateTime(item.confirmedAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {item.orderCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-800">
                      {item.customerName || 'Khách lẻ'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{item.productName}</div>
                      <div className="text-xs text-slate-400">ĐVT: {item.unitName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-700 whitespace-nowrap">
                      {item.quantity.toLocaleString('vi-VN')} {item.unitName}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(item.lineTotal)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-700 whitespace-nowrap">
                      {formatCurrency(item.orderTotalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 bg-slate-50/50 border-t border-slate-200/80 text-sm text-slate-500">
            <div>
              Hiển thị <span className="font-semibold text-slate-700">{data.items.length}</span> /{' '}
              <span className="font-semibold text-slate-700">{data.totalElements}</span> dòng doanh thu
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={data.first || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>

              <span className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700">
                {data.page + 1} / {data.totalPages}
              </span>

              <button
                type="button"
                disabled={data.last || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
