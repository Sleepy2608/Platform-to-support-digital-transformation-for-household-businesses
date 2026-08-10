'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, ShieldCheck, Zap, Crown, Loader2, AlertCircle,
  ArrowLeft, ArrowRight, ToggleLeft, ToggleRight, BadgeCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type BillingCycle = 'MONTHLY' | 'YEARLY';
type PackageId = 'STANDARD' | 'VIP';

interface PackageInfo {
  id: PackageId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended: boolean;
  features: string[];
}

// ─── Fallback static data (used if API fails) ─────────────────────────────────
const FALLBACK_PACKAGES: PackageInfo[] = [
  {
    id: 'STANDARD',
    name: 'Gói Standard',
    description: 'Cho cửa hàng bán lẻ có quản lý kho & nợ',
    monthlyPrice: 199000,
    yearlyPrice: 1990000,
    recommended: false,
    features: [
      'Tất cả tính năng gói Basic',
      'Quản lý tồn kho & công nợ',
      'Lập sổ kế toán TT 88/2021',
      'Tối đa 3 tài khoản nhân viên',
    ],
  },
  {
    id: 'VIP',
    name: 'Gói VIP (Pro)',
    description: 'Đầy đủ sức mạnh AI & Kế toán tự động',
    monthlyPrice: 399000,
    yearlyPrice: 3990000,
    recommended: true,
    features: [
      'Tất cả tính năng gói Standard',
      'Trợ lý AI đọc đơn giọng nói / tin nhắn',
      'Tự động hóa báo cáo thuế trọn gói',
      'Không giới hạn nhân viên',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken');
}

async function fetchPackages(): Promise<PackageInfo[]> {
  const token = getToken();
  const res = await fetch('http://localhost:8080/api/owner/subscription/packages', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Cannot fetch packages');
  const json = await res.json();
  return json.data as PackageInfo[];
}

async function selectPackageApi(packageType: PackageId, billingCycle: BillingCycle): Promise<void> {
  const token = getToken();
  const res = await fetch(
    `http://localhost:8080/api/owner/subscription/select-package?packageType=${packageType}&billingCycle=${billingCycle}`,
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

  // State
  const [packages, setPackages] = useState<PackageInfo[]>(FALLBACK_PACKAGES);
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [selected, setSelected] = useState<PackageId | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load packages from API
  useEffect(() => {
    fetchPackages()
      .then(setPackages)
      .catch(() => { /* use fallback silently */ });
  }, []);

  // Derived
  const selectedPkg = packages.find((p) => p.id === selected) ?? null;
  const unitPrice = selectedPkg
    ? (cycle === 'YEARLY' ? selectedPkg.yearlyPrice : selectedPkg.monthlyPrice)
    : 0;
  const totalAmount = unitPrice;
  const savingMonths = 2; // YEARLY = 10 tháng giá, tặng 2 tháng

  const canSubmit = selected !== null && agreed && !submitting;

  const handleActivate = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await selectPackageApi(selected, cycle);
      router.push('/owner/account');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          Chọn gói dịch vụ
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
          Bắt đầu sử dụng nền tảng HKD Digital. Hủy hoặc nâng cấp bất kỳ lúc nào.
        </p>
      </motion.div>

      {/* ── Billing Cycle Toggle ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-4 mb-8"
      >
        <span className={`text-sm font-bold transition-colors ${cycle === 'MONTHLY' ? 'text-slate-900' : 'text-slate-400'}`}>
          Theo tháng
        </span>
        <button
          onClick={() => setCycle(c => c === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
          className="relative cursor-pointer"
          aria-label="Toggle billing cycle"
        >
          {cycle === 'YEARLY'
            ? <ToggleRight className="w-12 h-7 text-slate-900" />
            : <ToggleLeft className="w-12 h-7 text-slate-400" />
          }
        </button>
        <span className={`text-sm font-bold transition-colors flex items-center gap-2 ${cycle === 'YEARLY' ? 'text-slate-900' : 'text-slate-400'}`}>
          Theo năm
          {cycle === 'YEARLY' && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
              Tặng {savingMonths} tháng
            </span>
          )}
        </span>
      </motion.div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Package Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {packages.map((pkg, idx) => {
          const isVip = pkg.id === 'VIP';
          const isSelected = selected === pkg.id;
          const price = cycle === 'YEARLY' ? pkg.yearlyPrice : pkg.monthlyPrice;
          const CheckIcon = isVip ? ShieldCheck : CheckCircle;
          const PkgIcon = isVip ? Crown : Zap;

          return (
            <motion.button
              key={pkg.id}
              id={`pkg-card-${pkg.id.toLowerCase()}`}
              type="button"
              onClick={() => setSelected(pkg.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.35 }}
              className={`relative text-left rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-sm transition-all duration-200 cursor-pointer outline-none
                ${isVip
                  ? isSelected
                    ? 'bg-zinc-950 border-2 border-white shadow-2xl scale-[1.02]'
                    : 'bg-zinc-950 border-2 border-zinc-700 hover:border-zinc-400 hover:-translate-y-1 hover:shadow-xl'
                  : isSelected
                    ? 'bg-white border-2 border-slate-900 shadow-2xl scale-[1.02]'
                    : 'bg-white border-2 border-slate-200 hover:border-slate-500 hover:-translate-y-1 hover:shadow-xl'
                }`}
            >
              {/* Recommended Badge */}
              {pkg.recommended && (
                <span className="absolute -top-3.5 right-7 bg-white text-zinc-950 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  ⭐ Đề xuất
                </span>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <span className={`absolute top-5 right-5 ${isVip ? 'text-white' : 'text-slate-900'}`}>
                  <BadgeCheck className="w-6 h-6" />
                </span>
              )}

              <div>
                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-2xl ${isVip ? 'bg-zinc-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <PkgIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isVip ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                    <p className={`text-xs mt-0.5 ${isVip ? 'text-zinc-400' : 'text-slate-500'}`}>{pkg.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-2 flex items-end gap-1.5">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${isVip ? 'text-white' : 'text-slate-900'}`}>
                    {formatVnd(price)}
                  </span>
                  <span className={`text-sm pb-1 ${isVip ? 'text-zinc-400' : 'text-slate-500'}`}>
                    /{cycle === 'YEARLY' ? 'năm' : 'tháng'}
                  </span>
                </div>

                {cycle === 'YEARLY' && (
                  <p className={`text-xs mb-4 font-medium ${isVip ? 'text-zinc-400' : 'text-slate-500'}`}>
                    ≈ {formatVnd(Math.round(price / 12))}/tháng · Tiết kiệm {formatVnd(pkg.monthlyPrice * 2)}
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-2.5 mt-4">
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-3 text-sm ${isVip ? 'text-zinc-300' : 'text-slate-700'}`}
                    >
                      <CheckIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isVip ? 'text-zinc-400' : 'text-slate-600'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Select indicator */}
              <div className={`mt-7 py-2.5 rounded-xl text-sm font-bold text-center transition-all border
                ${isSelected
                  ? isVip
                    ? 'bg-white text-zinc-950 border-white'
                    : 'bg-slate-900 text-white border-slate-900'
                  : isVip
                    ? 'bg-transparent text-zinc-400 border-zinc-700'
                    : 'bg-transparent text-slate-500 border-slate-200'
                }`}
              >
                {isSelected ? '✓ Đã chọn' : 'Chọn gói này'}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Subscription Summary ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs"
          >
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
              Tóm tắt đăng ký
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Gói dịch vụ</span>
                <span className="font-bold text-slate-900">{selectedPkg?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Chu kỳ thanh toán</span>
                <span className="font-bold text-slate-900">{cycle === 'YEARLY' ? 'Theo năm (12 tháng)' : 'Theo tháng'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Đơn giá</span>
                <span className="font-bold text-slate-900">{formatVnd(unitPrice)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between text-base">
                <span className="font-bold text-slate-900">Tổng thanh toán</span>
                <span className="font-extrabold text-slate-900">{formatVnd(totalAmount)}</span>
              </div>
              {cycle === 'YEARLY' && selectedPkg && (
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  🎁 Bạn tiết kiệm được {formatVnd(selectedPkg.monthlyPrice * 2)} so với thanh toán hàng tháng!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Agreement Checkbox ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-3 mb-8 p-4 bg-white border border-slate-200 rounded-2xl"
      >
        <button
          type="button"
          id="chk-agreement"
          onClick={() => setAgreed(a => !a)}
          className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer
            ${agreed ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300 hover:border-slate-500'}`}
          aria-checked={agreed}
        >
          {agreed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </button>
        <label
          onClick={() => setAgreed(a => !a)}
          className="text-sm text-slate-600 font-medium cursor-pointer select-none"
        >
          Tôi đồng ý với{' '}
          <a href="#" className="text-slate-900 font-bold underline hover:text-slate-700">
            Điều khoản dịch vụ
          </a>{' '}
          &amp;{' '}
          <a href="#" className="text-slate-900 font-bold underline hover:text-slate-700">
            Chính sách bảo mật
          </a>{' '}
          của HKD Digital.
        </label>
      </motion.div>

      {/* ── Navigation Buttons ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col sm:flex-row gap-3 justify-between"
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push('/onboarding/business-profile')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Activate */}
        <button
          id="btn-activate"
          type="button"
          onClick={handleActivate}
          disabled={!canSubmit}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold rounded-xl active:scale-95 transition-all shadow-md cursor-pointer
            ${canSubmit
              ? 'bg-slate-900 text-white hover:bg-slate-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
            : <><ShieldCheck className="w-4 h-4" /> Kích hoạt gói dịch vụ <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </motion.div>

      {/* Helper text when nothing selected */}
      {!selected && (
        <p className="text-center text-xs text-slate-400 font-medium mt-4">
          Vui lòng chọn một gói ở trên để tiếp tục.
        </p>
      )}
      {selected && !agreed && (
        <p className="text-center text-xs text-amber-600 font-medium mt-4">
          Vui lòng đồng ý với điều khoản dịch vụ để tiếp tục.
        </p>
      )}

      {/* Skip link */}
      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => router.push('/owner/account')}
          className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer"
        >
          Bỏ qua, chọn sau
        </button>
      </div>
    </div>
  );
}
