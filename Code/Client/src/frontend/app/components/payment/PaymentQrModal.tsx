'use client';

import { useState } from 'react';
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

interface ValidateBypassKeyResponse {
  valid: boolean;
  keyCode?: string;
  discountPercent?: number;
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
  remainingUses?: number;
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
  onClose: () => void;
  onConfirm: (bypassKey?: string) => void;
}

export default function PaymentQrModal({
  isOpen,
  amount,
  transferSyntax,
  title,
  successTitle,
  successMessage,
  loading,
  error,
  packageType,
  billingCycle,
  onClose,
  onConfirm,
}: PaymentQrModalProps) {
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [copiedTransferSyntax, setCopiedTransferSyntax] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Bypass Key state
  const [inputKey, setInputKey] = useState('');
  const [validatingKey, setValidatingKey] = useState(false);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [bypassSuccessMsg, setBypassSuccessMsg] = useState<string | null>(null);
  const [bypassError, setBypassError] = useState<string | null>(null);
  const [paymentFailedMsg, setPaymentFailedMsg] = useState<string | null>(null);

  // Số tiền thực tế sau khi áp dụng mã giảm giá 100%
  const effectiveAmount = appliedKey ? 0 : amount;

  const qrImageUrl = effectiveAmount > 0 && transferSyntax
    ? `https://img.vietqr.io/image/ICB-108871728162-compact2.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=NGUYEN%20LE%20HUY%20TAM`
    : '/images/qr-code.jpg';

  const copyValue = (value: string, type: 'account' | 'syntax') => {
    navigator.clipboard.writeText(value);
    if (type === 'account') {
      setCopiedAccountNumber(true);
      setTimeout(() => setCopiedAccountNumber(false), 2000);
    } else {
      setCopiedTransferSyntax(true);
      setTimeout(() => setCopiedTransferSyntax(false), 2000);
    }
  };

  const handleDownloadQr = async () => {
    setDownloading(true);
    await downloadQrImage(qrImageUrl, `qr-thanh-toan-${transferSyntax || 'goi-cuoc'}.png`);
    setTimeout(() => setDownloading(false), 1200);
  };

  // Áp dụng Bypass Key
  const handleApplyBypassKey = async () => {
    const rawKey = inputKey.replace(/[^a-zA-Z0-9]/g, '').trim();
    if (!rawKey) {
      setBypassError('Vui lòng nhập mã Bypass Key');
      return;
    }
    if (rawKey.length !== 20) {
      setBypassError('Mã Bypass Key phải gồm đúng 20 ký tự chữ và số');
      return;
    }

    setValidatingKey(true);
    setBypassError(null);

    try {
      const res = await apiClient.post<ValidateBypassKeyResponse>('/api/owner/bypass-keys/validate', {
        keyCode: rawKey,
        packageType: packageType || '',
        billingCycle: billingCycle || '',
      });

      if (res && res.valid) {
        setAppliedKey(rawKey);
        setBypassSuccessMsg(res.message || 'Áp dụng mã Bypass Key thành công!');
        setPaymentFailedMsg(null);
      } else {
        setBypassError(res?.message || 'Mã Bypass Key không hợp lệ.');
      }
    } catch (err: unknown) {
      setBypassError(err instanceof Error ? err.message : 'Không thể xác thực mã Bypass Key. Vui lòng thử lại.');
    } finally {
      setValidatingKey(false);
    }
  };

  const handleRemoveBypassKey = () => {
    setAppliedKey(null);
    setBypassSuccessMsg(null);
    setBypassError(null);
    setPaymentFailedMsg(null);
    setInputKey('');
  };

  const handleConfirmSubmit = () => {
    if (effectiveAmount > 0) {
      setPaymentFailedMsg(
        `Thanh toán không thành công! Hệ thống chưa nhận được khoản thanh toán ${effectiveAmount.toLocaleString('vi-VN')}đ. Vui lòng chuyển khoản đúng nội dung hoặc áp dụng mã Bypass Key để được miễn phí 100%.`
      );
      return;
    }
    setPaymentFailedMsg(null);
    onConfirm(appliedKey || undefined);
  };

  const handleModalClose = () => {
    handleRemoveBypassKey();
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
              {!loading && !successTitle && (
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
                  {/* Bypass Key Promo Input Box */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Áp dụng mã ưu đãi</span>
                      </div>
                      {appliedKey && (
                        <button
                          type="button"
                          onClick={handleRemoveBypassKey}
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
                              if (bypassError) setBypassError(null);
                            }}
                            placeholder="Nhập mã..."
                            className="flex-1 font-mono tracking-wider text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal"
                          />
                          <button
                            type="button"
                            onClick={handleApplyBypassKey}
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
                        {bypassError && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{bypassError}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-emerald-900 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-950">
                            {bypassSuccessMsg || 'Đã áp dụng mã Bypass Key thành công!'}
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Mã: <span className="font-mono font-bold tracking-wider">{appliedKey}</span> — Giảm giá 100% (Số tiền phải trả: 0đ).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Khi áp dụng Bypass Key thành công: Ẩn QR ngân hàng & hiển thị thông báo miễn phí */}
                  {appliedKey ? (
                    <div className="bg-slate-900 text-white rounded-2xl p-6 text-center shadow-lg space-y-3">
                      <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-white">Thanh toán miễn phí qua Bypass Key</h4>
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

                      {/* QR Box */}
                      <div className="bg-slate-900 text-white rounded-2xl p-5 text-center shadow-lg">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quét mã QR để thanh toán</p>
                        <div className="bg-white p-2 rounded-2xl inline-block shadow-md border-4 border-slate-800">
                          <img
                            src={qrImageUrl}
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
                        <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <div>
                            <span className="text-xs text-slate-400 font-medium">Số tiền cần chuyển: </span>
                            <span className="text-xl font-black text-amber-400">{amount.toLocaleString('vi-VN')}đ</span>
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
                            <span className="font-mono font-bold text-slate-900 text-sm">108871728162</span>
                            <button type="button" onClick={() => copyValue('108871728162', 'account')} className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200" title="Sao chép số tài khoản">
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

                  {(paymentFailedMsg || error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-rose-900">Thanh toán không thành công</h5>
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
                    disabled={loading}
                    className={`w-full py-3.5 px-4 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-white ${
                      appliedKey
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 active:scale-[0.99]'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {loading
                      ? 'Đang xử lý kích hoạt...'
                      : appliedKey
                        ? 'Xác nhận kích hoạt ngay (0đ)'
                        : 'Xác nhận thanh toán'}
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
