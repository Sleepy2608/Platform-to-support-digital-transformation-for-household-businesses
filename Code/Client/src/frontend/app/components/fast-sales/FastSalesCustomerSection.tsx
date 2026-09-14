'use client';

import React, { useState } from 'react';
import { User, Phone, Search, X, Check, CreditCard, ChevronDown } from 'lucide-react';
import { FastSalesCustomer } from './FastSalesTypes';

interface FastSalesCustomerSectionProps {
  selectedCustomer: FastSalesCustomer | null;
  onSelectCustomer: (customer: FastSalesCustomer | null) => void;
  customers: FastSalesCustomer[];
}

export function FastSalesCustomerSection({
  selectedCustomer,
  onSelectCustomer,
  customers,
}: FastSalesCustomerSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.customerName.toLowerCase().includes(keyword.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(keyword.toLowerCase()) ||
      (c.phone && c.phone.includes(keyword))
  );

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <User className="w-4 h-4 text-slate-400" />
          <span>Khách hàng mua hàng</span>
        </label>
        {selectedCustomer && (
          <button
            type="button"
            onClick={() => onSelectCustomer(null)}
            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Chuyển về Khách lẻ
          </button>
        )}
      </div>

      {/* Selector Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
            selectedCustomer
              ? 'border-slate-300 bg-slate-50/50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                selectedCustomer
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {selectedCustomer
                ? selectedCustomer.customerName.charAt(0).toUpperCase()
                : 'KL'}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm truncate">
                {selectedCustomer
                  ? selectedCustomer.customerName
                  : 'Khách mua lẻ (Khách vãng lai)'}
              </h4>
              <p className="text-xs text-slate-500 font-medium truncate">
                {selectedCustomer && selectedCustomer.phone ? (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedCustomer.phone}
                  </span>
                ) : (
                  'Thanh toán ngay • Không quản lý công nợ'
                )}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 p-3 shadow-xl space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Gõ tên hoặc SĐT khách hàng..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-8 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                autoFocus
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

            {/* Customer List Options */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {/* Retail Customer Option */}
              <button
                type="button"
                onClick={() => {
                  onSelectCustomer(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  !selectedCustomer
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">Khách mua lẻ (Khách vãng lai)</p>
                  <p className={`text-[10px] ${!selectedCustomer ? 'text-slate-300' : 'text-slate-400'}`}>
                    Không theo dõi công nợ
                  </p>
                </div>
                {!selectedCustomer && <Check className="w-4 h-4 text-white" />}
              </button>

              {/* Registered Customers */}
              {filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCustomer(c);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{c.customerName}</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          ({c.customerCode})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5">
                        {c.phone && (
                          <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                            {c.phone}
                          </span>
                        )}
                        {c.debtBalance > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Nợ: {c.debtBalance.toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Customer Debt Info Area (Prepared for Debt Feature) */}
      {selectedCustomer && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-700" />
              Công nợ hiện tại:
            </span>
            <strong className="font-black text-amber-800">
              {selectedCustomer.debtBalance.toLocaleString('vi-VN')} ₫
            </strong>
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-800/80">
            <span>Hạn mức nợ tối đa:</span>
            <span className="font-semibold">
              {selectedCustomer.creditLimit.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
