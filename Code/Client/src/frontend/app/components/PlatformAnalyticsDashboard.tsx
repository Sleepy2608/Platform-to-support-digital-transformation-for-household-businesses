'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Building2, 
  UserCheck, 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  RotateCcw, 
  Filter, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { fetchPlatformAnalytics, type PlatformAnalyticsData } from '../lib/analytics';
import { getRoles, isAnyAdmin } from '../lib/roles';

interface PlatformAnalyticsDashboardProps {
  variant?: 'dark' | 'light';
}

export default function PlatformAnalyticsDashboard({ variant = 'dark' }: PlatformAnalyticsDashboardProps) {
  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
  // Lazy initialize forbidden check for initial render
  const [forbidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const roles = getRoles();
    return roles.length > 0 && !isAnyAdmin(roles);
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const roles = getRoles();
    const isForbidden = roles.length > 0 && !isAnyAdmin(roles);
    return !isForbidden;
  });
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');

  const isDark = variant === 'dark';

  const loadData = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);

    // Client-side date validation
    if (start && end && start > end) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetchPlatformAnalytics(start || undefined, end || undefined);
      setData(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể kết nối máy chủ';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!forbidden) {
      let isMounted = true;
      const fetchData = async () => {
        if (isMounted) {
          await loadData(appliedStartDate, appliedEndDate);
        }
      };
      void fetchData();
      return () => {
        isMounted = false;
      };
    }
  }, [forbidden, appliedStartDate, appliedEndDate, loadData]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    setError(null);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setError(null);
  };

  // 403 Forbidden State
  if (forbidden) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${
        isDark 
          ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
          : 'bg-white border-slate-200 text-slate-700 shadow-sm'
      }`}>
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Truy cập bị từ chối (403 Forbidden)</h2>
        <p className="text-sm max-w-md mx-auto opacity-80">
          Bạn không có quyền truy cập dữ liệu Platform Analytics. Chức năng này chỉ dành cho Manager và Administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-zinc-900 border-zinc-800/80 shadow-lg' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Platform Analytics Dashboard
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Theo dõi chỉ số hoạt động tổng quan trên toàn bộ nền tảng.
            </p>
          </div>

          {/* Date Filter Form */}
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`text-xs sm:text-sm px-3 py-2 rounded-xl border font-medium focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-slate-500'
                }`}
                placeholder="Từ ngày"
              />
              <span className={isDark ? 'text-zinc-500 text-xs' : 'text-slate-400 text-xs'}>đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`text-xs sm:text-sm px-3 py-2 rounded-xl border font-medium focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-slate-500'
                }`}
                placeholder="Đến ngày"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                Lọc
              </button>

              {(appliedStartDate || appliedEndDate || startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  disabled={loading}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đặt lại
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Validation or API Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-center gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Owners */}
        <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-lg transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-700' 
            : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}>
          <div className="space-y-2">
            <span className={`text-xs font-semibold uppercase tracking-wider block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Tổng số Owner
            </span>
            {loading ? (
              <div className="h-9 w-24 rounded-lg bg-zinc-800/60 animate-pulse my-1" />
            ) : (
              <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {(data?.totalOwners ?? 0).toLocaleString('vi-VN')}
              </div>
            )}
            <span className={`text-xs block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Chủ hộ kinh doanh đang hoạt động
            </span>
          </div>
          <div className={`p-4 rounded-xl border ${
            isDark 
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
              : 'text-amber-600 bg-amber-50 border-amber-200'
          }`}>
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-lg transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-700' 
            : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}>
          <div className="space-y-2">
            <span className={`text-xs font-semibold uppercase tracking-wider block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Người dùng đang hoạt động
            </span>
            {loading ? (
              <div className="h-9 w-24 rounded-lg bg-zinc-800/60 animate-pulse my-1" />
            ) : (
              <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {(data?.activeUsers ?? 0).toLocaleString('vi-VN')}
              </div>
            )}
            <span className={`text-xs block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Tài khoản active toàn hệ thống
            </span>
          </div>
          <div className={`p-4 rounded-xl border ${
            isDark 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : 'text-emerald-600 bg-emerald-50 border-emerald-200'
          }`}>
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: New Subscriptions */}
        <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-lg transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-700' 
            : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}>
          <div className="space-y-2">
            <span className={`text-xs font-semibold uppercase tracking-wider block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Subscription mới
            </span>
            {loading ? (
              <div className="h-9 w-24 rounded-lg bg-zinc-800/60 animate-pulse my-1" />
            ) : (
              <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {(data?.newSubscriptions ?? 0).toLocaleString('vi-VN')}
              </div>
            )}
            <span className={`text-xs block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              {appliedStartDate && appliedEndDate
                ? `Từ ${appliedStartDate} đến ${appliedEndDate}`
                : appliedStartDate
                  ? `Từ ngày ${appliedStartDate}`
                  : appliedEndDate
                    ? `Đến ngày ${appliedEndDate}`
                    : 'Tất cả thời gian'}
            </span>
          </div>
          <div className={`p-4 rounded-xl border ${
            isDark 
              ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' 
              : 'text-indigo-600 bg-indigo-50 border-indigo-200'
          }`}>
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
