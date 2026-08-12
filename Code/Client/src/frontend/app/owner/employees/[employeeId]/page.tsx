'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2,
  UserCircle, Briefcase, Calendar, Phone, Mail,
  KeyRound, Lock, LockOpen, Trash2,
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
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  nationalId: string | null;
  createdAt: string;
  updatedAt: string;
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
export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.employeeId as string;

  const [token, setToken] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset password modal
  const [resetResult, setResetResult] = useState<{ username: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit form state (only Owner-editable fields)
  const [form, setForm] = useState({
    fullName: '',
    position: '',
    status: '' as EmployeeStatus | '',
    joinDate: '',
    terminationDate: '',
  });

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

  // ─── Fetch Employee ───
  useEffect(() => {
    if (!token || !employeeId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/owner/employees/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const emp: Employee = json.data;
          setEmployee(emp);
          setForm({
            fullName: emp.fullName ?? '',
            position: emp.position ?? '',
            status: emp.status,
            joinDate: emp.joinDate ?? '',
            terminationDate: emp.terminationDate ?? '',
          });
        } else {
          showToast('error', json.message ?? 'Không tìm thấy nhân viên');
        }
      })
      .catch(() => showToast('error', 'Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [token, employeeId]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ─── Save ───
  async function handleSave() {
    if (!token || !employeeId) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { fullName: form.fullName };
      if (form.position !== undefined) body.position = form.position;
      if (form.status) body.status = form.status;
      if (form.joinDate) body.joinDate = form.joinDate;
      if (form.terminationDate) body.terminationDate = form.terminationDate;

      const res = await fetch(`${API_BASE}/api/owner/employees/${employeeId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setEmployee(json.data);
        showToast('success', 'Đã cập nhật thông tin nhân viên');
      } else {
        showToast('error', json.message ?? 'Cập nhật thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  }

  // ─── Lock/Unlock ───
  async function handleLock() {
    if (!employee) return;
    const action = employee.status === 'LOCKED' ? 'unlock' : 'lock';
    try {
      const res = await fetch(`${API_BASE}/api/owner/employees/${employeeId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setEmployee(json.data);
        setForm(f => ({ ...f, status: json.data.status }));
        showToast('success', action === 'lock' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      } else {
        showToast('error', json.message ?? 'Thao tác thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    }
  }

  // ─── Reset Password ───
  async function handleResetPassword() {
    try {
      const res = await fetch(`${API_BASE}/api/owner/employees/${employeeId}/reset-password`, {
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
  }

  // ─── Delete ───
  async function handleDelete() {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/owner/employees/${employeeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Đã xóa nhân viên');
        setTimeout(() => router.push('/owner/employees'), 1200);
      } else {
        showToast('error', json.message ?? 'Xóa thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400">
        <AlertCircle className="w-10 h-10" />
        <p>Không tìm thấy nhân viên</p>
        <button onClick={() => router.back()} className="text-slate-900 font-semibold text-sm hover:underline">
          ← Quay lại
        </button>
      </div>
    );
  }

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
              ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button + Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => router.push('/owner/employees')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium mb-3 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{employee.fullName}</h1>
          <p className="text-slate-500 text-sm">@{employee.username}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleLock}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer
              ${employee.status === 'LOCKED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
          >
            {employee.status === 'LOCKED'
              ? <><LockOpen className="w-4 h-4" /> Mở khóa</>
              : <><Lock className="w-4 h-4" /> Khóa tài khoản</>}
          </button>
          <button
            onClick={handleResetPassword}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4" /> Cấp mật khẩu cho nhân viên
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Xóa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar + Read-only Info */}
        <div className="space-y-5">
          {/* Avatar Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col items-center gap-4">
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={employee.fullName}
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                {getInitials(employee.fullName)}
              </div>
            )}
            <div className="text-center">
              <p className="font-bold text-slate-900">{employee.fullName}</p>
              <p className="text-slate-500 text-xs">@{employee.username}</p>
              <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[employee.status]}`}>
                {STATUS_LABEL[employee.status]}
              </span>
            </div>
          </div>

          {/* Read-only info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin hệ thống</h3>
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={employee.email ?? '—'} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Điện thoại" value={employee.phone ?? '—'} />
            <InfoRow icon={<UserCircle className="w-4 h-4" />} label="Ngày sinh" value={formatDate(employee.dateOfBirth)} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Ngày tạo" value={formatDate(employee.createdAt)} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Cập nhật lần cuối" value={formatDate(employee.updatedAt)} />
          </div>
        </div>

        {/* Right: Editable Fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Owner-editable fields */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-slate-900">Thông tin công việc</h2>
              <span className="text-xs text-slate-400 font-normal ml-1">— Owner có thể chỉnh sửa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Họ và tên</label>
                <input
                  id="detail-fullname"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                />
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Chức vụ</label>
                <input
                  id="detail-position"
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))}
                  placeholder="vd: Thu ngân, Thủ kho"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Trạng thái</label>
                <select
                  id="detail-status"
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value as EmployeeStatus }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition text-slate-700 cursor-pointer"
                >
                  <option value="ACTIVE">Đang làm việc</option>
                  <option value="INACTIVE">Tạm nghỉ</option>
                </select>
              </div>

              {/* Join Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Ngày vào làm</label>
                <input
                  id="detail-join-date"
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => setForm(f => ({ ...f, joinDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition text-slate-700"
                />
              </div>

              {/* Termination Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Ngày nghỉ việc</label>
                <input
                  id="detail-termination-date"
                  type="date"
                  value={form.terminationDate}
                  onChange={(e) => setForm(f => ({ ...f, terminationDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition text-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                id="btn-save-employee"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          {/* Read-only Employee profile (Employee self-managed) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCircle className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-slate-900">Hồ sơ cá nhân</h2>
              <span className="text-xs text-slate-400 font-normal ml-1">— Nhân viên tự cập nhật</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadOnlyField label="CCCD/CMND" value={employee.nationalId ?? '—'} />
              <ReadOnlyField label="Giới tính" value={
                employee.gender === 'MALE' ? 'Nam' : employee.gender === 'FEMALE' ? 'Nữ' : employee.gender ?? '—'
              } />
              <ReadOnlyField label="Ngày sinh" value={formatDate(employee.dateOfBirth)} />
              <ReadOnlyField label="Địa chỉ" value={employee.address ?? '—'} />
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
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
                  <h2 className="font-bold text-slate-900">Mật khẩu đã được đặt lại</h2>
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
                    {copied
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : <span className="text-xs font-semibold">Copy</span>}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm text-slate-700 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">{value}</p>
    </div>
  );
}
