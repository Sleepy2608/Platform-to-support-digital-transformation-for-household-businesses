'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Phone,
  Search,
  X,
  Check,
  CreditCard,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wallet,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import { useDebounce } from '@/app/lib/useDebounce';
import { FastSalesCustomer } from './FastSalesTypes';

interface FastSalesCustomerSectionProps {
  selectedCustomer: FastSalesCustomer | null;
  onSelectCustomer: (customer: FastSalesCustomer | null) => void;
  paymentMode?: 'PAY_NOW' | 'DEBT';
  onPaymentModeChange?: (mode: 'PAY_NOW' | 'DEBT') => void;
}

export function FastSalesCustomerSection({
  selectedCustomer,
  onSelectCustomer,
  paymentMode = 'PAY_NOW',
  onPaymentModeChange,
}: FastSalesCustomerSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 250);
  const [customers, setCustomers] = useState<FastSalesCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const fetchCustomers = useCallback(async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (query.trim()) params.set('keyword', query.trim());
      const results = await apiClient.get<FastSalesCustomer[]>(`/api/customers/options?${params}`);
      setCustomers(results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể kết nối danh sách khách hàng'
      );
      setCustomers([]);
    } flexFinally();
    function flexFinally() {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      void fetchCustomers(debouncedKeyword);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, debouncedKeyword, fetchCustomers]);

  const handleOpenDropdown = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelectCustomer = (customer: FastSalesCustomer | null) => {
    onSelectCustomer(customer);
    setIsOpen(false);
    setKeyword('');
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3" ref={containerRef}>
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <User className="w-4 h-4 text-slate-400" />
          <span>Khách hàng mua hàng</span>
        </label>
        {selectedCustomer && (
          <button
            type="button"
            onClick={() => handleSelectCustomer(null)}
            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
            title="Bỏ chọn và quay về Khách mua lẻ"
          >
            Bỏ chọn
          </button>
        )}
      </div>

      {/* Selected Customer Display / Trigger Button */}
      {!selectedCustomer ? (
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenDropdown}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs shrink-0">
                KL
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  Khách mua lẻ (Khách vãng lai)
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate">
                  Thanh toán ngay • Không cần lưu hồ sơ khách
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-xs font-bold hidden sm:inline text-slate-600">Chọn khách</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>
      ) : (
        /* Selected Registered Customer Card */
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {selectedCustomer.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {selectedCustomer.customerName}
                  </h4>
                  {selectedCustomer.customerCode && (
                    <span className="bg-slate-200/80 px-1.5 py-0.2 rounded font-mono text-[10px] text-slate-600">
                      {selectedCustomer.customerCode}
                    </span>
                  )}
                </div>
                {selectedCustomer.phone && (
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedCustomer.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleOpenDropdown}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                title="Đổi khách hàng khác"
              >
                Đổi
              </button>
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Bỏ chọn (chuyển về Khách lẻ)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Debt Balance Badge */}
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Công nợ hiện tại:
            </span>
            <strong className={Number(selectedCustomer.debtBalance || 0) > 0 ? 'text-amber-700 font-extrabold' : 'text-slate-700 font-bold'}>
              {Number(selectedCustomer.debtBalance || 0).toLocaleString('vi-VN')} ₫
            </strong>
          </div>
        </div>
      )}

      {/* Customer Dropdown Menu */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute left-0 right-0 top-1 bg-white rounded-2xl border border-slate-200 p-3 shadow-xl space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Gõ tên hoặc số điện thoại..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-8 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List options */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {/* Option: Khách mua lẻ */}
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  !selectedCustomer
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">Khách mua lẻ (Khách vãng lai)</p>
                  <p className={`text-[10px] ${!selectedCustomer ? 'text-slate-300' : 'text-slate-400'}`}>
                    Không quản lý công nợ
                  </p>
                </div>
                {!selectedCustomer && <Check className="w-4 h-4 text-white" />}
              </button>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-4 text-slate-400 gap-2 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span>Đang tìm kiếm khách hàng...</span>
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
                  <p className="text-xs font-bold text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => void fetchCustomers(debouncedKeyword)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Thử lại
                  </button>
                </div>
              )}

              {/* Customer List Items */}
              {!loading &&
                !error &&
                customers.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  const hasDebt = Number(c.debtBalance || 0) > 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white font-bold'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold truncate">{c.customerName}</span>
                          {c.customerCode && (
                            <span
                              className={`font-mono text-[10px] ${
                                isSelected ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              ({c.customerCode})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] mt-0.5">
                          {c.phone && (
                            <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                              {c.phone}
                            </span>
                          )}
                          {hasDebt && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Nợ: {Number(c.debtBalance).toLocaleString('vi-VN')} ₫
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}

              {/* No Results Empty State */}
              {!loading && !error && customers.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-xs font-bold text-slate-600">Không tìm thấy khách hàng</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Thử tìm với tên hoặc số điện thoại khác
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment / Debt UI Selector */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Hình thức thanh toán
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onPaymentModeChange?.('PAY_NOW')}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              paymentMode === 'PAY_NOW'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Thanh toán ngay</span>
          </button>

          <button
            type="button"
            onClick={() => onPaymentModeChange?.('DEBT')}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              paymentMode === 'DEBT'
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Ghi nhận công nợ</span>
          </button>
        </div>

        {/* Debt Mode Warnings & Info */}
        {paymentMode === 'DEBT' && (
          <div className="p-3 rounded-xl border text-xs space-y-1 transition-all animate-in fade-in duration-150 bg-amber-50/80 border-amber-200/80">
            {!selectedCustomer ? (
              <p className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                ⚠️ Ghi nhận công nợ bắt buộc phải chọn khách hàng cụ thể!
              </p>
            ) : (
              <div className="space-y-1 text-amber-900">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span>Khách nợ:</span>
                  <span className="font-bold">{selectedCustomer.customerName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Nợ hiện tại:</span>
                  <span className="font-bold text-amber-800">
                    {Number(selectedCustomer.debtBalance || 0).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
