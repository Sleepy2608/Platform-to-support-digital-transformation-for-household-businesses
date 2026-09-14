'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Megaphone, Send, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

type Announcement = { id: number; title: string; content: string; status: string; createdAt: string | null; publishedAt: string | null };
type Page = { content: Announcement[]; totalPages: number };
const endpoint = '/api/admin/announcements';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    try {
      const data = await apiClient.get<Page>(`${endpoint}?page=${page}`);
      setItems(data.content); setPages(data.totalPages);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được thông báo'); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => {
    let active = true;
    apiClient.get<Page>(`${endpoint}?page=${page}`).then(data => {
      if (active) { setItems(data.content); setPages(data.totalPages); }
    }).catch(e => {
      if (active) setError(e instanceof Error ? e.message : 'Không tải được thông báo');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setMessage('');
    try {
      await apiClient.post<Announcement>(endpoint, { title: title.trim(), content: content.trim() });
      setTitle(''); setContent(''); setMessage('Đã lưu nháp. Kiểm tra nội dung rồi chọn Phát thông báo.');
      if (page === 0) await load(); else setPage(0);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được bản nháp'); }
    finally { locked.current = false; setBusy(false); }
  }

  async function publish(item: Announcement) {
    if (locked.current || !window.confirm(`Phát “${item.title}” đến tất cả Owner và nhân viên đang hoạt động? Nội dung đã phát không thể sửa.`)) return;
    locked.current = true; setBusy(true); setError(''); setMessage('');
    try {
      await apiClient.post<Announcement>(`${endpoint}/${item.id}/publish`);
      setMessage('Đã phát thông báo. Người nhận có thể xem tại chuông thông báo.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Chưa xác nhận được kết quả. Hãy làm mới trước khi thử lại.'); }
    finally { locked.current = false; setBusy(false); }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex items-start gap-4"><div className="rounded-2xl bg-violet-600/20 p-3 text-violet-300"><Megaphone /></div><div>
      <h1 className="text-3xl font-bold">Thông báo hệ thống</h1>
      <p className="mt-2 text-sm text-zinc-400">Gửi thông tin chung đến Owner và nhân viên đang hoạt động của toàn bộ cửa hàng.</p>
    </div></header>
    {error && <p role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-emerald-300">{message}</p>}
    <form onSubmit={create} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold">Soạn thông báo</h2>
      <label className="block text-sm text-zinc-300">Tiêu đề
        <input required maxLength={255} value={title} onChange={e => setTitle(e.target.value)} disabled={busy}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-violet-400" placeholder="Ví dụ: Lịch bảo trì hệ thống" />
      </label>
      <label className="block text-sm text-zinc-300">Nội dung
        <textarea required maxLength={10000} rows={5} value={content} onChange={e => setContent(e.target.value)} disabled={busy}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-violet-400" placeholder="Nhập nội dung cần gửi đến các cửa hàng..." />
      </label>
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-zinc-400">Lưu nháp chưa gửi đến người dùng.</p>
        <button disabled={busy || !title.trim() || !content.trim()} className="rounded-xl bg-white px-5 py-3 font-semibold text-zinc-950 disabled:opacity-40">{busy ? 'Đang xử lý...' : 'Lưu nháp'}</button>
      </div>
    </form>
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 p-5"><h2 className="text-lg font-semibold">Lịch sử thông báo</h2>
        <button aria-label="Làm mới thông báo" disabled={loading || busy} onClick={() => { setError(''); setLoading(true); void load(); }} className="rounded-lg p-2 hover:bg-zinc-800 disabled:opacity-40"><RefreshCw size={18} /></button>
      </div>
      {loading ? <p className="p-6 text-zinc-400">Đang tải...</p> : items.length === 0 ? <p className="p-6 text-zinc-400">Chưa có thông báo. Hãy tạo bản nháp đầu tiên.</p> : items.map(item => <article key={item.id} className="space-y-3 border-b border-zinc-800 p-5 last:border-0">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="break-words font-semibold">{item.title}</h3>
          <span className={`rounded-full px-3 py-1 text-xs ${item.status === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-300' : 'bg-zinc-800 text-zinc-300'}`}>{item.status === 'PUBLISHED' ? 'Đã phát' : item.status === 'DRAFT' ? 'Bản nháp' : item.status}</span>
        </div>
        <details><summary className="cursor-pointer text-sm text-violet-300">Xem nội dung</summary><p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-300">{item.content}</p></details>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">#{item.id} · {item.publishedAt ? `Phát lúc ${new Date(item.publishedAt).toLocaleString('vi-VN')}` : 'Chưa phát'}</p>
          {item.status === 'DRAFT' && <button disabled={busy} onClick={() => void publish(item)} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-40"><Send size={15} />Phát thông báo</button>}
        </div>
      </article>)}
      <div className="flex items-center justify-end gap-4 border-t border-zinc-800 p-4 text-sm">
        <button disabled={page === 0 || loading || busy} onClick={() => { setLoading(true); setPage(page - 1); }} className="disabled:opacity-30">Trước</button>
        <span>Trang {page + 1} / {Math.max(1, pages)}</span>
        <button disabled={page + 1 >= pages || loading || busy} onClick={() => { setLoading(true); setPage(page + 1); }} className="disabled:opacity-30">Sau</button>
      </div>
    </section>
  </div>;
}
