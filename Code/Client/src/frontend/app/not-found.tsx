import Link from 'next/link';
import { Store, Home, LayoutDashboard, LogIn, Compass, ArrowLeft, ShoppingCart, Package, FileText } from 'lucide-react';

export const metadata = {
  title: '404 - Không tìm thấy trang | HBDT.DIGITAL',
  description: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển trên nền tảng HBDT.DIGITAL.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-white/10 rounded-xl border border-zinc-700 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wider text-white">
              HBDT<span className="text-zinc-400">.DIGITAL</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
          </Link>
        </div>
      </header>

      {/* Main 404 Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Giant decorative 404 watermark */}
        <div className="relative mb-2 select-none">
          <span className="text-8xl sm:text-9xl md:text-[11rem] font-black tracking-widest text-zinc-900/90 font-mono">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl shadow-black/80 backdrop-blur-sm">
              <Compass className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-300 animate-spin [animation-duration:12s]" />
            </div>
          </div>
        </div>

        {/* Status chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          HTTP 404 // RESOURCE NOT FOUND
        </div>

        {/* Heading & description */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Không tìm thấy trang yêu cầu
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto mb-2 leading-relaxed">
          Đường dẫn bạn vừa truy cập không tồn tại trên hệ thống HBDT, đã bị thay đổi địa chỉ hoặc yêu cầu quyền đăng nhập khác.
        </p>
        <p className="text-zinc-500 text-xs sm:text-sm max-w-md mx-auto mb-8 font-mono">
          The requested URL was not found on this server or has been relocated.
        </p>

        {/* Primary Navigation Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 w-full max-w-md">
          <Link
            href="/"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-white/10"
          >
            <Home className="w-4 h-4" /> Về Trang Chủ
          </Link>
          <Link
            href="/owner"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4 text-zinc-400" /> Bảng Điều Khiển
          </Link>
          <Link
            href="/login"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
          >
            <LogIn className="w-4 h-4" /> Đăng Nhập
          </Link>
        </div>

        {/* Quick portal shortcut links */}
        <div className="w-full max-w-xl border-t border-zinc-800/80 pt-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Điều hướng nhanh các phân hệ chính
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            <Link
              href="/employee/orders/new"
              className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 group-hover:text-white mb-0.5">
                <ShoppingCart className="w-3.5 h-3.5 text-zinc-400" /> POS Bán Hàng
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1">Tạo đơn hàng nhanh tại quầy</p>
            </Link>

            <Link
              href="/owner/products"
              className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 group-hover:text-white mb-0.5">
                <Package className="w-3.5 h-3.5 text-zinc-400" /> Quản Lý Kho
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1">Tra cứu tồn & cảnh báo hàng</p>
            </Link>

            <Link
              href="/owner/reports"
              className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 group-hover:text-white mb-0.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" /> Sổ Sách TT88
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1">Sổ S1, S2, S4 doanh thu thuế</p>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-600">
        <p>© 2026 HBDT.DIGITAL — Nền Tảng Chuyển Đổi Số Toàn Diện Cho Hộ Kinh Doanh Cá Thể</p>
      </footer>
    </div>
  );
}
