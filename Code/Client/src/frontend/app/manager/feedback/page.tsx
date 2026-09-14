'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare, Shield } from 'lucide-react';
import AdminFeedbackPage from '../../admin/feedback/page';

export default function ManagerFeedbackPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/manager"
              aria-label="Quay lại trang quản lý"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </Link>
            <div className="h-6 w-px bg-zinc-800" />
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="rounded-xl bg-white p-2 text-zinc-950 shadow-xs">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-wide">MANAGER</p>
                <p className="hidden text-xs text-zinc-400 sm:block">Trung tâm xử lý phản hồi</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm font-semibold text-zinc-400 sm:flex">
            <MessageSquare className="h-4 w-4" />
            Phản hồi người dùng
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminFeedbackPage />
      </main>
    </div>
  );
}
