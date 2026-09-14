'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, ShoppingBag, User, Wallet, Clock, Loader2, AlertCircle } from 'lucide-react';
import { FastSalesCustomer } from './FastSalesTypes';

interface FastSalesOrderSummaryProps {
  subtotal: number;
  discount?: number;
  totalAmount: number;
  totalQuantity: number;
  cartItemCount: number;
  selectedCustomer?: FastSalesCustomer | null;
  paymentMode?: 'PAY_NOW' | 'DEBT';
  isSubmitting?: boolean;
  validationError?: string;
  onCreateOrderClick: () => void;
}

export function FastSalesOrderSummary({
  subtotal,
  discount = 0,
  totalAmount,
  totalQuantity,
  cartItemCount,
  selectedCustomer = null,
  paymentMode = 'PAY_NOW',
  isSubmitting = false,
  validationError = '',
  onCreateOrderClick,
}: FastSalesOrderSummaryProps) {
  const isCartEmpty = cartItemCount === 0;
  const canSubmit = !isCartEmpty && !isSubmitting && !validationError;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Customer & Payment Mode Summary Pills */}
      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2 text-xs">
        {/* Customer info */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Khách hàng:
          </span>
          <span className="font-bold text-slate-900 truncate max-w-[180px]">
            {selectedCustomer ? selectedCustomer.customerName : 'Khách mua lẻ'}
          </span>
        </div>

        {/* Payment mode info */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            {paymentMode === 'PAY_NOW' ? (
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            )}
            Hình thức:
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              paymentMode === 'PAY_NOW'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {paymentMode === 'PAY_NOW' ? 'Thanh toán ngay' : 'Ghi nhận công nợ'}
          </span>
        </div>
      </div>

      {/* Financial Details */}
      <div className="space-y-2 text-xs">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-slate-500 font-medium">
          <span>Tạm tính ({cartItemCount} SP • {totalQuantity} món):</span>
          <span className="text-slate-800 font-bold">{subtotal.toLocaleString('vi-VN')} ₫</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>Chiết khấu / Giảm giá:</span>
            <span className="text-emerald-700 font-bold">-{discount.toLocaleString('vi-VN')} ₫</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <span className="text-sm font-black text-slate-900 block">Tổng tiền</span>
            <span className="text-[10px] text-slate-400 font-medium">Đã bao gồm thuế (nếu có)</span>
          </div>
          <strong className="text-xl sm:text-2xl font-black text-emerald-700">
            {totalAmount.toLocaleString('vi-VN')} ₫
          </strong>
        </div>
      </div>

      {/* Validation Error Alert if any */}
      {validationError && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Create Order Action Button */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={onCreateOrderClick}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          !canSubmit
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
            : 'bg-slate-950 hover:bg-slate-800 text-white shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Đang xử lý đơn hàng...</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            <span>{isCartEmpty ? 'Giỏ hàng đang trống' : `Tạo đơn hàng (${totalAmount.toLocaleString('vi-VN')} ₫)`}</span>
            {!isCartEmpty && <ArrowRight className="w-4 h-4 ml-1" />}
          </>
        )}
      </button>

      {/* Status notice */}
      {canSubmit && !isSubmitting && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 text-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Sẵn sàng xác nhận đơn hàng tại quầy
        </p>
      )}
    </div>
  );
}
