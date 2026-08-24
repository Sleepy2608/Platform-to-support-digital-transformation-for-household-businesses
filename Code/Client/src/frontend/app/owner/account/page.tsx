'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCircle, Lock, Mail, CreditCard, AlertTriangle,
  Camera, Save, CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, Phone, Shield, Calendar, ShieldCheck,
  Pencil, X, RefreshCw, Trash2, Crown, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, clearAuth } from '../../lib/apiClient';
import PaymentQrModal from '../../components/payment/PaymentQrModal';
import {
  type BusinessProfileResponse, type BusinessProfileRequest, type BusinessType,
  type ProvinceDto, type DistrictDto, type WardDto,
  fetchProvinces, fetchDistricts, fetchWards,
  getBusinessProfile, saveBusinessProfile,
  uploadStoreLogo, uploadStoreCoverImage,
} from '../../lib/business-profile';

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
  packageType: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

type Tab = 'profile' | 'business-profile' | 'password' | 'contact' | 'subscription' | 'consent' | 'danger';
type OtpTarget = 'email' | 'phone' | null;

function resolveTabFromHash(hashString?: string): Tab {
  if (!hashString) return 'profile';
  const clean = hashString.replace(/^#+/, '').split('#')[0].toLowerCase().trim();
  if (clean === 'email' || clean === 'phone' || clean === 'contact') return 'contact';
  if (clean === 'plans' || clean === 'package' || clean === 'subscription') return 'subscription';
  if (clean === 'danger-zone' || clean === 'danger') return 'danger';
  if (clean === 'business-profile' || clean === 'business') return 'business-profile';
  if (clean === 'password') return 'password';
  if (clean === 'consent') return 'consent';
  return 'profile';
}

function syncOwnerSummary(data: { fullName?: string; avatarUrl?: string | null }) {
  if (typeof window === 'undefined') return;
  if (data.fullName !== undefined) {
    sessionStorage.setItem('fullName', data.fullName);
  }
  if (data.avatarUrl !== undefined) {
    sessionStorage.setItem('avatarUrl', data.avatarUrl || '');
  }
  window.dispatchEvent(new CustomEvent('owner-profile-updated', {
    detail: {
      fullName: data.fullName,
      avatarUrl: data.avatarUrl || undefined,
    },
  }));
}

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
        <h2 className="text-base sm:text-lg font-bold text-slate-900 select-none" style={{ userSelect: 'none', cursor: 'default' }}>{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5 select-none" style={{ userSelect: 'none' }}>{subtitle}</p>}
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
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 select-none" style={{ userSelect: 'none', cursor: 'default' }}>
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
          className={`w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-text select-text
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
      if (typeof window === 'undefined') return;
      const targetTab = resolveTabFromHash(window.location.hash);
      setActiveTab(targetTab);
      // Clean up duplicated/dirty hash in browser address bar (e.g. #profile#profile -> #profile)
      if (window.location.hash !== `#${targetTab}`) {
        window.history.replaceState(null, '', `/owner/account#${targetTab}`);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);

    const handleCustomTab = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        const targetTab = resolveTabFromHash(detail);
        setActiveTab(targetTab);
        window.history.replaceState(null, '', `/owner/account#${targetTab}`);
      }
    };
    window.addEventListener('owner-tab-change', handleCustomTab);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
      window.removeEventListener('owner-tab-change', handleCustomTab);
    };
  }, []);

  // Load profile on mount
  const loadProfile = useCallback(async () => {
    try {
      const data = await apiClient.get<OwnerProfile>('/api/owner/profile');
      setProfile(data);
      syncOwnerSummary({ fullName: data.fullName, avatarUrl: data.avatarUrl });
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
    { id: 'business-profile', label: 'Hồ sơ kinh doanh', icon: Building2 },
    { id: 'password', label: 'Mật khẩu', icon: Lock },
    { id: 'contact', label: 'Email & SĐT', icon: Mail },
    { id: 'subscription', label: 'Gói dịch vụ', icon: CreditCard },
    { id: 'consent', label: 'Điều khoản & Bảo mật', icon: ShieldCheck },
    { id: 'danger', label: 'Vùng nguy hiểm', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none" style={{ userSelect: 'none' }}>Cài đặt tài khoản</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none" style={{ userSelect: 'none' }}>
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
                  window.dispatchEvent(new CustomEvent('owner-tab-change', { detail: tab.id }));
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
            {activeTab === 'business-profile' && (
              <BusinessProfileTab />
            )}
            {activeTab === 'password' && <PasswordTab />}
            {activeTab === 'contact' && (
              <ContactTab profile={profile} onUpdated={loadProfile} />
            )}
            {activeTab === 'subscription' && (
              <SubscriptionTab profile={profile} onUpdated={loadProfile} />
            )}
            {activeTab === 'consent' && <ConsentTab />}
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
      syncOwnerSummary({ fullName });
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
      if (url) syncOwnerSummary({ avatarUrl: url });
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
          <p className="font-bold text-slate-900 text-base select-none" style={{ userSelect: 'none' }}>{profile?.fullName}</p>
          <p className="text-xs text-slate-500 font-medium select-none" style={{ userSelect: 'none' }}>@{profile?.username}</p>
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
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 select-none" style={{ userSelect: 'none', cursor: 'default' }}>{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all cursor-text select-text"
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
  const router = useRouter();
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [showRenewPaymentModal, setShowRenewPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const expiresAt = profile?.subscriptionExpiresAt;
  const packageType = profile?.packageType;

  const formatExpiry = (dt: string | null) => {
    if (!dt) return 'Chưa kích hoạt gói dịch vụ';
    return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'full' });
  };

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : 0;
  const hasActiveSubscription = daysRemaining > 0;

  useEffect(() => {
    if (!packageType) return;
    apiClient.get<Array<{ id: string; monthlyPrice: number }>>('/api/owner/subscription/packages')
      .then((packages) => {
        const currentPackage = packages.find((item) => item.id === packageType);
        setMonthlyPrice(currentPackage?.monthlyPrice ?? 0);
      })
      .catch(() => setMonthlyPrice(0));
  }, [packageType]);

  const handleRenew = async () => {
    setMsg(null);
    setPaymentSuccess(false);
    setShowRenewPaymentModal(true);
  };

  const handleConfirmRenewalPayment = async () => {
    setLoading(true); setMsg(null);
    try {
      await apiClient.post<OwnerProfile>(`/api/owner/subscription/renew?months=${months}`);
      setPaymentSuccess(true);
      onUpdated();
      setTimeout(() => setShowRenewPaymentModal(false), 1800);
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const renewalAmount = monthlyPrice * months;
  const transferSyntax = `${packageType || 'SUB'}-RENEW-${months}M`;

  const packageLabel = packageType === 'VIP' ? 'Gói VIP (Pro)' : packageType === 'STANDARD' ? 'Gói Standard' : null;
  const packageBadgeClass = packageType === 'VIP'
    ? 'bg-zinc-900 text-white border-zinc-700'
    : packageType === 'STANDARD'
    ? 'bg-blue-50 text-blue-800 border-blue-200'
    : '';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SectionHeader icon={CreditCard} title="Gói dịch vụ &amp; Gia hạn" subtitle="Quản lý thời hạn truy cập nền tảng HKD Digital" />
        </div>
        {hasActiveSubscription && (
          <button
            type="button"
            onClick={() => router.push('/onboarding/package-selection?from=account')}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Crown className="w-3.5 h-3.5" />
            Chọn gói dịch vụ khác
          </button>
        )}
      </div>
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Package Name Badge */}
      {hasActiveSubscription && packageLabel ? (
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${packageBadgeClass}`}>
            <Crown className="w-3.5 h-3.5" />
            {packageLabel}
          </span>
          <span className="text-xs text-slate-500">Gói dịch vụ hiện tại</span>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Chưa đăng ký gói dịch vụ</p>
            <p className="text-xs text-amber-700 mt-0.5">Vui lòng chọn gói để sử dụng đầy đủ tính năng nền tảng.</p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => router.push('/onboarding/package-selection?from=account')}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" /> Chọn gói ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Status Card */}
      <div className={`p-6 rounded-2xl border ${hasActiveSubscription ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${hasActiveSubscription ? 'bg-emerald-500' : 'bg-slate-400'} animate-pulse`} />
            <span className={`text-xs sm:text-sm font-bold ${hasActiveSubscription ? 'text-emerald-800' : 'text-slate-600'}`}>
              {hasActiveSubscription ? 'Gói hoạt động' : 'Gói hết hạn / Chưa kích hoạt'}
            </span>
          </div>
          {hasActiveSubscription && (
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

      <PaymentQrModal
        isOpen={showRenewPaymentModal}
        amount={renewalAmount}
        transferSyntax={transferSyntax}
        title="Thanh toán gia hạn dịch vụ"
        successTitle={paymentSuccess ? 'Gia hạn thành công!' : ''}
        successMessage={`Dịch vụ đã được gia hạn thêm ${months} tháng.`}
        loading={loading}
        error={msg?.type === 'error' ? msg.text : null}
        onClose={() => setShowRenewPaymentModal(false)}
        onConfirm={handleConfirmRenewalPayment}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Điều khoản & Bảo mật — Lịch sử chấp thuận (SCRUM-21)
// ═══════════════════════════════════════════════════════════════════════════════
interface ConsentRecord {
  id: number;
  termsVersion: string;
  privacyVersion: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingAccepted: boolean;
  circular88Accepted: boolean;
  infoAccurateConfirmed: boolean;
  inaccuracyUnderstood: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  acceptedAt: string;
}

function ConsentTab() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<ConsentRecord[]>('/api/owner/consent/history');
      setRecords(data || []);
    } catch (err: unknown) {
      setError((err as Error).message || 'Không thể tải lịch sử chấp thuận');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const items: { key: keyof ConsentRecord; label: string }[] = [
    { key: 'termsAccepted', label: 'Điều khoản sử dụng' },
    { key: 'privacyAccepted', label: 'Chính sách bảo mật' },
    { key: 'dataProcessingAccepted', label: 'Xử lý dữ liệu kinh doanh' },
    { key: 'circular88Accepted', label: 'Thông tư 88 (S1, S2, S4)' },
    { key: 'infoAccurateConfirmed', label: 'Thông tin chính xác & đầy đủ' },
    { key: 'inaccuracyUnderstood', label: 'Hiểu rủi ro sổ kế toán sai' },
  ];

  const formatDate = (s: string) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime())
      ? s
      : d.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-slate-900 animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Đang tải lịch sử chấp thuận...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
      <SectionHeader
        icon={ShieldCheck}
        title="Điều khoản & Bảo mật"
        subtitle="Lịch sử các lần bạn chấp thuận Điều khoản sử dụng và Chính sách bảo mật"
      />

      {error && <Alert type="error" message={error} />}

      {records.length === 0 ? (
        <div className="py-10 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Chưa có bản ghi chấp thuận nào.</p>
          <p className="text-xs text-slate-400 mt-1">
            Bản ghi sẽ được lưu lại khi bạn đăng ký tài khoản và xác nhận điều khoản.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <div key={r.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-sm font-bold text-slate-900">{formatDate(r.acceptedAt)}</span>
                <span className="text-[11px] text-slate-500 font-medium bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
                  Điều khoản v{r.termsVersion} · Bảo mật v{r.privacyVersion}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((it) => (
                  <div key={it.key} className="flex items-center gap-2 text-xs text-slate-600">
                    {r[it.key] ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="font-medium">{it.label}</span>
                  </div>
                ))}
              </div>
              {r.ipAddress && (
                <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
                  IP: {r.ipAddress}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
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

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6: Business Profile Management (SCRUM-15)
// ═══════════════════════════════════════════════════════════════════════════════
const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  INDIVIDUAL: 'Cá nhân kinh doanh',
  HOUSEHOLD: 'Hộ kinh doanh',
  COOPERATIVE: 'Hợp tác xã',
  SMALL_ENTERPRISE: 'Doanh nghiệp nhỏ',
};

function BusinessProfileTab() {
  const router = useRouter();
  const [bp, setBp] = useState<BusinessProfileResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Address cascade data ──────────────────────────────────────────────────
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [districts, setDistricts] = useState<DistrictDto[]>([]);
  const [wards, setWards] = useState<WardDto[]>([]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('HOUSEHOLD');
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [repFullName, setRepFullName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // ── Upload state ──────────────────────────────────────────────────────────
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [data, provData] = await Promise.all([
          getBusinessProfile(),
          fetchProvinces(),
        ]);
        setProvinces(provData);
        setBp(data);
        // Populate form
        setBusinessName(data.businessName || '');
        setTaxCode(data.taxCode || '');
        setBusinessType(data.businessType || 'HOUSEHOLD');
        setProvinceCode(data.provinceCode || '');
        setDistrictCode(data.districtCode || '');
        setWardCode(data.wardCode || '');
        setDetailAddress(data.detailAddress || '');
        setRepFullName(data.representative?.fullName || '');
        setRepPhone(data.representative?.phoneNumber || '');
        setRepEmail(data.representative?.email || '');
        setStoreName(data.store?.storeName || '');
        setLogoUrl(data.store?.logoUrl || '');
        setCoverImageUrl(data.store?.coverImageUrl || '');

        // Load districts/wards for existing province/district
        if (data.provinceCode) {
          const distData = await fetchDistricts(data.provinceCode);
          setDistricts(distData);
        }
        if (data.districtCode) {
          const wardData = await fetchWards(data.districtCode);
          setWards(wardData);
        }
      } catch {
        setNotFound(true);
        // Load provinces anyway for potential creation
        try {
          const provData = await fetchProvinces();
          setProvinces(provData);
        } catch { /* ignore */ }
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, []);

  // ── Cascade handlers ──────────────────────────────────────────────────────
  const handleProvinceChange = async (code: string) => {
    setProvinceCode(code);
    setDistrictCode('');
    setWardCode('');
    setDistricts([]);
    setWards([]);
    if (code) {
      const data = await fetchDistricts(code);
      setDistricts(data);
    }
  };

  const handleDistrictChange = async (code: string) => {
    setDistrictCode(code);
    setWardCode('');
    setWards([]);
    if (code) {
      const data = await fetchWards(code);
      setWards(data);
    }
  };

  // ── Upload handlers ───────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadStoreLogo(file);
      setLogoUrl(url);
      setMsg({ type: 'success', text: 'Upload logo thành công!' });
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadStoreCoverImage(file);
      setCoverImageUrl(url);
      setMsg({ type: 'success', text: 'Upload ảnh bìa thành công!' });
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setUploadingCover(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    const payload: BusinessProfileRequest = {
      businessInfo: {
        businessName, taxCode, businessType,
        provinceCode, districtCode, wardCode, detailAddress,
      },
      representative: { fullName: repFullName, phoneNumber: repPhone, email: repEmail },
      store: { storeName, logoUrl: logoUrl || undefined, coverImageUrl: coverImageUrl || undefined },
    };
    try {
      const updated = await saveBusinessProfile(payload);
      setBp(updated);
      setMsg({ type: 'success', text: 'Hồ sơ kinh doanh đã được cập nhật thành công!' });
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 flex items-center justify-center shadow-xs">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin mr-3" />
        <span className="text-slate-500 text-sm font-medium">Đang tải hồ sơ kinh doanh...</span>
      </div>
    );
  }

  // ── No profile yet ────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-10 shadow-xs text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Chưa có hồ sơ kinh doanh</h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
            Bạn chưa khởi tạo hồ sơ doanh nghiệp. Hãy hoàn tất bước Onboarding để bắt đầu sử dụng nền tảng.
          </p>
        </div>
        <button
          onClick={() => router.push('/onboarding/business-profile')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Building2 className="w-4 h-4" /> Khởi tạo hồ sơ ngay
        </button>
      </div>
    );
  }

  // ── Shared select class ───────────────────────────────────────────────────
  const selectClass = "w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-9 text-xs sm:text-sm text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all appearance-none";

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Building2}
        title="Hồ sơ kinh doanh"
        subtitle="Thông tin hộ kinh doanh / doanh nghiệp — tách biệt với thông tin tài khoản cá nhân"
      />

      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* ── Section 1: Business Info ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
          Thông tin hộ kinh doanh
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <InputField
              label="Tên cửa hàng / Hộ kinh doanh"
              value={businessName}
              onChange={setBusinessName}
              placeholder="Ví dụ: Cửa hàng tạp hoá Minh Tâm"
              icon={Building2}
            />
          </div>

          <InputField
            label="Mã số thuế"
            value={taxCode}
            onChange={setTaxCode}
            placeholder="10 hoặc 13 chữ số"
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Loại hình kinh doanh
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessType)}
              className={selectClass}
            >
              {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map((t) => (
                <option key={t} value={t} className="text-gray-900 bg-white">{BUSINESS_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Address Cascade */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tỉnh / Thành phố</label>
            <select value={provinceCode} onChange={(e) => handleProvinceChange(e.target.value)} className={selectClass}>
              <option value="">-- Chọn Tỉnh/Thành --</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code} className="text-gray-900 bg-white">{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Quận / Huyện</label>
            <select value={districtCode} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!provinceCode} className={selectClass}>
              <option value="">-- Chọn Quận/Huyện --</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code} className="text-gray-900 bg-white">{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Xã / Phường</label>
            <select value={wardCode} onChange={(e) => setWardCode(e.target.value)} disabled={!districtCode} className={selectClass}>
              <option value="">-- Chọn Xã/Phường --</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code} className="text-gray-900 bg-white">{w.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <InputField
              label="Địa chỉ chi tiết"
              value={detailAddress}
              onChange={setDetailAddress}
              placeholder="Số nhà, tên đường, khu vực..."
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Representative ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
          Thông tin người đại diện
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <InputField
              label="Họ và tên người đại diện"
              value={repFullName}
              onChange={setRepFullName}
              placeholder="Nguyễn Văn A"
              icon={UserCircle}
            />
          </div>
          <InputField
            label="Số điện thoại cửa hàng"
            value={repPhone}
            onChange={setRepPhone}
            placeholder="0912345678"
            icon={Phone}
            type="tel"
          />
          <InputField
            label="Email cửa hàng"
            value={repEmail}
            onChange={setRepEmail}
            placeholder="cuahang@example.com"
            icon={Mail}
            type="email"
          />
        </div>
      </div>

      {/* ── Section 3: Store Info & Images ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
          Thương hiệu & Hình ảnh cửa hàng
        </h3>

        <InputField
          label="Tên cửa hàng (hiển thị)"
          value={storeName}
          onChange={setStoreName}
          placeholder="Tên thương hiệu hiển thị cho khách hàng"
          icon={Building2}
        />

        {/* Logo Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Logo cửa hàng</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                : <Building2 className="w-6 h-6 text-slate-300" />
              }
            </div>
            <div>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
                className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {uploadingLogo ? 'Đang upload...' : 'Tải lên Logo'}
              </button>
              <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP · Tối đa 5MB</p>
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} className="hidden" />
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ảnh bìa cửa hàng</label>
          <div className="relative w-full h-32 rounded-2xl border-2 border-slate-200 bg-slate-50 overflow-hidden group cursor-pointer" onClick={() => coverRef.current?.click()}>
            {coverImageUrl
              ? <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
                  <Camera className="w-8 h-8" />
                  <span className="text-xs font-medium text-slate-400">Nhấp để tải ảnh bìa</span>
                </div>
              )
            }
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingCover
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />
              }
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Kích thước đề nghị: 1200×400px · JPG, PNG, WEBP · Tối đa 5MB</p>
          <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" />
        </div>
      </div>

      {/* ── Status Badge ── */}
      {bp && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <Shield className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">
            Trạng thái hồ sơ:&nbsp;
            <span className={`font-bold ${bp.status === 'ACTIVE' ? 'text-emerald-700' : bp.status === 'REJECTED' ? 'text-rose-700' : 'text-amber-700'}`}>
              {bp.status === 'ACTIVE' ? 'Đã xác minh' : bp.status === 'REJECTED' ? 'Bị từ chối' : bp.status === 'SUSPENDED' ? 'Tạm đình chỉ' : 'Đang chờ xét duyệt'}
            </span>
          </span>
        </div>
      )}

      {/* ── Save Button ── */}
      <button
        id="btn-save-business-profile"
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 active:scale-95 disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </div>
  );
}
