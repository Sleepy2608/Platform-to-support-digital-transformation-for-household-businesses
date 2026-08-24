no'use client';

import { useEffect, useRef, useState } from 'react';
import {
  UserCircle, Mail, Phone, Shield, Camera, Lock,
  Check, AlertTriangle, Loader2, Eye, EyeOff, Edit3, Save, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';

interface AdminProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit info state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ fullName: '', email: '', phone: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingInfo, setSavingInfo] = useState(false);

  // Password change state
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Profile ─────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<AdminProfile>('/api/admin/profile');
      setProfile(data);
      setEditData({
        fullName: data.fullName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ─── Auto-dismiss messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // ─── Update Profile Info ───────────────────────────────────────────────────
  const validateInfo = () => {
    const errs: Record<string, string> = {};
    if (!editData.fullName.trim()) errs.fullName = 'Họ và tên không được để trống';
    if (!editData.email.trim()) errs.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) errs.email = 'Email không hợp lệ';
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveInfo = async () => {
    if (!validateInfo()) return;
    setSavingInfo(true);
    try {
      const data = await apiClient.put<AdminProfile>('/api/admin/profile', editData);
      setProfile(data);
      setIsEditing(false);
      setSuccessMsg('Cập nhật thông tin thành công!');
      // Sync localStorage & sessionStorage for sidebar
      localStorage.setItem('fullName', data.fullName ?? '');
      sessionStorage.setItem('fullName', data.fullName ?? '');
      window.dispatchEvent(new CustomEvent('admin-profile-updated', { detail: data }));
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditErrors({});
    if (profile) {
      setEditData({
        fullName: profile.fullName ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
      });
    }
  };

  // ─── Change Password ───────────────────────────────────────────────────────
  const validatePw = () => {
    const errs: Record<string, string> = {};
    if (!pwData.currentPassword) errs.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!pwData.newPassword) errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (pwData.newPassword.length < 6) errs.newPassword = 'Mật khẩu mới phải từ 6 ký tự';
    if (!pwData.confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (pwData.newPassword !== pwData.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePw()) return;
    setSavingPw(true);
    try {
      await apiClient.put('/api/admin/profile/password', pwData);
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
      setSuccessMsg('Đổi mật khẩu thành công!');
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSavingPw(false);
    }
  };

  // ─── Upload Avatar ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 2MB');
      return;
    }
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await apiClient.upload<AdminProfile>('/api/admin/profile/avatar', formData);
      setProfile(data);
      if (data.avatarUrl) {
        localStorage.setItem('avatarUrl', data.avatarUrl);
        sessionStorage.setItem('avatarUrl', data.avatarUrl);
      }
      window.dispatchEvent(new CustomEvent('admin-profile-updated', { detail: data }));
      setSuccessMsg('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getInitials = (name: string) =>
    name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'A';

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      ACTIVE: { label: 'Hoạt động', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
      LOCKED: { label: 'Bị khóa', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
      DEACTIVATED: { label: 'Đã hủy', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    };
    const s = map[status] ?? { label: status, cls: 'bg-zinc-700 text-zinc-300 border-zinc-600' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {s.label}
      </span>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-zinc-700 border-t-white animate-spin" />
          <p className="text-zinc-400 text-sm">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-zinc-400 text-sm mt-1">Quản lý thông tin tài khoản và bảo mật của bạn</p>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </motion.div>
        )}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {profile && (
        <>
          {/* ── Card: Avatar + Basic Info ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-zinc-300">
                      {getInitials(profile.fullName)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Đổi ảnh đại diện"
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-zinc-950 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {uploadingAvatar
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Camera className="w-3.5 h-3.5" />
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name + Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-white truncate">{profile.fullName}</h2>
                  {statusBadge(profile.status)}
                </div>
                <p className="text-zinc-400 text-sm mt-1">@{profile.username}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Shield className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-500">Quản trị viên hệ thống</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Tham gia: {formatDate(profile.createdAt)}
                </p>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            {/* ── Info Fields ──────────────────────────────────────────────── */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <UserCircle className="w-3.5 h-3.5" /> Họ và tên
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={editData.fullName}
                      onChange={e => setEditData(p => ({ ...p, fullName: e.target.value }))}
                      className={`w-full px-4 py-2.5 bg-zinc-800 border rounded-xl text-white text-sm outline-none focus:ring-2 transition-all ${
                        editErrors.fullName
                          ? 'border-red-500/60 focus:ring-red-500/30'
                          : 'border-zinc-700 focus:ring-white/10 focus:border-zinc-600'
                      }`}
                      placeholder="Họ và tên"
                    />
                    {editErrors.fullName && (
                      <p className="text-red-400 text-xs mt-1">{editErrors.fullName}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-white text-sm font-medium px-1">{profile.fullName || '—'}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={e => setEditData(p => ({ ...p, email: e.target.value }))}
                      className={`w-full px-4 py-2.5 bg-zinc-800 border rounded-xl text-white text-sm outline-none focus:ring-2 transition-all ${
                        editErrors.email
                          ? 'border-red-500/60 focus:ring-red-500/30'
                          : 'border-zinc-700 focus:ring-white/10 focus:border-zinc-600'
                      }`}
                      placeholder="admin@example.com"
                    />
                    {editErrors.email && (
                      <p className="text-red-400 text-xs mt-1">{editErrors.email}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-white text-sm font-medium px-1">{profile.email || '—'}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5" /> Số điện thoại
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-white/10 focus:border-zinc-600 transition-all"
                      placeholder="0xxxxxxxxx"
                    />
                  </div>
                ) : (
                  <p className="text-white text-sm font-medium px-1">{profile.phone || '—'}</p>
                )}
              </div>

              {/* Username (read-only) */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" /> Tên đăng nhập
                </label>
                <p className="text-zinc-400 text-sm font-mono px-1">@{profile.username}</p>
              </div>
            </div>

            {/* Edit Action Buttons */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 flex items-center gap-3 pt-6 border-t border-zinc-800"
                >
                  <button
                    onClick={handleSaveInfo}
                    disabled={savingInfo}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={savingInfo}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl border border-zinc-700 transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Card: Change Password ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Lock className="w-4 h-4 text-zinc-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Đổi mật khẩu</h3>
                <p className="text-zinc-500 text-xs">Cập nhật mật khẩu để bảo vệ tài khoản</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={pwData.currentPassword}
                    onChange={e => setPwData(p => ({ ...p, currentPassword: e.target.value }))}
                    className={`w-full px-4 py-2.5 pr-10 bg-zinc-800 border rounded-xl text-white text-sm outline-none focus:ring-2 transition-all ${
                      pwErrors.currentPassword
                        ? 'border-red-500/60 focus:ring-red-500/30'
                        : 'border-zinc-700 focus:ring-white/10 focus:border-zinc-600'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.currentPassword && (
                  <p className="text-red-400 text-xs">{pwErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={pwData.newPassword}
                    onChange={e => setPwData(p => ({ ...p, newPassword: e.target.value }))}
                    className={`w-full px-4 py-2.5 pr-10 bg-zinc-800 border rounded-xl text-white text-sm outline-none focus:ring-2 transition-all ${
                      pwErrors.newPassword
                        ? 'border-red-500/60 focus:ring-red-500/30'
                        : 'border-zinc-700 focus:ring-white/10 focus:border-zinc-600'
                    }`}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.newPassword && (
                  <p className="text-red-400 text-xs">{pwErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={pwData.confirmPassword}
                    onChange={e => setPwData(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-2.5 pr-10 bg-zinc-800 border rounded-xl text-white text-sm outline-none focus:ring-2 transition-all ${
                      pwErrors.confirmPassword
                        ? 'border-red-500/60 focus:ring-red-500/30'
                        : 'border-zinc-700 focus:ring-white/10 focus:border-zinc-600'
                    }`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.confirmPassword && (
                  <p className="text-red-400 text-xs">{pwErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={savingPw}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium rounded-xl transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Đổi mật khẩu
              </button>
            </div>
          </motion.div>

          {/* ── Meta Info ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl px-6 py-4 flex flex-wrap gap-6 text-xs text-zinc-600"
          >
            <span>ID: <span className="text-zinc-400 font-mono">#{profile.id}</span></span>
            <span>Tạo lúc: <span className="text-zinc-400">{formatDate(profile.createdAt)}</span></span>
            <span>Cập nhật: <span className="text-zinc-400">{formatDate(profile.updatedAt)}</span></span>
          </motion.div>
        </>
      )}
    </div>
  );
}
