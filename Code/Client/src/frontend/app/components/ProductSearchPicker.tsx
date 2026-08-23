'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Check, Loader2, Package, Tag, Filter } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import { useDebounce } from '@/app/lib/useDebounce';

export interface SearchProduct {
  id: number;
  productCode: string;
  productName: string;
  categoryId?: number;
  categoryName?: string;
  baseUnitId: number;
  baseUnitName?: string;
  salePrice: number;
  quantityOnHand: number;
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PageData<T> {
  content?: T[];
  data?: T[];
  totalElements?: number;
  total?: number;
  page: number;
  size?: number;
  limit?: number;
  totalPages: number;
}

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface ProductSearchPickerProps {
  onSelectProduct: (product: SearchProduct) => void;
  selectedIds?: number[];
  categories?: CategoryOption[];
  className?: string;
}

export function ProductSearchPicker({
  onSelectProduct,
  selectedIds = [],
  categories = [],
  className = '',
}: ProductSearchPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [categoryId, setCategoryId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: '8',
      });
      if (debouncedSearch.trim()) params.set('keyword', debouncedSearch.trim());
      if (categoryId) params.set('categoryId', categoryId);
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiClient.get<PageData<SearchProduct>>(`/api/products?${params}`);
      const items = res.content || res.data || [];
      setProducts(items);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalElements ?? res.total ?? items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tìm kiếm sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId, statusFilter, page]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs ${className}`}>
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0); // Reset page directly in onChange to avoid useEffect loop
            }}
            placeholder="Tìm tức thời theo tên hoặc mã SP..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(0); // Reset page directly in onChange
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0); // Reset page directly in onChange
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="INACTIVE">Ngừng bán</option>
          </select>
        </div>
      </div>

      {/* Product Results Grid */}
      <div className="min-h-[220px] py-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex animate-pulse items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="h-12 w-12 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-red-500">
            <p>{error}</p>
            <button
              onClick={() => void fetchProducts()}
              className="mt-2 font-semibold underline text-slate-700 hover:text-slate-900"
            >
              Thử lại
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center text-center text-slate-400">
            <Package className="mb-2 h-8 w-8 stroke-1 text-slate-300" />
            <p className="text-xs font-semibold text-slate-500">Không tìm thấy sản phẩm</p>
            <p className="text-[11px] text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const price = Number(p.salePrice || 0);
              const unit = p.baseUnitName || 'SP';

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className={`group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-2xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                          SP
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 group-hover:text-slate-950">
                        {p.productName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-mono">{p.productCode}</span>
                        {p.categoryName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{p.categoryName}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-700">
                          {price.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          / {unit}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Tồn: {p.quantityOnHand ?? 0})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white'
                    }`}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>{totalCount} sản phẩm</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold disabled:opacity-30 hover:bg-slate-50"
            >
              Trước
            </button>
            <span className="px-2 font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold disabled:opacity-30 hover:bg-slate-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
