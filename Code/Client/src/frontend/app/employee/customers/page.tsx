'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, UserCircle, ChevronRight, RefreshCw, Phone, Hash } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/app/lib/apiClient';

interface CustomerOption {
  id: number;
  customerCode: string;
  customerName: string;
  phone: string | null;
}

export default function EmployeeCustomerDirectoryPage() {
  const [keyword, setKeyword] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (q.trim()) params.set('keyword', q.trim());
      setCustomers(await apiClient.get<CustomerOption[]>(`/api/customers/options?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void search(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword, search]);

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Khách hàng</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Tra cứu khách hàng</h1>
          <p className="mt-2 text-sm text-slate-500">Tìm kiếm khách hàng theo tên hoặc số điện thoại để xem lịch sử giao dịch.</p>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nhập tên khách hàng, số điện thoại hoặc mã KH..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
        )}

        {/* Results */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang tìm kiếm...
            </div>
          ) : customers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <UserCircle className="h-10 w-10 opacity-40" />
              <p className="font-semibold">{keyword ? 'Không tìm thấy khách hàng phù hợp' : 'Nhập từ khóa để tìm kiếm'}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {customers.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/employee/customers/${c.id}/purchase-history`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/70 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-black text-sm">
                        {c.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{c.customerName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />{c.customerCode}
                          </span>
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />{c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-slate-700 transition-colors">
                      <span>Xem lịch sử</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {customers.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-xs text-slate-500">
              Hiển thị {customers.length} khách hàng {keyword && `cho "${keyword}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
