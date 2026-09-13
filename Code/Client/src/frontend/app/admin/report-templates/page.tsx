'use client';

import { useEffect, useState } from 'react';
import { FileCog, Plus, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface TemplateVersion { id: number; versionNumber: string; effectiveFrom: string; effectiveTo: string | null; status: string; templateSchema: unknown; }
interface TemplateItem { template: { id: number; templateCode: string; templateName: string; templateType: string; officialFormCode: string | null; legalBasis: string | null; status: string; }; versions: TemplateVersion[]; }

export default function ReportTemplatesPage() {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ templateCode: 'S1-HKD', templateName: 'Sổ chi tiết doanh thu bán hàng hóa, dịch vụ', templateType: 'ACCOUNTING_BOOK', officialFormCode: 'S1-HKD', legalBasis: 'Thông tư 88/2021/TT-BTC', description: '' });
  const [versionForm, setVersionForm] = useState({ templateId: '', versionNumber: '1.0', effectiveFrom: new Date().toISOString().slice(0, 10), templateSchema: '{\n  "columns": []\n}' });

  const load = async () => {
    setLoading(true); setError('');
    try { setItems(await apiClient.get<TemplateItem[]>('/api/admin/report-templates')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải biểu mẫu'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    apiClient.get<TemplateItem[]>('/api/admin/report-templates')
      .then(data => { if (active) setItems(data); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không thể tải biểu mẫu'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const createTemplate = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    try { await apiClient.post('/api/admin/report-templates', form); setMessage('Đã tạo biểu mẫu.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tạo biểu mẫu'); }
  };

  const addVersion = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const schema = JSON.parse(versionForm.templateSchema);
      await apiClient.post(`/api/admin/report-templates/${versionForm.templateId}/versions`, { versionNumber: versionForm.versionNumber, effectiveFrom: versionForm.effectiveFrom, effectiveTo: null, templateSchema: schema });
      setMessage('Đã phát hành phiên bản mới; phiên bản trước được đóng hiệu lực tự động.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'JSON hoặc dữ liệu phiên bản không hợp lệ'); }
  };

  return <div className="space-y-6">
    <div><h1 className="flex items-center gap-3 text-2xl font-bold"><FileCog className="h-7 w-7" />Biểu mẫu báo cáo kế toán</h1><p className="mt-2 text-sm text-zinc-400">Quản lý phiên bản S1-HKD, S2-HKD và S4-HKD theo ngày hiệu lực.</p></div>
    {error && <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}
    {message && <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">{message}</div>}
    <div className="grid gap-5 xl:grid-cols-2">
      <form onSubmit={createTemplate} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="font-bold">Tạo biểu mẫu</h2>
        <div className="grid grid-cols-2 gap-3"><input required value={form.templateCode} onChange={e => setForm({...form, templateCode:e.target.value})} placeholder="Mã mẫu" className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm"/><input required value={form.templateName} onChange={e => setForm({...form, templateName:e.target.value})} placeholder="Tên biểu mẫu" className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm"/></div>
        <input value={form.legalBasis} onChange={e => setForm({...form, legalBasis:e.target.value})} placeholder="Căn cứ pháp lý" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm"/>
        <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-zinc-950"><Plus className="h-4 w-4"/>Tạo mẫu</button>
      </form>
      <form onSubmit={addVersion} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="font-bold">Phát hành phiên bản</h2>
        <div className="grid grid-cols-3 gap-3"><select required value={versionForm.templateId} onChange={e => setVersionForm({...versionForm, templateId:e.target.value})} className="col-span-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm"><option value="">Chọn biểu mẫu</option>{items.map(i => <option key={i.template.id} value={i.template.id}>{i.template.templateCode}</option>)}</select><input required value={versionForm.versionNumber} onChange={e => setVersionForm({...versionForm, versionNumber:e.target.value})} placeholder="Phiên bản" className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm"/></div>
        <input type="date" required value={versionForm.effectiveFrom} onChange={e => setVersionForm({...versionForm, effectiveFrom:e.target.value})} className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm"/>
        <textarea rows={5} value={versionForm.templateSchema} onChange={e => setVersionForm({...versionForm, templateSchema:e.target.value})} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs"/>
        <button className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white">Phát hành</button>
      </form>
    </div>
    <div className="space-y-3">{loading ? <RefreshCw className="h-5 w-5 animate-spin"/> : items.map(item => <div key={item.template.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex items-center justify-between"><div><strong>{item.template.templateCode} · {item.template.templateName}</strong><p className="mt-1 text-xs text-zinc-400">{item.template.legalBasis || 'Chưa có căn cứ pháp lý'}</p></div><span className="rounded-full bg-emerald-950 px-3 py-1 text-xs text-emerald-300">{item.template.status}</span></div><div className="mt-4 flex flex-wrap gap-2">{item.versions.map(v => <span key={v.id} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs">v{v.versionNumber} · {v.effectiveFrom}{v.effectiveTo ? ` → ${v.effectiveTo}` : ''} · {v.status}</span>)}{item.versions.length === 0 && <span className="text-xs text-amber-400">Chưa có phiên bản</span>}</div></div>)}</div>
  </div>;
}
