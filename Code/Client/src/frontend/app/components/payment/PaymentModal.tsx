'use client';

import { FormEvent, useState, useEffect } from 'react';
import {
  X, DollarSign, CreditCard, Calendar, FileText, CheckCircle2, AlertCircle, RefreshCw, ArrowRight,
  Download, Copy, Check, QrCode, Loader2
} from 'lucide-react';
import {
  createPayment,
  getOrderPaymentSummary,
  OrderPaymentSummaryResponse,
  PaymentMethod,
  CreatePaymentRequest
} from '@/app/lib/payment';
import { validatePaymentAmount } from '@/app/lib/debtBookkeepingViewModel';
import { downloadQrImage } from '@/app/lib/qrDownload';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess?: () => void;
}

export default function PaymentModal({ isOpen, onClose, orderId, onSuccess }: PaymentModalProps) {
  const [summary, setSummary] = useState<OrderPaymentSummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedSyntax, setCopiedSyntax] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  const loadSummary = async () => {
    setLoadingSummary(true);
    setError('');
    try {
      const data = await getOrderPaymentSummary(orderId);
      setSummary(data);
      if (data.remainingAmount > 0) {
        setAmount(data.remainingAmount.toString());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin đơn hàng';
      setError(msg);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      loadSummary();
      setSuccessMsg('');
      setError('');
      setReferenceNumber('');
      setNote('');
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;
  const remaining = summary?.remainingAmount ?? 0;
  const isOverpaid = numericAmount > remaining;
  const isInvalidAmount = numericAmount <= 0 || isOverpaid;

  const handleFillMaxAmount = () => {
    if (summary) {
      setAmount(summary.remainingAmount.toString());
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validatePaymentAmount(numericAmount, remaining);
    if (!validation.valid) {
      setError(validation.error || 'Số tiền thanh toán không hợp lệ');
      return;
    }

    if (paymentMethod === 'BANK_TRANSFER' && !referenceNumber.trim()) {
      setError('Vui lòng nhập mã tham chiếu cho giao dịch chuyển khoản');
      return;
    }

    setSubmitting(true);
    try {
      const requestData: CreatePaymentRequest = {
        salesOrderId: orderId,
        customerId: summary?.customerId ?? undefined,
        amount: numericAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
        note: note.trim() || undefined
      };

      await createPayment(requestData);
      setSuccessMsg('Ghi nhận thanh toán thành công!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi ghi nhận thanh toán';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const anyErr = err as Record<string, unknown>;
        if (typeof anyErr.message === 'string') {
          msg = anyErr.message;
        } else if (typeof anyErr.error === 'string') {
          msg = anyErr.error;
        }
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ghi Nhận Thanh Toán
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đơn hàng #{summary?.orderCode || orderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm">Đang tải thông tin đơn hàng...</p>
            </div>
          ) : summary ? (
            <>
              {/* Order Payment Summary Card */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>Khách hàng: <strong className="text-slate-800 dark:text-slate-200">{summary.customerName || 'Khách lẻ'}</strong></span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                    summary.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : summary.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                  }`}>
                    {summary.paymentStatus === 'PAID' ? 'Đã thanh toán' : summary.paymentStatus === 'PARTIALLY_PAID' ? 'Thanh toán 1 phần' : 'Chưa thanh toán'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                  <div>
                    <span className="block text-[11px] text-slate-500">Tổng tiền</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {formatVND(summary.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500">Đã thanh toán</span>
                    <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                      {formatVND(summary.paidAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500">Còn phải trả</span>
                    <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
                      {formatVND(summary.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alert Feedback Messages */}
              {error && (
                <div className="flex items-start space-x-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phương thức thanh toán
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Tiền mặt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Chuyển khoản</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    {summary.remainingAmount > 0 && (
                      <button
                        type="button"
                        onClick={handleFillMaxAmount}
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                      >
                        Trả hết ({formatVND(summary.remainingAmount)})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      min="1"
                      max={summary.remainingAmount}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none transition-all ${
                        isOverpaid
                          ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400">
                      VNĐ
                    </span>
                  </div>
                  {isOverpaid && (
                    <p className="mt-1 text-xs text-rose-500">
                      Vượt quá số tiền còn phải trả ({formatVND(remaining)})
                    </p>
                  )}
                </div>

                {/* QR Code & Bank Transfer Section */}
                {paymentMethod === 'BANK_TRANSFER' && (() => {
                  const transferSyntax = `TT ${summary.orderCode || orderId}`;
                  const qrImageUrl = numericAmount > 0
                    ? `https://img.vietqr.io/image/ICB-108871728162-compact2.png?amount=${numericAmount}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=NGUYEN%20LE%20HUY%20TAM`
                    : '/images/qr-code.jpg';

                  const copyText = (val: string, type: 'acc' | 'syn') => {
                    navigator.clipboard.writeText(val);
                    if (type === 'acc') {
                      setCopiedAccount(true);
                      setTimeout(() => setCopiedAccount(false), 2000);
                    } else {
                      setCopiedSyntax(true);
                      setTimeout(() => setCopiedSyntax(false), 2000);
                    }
                  };

                  const handleDownloadQr = async () => {
                    setDownloadingQr(true);
                    await downloadQrImage(qrImageUrl, `qr-don-hang-${summary.orderCode || orderId}.png`);
                    setTimeout(() => setDownloadingQr(false), 1200);
                  };

                  return (
                    <div className="space-y-3 rounded-2xl bg-slate-900 p-4 text-white shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Quét mã QR để thanh toán
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDownloadQr}
                          disabled={downloadingQr}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {downloadingQr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-amber-400" />}
                          <span>{downloadingQr ? 'Đang tải...' : 'Tải mã QR'}</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="rounded-xl bg-white p-2 shadow-inner shrink-0">
                          <img
                            src={qrImageUrl}
                            alt="Mã QR thanh toán đơn hàng"
                            className="h-36 w-36 object-contain rounded-lg"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== '/images/qr-code.jpg') {
                                target.src = '/images/qr-code.jpg';
                              }
                            }}
                          />
                        </div>
                        <div className="w-full space-y-1.5 text-xs">
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-400">Ngân hàng:</span>
                            <span className="font-bold text-slate-100">VietinBank</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                            <span className="text-slate-400">Số tài khoản:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-100">108871728162</span>
                              <button
                                type="button"
                                onClick={() => copyText('108871728162', 'acc')}
                                className="p-0.5 text-slate-400 hover:text-white"
                                title="Sao chép STK"
                              >
                                {copiedAccount ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-400">Chủ TK:</span>
                            <span className="font-bold text-slate-100">NGUYEN LE HUY TAM</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                            <span className="text-slate-400">Nội dung:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded">
                                {transferSyntax}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyText(transferSyntax, 'syn')}
                                className="p-0.5 text-slate-400 hover:text-white"
                                title="Sao chép nội dung"
                              >
                                {copiedSyntax ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between pt-0.5">
                            <span className="text-slate-400">Số tiền:</span>
                            <span className="font-black text-amber-400 text-sm">
                              {formatVND(numericAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Mã tham chiếu / Mã giao dịch ngân hàng <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder={`Ví dụ: FT${Date.now().toString().slice(-6)}`}
                          className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Thời điểm thanh toán</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white bg-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Ghi chú</span>
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm về khoản thanh toán này (nếu có)..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white bg-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || isInvalidAmount}
                    className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span>Xác Nhận Thanh Toán</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-6 text-slate-500">
              Không tìm thấy thông tin thanh toán cho đơn hàng này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
