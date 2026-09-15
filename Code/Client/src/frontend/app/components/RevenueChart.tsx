'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/app/lib/apiClient';

type GroupBy = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
type Point = { fromDate: string; toDate: string; revenue: number };
type ChartData = { fromDate: string; toDate: string; groupBy: GroupBy; totalRevenue: number; hasData: boolean; points: Point[] };
const money = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const dateLabel = (s: string) => s.split('-').reverse().join('/');
const periodLabel = (p: Point) => p.fromDate === p.toDate ? dateLabel(p.fromDate) : `${dateLabel(p.fromDate)} – ${dateLabel(p.toDate)}`;
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function RevenueChart() {
  const [to, setTo] = useState(today);
  const [from, setFrom] = useState(() => `${today().slice(0, 7)}-01`);
  const [group, setGroup] = useState<GroupBy>('DAY');
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Point | null>(null);
  const requestId = useRef(0);
  async function load(start: string, end: string, grouping: GroupBy) {
    const id = ++requestId.current;
    setError(''); setData(null); setSelected(null);
    if (!start || !end || start > end) { setLoading(false); setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
    setLoading(true);
    try {
      const result = await apiClient.get<ChartData>(`/api/revenue-ledger/chart?${new URLSearchParams({ fromDate: start, toDate: end, groupBy: grouping })}`);
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : 'Không thể tải biểu đồ doanh thu.');
    } finally { if (id === requestId.current) setLoading(false); }
  }
  useEffect(() => {
    const end = today();
    let cancelled = false;
    const id = ++requestId.current;
    void apiClient.get<ChartData>(`/api/revenue-ledger/chart?${new URLSearchParams({ fromDate: `${end.slice(0, 7)}-01`, toDate: end, groupBy: 'DAY' })}`)
      .then(result => { if (!cancelled && id === requestId.current) setData(result); })
      .catch(e => { if (!cancelled && id === requestId.current) setError(e instanceof Error ? e.message : 'Không thể tải biểu đồ doanh thu.'); })
      .finally(() => { if (!cancelled && id === requestId.current) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const max = Math.max(1, ...(data?.points.map(p => Number(p.revenue)) ?? []));
  const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900';
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm" aria-label="Biểu đồ doanh thu">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-bold text-slate-900">Biểu đồ doanh thu</h2><p className="mt-1 text-sm text-slate-500">So sánh doanh thu theo thời gian. Tuần bắt đầu từ thứ Hai.</p></div>
      {data && <div className="text-right"><p className="text-xs text-slate-500">Tổng trong khoảng đã chọn</p><p className="text-xl font-bold text-slate-900">{money(data.totalRevenue)}</p></div>}
    </div>
    <form className="mt-5 grid gap-3 sm:grid-cols-4" onSubmit={e => { e.preventDefault(); void load(from, to, group); }}>
      <label className="text-sm text-slate-600">Từ ngày<input className={`${input} mt-1`} type="date" min="1900-01-01" max={to} required value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label className="text-sm text-slate-600">Đến ngày<input className={`${input} mt-1`} type="date" min={from} max="9998-12-31" required value={to} onChange={e => setTo(e.target.value)} /></label>
      <label className="text-sm text-slate-600">Nhóm thời gian<select className={`${input} mt-1`} value={group} onChange={e => setGroup(e.target.value as GroupBy)}><option value="DAY">Theo ngày</option><option value="WEEK">Theo tuần</option><option value="MONTH">Theo tháng</option><option value="YEAR">Theo năm</option></select></label>
      <button disabled={loading} className="self-end rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? 'Đang tải…' : 'Xem biểu đồ'}</button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    {loading && <p role="status" className="py-12 text-center text-slate-500">Đang tải dữ liệu doanh thu…</p>}
    {data && <>
      <p className="mt-4 text-xs text-slate-500">{dateLabel(data.fromDate)} – {dateLabel(data.toDate)} · Doanh thu theo ngày xác nhận, cùng nguồn với sổ doanh thu. Bộ lọc biểu đồ độc lập với bảng chi tiết bên dưới.</p>
      {!data.hasData ? <p className="py-12 text-center text-slate-500">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</p> : <>
        <div className="mt-5 flex gap-2">
          <div className="flex h-56 shrink-0 flex-col justify-between text-right text-xs text-slate-500" aria-hidden="true"><span>{money(max)}</span><span>{money(max / 2)}</span><span>0 ₫</span></div>
          <div className="min-w-0 flex-1 overflow-x-auto pb-2">
            <div className="flex items-end gap-2 border-b border-slate-200" style={{ minWidth: data.points.length * 44 }}>
              {data.points.map(p => <div key={p.fromDate} className="min-w-9 flex-1">
                <button type="button" className="group flex h-56 w-full items-end rounded-t outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-600" aria-label={`${periodLabel(p)}: ${money(p.revenue)}`} title={`${periodLabel(p)}: ${money(p.revenue)}`} onMouseEnter={() => setSelected(p)} onFocus={() => setSelected(p)} onClick={() => setSelected(p)}>
                  <span className="block w-full rounded-t bg-blue-600 group-hover:bg-blue-700" style={{ height: `${Math.max(p.revenue > 0 ? 0.8 : 0, Number(p.revenue) / max * 100)}%` }} />
                </button>
              </div>)}
            </div>
            <div className="mt-2 flex gap-2" style={{ minWidth: data.points.length * 44 }}>{data.points.map(p => <span key={p.fromDate} className="min-w-9 flex-1 text-center text-[10px] text-slate-500">{data.groupBy === 'YEAR' ? p.fromDate.slice(0, 4) : data.groupBy === 'MONTH' ? `${p.fromDate.slice(5, 7)}/${p.fromDate.slice(0, 4)}` : dateLabel(p.fromDate).slice(0, 5)}</span>)}</div>
          </div>
        </div>
        <p aria-live="polite" className="mt-3 min-h-6 text-sm text-slate-700">{selected ? `${periodLabel(selected)}: ${money(selected.revenue)}` : 'Rê chuột, chạm hoặc dùng phím Tab để xem doanh thu từng kỳ.'}</p>
        <details className="mt-3 text-sm"><summary className="cursor-pointer text-slate-600">Xem dữ liệu dạng bảng</summary><div className="mt-2 max-h-64 overflow-auto"><table className="w-full text-left"><thead><tr><th className="p-2">Khoảng thời gian</th><th className="p-2 text-right">Doanh thu</th></tr></thead><tbody>{data.points.map(p => <tr key={p.fromDate} className="border-t border-slate-100"><td className="p-2">{periodLabel(p)}</td><td className="p-2 text-right">{money(p.revenue)}</td></tr>)}</tbody></table></div></details>
      </>}
    </>}
  </section>;
}
