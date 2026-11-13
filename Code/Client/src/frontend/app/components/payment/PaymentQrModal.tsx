'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  KeyRound,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';
import { downloadQrImage } from '@/app/lib/qrDownload';
import { apiClient } from '@/app/lib/apiClient';

interface ValidateCouponResponse {
  valid: boolean;
  keyCode?: string;
  discountPercent?: number;
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
  remainingUses?: number;
}

interface CouponCheckout {
  reference: string;
  finalAmount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
}

interface CurrentSubscriptionData {
  id?: number;
  status?: string;
  endDate?: string;
  planCode?: string;
}

function extractSubscriptionData(res: unknown): CurrentSubscriptionData | null {
  if (!res || typeof res !== 'object') return null;
  const obj = res as Record<string, unknown>;
  if ('status' in obj || 'endDate' in obj) {
    return obj as CurrentSubscriptionData;
  }
  if (obj.data && typeof obj.data === 'object') {
    return obj.data as CurrentSubscriptionData;
  }
  return null;
}

interface PaymentQrModalProps {
  isOpen: boolean;
  amount: number;
  transferSyntax: string;
  title: string;
  successTitle: string;
  successMessage: string;
  loading: boolean;
  error?: string | null;
  packageType?: string;
  billingCycle?: string;
  renewalMonths?: number;
  onClose: () => void;
  onConfirm: (coupon?: string) => void;
}

export default function PaymentQrModal({
  isOpen,
  amount,
  transferSyntax: defaultTransferSyntax,
  title,
  successTitle,
  successMessage,
  loading,
  error,
  packageType,
  billingCycle,
  renewalMonths,
  onClose,
  onConfirm,
}: PaymentQrModalProps) {
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [copiedTransferSyntax, setCopiedTransferSyntax] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrMode, setQrMode] = useState<'static' | 'vietqr'>('static');

  // Coupon state
  const [inputKey, setInputKey] = useState('');
  const [validatingKey, setValidatingKey] = useState(false);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [couponQuote, setCouponQuote] = useState<ValidateCouponResponse | null>(null);
  const [checkout, setCheckout] = useState<CouponCheckout | null>(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [paymentFailedMsg, setPaymentFailedMsg] = useState<string | null>(null);

  const effectiveAmount = checkout?.finalAmount ?? couponQuote?.finalAmount ?? amount;
  const transferSyntax = checkout?.reference ?? defaultTransferSyntax;

  // Tự động lắng nghe giao dịch SePay qua polling
  const [autoDetected, setAutoDetected] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pollTimeoutReached, setPollTimeoutReached] = useState(false);
  const initialEndDateRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const triggerSuccessRedirect = () => {
    setAutoDetected(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingCompleted', 'true');
    }
    setTimeout(() => {
      if (window.location.pathname === '/owner/account') {
        window.location.hash = 'subscription';
        window.location.reload();
      } else {
        window.location.href = '/owner/account#subscription';
      }
    }, 1200);
  };

  useEffect(() => {
    if (!isOpen || effectiveAmount <= 0) return;

    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    startTimeRef.current = Date.now();
    initialEndDateRef.current = null;
    setPollTimeoutReached(false);

    // Lấy hạn gói ban đầu để so sánh khi SePay cộng hạn mới (skipCache: true để luôn lấy dữ liệu tươi)
    if (!checkout) apiClient.get<CurrentSubscriptionData>('/api/owner/subscriptions/current', { skipCache: true })
      .then((res) => {
        const sub = extractSubscriptionData(res);
        if (!cancelled) {
          initialEndDateRef.current = sub?.endDate ?? '';
        }
      })
      .catch(() => {});

    const pollStatus = async () => {
      // Dừng polling tự động sau 10 phút để tránh tốn tài nguyên
      if (Date.now() - startTimeRef.current > 10 * 60 * 1000) {
        setPollTimeoutReached(true);
        return;
      }

      try {
        if (checkout) {
          const status = await apiClient.get<CouponCheckout>(
            `/api/owner/coupons/checkouts/${checkout.reference}`, { skipCache: true }
          );
          if (cancelled) return;
          if (status.status === 'PAID') {
            triggerSuccessRedirect();
            return;
          }
          if (status.status === 'EXPIRED') {
            setPaymentFailedMsg('Phiên thanh toán đã hết hạn. Hãy áp dụng lại mã giảm giá để lấy mã chuyển khoản mới.');
            return;
          }
        } else {
          const res = await apiClient.get<CurrentSubscriptionData>('/api/owner/subscriptions/current', { skipCache: true });
          if (cancelled) return;
          const currentSub = extractSubscriptionData(res);
          if (currentSub?.status === 'ACTIVE' && initialEndDateRef.current !== null && (currentSub.endDate ?? '') !== initialEndDateRef.current) {
            triggerSuccessRedirect();
            return;
          }
        }
      } catch {
        // Bỏ qua lỗi kết nối tạm thời
      }
      if (!cancelled) {
        timer = setTimeout(pollStatus, 3000);
      }
    };

    timer = setTimeout(pollStatus, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, effectiveAmount, checkout]);

  const staticQrUrl = '/images/qr-code.jpg';
  const dynamicVietQrUrl = effectiveAmount > 0 && transferSyntax
    ? `https://img.vietqr.io/image/ICB-107882760609-compact2.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=NGUYEN%20LE%20HUY%20TAM`
    : '/images/qr-code.jpg';

  const currentQrUrl = qrMode === 'static' ? staticQrUrl : dynamicVietQrUrl;

  const copyValue = (value: string, type: 'account' | 'syntax' | 'amount') => {
    navigator.clipboard.writeText(value);
    if (type === 'account') {
      setCopiedAccountNumber(true);
      setTimeout(() => setCopiedAccountNumber(false), 2000);
    } else if (type === 'syntax') {
      setCopiedTransferSyntax(true);
      setTimeout(() => setCopiedTransferSyntax(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleDownloadQr = async () => {
    setDownloading(true);
    await downloadQrImage(currentQrUrl, `qr-thanh-toan-${transferSyntax || 'goi-cuoc'}.png`);
    setTimeout(() => setDownloading(false), 1200);
  };

  // Áp dụng Coupon
  const handleApplyCoupon = async () => {
    const rawKey = inputKey.replace(/[^a-zA-Z0-9]/g, '').trim();
    if (!rawKey) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }
    if (rawKey.length !== 20) {
      setCouponError('Mã giảm giá phải gồm đúng 20 ký tự chữ và số');
      return;
    }

    setValidatingKey(true);
    setCouponError(null);

    try {
      const request = { keyCode: rawKey, packageType, billingCycle: billingCycle ?? 'MONTHLY', renewalMonths };
      const res = await apiClient.post<ValidateCouponResponse>('/api/owner/coupons/validate', request);

      if (res?.valid && res.finalAmount !== undefined) {
        if (res.finalAmount > 0) {
          const pending = await apiClient.post<CouponCheckout>('/api/owner/coupons/checkouts', request);
          setCheckout(pending);
          setQrMode('vietqr');
        }
        setCouponQuote(res);
        setAppliedKey(rawKey);
        setCouponSuccessMsg(res.message || 'Áp dụng mã giảm giá thành công!');
        setPaymentFailedMsg(null);
      } else {
        setCouponError(res?.message || 'Mã giảm giá không hợp lệ.');
      }
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : 'Không thể xác thực mã giảm giá. Vui lòng thử lại.');
    } finally {
      setValidatingKey(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedKey(null);
    setCheckout(null);
    setCouponQuote(null);
    setQrMode('static');
    setCouponSuccessMsg(null);
    setCouponError(null);
    setPaymentFailedMsg(null);
    setInputKey('');
  };

  const handleConfirmSubmit = async () => {
    if (effectiveAmount > 0) {
      setCheckingPayment(true);
      setPaymentFailedMsg(null);
      try {
        if (checkout) {
          const status = await apiClient.get<CouponCheckout>(
            `/api/owner/coupons/checkouts/${checkout.reference}`, { skipCache: true }
          );
          if (status.status === 'PAID') {
            triggerSuccessRedirect();
          } else {
            setPaymentFailedMsg(status.status === 'EXPIRED'
              ? 'Phiên thanh toán đã hết hạn. Hãy áp dụng lại mã giảm giá để lấy mã chuyển khoản mới.'
              : 'Chưa nhận được khoản chuyển đúng số tiền. Vui lòng kiểm tra lại sau.');
          }
          return;
        }
        const res = await apiClient.get<CurrentSubscriptionData>('/api/owner/subscriptions/current', { skipCache: true });
        const currentSub = extractSubscriptionData(res);
        if (currentSub && currentSub.status === 'ACTIVE') {
          if (initialEndDateRef.current !== null && (currentSub.endDate ?? '') !== initialEndDateRef.current) {
            triggerSuccessRedirect();
            return;
          }
        }
        setPaymentFailedMsg(
          `Hệ thống chưa nhận được thông báo biến động số dư từ SePay cho khoản tiền ${effectiveAmount.toLocaleString('vi-VN')}đ. Ngân hàng có thể mất từ 5 đến 30 giây để xử lý chuyển khoản. Vui lòng bấm thử lại sau giây lát hoặc sử dụng mã giảm giá.`
        );
      } catch {
        setPaymentFailedMsg('Không thể kết nối đến máy chủ để kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.');
      } finally {
        setCheckingPayment(false);
      }
      return;
    }
    setPaymentFailedMsg(null);
    onConfirm(appliedKey || undefined);
  };

  const handleModalClose = () => {
    handleRemoveCoupon();
    setPaymentFailedMsg(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{title}</h3>
                  <p className="text-xs text-slate-400">HBDT Digital Subscription Service</p>
                </div>
              </div>
              {!loading && !validatingKey && !successTitle && (
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Đóng modal thanh toán"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
              {successTitle ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900">{successTitle}</h4>
                    <p className="text-sm text-slate-600 mt-1">{successMessage}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Coupon Promo Input Box */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Áp dụng mã ưu đãi</span>
                      </div>
                      {appliedKey && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                        >
                          Hủy áp dụng
                        </button>
                      )}
                    </div>

                    {!appliedKey ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={24}
                            value={inputKey}
                            onChange={(e) => {
                              setInputKey(e.target.value);
                              if (couponError) setCouponError(null);
                            }}
                            placeholder="Nhập mã..."
                            className="flex-1 font-mono tracking-wider text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={validatingKey || !inputKey.trim()}
                            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            {validatingKey ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span>{validatingKey ? 'Đang kiểm tra...' : 'Áp dụng'}</span>
                          </button>
                        </div>
                        {couponError && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{couponError}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-emerald-900 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-950">
                            {couponSuccessMsg || 'Đã áp dụng mã giảm giá thành công!'}
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Mã <span className="font-mono font-bold tracking-wider">{appliedKey}</span>
                            {' · '}Giảm {couponQuote?.discountPercent}% · Cần trả {effectiveAmount.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>
                    )}
                  </div>


                  {effectiveAmount === 0 ? (
                    <div className="bg-slate-900 text-white rounded-2xl p-6 text-center shadow-lg space-y-3">
                      <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-white">Thanh toán miễn phí bằng mã giảm giá</h4>
                        <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                          Bạn không cần quét mã chuyển khoản. Vui lòng bấm nút bên dưới để hoàn tất kích hoạt gói dịch vụ ngay lập tức.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs px-2">
                        <span className="text-slate-400">Số tiền cần thanh toán:</span>
                        <div className="flex items-baseline gap-2">
                          <span className="line-through text-slate-500 font-mono">{amount.toLocaleString('vi-VN')}đ</span>
                          <span className="text-xl font-black text-emerald-400">0đ</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Alert transfer instructions */}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-amber-950 mb-1">Yêu cầu thanh toán chuyển khoản</p>
                          <p className="leading-relaxed">Vui lòng quét mã QR hoặc chuyển khoản theo thông tin dưới đây, sau đó bấm xác nhận thanh toán.</p>
                        </div>
                      </div>

                      {/* SePay Listener Badge */}
                      {effectiveAmount > 0 && !autoDetected && (
                        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-medium text-emerald-800">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Hệ thống sẽ xác nhận tự động thanh toán...</span>
                        </div>
                      )}
                      {autoDetected && (
                        <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 animate-bounce">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Xác nhận thanh toán thành công! Đang tự động làm mới...</span>
                        </div>
                      )}

                      {/* QR Box */}
                      <div className="bg-slate-900 text-white rounded-2xl p-5 text-center shadow-lg">
                        {/* Tab Switcher */}
                        <div className="flex items-center justify-center gap-1 p-1 bg-slate-800 rounded-xl max-w-sm mx-auto mb-3.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setQrMode('static')}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                              qrMode === 'static'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Mã QR gốc
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrMode('vietqr')}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                              qrMode === 'vietqr'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            VietQR tự điền tiền
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 mb-3">
                          {qrMode === 'static' ? (
                            <span>Mã QR chính chủ VietinBank <strong>(NGUYEN LE HUY TAM)</strong></span>
                          ) : (
                            <span>Mã VietQR động tự động nhúng số tiền và cú pháp chuyển khoản</span>
                          )}
                        </p>

                        <div className="bg-white p-2 rounded-2xl inline-block shadow-md border-4 border-slate-800">
                          <img
                            key={currentQrUrl}
                            src={currentQrUrl}
                            alt="Mã QR chuyển khoản"
                            className="w-64 h-64 object-contain rounded-xl"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== '/images/qr-code.jpg') {
                                target.src = '/images/qr-code.jpg';
                              }
                            }}
                          />
                        </div>

                        <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">Số tiền:</span>
                            <span className="text-xl font-black text-amber-400">{amount.toLocaleString('vi-VN')}đ</span>
                            <button
                              type="button"
                              onClick={() => copyValue(amount.toString(), 'amount')}
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Sao chép số tiền"
                            >
                              {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadQr}
                            disabled={downloading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Tải ảnh mã QR về máy"
                          >
                            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-amber-400" />}
                            <span>{downloading ? 'Đang tải...' : 'Tải mã QR'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Bank Info */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-slate-500 font-medium">Ngân hàng:</span>
                          <span className="font-bold text-slate-900">VietinBank</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-slate-500 font-medium">Số tài khoản:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">107882760609</span>
                            <button type="button" onClick={() => copyValue('107882760609', 'account')} className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200" title="Sao chép số tài khoản">
                              {copiedAccountNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                          <span className="font-bold text-slate-900">NGUYEN LE HUY TAM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Nội dung chuyển khoản:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{transferSyntax}</span>
                            <button type="button" onClick={() => copyValue(transferSyntax, 'syntax')} className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200" title="Sao chép nội dung chuyển khoản">
                              {copiedTransferSyntax ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {pollTimeoutReached && effectiveAmount > 0 && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Đã hết 10 phút chờ tự động:</span> Nếu bạn đã chuyển khoản thành công, ngân hàng có thể mất thêm thời gian đối soát. Bạn có thể bấm nút bên dưới để kiểm tra lại ngay hoặc liên hệ quản trị viên.
                      </div>
                    </div>
                  )}

                  {(paymentFailedMsg || error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-rose-900">Thanh toán chưa hoàn tất</h5>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          {paymentFailedMsg || error}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Confirm Action Button */}
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    disabled={loading || checkingPayment || validatingKey || autoDetected}
                    className={`w-full py-3.5 px-4 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-white ${
                      appliedKey
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 active:scale-[0.99]'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                    }`}
                  >
                    {loading || checkingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {loading
                      ? 'Đang xử lý kích hoạt...'
                      : checkingPayment
                        ? 'Đang kiểm tra biến động số dư...'
                        : effectiveAmount === 0
                          ? 'Xác nhận kích hoạt ngay (0đ)'
                          : 'Kiểm tra giao dịch / Xác nhận'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
