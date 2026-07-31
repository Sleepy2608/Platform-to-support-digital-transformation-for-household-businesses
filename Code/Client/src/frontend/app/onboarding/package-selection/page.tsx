'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Zap, Crown, Loader2, AlertCircle } from 'lucide-react';

// ─── Package Data ─────────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: 'STANDARD',
    name: 'Gói Standard',
    price: '199.000đ',
    period: '/tháng',
    description: 'Cho cửa hàng bán lẻ có quản lý kho & nợ',
    icon: Zap,
    badge: null,
    features: [
      'Tất cả tính năng gói Basic',
      'Quản lý tồn kho & công nợ',
      'Lập sổ kế toán TT 88/2021',
      'Tối đa 3 tài khoản nhân viên',
    ],
    theme: {
      card: 'bg-white border-2 border-slate-200 hover:border-slate-900',
      btn: 'bg-slate-900 hover:bg-slate-700 text-white',
      icon: 'bg-slate-100 text-slate-900',
      checkIcon: CheckCircle,
      checkColor: 'text-slate-700',
      badge: null,
    },
  },
  {
    id: 'VIP',
    name: 'Gói VIP (Pro)',
    price: '399.000đ',
    period: '/tháng',
    description: 'Đầy đủ sức mạnh AI & Kế toán tự động',
    icon: Crown,
    badge: 'Gói VIP Đề Xuất',
    features: [
      'Tất cả tính năng gói Standard',
      'Trợ lý AI đọc đơn giọng nói / tin nhắn',
      'Tự động hóa báo cáo thuế trọn gói',
      'Không giới hạn nhân viên',
    ],
    theme: {
      card: 'bg-zinc-950 border-2 border-zinc-950 text-white hover:border-zinc-700',
      btn: 'bg-white hover:bg-zinc-100 text-zinc-950 font-bold',
      icon: 'bg-zinc-800 text-white',
      checkIcon: ShieldCheck,
      checkColor: 'text-zinc-300',
      badge: 'Gói VIP Đề Xuất',
    },
  },
] as const;

// ─── API helper ───────────────────────────────────────────────────────────────
async function selectPackageApi(packageType: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(
    `http://localhost:8080/api/owner/subscription/select-package?packageType=${packageType}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 403) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
    throw new Error(json.message || `Lỗi ${res.status}`);
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function PackageSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (packageType: string) => {
    setLoading(packageType);
    setError(null);
    try {
      await selectPackageApi(packageType);
      router.push('/owner/account');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-2">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8 sm:mb-12"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          Chọn gói dịch vụ phù hợp
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
          Bắt đầu với 1 tháng miễn phí. Hủy bất kỳ lúc nào. Nâng cấp sau cũng được.
        </p>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {PACKAGES.map((pkg, idx) => {
          const isLoading = loading === pkg.id;
          const isDisabled = loading !== null;
          const CheckIcon = pkg.theme.checkIcon;
          const PkgIcon = pkg.icon;
          const isVip = pkg.id === 'VIP';

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.4 }}
              className={`relative rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${pkg.theme.card}`}
            >
              {/* VIP Badge */}
              {isVip && (
                <span className="absolute -top-3.5 right-7 bg-white text-zinc-950 text-[10px] sm:text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                  {pkg.badge}
                </span>
              )}

              <div>
                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-2xl ${pkg.theme.icon}`}>
                    <PkgIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg sm:text-xl font-bold ${isVip ? 'text-white' : 'text-slate-900'}`}>
                      {pkg.name}
                    </h3>
                    <p className={`text-xs mt-0.5 ${isVip ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {pkg.description}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 mb-6 flex items-end gap-1">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${isVip ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.price}
                  </span>
                  <span className={`text-sm pb-1 ${isVip ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {pkg.period}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className={`flex items-start gap-3 text-sm ${isVip ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <CheckIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.theme.checkColor}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                id={`btn-select-${pkg.id.toLowerCase()}`}
                onClick={() => handleSelect(pkg.id)}
                disabled={isDisabled}
                className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer ${pkg.theme.btn}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Đăng ký ${pkg.name}`
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Skip link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8"
      >
        <button
          onClick={() => router.push('/owner/account')}
          className="text-sm text-slate-900 hover:text-slate-600 font-medium no-underline transition-colors cursor-pointer"
        >
          Bỏ qua, chọn sau
        </button>
      </motion.div>
    </div>
  );
}
