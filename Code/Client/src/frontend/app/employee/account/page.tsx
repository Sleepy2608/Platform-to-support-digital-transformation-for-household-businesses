'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  UserCircle, Lock, Camera, Save, CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, Phone, Mail, Shield, Calendar, Briefcase, IdCard, MapPin, Users, Pencil, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../lib/apiClient';
import {
  type Employee, fetchMyProfile, updateMyProfile, uploadMyAvatar, changeMyPassword,
} from '../../lib/employee-api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'password';

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

function ReadOnlyField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          disabled
          className="w-full bg-slate-100/70 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed"
        />
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, type = 'text', placeholder, icon: Icon, id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ElementType;
  id?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all ${Icon ? 'pl-10' : 'pl-4'} pr-4`}
        />
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function EmployeeAccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Employee | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // ── Sync Active Tab with URL Hash ──
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'password'].includes(hash)) {
        setActiveTab(hash as Tab);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
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
      const data = await fetchMyProfile();
      setProfile(data);
      if (data.fullName) localStorage.setItem('fullName', data.fullName);
      if (data.avatarUrl) localStorage.setItem('avatarUrl', data.avatarUrl);
    } catch {
      // apiClient handles redirect on unauthorized
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100/70">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
        <span className="text-slate-500 text-xs font-semibold">Đang tải thông tin hồ sơ...</span>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle },
    { id: 'password', label: 'Mật khẩu', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Tài khoản nhân viên</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
              Quản lý hồ sơ cá nhân và bảo mật tài khoản
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700">
              Employee Account
            </span>
          </div>
        </div>

        {/* Tab Bar Navigation */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, '', `/employee/account#${tab.id}`);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer
                  ${isActive
                    ? 'bg-slate-900 text-white shadow-xs'
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Profile Management (employee tự sửa avatar, phone, email)
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileTab({ profile, onUpdated }: { profile: Employee | null; onUpdated: () => void }) {
  const [editingContact, setEditingContact] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveContact = async () => {
    if (!email.trim()) {
      setMsg({ type: 'error', text: 'Email không được để trống' });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg({ type: 'error', text: 'Email không hợp lệ' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      await updateMyProfile({ email, phone: phone || undefined });
      localStorage.setItem('email', email);
      setMsg({ type: 'success', text: 'Cập nhật thông tin liên hệ thành công!' });
      setEditingContact(false);
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
    setUploading(true);
    setMsg(null);
    try {
      const url = await uploadMyAvatar(file);
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
      <SectionHeader icon={UserCircle} title="Hồ sơ cá nhân" subtitle="Thông tin do chủ hộ kinh doanh thiết lập. Bạn có thể tự cập nhật ảnh đại diện, số điện thoại và email." />

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
          {profile?.position && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-200/60 mt-1">
              <Briefcase className="w-3 h-3" /> {profile.position}
            </span>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 text-xs font-bold text-slate-900 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" /> Đổi ảnh đại diện
          </button>
          <p className="text-[10px] text-slate-400 mt-1">Định dạng JPG, PNG, WEBP, GIF · Tối đa 2MB</p>
        </div>
      </div>

      {/* Contact Info (editable by employee) */}
      <div className="p-5 bg-slate-50/60 border border-slate-200/60 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-500" /> Thông tin liên hệ
          </h3>
          {!editingContact ? (
            <button
              onClick={() => { setEditingContact(true); setPhone(profile?.phone || ''); setEmail(profile?.email || ''); }}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={handleSaveContact}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu
              </button>
              <button
                onClick={() => { setEditingContact(false); setPhone(profile?.phone || ''); setEmail(profile?.email || ''); }}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {editingContact ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Số điện thoại" value={phone} onChange={setPhone} type="tel" icon={Phone} placeholder="0912345678" />
            <InputField label="Email" value={email} onChange={setEmail} type="email" icon={Mail} placeholder="email@example.com" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField icon={Phone} label="Số điện thoại" value={profile?.phone || '—'} />
            <ReadOnlyField icon={Mail} label="Email" value={profile?.email || '—'} />
          </div>
        )}
      </div>

      {/* Read-only Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ReadOnlyField icon={Shield} label="Tên đăng nhập" value={`@${profile?.username || ''}`} />
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
            {profile?.status === 'ACTIVE' ? 'Đang hoạt động' : profile?.status === 'LOCKED' ? 'Đã khóa' : 'Đã nghỉ việc'}
          </div>
        </div>
        <ReadOnlyField icon={Calendar} label="Ngày sinh" value={formatDate(profile?.dateOfBirth || null)} />
        <ReadOnlyField icon={Users} label="Giới tính" value={profile?.gender || '—'} />
        <ReadOnlyField icon={IdCard} label="CCCD / CMND" value={profile?.nationalId || '—'} />
        <ReadOnlyField icon={MapPin} label="Địa chỉ" value={profile?.address || '—'} />
        <ReadOnlyField icon={Briefcase} label="Chức vụ" value={profile?.position || '—'} />
        <ReadOnlyField icon={Calendar} label="Ngày vào làm" value={formatDate(profile?.joinDate || null)} />
        <ReadOnlyField icon={Calendar} label="Ngày khởi tạo tài khoản" value={formatDate(profile?.createdAt || null)} />
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
      await changeMyPassword({ currentPassword: current, newPassword: newPwd, confirmPassword: confirm });
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
