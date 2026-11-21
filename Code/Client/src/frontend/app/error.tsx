'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, RefreshCw, Home, ChevronDown, ChevronUp, Store, ShieldAlert } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error to client console or monitoring service (e.g. Sentry)
    console.error('[HBDT Global Error Boundary caught]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-rose-500/20 selection:text-white">
      {/* Ambient destructive/rose glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-gradient-to-b from-rose-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/30">
              <Store className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-lg font-bold tracking-wider text-white">
              HBDT<span className="text-zinc-400">.DIGITAL</span>
            </span>
          </Link>
          <div className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>RESILIENCE_MODE</span>
          </div>
        </div>
      </header>

      {/* Main Error Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Error icon badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shadow-2xl shadow-rose-950/50">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-zinc-950 animate-ping" />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-zinc-950" />
        </div>

        {/* Technical Status Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          ERROR BOUNDARY // APPLICATION_EXCEPTION
        </div>

        {/* Heading & description */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Đã xảy ra sự cố không mong muốn
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto mb-2 leading-relaxed">
          Hệ thống gặp sự cố trong quá trình kết xuất giao diện. Cây component đã được cô lập an toàn bởi Global Error Boundary.
        </p>
        <p className="text-zinc-500 text-xs max-w-md mx-auto mb-6 font-mono">
          An unexpected runtime exception was intercepted. You can retry the component state or reload the page.
        </p>

        {/* Digest ID Tag if provided by Next.js */}
        {error.digest && (
          <div className="mb-6 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 font-mono text-xs text-zinc-400">
            Error Digest ID: <span className="text-zinc-200 select-all">{error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 w-full max-w-md">
          <button
            onClick={() => reset()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-white/10 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Thử lại (Reset)
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" /> Tải lại trang
          </button>
          <Link
            href="/"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
          >
            <Home className="w-4 h-4" /> Trang chủ
          </Link>
        </div>

        {/* Technical Diagnostics Accordion */}
        <div className="w-full max-w-lg border-t border-zinc-800/80 pt-4 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <span>Chi tiết lỗi kỹ thuật (Diagnostics)</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-xs text-rose-300/90 break-all space-y-2">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Message:</span>
                <p className="mt-0.5">{error.message || 'Unknown runtime error'}</p>
              </div>
              {error.stack && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px] uppercase mb-1">Stack Trace:</span>
                  <pre className="text-[11px] text-zinc-400 overflow-x-auto max-h-40 custom-scrollbar p-2 rounded bg-zinc-950/70">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-600">
        <p>© 2026 HBDT.DIGITAL — Sẵn sàng phục hồi & Bảo vệ hệ thống</p>
      </footer>
    </div>
  );
}
