'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FileBarChart, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Pencil, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, Calendar, Hash, User, X, Loader2,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

/* ─── Types ──────────────────────────────────────────────────────── */

type ReportStatus = 'DRAFT' | 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';

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
  const [editData, setEditData] = useState<string>('');

  // Reject modal state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Action loading
  const [saving, setSaving] = useState(false);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
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

  /* ─── Open Detail ────────────────────────────────────────────── */

  const openDetail = async (reportId: number) => {
    setError('');
    try {
      const report = await apiClient.get<ReportReview>(`/api/owner/reports/${reportId}`);
      setSelectedReport(report);
      setEditing(false);
      setEditData(JSON.stringify(report.reportData, null, 2));
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

  /* ─── Edit Report ────────────────────────────────────────────── */

  const handleSaveEdit = async () => {
    if (!selectedReport) return;
    setSaving(true);
    setError('');
    try {
      const parsedData = JSON.parse(editData);
      const updated = await apiClient.put<ReportReview>(
        `/api/owner/reports/${selectedReport.id}`,
        { reportData: parsedData },
      );
      setSelectedReport(updated);
      setEditing(false);
      setEditData(JSON.stringify(updated.reportData, null, 2));
      showNotice('Đã lưu chỉnh sửa báo cáo');
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
      setEditData(JSON.stringify(updated.reportData, null, 2));
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
      setEditData(JSON.stringify(updated.reportData, null, 2));
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
          </div>
        </div>

        {/* ── Notifications ── */}
        {(error || notice) && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {error ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {error || notice}
          </div>
        )}

        {/* ── Filters & Table ── */}
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
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FileBarChart className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">Không có báo cáo nào</p>
              <p className="text-xs mt-1">Các báo cáo được hệ thống tự động tạo sẽ xuất hiện tại đây</p>
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
                        {report.templateName || `Mẫu #${report.templateVersionId}`}
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
                        {formatDateTime(report.createdAt)}
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Detail / Edit Modal
         ═══════════════════════════════════════════════════════════════ */}
      {detailOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-xs overflow-y-auto py-8">
          <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl border border-slate-200 shadow-xl">
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
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Dữ liệu báo cáo</h3>
                  {canEdit && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editData}
                      onChange={(e) => setEditData(e.target.value)}
                      rows={16}
                      className="w-full rounded-xl border border-slate-300 p-4 text-sm font-mono bg-slate-50 outline-none focus:border-slate-500 resize-y transition-colors"
                      spellCheck={false}
                    />
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditData(JSON.stringify(selectedReport.reportData, null, 2));
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => void handleSaveEdit()}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Lưu thay đổi
                      </button>
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

function ReportDataTable({ data }: { data: Record<string, unknown> }) {
  if (!data || typeof data !== 'object') {
    return <p className="text-sm text-slate-400 italic">Không có dữ liệu</p>;
  }

  // If data is an array (rows), render as a table
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className="text-sm text-slate-400 italic">Không có dòng dữ liệu</p>;
    }
    const columns = Object.keys(data[0] as Record<string, unknown>);
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                    {formatCellValue((row as Record<string, unknown>)[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // If data is a flat object (key-value pairs), render as a simple list
  const entries = Object.entries(data);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Chỉ tiêu</th>
            <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Giá trị</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map(([key, val]) => (
            <tr key={key} className="hover:bg-slate-50/50">
              <td className="px-4 py-2.5 text-slate-700 font-medium">{key}</td>
              <td className="px-4 py-2.5 text-slate-900 text-right font-semibold">
                {formatCellValue(val)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return formatCurrency(val);
  if (typeof val === 'boolean') return val ? 'Có' : 'Không';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
