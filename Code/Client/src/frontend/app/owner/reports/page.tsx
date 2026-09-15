'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FileBarChart, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Pencil, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, Calendar, Hash, User, X, Loader2, Plus, BookOpen,
  Trash2, Table, RotateCcw, Calculator, AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

/* ─── Types ──────────────────────────────────────────────────────── */

type ReportStatus = 'DRAFT' | 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';

interface OwnerTemplateItem {
  id: number;
  templateCode: string;
  templateName: string;
  templateType: string;
  currentVersionNumber: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  updatedAt: string | null;
}

interface OwnerTemplateDetail {
  id: number;
  templateCode: string;
  templateName: string;
  templateType: string;
  officialFormCode: string | null;
  legalBasis: string | null;
  description: string | null;
  status: string;
  currentVersionNumber: number | null;
  currentConfigurationJson: {
    title?: string;
    description?: string;
    fields?: Array<{
      id: string;
      name: string;
      label?: string;
      type?: string;
      required?: boolean;
    }>;
  } | null;
}

interface ReportReview {
  id: number;
  businessId: number;
  templateVersionId: number;
  templateName: string | null;
  templateType: string | null;
  reportingPeriodFrom: string;
  reportingPeriodTo: string;
  generationNo: number;
  generationMethod: string;
  reportData: Record<string, unknown>;
  fileUrl: string | null;
  status: ReportStatus;
  rejectionReason: string | null;
  createdBy: number | null;
  reviewedBy: number | null;
  editedBy: number | null;
  rejectedBy: number | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  confirmedAt: string | null;
  editedAt: string | null;
}

interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/* ─── Constants ──────────────────────────────────────────────────── */

const STATUS_MAP: Record<ReportStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Nháp', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
  PENDING_REVIEW: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const TEMPLATE_TYPE_MAP: Record<string, string> = {
  REVENUE_LEDGER: 'Sổ doanh thu',
  EXPENSE_LEDGER: 'Sổ chi phí',
  DEBT_REPORT: 'Báo cáo công nợ',
  CASH_FLOW: 'Lưu chuyển tiền tệ',
  TAX_SUMMARY: 'Tổng hợp thuế',
  BALANCE_SHEET: 'Bảng cân đối',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function formatCurrency(value: unknown): string {
  if (typeof value === 'number') {
    return value.toLocaleString('vi-VN') + ' ₫';
  }
  return String(value ?? '—');
}

const STANDARD_COLUMN_ORDER = [
  'stt',
  'số hiệu',
  'ngày',
  'người mua',
  'họ tên',
  'mặt hàng',
  'diễn giải',
  'nội dung',
  'doanh thu',
  'đã thanh toán',
  'còn nợ',
  'phương thức',
  'ghi chú',
];

function orderColumns(cols: string[]): string[] {
  const getPriority = (col: string): number => {
    const c = col.toLowerCase();
    if (c.includes('phương thức') || c.includes('hình thức')) return 11;
    for (let i = 0; i < STANDARD_COLUMN_ORDER.length; i++) {
      if (c.includes(STANDARD_COLUMN_ORDER[i])) {
        return i;
      }
    }
    return 999;
  };

  return [...cols].sort((a, b) => getPriority(a) - getPriority(b));
}

function isAmountColumn(colName?: string): boolean {
  if (!colName) return false;
  const c = colName.toLowerCase();
  // Strictly exclude non-amount columns
  if (
    c.includes('phương thức') ||
    c.includes('hình thức') ||
    c === 'stt' ||
    c.includes('ngày') ||
    c.includes('số hiệu') ||
    c.includes('mã') ||
    c.includes('người mua') ||
    c.includes('khách') ||
    c.includes('mặt hàng') ||
    c.includes('diễn giải') ||
    c.includes('nội dung')
  ) {
    return false;
  }
  return (
    c.includes('tiền') ||
    c.includes('doanh thu') ||
    c.includes('đã thanh toán') ||
    c.includes('thực thu') ||
    c.includes('còn nợ') ||
    c.includes('công nợ') ||
    c.includes('giá') ||
    c.includes('chi phí')
  );
}

function calculateTotals(rows: Array<Record<string, unknown>>) {
  let totalRevenue = 0;
  let totalPaid = 0;
  let totalDebt = 0;
  let hasRevenue = false;
  let hasPaid = false;
  let hasDebt = false;

  rows.forEach((r) => {
    Object.keys(r).forEach((k) => {
      const kl = k.toLowerCase();
      if (kl.includes('phương thức') || kl.includes('hình thức')) return;
      const val = Number(r[k]) || 0;
      if (kl.includes('doanh thu') || kl.includes('tổng tiền')) {
        totalRevenue += val;
        hasRevenue = true;
      } else if (kl.includes('đã thanh toán') || kl.includes('thực thu')) {
        totalPaid += val;
        hasPaid = true;
      } else if (kl.includes('còn nợ') || kl.includes('công nợ')) {
        totalDebt += val;
        hasDebt = true;
      }
    });
  });

  return { totalRevenue, totalPaid, totalDebt, hasRevenue, hasPaid, hasDebt };
}

/* ─── Status Badge Component ─────────────────────────────────────── */

function StatusBadge({ status }: { status: ReportStatus }) {
  const config = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

/* ─── Main Page Component ────────────────────────────────────────── */

export default function ReportReviewPage() {
  const [reports, setReports] = useState<PageResponse<ReportReview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  // Detail / Edit modal state
  const [selectedReport, setSelectedReport] = useState<ReportReview | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editRows, setEditRows] = useState<Array<Record<string, unknown>>>([]);
  const [editObject, setEditObject] = useState<Record<string, unknown>>({});
  const [isDataArray, setIsDataArray] = useState(true);

  // Reject modal state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Action loading
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'reports' | 'templates'>('reports');

  // Templates state (Task 1: Active Templates for Owner)
  const [templates, setTemplates] = useState<PageResponse<OwnerTemplateItem> | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateKeyword, setTemplateKeyword] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<OwnerTemplateDetail | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [loadingTemplateDetail, setLoadingTemplateDetail] = useState(false);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  /* ─── Templates Loading (Task 1: Active Templates only) ───── */

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const params = new URLSearchParams({ page: '0', size: '20' });
      if (templateKeyword) params.set('search', templateKeyword);
      const result = await apiClient.get<PageResponse<OwnerTemplateItem>>(`/api/owner/templates?${params}`);
      setTemplates(result);
    } catch (err) {
      console.error('Không thể tải danh sách mẫu biểu áp dụng:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, [templateKeyword]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const openTemplateDetail = async (templateId: number) => {
    setLoadingTemplateDetail(true);
    setTemplateModalOpen(true);
    try {
      const detail = await apiClient.get<OwnerTemplateDetail>(`/api/owner/templates/${templateId}`);
      setSelectedTemplate(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết mẫu biểu');
      setTemplateModalOpen(false);
    } finally {
      setLoadingTemplateDetail(false);
    }
  };

  /* ─── Auto-Generate Report (Bridge to Real-time Bookkeeping) ── */

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError('');
    try {
      const result = await apiClient.post<ReportReview>('/api/owner/reports/generate');
      const genText = result?.generationNo ? ` (Lần #${result.generationNo})` : '';
      showNotice(`Đã tổng hợp & đồng bộ số liệu mới nhất cho kỳ này${genText}!`);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tổng hợp báo cáo');
    } finally {
      setGenerating(false);
    }
  };

  /* ─── Data Loading ───────────────────────────────────────────── */

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), size: '10' });
      if (statusFilter) params.set('status', statusFilter);
      const result = await apiClient.get<PageResponse<ReportReview>>(`/api/owner/reports?${params}`);
      setReports(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  /* ─── Detail & Interactive Edit Handlers ────────────────────── */

  const initEditData = (data: unknown) => {
    if (Array.isArray(data)) {
      setIsDataArray(true);
      setEditRows(JSON.parse(JSON.stringify(data)));
      setEditObject({});
    } else if (data && typeof data === 'object') {
      setIsDataArray(false);
      setEditRows([]);
      setEditObject(JSON.parse(JSON.stringify(data)));
    } else {
      setIsDataArray(false);
      setEditRows([]);
      setEditObject({});
    }
  };

  const openDetail = async (reportId: number) => {
    setError('');
    try {
      const report = await apiClient.get<ReportReview>(`/api/owner/reports/${reportId}`);
      setSelectedReport(report);
      setEditing(false);
      initEditData(report.reportData);
      setDetailOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết báo cáo');
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedReport(null);
    setEditing(false);
  };

  const handleStartEdit = () => {
    if (selectedReport) {
      initEditData(selectedReport.reportData);
      setEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (selectedReport) {
      initEditData(selectedReport.reportData);
    }
  };

  const handleUpdateRow = (idx: number, field: string, val: unknown) => {
    setEditRows((prev) => {
      const next = [...prev];
      const updatedRow = { ...next[idx], [field]: val };

      // Auto calculate "Tiền còn nợ" = Doanh thu bán hàng - Đã thanh toán
      if (field === 'Doanh thu bán hàng' || field === 'Đã thanh toán') {
        const rev = field === 'Doanh thu bán hàng' ? Number(val) || 0 : Number(updatedRow['Doanh thu bán hàng']) || 0;
        const paid = field === 'Đã thanh toán' ? Number(val) || 0 : Number(updatedRow['Đã thanh toán']) || 0;
        updatedRow['Tiền còn nợ'] = Math.max(0, rev - paid);
      }

      next[idx] = updatedRow;
      return next;
    });
  };

  const handleAddRow = () => {
    setEditRows((prev) => {
      const templateRow = prev.length > 0 ? prev[0] : null;
      const newStt = prev.length + 1;
      const todayStr = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });

      let newRow: Record<string, unknown> = {};
      if (templateRow) {
        Object.keys(templateRow).forEach((key) => {
          const kl = key.toLowerCase();
          if (kl === 'stt') newRow[key] = newStt;
          else if (kl.includes('ngày')) newRow[key] = todayStr;
          else if (kl.includes('số hiệu')) newRow[key] = `DH-${String(newStt).padStart(2, '0')}`;
          else if (kl.includes('người mua')) newRow[key] = 'Khách mua hàng';
          else if (kl.includes('diễn giải') || kl.includes('mặt hàng')) newRow[key] = `Bán hàng theo đơn #${newStt}`;
          else if (kl.includes('phương thức')) newRow[key] = 'CASH';
          else if (typeof templateRow[key] === 'number') newRow[key] = 0;
          else newRow[key] = '';
        });
      } else {
        newRow = {
          'STT': newStt,
          'Số hiệu hóa đơn / chứng từ': `DH-${String(newStt).padStart(2, '0')}`,
          'Ngày ghi chứng từ': todayStr,
          'Họ tên người mua hàng': 'Khách mua hàng',
          'Tên mặt hàng / Diễn giải': `Bán hàng theo đơn #${newStt}`,
          'Doanh thu bán hàng': 0,
          'Đã thanh toán': 0,
          'Tiền còn nợ': 0,
          'Phương thức thanh toán': 'CASH',
        };
      }
      return [...prev, newRow];
    });
  };

  const handleDeleteRow = (idx: number) => {
    setEditRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((row, i) => {
        if ('STT' in row) return { ...row, STT: i + 1 };
        if ('stt' in row) return { ...row, stt: i + 1 };
        return row;
      });
    });
  };

  const handleUpdateObjectField = (key: string, val: unknown) => {
    setEditObject((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  /* ─── Save Edit ──────────────────────────────────────────────── */

  const handleSaveEdit = async () => {
    if (!selectedReport) return;
    setSaving(true);
    setError('');
    try {
      let parsedData: unknown;
      if (isDataArray) {
        // Normalize rows: ensure numbers are numbers, STT is 1..N
        parsedData = editRows.map((row, idx) => {
          const clean: Record<string, unknown> = { ...row };
          Object.keys(clean).forEach((k) => {
            const kl = k.toLowerCase();
            if (kl === 'stt') {
              clean[k] = idx + 1;
            } else if (
              !kl.includes('phương thức') &&
              !kl.includes('hình thức') && (
                kl.includes('doanh thu') ||
                kl.includes('tiền') ||
                kl.includes('đã thanh toán') ||
                kl.includes('thực thu') ||
                kl.includes('còn nợ') ||
                kl.includes('công nợ')
              )
            ) {
              clean[k] = Number(clean[k]) || 0;
            }
          });
          return clean;
        });
      } else {
        // Flat object: normalize numbers
        const cleanObj: Record<string, unknown> = { ...editObject };
        Object.keys(cleanObj).forEach((k) => {
          const kl = k.toLowerCase();
          if (
            !kl.includes('phương thức') &&
            !kl.includes('hình thức') && (
              kl.includes('doanh thu') ||
              kl.includes('tiền') ||
              kl.includes('thuế') ||
              kl.includes('lượng')
            )
          ) {
            if (cleanObj[k] !== '' && !isNaN(Number(cleanObj[k]))) {
              cleanObj[k] = Number(cleanObj[k]);
            }
          }
        });
        parsedData = cleanObj;
      }

      const updated = await apiClient.put<ReportReview>(
        `/api/owner/reports/${selectedReport.id}`,
        { reportData: parsedData },
      );
      setSelectedReport(updated);
      setEditing(false);
      initEditData(updated.reportData);
      showNotice('Đã lưu chỉnh sửa số liệu báo cáo thành công');
      void loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu chỉnh sửa');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Confirm Report ─────────────────────────────────────────── */

  const handleConfirm = async () => {
    if (!selectedReport) return;
    setSaving(true);
    setError('');
    try {
      const updated = await apiClient.post<ReportReview>(
        `/api/owner/reports/${selectedReport.id}/confirm`,
      );
      setSelectedReport(updated);
      initEditData(updated.reportData);
      showNotice('Đã xác nhận báo cáo thành công');
      void loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xác nhận báo cáo');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Reject Report ──────────────────────────────────────────── */

  const openReject = () => {
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectReason.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = await apiClient.post<ReportReview>(
        `/api/owner/reports/${selectedReport.id}/reject`,
        { rejectionReason: rejectReason.trim() },
      );
      setSelectedReport(updated);
      initEditData(updated.reportData);
      setRejectOpen(false);
      showNotice('Đã từ chối báo cáo');
      void loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể từ chối báo cáo');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Filter visible reports by keyword (client-side) ────────── */

  const filteredReports = (reports?.content || []).filter((r) => {
    if (!keyword.trim()) return true;
    const kw = keyword.toLowerCase();
    return (
      (r.templateName || '').toLowerCase().includes(kw) ||
      (r.templateType || '').toLowerCase().includes(kw) ||
      String(r.id).includes(kw)
    );
  });

  const canEdit = selectedReport && (selectedReport.status === 'DRAFT' || selectedReport.status === 'PENDING_REVIEW');
  const canReview = selectedReport && selectedReport.status === 'PENDING_REVIEW';

  /* ─── Render ─────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Báo cáo tài chính
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
              Xem, kiểm tra, chỉnh sửa và xác nhận các báo cáo kế toán
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              <FileBarChart className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              {reports?.totalElements ?? 0} báo cáo
            </span>
            {(reports?.totalElements ?? 0) > 0 && (
              <button
                onClick={() => void handleGenerateReport()}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Đang tổng hợp...' : 'Tổng hợp báo cáo ngay'}
              </button>
            )}
          </div>
        </div>

        {/* ── Notifications ── */}
        {(error || notice) && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
            {error ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {error || notice}
          </div>
        )}

        {/* ── Tab Switcher (Bridge between Task 1 & Task 2) ── */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-6 bg-white px-6 pt-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${activeTab === 'reports'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <FileBarChart className="w-4 h-4" />
            Báo cáo kế toán của tôi (Cần duyệt / Chốt kỳ)
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-semibold">
              {reports?.totalElements ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${activeTab === 'templates'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            Mẫu biểu quy định áp dụng (Thông tư 88)
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-semibold">
              {templates?.totalElements ?? 6} mẫu ACTIVE
            </span>
          </button>
        </div>

        {/* ── Tab 1: Reports Section (Task 2) ── */}
        {activeTab === 'reports' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            {/* Filter Bar */}
            <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_200px_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo tên mẫu hoặc mã..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500 transition-colors"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="DRAFT">Nháp</option>
                <option value="PENDING_REVIEW">Chờ duyệt</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="REJECTED">Từ chối</option>
              </select>
              <button
                onClick={() => void loadReports()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Tải lại"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400">
                <FileBarChart className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm font-medium">
                  {(reports?.totalElements ?? 0) === 0 ? 'Không có báo cáo nào' : 'Không tìm thấy báo cáo phù hợp'}
                </p>
                <p className="text-xs mt-1 text-center">
                  {(reports?.totalElements ?? 0) === 0
                    ? 'Các báo cáo được hệ thống tự động tạo từ số liệu bán hàng hoặc khi bạn bấm tạo báo cáo.'
                    : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'}
                </p>
                {(reports?.totalElements ?? 0) === 0 && (
                  <button
                    onClick={() => void handleGenerateReport()}
                    disabled={generating}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {generating ? 'Đang tổng hợp...' : 'Tạo báo cáo tự động cho kỳ này'}
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Tên mẫu</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Loại</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Kỳ báo cáo</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReports.map((report, idx) => (
                      <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                          {page * 10 + idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{report.templateName || `Mẫu #${report.templateVersionId}`}</span>
                            {report.generationNo && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Lần #{report.generationNo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {TEMPLATE_TYPE_MAP[report.templateType || ''] || report.templateType || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          <Calendar className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5 text-slate-400" />
                          {formatDate(report.reportingPeriodFrom)} – {formatDate(report.reportingPeriodTo)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                          <div>{formatDateTime(report.createdAt)}</div>
                          {report.editedAt && report.editedAt !== report.createdAt && (
                            <div className="text-[10px] text-emerald-600 font-medium">
                              Cập nhật: {formatDateTime(report.editedAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => void openDetail(report.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {reports && reports.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <span className="text-xs text-slate-500 font-medium">
                  Hiển thị {page * 10 + 1}–{Math.min((page + 1) * 10, reports.totalElements)} / {reports.totalElements} báo cáo
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={reports.first}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                    {page + 1} / {reports.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(reports.totalPages - 1, page + 1))}
                    disabled={reports.last}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Tab 2: Templates Section (Task 1: Active Templates only) ── */}
        {activeTab === 'templates' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 p-4">
              <label className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={templateKeyword}
                  onChange={(e) => setTemplateKeyword(e.target.value)}
                  placeholder="Tìm theo tên mẫu hoặc mã biểu mẫu..."
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500 transition-colors"
                />
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Áp dụng theo quy định của Bộ Tài chính (Thông tư 88/2021/TT-BTC)
                </span>
                <button
                  onClick={() => void loadTemplates()}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  title="Tải lại"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingTemplates ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Templates Table */}
            {loadingTemplates ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải danh sách mẫu biểu...
              </div>
            ) : !templates || templates.content.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400">
                <BookOpen className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm font-medium">Chưa có mẫu biểu báo cáo nào có hiệu lực</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Mã mẫu</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Tên mẫu báo cáo</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Loại biểu mẫu</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Phiên bản áp dụng</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Ngày cập nhật</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {templates.content.map((tpl, idx) => (
                      <tr key={tpl.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {tpl.templateCode}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {tpl.templateName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {TEMPLATE_TYPE_MAP[tpl.templateType] || tpl.templateType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            v{tpl.currentVersionNumber ?? 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Đang áp dụng
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                          {formatDateTime(tpl.updatedAt)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => void openTemplateDetail(tpl.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem quy định
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Detail / Edit Modal
         ═══════════════════════════════════════════════════════════════ */}
      {detailOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-xs overflow-y-auto py-8">
          <div className="relative w-full max-w-5xl mx-4 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <FileBarChart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedReport.templateName || `Báo cáo #${selectedReport.id}`}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {TEMPLATE_TYPE_MAP[selectedReport.templateType || ''] || selectedReport.templateType} · Lần tạo #{selectedReport.generationNo}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard icon={<Calendar className="w-4 h-4" />} label="Kỳ báo cáo" value={`${formatDate(selectedReport.reportingPeriodFrom)} – ${formatDate(selectedReport.reportingPeriodTo)}`} />
                <InfoCard icon={<Hash className="w-4 h-4" />} label="Phương thức" value={selectedReport.generationMethod === 'AUTO' ? 'Tự động' : 'Thủ công'} />
                <InfoCard icon={<Clock className="w-4 h-4" />} label="Ngày tạo" value={formatDateTime(selectedReport.createdAt)} />
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <FileText className="w-3.5 h-3.5" /> Trạng thái
                  </div>
                  <StatusBadge status={selectedReport.status} />
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedReport.status === 'REJECTED' && selectedReport.rejectionReason && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm">
                  <div className="flex items-center gap-2 font-bold text-red-700 mb-1">
                    <XCircle className="w-4 h-4" /> Lý do từ chối
                  </div>
                  <p className="text-red-600">{selectedReport.rejectionReason}</p>
                  {selectedReport.reviewedAt && (
                    <p className="text-xs text-red-400 mt-2">Thời gian: {formatDateTime(selectedReport.reviewedAt)}</p>
                  )}
                </div>
              )}

              {/* Confirmed info */}
              {selectedReport.status === 'CONFIRMED' && selectedReport.confirmedAt && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 mb-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã xác nhận
                  </div>
                  <p className="text-emerald-600">Báo cáo đã được xác nhận vào {formatDateTime(selectedReport.confirmedAt)}</p>
                </div>
              )}

              {/* Edit info */}
              {selectedReport.editedAt && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
                  <Pencil className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Lần chỉnh sửa cuối: {formatDateTime(selectedReport.editedAt)}
                </div>
              )}

              {/* Report Data Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {editing ? (
                        <>
                          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                            <Pencil className="w-4 h-4" />
                          </span>
                          <span>Chỉnh sửa số liệu sổ kế toán</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Đang điều chỉnh
                          </span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span>Dữ liệu báo cáo</span>
                        </>
                      )}
                    </h3>
                    {editing && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Điều chỉnh trực tiếp số tiền, chứng từ hoặc công nợ. Hệ thống tự động tính toán tổng số phát sinh.
                      </p>
                    )}
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center gap-2">
                    {canEdit && !editing && (
                      <button
                        onClick={handleStartEdit}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa số liệu
                      </button>
                    )}

                    {editing && isDataArray && (
                      <button
                        onClick={handleAddRow}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm dòng chứng từ
                      </button>
                    )}
                  </div>
                </div>

                {editing ? (
                  <div className="space-y-4">
                    {isDataArray ? (
                        /* Interactive Accounting Table Editor */
                        <div className="space-y-3">
                          {(() => {
                            const columns =
                              editRows.length > 0
                                ? orderColumns(Object.keys(editRows[0]))
                                : [
                                    'STT',
                                    'Số hiệu hóa đơn / chứng từ',
                                    'Ngày ghi chứng từ',
                                    'Họ tên người mua hàng',
                                    'Tên mặt hàng / Diễn giải',
                                    'Doanh thu bán hàng',
                                    'Đã thanh toán',
                                    'Tiền còn nợ',
                                    'Phương thức thanh toán',
                                  ];
                            const { totalRevenue, totalPaid, totalDebt, hasRevenue, hasPaid, hasDebt } =
                              calculateTotals(editRows);
                            const isBalanced = totalRevenue === totalPaid + totalDebt;

                            return (
                              <>
                                <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-2xs max-h-[48vh]">
                                  <table className="w-full text-xs">
                                    <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 shadow-2xs">
                                      <tr>
                                        {columns.map((col) => (
                                          <th
                                            key={col}
                                            className={`px-3 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap ${
                                              isAmountColumn(col) ? 'text-right' : 'text-left'
                                            } ${col.toLowerCase() === 'stt' ? 'w-12 text-center' : ''}`}
                                          >
                                            {col}
                                          </th>
                                        ))}
                                        <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-12">
                                          Xóa
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                      {editRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                          {columns.map((col) => {
                                            const kl = col.toLowerCase();
                                            const val = row[col];
                                            const isStt = kl === 'stt';
                                            const isPayment = kl.includes('phương thức') || kl.includes('hình thức');
                                            const isVoucher = kl.includes('số hiệu') || kl.includes('hóa đơn');
                                            const isDate = kl.includes('ngày');
                                            const isAmount = isAmountColumn(col);

                                            if (isStt) {
                                              return (
                                                <td key={col} className="px-2 py-1.5 text-center whitespace-nowrap">
                                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 font-bold text-slate-700 text-xs">
                                                    {idx + 1}
                                                  </span>
                                                </td>
                                              );
                                            }

                                            if (isPayment) {
                                              const paymentStr = String(val ?? '').toUpperCase();
                                              let currentMethod = 'CASH';
                                              if (paymentStr.includes('DEBT') || paymentStr.includes('NỢ')) {
                                                currentMethod = 'DEBT';
                                              } else if (paymentStr.includes('BANK') || paymentStr.includes('CHUYỂN KHOẢN')) {
                                                currentMethod = 'BANK';
                                              } else if (paymentStr.includes('OTHER') || paymentStr.includes('KHÁC')) {
                                                currentMethod = 'OTHER';
                                              } else {
                                                currentMethod = 'CASH';
                                              }

                                              return (
                                                <td key={col} className="px-2 py-1.5 whitespace-nowrap min-w-[140px]">
                                                  <select
                                                    value={currentMethod}
                                                    onChange={(e) => handleUpdateRow(idx, col, e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-white hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 cursor-pointer transition-colors shadow-2xs"
                                                  >
                                                    <option value="CASH">CASH (Tiền mặt)</option>
                                                    <option value="BANK">BANK (Chuyển khoản)</option>
                                                    <option value="DEBT">DEBT (Ghi nợ)</option>
                                                    <option value="OTHER">OTHER (Khác)</option>
                                                  </select>
                                                </td>
                                              );
                                            }

                                            if (isVoucher) {
                                              return (
                                                <td key={col} className="px-2 py-1.5 whitespace-nowrap min-w-[110px]">
                                                  <input
                                                    type="text"
                                                    value={String(val ?? '')}
                                                    onChange={(e) => handleUpdateRow(idx, col, e.target.value)}
                                                    placeholder="DH-..."
                                                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white transition-colors"
                                                  />
                                                </td>
                                              );
                                            }

                                            if (isDate) {
                                              return (
                                                <td key={col} className="px-2 py-1.5 whitespace-nowrap min-w-[120px]">
                                                  <input
                                                    type="text"
                                                    value={String(val ?? '')}
                                                    onChange={(e) => handleUpdateRow(idx, col, e.target.value)}
                                                    placeholder="DD/MM/YYYY"
                                                    className="w-full px-2.5 py-1.5 text-xs text-slate-800 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white transition-colors"
                                                  />
                                                </td>
                                              );
                                            }

                                            if (isAmount) {
                                              return (
                                                <td key={col} className="px-2 py-1.5 whitespace-nowrap min-w-[130px]">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={val !== undefined && val !== null ? String(val) : 0}
                                                    onChange={(e) =>
                                                      handleUpdateRow(
                                                        idx,
                                                        col,
                                                        Math.max(0, Number(e.target.value) || 0)
                                                      )
                                                    }
                                                    className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold text-right text-slate-900 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white transition-colors"
                                                  />
                                                </td>
                                              );
                                            }

                                            if (kl.includes('số hiệu')) {
                                              return (
                                                <td key={col} className="px-2 py-1.5 whitespace-nowrap min-w-[110px]">
                                                  <input
                                                    type="text"
                                                    value={String(val ?? '')}
                                                    onChange={(e) => handleUpdateRow(idx, col, e.target.value)}
                                                    placeholder="DH-..."
                                                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-slate-50/50 hover:bg-white transition-colors"
                                                  />
                                                </td>
                                              );
                                            }

                                            if (kl.includes('ngày')) {
                                              return (
                                                <td key={col} className="px-2 py-1.5 whitespace-nowrap min-w-[120px]">
                                                  <input
                                                    type="text"
                                                    value={String(val ?? '')}
                                                    onChange={(e) => handleUpdateRow(idx, col, e.target.value)}
                                                    placeholder="DD/MM/YYYY"
                                                    className="w-full px-2.5 py-1.5 text-xs text-slate-800 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-slate-50/50 hover:bg-white transition-colors"
                                                  />
                                                </td>
                                              );
                                            }

                                            return (
                                              <td key={col} className="px-2 py-1.5 whitespace-nowrap min-w-[150px]">
                                                <input
                                                  type={typeof val === 'number' ? 'number' : 'text'}
                                                  value={val !== undefined && val !== null ? String(val) : ''}
                                                  onChange={(e) =>
                                                    handleUpdateRow(
                                                      idx,
                                                      col,
                                                      typeof val === 'number'
                                                        ? Number(e.target.value) || 0
                                                        : e.target.value
                                                    )
                                                  }
                                                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-slate-50/50 hover:bg-white transition-colors"
                                                />
                                              </td>
                                            );
                                          })}
                                          <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                            <button
                                              onClick={() => handleDeleteRow(idx)}
                                              disabled={editRows.length <= 1}
                                              title="Xóa dòng chứng từ này"
                                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition cursor-pointer"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    {/* Live Summary Footer */}
                                    {(hasRevenue || hasPaid || hasDebt) && (
                                      <tfoot className="sticky bottom-0 z-10 bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                                        <tr>
                                          {columns.map((col, idx) => {
                                            const kl = col.toLowerCase();
                                            if (idx === 0) {
                                              return (
                                                <td
                                                  key={col}
                                                  className="px-3.5 py-3 text-left font-bold text-slate-800 uppercase"
                                                  colSpan={Math.max(
                                                    1,
                                                    columns.findIndex((c) => isAmountColumn(c))
                                                  )}
                                                >
                                                  TỔNG CỘNG PHÁT SINH ({editRows.length} chứng từ)
                                                </td>
                                              );
                                            }
                                            const firstAmountIdx = columns.findIndex((c) =>
                                              isAmountColumn(c)
                                            );
                                            if (idx < firstAmountIdx) {
                                              return null;
                                            }
                                            if (kl.includes('doanh thu') || kl.includes('tổng tiền')) {
                                              return (
                                                <td
                                                  key={col}
                                                  className="px-3.5 py-3 text-right font-bold font-mono text-emerald-700 whitespace-nowrap"
                                                >
                                                  {formatCurrency(totalRevenue)}
                                                </td>
                                              );
                                            }
                                            if (kl.includes('đã thanh toán') || kl.includes('thực thu')) {
                                              return (
                                                <td
                                                  key={col}
                                                  className="px-3.5 py-3 text-right font-bold font-mono text-blue-700 whitespace-nowrap"
                                                >
                                                  {formatCurrency(totalPaid)}
                                                </td>
                                              );
                                            }
                                            if (kl.includes('còn nợ') || kl.includes('công nợ')) {
                                              return (
                                                <td
                                                  key={col}
                                                  className="px-3.5 py-3 text-right font-bold font-mono text-amber-700 whitespace-nowrap"
                                                >
                                                  {formatCurrency(totalDebt)}
                                                </td>
                                              );
                                            }
                                            return (
                                              <td key={col} className="px-3.5 py-3 text-slate-400 text-center">
                                                —
                                              </td>
                                            );
                                          })}
                                          <td className="px-3.5 py-3 text-center text-slate-400">—</td>
                                        </tr>
                                      </tfoot>
                                    )}
                                  </table>
                                </div>

                                {/* Balancing Verification in Edit Mode */}
                                {(hasRevenue && hasPaid && hasDebt) && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                    <div className="flex items-center gap-2">
                                      <Calculator className="w-4 h-4 text-slate-500" />
                                      <span className="text-slate-600 font-medium">Cân đối thu - nợ:</span>
                                      {isBalanced ? (
                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn kế toán: Doanh thu = Đã thanh toán + Còn nợ
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                                          <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo lệch: Chênh {formatCurrency(Math.abs(totalRevenue - (totalPaid + totalDebt)))} so với (Đã thanh toán + Còn nợ)
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditRows((prev) =>
                                          prev.map((r) => {
                                            const rev = Number(r['Doanh thu bán hàng']) || 0;
                                            const paid = Number(r['Đã thanh toán']) || 0;
                                            return { ...r, 'Tiền còn nợ': Math.max(0, rev - paid) };
                                          })
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Tự động cân đối lại công nợ
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        /* Interactive Key-Value Form Editor */
                        <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-2xs">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300">
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/2">
                                  Chỉ tiêu kế toán
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/2">
                                  Giá trị điều chỉnh
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {Object.entries(editObject).map(([k, val]) => (
                                <tr key={k} className="hover:bg-slate-50/60">
                                  <td className="px-4 py-3 text-slate-800 font-semibold text-xs">
                                    {k}
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type={typeof val === 'number' ? 'number' : 'text'}
                                      value={val !== undefined && val !== null ? String(val) : ''}
                                      onChange={(e) =>
                                        handleUpdateObjectField(
                                          k,
                                          typeof val === 'number'
                                            ? Number(e.target.value) || 0
                                            : e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-slate-50/50 hover:bg-white font-medium text-slate-900 transition-colors"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    {/* Editor Action Buttons (Save / Cancel) */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-xs text-slate-500 italic">
                        * Sau khi lưu, báo cáo sẽ được cập nhật số liệu mới và giữ ở trạng thái Chờ duyệt.
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit()}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-sm"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Lưu thay đổi số liệu
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ReportDataTable data={selectedReport.reportData} />
                )}
              </div>
            </div>

            {/* Modal Footer — Action Buttons */}
            {canReview && !editing && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/40 rounded-b-2xl">
                <button
                  onClick={openReject}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Từ chối
                </button>
                <button
                  onClick={() => void handleConfirm()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Xác nhận báo cáo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          Reject Reason Modal
         ═══════════════════════════════════════════════════════════════ */}
      {rejectOpen && selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg mx-4 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60">
              <h3 className="text-base font-bold text-slate-900">Từ chối báo cáo</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedReport.templateName || `Báo cáo #${selectedReport.id}`}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Nhập lý do từ chối báo cáo..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500 resize-none transition-colors"
                  maxLength={1000}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{rejectReason.length}/1000</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/40">
              <button
                onClick={() => setRejectOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleReject()}
                disabled={saving || !rejectReason.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          Template Detail Modal (Task 1: Active Template Inspection)
         ═══════════════════════════════════════════════════════════════ */}
      {templateModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-xs overflow-y-auto py-8">
          <div className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl border border-slate-200 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedTemplate.templateName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Mã mẫu: {selectedTemplate.templateCode} · Phiên bản đang áp dụng: v{selectedTemplate.currentVersionNumber ?? 1} (ACTIVE)
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setTemplateModalOpen(false); setSelectedTemplate(null); }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium mb-1">Mẫu biểu nhà nước</div>
                  <div className="text-sm font-bold text-slate-800">{selectedTemplate.officialFormCode || 'Mẫu theo TT 88/2021'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium mb-1">Căn cứ pháp lý</div>
                  <div className="text-sm font-bold text-slate-800">{selectedTemplate.legalBasis || 'Thông tư 88/2021/TT-BTC'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium mb-1">Trạng thái áp dụng</div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Đang hiệu lực (ACTIVE)
                  </span>
                </div>
              </div>

              {selectedTemplate.description && (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-800">
                  {selectedTemplate.description}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Cấu trúc các chỉ tiêu / cột trong mẫu biểu quy định:
                </h3>
                {selectedTemplate.currentConfigurationJson?.fields && selectedTemplate.currentConfigurationJson.fields.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left">
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 uppercase">STT</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 uppercase">Tên trường / Cột</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 uppercase">Mã cột</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 uppercase">Kiểu dữ liệu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedTemplate.currentConfigurationJson.fields.map((f, i) => (
                          <tr key={f.id || i} className="hover:bg-slate-50/60">
                            <td className="px-4 py-2 text-xs text-slate-500">{i + 1}</td>
                            <td className="px-4 py-2 text-xs font-semibold text-slate-900">{f.label || f.name}</td>
                            <td className="px-4 py-2 text-xs font-mono text-slate-600">{f.name || f.id}</td>
                            <td className="px-4 py-2 text-xs text-slate-600">{f.type || 'TEXT'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    Cấu trúc mẫu biểu chuẩn theo quy định biểu mẫu Sổ kế toán của Bộ Tài chính.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
              <button
                onClick={() => { setTemplateModalOpen(false); setSelectedTemplate(null); }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-Components ──────────────────────────────────────────────── */

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
        {icon} {label}
      </div>
      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
    </div>
  );
}

function ReportDataTable({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  if (!data || typeof data !== 'object') {
    return <p className="text-sm text-slate-400 italic">Không có dữ liệu</p>;
  }

  // If data is an array (rows), render as a table
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className="text-sm text-slate-400 italic">Không có dòng dữ liệu</p>;
    }
    const rawCols = Object.keys(data[0] as Record<string, unknown>);
    const columns = orderColumns(rawCols);
    const { totalRevenue, totalPaid, totalDebt, hasRevenue, hasPaid, hasDebt } =
      calculateTotals(data as Array<Record<string, unknown>>);
    const isBalanced = totalRevenue === totalPaid + totalDebt;

    return (
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                {columns.map((col) => (
                  <th
                    key={col}
                    className={`px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap ${
                      isAmountColumn(col) ? 'text-right' : 'text-left'
                    } ${col.toLowerCase() === 'stt' ? 'w-14 text-center' : ''}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  {columns.map((col) => {
                    const val = (row as Record<string, unknown>)[col];
                    const isAmount = isAmountColumn(col);
                    const isStt = col.toLowerCase() === 'stt';
                    return (
                      <td
                        key={col}
                        className={`px-3.5 py-2.5 text-slate-700 whitespace-nowrap text-xs ${
                          isAmount ? 'text-right font-medium font-mono text-slate-900' : ''
                        } ${isStt ? 'text-center' : ''}`}
                      >
                        {isStt ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 font-bold text-slate-700 text-xs">
                            {idx + 1}
                          </span>
                        ) : (
                          formatCellValue(val, col)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {/* Accounting Summary Footer */}
            {(hasRevenue || hasPaid || hasDebt) && (
              <tfoot>
                <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  {columns.map((col, idx) => {
                    const kl = col.toLowerCase();
                    if (idx === 0) {
                      return (
                        <td
                          key={col}
                          className="px-3.5 py-3 text-left font-bold text-slate-800"
                          colSpan={Math.max(
                            1,
                            columns.findIndex((c) => isAmountColumn(c))
                          )}
                        >
                          TỔNG CỘNG PHÁT SINH ({data.length} chứng từ)
                        </td>
                      );
                    }
                    const firstAmountIdx = columns.findIndex((c) => isAmountColumn(c));
                    if (idx < firstAmountIdx) {
                      return null;
                    }
                    if (kl.includes('doanh thu') || kl.includes('tổng tiền')) {
                      return (
                        <td
                          key={col}
                          className="px-3.5 py-3 text-right font-bold font-mono text-emerald-700 whitespace-nowrap"
                        >
                          {formatCurrency(totalRevenue)}
                        </td>
                      );
                    }
                    if (kl.includes('đã thanh toán') || kl.includes('thực thu')) {
                      return (
                        <td
                          key={col}
                          className="px-3.5 py-3 text-right font-bold font-mono text-blue-700 whitespace-nowrap"
                        >
                          {formatCurrency(totalPaid)}
                        </td>
                      );
                    }
                    if (kl.includes('còn nợ') || kl.includes('công nợ')) {
                      return (
                        <td
                          key={col}
                          className="px-3.5 py-3 text-right font-bold font-mono text-amber-700 whitespace-nowrap"
                        >
                          {formatCurrency(totalDebt)}
                        </td>
                      );
                    }
                    return (
                      <td key={col} className="px-3.5 py-3 text-slate-400 text-center">
                        —
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Balancing Verification Banner */}
        {hasRevenue && hasPaid && hasDebt && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600 font-medium">Đối chiếu cân đối sổ sách:</span>
              {isBalanced ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Khớp số liệu: Doanh thu = Đã thanh toán + Còn nợ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" /> Có chênh lệch thu - nợ: {formatCurrency(Math.abs(totalRevenue - (totalPaid + totalDebt)))}
                </span>
              )}
            </div>
            <span className="text-slate-400 italic">Theo mẫu biểu chuẩn Thông tư 88/2021/TT-BTC</span>
          </div>
        )}
      </div>
    );
  }

  // If data is a flat object (key-value pairs), render as a simple list
  const entries = Object.entries(data);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              Chỉ tiêu kế toán
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
              Giá trị ghi nhận
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map(([key, val]) => (
            <tr key={key} className="hover:bg-slate-50/50">
              <td className="px-4 py-2.5 text-slate-700 font-medium text-xs">{key}</td>
              <td className="px-4 py-2.5 text-slate-900 text-right font-semibold font-mono text-xs">
                {formatCellValue(val, key)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCellValue(val: unknown, colName?: string): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (
      colName &&
      (colName.toLowerCase() === 'stt' ||
        colName.toLowerCase().includes('năm') ||
        colName.toLowerCase().includes('tháng') ||
        colName.toLowerCase().includes('lần') ||
        colName.toLowerCase() === 'id')
    ) {
      return String(val);
    }
    if (!colName || isAmountColumn(colName)) {
      return formatCurrency(val);
    }
    return val.toLocaleString('vi-VN');
  }
  if (typeof val === 'boolean') return val ? 'Có' : 'Không';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
