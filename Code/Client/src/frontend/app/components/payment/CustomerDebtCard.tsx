'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserCheck, TrendingUp, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCustomerDebtSummary, CustomerDebtSummaryResponse } from '@/app/lib/payment';

interface CustomerDebtCardProps {
  customerId: number;
  refreshTrigger?: number;
}

export default function CustomerDebtCard({ customerId, refreshTrigger }: CustomerDebtCardProps) {
  const [summary, setSummary] = useState<CustomerDebtSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCustomerDebtSummary(customerId);
      setSummary(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin công nợ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchSummary();
    }
  }, [customerId, fetchSummary, refreshTrigger]);

  const formatVND = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center py-6">
        <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        <span className="text-xs text-slate-500">Đang tải tổng quan công nợ...</span>
      </div>
    );
  }

  if (error || !summary) {
    return null;
  }

  const isDebting = summary.currentBalance > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {summary.customerName}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mã KH: {summary.customerCode}
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 ${
          isDebting
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
        }`}>
          {isDebting ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Đang nợ</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Không nợ</span>
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <span className="block text-[11px] text-slate-500">Tổng phát sinh nợ</span>
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {formatVND(summary.totalDebtIncreased)}
          </span>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <span className="block text-[11px] text-slate-500">Đã thanh toán</span>
          <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
            {formatVND(summary.totalPaid)}
          </span>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <span className="block text-[11px] text-slate-500">Dư nợ hiện tại</span>
          <span className={`font-bold text-xs ${isDebting ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {formatVND(summary.currentBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}
