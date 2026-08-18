'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lock, LogOut, Search, Shield, Store, Unlock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearAuth, getAccessToken } from '../lib/apiClient';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'LOCKED' | 'DEACTIVATED';

interface BusinessOwner {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  status: UserStatus;
  businessId?: number | null;
}

const statusLabel: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động', INACTIVE: 'Không hoạt động', PENDING_VERIFICATION: 'Chờ xác thực', LOCKED: 'Đã khóa', DEACTIVATED: 'Đã hủy',
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOwners = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8080/api/manager/business-owners', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Không thể tải danh sách chủ hộ kinh doanh');
      setOwners(Array.isArray(result.data) ? result.data : []);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOwners(), 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const filteredOwners = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return owners;
    return owners.filter((owner) => [owner.fullName, owner.username, owner.email, owner.phone ?? '']
      .some((value) => value.toLowerCase().includes(keyword)));
  }, [owners, search]);

  const updateStatus = async (owner: BusinessOwner) => {
    const status: UserStatus = owner.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    setUpdatingId(owner.id);
    setError('');
    try {
      const response = await fetch(`http://localhost:8080/api/manager/business-owners/${owner.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Không thể cập nhật trạng thái');
      setOwners((current) => current.map((item) => item.id === owner.id ? result.data : item));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5"><div className="rounded-lg border border-indigo-500/20 bg-indigo-600/10 p-2 text-indigo-400"><Shield className="h-5 w-5" /></div><span className="text-lg font-bold tracking-tight">CỔNG MANAGER</span></div>
          <button onClick={() => { clearAuth(); router.push('/login'); }} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"><LogOut className="h-4 w-4" />Đăng xuất</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-indigo-400"><Users className="h-6 w-6" /></div><div><h1 className="text-2xl font-extrabold sm:text-3xl">Quản lý Chủ hộ kinh doanh</h1><p className="mt-1 text-sm text-zinc-400">Theo dõi, khóa hoặc mở khóa tài khoản chủ hộ kinh doanh.</p></div></div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Tổng chủ hộ" value={owners.length} />
          <Stat label="Đang hoạt động" value={owners.filter((owner) => owner.status === 'ACTIVE').length} color="text-emerald-400" />
          <Stat label="Đã khóa" value={owners.filter((owner) => owner.status === 'LOCKED').length} color="text-red-400" />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3"><Search className="h-5 w-5 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, tên đăng nhập, email hoặc số điện thoại..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500" /></div>
        {error && <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          {loading ? <div className="p-12 text-center text-zinc-400">Đang tải danh sách chủ hộ...</div> : filteredOwners.length === 0 ? <div className="p-12 text-center text-zinc-500">Chưa có chủ hộ kinh doanh phù hợp.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-zinc-800/40 text-zinc-400"><tr><th className="p-4">Chủ hộ</th><th className="p-4">Liên hệ</th><th className="p-4">Cửa hàng</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-zinc-800">{filteredOwners.map((owner) => <tr key={owner.id} className="hover:bg-zinc-800/30"><td className="p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 font-bold text-indigo-300">{owner.fullName.charAt(0).toUpperCase()}</div><div><p className="font-semibold">{owner.fullName}</p><p className="font-mono text-xs text-zinc-500">@{owner.username}</p></div></div></td><td className="p-4 text-zinc-300"><p>{owner.email}</p><p className="mt-1 text-xs text-zinc-500">{owner.phone || '—'}</p></td><td className="p-4 text-zinc-400"><span className="inline-flex items-center gap-1"><Store className="h-3.5 w-3.5" />{owner.businessId ? `ID #${owner.businessId}` : 'Chưa tạo hồ sơ'}</span></td><td className="p-4"><StatusBadge status={owner.status} /></td><td className="p-4 text-right"><button disabled={updatingId === owner.id} onClick={() => void updateStatus(owner)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50">{owner.status === 'LOCKED' ? <Unlock className="h-4 w-4 text-emerald-400" /> : <Lock className="h-4 w-4 text-red-400" />}{updatingId === owner.id ? 'Đang cập nhật...' : owner.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}</button></td></tr>)}</tbody></table></div>}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-xs font-semibold uppercase text-zinc-500">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p></div>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  const color = status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : status === 'LOCKED' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{statusLabel[status]}</span>;
}
