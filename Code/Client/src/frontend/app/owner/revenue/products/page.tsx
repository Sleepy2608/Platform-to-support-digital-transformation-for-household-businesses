'use client';

import { FormEvent, useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

type Row = { productId: number; productCode: string; productName: string; unitName: string | null; status: string; quantitySold: number; orderCount: number };
type Filter = { fromDate: string; toDate: string; mode: string; limit: string };
function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function initialFilter(): Filter {
  const now = new Date();
  return { fromDate: localDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate: localDate(now), mode: 'BEST', limit: '10' };
}
const field = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-blue-500';

export default function ProductSalesPage() {
  const [draft, setDraft] = useState<Filter>(initialFilter);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiClient.get<Row[]>(`/api/revenue-ledger/products?${new URLSearchParams(filter)}`)
      .then(data => { if (active) { setRows(data); setError(''); } })
      .catch(e => { if (active) { setRows([]); setError(e instanceof Error ? e.message : 'Không tải được thống kê'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.fromDate > draft.toDate) { setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
    setLoading(true); setError(''); setFilter({ ...draft });
  }
  const heading = filter.mode === 'BEST' ? 'Mặt hàng bán nhiều nhất' : filter.mode === 'SLOW' ? 'Mặt hàng bán ít nhất' : 'Mặt hàng chưa bán được';
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-blue-700"><TrendingUp size={18} /> PHÂN TÍCH BÁN HÀNG</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">Mặt hàng bán chạy</h1>
      <p className="mt-2 text-sm text-slate-500">Theo dõi mặt hàng bán nhiều, bán ít và chưa có lượt bán trong khoảng ngày đã chọn.</p>
    </header>
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-sm font-medium text-slate-600">Từ ngày<input type="date" required value={draft.fromDate} max={draft.toDate} onChange={e => setDraft({ ...draft, fromDate: e.target.value })} className={field} /></label>
      <label className="text-sm font-medium text-slate-600">Đến ngày<input type="date" required value={draft.toDate} min={draft.fromDate} onChange={e => setDraft({ ...draft, toDate: e.target.value })} className={field} /></label>
      <label className="text-sm font-medium text-slate-600">Xếp hạng<select value={draft.mode} onChange={e => setDraft({ ...draft, mode: e.target.value })} className={field}><option value="BEST">Bán nhiều nhất</option><option value="SLOW">Bán ít nhất (trên 0)</option><option value="UNSOLD">Chưa bán (bằng 0)</option></select></label>
      <label className="text-sm font-medium text-slate-600">Số kết quả<select value={draft.limit} onChange={e => setDraft({ ...draft, limit: e.target.value })} className={field}>{[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} sản phẩm</option>)}</select></label>
      <button disabled={loading} className="self-end rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Đang tải...' : 'Xem thống kê'}</button>
    </form>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <section aria-busy={loading} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-900">{heading}</h2><p className="mt-1 text-sm text-slate-500">{filter.fromDate} → {filter.toDate} · Tối đa {filter.limit} kết quả</p></div>
      {loading ? <p role="status" className="p-10 text-center text-slate-500">Đang tổng hợp dữ liệu...</p> : error ? <p className="p-10 text-center text-slate-500">Không thể hiển thị kết quả. Vui lòng thử lại.</p> : !rows.length ? <p className="p-10 text-center text-slate-500">Không có sản phẩm phù hợp với bộ lọc này.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">#</th><th className="p-4">Sản phẩm</th><th className="p-4 text-right">Đã bán</th><th className="p-4">Đơn vị chuẩn</th><th className="p-4 text-right">Số đơn</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.productId} className="border-t border-slate-100"><td className="p-4 text-slate-400">{index + 1}</td><td className="p-4"><p className="font-semibold text-slate-900">{row.productName}</p><p className="mt-1 text-xs text-slate-500">{row.productCode}{row.status !== 'ACTIVE' ? ' · Ngừng hoạt động' : ''}</p></td><td className="p-4 text-right font-bold tabular-nums text-blue-700">{Number(row.quantitySold).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</td><td className="p-4 text-slate-600">{row.unitName || 'Thiếu đơn vị'}</td><td className="p-4 text-right tabular-nums">{row.orderCount}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
