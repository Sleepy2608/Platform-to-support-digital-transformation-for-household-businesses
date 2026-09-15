import Navbar from './components/Navbar';
import ScrollReveal from './components/ScrollReveal';
import PricingPlans from './components/PricingPlans';
import HomePrimaryCta from './components/HomePrimaryCta';
import {
  Bot,
  ShoppingCart,
  Printer,
  Receipt,
  Package,
  HandCoins,
  Users,
  Tags,
  BarChart3,
  UserCog,
  CreditCard,
  Bell,
  Zap,
} from 'lucide-react';

interface Feature {
  icon: typeof Bot;
  title: string;
  description: string;
}

// Toàn bộ tính năng đang có trong hệ thống HBDT (bán hàng, kho, công nợ, kế toán, báo cáo, quản trị)
const FEATURES: Feature[] = [
  {
    icon: Bot,
    title: 'Trợ lý AI Đặt hàng',
    description:
      'Nhập hoặc nhắn tin bằng tiếng Việt tự nhiên, AI đọc hiểu và tạo đơn hàng nháp. Nhân viên chỉ cần kiểm tra, sửa hoặc xác nhận — AI không khả dụng vẫn nhập đơn tay bình thường.',
  },
  {
    icon: ShoppingCart,
    title: 'Bán hàng tại quầy (POS)',
    description:
      'Tạo đơn cực nhanh: tìm sản phẩm tức thời, chọn số lượng, gán khách hàng, xác nhận hoặc huỷ đơn. Giao diện Fast Sales tối ưu cho điện thoại.',
  },
  {
    icon: Printer,
    title: 'Hoá đơn & In ấn',
    description:
      'In hoặc xuất hoá đơn bán hàng ra PDF theo mẫu có sẵn, lưu toàn bộ lịch sử đơn để tra cứu và gửi lại cho khách khi cần.',
  },
  {
    icon: Receipt,
    title: 'Kế toán Thông tư 88',
    description:
      'Tự động ghi sổ S1-HKD (doanh thu), S2-HKD (kho hàng) và S4-HKD (nghĩa vụ thuế); duyệt – sửa – từ chối báo cáo và xuất file Excel/PDF.',
  },
  {
    icon: Package,
    title: 'Nhập – Xuất – Tồn kho',
    description:
      'Lập phiếu nhập kho, theo dõi tồn theo nhiều đơn vị tính, tự động trừ kho khi xác nhận đơn, hoàn kho khi huỷ đơn và cảnh báo hàng sắp hết.',
  },
  {
    icon: HandCoins,
    title: 'Công nợ khách hàng',
    description:
      'Bán chịu và thu nợ theo từng đợt, mọi biến động nợ đều được ghi nhật ký, tự hoàn nợ khi huỷ đơn — không còn thất lạc sổ nợ.',
  },
  {
    icon: Users,
    title: 'Khách hàng & Lịch sử mua',
    description:
      'Lưu hồ sơ khách hàng, tra cứu toàn bộ lịch sử mua hàng và số dư công nợ hiện tại của từng khách chỉ trong vài giây.',
  },
  {
    icon: Tags,
    title: 'Sản phẩm, Đơn vị tính & Giá bán',
    description:
      'Quản lý danh mục, ảnh sản phẩm, nhiều đơn vị tính với tỷ lệ quy đổi và quy tắc giá linh hoạt; nhập danh mục hàng loạt từ file Excel.',
  },
  {
    icon: BarChart3,
    title: 'Báo cáo & Phân tích',
    description:
      'Doanh thu theo ngày/tuần/tháng, biểu đồ trực quan, lọc theo khoảng ngày, thống kê mặt hàng bán chạy – bán chậm và công nợ còn lại.',
  },
  {
    icon: UserCog,
    title: 'Quản lý Nhân viên & Phân quyền',
    description:
      'Tạo tài khoản nhân viên, đặt lại mật khẩu, khoá/mở tài khoản. Bốn cấp quyền rõ ràng và dữ liệu tách biệt tuyệt đối theo từng hộ kinh doanh.',
  },
  {
    icon: CreditCard,
    title: 'Gói thuê bao linh hoạt',
    description:
      'Chọn gói Miễn phí, Cơ bản hoặc VIP, chủ động gia hạn 1–24 tháng; tính năng của hệ thống tự mở khoá tương ứng với gói đang dùng.',
  },
  {
    icon: Bell,
    title: 'Thông báo thời gian thực',
    description:
      'Chuông thông báo báo ngay khi AI tạo đơn nháp, khi đơn đổi trạng thái hoặc khi kho sắp hết hàng — không bỏ lỡ đơn nào.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden select-none" style={{ cursor: 'default' }}>
      {/* Background Image công ty */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop')`
        }}
      />

      <div className="relative z-10 flex flex-col">
        <Navbar />

        {/* Hero Section */}
        <section className="px-4 sm:px-8 pt-28 pb-16 min-h-screen flex flex-col justify-center items-center text-center max-w-5xl mx-auto">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-600 text-zinc-100 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-6 backdrop-blur-md cursor-default hover:bg-zinc-700/80 transition-colors duration-300 shadow-md select-none">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> Giải pháp chuyển đổi số cho Hộ Kinh Doanh
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white max-w-4xl mx-auto leading-tight tracking-tight drop-shadow-md select-none" style={{ cursor: 'default', userSelect: 'none' }}>
              NỀN TẢNG HỖ TRỢ CHUYỂN ĐỔI SỐ CHO HỘ KINH DOANH <br className="hidden sm:inline" />
              <span style={{ color: '#B3945B' }}> TỰ ĐỘNG BẰNG AI</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-sm sm:text-base md:text-lg text-zinc-200 mt-4 sm:mt-6 max-w-2xl mx-auto drop-shadow px-2 select-none" style={{ cursor: 'default', userSelect: 'none' }}>
              Không còn ghi chép sổ sách thủ công. Tự động hóa đơn hàng, theo dõi công nợ chuẩn xác và báo cáo thuế Thông tư 88 chỉ với vài cái chạm.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="mt-6 sm:mt-8 flex justify-center gap-4">
              <HomePrimaryCta />
            </div>
          </ScrollReveal>
        </section>

        {/* Feature Section */}
        <section id="features" className="px-4 sm:px-8 py-16 sm:py-24 bg-zinc-900/85 border-t border-zinc-800 backdrop-blur-md">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-white select-none" style={{ cursor: 'default', userSelect: 'none' }}>Tính năng cho Hộ Kinh Doanh</h2>
                <p className="text-zinc-400 text-sm sm:text-base mt-2 select-none" style={{ cursor: 'default', userSelect: 'none' }}>Đầy đủ nghiệp vụ của một hộ kinh doanh: bán hàng, kho, công nợ, kế toán, báo cáo — chỉ cần một chiếc điện thoại.</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <ScrollReveal key={feature.title} delay={0.05 * (index % 3)}>
                    <div className="p-6 sm:p-8 border border-zinc-700/80 rounded-2xl bg-zinc-800/70 backdrop-blur-md transition-all duration-300 hover:border-zinc-400 hover:-translate-y-2 hover:shadow-2xl hover:bg-zinc-800 cursor-pointer group h-full">
                      <div className="p-3 bg-zinc-700/80 w-fit rounded-xl mb-5 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-zinc-600">
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-zinc-100 select-none" style={{ userSelect: 'none' }}>{feature.title}</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed select-none" style={{ userSelect: 'none' }}>{feature.description}</p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section — 3 gói: Gói Miễn Phí, Gói Cơ Bản & Gói VIP */}
        <section id="pricing" className="px-4 sm:px-8 py-16 sm:py-24 max-w-7xl mx-auto w-full">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-3 select-none" style={{ cursor: 'default', userSelect: 'none' }}>Bảng giá gói dịch vụ</h2>
            <p className="text-center text-zinc-300 text-sm sm:text-base mb-12 sm:mb-16 select-none" style={{ cursor: 'default', userSelect: 'none' }}>Chọn gói tính năng phù hợp nhất với cửa hàng của bạn</p>
          </ScrollReveal>

          <PricingPlans />
        </section>
      </div>
    </main>
  );
}

