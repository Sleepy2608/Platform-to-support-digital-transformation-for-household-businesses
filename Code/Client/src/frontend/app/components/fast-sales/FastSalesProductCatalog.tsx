'use client';

import React, { forwardRef } from 'react';
import { Search, X, Package, Plus, Check, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { FastSalesCategory, FastSalesProduct } from './FastSalesTypes';

interface FastSalesProductCatalogProps {
  products: FastSalesProduct[];
  categories: FastSalesCategory[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: number;
  onCategorySelect: (id: number) => void;
  onAddToCart: (product: FastSalesProduct) => void;
  cartProductQuantities: Record<number, number>;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const FastSalesProductCatalog = forwardRef<HTMLInputElement, FastSalesProductCatalogProps>(
  function FastSalesProductCatalog(
    {
      products,
      categories,
      searchTerm,
      onSearchChange,
      selectedCategoryId,
      onCategorySelect,
      onAddToCart,
      cartProductQuantities,
      loading = false,
      error = '',
      onRetry,
    },
    ref
  ) {
    return (
      <div className="flex flex-col gap-4">
        {/* Search Input & Category Filters Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={ref}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm tức thời theo tên hoặc mã SP / SKU... (Phím tắt: F2 hoặc /)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                title="Xóa tìm kiếm (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onCategorySelect(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product List Content */}
        <div className="min-h-[320px]">
          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 animate-pulse space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-20 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded" />
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="h-5 w-24 bg-slate-200 rounded" />
                    <div className="h-9 w-9 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-2xs flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Không thể tải danh sách sản phẩm</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
              )}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center">
              <Package className="w-12 h-12 text-slate-300 stroke-1 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Không tìm thấy sản phẩm</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Thử tìm với tên hoặc mã sản phẩm khác hoặc chọn danh mục khác.
              </p>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {products.map((p) => {
                const inCartCount = cartProductQuantities[p.id] || 0;
                const isOutOfStock = p.quantityOnHand <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && onAddToCart(p)}
                    className={`group relative rounded-2xl border p-4 transition-all flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                        : inCartCount > 0
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs cursor-pointer'
                        : 'border-slate-200/80 bg-white hover:border-slate-400 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Top Row: Code & Stock Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.productCode}
                        </span>
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Hết hàng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            Tồn: {Number(p.quantityOnHand || 0).toLocaleString('vi-VN')} {p.unitName}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-slate-950 line-clamp-2 leading-snug">
                        {p.productName}
                      </h3>
                    </div>

                    {/* Price & Add Action Row */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Giá bán</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-emerald-700">
                            {Number(p.salePrice || 0).toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/{p.unitName}</span>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) onAddToCart(p);
                        }}
                        className={`flex items-center justify-center rounded-xl transition-all ${
                          isOutOfStock
                            ? 'h-9 px-2 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : inCartCount > 0
                            ? 'h-9 px-3 bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer'
                            : 'h-9 w-9 bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200 cursor-pointer'
                        }`}
                      >
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold">Hết hàng</span>
                        ) : inCartCount > 0 ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Đã chọn ({inCartCount})</span>
                          </>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);
