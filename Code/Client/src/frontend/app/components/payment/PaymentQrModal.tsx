'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, CheckCircle2, Copy, CreditCard, Loader2, X } from 'lucide-react';

interface PaymentQrModalProps {
  isOpen: boolean;
  amount: number;
  transferSyntax: string;
  title: string;
  successTitle: string;
  successMessage: string;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
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
  onClose,
  onConfirm,
}: PaymentQrModalProps) {
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [copiedTransferSyntax, setCopiedTransferSyntax] = useState(false);

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
                  onClick={onClose}
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
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-amber-950 mb-1">Yêu cầu thanh toán chuyển khoản</p>
                      <p className="leading-relaxed">Vui lòng quét mã QR hoặc chuyển khoản theo thông tin dưới đây, sau đó bấm xác nhận thanh toán.</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-2xl p-5 text-center shadow-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quét mã QR để thanh toán</p>
                    <div className="bg-white p-2 rounded-2xl inline-block shadow-md border-4 border-slate-800">
                      <img src="/images/qr-code.jpg" alt="Mã QR chuyển khoản" className="w-64 h-64 object-contain rounded-xl" />
                    </div>
                    <div className="mt-3">
                      <span className="text-xs text-slate-400 font-medium">Số tiền cần chuyển: </span>
                      <span className="text-xl font-black text-amber-400">{amount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

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

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {loading ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
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