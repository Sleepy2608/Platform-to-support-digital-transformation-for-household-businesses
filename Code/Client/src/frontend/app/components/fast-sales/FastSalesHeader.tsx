'use client';

import React from 'react';
import { ShoppingCart, Zap, RefreshCw, Layers, Keyboard } from 'lucide-react';

interface FastSalesHeaderProps {
  cartItemCount: number;
  totalQuantity: number;
  activeTab: 'products' | 'cart';
  setActiveTab: (tab: 'products' | 'cart') => void;
  onClearCartClick: () => void;
  onOpenShortcutsClick: () => void;
}

export function FastSalesHeader({
  cartItemCount,
  totalQuantity,
  activeTab,
  setActiveTab,
  onClearCartClick,
  onOpenShortcutsClick,
}: FastSalesHeaderProps) {
  // Shared tab button styling — keeps labels on a single line without getting cramped
  const tabButtonBase =
    'inline-flex flex-1 min-w-0 items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer';

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      {/* Mobile: 2 stacked sections (Brand + badge / Controls) — Desktop: single row (unchanged) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 lg:py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
        {/* ── Section 1: Brand + Title + Store-mode badge (same line on every breakpoint) ── */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 lg:p-2.5 bg-slate-900 text-amber-400 rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div className="min-w-0">
            {/* flex-nowrap + whitespace-nowrap: badge stays inline and never breaks to two lines */}
            <div className="flex flex-nowrap items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                Fast Sales
              </h1>
              <span className="inline-flex shrink-0 items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-[10px] font-bold tracking-wide whitespace-nowrap">
                BÁN TẠI QUẦY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Tối ưu thao tác bán hàng tốc độ cao cho hộ kinh doanh
            </p>
          </div>
        </div>

        {/* ── Section 2: Tabs + Quick actions ────────────────────────────── */}
        <div className="flex items-center gap-2 w-full lg:w-auto min-w-0">
          {/* Mobile Tab Switcher (full-width balanced row) */}
          <div className="flex lg:hidden items-center gap-1 flex-1 min-w-0 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`${tabButtonBase} ${
                activeTab === 'products'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Sản phẩm</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`${tabButtonBase} ${
                activeTab === 'cart'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Giỏ hàng</span>
              {cartItemCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-extrabold shrink-0">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Keyboard Shortcuts Trigger Button */}
          <button
            type="button"
            onClick={onOpenShortcutsClick}
            className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200/80 shrink-0"
            title="Xem phím tắt bán hàng (F1)"
          >
            <Keyboard className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Phím tắt</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.2 bg-white rounded border border-slate-300 text-[10px] font-mono text-slate-600">
              F1
            </kbd>
          </button>

          {/* Reset/Clear Cart Header Action */}
          {cartItemCount > 0 && (
            <button
              type="button"
              onClick={onClearCartClick}
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200/80 cursor-pointer shrink-0"
              title="Làm mới / Xóa giỏ hàng (F8)"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Làm mới</span>
            </button>
          )}

          {/* Cart Badge for Desktop */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs font-semibold shrink-0">
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            <span className="text-slate-500">Giỏ hàng:</span>
            <span className="font-bold text-slate-900">{cartItemCount} SP ({totalQuantity} món)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
