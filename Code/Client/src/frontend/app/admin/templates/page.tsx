'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Plus, Pencil, RefreshCw, Search, Clock,
  X, Check, Pause, Play, ChevronLeft, ChevronRight, AlertTriangle,
  Table, Trash2, RotateCcw, Columns, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateListItem {
  id: number;
  templateCode: string;
  templateName: string;
  templateType: string;
  currentVersionNumber: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  updatedAt: string | null;
}

interface TemplateVersionItem {
  id: number;
  versionNumber: number;
  configurationJson: unknown;
  updatedBy: number | null;
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string | null;
}

interface TemplateDetail {
  id: number;
  templateCode: string;
  templateName: string;
  templateType: string;
  officialFormCode: string | null;
  legalBasis: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  currentVersionId: number | null;
  currentVersionNumber: number | null;
  currentConfigurationJson: unknown;
  versionHistory: TemplateVersionItem[];
}

interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ColumnConfigItem {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'currency' | 'number' | 'date';
  required: boolean;
}

export interface TemplatePreset {
  name: string;
  officialFormCode: string;
  legalBasis: string;
  description: string;
  columns: Omit<ColumnConfigItem, 'id'>[];
}

// ─── Standard Profiles (Thông tư 88/2021/TT-BTC & Thông tư 40/2021/TT-BTC) ────

const STANDARD_PRESETS: Record<string, TemplatePreset> = {
  REVENUE_LEDGER: {
    name: 'Sổ chi tiết doanh thu bán hàng hóa, dịch vụ',
    officialFormCode: 'Mẫu số S1-HKD',
    legalBasis: 'Thông tư 88/2021/TT-BTC',
    description: 'Dùng để theo dõi chi tiết doanh thu bán hàng hóa, dịch vụ theo từng nhóm ngành nghề tính thuế.',
    columns: [
      { key: 'voucherDate', label: 'Ngày ghi chứng từ', type: 'date', required: true },
      { key: 'invoiceNumber', label: 'Số hiệu hóa đơn / chứng từ', type: 'text', required: true },
      { key: 'customerName', label: 'Họ tên người mua hàng', type: 'text', required: false },
      { key: 'productName', label: 'Tên mặt hàng / Dịch vụ', type: 'text', required: true },
      { key: 'unit', label: 'Đơn vị tính', type: 'text', required: false },
      { key: 'quantity', label: 'Số lượng', type: 'number', required: true },
      { key: 'unitPrice', label: 'Đơn giá bán', type: 'currency', required: true },
      { key: 'revenue', label: 'Doanh thu bán hàng', type: 'currency', required: true },
      { key: 'vatAmount', label: 'Tiền thuế GTGT', type: 'currency', required: false },
      { key: 'notes', label: 'Ghi chú', type: 'text', required: false },
    ],
  },
  EXPENSE_LEDGER: {
    name: 'Sổ chi tiết chi phí sản xuất, kinh doanh',
    officialFormCode: 'Mẫu số S2-HKD',
    legalBasis: 'Thông tư 88/2021/TT-BTC',
    description: 'Theo dõi chi tiết các khoản chi phí tiền mua hàng, tiền nhân công và chi phí quản lý.',
    columns: [
      { key: 'expenseDate', label: 'Ngày chi tiền', type: 'date', required: true },
      { key: 'voucherNo', label: 'Số phiếu chi / hóa đơn', type: 'text', required: true },
      { key: 'category', label: 'Khoản mục chi phí', type: 'text', required: true },
      { key: 'amount', label: 'Số tiền chi', type: 'currency', required: true },
      { key: 'payee', label: 'Người nhận tiền', type: 'text', required: false },
      { key: 'description', label: 'Diễn giải nội dung chi', type: 'text', required: true },
      { key: 'notes', label: 'Ghi chú', type: 'text', required: false },
    ],
  },
  DEBT_REPORT: {
    name: 'Báo cáo tổng hợp và theo dõi công nợ',
    officialFormCode: 'Mẫu quản trị công nợ',
    legalBasis: 'Chế độ kế toán quản trị HBDT',
    description: 'Theo dõi số dư nợ đầu kỳ, phát sinh tăng, số đã thanh toán và dư nợ cuối kỳ của khách hàng/NCC.',
    columns: [
      { key: 'partnerCode', label: 'Mã đối tác (Khách hàng/NCC)', type: 'text', required: true },
      { key: 'partnerName', label: 'Tên đối tác', type: 'text', required: true },
      { key: 'openingBalance', label: 'Dư nợ đầu kỳ', type: 'currency', required: true },
      { key: 'incurredAmount', label: 'Số phát sinh tăng', type: 'currency', required: true },
      { key: 'paidAmount', label: 'Số đã thanh toán', type: 'currency', required: true },
      { key: 'closingBalance', label: 'Dư nợ còn lại cuối kỳ', type: 'currency', required: true },
    ],
  },
  CASH_FLOW: {
    name: 'Sổ theo dõi tình hình thanh toán và quỹ tiền mặt',
    officialFormCode: 'Mẫu số S3-HKD',
    legalBasis: 'Thông tư 88/2021/TT-BTC',
    description: 'Ghi nhận dòng tiền thu vào, chi ra và biến động số dư tồn quỹ tiền mặt, tiền gửi ngân hàng.',
    columns: [
      { key: 'transactionDate', label: 'Ngày phát sinh', type: 'date', required: true },
      { key: 'voucherNo', label: 'Số chứng từ', type: 'text', required: true },
      { key: 'description', label: 'Diễn giải dòng tiền', type: 'text', required: true },
      { key: 'cashIn', label: 'Tiền thu vào (+)', type: 'currency', required: true },
      { key: 'cashOut', label: 'Tiền chi ra (-)', type: 'currency', required: true },
      { key: 'balance', label: 'Số dư tồn quỹ', type: 'currency', required: true },
    ],
  },
  TAX_SUMMARY: {
    name: 'Tờ khai tổng hợp nghĩa vụ thuế hộ kinh doanh',
    officialFormCode: 'Mẫu tờ khai 01/CNKD',
    legalBasis: 'Thông tư 40/2021/TT-BTC',
    description: 'Báo cáo xác định doanh thu tính thuế và nghĩa vụ thuế GTGT, TNCN theo từng ngành nghề.',
    columns: [
      { key: 'taxCategory', label: 'Ngành nghề tính thuế', type: 'text', required: true },
      { key: 'taxableRevenue', label: 'Doanh thu tính thuế', type: 'currency', required: true },
      { key: 'vatRate', label: 'Tỷ lệ thuế GTGT (%)', type: 'text', required: true },
      { key: 'pitRate', label: 'Tỷ lệ thuế TNCN (%)', type: 'text', required: true },
      { key: 'totalTax', label: 'Tổng tiền thuế phải nộp', type: 'currency', required: true },
    ],
  },
  BALANCE_SHEET: {
    name: 'Bảng cân đối tình hình tài chính quản trị',
    officialFormCode: 'Báo cáo tài chính quản trị',
    legalBasis: 'Chuẩn mực kế toán hộ kinh doanh',
    description: 'Tổng hợp số dư tài sản, nguồn vốn và công nợ của hộ kinh doanh đầu kỳ và cuối kỳ.',
    columns: [
      { key: 'indicator', label: 'Chỉ tiêu tài chính', type: 'text', required: true },
      { key: 'code', label: 'Mã số chỉ tiêu', type: 'text', required: true },
      { key: 'startPeriod', label: 'Số đầu kỳ', type: 'currency', required: true },
      { key: 'endPeriod', label: 'Số cuối kỳ', type: 'currency', required: true },
    ],
  },
};

const TYPE_PREFIX: Record<string, string> = {
  REVENUE_LEDGER: 'RL',
  EXPENSE_LEDGER: 'EL',
  DEBT_REPORT: 'DR',
  CASH_FLOW: 'CF',
  TAX_SUMMARY: 'TS',
  BALANCE_SHEET: 'BS',
};

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại báo cáo' },
  { value: 'REVENUE_LEDGER', label: 'Sổ chi tiết doanh thu' },
  { value: 'EXPENSE_LEDGER', label: 'Sổ chi phí kinh doanh' },
  { value: 'DEBT_REPORT', label: 'Báo cáo công nợ' },
  { value: 'CASH_FLOW', label: 'Lưu chuyển tiền tệ' },
  { value: 'TAX_SUMMARY', label: 'Tờ khai tổng hợp thuế' },
  { value: 'BALANCE_SHEET', label: 'Bảng cân đối kế toán' },
];

const TYPE_LABELS: Record<string, string> = {
  REVENUE_LEDGER: 'Sổ doanh thu',
  EXPENSE_LEDGER: 'Sổ chi phí',
  DEBT_REPORT: 'Báo cáo công nợ',
  CASH_FLOW: 'Lưu chuyển tiền tệ',
  TAX_SUMMARY: 'Tổng hợp thuế',
  BALANCE_SHEET: 'Bảng cân đối',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
];

const inputClass =
  'w-full rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-zinc-400';

const PAGE_SIZE = 10;

// ─── Page Component ───────────────────────────────────────────────────────────

export default function FinancialTemplateManagementPage() {
  // ── List state ──
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);

  // ── Filters ──
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // ── Notifications ──
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // ── Create/Edit Modal State ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState('REVENUE_LEDGER');
  const [formOfficialCode, setFormOfficialCode] = useState('');
  const [formLegalBasis, setFormLegalBasis] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  // Column Configuration Table State
  const [columns, setColumns] = useState<ColumnConfigItem[]>([]);

  // ── Version history modal ──
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionModalTitle, setVersionModalTitle] = useState('');
  const [versionHistory, setVersionHistory] = useState<TemplateVersionItem[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<number | null>(null);
  const [selectedVersionColumns, setSelectedVersionColumns] = useState<any[] | null>(null);

  // ── Debounced search ──
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4500);
    return () => clearTimeout(t);
  }, [error]);

  // ═══════════════════════════════════════════════════════════════════════════
  // API: Load templates list
  // ═══════════════════════════════════════════════════════════════════════════

  const loadTemplates = useCallback(async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('size', String(PAGE_SIZE));
      if (debouncedKeyword.trim()) params.set('keyword', debouncedKeyword.trim());
      if (filterType) params.set('templateType', filterType);
      if (filterStatus) params.set('status', filterStatus);

      const res = await apiClient.get<PageData<TemplateListItem>>(
        `/api/admin/templates?${params.toString()}`
      );

      setTemplates(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
      setIsFirst(res.first ?? true);
      setIsLast(res.last ?? true);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách mẫu báo cáo');
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, filterType, filterStatus]);

  useEffect(() => {
    void loadTemplates(0);
  }, [loadTemplates]);

  // ═══════════════════════════════════════════════════════════════════════════
  // API: Toggle status (ACTIVE / INACTIVE)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleToggleStatus = async (tmpl: TemplateListItem) => {
    const newStatus = tmpl.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiClient.patch(`/api/admin/templates/${tmpl.id}/status`, {
        status: newStatus,
      });
      setNotice(
        `Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'ngừng hoạt động'} mẫu "${tmpl.templateName}"`
      );
      await loadTemplates(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Helper: Load Standard Profile by Type
  // ═══════════════════════════════════════════════════════════════════════════

  const loadStandardProfile = (type: string, isCreate = true) => {
    const preset = STANDARD_PRESETS[type] || STANDARD_PRESETS.REVENUE_LEDGER;
    setFormType(type);

    const initialCols: ColumnConfigItem[] = preset.columns.map((col, idx) => ({
      ...col,
      id: `${col.key}_${idx}`,
    }));
    setColumns(initialCols);

    if (isCreate) {
      const prefix = TYPE_PREFIX[type] || 'RPT';
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormCode(`${prefix}-${new Date().getFullYear()}-${randomSuffix}`);
      setFormName(preset.name);
      setFormOfficialCode(preset.officialFormCode);
      setFormLegalBasis(preset.legalBasis);
      setFormDescription(preset.description);
    }
  };

  // ── Column Configuration Actions ──

  const handleUpdateColumnLabel = (id: string, label: string) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  const handleUpdateColumnType = (id: string, type: ColumnConfigItem['type']) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, type } : c)));
  };

  const handleToggleColumnRequired = (id: string) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, required: !c.required } : c)));
  };

  const handleRemoveColumn = (id: string) => {
    if (columns.length <= 1) {
      setError('Mẫu báo cáo bắt buộc phải có ít nhất 1 cột');
      return;
    }
    setColumns(columns.filter((c) => c.id !== id));
  };

  const handleAddColumn = () => {
    const timestamp = Date.now().toString().slice(-4);
    const newCol: ColumnConfigItem = {
      id: `custom_${timestamp}`,
      key: `col_${timestamp}`,
      label: 'Cột mới',
      type: 'text',
      required: false,
    };
    setColumns([...columns, newCol]);
  };

  const handleResetToStandardColumns = () => {
    const preset = STANDARD_PRESETS[formType] || STANDARD_PRESETS.REVENUE_LEDGER;
    const standardCols: ColumnConfigItem[] = preset.columns.map((col, idx) => ({
      ...col,
      id: `${col.key}_${idx}`,
    }));
    setColumns(standardCols);
    setNotice('Đã khôi phục danh sách cột về chuẩn quy định của Bộ Tài chính');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Modal: Open Create
  // ═══════════════════════════════════════════════════════════════════════════

  const openCreate = () => {
    setEditId(null);
    setChangeSummary('');
    loadStandardProfile('REVENUE_LEDGER', true);
    setModalOpen(true);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Modal: Open Edit
  // ═══════════════════════════════════════════════════════════════════════════

  const openEdit = async (id: number) => {
    setError('');
    try {
      const detail = await apiClient.get<TemplateDetail>(`/api/admin/templates/${id}`);
      setEditId(detail.id);
      setFormCode(detail.templateCode);
      setFormName(detail.templateName);
      setFormType(detail.templateType);
      setFormOfficialCode(detail.officialFormCode || '');
      setFormLegalBasis(detail.legalBasis || '');
      setFormDescription(detail.description || '');
      setChangeSummary('');

      // Parse existing columns configuration
      const config = detail.currentConfigurationJson as any;
      if (config && Array.isArray(config.fields) && config.fields.length > 0) {
        const loaded: ColumnConfigItem[] = config.fields.map((f: any, idx: number) => ({
          id: f.key || `col_${idx}`,
          key: f.key || `key_${idx}`,
          label: f.label || f.key || 'Cột không tên',
          type: f.type || 'text',
          required: f.required !== false,
        }));
        setColumns(loaded);
      } else {
        loadStandardProfile(detail.templateType, false);
      }

      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lấy thông tin chi tiết');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Modal: Version history
  // ═══════════════════════════════════════════════════════════════════════════

  const openVersionHistory = async (id: number, name: string) => {
    setError('');
    try {
      const detail = await apiClient.get<TemplateDetail>(`/api/admin/templates/${id}`);
      setVersionModalTitle(name);
      setVersionHistory(detail.versionHistory || []);
      setCurrentVersionId(detail.currentVersionId);
      setSelectedVersionColumns(null);
      setVersionModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử phiên bản');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Form Submit: Create / Update
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setError('Vui lòng nhập tên mẫu báo cáo');
      return;
    }

    if (columns.length === 0) {
      setError('Mẫu báo cáo bắt buộc phải có ít nhất 1 cột');
      return;
    }

    // Build structured JSON schema according to accounting standards
    const finalConfig = {
      title: formName.trim(),
      officialFormCode: formOfficialCode.trim() || null,
      legalBasis: formLegalBasis.trim() || null,
      description: formDescription.trim() || null,
      fields: columns.map((col) => ({
        key: col.key,
        label: col.label.trim(),
        type: col.type,
        required: col.required,
      })),
    };

    setSaving(true);
    setError('');

    try {
      if (editId) {
        await apiClient.put(`/api/admin/templates/${editId}`, {
          name: formName.trim(),
          templateName: formName.trim(),
          officialFormCode: formOfficialCode.trim() || null,
          legalBasis: formLegalBasis.trim() || null,
          description: formDescription.trim() || null,
          configurationJson: finalConfig,
          changeSummary: changeSummary.trim() || 'Cập nhật cấu hình cột báo cáo',
        });
        setNotice(`Đã cập nhật mẫu "${formName}" (phiên bản mới được lưu thành công)`);
      } else {
        await apiClient.post('/api/admin/templates', {
          name: formName.trim(),
          templateName: formName.trim(),
          templateCode: formCode.trim().toUpperCase(),
          type: formType,
          templateType: formType,
          officialFormCode: formOfficialCode.trim() || null,
          legalBasis: formLegalBasis.trim() || null,
          description: formDescription.trim() || null,
          configurationJson: finalConfig,
        });
        setNotice(`Đã tạo thành công mẫu báo cáo "${formName}"`);
      }
      setModalOpen(false);
      await loadTemplates(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu mẫu báo cáo');
    } finally {
      setSaving(false);
    }
  };

  // ── Format date helper ──
  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 relative pb-10">
      {/* Toast Alert */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xl"
          >
            <div className="p-1 bg-emerald-500 rounded-full text-zinc-950">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-sm font-semibold">{notice}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 bg-red-950/90 border border-red-500 text-red-200 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xl"
          >
            <div className="p-1 bg-red-500 rounded-full text-zinc-950">
              <AlertTriangle className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-sm font-semibold">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Quản lý Mẫu Báo cáo Tài chính
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Quản lý và cấu hình các mẫu báo cáo, sổ sách kế toán theo quy định của Bộ Tài chính.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Tạo mẫu mới
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-4 gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã mẫu..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-zinc-500"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="p-1 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(0);
            }}
            className="rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-zinc-400 cursor-pointer"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-zinc-400 cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadTemplates(currentPage)}
            disabled={loading}
            className="rounded-xl border border-zinc-700/80 p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main content table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold bg-zinc-800/20">
                <th className="p-4 pl-6">Mã mẫu</th>
                <th className="p-4">Tên mẫu báo cáo</th>
                <th className="p-4">Loại biểu mẫu</th>
                <th className="p-4 text-center">Phiên bản</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4">Cập nhật</th>
                <th className="p-4 pr-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-zinc-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
                      <span>Đang tải danh sách mẫu báo cáo...</span>
                    </div>
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-zinc-500 text-sm">
                    {keyword || filterType || filterStatus
                      ? 'Không tìm thấy mẫu báo cáo nào khớp với bộ lọc'
                      : 'Chưa có mẫu báo cáo nào trong hệ thống'}
                  </td>
                </tr>
              ) : (
                templates.map((tmpl) => (
                  <tr key={tmpl.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-zinc-300">
                      {tmpl.templateCode}
                    </td>
                    <td className="p-4 font-semibold text-white">{tmpl.templateName}</td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {TYPE_LABELS[tmpl.templateType] || tmpl.templateType}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                        v{tmpl.currentVersionNumber ?? 1}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          tmpl.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tmpl.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-zinc-500'
                          }`}
                        />
                        {tmpl.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-xs">
                      {formatDate(tmpl.updatedAt)}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(tmpl.id)}
                          title="Cấu hình & chỉnh sửa mẫu"
                          className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openVersionHistory(tmpl.id, tmpl.templateName)}
                          title="Lịch sử phiên bản"
                          className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(tmpl)}
                          title={tmpl.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt'}
                          className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                        >
                          {tmpl.status === 'ACTIVE' ? (
                            <Pause className="w-4 h-4 text-zinc-400 hover:text-amber-400" />
                          ) : (
                            <Play className="w-4 h-4 text-zinc-400 hover:text-emerald-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4 bg-zinc-900/50">
            <span className="text-xs text-zinc-400">
              Trang <span className="text-white font-semibold">{currentPage + 1}</span> /{' '}
              <span className="text-white font-semibold">{totalPages}</span> (Tổng{' '}
              {totalElements} mẫu)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={isFirst || loading}
                onClick={() => loadTemplates(currentPage - 1)}
                className="p-2 rounded-xl border border-zinc-700/80 bg-zinc-800/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={isLast || loading}
                onClick={() => loadTemplates(currentPage + 1)}
                className="p-2 rounded-xl border border-zinc-700/80 bg-zinc-800/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Create / Edit Modal (Chuẩn Kế toán & Cấu hình Cột Chuyên nghiệp)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl my-8 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    {editId ? 'Cập nhật cấu hình mẫu báo cáo' : 'Tạo mẫu báo cáo tài chính mới'}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Thiết lập thông tin biểu mẫu và cấu hình danh sách các cột dữ liệu hiển thị.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1">
                {/* 1. Thông tin chung của mẫu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Loại báo cáo / Sổ kế toán <span className="text-red-400">*</span>
                    </label>
                    <select
                      className={`${inputClass} ${editId ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      value={formType}
                      onChange={(e) => loadStandardProfile(e.target.value, !editId)}
                      disabled={!!editId}
                      required
                    >
                      {TYPE_OPTIONS.filter((o) => o.value).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Mã định danh mẫu <span className="text-red-400">*</span>
                    </label>
                    <input
                      className={`${inputClass} font-mono ${editId ? 'opacity-60 cursor-not-allowed' : ''}`}
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="VD: RL-2026-001"
                      disabled={!!editId}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Tên mẫu báo cáo <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Sổ chi tiết doanh thu bán hàng hóa, dịch vụ"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Mẫu biểu theo quy định
                    </label>
                    <input
                      className={inputClass}
                      value={formOfficialCode}
                      onChange={(e) => setFormOfficialCode(e.target.value)}
                      placeholder="VD: Mẫu số S1-HKD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Căn cứ pháp lý
                    </label>
                    <input
                      className={inputClass}
                      value={formLegalBasis}
                      onChange={(e) => setFormLegalBasis(e.target.value)}
                      placeholder="VD: Thông tư 88/2021/TT-BTC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Mô tả phạm vi áp dụng
                  </label>
                  <textarea
                    className={`${inputClass} resize-none h-16`}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mục đích sử dụng của mẫu báo cáo..."
                  />
                </div>

                {/* 2. Cấu hình bảng cột dữ liệu (Report Columns Config Table) */}
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Columns className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">
                        Cấu hình các cột hiển thị ({columns.length} cột)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetToStandardColumns}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Khôi phục danh sách cột mặc định theo Thông tư"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Chuẩn Thông tư
                      </button>
                      <button
                        type="button"
                        onClick={handleAddColumn}
                        className="flex items-center gap-1 text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> Thêm cột
                      </button>
                    </div>
                  </div>

                  {/* Columns Editable Table */}
                  <div className="overflow-x-auto border border-zinc-800 rounded-xl max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900 sticky top-0 z-10 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">STT</th>
                          <th className="py-2.5 px-3 min-w-[180px]">Tiêu đề cột (Tên hiển thị)</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Mã trường (Field Key)</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Loại dữ liệu</th>
                          <th className="py-2.5 px-3 w-24 text-center">Bắt buộc</th>
                          <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                        {columns.map((col, idx) => (
                          <tr key={col.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-2 px-3 text-center text-zinc-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={col.label}
                                onChange={(e) => handleUpdateColumnLabel(col.id, e.target.value)}
                                className="w-full bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-400 font-medium"
                                placeholder="Nhập tên cột..."
                                required
                              />
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-mono text-zinc-300 bg-zinc-800 px-2 py-1 rounded border border-zinc-700/60 text-[11px] block truncate">
                                {col.key}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={col.type}
                                onChange={(e) =>
                                  handleUpdateColumnType(col.id, e.target.value as any)
                                }
                                className="w-full bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-400 cursor-pointer"
                              >
                                <option value="text">Văn bản</option>
                                <option value="currency">Số tiền (VND)</option>
                                <option value="number">Số lượng</option>
                                <option value="date">Ngày tháng</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={col.required}
                                onChange={() => handleToggleColumnRequired(col.id)}
                                className="w-4 h-4 accent-white rounded cursor-pointer"
                                title="Cột bắt buộc có số liệu"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(col.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                title="Xóa cột này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Lý do điều chỉnh (chỉ hiện khi cập nhật) */}
                {editId && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Ghi chú thay đổi (Change summary) <span className="text-red-400">*</span>
                    </label>
                    <input
                      className={inputClass}
                      value={changeSummary}
                      onChange={(e) => setChangeSummary(e.target.value)}
                      placeholder="VD: Cập nhật tiêu đề cột doanh thu, bổ sung cột chiết khấu..."
                      required
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Cơ chế Bất biến (Immutability): Mọi cập nhật sẽ tự động nâng lên phiên bản mới v(N+1) mà không ảnh hưởng đến các báo cáo cũ.
                    </p>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-3 border border-zinc-700/80 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Đang lưu...' : editId ? 'Lưu & Nâng phiên bản' : 'Tạo mẫu mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Version History Modal                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {versionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl my-8 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Lịch sử phiên bản mẫu</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{versionModalTitle}</p>
                </div>
                <button
                  onClick={() => setVersionModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {versionHistory.length === 0 ? (
                  <p className="text-center py-10 text-zinc-500 text-sm">
                    Chưa có lịch sử phiên bản nào.
                  </p>
                ) : (
                  versionHistory.map((ver) => {
                    const isCurrent = ver.id === currentVersionId;
                    const config = ver.configurationJson as any;
                    const fields = config?.fields || [];
                    const isExpanded = selectedVersionColumns === fields;

                    return (
                      <div
                        key={ver.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-zinc-800/40 border-zinc-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm font-bold text-white">
                              Phiên bản v{ver.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3 h-3 stroke-[3]" /> Hiện hành
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400">
                            {formatDate(ver.createdAt)}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
                          <span>
                            Người cập nhật: Admin #{ver.updatedBy ?? 'Hệ thống'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedVersionColumns(isExpanded ? null : fields)
                            }
                            className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isExpanded ? 'Ẩn danh sách cột' : `Xem danh sách cột (${fields.length})`}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-zinc-500 border-b border-zinc-800">
                                  <th className="pb-1.5">Tiêu đề cột</th>
                                  <th className="pb-1.5">Mã trường</th>
                                  <th className="pb-1.5">Loại</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                                {fields.map((f: any, fIdx: number) => (
                                  <tr key={fIdx}>
                                    <td className="py-1.5 font-medium">{f.label || f.key}</td>
                                    <td className="py-1.5 font-mono text-[11px] text-zinc-400">
                                      {f.key}
                                    </td>
                                    <td className="py-1.5 text-zinc-400">
                                      {f.type === 'currency'
                                        ? 'Số tiền'
                                        : f.type === 'date'
                                        ? 'Ngày'
                                        : f.type === 'number'
                                        ? 'Số lượng'
                                        : 'Văn bản'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end pt-5 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setVersionModalOpen(false)}
                  className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg text-sm"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
