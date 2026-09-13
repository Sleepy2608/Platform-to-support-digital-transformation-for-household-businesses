'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Building2, 
  UserCheck, 
  UserPlus, 
  Calendar, 
  AlertTriangle, 
  RotateCcw, 
  Filter, 
  ShieldAlert,
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Shield,
  Briefcase,
  User,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { 
  fetchPlatformAnalytics, 
  fetchPlatformUserDetails, 
  type PlatformAnalyticsData, 
  type PlatformUserDetail 
} from '../lib/analytics';
import { getRoles, isAnyAdmin } from '../lib/roles';

interface PlatformAnalyticsDashboardProps {
  variant?: 'dark' | 'light';
}

type MetricType = 'owners' | 'active_users' | 'new_users';

const ROLE_LABELS: Record<string, { label: string; colorDark: string; colorLight: string }> = {
  ADMIN: { label: 'Admin', colorDark: 'bg-rose-500/15 text-rose-400 border-rose-500/30', colorLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  MANAGER: { label: 'Manager', colorDark: 'bg-purple-500/15 text-purple-400 border-purple-500/30', colorLight: 'bg-purple-50 text-purple-700 border-purple-200' },
  BUSINESS_OWNER: { label: 'Chủ hộ kinh doanh', colorDark: 'bg-amber-500/15 text-amber-400 border-amber-500/30', colorLight: 'bg-amber-50 text-amber-800 border-amber-200' },
  EMPLOYEE: { label: 'Nhân viên', colorDark: 'bg-sky-500/15 text-sky-400 border-sky-500/30', colorLight: 'bg-sky-50 text-sky-700 border-sky-200' },
};

const STATUS_LABELS: Record<string, { label: string; colorDark: string; colorLight: string }> = {
  ACTIVE: { label: 'Đang hoạt động', colorDark: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', colorLight: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  LOCKED: { label: 'Đã khóa', colorDark: 'bg-rose-500/15 text-rose-400 border-rose-500/30', colorLight: 'bg-rose-50 text-rose-700 border-rose-200' },
  INACTIVE: { label: 'Không hoạt động', colorDark: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', colorLight: 'bg-slate-100 text-slate-700 border-slate-300' },
  PENDING_VERIFICATION: { label: 'Chờ xác thực', colorDark: 'bg-amber-500/15 text-amber-400 border-amber-500/30', colorLight: 'bg-amber-50 text-amber-700 border-amber-200' },
  DEACTIVATED: { label: 'Đã hủy', colorDark: 'bg-zinc-600/15 text-zinc-500 border-zinc-600/30', colorLight: 'bg-slate-200 text-slate-600 border-slate-300' },
};

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

  // Drill-down details state
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [metricUsers, setMetricUsers] = useState<PlatformUserDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

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

  const loadMetricDetails = useCallback(async (type: MetricType, start?: string, end?: string) => {
    setLoadingDetails(true);
    setDetailsError(null);
    setSearchQuery('');
    setRoleFilter('ALL');
    setCurrentPage(1);

    try {
      const users = await fetchPlatformUserDetails(type, start || undefined, end || undefined);
      setMetricUsers(users);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách chi tiết';
      setDetailsError(message);
      setMetricUsers([]);
    } finally {
      setLoadingDetails(false);
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

  // When applied date filters change and a metric is currently selected, reload the drill-down details
  useEffect(() => {
    if (selectedMetric) {
      void loadMetricDetails(selectedMetric, appliedStartDate, appliedEndDate);
    }
  }, [selectedMetric, appliedStartDate, appliedEndDate, loadMetricDetails]);

  const handleCardClick = (metric: MetricType) => {
    if (selectedMetric === metric) {
      // Toggle off if already active
      setSelectedMetric(null);
    } else {
      setSelectedMetric(metric);
    }
  };

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

  // Filter users by search query and role
  const filteredUsers = useMemo(() => {
    return metricUsers.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.roleName === roleFilter;
      if (!matchesRole) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.trim().toLowerCase();
      return (
        user.fullName?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.roleName?.toLowerCase().includes(query)
      );
    });
  }, [metricUsers, searchQuery, roleFilter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const getMetricTitle = (type: MetricType) => {
    switch (type) {
      case 'owners':
        return 'Danh sách Chủ hộ kinh doanh (Owner) đang hoạt động';
      case 'active_users':
        return 'Danh sách Người dùng đang hoạt động toàn hệ thống';
      case 'new_users':
        return 'Danh sách Người dùng đăng ký mới';
    }
  };

  const getMetricDescription = (type: MetricType) => {
    switch (type) {
      case 'owners':
        return 'Tất cả các tài khoản chủ hộ kinh doanh có trạng thái Đang hoạt động.';
      case 'active_users':
        return 'Toàn bộ tài khoản có trạng thái Đang hoạt động (Bao gồm Admin, Manager, Owner, Nhân viên).';
      case 'new_users':
        if (appliedStartDate && appliedEndDate) {
          return `Tài khoản được tạo từ ngày ${appliedStartDate} đến ngày ${appliedEndDate}.`;
        } else if (appliedStartDate) {
          return `Tài khoản được tạo từ ngày ${appliedStartDate}.`;
        } else if (appliedEndDate) {
          return `Tài khoản được tạo đến ngày ${appliedEndDate}.`;
        }
        return 'Toàn bộ tài khoản được đăng ký trên hệ thống (Sắp xếp theo ngày tạo mới nhất).';
    }
  };

  // Helper formatting for datetime
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
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
              Theo dõi chỉ số hoạt động tổng quan và nhấn vào từng thẻ để xem danh sách chi tiết.
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

      {/* Interactive Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Owners */}
        <div 
          onClick={() => handleCardClick('owners')}
          className={`relative p-6 rounded-2xl border flex items-center justify-between shadow-lg transition-all duration-200 cursor-pointer select-none group ${
            selectedMetric === 'owners'
              ? isDark 
                ? 'bg-zinc-800/90 border-amber-500/80 ring-2 ring-amber-500/40 shadow-amber-500/10' 
                : 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/10'
              : isDark 
                ? 'bg-zinc-900 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-850' 
                : 'bg-white border-slate-200/80 hover:border-amber-400 hover:shadow-md'
          }`}
        >
          {/* Active selection badge */}
          {selectedMetric === 'owners' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950 uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3 h-3" />
              Đang xem
            </div>
          )}

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
            <div className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${
              selectedMetric === 'owners'
                ? 'text-amber-500 font-semibold'
                : isDark ? 'text-zinc-500 group-hover:text-amber-400' : 'text-slate-400 group-hover:text-amber-600'
            }`}>
              <span>{selectedMetric === 'owners' ? '▼ Đang mở danh sách' : '▶ Nhấn để xem danh sách'}</span>
            </div>
          </div>
          <div className={`p-4 rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
            isDark 
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
              : 'text-amber-600 bg-amber-50 border-amber-200'
          }`}>
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div 
          onClick={() => handleCardClick('active_users')}
          className={`relative p-6 rounded-2xl border flex items-center justify-between shadow-lg transition-all duration-200 cursor-pointer select-none group ${
            selectedMetric === 'active_users'
              ? isDark 
                ? 'bg-zinc-800/90 border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-emerald-500/10' 
                : 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-emerald-500/10'
              : isDark 
                ? 'bg-zinc-900 border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-850' 
                : 'bg-white border-slate-200/80 hover:border-emerald-400 hover:shadow-md'
          }`}
        >
          {/* Active selection badge */}
          {selectedMetric === 'active_users' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950 uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3 h-3" />
              Đang xem
            </div>
          )}

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
            <div className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${
              selectedMetric === 'active_users'
                ? 'text-emerald-500 font-semibold'
                : isDark ? 'text-zinc-500 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-600'
            }`}>
              <span>{selectedMetric === 'active_users' ? '▼ Đang mở danh sách' : '▶ Nhấn để xem danh sách'}</span>
            </div>
          </div>
          <div className={`p-4 rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
            isDark 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : 'text-emerald-600 bg-emerald-50 border-emerald-200'
          }`}>
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: New Registered Users (formerly Subscription mới) */}
        <div 
          onClick={() => handleCardClick('new_users')}
          className={`relative p-6 rounded-2xl border flex items-center justify-between shadow-lg transition-all duration-200 cursor-pointer select-none group ${
            selectedMetric === 'new_users'
              ? isDark 
                ? 'bg-zinc-800/90 border-indigo-500/80 ring-2 ring-indigo-500/40 shadow-indigo-500/10' 
                : 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-400/40 shadow-indigo-500/10'
              : isDark 
                ? 'bg-zinc-900 border-zinc-800/80 hover:border-indigo-500/50 hover:bg-zinc-850' 
                : 'bg-white border-slate-200/80 hover:border-indigo-400 hover:shadow-md'
          }`}
        >
          {/* Active selection badge */}
          {selectedMetric === 'new_users' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3 h-3" />
              Đang xem
            </div>
          )}

          <div className="space-y-2">
            <span className={`text-xs font-semibold uppercase tracking-wider block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Người dùng đăng ký mới
            </span>
            {loading ? (
              <div className="h-9 w-24 rounded-lg bg-zinc-800/60 animate-pulse my-1" />
            ) : (
              <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {((data?.newUsers ?? data?.newSubscriptions) ?? 0).toLocaleString('vi-VN')}
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
            <div className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${
              selectedMetric === 'new_users'
                ? 'text-indigo-500 font-semibold'
                : isDark ? 'text-zinc-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'
            }`}>
              <span>{selectedMetric === 'new_users' ? '▼ Đang mở danh sách' : '▶ Nhấn để xem danh sách'}</span>
            </div>
          </div>
          <div className={`p-4 rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
            isDark 
              ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' 
              : 'text-indigo-600 bg-indigo-50 border-indigo-200'
          }`}>
            <UserPlus className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Drill-down Detail Section */}
      {selectedMetric && (
        <div className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          isDark 
            ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Section Header */}
          <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-100 bg-slate-50/70'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {getMetricTitle(selectedMetric)}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  selectedMetric === 'owners'
                    ? isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    : selectedMetric === 'active_users'
                      ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {filteredUsers.length} tài khoản
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {getMetricDescription(selectedMetric)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMetric(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
                Đóng danh sách
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-100 bg-slate-50/40'
          }`}>
            {/* Search Input */}
            <div className={`relative flex-1 min-w-[260px] max-w-md flex items-center rounded-xl border transition-all ${
              isDark 
                ? 'bg-zinc-900 border-zinc-700/80 focus-within:border-zinc-500' 
                : 'bg-white border-slate-300 focus-within:border-slate-500'
            }`}>
              <Search className={`w-4 h-4 ml-3 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo họ tên, username, email, SĐT..."
                className={`w-full text-xs sm:text-sm px-3 py-2 bg-transparent outline-none font-medium placeholder:font-normal ${
                  isDark ? 'text-white placeholder:text-zinc-500' : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`p-1.5 mr-1 rounded-md text-xs hover:bg-zinc-800 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter Tabs (Shown for active_users or new_users) */}
            {selectedMetric !== 'owners' && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {[
                  { value: 'ALL', label: 'Tất cả vai trò' },
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'MANAGER', label: 'Manager' },
                  { value: 'BUSINESS_OWNER', label: 'Owner' },
                  { value: 'EMPLOYEE', label: 'Nhân viên' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setRoleFilter(tab.value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      roleFilter === tab.value
                        ? isDark
                          ? 'bg-white text-zinc-950 shadow-sm'
                          : 'bg-slate-900 text-white shadow-sm'
                        : isDark
                          ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Error Banner */}
          {detailsError && (
            <div className="p-4 mx-6 my-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{detailsError}</span>
            </div>
          )}

          {/* Table Content */}
          <div className="overflow-x-auto">
            {loadingDetails ? (
              <div className="p-16 text-center space-y-3">
                <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-600'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Đang tải danh sách người dùng...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Users className={`w-12 h-12 mx-auto opacity-30 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <p className={`text-base font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Không tìm thấy người dùng nào
                </p>
                <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  {searchQuery || roleFilter !== 'ALL'
                    ? 'Không có kết quả khớp với điều kiện tìm kiếm. Hãy thử điều chỉnh lại bộ lọc.'
                    : 'Chưa có tài khoản nào trong danh mục này.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                    isDark ? 'border-zinc-800 bg-zinc-950/30 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Họ và tên / Username</th>
                    <th className="py-3.5 px-4">Email / SĐT</th>
                    <th className="py-3.5 px-4">Vai trò</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Ngày đăng ký</th>
                    <th className="py-3.5 px-4">Đăng nhập cuối</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs sm:text-sm font-medium ${
                  isDark ? 'divide-zinc-800/70 text-zinc-300' : 'divide-slate-200/70 text-slate-700'
                }`}>
                  {paginatedUsers.map((user, idx) => {
                    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                    const roleInfo = ROLE_LABELS[user.roleName || ''] || {
                      label: user.roleName || 'Chưa rõ',
                      colorDark: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                      colorLight: 'bg-slate-100 text-slate-700 border-slate-300',
                    };
                    const statusInfo = STATUS_LABELS[user.status] || {
                      label: user.status,
                      colorDark: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                      colorLight: 'bg-slate-100 text-slate-700 border-slate-300',
                    };

                    const initial = (user.fullName || user.username || 'U').charAt(0).toUpperCase();

                    return (
                      <tr 
                        key={user.id}
                        className={`transition-colors ${
                          isDark 
                            ? 'hover:bg-zinc-800/50' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 text-center text-xs opacity-60 font-mono">
                          {globalIdx}
                        </td>

                        {/* Name & Username */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                              isDark 
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-200' 
                                : 'bg-slate-100 border-slate-200 text-slate-800'
                            }`}>
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {user.fullName || '—'}
                              </div>
                              <div className={`text-xs font-normal truncate ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className={`text-xs truncate ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                              {user.email || '—'}
                            </div>
                            <div className={`text-xs font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              {user.phone || 'Chưa có SĐT'}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            isDark ? roleInfo.colorDark : roleInfo.colorLight
                          }`}>
                            {user.roleName === 'ADMIN' && <Shield className="w-3 h-3" />}
                            {user.roleName === 'MANAGER' && <Shield className="w-3 h-3" />}
                            {user.roleName === 'BUSINESS_OWNER' && <Building2 className="w-3 h-3" />}
                            {user.roleName === 'EMPLOYEE' && <Briefcase className="w-3 h-3" />}
                            {roleInfo.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            isDark ? statusInfo.colorDark : statusInfo.colorLight
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'ACTIVE' 
                                ? 'bg-emerald-500' 
                                : user.status === 'LOCKED' 
                                  ? 'bg-rose-500' 
                                  : 'bg-amber-500'
                            }`} />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex items-center gap-1.5 opacity-90">
                            <Calendar className="w-3.5 h-3.5 opacity-60" />
                            <span>{formatDateTime(user.createdAt)}</span>
                          </div>
                        </td>

                        {/* Last Login */}
                        <td className="py-3.5 px-4 text-xs">
                          {user.lastLoginAt ? (
                            <div className="flex items-center gap-1.5 opacity-90">
                              <Clock className="w-3.5 h-3.5 opacity-60" />
                              <span>{formatDateTime(user.lastLoginAt)}</span>
                            </div>
                          ) : (
                            <span className="text-xs opacity-50 italic">Chưa đăng nhập</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredUsers.length > itemsPerPage && (
            <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Hiển thị <span className="font-semibold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                <span className="font-semibold text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> trên{' '}
                <span className="font-semibold text-white">{filteredUsers.length}</span> người dùng
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className={`p-2 rounded-xl border text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Trang đầu"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`p-2 rounded-xl border text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}>
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`p-2 rounded-xl border text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className={`p-2 rounded-xl border text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Trang cuối"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
