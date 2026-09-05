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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Lịch sử hóa đơn</h1>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="border rounded p-2"
        >
          <option value="">Tất cả</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
        </select>
        <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="border rounded p-2" />
        <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="border rounded p-2" />
        <button onClick={() => setFilters({status: '', fromDate: '', toDate: ''})} className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded">
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="text-center p-10">Đang tải...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-sm">Không tìm thấy hóa đơn nào.</div>
      ) : (
        <table className="w-full bg-white shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Mã hóa đơn</th>
              <th className="p-4 text-left">Gói</th>
              <th className="p-4 text-left">Số tháng</th>
              <th className="p-4 text-left">Số tiền</th>
              <th className="p-4 text-left">Trạng thái</th>
              <th className="p-4 text-left">Ngày tạo</th>
              <th className="p-4 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t">
                <td className="p-4">{invoice.invoiceCode}</td>
                <td className="p-4">{invoice.planName}</td>
                <td className="p-4">{invoice.duration}</td>
                <td className="p-4">{invoice.totalAmount.toLocaleString()}</td>
                <td className="p-4">{invoice.status}</td>
                <td className="p-4">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <Link href={`/owner/invoices/${invoice.id}`} className="text-blue-600">
                    <Eye size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
