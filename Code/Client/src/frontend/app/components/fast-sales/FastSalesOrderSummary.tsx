'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';

interface FastSalesOrderSummaryProps {
  subtotal: number;
  discount?: number;
  totalAmount: number;
  totalQuantity: number;
  cartItemCount: number;
  onCreateOrderClick: () => void;
}

export function FastSalesOrderSummary({
  subtotal,
  discount = 0,
  totalAmount,
  totalQuantity,
  cartItemCount,
  onCreateOrderClick,
}: FastSalesOrderSummaryProps) {
  const isCartEmpty = cartItemCount === 0;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-4">
      <div className="space-y-2 text-xs">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-slate-500 font-medium">
          <span>Tạm tính ({totalQuantity} sản phẩm):</span>
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

      {/* Create Order Action Button */}
      <button
        type="button"
        disabled={isCartEmpty}
        onClick={onCreateOrderClick}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isCartEmpty
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
            : 'bg-slate-950 hover:bg-slate-800 text-white shadow-md hover:shadow-lg active:scale-[0.99]'
        }`}
      >
        <ShoppingBag className="w-4 h-4" />
        <span>{isCartEmpty ? 'Giỏ hàng đang trống' : 'Tạo đơn hàng'}</span>
        {!isCartEmpty && <ArrowRight className="w-4 h-4 ml-1" />}
      </button>

      {/* Status notice */}
      {!isCartEmpty && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 text-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Sẵn sàng xác nhận đơn hàng tại quầy
        </p>
      )}
    </div>
  );
}
