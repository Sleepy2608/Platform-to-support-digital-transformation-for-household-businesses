import { Store } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-b from-zinc-700/10 via-zinc-800/5 to-transparent blur-3xl pointer-events-none" />

      {/* Skeleton Top Navbar */}
      <header className="relative z-10 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl border border-zinc-800 animate-pulse">
              <Store className="w-5 h-5 text-white/50" />
            </div>
            <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-zinc-900 rounded-xl animate-pulse hidden sm:block" />
            <div className="h-8 w-24 bg-zinc-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </header>

      {/* Centerpiece Loading Spinner & Skeleton UI */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center text-center w-full">
        {/* Animated Brand Ring */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
            <Store className="w-8 h-8 text-zinc-300 animate-pulse" />
          </div>
          <div className="absolute -inset-1.5 rounded-3xl border-2 border-dashed border-zinc-600 animate-spin [animation-duration:8s] pointer-events-none" />
        </div>

        {/* Status text */}
        <div className="space-y-1.5 mb-6">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            HBDT<span className="text-zinc-500">.DIGITAL</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Đang tải dữ liệu và kết nối tài nguyên hệ thống...
          </p>
        </div>

        {/* Indeterminate linear loading bar */}
        <div className="w-56 h-1 bg-zinc-900 rounded-full overflow-hidden mb-12 border border-zinc-800/80">
          <div className="h-full w-1/3 bg-gradient-to-r from-zinc-500 via-white to-zinc-500 rounded-full animate-[shimmer_1.5s_infinite_linear]" />
        </div>

        {/* Skeleton dashboard placeholder preview */}
        <div className="w-full max-w-xl space-y-3 opacity-60">
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 rounded-xl bg-zinc-900/70 border border-zinc-800/80 animate-pulse p-3 space-y-2">
              <div className="h-3 w-12 bg-zinc-800 rounded" />
              <div className="h-5 w-20 bg-zinc-800/80 rounded" />
            </div>
            <div className="h-20 rounded-xl bg-zinc-900/70 border border-zinc-800/80 animate-pulse p-3 space-y-2">
              <div className="h-3 w-14 bg-zinc-800 rounded" />
              <div className="h-5 w-16 bg-zinc-800/80 rounded" />
            </div>
            <div className="h-20 rounded-xl bg-zinc-900/70 border border-zinc-800/80 animate-pulse p-3 space-y-2">
              <div className="h-3 w-10 bg-zinc-800 rounded" />
              <div className="h-5 w-14 bg-zinc-800/80 rounded" />
            </div>
          </div>
          <div className="h-28 rounded-xl bg-zinc-900/50 border border-zinc-800/60 animate-pulse p-4 space-y-2">
            <div className="h-3 w-32 bg-zinc-800 rounded" />
            <div className="h-3 w-full bg-zinc-800/50 rounded" />
            <div className="h-3 w-4/5 bg-zinc-800/50 rounded" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-900 bg-zinc-950 py-3 text-center text-[11px] text-zinc-600 font-mono">
        HBDT_APP_ROUTER_SUSPENSE_STREAMING
      </footer>
    </div>
  );
}
