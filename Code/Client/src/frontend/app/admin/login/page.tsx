'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldCheck, LogIn, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ScrollReveal from '../../components/ScrollReveal';

import { saveAuthData } from '../../lib/apiClient';
import { getLoginRedirectPath, type AppRole } from '../../lib/roles';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Đăng nhập không thành công');
      }

      if (resData.success && resData.data) {
        const {
          accessToken,
          refreshToken,
          userId,
          username: resUser,
          fullName,
          email,
          roles,
          businessId,
          avatarUrl,
        } = resData.data;

        const rolesArr: AppRole[] = Array.isArray(roles) ? roles as AppRole[] : [];

        // Chỉ cho phép ADMIN đăng nhập tại đây (cổng admin riêng)
        const isAdminPortalUser = rolesArr.includes('ADMIN');

        if (!isAdminPortalUser) {
          setError('Tài khoản này không phải quản trị viên hệ thống cấp cao. Vui lòng sử dụng đúng cổng đăng nhập.');
          setLoading(false);
          return;
        }

        saveAuthData({
          accessToken,
          refreshToken,
          userId,
          username: resUser,
          fullName,
          email,
          roles: rolesArr,
          businessId,
          avatarUrl,
        });

        // Redirect về /admin – layout sẽ phân biệt HEAD_ADMIN / ADMIN để hiển thị menu
        const redirectPath = getLoginRedirectPath(rolesArr, businessId);
        router.push(redirectPath);
      } else {
        throw new Error('Dữ liệu phản hồi không hợp lệ');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Có lỗi xảy ra, vui lòng thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative flex items-center justify-center p-4 overflow-hidden select-none" style={{ cursor: 'default' }}>
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <ScrollReveal>
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-white/10 rounded-2xl border border-zinc-600 mb-4 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white select-none" style={{ userSelect: 'none' }}>Đăng Nhập Quản Trị</h1>
              <p className="text-zinc-400 text-sm mt-2 select-none" style={{ userSelect: 'none' }}>
                Khu vực dành riêng cho quản trị viên hệ thống
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2 select-none" style={{ userSelect: 'none', cursor: 'default' }}>
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all cursor-text select-text"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2 select-none" style={{ userSelect: 'none', cursor: 'default' }}>
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all cursor-text select-text"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="admin-login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Đang xác thực...' : 'Đăng nhập quản trị'}
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
