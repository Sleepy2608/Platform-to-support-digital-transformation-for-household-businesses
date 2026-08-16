'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth } from '../lib/apiClient';
import { Shield, LogOut, Settings, Users, BarChart3 } from 'lucide-react';

export default function ManagerDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                MANAGER PORTAL
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center items-center text-center">
        <div className="max-w-2xl bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />
          
          <div className="inline-flex p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-6 shadow-inner animate-pulse">
            <Shield className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl mb-4">
            Cổng Quản Trị Viên (Manager)
          </h1>
          
          <p className="text-zinc-400 text-base max-w-lg mx-auto mb-8 leading-relaxed">
            Chào mừng bạn đến với Cổng Quản Trị Viên hệ thống. Tại đây bạn có thể quản lý thông tin các Chủ hộ kinh doanh và thực hiện các nhiệm vụ vận hành thông thường.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-md mx-auto">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-colors">
              <Users className="w-5 h-5 text-indigo-400 mb-2" />
              <div className="font-semibold text-sm text-zinc-200">Hộ kinh doanh</div>
              <div className="text-xs text-zinc-500">Quản lý tài khoản HKD</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-colors">
              <BarChart3 className="w-5 h-5 text-indigo-400 mb-2" />
              <div className="font-semibold text-sm text-zinc-200">Báo cáo</div>
              <div className="text-xs text-zinc-500">Thống kê & phân tích</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-colors">
              <Settings className="w-5 h-5 text-indigo-400 mb-2" />
              <div className="font-semibold text-sm text-zinc-200">Cài đặt</div>
              <div className="text-xs text-zinc-500">Cấu hình tài khoản</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} HBDT Digital Platform. All rights reserved.
      </footer>
    </div>
  );
}
