'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, LogIn, Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import ScrollReveal from '../../components/ScrollReveal';
import { saveAuthData } from '../../lib/apiClient';

export default function EmployeeLoginPage() {
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

        const isEmployee = Array.isArray(roles) && roles.includes('EMPLOYEE');
        const isBusinessOwner = Array.isArray(roles) && roles.includes('BUSINESS_OWNER');

        if (isBusinessOwner && !isEmployee) {
          setError('Tài khoản Chủ hộ kinh doanh vui lòng đăng nhập tại trang Đăng nhập chính (/login)');
          setLoading(false);
          return;
        }

        if (!isEmployee) {
          setError('Tài khoản không có quyền truy cập Cổng Nhân viên');
          setLoading(false);
          return;
        }

        // Persist session
        saveAuthData({
          accessToken,
          refreshToken,
          userId,
          username: resUser,
          fullName,
          email,
          roles,
          businessId,
          avatarUrl,
        });

        router.push('/employee/account');
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
    <main className="min-h-screen bg-zinc-950 text-white relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Trang chủ
      </Link>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <ScrollReveal>
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-4 text-emerald-400 shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Cổng Nhân Viên</h1>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 font-medium">
                Đăng nhập tài khoản nhân viên được cấp bởi Chủ hộ kinh doanh
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="employee-login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="employee-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
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
                id="employee-login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Đang xác thực...' : 'Đăng nhập Cổng Nhân viên'}
              </button>
            </form>

            {/* Notice */}
            <div className="text-center mt-6 pt-6 border-t border-zinc-800 text-xs text-zinc-500">
              Bạn chưa có tài khoản? Liên hệ Chủ hộ kinh doanh để được cấp quyền truy cập.
            </div>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
