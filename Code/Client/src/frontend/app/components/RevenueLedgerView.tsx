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
  X,
  CalendarDays,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Warehouse,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface RevenueSummary {
  totalRevenue: number;
  totalPaid: number;
  totalDebt: number;
  totalImportCost: number;
  expectedProfit: number;
  actualProfit: number;
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
  orderPaidAmount: number;
  orderDebtAmount: number;
  orderPaymentStatus: string;
  status: string;
}

interface StockImportLedgerItem {
  id: number;
  importCode: string;
  importDate: string;
  totalAmount: number;
  createdByName: string;
  status: string;
  note?: string;
}

interface RevenuePageResponse {
  items: RevenueLedgerItem[];
  stockImports: StockImportLedgerItem[];
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

type DatePreset = 'all' | 'today' | 'yesterday' | '7days' | 'thisMonth';
type ViewMode = 'sales' | 'imports';

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
      <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200/80 shadow-2xs">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 select-none">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5 select-none">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function RevenueLedgerView({ role }: { role: 'owner' | 'employee' }) {
  const [data, setData] = useState<RevenuePageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View Mode: 'sales' (Sổ bán hàng) or 'imports' (Sổ nhập kho)
  const [viewMode, setViewMode] = useState<ViewMode>('sales');

  // Filters
  const [activePreset, setActivePreset] = useState<DatePreset>('all');
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
        // Silently ignore if not authorized
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

  const handlePresetChange = (preset: DatePreset) => {
    setActivePreset(preset);
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
    setActivePreset('all');
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
    if (!dateStr) return '—';
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

  const renderPaymentBadge = (status: string) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Đã thanh toán đủ
        </span>
      );
    } else if (status === 'PARTIALLY_PAID') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Trả góp / 1 phần
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          Chưa thanh toán
        </span>
      );
    }
  };

  const dateTabs: { id: DatePreset; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Tất cả thời gian', icon: Layers },
    { id: 'today', label: 'Hôm nay', icon: Clock },
    { id: 'yesterday', label: 'Hôm qua', icon: Calendar },
    { id: '7days', label: '7 ngày qua', icon: CalendarDays },
    { id: 'thisMonth', label: 'Tháng này', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Title Header (Style Hồ sơ cá nhân) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none">
              Sổ chi tiết doanh thu & Dòng tiền thực tế
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none">
              Tự động đối soát doanh thu bán hàng, công nợ khách hàng, chi phí nhập kho và lợi nhuận thực tế
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              HBDT Revenue
            </span>
            <button
              onClick={() => void loadLedger()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Tab Bar Thời Gian (Date Range Presets) */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-x-auto">
          {dateTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePreset === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handlePresetChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer
                  ${isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Metric Cards: 6 Thẻ Thống Kê Tài Chính Phân Biệt Rõ Ràng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          
          {/* 1. Tổng doanh thu bán hàng */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                1. Tổng doanh thu bán
              </span>
              <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 truncate">
              {data?.summary ? formatCurrency(data.summary.totalRevenue) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">Tổng giá trị đơn đã bán</p>
          </div>

          {/* 2. Đã thu từ khách hàng */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                2. Đã thu từ khách
              </span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1 truncate">
              {data?.summary ? formatCurrency(data.summary.totalPaid) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">Số tiền thực tế đã thu</p>
          </div>

          {/* 3. Công nợ khách hàng */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                3. Công nợ khách hàng
              </span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-amber-600 mt-1 truncate">
              {data?.summary ? formatCurrency(data.summary.totalDebt) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">Tiền khách còn nợ (1 - 2)</p>
          </div>

          {/* 4. Tiền vốn (Nhập kho) */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                4. Tiền vốn (Nhập kho)
              </span>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-rose-600 mt-1 truncate">
              - {data?.summary ? formatCurrency(data.summary.totalImportCost) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">Chi phí nhập hàng trong kỳ</p>
          </div>

          {/* 5. Lợi nhuận dự kiến */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                5. Lợi nhuận dự kiến
              </span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-lg sm:text-xl font-extrabold mt-1 truncate ${
              data?.summary && data.summary.expectedProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
            }`}>
              {data?.summary ? formatCurrency(data.summary.expectedProfit) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">Thu đủ 100%: Doanh thu - Vốn</p>
          </div>

          {/* 6. Lợi nhuận thực tế đã thu (CARD NỔI BẬT NHẤT) */}
          <div className="p-4 sm:p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                6. Lợi nhuận thực tế
              </span>
              <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-lg sm:text-xl font-black mt-1 truncate ${
              data?.summary && data.summary.actualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {data?.summary ? formatCurrency(data.summary.actualProfit) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-bold truncate">Dòng tiền thực: Đã thu - Vốn</p>
          </div>

        </div>

        {/* Sub-bar: Thông số vận hành đơn hàng */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Tổng số đơn hàng: <strong className="text-slate-900">{data?.summary ? data.summary.totalOrders.toLocaleString('vi-VN') : 0}</strong> đơn</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <span>Tổng số lượng sản phẩm bán: <strong className="text-slate-900">{data?.summary ? data.summary.totalQuantity.toLocaleString('vi-VN') : 0}</strong> sp</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>Số dòng chi tiết bán: <strong className="text-slate-900">{data?.summary ? data.summary.totalItems.toLocaleString('vi-VN') : 0}</strong> dòng</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          
          {/* Sub-Header + Chuyển Chế Độ Xem Bán Hàng / Nhập Kho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200/80 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 select-none">
                  {viewMode === 'sales' ? 'Sổ chi tiết doanh thu bán hàng' : 'Sổ chi tiết tiền nhập kho'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 select-none">
                  {viewMode === 'sales'
                    ? 'Chi tiết từng mặt hàng, tổng tiền đơn, số tiền khách đã trả và còn nợ'
                    : 'Chi tiết các phiếu nhập kho đã xác nhận trong khoảng thời gian lọc'}
                </p>
              </div>
            </div>

            {/* Toggle View Mode Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/80 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('sales')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'sales'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>1. Doanh thu bán hàng ({data?.items ? data.items.length : 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('imports')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'imports'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span>2. Tiền nhập kho ({data?.stockImports ? data.stockImports.length : 0})</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Filter Section (InputField style của Hồ sơ cá nhân) */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 select-none">
              Bộ lọc & Tìm kiếm giao dịch
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Search Keyword */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {viewMode === 'sales' ? 'Mã đơn / Khách hàng' : 'Mã phiếu nhập'}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(0);
                    }}
                    placeholder={viewMode === 'sales' ? 'Tìm mã đơn hoặc khách...' : 'Tìm mã phiếu nhập...'}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* From Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Từ ngày
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setActivePreset('all');
                      setPage(0);
                    }}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* To Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Đến ngày
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setActivePreset('all');
                      setPage(0);
                    }}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Product Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sản phẩm
                  </label>
                  {(fromDate || toDate || keyword || productId) && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setPage(0);
                  }}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                >
                  <option value="">Tất cả mặt hàng</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.productCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* VIEW 1: SỔ CHI TIẾT DOANH THU BÁN HÀNG */}
          {viewMode === 'sales' && (
            <div className="pt-2">
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Ngày bán</th>
                        <th className="px-4 py-3.5">Mã đơn hàng</th>
                        <th className="px-4 py-3.5">Khách hàng</th>
                        <th className="px-4 py-3.5">Sản phẩm</th>
                        <th className="px-4 py-3.5 text-right">Số lượng</th>
                        <th className="px-4 py-3.5 text-right">Đơn giá</th>
                        <th className="px-4 py-3.5 text-right">Thành tiền</th>
                        <th className="px-4 py-3.5 text-right">Tổng đơn</th>
                        <th className="px-4 py-3.5 text-right">Đã thu</th>
                        <th className="px-4 py-3.5 text-right">Còn nợ</th>
                        <th className="px-4 py-3.5 text-center">TT Thanh toán</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loading && (!data || data.items.length === 0) ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                            <div className="inline-flex items-center gap-2 text-xs font-semibold">
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                              Đang tải dữ liệu doanh thu...
                            </div>
                          </td>
                        </tr>
                      ) : !data || data.items.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="text-xs font-semibold text-slate-500">Chưa có giao dịch bán hàng nào trong kỳ.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Dữ liệu sẽ tự động xuất hiện khi đơn hàng được xác nhận.</p>
                          </td>
                        </tr>
                      ) : (
                        data.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium text-xs">
                              {formatDateTime(item.confirmedAt)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-2xs">
                                {item.orderCode}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                              {item.customerName || 'Khách lẻ'}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">{item.productName}</div>
                              <div className="text-[11px] text-slate-400 font-medium">ĐVT: {item.unitName}</div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                              {item.quantity.toLocaleString('vi-VN')} {item.unitName}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                              {formatCurrency(item.lineTotal)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(item.orderTotalAmount)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                              {formatCurrency(item.orderPaidAmount)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-amber-700 whitespace-nowrap">
                              {formatCurrency(item.orderDebtAmount)}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              {renderPaymentBadge(item.orderPaymentStatus)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {data && data.totalPages > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 text-xs font-medium text-slate-500">
                    <div>
                      Hiển thị <span className="font-bold text-slate-900">{data.items.length}</span> /{' '}
                      <span className="font-bold text-slate-900">{data.totalElements}</span> dòng chi tiết bán hàng
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={data.first || loading}
                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Trước
                      </button>

                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold shadow-2xs">
                        {data.page + 1} / {data.totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={data.last || loading}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        Sau <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: SỔ CHI TIẾT TIỀN NHẬP KHO */}
          {viewMode === 'imports' && (
            <div className="pt-2">
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Ngày nhập</th>
                        <th className="px-4 py-3.5">Mã phiếu nhập</th>
                        <th className="px-4 py-3.5">Người tạo phiếu</th>
                        <th className="px-4 py-3.5">Ghi chú</th>
                        <th className="px-4 py-3.5 text-center">Trạng thái</th>
                        <th className="px-4 py-3.5 text-right">Tổng tiền nhập</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loading && (!data || !data.stockImports || data.stockImports.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                            <div className="inline-flex items-center gap-2 text-xs font-semibold">
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                              Đang tải dữ liệu phiếu nhập kho...
                            </div>
                          </td>
                        </tr>
                      ) : !data || !data.stockImports || data.stockImports.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                            <Warehouse className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="text-xs font-semibold text-slate-500">Chưa có phiếu nhập kho nào trong kỳ.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Tiền nhập kho từ mục "Sản phẩm & Danh mục &gt; Nhập kho" sẽ hiển thị tại đây.</p>
                          </td>
                        </tr>
                      ) : (
                        data.stockImports.map((imp) => (
                          <tr key={imp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium text-xs">
                              {formatDateTime(imp.importDate)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-2xs">
                                {imp.importCode}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                              {imp.createdByName || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                              {imp.note || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                Đã nhập kho
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-rose-600 whitespace-nowrap">
                              {formatCurrency(imp.totalAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer tổng kết tiền nhập */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 text-xs font-medium text-slate-500">
                  <div>
                    Tổng số phiếu nhập đã xác nhận:{' '}
                    <span className="font-bold text-slate-900">{data?.stockImports ? data.stockImports.length : 0}</span>
                  </div>
                  <div className="text-right">
                    Tổng tiền nhập kho:{' '}
                    <span className="font-extrabold text-rose-600 text-sm">
                      {data?.summary ? formatCurrency(data.summary.totalImportCost) : '0 ₫'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
