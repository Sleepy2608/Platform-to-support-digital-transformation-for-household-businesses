'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Pencil, RefreshCw, Search, ToggleLeft, ToggleRight,
  Grid3x3, List, X, Check, Link2, Unlink, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  id: number;
  featureCode: string;
  featureName: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PlanFeatureMapping {
  planId: number;
  planCode: string;
  planName: string;
  mappings: FeatureMappingEntry[];
}

interface FeatureMappingEntry {
  featureId: number;
  featureCode: string;
  mapped: boolean;
  enabled: boolean | null;
  quotaLimit: number | null;
}

interface FeatureMatrixData {
  features: Feature[];
  plans: PlanFeatureMapping[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  featureCode: '',
  featureName: '',
  description: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
};

const inputClass =
  'w-full rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-400';

type Tab = 'features' | 'matrix';

// ─── Page Component ───────────────────────────────────────────────────────────

export default function FeatureManagementPage() {
  const [tab, setTab] = useState<Tab>('features');
  const [openCreateModalTrigger, setOpenCreateModalTrigger] = useState(0);

  return (
    <div className="space-y-6 relative pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản lý tính năng</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Quản lý danh sách features hệ thống và phân bổ định mức vào các gói thuê bao.
          </p>
        </div>
        {tab === 'features' && (
          <button
            onClick={() => setOpenCreateModalTrigger((prev) => prev + 1)}
            className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Thêm Feature
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('features')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            tab === 'features'
              ? 'bg-white text-zinc-950 shadow-lg shadow-white/5 scale-[1.02]'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <List className="w-4 h-4" />
          Danh sách Features
        </button>
        <button
          onClick={() => setTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            tab === 'matrix'
              ? 'bg-white text-zinc-950 shadow-lg shadow-white/5 scale-[1.02]'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          Ma trận Package–Feature
        </button>
      </div>

      {tab === 'features' ? (
        <FeaturesTab openTrigger={openCreateModalTrigger} />
      ) : (
        <MatrixTab />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1: Features List
// ═══════════════════════════════════════════════════════════════════════════════

function FeaturesTab({ openTrigger }: { openTrigger: number }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feature | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setFeatures(await apiClient.get<Feature[]>('/api/admin/features'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách tính năng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Open modal from Header button
  useEffect(() => {
    if (openTrigger > 0) {
      setEditing(null);
      setForm(EMPTY_FORM);
      setModalOpen(true);
    }
  }, [openTrigger]);

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

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return features.filter(
      (f) =>
        !q ||
        f.featureCode.toLowerCase().includes(q) ||
        f.featureName.toLowerCase().includes(q)
    );
  }, [features, keyword]);

  const openEdit = (f: Feature) => {
    setEditing(f);
    setForm({
      featureCode: f.featureCode,
      featureName: f.featureName,
      description: f.description || '',
      status: f.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await apiClient.put(`/api/admin/features/${editing.id}`, form);
        setNotice('Cập nhật tính năng thành công');
      } else {
        await apiClient.post('/api/admin/features', form);
        setNotice('Tạo tính năng thành công');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (f: Feature) => {
    try {
      await apiClient.patch(`/api/admin/features/${f.id}/toggle`);
      setNotice(`Đã ${f.status === 'ACTIVE' ? 'tắt' : 'bật'} tính năng "${f.featureName}"`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái');
    }
  };

  return (
    <>
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

      {/* Filter and search bar */}
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-4 gap-3 shadow-sm">
        <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Tìm kiếm tính năng theo mã hoặc tên..."
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
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-zinc-700/80 p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
          title="Tải lại"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold bg-zinc-800/20">
                <th className="p-4 pl-6">Mã tính năng</th>
                <th className="p-4">Tên tính năng</th>
                <th className="p-4 hidden md:table-cell">Mô tả</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 pr-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-zinc-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
                      <span>Đang tải danh sách tính năng...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-zinc-500 text-sm">
                    {keyword
                      ? 'Không tìm thấy tính năng nào khớp với từ khóa'
                      : 'Chưa có tính năng nào được cấu hình'}
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-zinc-300">
                      {f.featureCode}
                    </td>
                    <td className="p-4 font-semibold text-white">{f.featureName}</td>
                    <td className="p-4 text-zinc-400 text-xs hidden md:table-cell max-w-[260px] truncate">
                      {f.description || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          f.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            f.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-zinc-500'
                          }`}
                        />
                        {f.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tắt'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(f)}
                          title={f.status === 'ACTIVE' ? 'Tắt tính năng' : 'Bật tính năng'}
                          className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                        >
                          {f.status === 'ACTIVE' ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(f)}
                          title="Chỉnh sửa tính năng"
                          className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Feature Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                <h2 className="text-xl font-extrabold text-white">
                  {editing ? 'Chỉnh sửa tính năng' : 'Thêm tính năng mới'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Mã tính năng <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={form.featureCode}
                    onChange={(e) => setForm({ ...form, featureCode: e.target.value })}
                    placeholder="VD: EMPLOYEE_MANAGEMENT"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Tên tính năng <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={form.featureName}
                    onChange={(e) => setForm({ ...form, featureName: e.target.value })}
                    placeholder="VD: Quản lý nhân viên"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    className={`${inputClass} resize-none h-24`}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả phạm vi hoặc nghiệp vụ của tính năng..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Trạng thái
                  </label>
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                    }
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Tắt</option>
                  </select>
                </div>

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
                    className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2: Feature Matrix
// ═══════════════════════════════════════════════════════════════════════════════

interface QuotaEditState {
  planId: number;
  planName: string;
  planCode: string;
  featureId: number;
  featureName: string;
  featureCode: string;
  isMapped: boolean;
  isUnlimited: boolean;
  quotaLimit: number | '';
}

function MatrixTab() {
  const [matrix, setMatrix] = useState<FeatureMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editModal, setEditModal] = useState<QuotaEditState | null>(null);
  const [savingModal, setSavingModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMatrix(await apiClient.get<FeatureMatrixData>('/api/admin/features/matrix'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ma trận');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const openEditModal = (
    plan: PlanFeatureMapping,
    feature: Feature,
    entry?: FeatureMappingEntry
  ) => {
    const isMapped = entry?.mapped ?? false;
    setEditModal({
      planId: plan.planId,
      planName: plan.planName,
      planCode: plan.planCode,
      featureId: feature.id,
      featureName: feature.featureName,
      featureCode: feature.featureCode,
      isMapped,
      isUnlimited: isMapped ? entry?.quotaLimit == null : true,
      quotaLimit: entry?.quotaLimit ?? '',
    });
  };

  const handleSaveModal = async () => {
    if (!editModal) return;
    setSavingModal(true);
    setError('');
    try {
      if (!editModal.isMapped) {
        await apiClient.delete(
          `/api/admin/features/matrix/unmap?planId=${editModal.planId}&featureId=${editModal.featureId}`
        );
        setNotice(`Đã khóa "${editModal.featureName}" khỏi gói ${editModal.planName}`);
      } else {
        const quota =
          editModal.isUnlimited || editModal.quotaLimit === ''
            ? null
            : Math.max(1, Number(editModal.quotaLimit));

        await apiClient.post('/api/admin/features/matrix/map', {
          planId: editModal.planId,
          featureId: editModal.featureId,
          enabled: true,
          quotaLimit: quota,
        });
        setNotice(
          `Đã cập nhật định mức "${editModal.featureName}" cho gói ${editModal.planName} (${
            quota ? `≤${quota}` : 'Không giới hạn'
          })`
        );
      }
      setEditModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu');
    } finally {
      setSavingModal(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
        <span className="text-sm">Đang tải ma trận Package–Feature...</span>
      </div>
    );
  }

  if (!matrix || matrix.plans.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-2xl">
        Chưa có dữ liệu. Hãy tạo gói thuê bao và tính năng trước.
      </div>
    );
  }

  return (
    <>
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

      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-zinc-700/80 p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer disabled:opacity-50"
          title="Tải lại ma trận"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại ma trận
        </button>
      </div>

      {/* Matrix Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/20">
                <th className="text-left px-5 py-4 font-semibold text-zinc-400 sticky left-0 bg-zinc-900 z-10 min-w-[220px]">
                  Tính năng
                </th>
                {matrix.plans.map((plan) => (
                  <th
                    key={plan.planId}
                    className="text-center px-5 py-4 font-semibold text-zinc-300 min-w-[140px]"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-mono text-zinc-400">{plan.planCode}</span>
                      <span className="text-sm font-bold text-white">{plan.planName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {matrix.features.map((feature) => (
                <tr
                  key={feature.id}
                  className="hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-5 py-3.5 sticky left-0 bg-zinc-900 z-10">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold text-sm">
                        {feature.featureName}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {feature.featureCode}
                      </span>
                    </div>
                  </td>
                  {matrix.plans.map((plan) => {
                    const entry = plan.mappings.find((m) => m.featureId === feature.id);
                    const isMapped = entry?.mapped ?? false;

                    return (
                      <td key={plan.planId} className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => openEditModal(plan, feature, entry)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                            isMapped
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 hover:bg-zinc-700/60 hover:text-zinc-300'
                          }`}
                          title="Click để chỉnh sửa định mức / bật tắt"
                        >
                          {isMapped ? (
                            <>
                              <Link2 className="w-3.5 h-3.5" />
                              {entry?.quotaLimit != null ? `≤${entry.quotaLimit}` : '∞'}
                            </>
                          ) : (
                            <>
                              <Unlink className="w-3.5 h-3.5" />
                              —
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quota Configuration Modal */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                <div>
                  <h2 className="text-base font-extrabold text-white">Cấu hình định mức tính năng</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Gói <span className="text-white font-semibold">{editModal.planName}</span>{' '}
                    • <span className="text-zinc-300">{editModal.featureName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setEditModal(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Trạng thái trong gói
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditModal({ ...editModal, isMapped: true })}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editModal.isMapped
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <Link2 className="w-4 h-4" /> Được phép dùng
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditModal({ ...editModal, isMapped: false })}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !editModal.isMapped
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-sm'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <Unlink className="w-4 h-4" /> Khóa tính năng
                    </button>
                  </div>
                </div>

                {/* Quota Setting */}
                {editModal.isMapped && (
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Định mức sử dụng (Quota)
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer text-sm text-zinc-200">
                      <input
                        type="radio"
                        name="quotaType"
                        checked={editModal.isUnlimited}
                        onChange={() =>
                          setEditModal({ ...editModal, isUnlimited: true, quotaLimit: '' })
                        }
                        className="accent-white w-4 h-4 cursor-pointer"
                      />
                      <span className="font-medium">Không giới hạn (∞)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer text-sm text-zinc-200">
                      <input
                        type="radio"
                        name="quotaType"
                        checked={!editModal.isUnlimited}
                        onChange={() =>
                          setEditModal({
                            ...editModal,
                            isUnlimited: false,
                            quotaLimit: editModal.quotaLimit || 20,
                          })
                        }
                        className="accent-white w-4 h-4 cursor-pointer"
                      />
                      <span className="font-medium">Giới hạn số lượng (≤ N)</span>
                    </label>

                    {!editModal.isUnlimited && (
                      <div className="pt-2 pl-7">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 font-medium">Tối đa:</span>
                          <input
                            type="number"
                            min="1"
                            max="1000000"
                            value={editModal.quotaLimit}
                            onChange={(e) =>
                              setEditModal({
                                ...editModal,
                                quotaLimit: e.target.value === '' ? '' : Number(e.target.value),
                              })
                            }
                            placeholder="VD: 20, 50, 100..."
                            className="w-32 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white font-bold outline-none focus:border-zinc-400"
                            autoFocus
                          />
                          <span className="text-xs text-zinc-500">(đơn vị/lần)</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1.5">
                          Người dùng gói này sẽ bị chặn khi số lượng đạt tới mức này.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-5 py-2.5 border border-zinc-700/80 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={savingModal}
                  className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {savingModal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {savingModal ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mt-4 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-xs text-zinc-400 shadow-sm">
        <span className="font-semibold text-zinc-300">Chú thích ma trận:</span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            <Link2 className="w-3.5 h-3.5" /> ∞
          </span>
          = Đã kích hoạt (Không giới hạn định mức)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            <Link2 className="w-3.5 h-3.5" /> ≤ N
          </span>
          = Đã kích hoạt (Có giới hạn định mức: SP, đơn hàng, nhân viên...)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-semibold">
            <Unlink className="w-3.5 h-3.5" /> —
          </span>
          = Chưa kích hoạt (Bị khóa trong gói này)
        </span>
      </div>
    </>
  );
}
