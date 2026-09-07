'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Eye, Package, Plus, RefreshCw, Search, X,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface StockImportSummary {
  id: number;
  importCode: string;
  importDate: string;
  status: string;
  totalAmount: number;
  note: string;
  createdByName: string;
  items: { productName: string; quantity: number; unitName: string }[];
}

interface PageResponse {
  content: StockImportSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Đã nhập kho', color: 'bg-emerald-100 text-emerald-700' },
};

export default function StockImportListPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('size', '20');
      if (keyword.trim()) params.set('keyword', keyword.trim());
      const result = await apiClient.get<PageResponse>(`/api/stock-imports?${params}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách phiếu nhập');
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => { void load(); }, [load]);

  const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
  const fmtDate = (s: string) => {
    if (!s) return '—';
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">KHO HÀNG</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Phiếu nhập kho</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tạo phiếu nhập kho mới, xem lịch sử và xác nhận cập nhật tồn kho.
            </p>
          </div>
          <Link
            href="/owner/products/stock-import/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition"
          >
            <Plus className="h-4 w-4" /> Tạo phiếu nhập kho
          </Link>
        </header>

        {/* Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo mã phiếu..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:bg-white transition"
              />
              {keyword && (
                <button onClick={() => { setKeyword(''); setPage(0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-slate-400">
              <Package className="mb-3 h-10 w-10 text-slate-300" />
              Chưa có phiếu nhập kho nào
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Mã phiếu</th>
                    <th className="px-5 py-3">Ngày nhập</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Số SP</th>
                    <th className="px-5 py-3 text-right">Tổng tiền</th>
                    <th className="px-5 py-3">Người tạo</th>
                    <th className="px-5 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((row) => {
                    const st = STATUS_MAP[row.status] || { label: row.status, color: 'bg-slate-100 text-slate-600' };
                    return (
                      <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{row.importCode}</td>
                        <td className="px-5 py-3.5 text-slate-600">{fmtDate(row.importDate)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{row.items?.length || 0} SP</td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900">{fmt(row.totalAmount)} đ</td>
                        <td className="px-5 py-3.5 text-slate-600">{row.createdByName}</td>
                        <td className="px-5 py-3.5 text-center">
                          <Link href={`/owner/products/stock-import/${row.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">
                            <Eye className="h-3 w-3" /> Xem
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <p className="text-xs text-slate-500">
                    Trang {data.page + 1} / {data.totalPages} ({data.totalElements} phiếu)
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={data.first}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPage((p) => p + 1)} disabled={data.last}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
