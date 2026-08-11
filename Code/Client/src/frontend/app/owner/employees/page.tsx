'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, UserPlus, Search, X, Loader2, Mail, Phone, ShieldCheck,
  Lock, Unlock, KeyRound, Trash2, Edit2, Briefcase, Calendar, Eye, EyeOff,
  Check, AlertTriangle, UserCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type Employee, type EmployeeCreatePayload,
  fetchEmployees, createEmployee, updateEmployee, deleteEmployee,
  resetEmployeePassword, lockEmployee, unlockEmployee,
} from '../../lib/employee-api';

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalType = 'create' | 'edit' | 'delete' | 'reset' | 'detail' | null;

interface CreateForm {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string;
  position: string;
  joinDate: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string;
  address: string;
}

const EMPTY_FORM: CreateForm = {
  username: '', password: '', email: '', fullName: '',
  phone: '', position: '', joinDate: '', dateOfBirth: '',
  gender: '', nationalId: '', address: '',
};

interface EditForm {
  fullName: string;
  position: string;
  status: string;
  terminationDate: string;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Đang hoạt động', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  LOCKED: { label: 'Đã khóa', cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  DEACTIVATED: { label: 'Đã nghỉ việc', cls: 'bg-zinc-800 text-zinc-500 border border-zinc-700/60' },
  INACTIVE: { label: 'Ngừng hoạt động', cls: 'bg-zinc-800 text-zinc-500 border border-zinc-700/60' },
};

function formatDate(dt: string | null | undefined): string {
  if (!dt) return '—';
  const d = new Date(dt);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OwnerEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Employee | null>(null);

  // Forms
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<EditForm>({ fullName: '', position: '', status: 'ACTIVE', terminationDate: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [resetPwd, setResetPwd] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEmployees();
      setEmployees(data);
      setFiltered(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Không thể lấy danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  // Search filter
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFiltered(employees);
    } else {
      setFiltered(employees.filter((e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.phone || '').includes(q) ||
        (e.position || '').toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, employees]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const validateCreate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = 'Họ và tên không được để trống';
    if (!form.username.trim()) errors.username = 'Tên đăng nhập không được để trống';
    else if (form.username.length < 4) errors.username = 'Tên đăng nhập phải từ 4 ký tự trở lên';
    if (!form.password) errors.password = 'Mật khẩu không được để trống';
    else if (form.password.length < 6) errors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    if (!form.email.trim()) errors.email = 'Email không được để trống';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Email không hợp lệ';
    if (form.phone && !/^[0-9]{9,11}$/.test(form.phone)) errors.phone = 'Số điện thoại không hợp lệ';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreate()) return;
    setActionLoading(true);
    try {
      const payload: EmployeeCreatePayload = {
        username: form.username.toLowerCase().replace(/\s+/g, ''),
        password: form.password,
        email: form.email,
        fullName: form.fullName,
        phone: form.phone || undefined,
        position: form.position || undefined,
        joinDate: form.joinDate || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        nationalId: form.nationalId || undefined,
        address: form.address || undefined,
      };
      await createEmployee(payload);
      showSuccess('Tạo nhân viên mới thành công');
      setModal(null);
      setForm(EMPTY_FORM);
      loadEmployees();
    } catch (err: unknown) {
      setFormErrors({ submit: (err as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!editForm.fullName.trim()) {
      setFormErrors({ submit: 'Họ và tên không được để trống' });
      return;
    }
    setActionLoading(true);
    try {
      await updateEmployee(selected.id, {
        fullName: editForm.fullName,
        position: editForm.position || undefined,
        status: editForm.status,
        terminationDate: editForm.terminationDate || undefined,
      });
      showSuccess('Cập nhật thông tin nhân viên thành công');
      setModal(null);
      loadEmployees();
    } catch (err: unknown) {
      setFormErrors({ submit: (err as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await deleteEmployee(selected.id);
      showSuccess('Xóa nhân viên thành công');
      setModal(null);
      setSelected(null);
      loadEmployees();
    } catch (err: unknown) {
      setError((err as Error).message);
      setModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (resetPwd.newPassword !== resetPwd.confirmPassword) {
      setFormErrors({ submit: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    if (resetPwd.newPassword.length < 6) {
      setFormErrors({ submit: 'Mật khẩu phải từ 6 ký tự trở lên' });
      return;
    }
    setActionLoading(true);
    try {
      await resetEmployeePassword(selected.id, resetPwd.newPassword, resetPwd.confirmPassword);
      showSuccess('Đặt lại mật khẩu thành công');
      setModal(null);
      setResetPwd({ newPassword: '', confirmPassword: '' });
      setFormErrors({});
    } catch (err: unknown) {
      setFormErrors({ submit: (err as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (emp: Employee) => {
    setActionLoading(true);
    try {
      if (emp.status === 'LOCKED') {
        await unlockEmployee(emp.id);
        showSuccess(`Đã mở khóa tài khoản ${emp.fullName}`);
      } else {
        await lockEmployee(emp.id);
        showSuccess(`Đã khóa tài khoản ${emp.fullName}`);
      }
      loadEmployees();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal('create');
  };

  const openEdit = (emp: Employee) => {
    setSelected(emp);
    setEditForm({
      fullName: emp.fullName,
      position: emp.position || '',
      status: emp.status === 'DEACTIVATED' ? 'ACTIVE' : (emp.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE'),
      terminationDate: emp.terminationDate || '',
    });
    setFormErrors({});
    setModal('edit');
  };

  const openDetail = (emp: Employee) => {
    setSelected(emp);
    setModal('detail');
  };

  return (
    <div className="space-y-6 relative pb-10">
      {/* Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-[60] bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xl"
          >
            <div className="p-1 bg-emerald-500 rounded-full text-zinc-950">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý Nhân viên</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Tạo tài khoản, cập nhật hồ sơ, đặt lại mật khẩu, khóa/mở khóa và quản lý nhân viên của hộ kinh doanh.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Thêm nhân viên
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-4 gap-3">
        <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo họ tên, username, email, số điện thoại, chức vụ..."
          className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-zinc-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-1 text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Employee table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            <span className="text-zinc-400 text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-4">
            <div className="text-red-400 text-sm">{error}</div>
            <button onClick={loadEmployees} className="px-4 py-2 border border-zinc-700 rounded-xl hover:bg-zinc-800 text-xs cursor-pointer">
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            {searchQuery ? 'Không tìm thấy nhân viên nào khớp với từ khóa' : 'Chưa có nhân viên nào. Hãy tạo tài khoản nhân viên đầu tiên!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold bg-zinc-800/20">
                  <th className="p-4 pl-6">Nhân viên</th>
                  <th className="p-4">Thông tin liên hệ</th>
                  <th className="p-4">Chức vụ</th>
                  <th className="p-4">Ngày vào làm</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((emp) => {
                  const status = STATUS_LABEL[emp.status] || STATUS_LABEL.ACTIVE;
                  return (
                    <tr key={emp.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 pl-6 font-medium text-white">
                        <button onClick={() => openDetail(emp)} className="flex items-center gap-3 text-left cursor-pointer group">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-zinc-700/60" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-zinc-300 group-hover:text-white transition-colors">
                              {emp.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white group-hover:underline">{emp.fullName}</div>
                            <div className="text-zinc-500 text-xs font-mono">@{emp.username}</div>
                          </div>
                        </button>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{emp.email || '—'}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-zinc-300 text-xs">
                        {emp.position ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700/60 rounded-full">
                            <Briefcase className="w-3 h-3 text-zinc-500" /> {emp.position}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-4 text-zinc-400 text-xs">
                        {formatDate(emp.joinDate)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetail(emp)}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(emp)}
                            disabled={emp.status === 'DEACTIVATED'}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleLock(emp)}
                            disabled={emp.status === 'DEACTIVATED' || actionLoading}
                            className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                              emp.status === 'LOCKED'
                                ? 'text-emerald-400 hover:bg-emerald-950/20 hover:text-emerald-300'
                                : 'text-amber-400 hover:bg-amber-950/20 hover:text-amber-300'
                            }`}
                            title={emp.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {emp.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { setSelected(emp); setResetPwd({ newPassword: '', confirmPassword: '' }); setFormErrors({}); setModal('reset'); }}
                            disabled={emp.status === 'DEACTIVATED'}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelected(emp); setModal('delete'); }}
                            disabled={emp.status === 'DEACTIVATED'}
                            className="p-2 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Xóa nhân viên"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {modal === 'create' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Thêm nhân viên mới</h2>
                </div>
                <button onClick={() => setModal(null)} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.submit && (
                <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Họ và tên & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Họ và tên *</label>
                    <div className="relative">
                      <UserCircle2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    {formErrors.fullName && <p className="text-red-400 text-xs mt-1">{formErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tên đăng nhập *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">@</span>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        placeholder="nguyenvana"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all font-mono"
                      />
                    </div>
                    {formErrors.username && <p className="text-red-400 text-xs mt-1">{formErrors.username}</p>}
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="a@domain.com"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                        placeholder="0912345678"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    {formErrors.phone && <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mật khẩu *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>}
                </div>

                {/* Chức vụ & Ngày vào làm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Chức vụ</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        placeholder="Nhân viên bán hàng"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ngày vào làm</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="date"
                        value={form.joinDate}
                        onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Ngày sinh & Giới tính */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ngày sinh</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Giới tính</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all"
                    >
                      <option value="">Chưa chọn</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                {/* CCCD & Địa chỉ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">CCCD / CMND</label>
                    <input
                      type="text"
                      value={form.nationalId}
                      onChange={(e) => setForm({ ...form, nationalId: e.target.value.replace(/\D/g, '') })}
                      placeholder="012345678901"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Số nhà, đường, phường/xã..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-sm transition-colors active:scale-95 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {modal === 'edit' && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                    <Edit2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Cập nhật nhân viên</h2>
                </div>
                <button onClick={() => setModal(null)} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.submit && (
                <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Username (locked) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tên đăng nhập (Không thể đổi)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">@</span>
                    <input type="text" value={selected.username} disabled className="w-full bg-zinc-800/40 border border-zinc-800 text-zinc-500 rounded-xl py-2.5 pl-10 pr-4 text-sm cursor-not-allowed font-mono" />
                  </div>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Họ và tên</label>
                  <div className="relative">
                    <UserCircle2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                  {formErrors.fullName && <p className="text-red-400 text-xs mt-1">{formErrors.fullName}</p>}
                </div>

                {/* Chức vụ */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Chức vụ</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all"
                  >
                    <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                    <option value="LOCKED">Khóa tài khoản (LOCKED)</option>
                  </select>
                </div>

                {/* Ngày nghỉ */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ngày nghỉ việc</label>
                  <input
                    type="date"
                    value={editForm.terminationDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, terminationDate: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-sm transition-colors active:scale-95 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {modal === 'detail' && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Hồ sơ nhân viên</h2>
                </div>
                <button onClick={() => setModal(null)} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile header */}
              <div className="flex items-center gap-4 p-4 bg-zinc-800/40 border border-zinc-700/60 rounded-2xl mb-6">
                {selected.avatarUrl ? (
                  <img src={selected.avatarUrl} alt="avatar" className="w-16 h-16 rounded-2xl object-cover border border-zinc-600" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-zinc-700 flex items-center justify-center text-2xl font-bold text-white">
                    {selected.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-white">{selected.fullName}</p>
                  <p className="text-zinc-400 text-sm font-mono">@{selected.username}</p>
                  {selected.position && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold mt-1">
                      <Briefcase className="w-3 h-3" /> {selected.position}
                    </span>
                  )}
                </div>
                <span className={`ml-auto inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${(STATUS_LABEL[selected.status] || STATUS_LABEL.ACTIVE).cls}`}>
                  {(STATUS_LABEL[selected.status] || STATUS_LABEL.ACTIVE).label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <DetailItem label="Email" value={selected.email || '—'} icon={Mail} />
                <DetailItem label="Số điện thoại" value={selected.phone || '—'} icon={Phone} />
                <DetailItem label="Ngày sinh" value={formatDate(selected.dateOfBirth)} icon={Calendar} />
                <DetailItem label="Giới tính" value={selected.gender === 'MALE' ? 'Nam' : selected.gender === 'FEMALE' ? 'Nữ' : selected.gender === 'OTHER' ? 'Khác' : '—'} icon={Users} />
                <DetailItem label="CCCD / CMND" value={selected.nationalId || '—'} icon={ShieldCheck} />
                <DetailItem label="Địa chỉ" value={selected.address || '—'} icon={UserCircle2} />
                <DetailItem label="Ngày vào làm" value={formatDate(selected.joinDate)} icon={Calendar} />
                <DetailItem label="Ngày nghỉ việc" value={formatDate(selected.terminationDate)} icon={Calendar} />
                <DetailItem label="Ngày tạo tài khoản" value={formatDate(selected.createdAt)} icon={Calendar} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  onClick={() => setModal(null)}
                  className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => openEdit(selected)}
                  disabled={selected.status === 'DEACTIVATED'}
                  className="px-5 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Edit2 className="w-4 h-4" /> Chỉnh sửa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reset Password Modal ── */}
      <AnimatePresence>
        {modal === 'reset' && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-8 overflow-hidden shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Đặt lại mật khẩu</h2>
                </div>
                <button onClick={() => setModal(null)} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-zinc-400 text-sm mb-5">
                Đặt mật khẩu mới cho <strong className="text-white">{selected.fullName}</strong> (@{selected.username})
              </p>

              {formErrors.submit && (
                <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={resetPwd.newPassword}
                    onChange={(e) => setResetPwd({ ...resetPwd, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={resetPwd.confirmPassword}
                    onChange={(e) => setResetPwd({ ...resetPwd, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-sm transition-colors active:scale-95 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Đặt lại mật khẩu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {modal === 'delete' && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-2xl z-10"
            >
              <div className="flex flex-col items-center text-center p-4">
                <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-full text-red-400 mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Xác nhận xóa nhân viên?</h2>
                <p className="text-zinc-400 text-sm mb-6">
                  Bạn có chắc chắn muốn xóa tài khoản <strong className="text-white">@{selected.username}</strong> ({selected.fullName})?
                  Nhân viên sẽ không thể đăng nhập vào hệ thống nữa. Hành động này được ghi vào nhật ký kiểm toán.
                </p>

                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold rounded-xl text-sm transition-colors active:scale-95 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Đồng ý xóa
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Small components ──────────────────────────────────────────────────────────
function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-zinc-800/40 border border-zinc-800 rounded-xl">
      <Icon className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="text-xs font-medium text-zinc-200 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}
