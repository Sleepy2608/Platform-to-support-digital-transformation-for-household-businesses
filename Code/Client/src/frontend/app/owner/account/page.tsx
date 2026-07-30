'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCircle, Lock, Mail, CreditCard, AlertTriangle,
  Camera, Save, CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, Phone, Calendar, Shield,
  Pencil, X, RefreshCw, Trash2, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, clearAuth } from '../../lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OwnerProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  status: string;
  businessId: number | null;
  subscriptionExpiresAt: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

type Tab = 'profile' | 'password' | 'contact' | 'subscription' | 'danger';
type OtpTarget = 'email' | 'phone' | null;

// ─── Helper components ────────────────────────────────────────────────────────

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  if (!message) return null;
  const styles =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-rose-50 border-rose-200 text-rose-800';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5 ${styles}`}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
      <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200/80 shadow-2xs">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, type = 'text', placeholder, disabled, icon: Icon, suffix, id,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ElementType;
  suffix?: React.ReactNode;
  id?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'}`}
        />
        {suffix && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
    </div>
  );
}

// ─── OTP Input Row ─────────────────────────────────────────────────────────────
function OtpRow({
  otp, onChange, onKeyDown, onPaste, refs,
}: {
  otp: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  refs: React.MutableRefObject<Array<HTMLInputElement | null>>;
}) {
  return (
    <div className="flex gap-2 justify-center" onPaste={onPaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="w-11 h-12 text-center text-base sm:text-lg font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
        />
      ))}
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function OwnerAccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // ── Sync Active Tab with URL Hash (Immediate Response to Sidebar Clicks) ──────
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'password', 'contact', 'subscription', 'danger'].includes(hash)) {
        setActiveTab(hash as Tab);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);

    // Polling interval to catch Next.js client soft navigation hash updates
    const interval = setInterval(handleHash, 200);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
      clearInterval(interval);
    };
  }, []);

  // Load profile on mount
  const loadProfile = useCallback(async () => {
    try {
      const data = await apiClient.get<OwnerProfile>('/api/owner/profile');
      setProfile(data);
      if (data.fullName) localStorage.setItem('fullName', data.fullName);
      if (data.avatarUrl) localStorage.setItem('avatarUrl', data.avatarUrl);
    } catch {
      // If unauthorized, apiClient handles redirect to /login
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100/70">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
        <span className="text-slate-500 text-xs font-semibold">Đang tải thông tin tài khoản...</span>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle },
    { id: 'password', label: 'Mật khẩu', icon: Lock },
    { id: 'contact', label: 'Email & SĐT', icon: Mail },
    { id: 'subscription', label: 'Gói dịch vụ', icon: CreditCard },
    { id: 'danger', label: 'Vùng nguy hiểm', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Cài đặt tài khoản</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
              Quản lý thông tin hồ sơ cá nhân, bảo mật và gói đăng ký dịch vụ
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              HKD Account
            </span>
          </div>
        </div>

        {/* Tab Bar Navigation */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDanger = tab.id === 'danger';
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, '', `/owner/account#${tab.id}`);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer
                  ${isActive
                    ? isDanger
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : isDanger
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'profile' && (
              <ProfileTab profile={profile} onUpdated={loadProfile} />
            )}
            {activeTab === 'password' && <PasswordTab />}
            {activeTab === 'contact' && (
              <ContactTab profile={profile} onUpdated={loadProfile} />
            )}
            {activeTab === 'subscription' && (
              <SubscriptionTab profile={profile} onUpdated={loadProfile} />
            )}
            {activeTab === 'danger' && (
              <DangerTab router={router} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Profile Management
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileTab({ profile, onUpdated }: { profile: OwnerProfile | null; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await apiClient.put('/api/owner/profile', { fullName });
      localStorage.setItem('fullName', fullName);
      setMsg({ type: 'success', text: 'Cập nhật tên thành công!' });
      setEditing(false);
      onUpdated();
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setMsg(null);
    try {
      const url = await apiClient.upload<string>('/api/owner/avatar', formData);
      if (url) localStorage.setItem('avatarUrl', url);
      setMsg({ type: 'success', text: 'Tải lên ảnh đại diện mới thành công!' });
      onUpdated();
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const initials = (profile?.fullName || '')
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const formatDate = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'long' });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
      <SectionHeader icon={UserCircle} title="Hồ sơ cá nhân" subtitle="Quản lý thông tin hiển thị và ảnh đại diện" />

      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Avatar Section */}
      <div className="flex items-center gap-5 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
        <div className="relative group">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 shadow-2xs"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold shadow-2xs">
              {initials || '?'}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 bg-slate-900/60 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-base">{profile?.fullName}</p>
          <p className="text-xs text-slate-500 font-medium">@{profile?.username}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 text-xs font-bold text-slate-900 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" /> Đổi ảnh đại diện
          </button>
          <p className="text-[10px] text-slate-400 mt-1">Định dạng JPG, PNG, WEBP, GIF · Tối đa 2MB</p>
        </div>
      </div>

      {/* Information Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Full Name Edit */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Họ và tên hiển thị
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <UserCircle className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={editing ? fullName : (profile?.fullName || '')}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!editing}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            {editing ? (
              <div className="flex gap-1.5">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Lưu
                </button>
                <button
                  onClick={() => { setEditing(false); setFullName(profile?.fullName || ''); }}
                  className="px-3 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditing(true); setFullName(profile?.fullName || ''); }}
                className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* Read-only Information */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Địa chỉ Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={profile?.email || ''} disabled className="w-full bg-slate-100/70 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Số điện thoại</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={profile?.phone || '—'} disabled className="w-full bg-slate-100/70 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tên đăng nhập</label>
          <div className="relative">
            <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={`@${profile?.username || ''}`} disabled className="w-full bg-slate-100/70 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Trạng thái tài khoản</label>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
            profile?.status === 'ACTIVE'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : profile?.status === 'LOCKED'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${profile?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {profile?.status === 'ACTIVE' ? 'Đang hoạt động' : profile?.status === 'LOCKED' ? 'Đã khóa' : 'Vô hiệu hóa'}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ngày khởi tạo</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={formatDate(profile?.createdAt || null)} disabled className="w-full bg-slate-100/70 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Change Password
// ═══════════════════════════════════════════════════════════════════════════════
function PasswordTab() {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPwd !== confirm) { setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' }); return; }
    if (newPwd.length < 6) { setMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' }); return; }

    setLoading(true);
    try {
      await apiClient.put('/api/owner/password', {
        currentPassword: current,
        newPassword: newPwd,
        confirmPassword: confirm,
      });
      setMsg({ type: 'success', text: 'Cập nhật mật khẩu thành công!' });
      setCurrent(''); setNewPwd(''); setConfirm('');
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const PwdField = ({ label, value, onChange, show, setShow, id }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; setShow: (v: boolean) => void; id: string;
  }) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
      <SectionHeader icon={Lock} title="Đổi mật khẩu" subtitle="Vui lòng đặt mật khẩu phức tạp để bảo vệ tài khoản" />
      {msg && <Alert type={msg.type} message={msg.text} />}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <PwdField label="Mật khẩu hiện tại" value={current} onChange={setCurrent} show={showCurrent} setShow={setShowCurrent} id="pwd-current" />
        <PwdField label="Mật khẩu mới" value={newPwd} onChange={setNewPwd} show={showNew} setShow={setShowNew} id="pwd-new" />
        <PwdField label="Xác nhận mật khẩu mới" value={confirm} onChange={setConfirm} show={showConfirm} setShow={setShowConfirm} id="pwd-confirm" />

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: Change Email & Phone
// ═══════════════════════════════════════════════════════════════════════════════
function ContactTab({ profile, onUpdated }: { profile: OwnerProfile | null; onUpdated: () => void }) {
  const [otpTarget, setOtpTarget] = useState<OtpTarget>(null);

  // Email states
  const [emailPwd, setEmailPwd] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const emailOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Phone states
  const [phonePwd, setPhonePwd] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const phoneOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const makeOtpHandlers = (otp: string[], setOtp: React.Dispatch<React.SetStateAction<string[]>>, refs: React.MutableRefObject<Array<HTMLInputElement | null>>) => ({
    onChange: (i: number, v: string) => {
      if (!/^\d*$/.test(v)) return;
      const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
      if (v && i < 5) refs.current[i + 1]?.focus();
    },
    onKeyDown: (i: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
    },
    onPaste: (e: React.ClipboardEvent) => {
      e.preventDefault();
      const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (t.length === 6) { setOtp(t.split('')); refs.current[5]?.focus(); }
    },
  });

  const emailHandlers = makeOtpHandlers(emailOtp, setEmailOtp, emailOtpRefs);
  const phoneHandlers = makeOtpHandlers(phoneOtp, setPhoneOtp, phoneOtpRefs);

  const initiateEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setLoading(true);
    try {
      await apiClient.post('/api/owner/email/initiate', { currentPassword: emailPwd, newEmail });
      setOtpTarget('email');
      setMsg({ type: 'success', text: 'Mã OTP 6 số đã được gửi đến email mới của bạn.' });
    } catch (err: unknown) { setMsg({ type: 'error', text: (err as Error).message }); }
    finally { setLoading(false); }
  };

  const confirmEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setLoading(true);
    try {
      const code = emailOtp.join('');
      await apiClient.post(`/api/owner/email/confirm?newEmail=${encodeURIComponent(newEmail)}`, { otp: code });
      setMsg({ type: 'success', text: 'Đổi địa chỉ Email thành công!' });
      setOtpTarget(null); setEmailPwd(''); setNewEmail(''); setEmailOtp(['','','','','','']);
      onUpdated();
    } catch (err: unknown) { setMsg({ type: 'error', text: (err as Error).message }); }
    finally { setLoading(false); }
  };

  const initiatePhone = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setLoading(true);
    try {
      await apiClient.post('/api/owner/phone/initiate', { currentPassword: phonePwd, newPhone });
      setOtpTarget('phone');
      setMsg({ type: 'success', text: 'Mã OTP 6 số đã được gửi.' });
    } catch (err: unknown) { setMsg({ type: 'error', text: (err as Error).message }); }
    finally { setLoading(false); }
  };

  const confirmPhone = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setLoading(true);
    try {
      const code = phoneOtp.join('');
      await apiClient.post(`/api/owner/phone/confirm?newPhone=${encodeURIComponent(newPhone)}`, { otp: code });
      setMsg({ type: 'success', text: 'Đổi số điện thoại thành công!' });
      setOtpTarget(null); setPhonePwd(''); setNewPhone(''); setPhoneOtp(['','','','','','']);
      onUpdated();
    } catch (err: unknown) { setMsg({ type: 'error', text: (err as Error).message }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Change Email */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <SectionHeader icon={Mail} title="Cập nhật Email liên hệ" subtitle={`Email hiện tại: ${profile?.email || '—'}`} />
        {otpTarget !== 'email' ? (
          <form onSubmit={initiateEmail} className="space-y-4 max-w-lg">
            <InputField label="Mật khẩu hiện tại" value={emailPwd} onChange={setEmailPwd} type="password" icon={Lock} placeholder="Xác nhận mật khẩu" />
            <InputField label="Địa chỉ Email mới" value={newEmail} onChange={setNewEmail} type="email" icon={Mail} placeholder="email-moi@example.com" />
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Gửi mã xác thực OTP
            </button>
          </form>
        ) : (
          <form onSubmit={confirmEmail} className="space-y-4 max-w-lg">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Nhập mã OTP 6 số đã gửi đến <span className="font-bold text-slate-900">{newEmail}</span>:</p>
            <OtpRow otp={emailOtp} onChange={emailHandlers.onChange} onKeyDown={emailHandlers.onKeyDown} onPaste={emailHandlers.onPaste} refs={emailOtpRefs} />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loading} className="px-5 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác nhận thay đổi
              </button>
              <button type="button" onClick={() => setOtpTarget(null)} className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer">
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Phone */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <SectionHeader icon={Phone} title="Cập nhật Số điện thoại" subtitle={`SĐT hiện tại: ${profile?.phone || '—'}`} />
        {otpTarget !== 'phone' ? (
          <form onSubmit={initiatePhone} className="space-y-4 max-w-lg">
            <InputField label="Mật khẩu hiện tại" value={phonePwd} onChange={setPhonePwd} type="password" icon={Lock} placeholder="Xác nhận mật khẩu" />
            <InputField label="Số điện thoại mới" value={newPhone} onChange={setNewPhone} type="tel" icon={Phone} placeholder="0912345678" />
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              Gửi mã xác thực OTP
            </button>
          </form>
        ) : (
          <form onSubmit={confirmPhone} className="space-y-4 max-w-lg">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Nhập mã OTP 6 số đã gửi đến số <span className="font-bold text-slate-900">{newPhone}</span>:</p>
            <OtpRow otp={phoneOtp} onChange={phoneHandlers.onChange} onKeyDown={phoneHandlers.onKeyDown} onPaste={phoneHandlers.onPaste} refs={phoneOtpRefs} />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loading} className="px-5 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác nhận thay đổi
              </button>
              <button type="button" onClick={() => setOtpTarget(null)} className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer">
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: Subscription Package
// ═══════════════════════════════════════════════════════════════════════════════
function SubscriptionTab({ profile, onUpdated }: { profile: OwnerProfile | null; onUpdated: () => void }) {
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const expiresAt = profile?.subscriptionExpiresAt;
  const isActive = expiresAt && new Date(expiresAt) > new Date();

  const formatExpiry = (dt: string | null) => {
    if (!dt) return 'Chưa kích hoạt gói dịch vụ';
    return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'full' });
  };

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  const handleRenew = async () => {
    setLoading(true); setMsg(null);
    try {
      await apiClient.post<OwnerProfile>(`/api/owner/subscription/renew?months=${months}`);
      setMsg({ type: 'success', text: `Gia hạn dịch vụ thành công thêm ${months} tháng!` });
      onUpdated();
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
      <SectionHeader icon={CreditCard} title="Gói dịch vụ & Gia hạn" subtitle="Quản lý thời hạn truy cập nền tảng HKD Digital" />
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Subscription Status Card */}
      <div className={`p-6 rounded-2xl border ${isActive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'} animate-pulse`} />
            <span className={`text-xs sm:text-sm font-bold ${isActive ? 'text-emerald-800' : 'text-slate-600'}`}>
              {isActive ? 'Gói hoạt động' : 'Gói hết hạn / Chưa kích hoạt'}
            </span>
          </div>
          {isActive && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300/60">
              Còn {daysRemaining} ngày
            </span>
          )}
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatExpiry(expiresAt || null)}</p>
      </div>

      {/* Renew Options */}
      <div className="space-y-4 pt-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Chọn số tháng gia hạn
        </label>
        <div className="flex flex-wrap gap-2.5">
          {[1, 3, 6, 12, 24].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                months === m
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {m} tháng
            </button>
          ))}
        </div>

        <button
          onClick={handleRenew}
          disabled={loading}
          className="mt-4 px-6 py-3 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Đang gia hạn...' : `Xác nhận gia hạn ${months} tháng`}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5: Danger Zone
// ═══════════════════════════════════════════════════════════════════════════════
function DangerTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const [deletePwd, setDeletePwd] = useState('');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState<'lock' | 'delete' | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLock = async () => {
    setLoading('lock'); setMsg(null);
    try {
      await apiClient.post('/api/owner/account/lock');
      setMsg({ type: 'success', text: 'Tài khoản đã được tạm khóa. Đang đăng xuất...' });
      setTimeout(() => {
        clearAuth();
        document.cookie = 'auth_token=; max-age=0; path=/';
        document.cookie = 'auth_role=; max-age=0; path=/';
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
      setLoading(null);
    }
  };

  const handleDeactivate = async () => {
    setLoading('delete'); setMsg(null);
    try {
      await apiClient.delete('/api/owner/account', { currentPassword: deletePwd });
      setMsg({ type: 'success', text: 'Tài khoản đã bị xóa vĩnh viễn.' });
      setTimeout(() => {
        clearAuth();
        document.cookie = 'auth_token=; max-age=0; path=/';
        document.cookie = 'auth_role=; max-age=0; path=/';
        router.push('/');
      }, 2000);
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Lock Account Card */}
      <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Tạm khóa tài khoản</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Tài khoản sẽ bị vô hiệu hóa tạm thời cho đến khi đăng nhập mở khóa lại.</p>
          </div>
        </div>

        {!showLockConfirm ? (
          <button
            onClick={() => setShowLockConfirm(true)}
            className="px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-bold rounded-xl hover:bg-amber-100 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Lock className="w-4 h-4" /> Khóa tạm thời
          </button>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs sm:text-sm font-medium text-slate-700">Xác nhận muốn tạm khóa tài khoản của bạn?</p>
            <div className="flex gap-2">
              <button
                onClick={handleLock}
                disabled={loading === 'lock'}
                className="px-5 py-2.5 bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {loading === 'lock' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Xác nhận tạm khóa
              </button>
              <button onClick={() => setShowLockConfirm(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer">
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Card */}
      <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Xóa tài khoản vĩnh viễn</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Mọi thông tin tài khoản sẽ bị chuyển sang trạng thái đã xóa và không thể hoàn tác.</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-xl hover:bg-rose-100 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
          </button>
        ) : (
          <div className="space-y-3 pt-2 max-w-md">
            <p className="text-xs sm:text-sm font-medium text-slate-700">
              Vui lòng nhập mật khẩu hiện tại để xác nhận hành động xóa tài khoản:
            </p>
            <InputField
              id="danger-pwd"
              type="password"
              label="Mật khẩu hiện tại"
              value={deletePwd}
              onChange={setDeletePwd}
              placeholder="Nhập mật khẩu để xác nhận"
              icon={Lock}
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeactivate}
                disabled={loading === 'delete' || !deletePwd}
                className="px-5 py-2.5 bg-rose-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {loading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Xác nhận xóa tài khoản
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletePwd(''); }} className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer">
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
