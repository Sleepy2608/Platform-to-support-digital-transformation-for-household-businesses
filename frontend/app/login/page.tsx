'use client';

import Link from 'next/link';
import { Store, ArrowLeft, LogIn, Lock, Mail } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image Kho hàng / Quản lý tài sản (Chủ đề liên quan HKD) */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop')`
        }}
      />

      {/* Nút Trở về trang chủ */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </Link>

      {/* Form Đăng nhập */}
      <div className="relative z-10 w-full max-w-md">
        <ScrollReveal>
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            {/* Header Form */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-white/10 rounded-2xl border border-zinc-600 mb-4 shadow-inner">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Đăng Nhập</h1>
              <p className="text-zinc-400 text-sm mt-2">
                Hệ thống Quản lý & AI Kế toán HKD.DIGITAL
              </p>
            </div>

            {/* Form Inputs */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Số điện thoại / Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="0912345678 hoặc email@domain.com"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>

              {/* Ghi nhớ đăng nhập */}
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-white focus:ring-0 cursor-pointer accent-white"
                />
                <label htmlFor="remember" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Ghi nhớ đăng nhập trên thiết bị này
                </label>
              </div>

              {/* Nút Submit */}
              <button 
                type="submit"
                className="w-full py-3.5 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập hệ thống
              </button>
            </form>

            {/* Footer Form */}
            <div className="text-center mt-6 pt-6 border-t border-zinc-800 text-xs text-zinc-400">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-white font-semibold hover:underline">
                Đăng ký dùng thử
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}