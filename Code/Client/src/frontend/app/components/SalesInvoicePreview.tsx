'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { getBusinessProfile, BusinessProfileResponse } from '@/app/lib/business-profile';
import { downloadSalesInvoicePdf, SalesInvoiceDetail } from '@/app/lib/sales-invoice-pdf';

interface Props {
  detail: SalesInvoiceDetail;
  onClose: () => void;
}

const money = (value: unknown) => {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${number.toLocaleString('vi-VN')} ₫`;
};

const quantity = (value: unknown) => {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return number.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
};

const dateTime = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Không xác định'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
};

function address(profile: BusinessProfileResponse | null) {
  if (!profile) return '';
  return [profile.detailAddress, profile.wardName, profile.districtName, profile.provinceName]
    .filter(Boolean)
    .join(', ');
}

export default function SalesInvoicePreview({ detail, onClose }: Props) {
  const [profile, setProfile] = useState<BusinessProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getBusinessProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadSalesInvoicePdf(detail, profile);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const storeName = profile?.store?.storeName || profile?.businessName || 'Cửa hàng';
  const location = address(profile);
  const items = Array.isArray(detail.items) ? detail.items : [];
  const hasDiscount = typeof detail.discount === 'number' && Number.isFinite(detail.discount);
  const hasPayment = Boolean(detail.paymentMethod?.trim());
  const hasSeller = Boolean(detail.sellerName?.trim());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-slate-100 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Xem trước</p>
            <h2 className="text-lg font-black text-slate-950">Hóa đơn bán hàng</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-download-pdf"
              disabled={downloading}
              onClick={() => void handleDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${downloading ? 'animate-bounce' : ''}`} />
              {downloading ? 'Đang tạo PDF...' : 'Tải PDF'}
            </button>
            <button
              id="close-sales-invoice-preview"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng xem trước"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <article className="m-3 rounded-xl bg-white p-5 shadow-sm sm:m-6 sm:p-8">
          <header className="border-b border-slate-200 pb-6 text-center">
            <p className="text-sm font-black uppercase tracking-wide text-slate-900">{storeName}</p>
            {location && <p className="mt-1 text-xs text-slate-500">{location}</p>}
            {profile?.representative?.phoneNumber && (
              <p className="mt-1 text-xs text-slate-500">SĐT: {profile.representative.phoneNumber}</p>
            )}
            <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">HÓA ĐƠN BÁN HÀNG</h1>
            <div className="mt-3 flex flex-col justify-center gap-1 text-sm text-slate-500 sm:flex-row sm:gap-6">
              <span>
                Mã hóa đơn: <strong className="text-slate-900">{detail.orderCode || 'Không xác định'}</strong>
              </span>
              <span>
                Ngày tạo: <strong className="text-slate-900">{dateTime(detail.createdAt)}</strong>
              </span>
            </div>
          </header>

          <section className="grid gap-3 border-b border-slate-200 py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Khách hàng</p>
              <p className="mt-1 font-bold text-slate-900">
                {detail.customerId ? `Khách hàng #${detail.customerId}` : 'Khách lẻ'}
              </p>
            </div>
            {hasSeller && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Nhân viên bán hàng</p>
                <p className="mt-1 font-bold text-slate-900">{detail.sellerName}</p>
              </div>
            )}
          </section>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-center">STT</th>
                  <th className="px-3 py-3">Sản phẩm</th>
                  <th className="px-3 py-3">ĐVT</th>
                  <th className="px-3 py-3 text-right">Số lượng</th>
                  <th className="px-3 py-3 text-right">Đơn giá</th>
                  <th className="px-3 py-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id || `${item.productName}-${index}`}>
                    <td className="px-3 py-4 text-center text-slate-500">{index + 1}</td>
                    <td className="px-3 py-4 font-bold text-slate-900">{item.productName || 'Sản phẩm'}</td>
                    <td className="px-3 py-4 text-slate-600">{item.unitName || '—'}</td>
                    <td className="px-3 py-4 text-right">{quantity(item.quantity)}</td>
                    <td className="px-3 py-4 text-right">{money(item.unitPrice)}</td>
                    <td className="px-3 py-4 text-right font-black">{money(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="ml-auto mt-6 max-w-md space-y-3 text-sm">
            <div className="flex justify-between gap-6 text-slate-600">
              <span>Tổng tiền hàng</span>
              <strong className="text-slate-900">{money(detail.subtotal ?? detail.totalAmount)}</strong>
            </div>
            {hasDiscount && (
              <div className="flex justify-between gap-6 text-slate-600">
                <span>Giảm giá</span>
                <strong className="text-slate-900">{money(detail.discount)}</strong>
              </div>
            )}
            <div className="flex justify-between gap-6 border-t border-slate-200 pt-3 text-base">
              <span className="font-black text-slate-950">Tổng thanh toán</span>
              <strong className="text-lg font-black text-slate-950">{money(detail.totalAmount)}</strong>
            </div>
            {hasPayment && (
              <div className="flex justify-between gap-6 text-slate-600">
                <span>Phương thức thanh toán</span>
                <strong className="text-right text-slate-900">{detail.paymentMethod}</strong>
              </div>
            )}
          </section>

          {detail.note && (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <strong>Ghi chú:</strong> {detail.note}
            </p>
          )}
        </article>
        {profileLoading && (
          <div className="pb-3 text-center text-xs text-slate-400">
            <RefreshCw className="mr-1 inline h-3 w-3 animate-spin" /> Đang tải thông tin cửa hàng...
          </div>
        )}
      </div>
    </div>
  );
}