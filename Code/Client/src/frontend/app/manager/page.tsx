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
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Không hoạt động',
  PENDING_VERIFICATION: 'Chờ xác thực',
  LOCKED: 'Đã khóa',
  DEACTIVATED: 'Đã hủy',
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
    return owners.filter((owner) =>
      [owner.fullName, owner.username, owner.email, owner.phone ?? ''].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    );
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
      setOwners((current) => current.map((item) => (item.id === owner.id ? result.data : item)));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-slate-900 p-2 text-white shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">MANAGER</span>
          </div>
          <button
            onClick={() => {
              clearAuth();
              router.push('/login');
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Quản lý Chủ hộ kinh doanh
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Theo dõi, khóa hoặc mở khóa tài khoản chủ hộ kinh doanh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Tổng chủ hộ" value={owners.length} />
          <Stat
            label="Đang hoạt động"
            value={owners.filter((owner) => owner.status === 'ACTIVE').length}
            color="text-emerald-700"
          />
          <Stat
            label="Đã khóa"
            value={owners.filter((owner) => owner.status === 'LOCKED').length}
            color="text-red-700"
          />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, tên đăng nhập, email hoặc số điện thoại..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-xs">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Đang tải danh sách chủ hộ...</div>
          ) : filteredOwners.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">Chưa có chủ hộ kinh doanh phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-4">Chủ hộ</th>
                    <th className="p-4">Liên hệ</th>
                    <th className="p-4">Cửa hàng</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOwners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-bold shadow-xs">
                            {owner.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{owner.fullName}</p>
                            <p className="font-mono text-xs text-slate-500">@{owner.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700">
                        <p className="font-medium">{owner.email}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{owner.phone || '—'}</p>
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Store className="h-3.5 w-3.5 text-slate-400" />
                          {owner.businessId ? `ID #${owner.businessId}` : 'Chưa tạo hồ sơ'}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={owner.status} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={updatingId === owner.id}
                          onClick={() => void updateStatus(owner)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer ${
                            owner.status === 'LOCKED'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {owner.status === 'LOCKED' ? (
                            <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-red-600" />
                          )}
                          {updatingId === owner.id
                            ? 'Đang cập nhật...'
                            : owner.status === 'LOCKED'
                            ? 'Mở khóa'
                            : 'Khóa tài khoản'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const style =
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : status === 'LOCKED'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : 'bg-slate-100 text-slate-600 border border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-2xs ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-600' : status === 'LOCKED' ? 'bg-red-600' : 'bg-slate-400'}`} />
      {statusLabel[status]}
    </span>
  );
}
