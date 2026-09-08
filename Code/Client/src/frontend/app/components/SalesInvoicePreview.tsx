'use client';

import { useEffect, useState } from 'react';
import { Download, Printer, RefreshCw, X } from 'lucide-react';
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

  const handlePrint = () => {
    window.print();
  };

  const storeName = profile?.store?.storeName || profile?.businessName || 'Cửa hàng';
  const location = address(profile);
  const items = Array.isArray(detail.items) ? detail.items : [];
  const hasDiscount = typeof detail.discount === 'number' && Number.isFinite(detail.discount);
  const hasPayment = Boolean(detail.paymentMethod?.trim());
  const hasSeller = Boolean(detail.sellerName?.trim());

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }

        @media print {
          /* Hide UI elements outside the printable invoice container */
          body * {
            visibility: hidden !important;
          }

          /* Display only the printable invoice section */
          #sales-invoice-print-area,
          #sales-invoice-print-area * {
            visibility: visible !important;
          }

          /* Reset layout for print area */
          #sales-invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Keep the wrapper in the print flow; hide modal chrome and controls */
          .sales-invoice-modal-overlay {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
          }

          .sales-invoice-controls,
          .sales-invoice-loading-indicator {
            display: none !important;
          }

          /* Table print formatting */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Summary block page break handling */
          .sales-invoice-summary-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Text wrapping for long product titles */
          .product-name-cell {
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
        }
      `}</style>

      <div className="sales-invoice-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6 print:p-0 print:bg-transparent print:static">
        <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-slate-100 shadow-2xl print:max-h-none print:overflow-visible print:bg-transparent print:shadow-none print:rounded-none">
          {/* Header Controls */}
          <div className="sales-invoice-controls sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8 print:hidden">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Xem trước</p>
              <h2 className="text-lg font-black text-slate-950">Hóa đơn bán hàng</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-print-invoice"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                title="In hóa đơn"
              >
                <Printer className="h-4 w-4" />
                In hóa đơn
              </button>
              <button
                id="btn-download-pdf"
                disabled={downloading}
                onClick={() => void handleDownloadPdf()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                title="Tải file PDF"
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

          {/* Printable Invoice Container */}
          <article
            id="sales-invoice-print-area"
            className="m-3 rounded-xl bg-white p-5 shadow-sm sm:m-6 sm:p-8 print:m-0 print:p-0 print:shadow-none"
          >
            {/* Header: Store Info */}
            <header className="border-b border-slate-200 pb-6 text-center print:pb-4">
              <p className="text-sm font-black uppercase tracking-wide text-slate-900">{storeName}</p>
              {location && <p className="mt-1 text-xs text-slate-500">{location}</p>}
              {profile?.representative?.phoneNumber && (
                <p className="mt-1 text-xs text-slate-500">SĐT: {profile.representative.phoneNumber}</p>
              )}
              <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950 print:mt-3 print:text-xl">
                HÓA ĐƠN BÁN HÀNG
              </h1>
              <div className="mt-3 flex flex-col justify-center gap-1 text-sm text-slate-500 sm:flex-row sm:gap-6 print:flex-row print:gap-6 print:text-xs">
                <span>
                  Mã hóa đơn: <strong className="text-slate-900">{detail.orderCode || 'Không xác định'}</strong>
                </span>
                <span>
                  Ngày tạo: <strong className="text-slate-900">{dateTime(detail.createdAt)}</strong>
                </span>
              </div>
            </header>

            {/* Customer & Seller Information */}
            <section className="grid gap-3 border-b border-slate-200 py-5 text-sm sm:grid-cols-2 print:py-3 print:grid-cols-2 print:text-xs">
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

            {/* Product Table */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 print:mt-4 print:overflow-visible print:rounded-none print:border print:border-slate-300">
              <table className="w-full min-w-[680px] text-left text-sm print:min-w-full print:text-xs">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 print:bg-slate-100 print:text-slate-700">
                  <tr>
                    <th className="px-3 py-3 text-center print:py-2" style={{ width: '8%' }}>
                      STT
                    </th>
                    <th className="px-3 py-3 print:py-2" style={{ width: '40%' }}>
                      Sản phẩm
                    </th>
                    <th className="px-3 py-3 print:py-2" style={{ width: '12%' }}>
                      ĐVT
                    </th>
                    <th className="px-3 py-3 text-right print:py-2" style={{ width: '12%' }}>
                      Số lượng
                    </th>
                    <th className="px-3 py-3 text-right print:py-2" style={{ width: '14%' }}>
                      Đơn giá
                    </th>
                    <th className="px-3 py-3 text-right print:py-2" style={{ width: '14%' }}>
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {items.map((item, index) => (
                    <tr key={item.id || `${item.productName}-${index}`} className="print:border-b print:border-slate-200">
                      <td className="px-3 py-4 text-center text-slate-500 print:py-2">{index + 1}</td>
                      <td className="product-name-cell px-3 py-4 font-bold text-slate-900 print:py-2">
                        {item.productName || 'Sản phẩm'}
                      </td>
                      <td className="px-3 py-4 text-slate-600 print:py-2">{item.unitName || '—'}</td>
                      <td className="px-3 py-4 text-right print:py-2">{quantity(item.quantity)}</td>
                      <td className="px-3 py-4 text-right print:py-2">{money(item.unitPrice)}</td>
                      <td className="px-3 py-4 text-right font-black print:py-2">{money(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Block */}
            <section className="sales-invoice-summary-block ml-auto mt-6 max-w-md space-y-3 text-sm print:mt-4 print:text-xs">
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
              <div className="flex justify-between gap-6 border-t border-slate-200 pt-3 text-base print:text-sm">
                <span className="font-black text-slate-950">Tổng thanh toán</span>
                <strong className="text-lg font-black text-slate-950 print:text-base">{money(detail.totalAmount)}</strong>
              </div>
              {hasPayment && (
                <div className="flex justify-between gap-6 text-slate-600">
                  <span>Phương thức thanh toán</span>
                  <strong className="text-right text-slate-900">{detail.paymentMethod}</strong>
                </div>
              )}
            </section>

            {/* Note */}
            {detail.note && (
              <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 print:mt-4 print:bg-slate-100 print:p-2 print:text-xs">
                <strong>Ghi chú:</strong> {detail.note}
              </p>
            )}
          </article>

          {profileLoading && (
            <div className="sales-invoice-loading-indicator pb-3 text-center text-xs text-slate-400 print:hidden">
              <RefreshCw className="mr-1 inline h-3 w-3 animate-spin" /> Đang tải thông tin cửa hàng...
            </div>
          )}
        </div>
      </div>
    </>
  );
}
