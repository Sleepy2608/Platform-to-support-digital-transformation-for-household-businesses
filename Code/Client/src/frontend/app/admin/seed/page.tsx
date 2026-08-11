'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/app/lib/apiClient';
import { Database, Camera, RefreshCw, Trash2, Loader2, Layers } from 'lucide-react';

interface SeedConfig {
  id: number;
  tableName: string;
  filePath: string;
  rowCount: number;
  enabled: boolean;
  seedOrder: number;
  updatedAt: string | null;
}

export default function SeedPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [configs, setConfigs] = useState<SeedConfig[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([
        apiClient.get<string[]>('/api/seed/tables'),
        apiClient.get<SeedConfig[]>('/api/seed/configs'),
      ]);
      setTables(t);
      setConfigs(c);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    }
  }, []);

  const loadSeed = useCallback(async () => {
    // Da bo co che key: vao thang, tai danh sach seek luon.
    try {
      await load();
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (sessionStorage.getItem('username') !== 'Admin') {
      router.push('/admin');
      return;
    }
    setAllowed(true);
    loadSeed();
  }, [router, loadSeed]);

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSnapshot = async () => {
    if (!selectedTable) return;
    setBusy(true);
    try {
      await apiClient.post(`/api/seed/snapshot?table=${selectedTable}`);
      notify(`Đã snapshot bảng ${selectedTable}`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Lỗi snapshot');
    } finally {
      setBusy(false);
    }
  };

  const handleSnapshotAll = async () => {
    setBusy(true);
    try {
      const list = await apiClient.post<SeedConfig[]>('/api/seed/snapshot-all');
      notify(`Đã snapshot ${list.length} bảng có dữ liệu`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Lỗi snapshot');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      const n = await apiClient.post<number>('/api/seed/restore');
      notify(`Đã seek ${n} cấu hình`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Lỗi seek');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (c: SeedConfig) => {
    try {
      await apiClient.patch(`/api/seed/configs/${c.id}/enabled?value=${!c.enabled}`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Lỗi cập nhật');
    }
  };

  const handleDelete = async (c: SeedConfig) => {
    if (!confirm(`Xóa cấu hình seek cho bảng ${c.tableName}?`)) return;
    try {
      await apiClient.delete(`/api/seed/configs/${c.id}`);
      notify(`Đã xóa cấu hình ${c.tableName}`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Lỗi xóa');
    }
  };

  if (!allowed || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
          <Database className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Seek Data</h1>
      </div>
      <p className="text-zinc-400 text-sm mb-8">
        Chọn bảng để lưu dữ liệu mẫu. Khi máy khác kéo code về và chạy, hệ thống tự nạp lại đủ dữ liệu.
      </p>

      {message && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-zinc-800/70 border border-zinc-700 text-sm text-zinc-200">
          {message}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <label className="block text-sm text-zinc-400 mb-2">Chọn bảng</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
          >
            <option value="">-- Chọn bảng --</option>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={handleSnapshot}
            disabled={!selectedTable || busy}
            className="flex items-center justify-center gap-2 bg-white text-zinc-950 font-semibold px-5 py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-zinc-200 transition-colors"
          >
            <Camera className="w-4 h-4" /> Snapshot
          </button>
          <button
            onClick={handleSnapshotAll}
            disabled={busy}
            className="flex items-center justify-center gap-2 border border-zinc-700 text-zinc-200 font-semibold px-5 py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-zinc-800 transition-colors"
          >
            <Layers className="w-4 h-4" /> Snapshot tất cả
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Danh sách seek ({configs.length})</h2>
        <button
          onClick={handleRestore}
          disabled={busy}
          className="flex items-center gap-2 border border-zinc-700 text-zinc-200 px-4 py-2 rounded-xl text-sm hover:bg-zinc-800 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Seek lại
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="px-4 py-3 font-medium">Bảng</th>
                <th className="px-4 py-3 font-medium">Số dòng</th>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Bật</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Chưa có cấu hình seek nào
                  </td>
                </tr>
              ) : (
                configs.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{c.tableName}</td>
                    <td className="px-4 py-3 text-zinc-300">{c.rowCount}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{c.filePath}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          c.enabled
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-700/40 text-zinc-400 border border-zinc-600/40'
                        }`}
                      >
                        {c.enabled ? 'Bật' : 'Tắt'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
