'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  Search,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Package,
  Layers,
  FileSpreadsheet,
  CalendarDays,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Warehouse,
  ClipboardList,
  DollarSign,
  Users,
  BookOpenCheck
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import { FeatureGate } from '@/app/components/FeatureGate';

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
  debts: DebtReportItem[];
  debtSummary: DebtReportSummary;
  operations: BusinessOperationsReport;
  accountingStandard: string;
  summary: RevenueSummary;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface DebtReportItem {
  customerId: number;
  customerCode: string;
  customerName: string;
  openingBalance: number;
  debtIncurred: number;
  amountCollected: number;
  adjustments: number;
  closingBalance: number;
  lastTransactionAt: string | null;
}

interface DebtReportSummary {
  openingBalance: number;
  debtIncurred: number;
  amountCollected: number;
  adjustments: number;
  closingBalance: number;
  customersWithDebt: number;
}

interface BusinessOperationsReport {
  fromDate: string | null;
  toDate: string | null;
  salesRevenue: number;
  cashCollected: number;
  debtIncurred: number;
  debtCollected: number;
  closingReceivables: number;
  stockPurchaseValue: number;
  netOperatingCashFlow: number;
  confirmedOrders: number;
  confirmedStockImports: number;
  reportType: string;
  reviewStatus: 'DRAFT' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  dataSignature: string;
}

interface AiBookkeepingDraft {
  summary: string;
  observations: string[];
  warnings: string[];
}

interface StatutoryBooks {
  fromDate: string | null;
  toDate: string | null;
  legalBasis: string;
  taxRateBasis: string;
  inventoryCostMethod: string;
  s1RevenueByTaxGroup: Array<{
    taxActivityGroupId: number | null;
    activityCode: string;
    activityName: string;
    vatRate: number;
    pitRate: number;
    revenue: number;
    vatPayable: number;
    pitPayable: number;
  }>;
  s1TotalRevenue: number;
  s2Inventory: Array<{
    productId: number;
    productCode: string;
    productName: string;
    baseUnitName: string;
    openingQuantity: number;
    openingValue: number;
    stockInQuantity: number;
    stockInValue: number;
    returnedQuantity: number;
    returnedValue: number;
    stockOutQuantity: number;
    stockOutValue: number;
    closingQuantity: number;
    closingValue: number;
    averageUnitCost: number;
    costComplete: boolean;
    costWarning: string | null;
  }>;
  s4TaxObligations: Array<{
    taxCode: string;
    taxName: string;
    taxableRevenue: number;
    taxPayable: number;
    paidAmount: number;
    remainingAmount: number;
  }>;
  s4TotalPayable: number;
  s4TotalPaid: number;
  s4TotalRemaining: number;
  reviewStatus: 'DRAFT' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  dataSignature: string;
}

interface ProductOption {
  id: number;
  productName: string;
  productCode: string;
}

type DatePreset = 'all' | 'today' | 'yesterday' | '7days' | 'thisMonth';
type ViewMode = 'sales' | 'imports' | 'inventory' | 'tax' | 'debts' | 'operations';

export default function RevenueLedgerView({ role }: { role: 'owner' | 'employee' }) {
  const [data, setData] = useState<RevenuePageResponse | null>(null);
  const [statutoryBooks, setStatutoryBooks] = useState<StatutoryBooks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [aiDraft, setAiDraft] = useState<AiBookkeepingDraft | null>(null);
  const [generatingAiDraft, setGeneratingAiDraft] = useState(false);

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
      const bookParams = new URLSearchParams();
      if (fromDate) bookParams.set('fromDate', fromDate);
      if (toDate) bookParams.set('toDate', toDate);
      const [res, books] = await Promise.all([
        apiClient.get<RevenuePageResponse>(`/api/revenue-ledger?${params.toString()}`),
        apiClient.get<StatutoryBooks>(`/api/accounting/books${bookParams.size ? `?${bookParams.toString()}` : ''}`),
      ]);
      setData(res);
      setStatutoryBooks(books);
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

  const reviewStatutoryBooks = async (status: 'APPROVED' | 'REJECTED') => {
    const note = status === 'REJECTED'
      ? window.prompt('Nhập lý do và chỉ rõ giao dịch nguồn cần sửa:')
      : null;
    if (status === 'REJECTED' && !note?.trim()) return;
    setReviewing(true);
    setReviewMessage('');
    setError('');
    try {
      const books = await apiClient.post<StatutoryBooks>('/api/accounting/books/review', {
        fromDate: fromDate || null,
        toDate: toDate || null,
        status,
        note: note?.trim() || null,
      });
      setStatutoryBooks(books);
      setReviewMessage(status === 'APPROVED'
        ? 'Đã xác nhận bộ sổ S1, S2 và S4 hiện tại.'
        : 'Đã ghi nhận yêu cầu sửa giao dịch nguồn.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu kết quả kiểm tra sổ kế toán');
    } finally {
      setReviewing(false);
    }
  };

  const recordTaxPayment = async (taxCode: string, remainingAmount: number) => {
    const entered = window.prompt(`Nhập số tiền đã nộp cho ${taxCode}:`, String(Math.max(remainingAmount, 0)));
    if (!entered) return;
    const amount = Number(entered.replace(/[.,\s]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Số tiền nộp thuế phải lớn hơn 0.');
      return;
    }
    const documentNumber = window.prompt('Nhập số giấy nộp tiền/chứng từ:');
    if (!documentNumber?.trim()) return;
    setReviewing(true);
    setError('');
    try {
      const now = new Date();
      const paymentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const books = await apiClient.post<StatutoryBooks>('/api/accounting/books/tax-payments', {
        fromDate: fromDate || null,
        toDate: toDate || null,
        taxCode,
        paymentDate,
        paymentAmount: amount,
        documentNumber: documentNumber.trim(),
        paymentMethod: 'BANK_TRANSFER',
      });
      setStatutoryBooks(books);
      setReviewMessage('Đã ghi nhận chứng từ nộp thuế. Bộ sổ chuyển về trạng thái chờ kiểm tra.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận chứng từ nộp thuế');
    } finally {
      setReviewing(false);
    }
  };

  const exportStatutoryBooks = () => {
    if (!statutoryBooks) return;
    const rows: Array<Array<string | number>> = [
      ['S1-HKD - DOANH THU THEO NHÓM THUẾ'],
      ['Nhóm hoạt động', 'Tỷ lệ GTGT (%)', 'Tỷ lệ TNCN (%)', 'Doanh thu', 'Thuế GTGT', 'Thuế TNCN'],
      ...statutoryBooks.s1RevenueByTaxGroup.map((item) => [item.activityName, item.vatRate, item.pitRate, item.revenue, item.vatPayable, item.pitPayable]),
      [],
      ['S2-HKD - NHẬP XUẤT TỒN'],
      ['Mã SP', 'Sản phẩm', 'ĐVT', 'Tồn đầu SL', 'Tồn đầu tiền', 'Nhập SL', 'Tiền nhập', 'Hoàn kho SL', 'Tiền hoàn kho', 'Xuất SL', 'Giá vốn xuất', 'Tồn cuối SL', 'Tồn cuối tiền', 'Trạng thái giá vốn'],
      ...statutoryBooks.s2Inventory.map((item) => [item.productCode, item.productName, item.baseUnitName, item.openingQuantity, item.openingValue, item.stockInQuantity, item.stockInValue, item.returnedQuantity, item.returnedValue, item.stockOutQuantity, item.stockOutValue, item.closingQuantity, item.closingValue, item.costComplete ? 'Đầy đủ' : item.costWarning || 'Thiếu giá vốn']),
      [],
      ['S4-HKD - NGHĨA VỤ THUẾ'],
      ['Sắc thuế', 'Doanh thu tính thuế', 'Phải nộp', 'Đã nộp', 'Còn lại'],
      ...statutoryBooks.s4TaxObligations.map((item) => [item.taxName, item.taxableRevenue, item.taxPayable, item.paidAmount, item.remainingAmount]),
    ];
    const csv = '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `so-ke-toan-S1-S2-S4-${fromDate || 'dau-ky'}-${toDate || 'hien-tai'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setActivePreset('all');
    setFromDate('');
    setToDate('');
    setKeyword('');
    setProductId('');
    setPage(0);
  };

  const reviewOperationsReport = async (status: 'APPROVED' | 'REJECTED') => {
    const note = status === 'REJECTED'
      ? window.prompt('Nhập nội dung cần chỉnh sửa trong dữ liệu nguồn:')
      : null;
    if (status === 'REJECTED' && !note?.trim()) return;

    setReviewing(true);
    setReviewMessage('');
    setError('');
    try {
      const operations = await apiClient.post<BusinessOperationsReport>('/api/revenue-ledger/operations/review', {
        fromDate: fromDate || null,
        toDate: toDate || null,
        status,
        note: note?.trim() || null,
      });
      setData((current) => current ? { ...current, operations } : current);
      setReviewMessage(status === 'APPROVED'
        ? 'Đã xác nhận bản báo cáo hiện tại.'
        : 'Đã ghi nhận yêu cầu chỉnh sửa dữ liệu nguồn.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu kết quả kiểm tra báo cáo');
    } finally {
      setReviewing(false);
    }
  };

  const generateAiBookkeepingDraft = async () => {
    setGeneratingAiDraft(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      setAiDraft(await apiClient.post<AiBookkeepingDraft>(
        `/api/ai/draft-bookkeeping${params.size ? `?${params.toString()}` : ''}`, {},
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo nhận xét báo cáo bằng AI');
    } finally {
      setGeneratingAiDraft(false);
    }
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
              {role === 'owner' ? 'Owner' : 'Employee'} · HBDT Revenue
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
          <div className="p-4 sm:p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                5. Doanh thu - Nhập hàng
              </span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-lg sm:text-xl font-extrabold mt-1 truncate ${data?.summary && data.summary.expectedProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
              }`}>
              {data?.summary ? formatCurrency(data.summary.expectedProfit) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">Chỉ tiêu quản trị, không phải lợi nhuận</p>
          </div>

          {/* 6. Lợi nhuận thực tế đã thu (CARD NỔI BẬT NHẤT) */}
          <div className="p-4 sm:p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                6. Dòng tiền hoạt động
              </span>
              <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-lg sm:text-xl font-black mt-1 truncate ${data?.operations && data.operations.netOperatingCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
              {data?.operations ? formatCurrency(data.operations.netOperatingCashFlow) : '0 ₫'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-bold truncate">Tiền thu - giá trị nhập hàng trong kỳ</p>
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
                  {viewMode === 'sales' && 'Sổ chi tiết doanh thu bán hàng'}
                  {viewMode === 'imports' && 'Sổ chi tiết tiền nhập kho'}
                  {viewMode === 'inventory' && 'S2-HKD · Sổ nhập, xuất, tồn kho'}
                  {viewMode === 'tax' && 'S4-HKD · Sổ nghĩa vụ thuế'}
                  {viewMode === 'debts' && 'Báo cáo công nợ phải thu'}
                  {viewMode === 'operations' && 'Báo cáo hoạt động kinh doanh'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 select-none">
                  {viewMode === 'sales' && 'Biểu S1-HKD tham chiếu Thông tư 88/2021/TT-BTC'}
                  {viewMode === 'imports' && 'Các phiếu nhập kho đã xác nhận trong khoảng thời gian lọc'}
                  {viewMode === 'inventory' && `Giá xuất kho theo ${statutoryBooks?.inventoryCostMethod || 'bình quân gia quyền liên hoàn'}`}
                  {viewMode === 'tax' && 'Thuế GTGT và TNCN tính từ doanh thu đã phân loại trên S1-HKD'}
                  {viewMode === 'debts' && 'Báo cáo quản trị được tổng hợp từ phát sinh nợ và các lần thu nợ'}
                  {viewMode === 'operations' && 'Bản tổng hợp quản trị cần Owner kiểm tra trước khi sử dụng'}
                </p>
              </div>
            </div>

            {/* Toggle View Mode Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/80 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('sales')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'sales'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>1. Doanh thu bán hàng ({data?.items ? data.items.length : 0})</span>
              </button>

              <button
                type="button"
                onClick={() => { setViewMode('imports'); setProductId(''); setPage(0); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'imports'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span>2. Tiền nhập kho ({data?.stockImports ? data.stockImports.length : 0})</span>
              </button>

              <button
                type="button"
                onClick={() => { setViewMode('inventory'); setProductId(''); setKeyword(''); setPage(0); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'inventory'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3. S2-HKD ({statutoryBooks?.s2Inventory.length ?? 0})</span>
              </button>

              <button
                type="button"
                onClick={() => { setViewMode('tax'); setProductId(''); setKeyword(''); setPage(0); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'tax'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>4. S4-HKD</span>
              </button>

              <button
                type="button"
                onClick={() => { setViewMode('debts'); setProductId(''); setPage(0); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'debts'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>5. Công nợ ({data?.debtSummary?.customersWithDebt ?? 0})</span>
              </button>

              <button
                type="button"
                onClick={() => { setViewMode('operations'); setProductId(''); setKeyword(''); setPage(0); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'operations'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                <span>6. Hoạt động kinh doanh</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data?.accountingStandard && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-900">
              <strong>Phạm vi báo cáo:</strong> {data.accountingStandard}. Số liệu chỉ lấy từ giao dịch đã xác nhận;
              hãy sửa giao dịch nguồn nếu phát hiện sai trước khi chốt báo cáo.
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
                  {viewMode === 'sales' && 'Mã đơn / Khách hàng'}
                  {viewMode === 'imports' && 'Mã phiếu nhập'}
                  {viewMode === 'inventory' && 'Tổng hợp theo sản phẩm'}
                  {viewMode === 'tax' && 'Tổng hợp theo sắc thuế'}
                  {viewMode === 'debts' && 'Tên / mã khách hàng'}
                  {viewMode === 'operations' && 'Từ khóa giao dịch'}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={keyword}
                    disabled={viewMode === 'operations' || viewMode === 'inventory' || viewMode === 'tax'}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(0);
                    }}
                    placeholder={viewMode === 'sales' ? 'Tìm mã đơn hoặc khách...'
                      : viewMode === 'imports' ? 'Tìm mã phiếu nhập...'
                        : viewMode === 'debts' ? 'Tìm khách hàng...'
                          : viewMode === 'inventory' ? 'Tổng hợp nhập - xuất - tồn'
                            : viewMode === 'tax' ? 'Tổng hợp GTGT và TNCN'
                          : 'Tổng hợp theo khoảng thời gian'}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
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
                  disabled={viewMode !== 'sales'}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setPage(0);
                  }}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
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
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {statutoryBooks?.s1RevenueByTaxGroup.map((group) => (
                  <div key={group.activityCode} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs font-extrabold text-blue-950">{group.activityName}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{formatCurrency(group.revenue)}</p>
                    <p className="mt-1 text-[11px] text-blue-800">
                      GTGT {group.vatRate}%: {formatCurrency(group.vatPayable)} · TNCN {group.pitRate}%: {formatCurrency(group.pitPayable)}
                    </p>
                  </div>
                ))}
                {statutoryBooks && statutoryBooks.s1RevenueByTaxGroup.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    Chưa có doanh thu đã xác nhận trong kỳ.
                  </div>
                )}
              </div>
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
                            <p className="text-[11px] text-slate-400 mt-0.5">Tiền nhập kho từ mục &quot;Sản phẩm &amp; Danh mục &gt; Nhập kho&quot; sẽ hiển thị tại đây.</p>
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

          {/* S2-HKD: NHẬP - XUẤT - TỒN THEO GIÁ VỐN */}
          {viewMode === 'inventory' && (
            <div className="pt-2 space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
                <strong>Phương pháp giá xuất kho:</strong> {statutoryBooks?.inventoryCostMethod}. Tồn cuối tiền = tồn đầu tiền + tiền nhập + tiền hoàn kho − giá vốn xuất. Hàng hoàn do hủy bán được tách riêng khỏi hàng nhập.
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3 text-right">Tồn đầu SL</th>
                        <th className="px-4 py-3 text-right">Tồn đầu tiền</th>
                        <th className="px-4 py-3 text-right">Nhập SL</th>
                        <th className="px-4 py-3 text-right">Tiền nhập</th>
                        <th className="px-4 py-3 text-right">Hoàn kho SL</th>
                        <th className="px-4 py-3 text-right">Tiền hoàn</th>
                        <th className="px-4 py-3 text-right">Xuất SL</th>
                        <th className="px-4 py-3 text-right">Giá vốn xuất</th>
                        <th className="px-4 py-3 text-right">Tồn cuối SL</th>
                        <th className="px-4 py-3 text-right">Tồn cuối tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {!statutoryBooks?.s2Inventory.length ? (
                        <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400">Chưa có giao dịch kho trong kỳ.</td></tr>
                      ) : statutoryBooks.s2Inventory.map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50">
                          <td className="px-4 py-3"><strong className="text-slate-900">{item.productName}</strong><div className="text-[10px] text-slate-400">{item.productCode} · {item.baseUnitName}</div>{!item.costComplete && <div className="mt-1 max-w-56 text-[10px] font-semibold text-amber-700">{item.costWarning}</div>}</td>
                          <td className="px-4 py-3 text-right">{item.openingQuantity.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.openingValue)}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">{item.stockInQuantity.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(item.stockInValue)}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700">{item.returnedQuantity.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(item.returnedValue)}</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-700">{item.stockOutQuantity.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(item.stockOutValue)}</td>
                          <td className="px-4 py-3 text-right font-bold">{item.closingQuantity.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-900">{formatCurrency(item.closingValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* S4-HKD: NGHĨA VỤ THUẾ */}
          {viewMode === 'tax' && statutoryBooks && (
            <div className="pt-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    {statutoryBooks.reviewStatus === 'APPROVED' ? 'Bộ sổ đã được Owner xác nhận'
                      : statutoryBooks.reviewStatus === 'REJECTED' ? 'Bộ sổ đang chờ sửa dữ liệu nguồn'
                        : 'Bộ sổ S1, S2 và S4 đang chờ kiểm tra'}
                  </p>
                  <p className="text-xs text-amber-800">{statutoryBooks.taxRateBasis}</p>
                  {statutoryBooks.reviewedByName && <p className="mt-1 text-[11px] text-amber-700">{statutoryBooks.reviewedByName} · {statutoryBooks.reviewedAt ? formatDateTime(statutoryBooks.reviewedAt) : ''}{statutoryBooks.reviewNote ? ` · ${statutoryBooks.reviewNote}` : ''}</p>}
                </div>
                <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold text-amber-800">{statutoryBooks.reviewStatus === 'DRAFT' ? 'BẢN NHÁP' : statutoryBooks.reviewStatus === 'APPROVED' ? 'ĐÃ XÁC NHẬN' : 'CẦN CHỈNH SỬA'}</span>
              </div>
              {role === 'owner' && <div className="flex flex-wrap gap-3">
                <button type="button" disabled={reviewing} onClick={() => void reviewStatutoryBooks('APPROVED')} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Xác nhận bộ sổ</button>
                <button type="button" disabled={reviewing} onClick={() => void reviewStatutoryBooks('REJECTED')} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 disabled:opacity-50">Yêu cầu chỉnh dữ liệu</button>
                {reviewMessage && <span className="self-center text-xs font-semibold text-emerald-700">{reviewMessage}</span>}
              </div>}
              <button type="button" onClick={exportStatutoryBooks} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-800"><FileSpreadsheet className="h-4 w-4" />Xuất dữ liệu S1/S2/S4</button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[['Thuế phải nộp', statutoryBooks.s4TotalPayable, 'text-amber-700'], ['Đã nộp', statutoryBooks.s4TotalPaid, 'text-emerald-700'], ['Còn phải nộp', statutoryBooks.s4TotalRemaining, 'text-rose-700']].map(([label, value, color]) => (
                  <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p><p className={`mt-1 text-lg font-black ${color}`}>{formatCurrency(Number(value))}</p></div>
                ))}
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500"><tr><th className="px-4 py-3">Sắc thuế</th><th className="px-4 py-3 text-right">Doanh thu tính thuế</th><th className="px-4 py-3 text-right">Phải nộp</th><th className="px-4 py-3 text-right">Đã nộp</th><th className="px-4 py-3 text-right">Còn lại</th>{role === 'owner' && <th className="px-4 py-3 text-center">Thao tác</th>}</tr></thead>
                  <tbody className="divide-y divide-slate-100">{statutoryBooks.s4TaxObligations.map((tax) => <tr key={tax.taxCode}><td className="px-4 py-3 font-bold text-slate-900">{tax.taxName}</td><td className="px-4 py-3 text-right">{formatCurrency(tax.taxableRevenue)}</td><td className="px-4 py-3 text-right font-bold text-amber-700">{formatCurrency(tax.taxPayable)}</td><td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(tax.paidAmount)}</td><td className="px-4 py-3 text-right font-extrabold text-rose-700">{formatCurrency(tax.remainingAmount)}</td>{role === 'owner' && <td className="px-4 py-3 text-center"><button type="button" disabled={reviewing || tax.remainingAmount <= 0} onClick={() => void recordTaxPayment(tax.taxCode, tax.remainingAmount)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 disabled:opacity-40">Ghi nhận đã nộp</button></td>}</tr>)}</tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">Số thuế được hệ thống tính từ dữ liệu đã xác nhận. Mỗi lần nộp được lưu thành chứng từ riêng và tự động cập nhật số còn phải nộp.</p>
            </div>
          )}

          {/* VIEW 3: BÁO CÁO QUẢN TRỊ CÔNG NỢ */}
          {viewMode === 'debts' && (
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  ['Dư đầu kỳ', data?.debtSummary?.openingBalance ?? 0, 'text-slate-900'],
                  ['Phát sinh nợ', data?.debtSummary?.debtIncurred ?? 0, 'text-amber-700'],
                  ['Đã thu nợ', data?.debtSummary?.amountCollected ?? 0, 'text-emerald-700'],
                  ['Điều chỉnh', data?.debtSummary?.adjustments ?? 0, 'text-blue-700'],
                  ['Dư cuối kỳ', data?.debtSummary?.closingBalance ?? 0, 'text-rose-700'],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className={`mt-1 text-sm font-extrabold ${color}`}>{formatCurrency(Number(value))}</p>
                  </div>
                ))}
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Mã khách</th>
                        <th className="px-4 py-3.5">Khách hàng</th>
                        <th className="px-4 py-3.5 text-right">Dư đầu kỳ</th>
                        <th className="px-4 py-3.5 text-right">Phát sinh nợ</th>
                        <th className="px-4 py-3.5 text-right">Đã thu</th>
                        <th className="px-4 py-3.5 text-right">Điều chỉnh</th>
                        <th className="px-4 py-3.5 text-right">Dư cuối kỳ</th>
                        <th className="px-4 py-3.5">Giao dịch cuối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {!data?.debts?.length ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="text-xs font-semibold text-slate-500">Chưa có phát sinh công nợ trong phạm vi đã chọn.</p>
                          </td>
                        </tr>
                      ) : data.debts.map((item) => (
                        <tr key={item.customerId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-600">{item.customerCode}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">{item.customerName}</td>
                          <td className="px-4 py-3.5 text-right">{formatCurrency(item.openingBalance)}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-amber-700">{formatCurrency(item.debtIncurred)}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-700">{formatCurrency(item.amountCollected)}</td>
                          <td className="px-4 py-3.5 text-right text-blue-700">{formatCurrency(item.adjustments)}</td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-rose-700">{formatCurrency(item.closingBalance)}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                            {item.lastTransactionAt ? formatDateTime(item.lastTransactionAt) : 'Trước kỳ'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: BÁO CÁO HOẠT ĐỘNG KINH DOANH */}
          {viewMode === 'operations' && data?.operations && (
            <div className="pt-2 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    {data.operations.reviewStatus === 'APPROVED' ? 'Báo cáo đã được xác nhận'
                      : data.operations.reviewStatus === 'REJECTED' ? 'Báo cáo đang được yêu cầu chỉnh sửa'
                        : 'Bản tổng hợp chờ kiểm tra'}
                  </p>
                  <p className="text-xs text-amber-800">Đối chiếu đơn bán, phiếu nhập và công nợ trước khi sử dụng cho kê khai.</p>
                  {data.operations.reviewedByName && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      {data.operations.reviewedByName} · {data.operations.reviewedAt ? formatDateTime(data.operations.reviewedAt) : ''}
                      {data.operations.reviewNote ? ` · ${data.operations.reviewNote}` : ''}
                    </p>
                  )}
                </div>
                <span className="self-start rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold text-amber-800">
                  {data.operations.reviewStatus === 'DRAFT' ? 'BẢN NHÁP'
                    : data.operations.reviewStatus === 'APPROVED' ? 'ĐÃ XÁC NHẬN' : 'CẦN CHỈNH SỬA'}
                </span>
              </div>

              {role === 'owner' && <div className="flex flex-wrap items-center gap-3">
                <FeatureGate feature="AI_ASSISTANT" fallback="locked">
                  <button
                    type="button"
                    disabled={generatingAiDraft}
                    onClick={() => void generateAiBookkeepingDraft()}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {generatingAiDraft ? 'AI đang phân tích…' : 'Tạo nhận xét bằng AI'}
                  </button>
                </FeatureGate>
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => void reviewOperationsReport('APPROVED')}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  Xác nhận báo cáo
                </button>
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => void reviewOperationsReport('REJECTED')}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  Yêu cầu chỉnh sửa
                </button>
                {reviewMessage && <span className="text-xs font-semibold text-emerald-700">{reviewMessage}</span>}
              </div>}

              {role === 'owner' && aiDraft && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-indigo-950"><Sparkles className="h-4 w-4" /> Bản nhận xét AI chờ chủ hộ kiểm tra</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{aiDraft.summary}</p>
                  {aiDraft.observations.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">{aiDraft.observations.map((item) => <li key={item}>{item}</li>)}</ul>}
                  {aiDraft.warnings.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{aiDraft.warnings.map((item) => <p key={item}>• {item}</p>)}</div>}
                  <p className="mt-3 text-[11px] font-semibold text-indigo-800">AI chỉ diễn giải số liệu do hệ thống tính. Hãy đối chiếu chứng từ trước khi xác nhận báo cáo.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ['Doanh thu bán hàng', data.operations.salesRevenue, 'Từ đơn đã xác nhận'],
                  ['Tiền đã thu', data.operations.cashCollected, 'Thu ngay khi bán và thu nợ'],
                  ['Nợ phát sinh', data.operations.debtIncurred, 'Giá trị bán chưa thu trong kỳ'],
                  ['Đã thu công nợ', data.operations.debtCollected, 'Các lần khách trả nợ trong kỳ'],
                  ['Công nợ cuối kỳ', data.operations.closingReceivables, 'Số phải thu tại cuối phạm vi báo cáo'],
                  ['Giá trị nhập hàng', data.operations.stockPurchaseValue, 'Phiếu nhập kho đã xác nhận'],
                  ['Dòng tiền hoạt động', data.operations.netOperatingCashFlow, 'Tiền đã thu trừ giá trị nhập hàng'],
                ].map(([label, value, note]) => (
                  <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className={`mt-2 text-xl font-extrabold ${Number(value) < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {formatCurrency(Number(value))}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{note}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Đơn bán đã xác nhận</span>
                  <strong className="text-lg text-slate-900">{data.operations.confirmedOrders.toLocaleString('vi-VN')}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Phiếu nhập đã xác nhận</span>
                  <strong className="text-lg text-slate-900">{data.operations.confirmedStockImports.toLocaleString('vi-VN')}</strong>
                </div>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                Báo cáo này phục vụ quản trị nội bộ. “Dòng tiền hoạt động” không phải lợi nhuận kế toán vì hệ thống chưa phân bổ giá vốn
                theo lượng hàng thực tế đã bán và chưa ghi nhận đầy đủ các chi phí vận hành khác.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
