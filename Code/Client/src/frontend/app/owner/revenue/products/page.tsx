'use client';

import { FormEvent, useEffect, useState } from 'react';
import { TrendingUp, Loader2, AlertCircle, PackageX, BarChart3 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

type Row = {
  productId: number;
  productCode: string;
  productName: string;
  unitName: string | null;
  status: string;
  quantitySold: number;
  orderCount: number;
};

type Filter = {
  fromDate: string;
  toDate: string;
  mode: string;
  limit: string;
};

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function initialFilter(): Filter {
  const now = new Date();
  return {
    fromDate: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    toDate: localDate(now),
    mode: 'BEST',
    limit: '10',
  };
}

export default function ProductSalesPage() {
  const [draft, setDraft] = useState<Filter>(initialFilter);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiClient
      .get<Row[]>(`/api/revenue-ledger/products?${new URLSearchParams(filter)}`)
      .then((data) => {
        if (active) {
          setRows(data);
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setRows([]);
          setError(e instanceof Error ? e.message : 'Không tải được thống kê');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.fromDate > draft.toDate) {
      setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    setLoading(true);
    setError('');
    setFilter({ ...draft });
  }

  const heading =
    filter.mode === 'BEST'
      ? 'Mặt hàng bán nhiều nhất'
      : filter.mode === 'SLOW'
      ? 'Mặt hàng bán ít nhất'
      : 'Mặt hàng chưa bán được';

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none" style={{ userSelect: 'none' }}>
              Mặt hàng bán chạy
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none" style={{ userSelect: 'none' }}>
              Theo dõi mặt hàng bán nhiều, bán ít và chưa có lượt bán trong khoảng ngày đã chọn.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
              Phân tích bán hàng
            </span>
          </div>
        </div>

        {/* Filter Form Card */}
        <form onSubmit={submit} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Từ ngày</label>
              <input
                type="date"
                required
                value={draft.fromDate}
                max={draft.toDate}
                onChange={(e) => setDraft({ ...draft, fromDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Đến ngày</label>
              <input
                type="date"
                required
                value={draft.toDate}
                min={draft.fromDate}
                onChange={(e) => setDraft({ ...draft, toDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Xếp hạng</label>
              <select
                value={draft.mode}
                onChange={(e) => setDraft({ ...draft, mode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition cursor-pointer"
              >
                <option value="BEST">Bán nhiều nhất</option>
                <option value="SLOW">Bán ít nhất (trên 0)</option>
                <option value="UNSOLD">Chưa bán (bằng 0)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Số kết quả</label>
              <select
                value={draft.limit}
                onChange={(e) => setDraft({ ...draft, limit: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition cursor-pointer"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} sản phẩm
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50 h-[42px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loading ? 'Đang tải...' : 'Xem thống kê'}
            </button>
          </div>
        </form>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Header section of Table Card */}
          <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
            <div>
              <h2 className="font-bold text-slate-900 text-base">{heading}</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {filter.fromDate} → {filter.toDate} · Tối đa {filter.limit} kết quả
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-xs font-bold text-slate-600 self-start sm:self-auto">
              {rows.length} sản phẩm
            </span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500 font-medium">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> Đang tổng hợp dữ liệu...
            </div>
          ) : error ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <AlertCircle className="h-8 w-8 text-red-400 opacity-60" />
              <p className="font-semibold text-sm text-slate-600">Không thể hiển thị kết quả. Vui lòng thử lại.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <PackageX className="h-10 w-10 opacity-40" />
              <p className="font-semibold text-sm">Không có sản phẩm phù hợp với bộ lọc này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5 w-16 text-center">#</th>
                    <th className="px-5 py-3.5">Sản phẩm</th>
                    <th className="px-5 py-3.5 text-right">Đã bán</th>
                    <th className="px-5 py-3.5">Đơn vị chuẩn</th>
                    <th className="px-5 py-3.5 text-right">Số đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const rank = index + 1;
                    let rankBadgeClass =
                      'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold bg-slate-100 text-slate-600';
                    if (rank === 1)
                      rankBadgeClass =
                        'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs';
                    else if (rank === 2)
                      rankBadgeClass =
                        'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300';
                    else if (rank === 3)
                      rankBadgeClass =
                        'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold bg-amber-700/10 text-amber-900 border border-amber-700/20';

                    return (
                      <tr key={row.productId} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-4 text-center">
                          <span className={rankBadgeClass}>{rank}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-xs shadow-2xs">
                              {row.productName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{row.productName}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-600 border border-slate-200/60">
                                  {row.productCode}
                                </span>
                                {row.status !== 'ACTIVE' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 border border-slate-200">
                                    Ngừng hoạt động
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-slate-900 text-sm tabular-nums">
                            {Number(row.quantitySold).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {row.unitName ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200/60">
                              {row.unitName}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Thiếu đơn vị</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-700 tabular-nums">
                          {row.orderCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

