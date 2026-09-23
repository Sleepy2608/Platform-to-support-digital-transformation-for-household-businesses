'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Zap, ShieldCheck, CheckCircle2, ArrowLeft,
  Sparkles, AlertCircle, Check, HelpCircle, Loader2,
  Building2, CreditCard, Clock, Calendar
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import PaymentQrModal from '../../../components/payment/PaymentQrModal';
import PolicyModal from '../../../components/legal/PolicyModal';
import { LEGAL_DOCS, type LegalDocKey } from '../../../lib/legal-content';

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

interface OwnerProfileResponse {
  packageType: string | null;
  subscriptionExpiresAt: string | null;
  businessName?: string;
  fullName?: string;
}

const FALLBACK_PACKAGES: PackageInfo[] = [
  {
    id: 'FREE',
    name: 'Gói Miễn Phí',
    description: 'Dùng thử cơ bản cho cửa hàng mới bắt đầu',
    monthlyPrice: 0,
    yearlyPrice: 0,
    recommended: false,
    features: [
      'Quản lý sản phẩm & danh mục cơ bản',
      'Tạo đơn hàng bán lẻ tại quầy (POS)',
      'Quản lý danh sách khách hàng',
      'Tối đa 1 tài khoản quản lý',
    ],
  },
  {
    id: 'STANDARD',
    name: 'Gói Cơ Bản (Standard)',
    description: 'Quản lý toàn diện kho hàng, công nợ và nhân viên',
    monthlyPrice: 199000,
    yearlyPrice: 1990000,
    recommended: false,
    features: [
      'Tất cả tính năng của Gói Miễn Phí',
      'Quản lý xuất - nhập - tồn kho & cảnh báo hết hàng',
      'Theo dõi và quản lý sổ nợ khách hàng',
      'Báo cáo doanh thu & biểu đồ phân tích',
      'Quản lý nhân viên & phân quyền tài khoản',
      'Báo cáo nghĩa vụ thuế HKD',
    ],
  },
  {
    id: 'VIP',
    name: 'Gói Cao Cấp (VIP)',
    description: 'Đầy đủ sức mạnh Trợ lý AI & Kế toán tự động Thông tư 88',
    monthlyPrice: 399000,
    yearlyPrice: 3990000,
    recommended: true,
    features: [
      'Tất cả tính năng của Gói Cơ Bản',
      'Trợ lý AI đọc hiểu tin nhắn & tạo đơn nháp tự động',
      'Kế toán tự động theo Thông tư 88/2021/TT-BTC (S1, S2, S4)',
      'Tax Engine 2026 tự động tính toán thuế GTGT & TNCN',
      'Xuất báo cáo tài chính & sổ kế toán định dạng Excel/PDF',
      'Không giới hạn số lượng khách hàng & nhân viên',
      'Ưu tiên hỗ trợ kỹ thuật 24/7',
    ],
  },
];

function formatVnd(amount: number): string {
  if (!amount || amount === 0) return '0đ';
  return amount.toLocaleString('vi-VN') + 'đ';
}

function ChangePlanInner() {
  const router = useRouter();

  const [packages, setPackages] = useState<PackageInfo[]>(FALLBACK_PACKAGES);
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [selectedPkgId, setSelectedPkgId] = useState<PackageId | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile data
  const [currentPackageType, setCurrentPackageType] = useState<string | null>(null);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Policy Modal
  const [activeDoc, setActiveDoc] = useState<LegalDocKey | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pkgData, profileData] = await Promise.allSettled([
          apiClient.get<PackageInfo[]>('/api/owner/subscription/packages'),
          apiClient.get<OwnerProfileResponse>('/api/owner/profile'),
        ]);

        if (pkgData.status === 'fulfilled' && pkgData.value && pkgData.value.length > 0) {
          setPackages(pkgData.value);
        }

        if (profileData.status === 'fulfilled' && profileData.value) {
          const profile = profileData.value;
          setCurrentPackageType(profile.packageType);
          setCurrentExpiresAt(profile.subscriptionExpiresAt);
          const active = Boolean(
            profile.subscriptionExpiresAt &&
            new Date(profile.subscriptionExpiresAt).getTime() > Date.now()
          );
          setIsSubscriptionActive(active);
          if (profile.packageType) {
            setSelectedPkgId(profile.packageType);
          }
        }
      } catch {
        // Fallback silently
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) ?? null;
  const unitPrice = selectedPkg
    ? (cycle === 'YEARLY' ? selectedPkg.yearlyPrice : selectedPkg.monthlyPrice)
    : 0;

  const currentPkgName = currentPackageType === 'VIP'
    ? 'Gói VIP (Cao Cấp)'
    : currentPackageType === 'STANDARD'
      ? 'Gói Cơ Bản (Standard)'
      : currentPackageType === 'FREE'
        ? 'Gói Miễn Phí'
        : currentPackageType
          ? `Gói ${currentPackageType}`
          : 'Chưa đăng ký gói';

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return 'Vô thời hạn';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleSelectPackage = (pkg: PackageInfo) => {
    setSelectedPkgId(pkg.id);
    setError(null);

    const price = cycle === 'YEARLY' ? pkg.yearlyPrice : pkg.monthlyPrice;

    // Nếu chọn đúng gói hiện tại đang dùng
    if (pkg.id === currentPackageType && isSubscriptionActive) {
      return;
    }

    if (price > 0) {
      setPaymentSuccess(false);
      setShowPaymentModal(true);
    } else {
      // Gói 0 đồng (FREE)
      handleConfirmFreePackage(pkg.id);
    }
  };

  const handleConfirmFreePackage = async (pkgId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/api/owner/subscription/select-package?packageType=${pkgId}&billingCycle=${cycle}`);
      setSuccessMsg('Đã chuyển sang Gói Miễn Phí thành công!');
      setTimeout(() => {
        router.push('/owner/account#subscription');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chuyển gói thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPkgId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(
        `/api/owner/subscription/select-package?packageType=${selectedPkgId}&billingCycle=${cycle}`
      );
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        router.push('/owner/account#subscription');
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xác nhận thanh toán thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const transferSyntax = `HBDT-${selectedPkgId || 'SUB'}-${cycle === 'YEARLY' ? '12M' : '1M'}`;

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/owner/account#subscription')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Cài đặt tài khoản
          </button>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Trang chủ / Cài đặt tài khoản / <span className="text-slate-900 font-bold">Chọn gói dịch vụ</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          HBDT Digital Subscription Management
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Thay đổi gói dịch vụ
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Nâng cấp hoặc chuyển đổi gói thuê bao để mở rộng tính năng kế toán tự động, Trợ lý AI và quản lý toàn diện hộ kinh doanh của bạn.
        </p>
      </div>

      {/* Current Plan Status Card */}
      {currentPackageType && (
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Gói hiện tại:</span>
                <span className="text-sm font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full">
                  {currentPkgName}
                </span>
                {isSubscriptionActive && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đang hoạt động
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Hạn sử dụng: <strong className="text-slate-200">{formatExpiryDate(currentExpiresAt)}</strong>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 sm:text-right border-t sm:border-t-0 border-slate-700/60 pt-3 sm:pt-0">
            Bạn có thể chọn gói dịch vụ bên dưới để chuyển đổi bất cứ lúc nào.
          </div>
        </div>
      )}

      {/* Alert Notifications */}
      {error && (
        <div className="max-w-4xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="max-w-4xl mx-auto p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Billing Cycle Switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 inline-flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setCycle('MONTHLY')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              cycle === 'MONTHLY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thanh toán theo tháng
          </button>
          <button
            type="button"
            onClick={() => setCycle('YEARLY')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              cycle === 'YEARLY'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Thanh toán theo năm</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
              Tiết kiệm 2 tháng
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch">
        {packages.map((pkg) => {
          const isVip = pkg.id === 'VIP';
          const isStandard = pkg.id === 'STANDARD';
          const isFree = pkg.id === 'FREE';
          const isCurrent = pkg.id === currentPackageType && isSubscriptionActive;
          const price = cycle === 'YEARLY' ? pkg.yearlyPrice : pkg.monthlyPrice;

          return (
            <div
              key={pkg.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
                isCurrent
                  ? 'bg-[#121417] text-white border-2 border-[#22c55e] shadow-2xl ring-2 ring-[#22c55e]/30'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              {/* Top Badges */}
              <div className="flex items-center justify-between gap-2 mb-4">
                {isCurrent ? (
                  <span className="absolute -top-3.5 left-6 bg-[#86efac] text-zinc-950 text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse inline-block" />
                    ĐANG SỬ DỤNG
                  </span>
                ) : isVip ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" /> Khuyên dùng
                  </span>
                ) : isStandard ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    Cơ bản
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    Cơ bản
                  </span>
                )}
              </div>

              {/* Top Right Checkmark for Active Plan */}
              {isCurrent && (
                <span className="absolute top-6 right-6 text-[#86efac]">
                  <CheckCircle2 className="w-7 h-7" />
                </span>
              )}

              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${isCurrent ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    {isVip && <Crown className="w-5 h-5 text-amber-400" />}
                    {isStandard && <ShieldCheck className="w-5 h-5 text-blue-600" />}
                    {isFree && <Zap className="w-5 h-5 text-slate-600" />}
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.name}
                  </h3>
                </div>
                <p className={`text-xs sm:text-sm min-h-[38px] leading-relaxed ${isCurrent ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {pkg.description}
                </p>

                {/* Price Display */}
                <div className={`pt-4 pb-2 border-t border-b my-4 ${isCurrent ? 'border-zinc-800' : 'border-slate-100'}`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                      {formatVnd(price)}
                    </span>
                    <span className={`text-xs font-medium ${isCurrent ? 'text-zinc-400' : 'text-slate-500'}`}>
                      /{cycle === 'YEARLY' ? 'năm' : 'tháng'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isCurrent ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {isFree
                      ? 'Miễn phí sử dụng vĩnh viễn'
                      : cycle === 'YEARLY'
                        ? 'Thanh toán 1 lần sử dụng trọn gói 12 tháng'
                        : `${formatVnd(pkg.yearlyPrice)} khi đăng ký gói theo năm`}
                  </p>
                </div>

                {/* Expiry Pill Box for Active Plan */}
                {isCurrent && currentExpiresAt && (
                  <div className="my-3 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-[#1e2329] border border-zinc-800 text-zinc-300 flex items-center gap-2">
                    <span>🗓️</span>
                    <span>Hết hạn: <strong className="text-white font-bold">{formatExpiryDate(currentExpiresAt)}</strong></span>
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="my-6 space-y-3 flex-1">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${isCurrent ? 'text-zinc-400' : 'text-slate-400'}`}>
                  TÍNH NĂNG BAO GỒM:
                </p>
                <ul className="space-y-2.5">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isCurrent
                            ? 'text-[#86efac]'
                            : 'text-blue-600'
                        }`}
                      />
                      <span className={`leading-snug ${isCurrent ? 'text-zinc-200' : 'text-slate-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-auto">
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black bg-[#86efac] text-zinc-950 shadow-md flex items-center justify-center gap-2 cursor-default"
                  >
                    ✓ Gói đang sử dụng
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSelectPackage(pkg)}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {submitting && selectedPkgId === pkg.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        {isFree ? 'Chọn gói Miễn Phí' : `Chọn ${pkg.name}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Support Info */}
      <div className="max-w-4xl mx-auto text-center space-y-2 pt-6 border-t border-slate-200 text-xs text-slate-500">
        <p>
          Cần hỗ trợ tư vấn chọn gói hoặc xuất hóa đơn VAT? Vui lòng liên hệ bộ phận CSKH HBDT Digital qua mục{' '}
          <button
            type="button"
            onClick={() => router.push('/owner/feedback')}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Viết hỗ trợ
          </button>.
        </p>
        <p className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className="hover:underline text-slate-600 cursor-pointer"
          >
            Điều khoản dịch vụ
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className="hover:underline text-slate-600 cursor-pointer"
          >
            Chính sách bảo mật
          </button>
        </p>
      </div>

      {/* Payment QR Modal */}
      {selectedPkg && (
        <PaymentQrModal
          isOpen={showPaymentModal}
          amount={unitPrice}
          transferSyntax={transferSyntax}
          title={`Thanh toán ${selectedPkg.name}`}
          successTitle={paymentSuccess ? 'Xác nhận đổi gói thành công!' : ''}
          successMessage="Gói dịch vụ đã được cập nhật. Hệ thống đang chuyển hướng về trang tài khoản..."
          loading={submitting}
          error={error}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* Policy Modal */}
      {activeDoc && (
        <PolicyModal
          docKey={activeDoc}
          doc={LEGAL_DOCS[activeDoc]}
          onClose={() => setActiveDoc(null)}
          onAccept={() => setActiveDoc(null)}
        />
      )}
      </div>
    </div>
  );
}

export default function ChangePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100/70">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </div>
      }
    >
      <ChangePlanInner />
    </Suspense>
  );
}
