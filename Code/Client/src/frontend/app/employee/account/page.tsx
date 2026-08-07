'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera, Save, Loader2, AlertCircle, CheckCircle2,
  Eye, EyeOff, Send, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface EmployeeProfile {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  nationalId: string | null;
  joinDate: string | null;
  position: string | null;
  terminationDate: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function EmployeeAccountPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auth
  useEffect(() => {
    const t = localStorage.getItem('accessToken');
    const roles: string[] = JSON.parse(localStorage.getItem('roles') ?? '[]');
    if (!t || !roles.includes('EMPLOYEE')) {
      router.push('/login');
      return;
    }
    setToken(t);
  }, [router]);

  // Fetch profile
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/employee/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data);
        else showToast('error', json.message ?? 'Lỗi tải hồ sơ');
      })
      .catch(() => showToast('error', 'Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [token]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 space-y-6">
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

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ của tôi</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý thông tin cá nhân và tài khoản</p>
      </div>

      {/* ── Section: Hồ sơ cá nhân ── */}
      <div id="profile" className="scroll-mt-8">
        <ProfileSection
          token={token}
          profile={profile}
          onUpdated={(p) => {
            setProfile(p);
            localStorage.setItem('fullName', p.fullName);
            if (p.avatarUrl) localStorage.setItem('avatarUrl', p.avatarUrl);
          }}
          showToast={showToast}
        />
      </div>

      {/* ── Section: Đổi mật khẩu ── */}
      <div id="password" className="scroll-mt-8">
        <ChangePasswordSection token={token} showToast={showToast} />
      </div>

      {/* ── Section: Email & Điện thoại ── */}
      <div id="contact" className="scroll-mt-8">
        <ChangeContactSection token={token} profile={profile} showToast={showToast} />
      </div>

      {/* ── Section: Thông tin công việc (read-only) ── */}
      {profile && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 text-base">Thông tin công việc</h2>
            <span className="text-xs text-slate-400 font-normal">— Do Owner quản lý</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReadOnlyField label="Chức vụ" value={profile.position ?? '—'} />
            <ReadOnlyField label="Ngày vào làm" value={formatDate(profile.joinDate)} />
            <ReadOnlyField label="Ngày nghỉ việc" value={formatDate(profile.terminationDate)} />
            <ReadOnlyField label="CCCD / CMND" value={profile.nationalId ?? '—'} />
            <ReadOnlyField label="Ngày sinh" value={formatDate(profile.dateOfBirth)} />
            <ReadOnlyField label="Giới tính" value={
              profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : profile.gender ?? '—'
            } />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile Section
// ─────────────────────────────────────────────────────────────
function ProfileSection({
  token, profile, onUpdated, showToast,
}: {
  token: string;
  profile: EmployeeProfile | null;
  onUpdated: (p: EmployeeProfile) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');

  const initials = fullName.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase();

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/employee/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdated(json.data);
        showToast('success', 'Cập nhật hồ sơ thành công');
      } else {
        showToast('error', json.message ?? 'Cập nhật thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/employee/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setAvatarUrl(json.data);
        localStorage.setItem('avatarUrl', json.data);
        showToast('success', 'Cập nhật ảnh đại diện thành công');
      } else {
        showToast('error', json.message ?? 'Upload thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      <h2 id="section-profile" className="font-bold text-slate-900 text-base mb-5">Hồ sơ cá nhân</h2>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center text-xl font-bold">{initials}</div>}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 text-white rounded-full shadow-md hover:bg-slate-700 transition cursor-pointer"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Username display */}
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Tên đăng nhập</p>
          <p className="font-semibold text-slate-900">@{profile?.username}</p>
          <p className="text-xs text-slate-400 mt-1">Tên đăng nhập không thể thay đổi</p>
        </div>
      </div>

      {/* Editable: Full Name */}
      <div className="space-y-1.5 max-w-md">
        <label className="text-xs font-semibold text-slate-600">Họ và tên</label>
        <input
          id="employee-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
        />
      </div>

      <div className="flex justify-end mt-5">
        <button
          id="btn-save-profile"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Change Password Section
// ─────────────────────────────────────────────────────────────
function ChangePasswordSection({
  token, showToast,
}: { token: string; showToast: (type: 'success' | 'error', message: string) => void }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, newp: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/employee/password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('success', 'Đổi mật khẩu thành công');
      } else {
        setError(json.message ?? 'Đổi mật khẩu thất bại');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      <h2 className="font-bold text-slate-900 text-base mb-5">Đổi mật khẩu</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {[
          { id: 'current-password', label: 'Mật khẩu hiện tại', key: 'currentPassword', showKey: 'current' as const },
          { id: 'new-password', label: 'Mật khẩu mới', key: 'newPassword', showKey: 'newp' as const },
          { id: 'confirm-password', label: 'Xác nhận mật khẩu mới', key: 'confirmPassword', showKey: 'confirm' as const },
        ].map(({ id, label, key, showKey }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">{label}</label>
            <div className="relative">
              <input
                id={id}
                type={show[showKey] ? 'text' : 'password'}
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                {show[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Change Contact (Email + Phone OTP flows)
// ─────────────────────────────────────────────────────────────
function ChangeContactSection({
  token, profile, showToast,
}: {
  token: string;
  profile: EmployeeProfile | null;
  showToast: (type: 'success' | 'error', message: string) => void;
}) {
  // Email flow
  const [emailStep, setEmailStep] = useState<'idle' | 'otp'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Phone flow
  const [phoneStep, setPhoneStep] = useState<'idle' | 'otp'>('idle');
  const [newPhone, setNewPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  async function handleEmailInitiate() {
    setEmailLoading(true);
    setEmailError('');
    try {
      const res = await fetch(`${API_BASE}/api/employee/email/initiate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: emailPassword, newEmail }),
      });
      const json = await res.json();
      if (json.success) {
        setEmailStep('otp');
        showToast('success', 'Đã gửi OTP đến email mới');
      } else {
        setEmailError(json.message ?? 'Gửi OTP thất bại');
      }
    } catch { setEmailError('Lỗi kết nối'); }
    finally { setEmailLoading(false); }
  }

  async function handleEmailConfirm() {
    setEmailLoading(true);
    setEmailError('');
    try {
      const res = await fetch(`${API_BASE}/api/employee/email/confirm?newEmail=${encodeURIComponent(newEmail)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: emailOtp }),
      });
      const json = await res.json();
      if (json.success) {
        setEmailStep('idle');
        setNewEmail('');
        setEmailPassword('');
        setEmailOtp('');
        showToast('success', 'Email đã được cập nhật thành công');
      } else {
        setEmailError(json.message ?? 'Xác nhận thất bại');
      }
    } catch { setEmailError('Lỗi kết nối'); }
    finally { setEmailLoading(false); }
  }

  async function handlePhoneInitiate() {
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const res = await fetch(`${API_BASE}/api/employee/phone/initiate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: phonePassword, newPhone }),
      });
      const json = await res.json();
      if (json.success) {
        setPhoneStep('otp');
        showToast('success', 'Đã gửi OTP');
      } else {
        setPhoneError(json.message ?? 'Gửi OTP thất bại');
      }
    } catch { setPhoneError('Lỗi kết nối'); }
    finally { setPhoneLoading(false); }
  }

  async function handlePhoneConfirm() {
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const res = await fetch(`${API_BASE}/api/employee/phone/confirm?newPhone=${encodeURIComponent(newPhone)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: phoneOtp }),
      });
      const json = await res.json();
      if (json.success) {
        setPhoneStep('idle');
        setNewPhone('');
        setPhonePassword('');
        setPhoneOtp('');
        showToast('success', 'Số điện thoại đã được cập nhật thành công');
      } else {
        setPhoneError(json.message ?? 'Xác nhận thất bại');
      }
    } catch { setPhoneError('Lỗi kết nối'); }
    finally { setPhoneLoading(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-8">
      <h2 className="font-bold text-slate-900 text-base">Email & Số điện thoại</h2>

      {/* ─ Email ─ */}
      <div className="space-y-4 pb-6 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-0.5">EMAIL HIỆN TẠI</p>
            <p className="text-sm font-semibold text-slate-800">{profile?.email ?? '(chưa có)'}</p>
          </div>
        </div>

        {emailError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {emailError}
          </div>
        )}

        {emailStep === 'idle' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Email mới</label>
              <input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email-moi@example.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Mật khẩu hiện tại</label>
              <input id="email-password" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition" />
            </div>
            <button onClick={handleEmailInitiate} disabled={emailLoading || !newEmail || !emailPassword}
              className="sm:col-span-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer">
              {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {emailLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </div>
        ) : (
          <div className="max-w-md space-y-4">
            <p className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              Mã OTP đã được gửi đến <strong>{newEmail}</strong>. Nhập mã để xác nhận.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Mã OTP (6 số)</label>
              <input id="email-otp" type="text" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)}
                placeholder="000000"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition tracking-widest text-center font-mono" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setEmailStep('idle'); setEmailError(''); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                Hủy
              </button>
              <button onClick={handleEmailConfirm} disabled={emailLoading || emailOtp.length !== 6}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer">
                {emailLoading ? 'Đang xác nhận...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─ Phone ─ */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-0.5">SỐ ĐIỆN THOẠI HIỆN TẠI</p>
          <p className="text-sm font-semibold text-slate-800">{profile?.phone ?? '(chưa có)'}</p>
        </div>

        {phoneError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {phoneError}
          </div>
        )}

        {phoneStep === 'idle' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Số điện thoại mới</label>
              <input id="new-phone" type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Mật khẩu hiện tại</label>
              <input id="phone-password" type="password" value={phonePassword} onChange={(e) => setPhonePassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition" />
            </div>
            <button onClick={handlePhoneInitiate} disabled={phoneLoading || !newPhone || !phonePassword}
              className="sm:col-span-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer">
              {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {phoneLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </div>
        ) : (
          <div className="max-w-md space-y-4">
            <p className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              Mã OTP đã được gửi. Nhập mã để xác nhận.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Mã OTP (6 số)</label>
              <input id="phone-otp" type="text" maxLength={6} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)}
                placeholder="000000"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition tracking-widest text-center font-mono" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPhoneStep('idle'); setPhoneError(''); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                Hủy
              </button>
              <button onClick={handlePhoneConfirm} disabled={phoneLoading || phoneOtp.length !== 6}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer">
                {phoneLoading ? 'Đang xác nhận...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component
// ─────────────────────────────────────────────────────────────
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm text-slate-700 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">{value}</p>
    </div>
  );
}
