'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../lib/apiClient';
import { ServiceInvoiceResponse } from '../../../lib/invoice-types';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<ServiceInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get<ServiceInvoiceResponse>(`/api/owner/invoices/${id}`)
      .then(setInvoice)
      .catch((err) => {
          if (err instanceof Error && err.message.includes('404')) {
              setError('Không tìm thấy hóa đơn.');
          } else {
              setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
          }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!invoice) return <div className="p-6">Không tìm thấy hóa đơn.</div>;

  const handleDownload = async () => {
    try {
      setError(null);
      const data = await apiClient.get<Blob>(`/api/owner/invoices/${id}/download`, { responseType: 'blob' });
      const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice?.invoiceCode || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải hóa đơn. Vui lòng thử lại.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Link href="/owner/invoices" className="text-blue-600">&larr; Quay lại danh sách</Link>
        <button 
          onClick={handleDownload}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Tải hóa đơn
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Chi tiết hóa đơn {invoice.invoiceCode}</h1>
      <div className="space-y-3">
        <p><strong>Gói:</strong> {invoice.planName}</p>
        <p><strong>Số tháng:</strong> {invoice.duration}</p>
        <p><strong>Đơn giá:</strong> {invoice.unitPrice.toLocaleString('vi-VN', {style: 'currency', currency: 'VND'})}</p>
        <p><strong>Tổng tiền:</strong> {invoice.totalAmount.toLocaleString('vi-VN', {style: 'currency', currency: 'VND'})}</p>
        <p><strong>Trạng thái:</strong> <span className={`px-2 py-1 rounded text-sm ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{invoice.status}</span></p>
        <p><strong>Ngày tạo:</strong> {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</p>
      </div>
    </div>
  );
}
