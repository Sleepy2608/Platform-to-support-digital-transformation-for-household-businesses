'use client';

import React from 'react';
import { ShoppingBag, Minus, Plus, Trash2, AlertCircle } from 'lucide-react';
import { FastSalesCartItem } from './FastSalesTypes';

interface FastSalesCartProps {
  items: FastSalesCartItem[];
  onUpdateQuantity: (productId: number, newQty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

export function FastSalesCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: FastSalesCartProps) {
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Giỏ hàng ({items.length} dòng • {totalItemsCount} món)
          </h2>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
            <ShoppingBag className="w-7 h-7 stroke-1" />
          </div>
          <p className="text-sm font-bold text-slate-700">Giỏ hàng đang trống</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Chọn sản phẩm từ danh mục bên cạnh để thêm vào đơn bán hàng
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {items.map((item) => {
            const lineTotal = item.unitPrice * item.quantity;
            const reachedMax = item.quantity >= item.quantityOnHand;

            return (
              <div
                key={item.productId}
                className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex flex-col gap-2.5 transition-all hover:bg-slate-50"
              >
                {/* Title & Remove */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-900 line-clamp-1">
                      {item.productName}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-400">{item.productCode}</span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-700">
                        {item.unitPrice.toLocaleString('vi-VN')} ₫ / {item.unitName}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.productId)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40">
                  {/* Stepper */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-l-lg transition-colors cursor-pointer"
                      title="Giảm số lượng"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={item.quantityOnHand}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          onUpdateQuantity(item.productId, val);
                        }
                      }}
                      className="w-12 text-center text-xs font-bold text-slate-900 outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      disabled={reachedMax}
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-r-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Tăng số lượng"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Thành tiền</span>
                    <strong className="text-sm font-black text-slate-900">
                      {lineTotal.toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>
                </div>

                {/* Stock Limit Warning */}
                {reachedMax && (
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Đã đạt giới hạn tồn kho ({item.quantityOnHand} {item.unitName})
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
