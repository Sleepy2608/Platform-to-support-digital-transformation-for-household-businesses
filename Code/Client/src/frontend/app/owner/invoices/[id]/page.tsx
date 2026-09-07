'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Receipt, Loader2, AlertCircle } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin mb-3" />
        <span className="text-slate-500 text-sm font-medium">Đang tải thông tin hóa đơn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-5 border rounded-2xl text-sm font-medium flex items-center gap-3 bg-rose-50 border-rose-200 text-rose-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Link href="/owner/invoices" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách hóa đơn
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-6 text-center py-20">
          <p className="text-slate-500">Không tìm thấy hóa đơn.</p>
          <Link href="/owner/invoices" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách hóa đơn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-4">
            <Link
              href="/owner/invoices"
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none" style={{ userSelect: 'none' }}>
                Hóa đơn {invoice.invoiceCode}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none" style={{ userSelect: 'none' }}>
                Chi tiết thanh toán dịch vụ và tải về hóa đơn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              Hóa đơn
            </span>
            <button 
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Tải hóa đơn PDF
            </button>
          </div>
        </div>

        {/* Invoice Details Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Section Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200/80 shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 select-none" style={{ userSelect: 'none' }}>
                Thông tin thanh toán
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 select-none" style={{ userSelect: 'none' }}>
                Giao dịch ngày {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gói dịch vụ</p>
              <p className="text-base font-bold text-slate-900 mt-1">{invoice.planName}</p>
            </div>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Thời hạn sử dụng</p>
              <p className="text-base font-bold text-slate-900 mt-1">{invoice.duration} tháng</p>
            </div>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đơn giá</p>
              <p className="text-base font-bold text-slate-900 mt-1">{invoice.unitPrice.toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái thanh toán</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                  invoice.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Total Amount Box */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Tổng tiền thanh toán</p>
              <p className="text-xs text-slate-300 mt-0.5">Đã bao gồm VAT nếu có</p>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {invoice.totalAmount.toLocaleString('vi-VN')} đ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
