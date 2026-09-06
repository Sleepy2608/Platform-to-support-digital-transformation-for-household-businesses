'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search,
  User,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronsUpDown,
  Phone,
  CreditCard,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';
import { useDebounce } from '@/app/lib/useDebounce';

export interface CustomerOption {
  id: number;
  customerCode: string;
  customerName: string;
  phone?: string | null;
  debtBalance?: number;
}

interface CustomerSelectProps {
  value: CustomerOption | null;
  onChange: (customer: CustomerOption | null) => void;
  requiredDebtWarning?: boolean;
}

function formatVnd(value?: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

export function CustomerSelect({
  value,
  onChange,
  requiredDebtWarning = false,
}: CustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedKeyword = useDebounce(keyword, 250);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch customers from API
  const fetchOptions = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (query.trim()) params.set('keyword', query.trim());
      const results = await apiClient.get<CustomerOption[]>(`/api/customers/options?${params}`);
      setCustomers(results);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchOptions(debouncedKeyword);
    }
  }, [isOpen, debouncedKeyword, fetchOptions]);

  const handleSelectCustomer = (customer: CustomerOption | null) => {
    onChange(customer);
    setIsOpen(false);
    setKeyword('');
  };

  const handleOpenDropdown = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleQuickCreateSuccess = (newCustomer: CustomerOption) => {
    setShowQuickModal(false);
    onChange(newCustomer);
  };

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <User className="h-3.5 w-3.5 text-slate-400" />
          Khách hàng
        </label>
        <button
          type="button"
          onClick={() => setShowQuickModal(true)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="Tạo nhanh khách hàng mới"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>+ Thêm nhanh</span>
        </button>
      </div>

      {/* Selected Customer Card or Search Trigger */}
      {!value ? (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenDropdown}
              className={`flex-1 flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition-all focus:outline-none focus:ring-2 ${
                requiredDebtWarning
                  ? 'border-amber-400 bg-amber-50/40 text-slate-800 ring-amber-300/40'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 ring-slate-900/10'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">Khách lẻ (Khách vãng lai)</p>
                  <p className="text-[11px] text-slate-400">Không lưu công nợ</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-xs font-semibold hidden sm:inline">Chọn</span>
                <ChevronsUpDown className="h-4 w-4" />
              </div>
            </button>
          </div>
          {requiredDebtWarning && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Đơn còn nợ bắt buộc phải chọn khách hàng cụ thể!
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex-shrink-0 mt-0.5">
                {value.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{value.customerName}</h4>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    {value.customerCode}
                  </span>
                </div>
                {value.phone && (
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {value.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleOpenDropdown}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                title="Đổi khách hàng khác"
              >
                Đổi
              </button>
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Bỏ chọn (chuyển về Khách lẻ)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Công nợ hiện tại Badge */}
          <div
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              Number(value.debtBalance || 0) > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                : 'bg-slate-50 text-slate-600 border border-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-slate-600">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
              Công nợ hiện tại:
            </span>
            <strong
              className={
                Number(value.debtBalance || 0) > 0 ? 'text-amber-700 font-bold' : 'text-slate-700'
              }
            >
              {formatVnd(value.debtBalance)}
            </strong>
          </div>
        </div>
      )}

      {/* Auto-complete Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5"
          >
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Gõ tên, SĐT hoặc mã KH..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* List options */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
              {/* Option: Khách lẻ */}
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                  !value ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-200/80 text-slate-600 text-xs">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Khách lẻ (Khách vãng lai)</p>
                    <p className="text-[10px] text-slate-400">Không quản lý công nợ</p>
                  </div>
                </div>
                {!value && <Check className="h-4 w-4 text-slate-600" />}
              </button>

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-4 text-slate-400 gap-2 text-xs font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm kiếm...
                </div>
              )}

              {/* Customer List */}
              {!loading &&
                customers.map((c) => {
                  const isSelected = value?.id === c.id;
                  const hasDebt = Number(c.debtBalance || 0) > 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold truncate">{c.customerName}</span>
                          <span className="font-mono text-[10px] text-slate-400">({c.customerCode})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {c.phone && <span>{c.phone}</span>}
                          {hasDebt && (
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                              Nợ: {formatVnd(c.debtBalance)}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}

              {/* No results */}
              {!loading && customers.length === 0 && keyword.trim() && (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400">Không tìm thấy khách hàng &quot;{keyword}&quot;</p>
                  <button
                    type="button"
                    onClick={() => setShowQuickModal(true)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Thêm &quot;{keyword}&quot; làm khách mới
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Create Customer Modal */}
      <QuickCustomerModal
        isOpen={showQuickModal}
        initialName={keyword}
        onClose={() => setShowQuickModal(false)}
        onSuccess={handleQuickCreateSuccess}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quick Create Customer Modal Sub-component
// ─────────────────────────────────────────────────────────────
interface QuickCustomerModalProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onSuccess: (customer: CustomerOption) => void;
}

function QuickCustomerModal({
  isOpen,
  initialName = '',
  onClose,
  onSuccess,
}: QuickCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName.trim());
      setPhone('');
      setError('');
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên khách hàng');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const created = await apiClient.post<CustomerOption>('/api/customers/quick', {
        customerName: name.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
      });
      onSuccess(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Thêm nhanh khách hàng</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  maxLength={150}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold outline-none focus:border-slate-400 focus:bg-white transition-all"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Số điện thoại</span>
                <input
                  maxLength={20}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {loading ? 'Đang tạo...' : 'Tạo & Chọn'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
