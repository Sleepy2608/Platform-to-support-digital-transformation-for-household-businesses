'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/apiClient';
import { ServiceInvoiceResponse } from '../../lib/invoice-types';
import { RotateCcw, Eye } from 'lucide-react';

export default function InvoiceHistoryPage() {
  const [invoices, setInvoices] = useState<ServiceInvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: '', fromDate: '', toDate: '' });

  const fetchInvoices = useCallback(async () => {
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      
      const query = new URLSearchParams(params).toString();
      const data = await apiClient.get<ServiceInvoiceResponse[]>(`/api/owner/invoices${query ? `?${query}` : ''}`);
      setInvoices(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (active) await fetchInvoices();
    })();
    return () => { active = false; };
  }, [fetchInvoices]);

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none" style={{ userSelect: 'none' }}>
              Lịch sử hóa đơn
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none" style={{ userSelect: 'none' }}>
              Tra cứu các hóa đơn thanh toán dịch vụ và gói đăng ký tài khoản
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              Hóa đơn
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ thanh toán (PENDING)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
          </select>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Từ:</span>
            <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Đến:</span>
            <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10" />
          </div>
          <button onClick={() => setFilters({status: '', fromDate: '', toDate: ''})} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs">
            <RotateCcw size={14} /> Đặt lại
          </button>
        </div>

        {error && (
          <div className="p-4 border rounded-xl text-xs sm:text-sm font-medium bg-rose-50 border-rose-200 text-rose-800">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">Đang tải...</div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-slate-400">Không tìm thấy hóa đơn nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Mã hóa đơn</th>
                    <th className="px-5 py-3.5">Gói dịch vụ</th>
                    <th className="px-5 py-3.5">Số tháng</th>
                    <th className="px-5 py-3.5">Số tiền</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Ngày tạo</th>
                    <th className="px-5 py-3.5 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 text-xs">{invoice.invoiceCode}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{invoice.planName}</td>
                      <td className="px-5 py-4 text-slate-600">{invoice.duration} tháng</td>
                      <td className="px-5 py-4 font-black text-slate-900">{invoice.totalAmount.toLocaleString('vi-VN')} đ</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                          invoice.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/owner/invoices/${invoice.id}`} className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs" title="Xem chi tiết">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
