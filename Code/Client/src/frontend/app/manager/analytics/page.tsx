'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, LogOut } from 'lucide-react';
import PlatformAnalyticsDashboard from '../../components/PlatformAnalyticsDashboard';
import { clearAuth } from '../../lib/apiClient';

export default function ManagerAnalyticsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/manager"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-slate-900 p-2 text-white shadow-xs">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">MANAGER</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/manager/invoices"
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Lịch sử hóa đơn
            </Link>
            <button
              onClick={() => {
                clearAuth();
                router.push('/login');
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PlatformAnalyticsDashboard variant="light" />
      </main>
    </div>
  );
}
