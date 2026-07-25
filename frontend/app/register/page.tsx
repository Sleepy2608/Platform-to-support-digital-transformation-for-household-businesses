'use client';

import Link from 'next/link';
import { Store, ArrowLeft, UserPlus, Lock, Mail, Phone, User, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image khác: Bàn làm việc công nghệ / Chuyển đổi số doanh nghiệp */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2000&auto=format&fit=crop')`
        }}
      />

      {/* Nút Trở về trang chủ */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </Link>

      {/* Form Đăng ký */}
      <div className="relative z-10 w-full max-w-xl my-12">
        <ScrollReveal>
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
            {/* Header Form */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-white/10 rounded-2xl border border-zinc-600 mb-4 shadow-inner">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Đăng Ký Dùng Thử</h1>
              <p className="text-zinc-400 text-sm mt-2">
                Trải nghiệm trọn bộ giải pháp AI Quản lý & Kế toán TT88 miễn phí 14 ngày
              </p>
            </div>

            {/* Form Inputs */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-5">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Họ và tên chủ hộ / Quản lý
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>

              {/* Số điện thoại & Email (2 cột trên màn hình vừa/lớn) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="tel" 
                      placeholder="0912345678"
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="email" 
                      placeholder="email@example.com"
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Tên Cửa hàng / Hộ kinh doanh */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Tên cửa hàng / Hộ kinh doanh
                </label>
                <div className="relative">
                  <Store className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Cửa hàng VLXD An Phát / Tạp Hóa Minh Anh..."
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="password" 
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>

              {/* Quyền lợi đi kèm */}
              <div className="p-3.5 bg-zinc-800/50 rounded-xl border border-zinc-700/50 text-xs text-zinc-300 space-y-1.5 my-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Miễn phí 14 ngày không cần thẻ tín dụng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Hỗ trợ cài đặt & hướng dẫn dùng AI trực tiếp</span>
                </div>
              </div>

              {/* Nút Submit Đăng Ký Ngay */}
              <button 
                type="submit"
                className="w-full py-3.5 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" /> Đăng ký ngay
              </button>
            </form>

            {/* Footer Form */}
            <div className="text-center mt-6 pt-6 border-t border-zinc-800 text-xs text-zinc-400">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-white font-semibold hover:underline">
                Đăng nhập tại đây
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}