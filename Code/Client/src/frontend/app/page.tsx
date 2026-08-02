'use client';

import Navbar from './components/Navbar';
import ScrollReveal from './components/ScrollReveal';
import { CheckCircle, Bot, Receipt, Package, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden select-none">
      {/* Background Image công ty */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop')`
        }}
      />

      <div className="relative z-10 flex flex-col">
        <Navbar />

        {/* Hero Section - Đã chỉnh min-h-screen và flex-1 để phủ kín màn hình */}
        <section className="px-4 sm:px-8 pt-28 pb-16 min-h-screen flex flex-col justify-center items-center text-center max-w-5xl mx-auto">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-600 text-zinc-100 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-6 backdrop-blur-md cursor-default hover:bg-zinc-700/80 transition-colors duration-300 shadow-md">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> Giải pháp chuyển đổi số cho Hộ Kinh Doanh
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white max-w-4xl mx-auto leading-tight tracking-tight drop-shadow-md">
              NỀN TẢNG HỖ TRỢ CHUYỂN ĐỔI SỐ CHO HỘ KINH DOANH <br className="hidden sm:inline" />
              <span className="text-zinc-300"> TỰ ĐỘNG BẰNG AI</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-sm sm:text-base md:text-lg text-zinc-200 mt-4 sm:mt-6 max-w-2xl mx-auto drop-shadow px-2">
              Không còn ghi chép sổ sách thủ công. Tự động hóa đơn hàng, theo dõi công nợ chuẩn xác và báo cáo thuế Thông tư 88 chỉ với vài cái chạm.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="mt-6 sm:mt-8 flex justify-center gap-4">
              <button className="w-full sm:w-auto bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 group text-sm sm:text-base">
                Bắt đầu trải nghiệm ngay 
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </ScrollReveal>
        </section>

        {/* Feature Section */}
        <section id="features" className="px-4 sm:px-8 py-16 sm:py-24 bg-zinc-900/85 border-t border-zinc-800 backdrop-blur-md">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Tính năng cho Hộ Kinh Doanh</h2>
                <p className="text-zinc-400 text-sm sm:text-base mt-2">Được thiết kế riêng cho các hộ kinh doanh vật liệu, tạp hóa, bán lẻ...</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <ScrollReveal delay={0.1}>
                <div className="p-6 sm:p-8 border border-zinc-700/80 rounded-2xl bg-zinc-800/70 backdrop-blur-md transition-all duration-300 hover:border-zinc-400 hover:-translate-y-2 hover:shadow-2xl hover:bg-zinc-800 cursor-pointer group h-full">
                  <div className="p-3 bg-zinc-700/80 w-fit rounded-xl mb-5 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-zinc-600">
                    <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-zinc-100">Trợ lý AI Đặt hàng</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">Đọc hiểu tin nhắn/giọng nói để tự động tạo đơn hàng nháp, giúp nhân viên tạo đơn cực nhanh.</p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <div className="p-6 sm:p-8 border border-zinc-700/80 rounded-2xl bg-zinc-800/70 backdrop-blur-md transition-all duration-300 hover:border-zinc-400 hover:-translate-y-2 hover:shadow-2xl hover:bg-zinc-800 cursor-pointer group h-full">
                  <div className="p-3 bg-zinc-700/80 w-fit rounded-xl mb-5 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-zinc-600">
                    <Receipt className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-zinc-100">Kế toán Thông tư 88</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">Tự động lập 7 sổ kế toán theo quy định của Bộ Tài Chính, sẵn sàng xuất file báo cáo thuế.</p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div className="p-6 sm:p-8 border border-zinc-700/80 rounded-2xl bg-zinc-800/70 backdrop-blur-md transition-all duration-300 hover:border-zinc-400 hover:-translate-y-2 hover:shadow-2xl hover:bg-zinc-800 cursor-pointer group h-full">
                  <div className="p-3 bg-zinc-700/80 w-fit rounded-xl mb-5 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-zinc-600">
                    <Package className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-zinc-100">Kho & Công Nợ Chi Tiết</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">Quản lý nhập xuất tồn kho nhiều đơn vị tính, ghi nhận nợ khách hàng chính xác từng đồng.</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto w-full">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-3">Bảng giá gói dịch vụ</h2>
            <p className="text-center text-zinc-300 text-sm sm:text-base mb-12 sm:mb-16">Chọn gói tính năng phù hợp nhất với cửa hàng của bạn</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* Gói BASIC */}
            <ScrollReveal delay={0.1}>
              <div className="border border-zinc-700 bg-zinc-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-zinc-500 hover:-translate-y-2 hover:shadow-xl h-full">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Gói Basic</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1">Cho cửa hàng nhỏ bắt đầu chuyển đổi số</p>
                  <div className="mt-4 sm:mt-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">99.000đ</span>
                    <span className="text-zinc-400 text-xs sm:text-sm"> /tháng</span>
                  </div>
                  <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-zinc-200 text-xs sm:text-sm">
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 flex-shrink-0" /> Bán hàng tại quầy đơn giản</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 flex-shrink-0" /> Quản lý danh mục sản phẩm</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 flex-shrink-0" /> 1 tài khoản quản lý</li>
                  </ul>
                </div>
                <button className="mt-6 sm:mt-8 w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer border border-zinc-600 text-sm">
                  Đăng ký Basic
                </button>
              </div>
            </ScrollReveal>

            {/* Gói STANDARD */}
            <ScrollReveal delay={0.2}>
              <div className="border border-zinc-600 bg-zinc-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300 hover:border-zinc-400 hover:-translate-y-2 hover:shadow-2xl h-full">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Gói Standard</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1">Cho cửa hàng bán lẻ có quản lý kho & nợ</p>
                  <div className="mt-4 sm:mt-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">199.000đ</span>
                    <span className="text-zinc-400 text-xs sm:text-sm"> /tháng</span>
                  </div>
                  <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-zinc-200 text-xs sm:text-sm">
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 flex-shrink-0" /> Tất cả tính năng gói Basic</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 flex-shrink-0" /> Quản lý tồn kho & công nợ</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 flex-shrink-0" /> Lập sổ kế toán TT 88/2021</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 flex-shrink-0" /> Tối đa 3 tài khoản nhân viên</li>
                  </ul>
                </div>
                <button className="mt-6 sm:mt-8 w-full py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-semibold transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer border border-zinc-500 text-sm">
                  Đăng ký Standard
                </button>
              </div>
            </ScrollReveal>

            {/* Gói VIP */}
            <ScrollReveal delay={0.3}>
              <div className="border-2 border-white bg-white text-zinc-950 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl transition-all duration-300 hover:-translate-y-3 hover:shadow-white/20 h-full mt-4 md:mt-0">
                <span className="absolute -top-3.5 right-6 sm:right-8 bg-zinc-950 text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  Gói VIP Đề Xuất
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Gói VIP (Pro)</h3>
                  <p className="text-zinc-600 text-xs sm:text-sm mt-1">Đầy đủ sức mạnh AI & Kế toán tự động</p>
                  <div className="mt-4 sm:mt-6">
                    <span className="text-3xl sm:text-4xl font-extrabold">399.000đ</span>
                    <span className="text-zinc-600 text-xs sm:text-sm"> /tháng</span>
                  </div>
                  <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-zinc-800 text-xs sm:text-sm font-medium">
                    <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 flex-shrink-0" /> Tất cả tính năng gói Standard</li>
                    <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 flex-shrink-0" /> Trợ lý AI đọc đơn giọng nói / tin nhắn</li>
                    <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-zinc-950 flex-shrink-0" /> Tự động hóa báo cáo thuế trọn gói</li>
                    <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-zinc-950 flex-shrink-0" /> Không giới hạn nhân viên</li>
                  </ul>
                </div>
                <button className="mt-6 sm:mt-8 w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 text-white rounded-xl font-bold transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer shadow-md text-sm">
                  Đăng ký Gói VIP
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </main>
  );
}