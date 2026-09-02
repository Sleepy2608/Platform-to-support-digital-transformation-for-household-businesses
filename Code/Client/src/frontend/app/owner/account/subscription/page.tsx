'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Calendar, RefreshCw, AlertTriangle, CheckCircle2,
  XCircle, Ban, Clock, ArrowLeft, Send, X, Crown, Sparkles, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../../lib/apiClient';

interface SubscriptionResponse {
  id: number;
  businessId: number;
  planId: number;
  planCode: string;
  planName: string;
  billingCycle: string;
  startDate: string;
  endDate: string | null;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// ─── Status Pop-up Modal ──────────────────────────────────────────────────────
function StatusPopupModal({
  isOpen,
  onClose,
  subscription,
  onAction,
}: {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionResponse;
  onAction: (action: 'cancel' | 'renew' | 'resubscribe') => void;
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return dateStr; }
  };

  const statusConfig = {
    PENDING_PAYMENT: {
      icon: Clock,
      title: 'Gói dịch vụ đang chờ thanh toán',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      description: 'Giao dịch đang được xử lý. Hệ thống sẽ tự động kích hoạt gói dịch vụ sau khi nhận được xác nhận thanh toán thành công.',
      actions: [] as { label: string; action: 'cancel' | 'renew' | 'resubscribe'; variant: 'primary' | 'danger' | 'secondary' }[],
    },
    ACTIVE: {
      icon: CheckCircle2,
      title: 'Gói dịch vụ đang hoạt động',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-900',
      description: `Gói "${subscription.planName}" đang hoạt động. Bạn có quyền sử dụng đầy đủ các tính năng của gói dịch vụ này.`,
      actions: [
        { label: 'Hủy gói dịch vụ', action: 'cancel' as const, variant: 'danger' as const },
      ],
    },
    EXPIRED: {
      icon: XCircle,
      title: 'Gói dịch vụ đã hết hạn',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      titleColor: 'text-rose-900',
      description: 'Gói dịch vụ của bạn đã hết hạn sử dụng. Các tính năng liên quan sẽ bị tạm khóa cho đến khi bạn gia hạn hoặc đăng ký gói mới.',
      actions: [
        { label: 'Đăng ký gói mới', action: 'resubscribe' as const, variant: 'primary' as const },
      ],
    },
    CANCELLED: {
      icon: Ban,
      title: 'Gói dịch vụ đã bị hủy',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-600',
      titleColor: 'text-slate-900',
      description: 'Gói dịch vụ đã bị hủy. Bạn sẽ không thể sử dụng các tính năng yêu cầu gói dịch vụ cho đến khi đăng ký lại.',
      actions: [
        { label: 'Đăng ký gói mới', action: 'resubscribe' as const, variant: 'primary' as const },
      ],
    },
  };

  const config = statusConfig[subscription.status];
  const IconComponent = config.icon;
  const [now] = useState<number>(() => Date.now());

  const checkNearExpiry = (endDateStr: string | null) => {
    if (!endDateStr) return { isNear: false, days: 0 };
    try {
      const diffDays = Math.ceil((new Date(endDateStr).getTime() - now) / (1000 * 60 * 60 * 24));
      return { isNear: diffDays > 0 && diffDays <= 7, days: diffDays };
    } catch { return { isNear: false, days: 0 }; }
  };

  const nearExpiry = subscription.status === 'ACTIVE' ? checkNearExpiry(subscription.endDate) : { isNear: false, days: 0 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-5`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 ${config.iconBg} ${config.iconColor} rounded-2xl shadow-xs`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-black ${config.titleColor}`}>{config.title}</h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {subscription.planName} · {subscription.billingCycle === 'MONTHLY' ? 'Hàng tháng' : 'Hàng năm'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/60 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {config.description}
              </p>

              {/* Near Expiry Warning */}
              {nearExpiry.isNear && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">⚠️ Sắp hết hạn!</h4>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      Chỉ còn <span className="font-black">{nearExpiry.days} ngày</span> sử dụng. Vui lòng gia hạn sớm để tránh gián đoạn dịch vụ.
                    </p>
                  </div>
                </div>
              )}

              {/* Cancellation Reason (for CANCELLED status) */}
              {subscription.status === 'CANCELLED' && subscription.cancellationReason && (
                <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Lý do hủy</span>
                  <p className="text-xs text-slate-700 font-semibold italic">&ldquo;{subscription.cancellationReason}&rdquo;</p>
                  {subscription.cancelledAt && (
                    <p className="text-[10px] text-slate-400 font-medium mt-2">Hủy vào: {formatDate(subscription.cancelledAt)}</p>
                  )}
                </div>
              )}

              {/* Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày bắt đầu</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">{formatDate(subscription.startDate)}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày kết thúc</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">{formatDate(subscription.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            {config.actions.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {config.actions.map((act) => (
                  <button
                    key={act.action}
                    onClick={() => onAction(act.action)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                      act.variant === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : act.variant === 'primary'
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {act.variant === 'danger' && <Ban className="w-3.5 h-3.5" />}
                    {act.variant === 'primary' && <Crown className="w-3.5 h-3.5" />}
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Cancel Confirmation Modal ────────────────────────────────────────────────
function CancelConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  cancelling,
  cancelError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  cancelling: boolean;
  cancelError: string | null;
}) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setLocalError('Lý do hủy không được để trống.');
      return;
    }
    setLocalError(null);
    onConfirm(reason);
  };

  const displayError = cancelError || localError;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !cancelling && onClose()}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-rose-50 border-b border-rose-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-rose-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Xác nhận hủy gói dịch vụ
              </h3>
              <button
                disabled={cancelling}
                onClick={onClose}
                className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-400 hover:text-rose-700 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm text-rose-800 font-bold">Lưu ý quan trọng</p>
                  <p className="text-xs text-rose-700 font-medium mt-1 leading-relaxed">
                    Hủy gói dịch vụ sẽ ngắt hiệu lực <strong>ngay lập tức</strong>. Bạn sẽ mất quyền truy cập vào các tính năng yêu cầu gói dịch vụ, bao gồm quản lý sản phẩm nâng cao, nhân viên, và báo cáo.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lý do hủy <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setLocalError(null); }}
                  disabled={cancelling}
                  placeholder="VD: Không còn nhu cầu sử dụng, chuyển sang gói khác..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-60 resize-none"
                />
              </div>

              {displayError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{displayError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                disabled={cancelling}
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                Không, giữ lại
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleSubmit}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {cancelling ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Đang hủy...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Xác nhận hủy
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────
function SuccessToast({ message, isVisible }: { message: string; isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3.5 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold"
        >
          <CheckCircle2 className="w-5 h-5" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function SubscriptionManagementPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Modal states
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSubscriptionNotice, setShowSubscriptionNotice] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SubscriptionResponse>('/api/owner/subscriptions/current');
      setSubscription(data);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Không thể tải thông tin gói dịch vụ.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient.get<SubscriptionResponse>('/api/owner/subscriptions/current')
      .then((data) => {
        if (!cancelled) setSubscription(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err, 'Không thể tải thông tin gói dịch vụ.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCancelSubscription = async (reason: string) => {
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await apiClient.post<SubscriptionResponse>(
        `/api/owner/subscriptions/${subscription?.id}/cancel`,
        { reason }
      );
      setSubscription(updated);
      setShowCancelModal(false);
      setShowStatusPopup(false);
      setSuccessMessage('Gói dịch vụ đã được hủy thành công.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      setCancelError(errorMessage(err, 'Lỗi khi hủy gói dịch vụ.'));
    } finally {
      setCancelling(false);
    }
  };

  const handlePopupAction = (action: 'cancel' | 'renew' | 'resubscribe') => {
    setShowStatusPopup(false);
    if (action === 'cancel') {
      setCancelError(null);
      setShowCancelModal(true);
    } else if (action === 'renew' || action === 'resubscribe') {
      router.push('/onboarding/package-selection?from=account');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
            <XCircle className="w-3.5 h-3.5" /> Hết hạn
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600">
            <Ban className="w-3.5 h-3.5" /> Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return dateStr; }
  };

  const [now] = useState<number>(() => Date.now());

  const checkNearExpiry = (endDateStr: string | null) => {
    if (!endDateStr) return false;
    try {
      const diffDays = Math.ceil((new Date(endDateStr).getTime() - now) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    } catch { return false; }
  };

  const isNearExpiry = subscription?.status === 'ACTIVE' && checkNearExpiry(subscription.endDate);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Success Toast */}
      <SuccessToast message={successMessage || ''} isVisible={!!successMessage} />

      <AnimatePresence>
        {showSubscriptionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] w-[min(92vw,420px)]"
          >
            <div className="rounded-2xl border border-emerald-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 bg-emerald-50 px-4 py-3 border-b border-emerald-100">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-900">Đăng ký thành công</h3>
                  <p className="text-[11px] text-emerald-700 font-medium">Gói dịch vụ đã được kích hoạt</p>
                </div>
                <button
                  onClick={() => setShowSubscriptionNotice(false)}
                  className="ml-auto p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Bạn đã chọn và kích hoạt gói dịch vụ thành công. Mọi thay đổi sẽ được cập nhật trên màn hình quản lý gói hiện tại.
              </div>

              <div className="px-4 pb-4 flex justify-end">
                <button
                  onClick={() => setShowSubscriptionNotice(false)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/owner/account')}
            className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer text-slate-600"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Quản lý Gói dịch vụ</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Theo dõi và quản lý gói đăng ký sử dụng nền tảng của bạn.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSubscription}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:shadow-xs transition-all disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin" />
          <span className="text-slate-500 text-sm font-medium animate-pulse">Đang tải thông tin gói...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4 shadow-2xs">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-rose-900">Lỗi kết nối hoặc Chưa đăng ký</h3>
            <p className="text-xs sm:text-sm text-rose-700 font-medium leading-relaxed">{error}</p>
            <button
              onClick={fetchSubscription}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : subscription ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6 relative overflow-hidden">
              {/* Premium Glow effect */}
              {subscription.status === 'ACTIVE' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-8 -mt-8 pointer-events-none" />
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xs">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{subscription.planName}</h2>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {subscription.billingCycle === 'MONTHLY' ? 'Thanh toán hàng tháng' : 'Thanh toán hàng năm'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatusPopup(true)}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  title="Xem chi tiết trạng thái"
                >
                  {getStatusBadge(subscription.status)}
                </button>
              </div>

              {/* Warnings and Status Details */}
              {isNearExpiry && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">Gói dịch vụ sắp hết hạn</h4>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      Chỉ còn dưới 7 ngày sử dụng. Vui lòng thanh toán gia hạn để tránh gián đoạn các dịch vụ.
                    </p>
                  </div>
                </div>
              )}

              {subscription.status === 'EXPIRED' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex gap-3">
                  <Ban className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-900">Gói dịch vụ đã hết hạn</h4>
                    <p className="text-xs text-rose-700 font-medium mt-0.5">
                      Vui lòng gia hạn gói dịch vụ để tiếp tục quản lý hộ kinh doanh của bạn.
                    </p>
                  </div>
                </div>
              )}

              {subscription.status === 'PENDING_PAYMENT' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">Chờ hoàn tất thanh toán</h4>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      Giao dịch của bạn đang được xử lý. Hệ thống sẽ kích hoạt tự động sau khi nhận được thông tin thanh toán.
                    </p>
                  </div>
                </div>
              )}

              {subscription.status === 'CANCELLED' && (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex gap-3">
                  <Ban className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">Gói dịch vụ đã hủy</h4>
                    {subscription.cancelledAt && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Hủy vào: {formatDate(subscription.cancelledAt)}
                      </p>
                    )}
                    {subscription.cancellationReason && (
                      <p className="text-xs text-slate-600 font-semibold bg-slate-200/50 p-2.5 rounded-lg mt-2 italic">
                        Lý do: &ldquo;{subscription.cancellationReason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Dates Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày bắt đầu</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-850 mt-0.5">
                      {formatDate(subscription.startDate)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày kết thúc</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-850 mt-0.5">
                      {formatDate(subscription.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between gap-6 h-fit">
            <div>
              <h3 className="text-base font-bold text-slate-900">Thao tác nhanh</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Các chức năng quản lý thay đổi cho gói dịch vụ hiện tại.
              </p>
            </div>

            <div className="space-y-3">
              {/* View Status Detail */}
              <button
                onClick={() => setShowStatusPopup(true)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
              >
                <Sparkles className="w-4 h-4" /> Xem chi tiết trạng thái
              </button>

              {subscription.status === 'ACTIVE' && (
                <button
                  onClick={() => {
                    setCancelError(null);
                    setShowCancelModal(true);
                  }}
                  className="w-full py-3 border border-rose-200 hover:bg-rose-50 text-rose-700 hover:text-rose-800 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" /> Hủy gói dịch vụ
                </button>
              )}

              {(subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED') && (
                <button
                  onClick={() => router.push('/onboarding/package-selection?from=account')}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" /> Chọn gói mới
                </button>
              )}

              {subscription.status === 'PENDING_PAYMENT' && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-center text-xs text-amber-700 font-medium">
                  Vui lòng chờ hệ thống xác nhận giao dịch thanh toán.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Không tìm thấy thông tin đăng ký</h3>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Bạn chưa đăng ký gói dịch vụ nào trên nền tảng.
          </p>
          <button
            onClick={() => router.push('/onboarding/package-selection?from=account')}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4" /> Đăng ký gói dịch vụ
          </button>
        </div>
      )}

      {/* Status Pop-up Modal */}
      {subscription && (
        <StatusPopupModal
          isOpen={showStatusPopup}
          onClose={() => setShowStatusPopup(false)}
          subscription={subscription}
          onAction={handlePopupAction}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelError(null); }}
        onConfirm={handleCancelSubscription}
        cancelling={cancelling}
        cancelError={cancelError}
      />
    </div>
  );
}
