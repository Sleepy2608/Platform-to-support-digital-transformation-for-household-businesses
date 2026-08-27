'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes, Plus, Pencil, RefreshCw, Search, ToggleLeft, ToggleRight,
  Grid3x3, List, X, Check, Link2, Unlink,
} from 'lucide-react';
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
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-zinc-400';

type Tab = 'features' | 'matrix';

// ─── Page Component ───────────────────────────────────────────────────────────

export default function FeatureManagementPage() {
  const [tab, setTab] = useState<Tab>('features');

  return (
    <div className="p-6 md:p-10 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-sm">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Quản lý tính năng</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Quản lý danh sách features hệ thống và phân bổ vào các gói thuê bao
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('features')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
            ${tab === 'features'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
        >
          <List className="w-4 h-4" />
          Danh sách Features
        </button>
        <button
          onClick={() => setTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
            ${tab === 'matrix'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
        >
          <Grid3x3 className="w-4 h-4" />
          Ma trận Package–Feature
        </button>
      </div>

      {tab === 'features' ? <FeaturesTab /> : <MatrixTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1: Features List
// ═══════════════════════════════════════════════════════════════════════════════

function FeaturesTab() {
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
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return features.filter(
      (f) =>
        !q ||
        f.featureCode.toLowerCase().includes(q) ||
        f.featureName.toLowerCase().includes(q)
    );
  }, [features, keyword]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

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
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
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
      setError(err instanceof Error ? err.message : 'Không thể toggle');
    }
  };

  return (
    <>
      {/* Notices */}
      {notice && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-sm px-4 py-3 rounded-xl">
          <Check className="w-4 h-4" />
          {notice}
          <button onClick={() => setNotice('')} className="ml-auto cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-900/40 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
          <button onClick={() => setError('')} className="ml-2 cursor-pointer"><X className="w-4 h-4 inline" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tính năng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white outline-none focus:border-zinc-400"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm Feature
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left px-5 py-3.5 font-semibold">Mã</th>
                <th className="text-left px-5 py-3.5 font-semibold">Tên tính năng</th>
                <th className="text-left px-5 py-3.5 font-semibold hidden md:table-cell">Mô tả</th>
                <th className="text-center px-5 py-3.5 font-semibold">Trạng thái</th>
                <th className="text-center px-5 py-3.5 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-zinc-500">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-zinc-500">Không có tính năng nào</td></tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-indigo-400">{f.featureCode}</td>
                    <td className="px-5 py-3.5 text-white font-medium">{f.featureName}</td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs hidden md:table-cell max-w-[200px] truncate">
                      {f.description || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${f.status === 'ACTIVE'
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${f.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        {f.status === 'ACTIVE' ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggle(f)}
                          title={f.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
                          className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
                        >
                          {f.status === 'ACTIVE'
                            ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                            : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(f)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition cursor-pointer"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">
                {editing ? 'Chỉnh sửa tính năng' : 'Thêm tính năng mới'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Mã tính năng</label>
                <input
                  className={inputClass}
                  value={form.featureCode}
                  onChange={(e) => setForm({ ...form, featureCode: e.target.value })}
                  placeholder="VD: EMPLOYEE_MANAGEMENT"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Tên tính năng</label>
                <input
                  className={inputClass}
                  value={form.featureName}
                  onChange={(e) => setForm({ ...form, featureName: e.target.value })}
                  placeholder="VD: Quản lý nhân viên"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Mô tả</label>
                <textarea
                  className={`${inputClass} resize-none h-20`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả tính năng..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Trạng thái</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Tắt</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2: Feature Matrix
// ═══════════════════════════════════════════════════════════════════════════════

function MatrixTab() {
  const [matrix, setMatrix] = useState<FeatureMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingCell, setSavingCell] = useState<string | null>(null);

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

  const handleToggleMapping = async (planId: number, featureId: number, isMapped: boolean) => {
    const cellKey = `${planId}-${featureId}`;
    setSavingCell(cellKey);
    try {
      if (isMapped) {
        await apiClient.delete(`/api/admin/features/matrix/unmap?planId=${planId}&featureId=${featureId}`);
        setNotice('Đã gỡ tính năng khỏi gói');
      } else {
        await apiClient.post('/api/admin/features/matrix/map', {
          planId,
          featureId,
          enabled: true,
          quotaLimit: null,
        });
        setNotice('Đã thêm tính năng vào gói');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSavingCell(null);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-zinc-500">Đang tải ma trận...</div>;
  }

  if (!matrix || matrix.plans.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        Chưa có dữ liệu. Hãy tạo gói thuê bao và tính năng trước.
      </div>
    );
  }

  return (
    <>
      {notice && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-sm px-4 py-3 rounded-xl">
          <Check className="w-4 h-4" />
          {notice}
          <button onClick={() => setNotice('')} className="ml-auto cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-900/40 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
          <button onClick={() => setError('')} className="ml-2 cursor-pointer"><X className="w-4 h-4 inline" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </button>
      </div>

      {/* Matrix Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3.5 font-semibold text-zinc-400 sticky left-0 bg-zinc-900 z-10 min-w-[200px]">
                  Tính năng
                </th>
                {matrix.plans.map((plan) => (
                  <th key={plan.planId} className="text-center px-5 py-3.5 font-semibold text-zinc-300 min-w-[140px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-mono text-indigo-400">{plan.planCode}</span>
                      <span>{plan.planName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.features.map((feature) => (
                <tr key={feature.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3.5 sticky left-0 bg-zinc-900 z-10">
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm">{feature.featureName}</span>
                      <span className="text-xs font-mono text-zinc-500">{feature.featureCode}</span>
                    </div>
                  </td>
                  {matrix.plans.map((plan) => {
                    const entry = plan.mappings.find((m) => m.featureId === feature.id);
                    const isMapped = entry?.mapped ?? false;
                    const cellKey = `${plan.planId}-${feature.id}`;
                    const isSaving = savingCell === cellKey;

                    return (
                      <td key={plan.planId} className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleMapping(plan.planId, feature.id, isMapped)}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50
                            ${isMapped
                              ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 hover:bg-red-900/40 hover:text-red-400 hover:border-red-700/50'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-indigo-900/40 hover:text-indigo-400 hover:border-indigo-700/50'}`}
                          title={isMapped ? 'Click để gỡ' : 'Click để thêm'}
                        >
                          {isSaving ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : isMapped ? (
                            <>
                              <Link2 className="w-3 h-3" />
                              {entry?.quotaLimit != null ? `≤${entry.quotaLimit}` : '∞'}
                            </>
                          ) : (
                            <>
                              <Unlink className="w-3 h-3" />
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mt-4 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs text-zinc-400">
        <span className="font-semibold text-zinc-300">Chú thích ma trận:</span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 font-semibold">
            <Link2 className="w-3.5 h-3.5" /> ∞
          </span>
          = Đã kích hoạt (Không giới hạn định mức)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 font-semibold">
            <Link2 className="w-3.5 h-3.5" /> ≤ N
          </span>
          = Đã kích hoạt (Có giới hạn định mức: SP, đơn hàng, nhân viên...)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold">
            <Unlink className="w-3.5 h-3.5" /> —
          </span>
          = Chưa kích hoạt (Bị khóa trong gói này)
        </span>
      </div>
    </>
  );
}
