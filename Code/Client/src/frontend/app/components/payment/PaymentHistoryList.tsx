'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  History, DollarSign, CreditCard, Calendar, User, FileText, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  getOrderPayments,
  getCustomerPaymentHistory,
  PaymentResponse
} from '@/app/lib/payment';

interface PaymentHistoryListProps {
  orderId?: number;
  customerId?: number;
  refreshTrigger?: number;
}

export default function PaymentHistoryList({ orderId, customerId, refreshTrigger }: PaymentHistoryListProps) {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (orderId) {
        const data = await getOrderPayments(orderId);
        setPayments(data);
      } else if (customerId) {
        const data = await getCustomerPaymentHistory(customerId, page, 20);
        setPayments(data.content);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử thanh toán';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [orderId, customerId, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const formatVND = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <History className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Lịch Sử Giao Dịch Thanh Toán
          </h4>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mb-2" />
          <p className="text-xs">Đang tải lịch sử giao dịch...</p>
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          Chưa có giao dịch thanh toán nào được ghi nhận.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Transaction Items */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {payments.map((tx) => (
              <div key={tx.paymentId} className="py-3 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                      tx.paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    }`}>
                      {tx.paymentMethod === 'BANK_TRANSFER' ? (
                        <>
                          <CreditCard className="h-3 w-3 mr-1" />
                          <span>Chuyển khoản</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-3 w-3 mr-1" />
                          <span>Tiền mặt</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono font-medium text-slate-600 dark:text-slate-400">
                      {tx.transactionCode}
                    </span>
                  </div>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    +{formatVND(tx.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(tx.paymentDate)}</span>
                  </div>
                  {tx.createdByUsername && (
                    <div className="flex items-center space-x-1 justify-end">
                      <User className="h-3 w-3" />
                      <span>{tx.createdByUsername}</span>
                    </div>
                  )}
                </div>

                {tx.referenceNumber && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1.5 font-mono">
                    Mã GD Ngân hàng: <span className="font-semibold">{tx.referenceNumber}</span>
                  </div>
                )}

                {tx.note && (
                  <div className="flex items-start space-x-1 text-[11px] text-slate-500 italic">
                    <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{tx.note}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px] pt-1 text-slate-400 border-t border-dashed border-slate-100 dark:border-slate-800">
                  <span>Dư nợ khách sau GD:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatVND(tx.balanceAfter)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination if customer history */}
          {customerId && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Trang trước
              </button>
              <span className="text-slate-500">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
