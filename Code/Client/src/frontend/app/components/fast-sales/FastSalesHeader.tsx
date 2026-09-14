'use client';

import React from 'react';
import { ShoppingCart, Zap, RefreshCw, Layers } from 'lucide-react';

interface FastSalesHeaderProps {
  cartItemCount: number;
  totalQuantity: number;
  activeTab: 'products' | 'cart';
  setActiveTab: (tab: 'products' | 'cart') => void;
  onClearCartClick: () => void;
}

export function FastSalesHeader({
  cartItemCount,
  totalQuantity,
  activeTab,
  setActiveTab,
  onClearCartClick,
}: FastSalesHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-xl shadow-xs flex items-center justify-center">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Fast Sales
              </h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-[10px] font-bold tracking-wide">
                BÁN TẠI QUẦY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Tối ưu thao tác bán hàng tốc độ cao cho hộ kinh doanh
            </p>
          </div>
        </div>

        {/* Desktop Quick Actions & Mobile Tab Switcher */}
        <div className="flex items-center gap-2">
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sản phẩm</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'cart'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Giỏ hàng</span>
              {cartItemCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-extrabold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Reset/Clear Cart Header Action */}
          {cartItemCount > 0 && (
            <button
              type="button"
              onClick={onClearCartClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200/80 cursor-pointer"
              title="Làm mới / Xóa giỏ hàng"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          )}

          {/* Cart Badge for Desktop */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs font-semibold">
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            <span className="text-slate-500">Giỏ hàng:</span>
            <span className="font-bold text-slate-900">{cartItemCount} SP ({totalQuantity} món)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
