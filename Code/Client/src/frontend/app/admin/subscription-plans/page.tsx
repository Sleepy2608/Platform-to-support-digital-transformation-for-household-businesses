'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, BadgeDollarSign, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

type Status = 'ACTIVE' | 'INACTIVE';

interface SubscriptionPlan {
  id: number;
  planCode: string;
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  description?: string;
  status: Status;
}

const EMPTY_FORM = {
  planCode: '', planName: '', monthlyPrice: '', annualPrice: '', description: '', status: 'ACTIVE' as Status,
};

const inputClass = 'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-zinc-400';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPlans(await apiClient.get<SubscriptionPlan[]>('/api/admin/subscription-plans'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách gói');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPlans();
  }, [loadPlans]);

  const filteredPlans = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return plans.filter((plan) =>
      (!status || plan.status === status)
      && (!query || `${plan.planCode} ${plan.planName}`.toLowerCase().includes(query))
    );
  }, [keyword, plans, status]);

  const openModal = (plan?: SubscriptionPlan) => {
    setEditing(plan || null);
    setForm(plan ? {
      planCode: plan.planCode,
      planName: plan.planName,
      monthlyPrice: String(plan.monthlyPrice),
      annualPrice: String(plan.annualPrice),
      description: plan.description || '',
      status: plan.status,
    } : EMPTY_FORM);
    setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      monthlyPrice: Number(form.monthlyPrice),
      annualPrice: Number(form.annualPrice),
    };
    try {
      if (editing) {
        await apiClient.put(`/api/admin/subscription-plans/${editing.id}`, payload);
      } else {
        await apiClient.post('/api/admin/subscription-plans', payload);
      }
      setModalOpen(false);
      setNotice(editing ? 'Đã cập nhật gói thuê bao' : 'Đã tạo gói thuê bao');
      window.setTimeout(() => setNotice(''), 2500);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu gói thuê bao');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (plan: SubscriptionPlan) => {
    if (!window.confirm(`Vô hiệu hóa gói ${plan.planName}? Người dùng mới sẽ không thể chọn gói này.`)) return;
    setError('');
    try {
      await apiClient.delete(`/api/admin/subscription-plans/${plan.id}`);
      setNotice('Đã vô hiệu hóa gói thuê bao');
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể vô hiệu hóa gói');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Gói thuê bao</h1>
          <p className="mt-2 text-sm text-zinc-400">Quản lý giá tháng, giá năm và trạng thái hiển thị của từng gói.</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-zinc-950 hover:bg-zinc-200">
          <Plus className="h-4 w-4" /> Thêm gói
        </button>
      </header>

      {(error || notice) && <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-900/70 bg-red-950/40 text-red-300' : 'border-emerald-900/70 bg-emerald-950/40 text-emerald-300'}`}>{error || notice}</div>}

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="grid gap-3 border-b border-zinc-800 p-4 sm:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo mã hoặc tên gói..." className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-zinc-400" />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none">
            <option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng sử dụng</option>
          </select>
          <button onClick={() => void loadPlans()} className="rounded-xl border border-zinc-700 p-2.5 text-zinc-400 hover:bg-zinc-800" title="Tải lại"><RefreshCw className="h-4 w-4" /></button>
        </div>

        {loading ? <div className="flex h-64 items-center justify-center text-sm text-zinc-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải...</div>
          : filteredPlans.length === 0 ? <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-500"><BadgeDollarSign className="h-11 w-11 stroke-1" /><p>Chưa có gói thuê bao phù hợp</p></div>
          : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-zinc-950/70 text-xs uppercase text-zinc-500"><tr><th className="px-5 py-3">Gói</th><th className="px-5 py-3">Giá tháng</th><th className="px-5 py-3">Giá năm</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-zinc-800">{filteredPlans.map((plan) => <tr key={plan.id} className="hover:bg-zinc-800/40"><td className="px-5 py-4"><p className="font-bold text-white">{plan.planName}</p><p className="mt-1 text-xs text-zinc-500">{plan.planCode} · {plan.description || 'Không có mô tả'}</p></td><td className="px-5 py-4 font-semibold text-zinc-200">{formatVnd(plan.monthlyPrice)}</td><td className="px-5 py-4 font-semibold text-zinc-200">{formatVnd(plan.annualPrice)}</td><td className="px-5 py-4"><StatusBadge status={plan.status} /></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openModal(plan)} className="rounded-lg border border-zinc-700 p-2 text-zinc-300 hover:bg-zinc-800" title="Chỉnh sửa"><Pencil className="h-4 w-4" /></button><button disabled={plan.status === 'INACTIVE'} onClick={() => void deactivate(plan)} className="rounded-lg border border-zinc-700 p-2 text-red-400 hover:bg-red-950/40 disabled:opacity-30" title="Vô hiệu hóa"><Archive className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}
      </section>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"><div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4"><h2 className="text-lg font-black text-white">{editing ? 'Cập nhật gói thuê bao' : 'Thêm gói thuê bao'}</h2><button onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2"><Field label="Mã gói"><input required maxLength={30} value={form.planCode} onChange={(e) => setForm({ ...form, planCode: e.target.value })} className={inputClass} /></Field><Field label="Tên gói"><input required maxLength={100} value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className={inputClass} /></Field><Field label="Giá theo tháng"><input required min="0" step="1000" type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} className={inputClass} /></Field><Field label="Giá theo năm"><input required min="0" step="1000" type="number" value={form.annualPrice} onChange={(e) => setForm({ ...form, annualPrice: e.target.value })} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Mô tả"><textarea rows={3} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} /></Field></div><Field label="Trạng thái"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} className={inputClass}><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng sử dụng</option></select></Field><div className="flex items-end"><button disabled={saving} type="submit" className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-zinc-950 hover:bg-zinc-200 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></form></div></div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</span>{children}</label>;
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300' : 'bg-zinc-800 text-zinc-400'}`}>{status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng sử dụng'}</span>;
}

function formatVnd(value: number) {
  return `${Number(value).toLocaleString('vi-VN')}đ`;
}
