'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  History,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Unlock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';

type BypassKeyStatus = 'ACTIVE' | 'DISABLED' | 'DEPLETED' | 'EXPIRED';

interface BypassKey {
  id: number;
  keyCode: string;
  maxUses: number;
  usedCount: number;
  discountPercent: number;
  status: BypassKeyStatus;
  statusDescription: string;
  note: string | null;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isUsable: boolean;
}

interface BypassKeySummary {
  totalKeys: number;
  activeKeys: number;
  depletedKeys: number;
  disabledKeys: number;
  expiredKeys: number;
  totalUsages: number;
}

interface BypassKeyUsage {
  id: number;
  bypassKeyId: number;
  keyCode: string;
  userId: number;
  username: string;
  businessId: number;
  packageType: string;
  billingCycle: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  usedAt: string;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export default function AdminBypassKeysPage() {
  const [keys, setKeys] = useState<BypassKey[]>([]);
  const [summary, setSummary] = useState<BypassKeySummary | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Notice Toast
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [createForm, setCreateForm] = useState({
    keyCode: '',
    maxUses: 1,
    note: '',
    expiresAt: '',
  });

  // Usages Modal State
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedKeyForUsage, setSelectedKeyForUsage] = useState<BypassKey | null>(null);
  const [usages, setUsages] = useState<BypassKeyUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<BypassKey | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiClient.get<BypassKeySummary>('/api/admin/bypass-keys/summary');
      setSummary(data);
    } catch {
      // silently ignore summary fail
    }
  }, []);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.append('keyword', keyword.trim());
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('size', '10');

      const data = await apiClient.get<SpringPage<BypassKey>>(`/api/admin/bypass-keys?${params.toString()}`);
      setKeys(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể tải danh sách Bypass Key', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadKeys();
  }, [loadKeys]);

  // Sinh mã 20 chữ số ngẫu nhiên cho modal tạo mới
  const fetchRandomCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await apiClient.get<{ keyCode: string }>('/api/admin/bypass-keys/generate-code');
      if (res && res.keyCode) {
        setCreateForm((prev) => ({ ...prev, keyCode: res.keyCode }));
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể sinh mã ngẫu nhiên', 'error');
    } finally {
      setGeneratingCode(false);
    }
  };

  const openCreateModal = () => {
    setCreateForm({
      keyCode: '',
      maxUses: 1,
      note: '',
      expiresAt: '',
    });
    setCreateModalOpen(true);
    void fetchRandomCode();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.maxUses || createForm.maxUses < 1) {
      showToast('Số lượt dùng phải từ 1 trở lên', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post('/api/admin/bypass-keys', {
        keyCode: createForm.keyCode.trim(),
        maxUses: Number(createForm.maxUses),
        note: createForm.note.trim() || null,
        expiresAt: createForm.expiresAt ? new Date(createForm.expiresAt).toISOString() : null,
      });

      setCreateModalOpen(false);
      showToast('Tạo Bypass Key mới thành công!');
      void loadSummary();
      void loadKeys();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Tạo Bypass Key thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (key: BypassKey) => {
    const newStatus: BypassKeyStatus = key.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setActionLoading(true);
    try {
      await apiClient.put(`/api/admin/bypass-keys/${key.id}/status`, { status: newStatus });
      showToast(`Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'tạm khóa'} key ${key.keyCode}`);
      void loadSummary();
      void loadKeys();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!keyToDelete) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/api/admin/bypass-keys/${keyToDelete.id}`);
      setDeleteModalOpen(false);
      setKeyToDelete(null);
      showToast('Đã xóa Bypass Key thành công');
      void loadSummary();
      void loadKeys();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể xóa Bypass Key', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openUsagesModal = async (key: BypassKey) => {
    setSelectedKeyForUsage(key);
    setUsageModalOpen(true);
    setLoadingUsages(true);
    try {
      const data = await apiClient.get<BypassKeyUsage[]>(`/api/admin/bypass-keys/${key.id}/usages`);
      setUsages(data || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể tải lịch sử sử dụng', 'error');
    } finally {
      setLoadingUsages(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Không thời hạn';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: BypassKeyStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Đang hoạt động
          </span>
        );
      case 'DEPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-700/50 text-zinc-300 border border-zinc-600">
            Hết lượt dùng
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Tạm khóa
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Đã hết hạn
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold ${
              notice.type === 'success'
                ? 'bg-zinc-900 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900 border-rose-500/40 text-rose-300'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Quản lý Bypass Key</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Khóa kích hoạt giảm giá 100% dành cho đối tác, khách hàng VIP và kiểm thử hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 font-bold text-sm rounded-xl transition shadow-lg shadow-white/5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bypass Key mới</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng số Key</span>
          <div className="text-2xl font-black text-white mt-1.5">{summary?.totalKeys ?? 0}</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Đang hoạt động</span>
          <div className="text-2xl font-black text-emerald-400 mt-1.5">{summary?.activeKeys ?? 0}</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Đã hết lượt dùng</span>
          <div className="text-2xl font-black text-zinc-300 mt-1.5">{summary?.depletedKeys ?? 0}</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Tổng lượt đã dùng</span>
          <div className="text-2xl font-black text-amber-400 mt-1.5">{summary?.totalUsages ?? 0}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full sm:max-w-md items-center gap-2 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo mã 20 số hoặc ghi chú..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
          />
          {keyword && (
            <button type="button" onClick={() => setKeyword('')} className="p-0.5 text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-xl outline-none focus:border-zinc-600 transition"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="DISABLED">Tạm khóa</option>
            <option value="DEPLETED">Hết lượt dùng</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>

          <button
            type="button"
            onClick={() => {
              void loadSummary();
              void loadKeys();
            }}
            disabled={loading}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
              <tr>
                <th className="px-6 py-4">Mã Bypass Key</th>
                <th className="px-6 py-4">Lượt dùng</th>
                <th className="px-6 py-4">Ưu đãi</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ghi chú & Thời hạn</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading && keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                    <span>Đang tải danh sách Bypass Key...</span>
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <KeyRound className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                    <p className="font-semibold text-zinc-400">Chưa có mã Bypass Key nào</p>
                    <p className="text-xs text-zinc-600 mt-1">Bấm &quot;Tạo Bypass Key mới&quot; để phát hành mã đầu tiên.</p>
                  </td>
                </tr>
              ) : (
                keys.map((key) => {
                  const usageRatio = key.maxUses > 0 ? (key.usedCount / key.maxUses) * 100 : 0;
                  return (
                    <tr key={key.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Key Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white tracking-wider bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                            {key.keyCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(key.keyCode)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                            title="Sao chép mã"
                          >
                            {copiedKey === key.keyCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                            <span>{key.usedCount}</span>
                            <span className="text-zinc-500">/</span>
                            <span className="text-zinc-400">{key.maxUses} lượt</span>
                          </div>
                          <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                usageRatio >= 100 ? 'bg-zinc-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(usageRatio, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Tag className="w-3 h-3" />
                          Giảm 100%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(key.status)}</td>

                      {/* Note & Expires */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs space-y-0.5">
                          <p className="text-xs font-medium text-zinc-300 truncate">{key.note || 'Không có ghi chú'}</p>
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDateTime(key.expiresAt)}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openUsagesModal(key)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Xem lịch sử sử dụng"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(key)}
                            disabled={actionLoading}
                            className={`p-2 rounded-lg transition cursor-pointer ${
                              key.status === 'ACTIVE'
                                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                            title={key.status === 'ACTIVE' ? 'Tạm khóa key này' : 'Kích hoạt lại'}
                          >
                            {key.status === 'ACTIVE' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setKeyToDelete(key);
                              setDeleteModalOpen(true);
                            }}
                            disabled={actionLoading}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                            title="Xóa key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Trang {page + 1} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tạo Key mới */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-white text-base">Tạo Bypass Key mới</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                {/* 20 Digit Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Mã Bypass Key (20 chữ số)
                    </label>
                    <button
                      type="button"
                      onClick={fetchRandomCode}
                      disabled={generatingCode}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generatingCode ? 'animate-spin' : ''}`} />
                      <span>Đổi mã khác</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={20}
                      value={createForm.keyCode}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, keyCode: e.target.value.replace(/[^0-9]/g, '') })
                      }
                      placeholder="84920194857201948201"
                      className="w-full font-mono text-base font-bold tracking-widest px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Hệ thống tự động sinh 20 chữ số ngẫu nhiên an toàn. Bạn cũng có thể tự chỉnh sửa nếu muốn.
                  </p>
                </div>

                {/* Max Uses */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Số lần sử dụng tối đa
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={createForm.maxUses}
                    onChange={(e) => setCreateForm({ ...createForm, maxUses: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-amber-500 transition text-sm"
                    required
                  />
                  <div className="flex gap-2">
                    {[1, 5, 10, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, maxUses: num })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                          createForm.maxUses === num
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {num} lần
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Ghi chú / Mục đích sử dụng (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    maxLength={255}
                    value={createForm.note}
                    onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
                    placeholder="Ví dụ: Cấp cho Hộ kinh doanh Anh Minh thử nghiệm gói VIP"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-amber-500 transition text-sm placeholder:text-zinc-600"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Thời hạn sử dụng (Tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.expiresAt}
                    onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-amber-500 transition text-sm"
                  />
                  <p className="text-[11px] text-zinc-500">Để trống nếu không có thời hạn hết hiệu lực.</p>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 text-sm font-bold rounded-xl transition shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{actionLoading ? 'Đang tạo...' : 'Tạo Bypass Key'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Lịch sử Sử dụng */}
      <AnimatePresence>
        {usageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-400" />
                    Lịch sử sử dụng Bypass Key
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Mã khóa: <span className="font-mono text-white font-bold">{selectedKeyForUsage?.keyCode}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUsageModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {loadingUsages ? (
                  <div className="py-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                    <span>Đang tải nhật ký sử dụng...</span>
                  </div>
                ) : usages.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                    <p className="font-semibold text-zinc-400">Chưa có ai sử dụng mã key này</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Khi có người dùng nhập mã này khi thanh toán, lịch sử sẽ xuất hiện tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usages.map((u) => (
                      <div
                        key={u.id}
                        className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{u.username}</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                              HKD #{u.businessId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                            <span>Gói: <strong className="text-amber-400">{u.packageType}</strong></span>
                            <span>•</span>
                            <span>{u.billingCycle === 'YEARLY' ? 'Theo năm' : 'Theo tháng'}</span>
                            <span>•</span>
                            <span>Giảm: <strong className="text-emerald-400">100%</strong></span>
                          </div>
                        </div>

                        <div className="text-right text-xs text-zinc-500">
                          <p>{formatDateTime(u.usedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Xóa Key */}
      <AnimatePresence>
        {deleteModalOpen && keyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Xác nhận xóa Bypass Key</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Bạn có chắc chắn muốn xóa mã khóa <span className="font-mono font-bold text-white">{keyToDelete.keyCode}</span>?
                  Lưu ý: Nếu key đã có lượt sử dụng thực tế, hệ thống sẽ ngăn chặn việc xóa để đảm bảo toàn vẹn dữ liệu kế toán.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
