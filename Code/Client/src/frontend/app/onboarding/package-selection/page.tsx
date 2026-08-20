'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, ShieldCheck, Zap, Crown, Loader2, AlertCircle,
  ArrowLeft, ArrowRight, BadgeCheck, QrCode, Building2, Copy,
  Check, X, CreditCard, Sparkles, AlertTriangle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type BillingCycle = 'MONTHLY' | 'YEARLY';
type PackageId = string;

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
    id: 'FREE',
    name: 'Gói Miễn Phí',
    description: 'Dùng thử cơ bản cho cửa hàng mới',
    monthlyPrice: 0,
    yearlyPrice: 0,
    recommended: false,
    features: [
      'Quản lý đơn hàng & sản phẩm cơ bản',
      'Tối đa 1 tài khoản quản lý',
      'Hỗ trợ qua tài liệu hướng dẫn',
    ],
  },
  {
    id: 'STANDARD',
    name: 'Gói Standard',
    description: 'Quản lý kho, công nợ và sổ kế toán',
    monthlyPrice: 199000,
    yearlyPrice: 1990000,
    recommended: false,
    features: [
      'Quản lý tồn kho & công nợ',
      'Lập sổ kế toán TT 88/2021',
      'Tối đa 3 tài khoản nhân viên',
    ],
  },
  {
    id: 'VIP',
    name: 'Gói Cao Cấp (VIP)',
    description: 'Đầy đủ tính năng cao cấp & Trợ lý AI',
    monthlyPrice: 299000,
    yearlyPrice: 2990000,
    recommended: true,
    features: [
      'Tất cả tính năng gói Standard',
      'Trợ lý AI đọc đơn giọng nói & tin nhắn',
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
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Payment Modal State for > 0 VND packages
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedAccountNum, setCopiedAccountNum] = useState(false);
  const [copiedSyntax, setCopiedSyntax] = useState(false);

  // Load packages from API
  useEffect(() => {
    fetchPackages()
      .then((data) => {
        if (data && data.length > 0) {
          setPackages(data);
        }
      })
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
    if (!selected || !selectedPkg) return;

    if (totalAmount > 0) {
      // Gói > 0 đồng: Hiện modal chuyển khoản QR & thông báo cần thanh toán
      setError(null);
      setPaymentSuccess(false);
      setShowPaymentModal(true);
    } else {
      // Gói 0 đồng (miễn phí): Kích hoạt ngay & hiện thông báo thành công
      setSubmitting(true);
      setError(null);
      try {
        await selectPackageApi(selected, cycle);
        setSuccessToast('Đăng ký gói dịch vụ miễn phí thành công!');
        setTimeout(() => {
          router.push('/owner/account');
        }, 1500);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Xác nhận thanh toán (Tạm thời luôn thành công theo yêu cầu test)
  const handleConfirmPaymentTest = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await selectPackageApi(selected, cycle);
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        router.push('/owner/account');
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xác nhận thanh toán thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const transferSyntax = `HKD ${selectedPkg?.id || 'SUB'} ${cycle}`;
  const bankAccountNo = '0388999888';
  const bankAccountName = 'HE THONG HKD DIGITAL';
  const bankName = 'MBBank (Ngan hang Quan doi)';

  const copyToClipboard = (text: string, type: 'acc' | 'syntax') => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAccountNum(true);
      setTimeout(() => setCopiedAccountNum(false), 2000);
    } else {
      setCopiedSyntax(true);
      setTimeout(() => setCopiedSyntax(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 select-none">
          Chọn gói dịch vụ
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto font-medium select-none">
          Bắt đầu sử dụng nền tảng HKD Digital. Hủy hoặc nâng cấp bất kỳ lúc nào.
        </p>
      </motion.div>

      {/* ── Success Toast (Cho gói 0 đồng) ── */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Billing Cycle Selector ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-3 mb-8"
      >
        {/* Theo tháng */}
        <button
          type="button"
          onClick={() => setCycle('MONTHLY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all duration-200 cursor-pointer select-none
            ${cycle === 'MONTHLY'
              ? 'bg-slate-900 border-slate-900 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
            }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${cycle === 'MONTHLY' ? 'border-white' : 'border-slate-400'}`}>
            {cycle === 'MONTHLY' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          Theo tháng
        </button>

        {/* Theo năm */}
        <button
          type="button"
          onClick={() => setCycle('YEARLY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all duration-200 cursor-pointer select-none
            ${cycle === 'YEARLY'
              ? 'text-white shadow-md'
              : 'bg-white text-slate-600'
            }`}
          style={{
            backgroundColor: cycle === 'YEARLY' ? '#B3945B' : undefined,
            borderColor: cycle === 'YEARLY' ? '#B3945B' : '#e2e8f0',
          }}
        >
          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${cycle === 'YEARLY' ? 'border-white' : 'border-slate-400'}`}>
            {cycle === 'YEARLY' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          Theo năm
          {cycle === 'YEARLY' ? (
            <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/40">
              Tặng {savingMonths} tháng
            </span>
          ) : (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border" style={{ backgroundColor: '#fef3e2', color: '#B3945B', borderColor: '#e8d5b0' }}>
              Tiết kiệm hơn
            </span>
          )}
        </button>
      </motion.div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && !showPaymentModal && (
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

      {/* ── Package Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
        {packages.map((pkg, idx) => {
          const isVip = pkg.id === 'VIP';
          const isSelected = selected === pkg.id;
          const price = cycle === 'YEARLY' ? pkg.yearlyPrice : pkg.monthlyPrice;
          const CheckIcon = isVip ? ShieldCheck : CheckCircle;
          const PkgIcon = isVip ? Crown : Zap;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              onClick={() => setSelected(pkg.id)}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm transition-all duration-200 cursor-pointer border-2 select-none h-full min-h-[360px]
                ${isVip
                  ? isSelected
                    ? 'bg-zinc-950 border-white shadow-2xl scale-[1.02] text-white'
                    : 'bg-zinc-950 border-zinc-800 text-white hover:border-zinc-500 hover:-translate-y-1 hover:shadow-xl'
                  : isSelected
                    ? 'bg-white border-slate-900 shadow-2xl scale-[1.02] text-slate-900'
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 hover:-translate-y-1 hover:shadow-xl'
                }`}
            >
              {/* Recommended Badge */}
              {pkg.recommended && (
                <span className="absolute -top-3.5 right-6 bg-amber-400 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  ⭐ Đề xuất
                </span>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <span className={`absolute top-5 right-5 ${isVip ? 'text-white' : 'text-slate-900'}`}>
                  <BadgeCheck className="w-6 h-6" />
                </span>
              )}

              <div className="flex flex-col">
                {/* Header: Icon + Name */}
                <div className="flex items-start gap-3 mb-3 pr-6">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${isVip ? 'bg-zinc-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <PkgIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-base sm:text-lg font-bold leading-tight truncate ${isVip ? 'text-white' : 'text-slate-900'}`}>
                      {pkg.name}
                    </h3>
                    <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isVip ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {pkg.description || 'Gói dịch vụ dành cho hộ kinh doanh'}
                    </p>
                  </div>
                </div>

                {/* Price Display */}
                <div className="my-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  {price === 0 ? (
                    <span className={`text-2xl sm:text-3xl font-black tracking-tight ${isVip ? 'text-white' : 'text-slate-900'}`}>
                      Miễn phí
                    </span>
                  ) : (
                    <>
                      <span className={`text-2xl sm:text-3xl font-black tracking-tight shrink-0 ${isVip ? 'text-white' : 'text-slate-900'}`}>
                        {formatVnd(price)}
                      </span>
                      <span className={`text-xs sm:text-sm font-semibold opacity-75 shrink-0 ${isVip ? 'text-zinc-400' : 'text-slate-500'}`}>
                        /{cycle === 'YEARLY' ? 'năm' : 'tháng'}
                      </span>
                    </>
                  )}
                </div>

                {cycle === 'YEARLY' && price > 0 && (
                  <p className={`text-[11px] font-medium mb-3 ${isVip ? 'text-amber-300' : 'text-amber-700'}`}>
                    ≈ {formatVnd(Math.round(price / 12))}/tháng
                  </p>
                )}

                {/* Features List */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 mt-1">
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {pkg.features && pkg.features.length > 0 ? (
                      pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className={`flex items-start gap-2 leading-snug ${isVip ? 'text-zinc-300' : 'text-slate-700'}`}>
                          <CheckIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isVip ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className={`flex items-start gap-2 leading-snug ${isVip ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <CheckIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isVip ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span>Các tính năng theo cấu hình của gói</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Select Indicator Button */}
              <div className={`mt-6 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all border
                ${isSelected
                  ? isVip
                    ? 'bg-white text-zinc-950 border-white shadow-sm'
                    : 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : isVip
                    ? 'bg-transparent text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500'
                    : 'bg-transparent text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                {isSelected ? '✓ Đã chọn gói này' : 'Chọn gói này'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Subscription Summary Card ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs"
          >
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Tóm tắt đơn đăng ký
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Gói dịch vụ</span>
                <span className="font-bold text-slate-900">{selectedPkg?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Chu kỳ thanh toán</span>
                <span className="font-bold text-slate-900">{cycle === 'YEARLY' ? 'Theo năm (12 tháng)' : 'Theo tháng'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Đơn giá</span>
                <span className="font-bold text-slate-900">{unitPrice === 0 ? 'Miễn phí' : formatVnd(unitPrice)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between items-center text-base">
                <span className="font-bold text-slate-900">Tổng thanh toán</span>
                <span className="font-extrabold text-slate-900">{totalAmount === 0 ? '0đ (Miễn phí)' : formatVnd(totalAmount)}</span>
              </div>
              {cycle === 'YEARLY' && selectedPkg && totalAmount > 0 && (
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
        transition={{ delay: 0.2 }}
        className="flex items-start gap-3 mb-8 p-4 bg-white border border-slate-200 rounded-2xl"
      >
        <button
          type="button"
          id="chk-agreement"
          onClick={() => setAgreed(a => !a)}
          className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer
            ${agreed ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300 hover:border-slate-500'}`}
          aria-checked={agreed}
        >
          {agreed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </button>
        <label
          onClick={() => setAgreed(a => !a)}
          className="text-xs sm:text-sm text-slate-600 font-medium cursor-pointer select-none"
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
        transition={{ delay: 0.25 }}
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
        <p className="text-center text-xs text-slate-500 font-semibold mt-4 select-none">
          Vui lòng chọn một gói để tiếp tục.
        </p>
      )}
      {selected && !agreed && (
        <p className="text-center text-xs text-amber-700 font-semibold mt-4 select-none">
          Vui lòng đồng ý với điều khoản dịch vụ để tiếp tục.
        </p>
      )}

      {/* Skip link */}
      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => router.push('/owner/account')}
          className="text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer select-none"
        >
          Bỏ qua, chọn sau
        </button>
      </div>

      {/* ── PAYMENT MODAL (HIỆN KHI GÓI > 0 ĐỒNG) ── */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {/* Header Modal */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Thông Báo Thanh Toán Chuyển Khoản</h3>
                    <p className="text-xs text-slate-400">HKD Digital Subscription Service</p>
                  </div>
                </div>
                {!submitting && !paymentSuccess && (
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Body Modal */}
              <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">

                {/* State: Thành công */}
                {paymentSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900">Thanh toán thành công!</h4>
                      <p className="text-sm text-slate-600 mt-1 max-w-xs mx-auto font-medium">
                        Gói dịch vụ <strong className="text-slate-900">{selectedPkg?.name}</strong> đã được kích hoạt thành công cho tài khoản của bạn.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600 animate-pulse pt-2 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Đang chuyển hướng về trang tài khoản...</span>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Notice Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-amber-950 mb-0.5">Yêu cầu thanh toán chuyển khoản</p>
                        <p className="leading-relaxed">
                          Vui lòng thực hiện chuyển khoản theo thông tin hoặc quét mã QR dưới đây. Sau khi hoàn tất, bấm nút <strong className="text-slate-900 font-extrabold underline">Xác nhận thanh toán</strong> để kiểm tra và kích hoạt ngay.
                        </p>
                      </div>
                    </div>

                    {/* QR Code Presentation Box */}
                    <div className="bg-slate-900 text-white rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Quét mã QR để thanh toán nhanh
                      </p>

                      {/* Mock QR Image Container */}
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-md border-4 border-slate-800">
                        <div className="w-44 h-44 bg-slate-100 rounded-xl flex flex-col items-center justify-center relative overflow-hidden border border-slate-200">
                          <svg className="w-36 h-36 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm9-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h4v2h-4v-2zm-4 0h2v4h-2v-4zm2 4h2v4h-2v-4zm2-2h4v2h-4v-2zm-2 4h4v2h-4v-2zM7 7h2v2H7V7zm10 0h2v2h-2V7zm-10 10h2v2H7v-2z" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-white">
                              VIETQR / BANK
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="text-xs text-slate-400 font-medium">Số tiền cần chuyển: </span>
                        <span className="text-xl font-black text-amber-400">{formatVnd(totalAmount)}</span>
                      </div>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Ngân hàng:</span>
                        <span className="font-bold text-slate-900">{bankName}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{bankAccountNo}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(bankAccountNo, 'acc')}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            title="Sao chép"
                          >
                            {copiedAccountNum ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                        <span className="font-bold text-slate-900">{bankAccountName}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {transferSyntax}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(transferSyntax, 'syntax')}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            title="Sao chép cú pháp"
                          >
                            {copiedSyntax ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Error display inside modal */}
                    {error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Action Test Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmPaymentTest}
                        disabled={submitting}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang kiểm tra hệ thống...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Xác nhận thanh toán</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-slate-500 text-center font-medium mt-2">
                        Bấm nút này để kiểm tra và xác nhận kích hoạt gói ngay lập tức.
                      </p>
                    </div>
                  </>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
