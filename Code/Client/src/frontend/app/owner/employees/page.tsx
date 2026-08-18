'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, MoreVertical, Lock, LockOpen, KeyRound,
  Trash2, Eye, UserCheck, UserX, X, ChevronLeft, ChevronRight,
  Users, RefreshCw, AlertCircle, CheckCircle2, Copy, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'DEACTIVATED' | 'PENDING_VERIFICATION';

interface Employee {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: EmployeeStatus;
  position: string | null;
  joinDate: string | null;
  terminationDate: string | null;
  createdAt: string;
}

interface PagedResult {
  content: Employee[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface CreateForm {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  joinDate: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  ACTIVE: 'Đang làm việc',
  INACTIVE: 'Tạm nghỉ',
  LOCKED: 'Bị khóa',
  DEACTIVATED: 'Đã nghỉ',
  PENDING_VERIFICATION: 'Chờ xác thực',
};

const STATUS_STYLE: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  INACTIVE: 'bg-amber-50 text-amber-700 border border-amber-200',
  LOCKED: 'bg-red-50 text-red-700 border border-red-200',
  DEACTIVATED: 'bg-slate-100 text-slate-500 border border-slate-200',
  PENDING_VERIFICATION: 'bg-blue-50 text-blue-700 border border-blue-200',
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');

  // List state
  const [data, setData] = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [page, setPage] = useState(0);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    username: '', password: '', fullName: '', email: '', phone: '', position: '', joinDate: '',
  });
  const [createError, setCreateError] = useState('');

  // Action menu
  const [actionMenu, setActionMenu] = useState<number | null>(null);

  // Reset password modal
  const [resetResult, setResetResult] = useState<{ username: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ─── Auth ───
  useEffect(() => {
    const t = localStorage.getItem('accessToken');
    const roles: string[] = JSON.parse(localStorage.getItem('roles') ?? '[]');
    if (!t || !roles.includes('BUSINESS_OWNER')) {
      router.push('/login');
      return;
    }
    setToken(t);
  }, [router]);

  // ─── Fetch employees ───
  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '10' });
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`${API_BASE}/api/owner/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        showToast('error', json.message ?? 'Lỗi tải danh sách nhân viên');
      }
    } catch {
      showToast('error', 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  }, [token, page, keyword, statusFilter]);

  useEffect(() => {
    if (token) fetchEmployees();
  }, [fetchEmployees]);

  // ─── Toast helper ───
  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ─── Create Employee ───
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const body: Record<string, string> = {
        username: createForm.username,
        password: createForm.password,
        fullName: createForm.fullName,
      };
      if (createForm.email) body.email = createForm.email;
      if (createForm.phone) body.phone = createForm.phone;
      if (createForm.position) body.position = createForm.position;
      if (createForm.joinDate) body.joinDate = createForm.joinDate;

      const res = await fetch(`${API_BASE}/api/owner/employees`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreate(false);
        setCreateForm({ username: '', password: '', fullName: '', email: '', phone: '', position: '', joinDate: '' });
        showToast('success', 'Tạo tài khoản nhân viên thành công!');
        fetchEmployees();
      } else {
        setCreateError(json.message ?? 'Tạo thất bại');
      }
    } catch {
      setCreateError('Không thể kết nối đến máy chủ');
    } finally {
      setCreating(false);
    }
  }

  // ─── Lock / Unlock ───
  async function handleLock(id: number, currentStatus: EmployeeStatus) {
    const action = currentStatus === 'LOCKED' ? 'unlock' : 'lock';
    try {
      const res = await fetch(`${API_BASE}/api/owner/employees/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', action === 'lock' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
        fetchEmployees();
      } else {
        showToast('error', json.message ?? 'Thao tác thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    }
    setActionMenu(null);
  }

  // ─── Reset Password ───
  async function handleResetPassword(id: number) {
    try {
      const res = await fetch(`${API_BASE}/api/owner/employees/${id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setResetResult(json.data);
      } else {
        showToast('error', json.message ?? 'Reset thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    }
    setActionMenu(null);
  }

  // ─── Delete ───
  async function handleDelete(id: number) {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/owner/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Đã xóa tài khoản nhân viên');
        fetchEmployees();
      } else {
        showToast('error', json.message ?? 'Xóa thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    }
    setActionMenu(null);
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold
              ${toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'}`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h1>
          </div>
          <p className="text-slate-500 text-sm pl-0.5">
            {data ? `${data.totalElements} nhân viên trong cửa hàng` : 'Đang tải...'}
          </p>
        </div>
        <button
          id="btn-create-employee"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm nhân viên
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-employees"
            type="text"
            placeholder="Tìm kiếm theo tên hoặc username..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
          />
        </div>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as EmployeeStatus | ''); setPage(0); }}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang làm việc</option>
          <option value="INACTIVE">Tạm nghỉ</option>
          <option value="LOCKED">Bị khóa</option>
          <option value="DEACTIVATED">Đã nghỉ</option>
        </select>
        <button
          onClick={fetchEmployees}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          title="Tải lại"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Users className="w-10 h-10" />
            <p className="font-medium text-sm">
              {keyword || statusFilter ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'}
            </p>
            {!keyword && !statusFilter && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                + Thêm nhân viên đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Liên hệ</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Chức vụ</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Ngày vào làm</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Avatar + Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {getInitials(emp.fullName)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{emp.fullName}</p>
                          <p className="text-slate-400 text-xs">@{emp.username}</p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-slate-700 text-xs">{emp.email ?? '—'}</p>
                      <p className="text-slate-400 text-xs">{emp.phone ?? '—'}</p>
                    </td>
                    {/* Position */}
                    <td className="px-4 py-4 hidden lg:table-cell text-slate-600 text-xs">
                      {emp.position ?? '—'}
                    </td>
                    {/* Join Date */}
                    <td className="px-4 py-4 hidden lg:table-cell text-slate-500 text-xs">
                      {formatDate(emp.joinDate)}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLE[emp.status]}`}>
                        {STATUS_LABEL[emp.status]}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-4 relative">
                      <button
                        id={`btn-action-${emp.id}`}
                        onClick={() => setActionMenu(actionMenu === emp.id ? null : emp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {actionMenu === emp.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-4 top-10 z-30 bg-white border border-slate-200 rounded-xl shadow-xl w-52 py-1.5 overflow-hidden"
                          >
                            <button
                              onClick={() => { router.push(`/owner/employees/${emp.id}`); setActionMenu(null); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-slate-400" /> Xem chi tiết
                            </button>
                            <button
                              onClick={() => handleLock(emp.id, emp.status)}
                              className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition cursor-pointer
                                ${emp.status === 'LOCKED'
                                  ? 'text-emerald-700 hover:bg-emerald-50'
                                  : 'text-amber-700 hover:bg-amber-50'}`}
                            >
                              {emp.status === 'LOCKED'
                                ? <><LockOpen className="w-4 h-4" /> Mở khóa</>
                                : <><Lock className="w-4 h-4" /> Khóa tài khoản</>}
                            </button>
                            <button
                              onClick={() => handleResetPassword(emp.id)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            >
                              <KeyRound className="w-4 h-4" /> Cấp mật khẩu cho nhân viên
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" /> Xóa nhân viên
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-500">
              Trang {data.page + 1} / {data.totalPages} — {data.totalElements} nhân viên
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={data.first}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={data.last}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create Employee Modal ─── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 text-white rounded-xl">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-base">Thêm nhân viên mới</h2>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {createError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="create-username"
                      type="text"
                      required
                      value={createForm.username}
                      onChange={(e) => setCreateForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="vd: nhanvien01"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="create-password"
                      type="password"
                      required
                      minLength={8}
                      value={createForm.password}
                      onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Tối thiểu 8 ký tự"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="create-fullname"
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="vd: Nguyễn Văn An"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Email</label>
                    <input
                      id="create-email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Số điện thoại</label>
                    <input
                      id="create-phone"
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0912345678"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Chức vụ</label>
                    <input
                      id="create-position"
                      type="text"
                      value={createForm.position}
                      onChange={(e) => setCreateForm(f => ({ ...f, position: e.target.value }))}
                      placeholder="vd: Thu ngân, Thủ kho"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                  </div>

                  {/* Join Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Ngày vào làm</label>
                    <input
                      id="create-join-date"
                      type="date"
                      value={createForm.joinDate}
                      onChange={(e) => setCreateForm(f => ({ ...f, joinDate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    id="btn-submit-create"
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Reset Password Result Modal ─── */}
      <AnimatePresence>
        {resetResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Đặt lại mật khẩu thành công</h2>
                  <p className="text-xs text-slate-500">@{resetResult.username}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                <p className="text-xs text-slate-500 mb-2 font-medium">Mật khẩu tạm thời</p>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-lg font-bold text-slate-900 tracking-widest">
                    {resetResult.temporaryPassword}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resetResult!.temporaryPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Hãy thông báo mật khẩu này trực tiếp cho nhân viên và yêu cầu đổi ngay khi đăng nhập.</span>
              </div>

              <button
                onClick={() => { setResetResult(null); setCopied(false); }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for action menu */}
      {actionMenu !== null && (
        <div className="fixed inset-0 z-20" onClick={() => setActionMenu(null)} />
      )}
    </div>
  );
}
