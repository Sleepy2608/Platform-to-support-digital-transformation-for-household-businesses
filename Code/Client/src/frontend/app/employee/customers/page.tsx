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
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none" style={{ userSelect: 'none' }}>
              Tra cứu khách hàng
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none" style={{ userSelect: 'none' }}>
              Tìm kiếm khách hàng theo tên hoặc số điện thoại để xem lịch sử giao dịch
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              Khách hàng
            </span>
          </div>
        </div>

        {/* Main Section Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">

          {/* Section Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200/80 shadow-2xs">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 select-none" style={{ userSelect: 'none', cursor: 'default' }}>
                Danh sách khách hàng
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 select-none" style={{ userSelect: 'none' }}>
                Tìm kiếm và chọn khách hàng để xem thông tin lịch sử mua hàng
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập tên khách hàng, số điện thoại hoặc mã KH..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
            />
          </div>

          {error && (
            <div className="p-4 border rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5 bg-rose-50 border-rose-200 text-rose-800">
              <span>{error}</span>
            </div>
          )}

          {/* Results List Box */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
            {loading ? (
              <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500 font-medium">
                <RefreshCw className="h-4 w-4 animate-spin" /> Đang tìm kiếm...
              </div>
            ) : customers.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
                <UserCircle className="h-10 w-10 opacity-40" />
                <p className="font-semibold text-sm">{keyword ? 'Không tìm thấy khách hàng phù hợp' : 'Nhập từ khóa để tìm kiếm'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/employee/customers/${c.id}/purchase-history`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80 font-bold text-sm shadow-2xs">
                          {c.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{c.customerName}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-slate-400" />{c.customerCode}
                            </span>
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />{c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                        <span>Xem lịch sử</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {customers.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Hiển thị {customers.length} khách hàng {keyword && `cho "${keyword}"`}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
