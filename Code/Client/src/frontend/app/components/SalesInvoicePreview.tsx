'use client';

import { useEffect, useState } from 'react';
import { Download, Printer, RefreshCw, X } from 'lucide-react';
import { getBusinessProfile, BusinessProfileResponse } from '@/app/lib/business-profile';
import { downloadSalesInvoicePdf, SalesInvoiceDetail } from '@/app/lib/sales-invoice-pdf';
import { formatBusinessAddress } from '@/app/lib/invoice-format';

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

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Không xác định';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

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

  const location = formatBusinessAddress(profile);
  const phone = profile?.representative?.phoneNumber?.trim() || '';
  const customerLabel = detail.customerId ? `#${detail.customerId}` : 'Khách lẻ';
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

          /* Only the branch of the DOM that contains the invoice stays in the layout.
             Everything else is removed with display:none — visibility:hidden still takes
             up space and would push extra blank pages into the printout. */
          body > *:not(.sales-invoice-modal-overlay):not(:has(.sales-invoice-modal-overlay)),
          body
            :has(.sales-invoice-modal-overlay)
            > *:not(.sales-invoice-modal-overlay):not(:has(.sales-invoice-modal-overlay)) {
            display: none !important;
          }

          /* Neutralise the wrappers that still contain the invoice
             (min-height: 100vh, padding, flex, scroll container, ...) */
          body :has(.sales-invoice-modal-overlay) {
            display: block !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
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
            white-space: normal !important;
          }
        }
      `}</style>

      <div className="sales-invoice-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6 print:p-0 print:bg-transparent print:static">
        <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-slate-100 shadow-2xl print:max-h-none print:overflow-visible print:bg-transparent print:shadow-none print:rounded-none">
          {/* Header Controls */}
          <div className="sales-invoice-controls sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-8 sm:py-4 print:hidden">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-xs">
                Xem trước
              </p>
              <h2 className="truncate text-base font-black text-slate-950 sm:text-lg">
                Hóa đơn bán hàng
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-print-invoice"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 sm:gap-2 sm:px-4 sm:py-2.5"
                title="In hóa đơn"
              >
                <Printer className="h-4 w-4 shrink-0" />
                <span>In hóa đơn</span>
              </button>
              <button
                id="btn-download-pdf"
                disabled={downloading}
                onClick={() => void handleDownloadPdf()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2.5"
                title="Tải file PDF"
              >
                <Download className={`h-4 w-4 shrink-0 ${downloading ? 'animate-bounce' : ''}`} />
                <span>{downloading ? 'Đang tạo...' : 'Tải PDF'}</span>
              </button>
              <button
                id="close-sales-invoice-preview"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng xem trước"
              >
                <X className="h-5 w-5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <article
            id="sales-invoice-print-area"
            className="m-3 rounded-xl bg-white p-5 shadow-sm sm:m-6 sm:p-8 md:p-10 print:m-0 print:p-0 print:shadow-none"
          >
            {/* ── Invoice title + metadata ── */}
            <header className="text-center">
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-950 sm:text-2xl print:text-lg">
                HÓA ĐƠN BÁN HÀNG
              </h1>

              {/* Invoice code + date + time */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs print:gap-x-5">
                <span className="text-slate-500">
                  Mã hóa đơn:{' '}
                  <strong className="font-bold text-slate-800">
                    {detail.orderCode || 'Không xác định'}
                  </strong>
                </span>
                <span className="hidden text-slate-300 sm:inline print:inline">|</span>
                <span className="text-slate-500">
                  Ngày tạo:{' '}
                  <strong className="font-bold text-slate-800">{formatDate(detail.createdAt)}</strong>
                </span>
                {formatTime(detail.createdAt) && (
                  <>
                    <span className="hidden text-slate-300 sm:inline print:inline">|</span>
                    <span className="text-slate-500">
                      Thời gian:{' '}
                      <strong className="font-bold text-slate-800">{formatTime(detail.createdAt)}</strong>
                    </span>
                  </>
                )}
              </div>
            </header>

            <div className="my-3 border-t border-slate-200 print:my-2.5" />

            {/* ── Customer & Seller Information ── */}
            <section className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 print:grid-cols-2 print:text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Khách hàng
                </p>
                <div className="mt-1 space-y-0.5 leading-relaxed">
                  <p className="text-slate-500">
                    Mã khách hàng:{' '}
                    <strong className="font-semibold text-slate-900">{customerLabel}</strong>
                  </p>
                  {location && (
                    <p className="break-words text-slate-500">
                      Địa chỉ:{' '}
                      <strong className="font-semibold text-slate-900">{location}</strong>
                    </p>
                  )}
                  {phone && (
                    <p className="text-slate-500">
                      Số điện thoại:{' '}
                      <strong className="font-semibold text-slate-900">{phone}</strong>
                    </p>
                  )}
                </div>
              </div>
              {hasSeller && (
                <div className="sm:text-right print:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Nhân viên bán hàng
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 print:text-xs">
                    {detail.sellerName}
                  </p>
                </div>
              )}
            </section>

            <div className="my-3 border-t border-slate-200 print:my-2.5" />

            {/* ── Product Table ── */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 print:overflow-visible print:rounded-none print:border print:border-slate-300">
              <table className="w-full min-w-[620px] table-fixed border-collapse text-sm print:min-w-full print:text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 print:bg-slate-100">
                    <th
                      className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 print:py-2"
                      style={{ width: '7%' }}
                    >
                      STT
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 print:py-2"
                      style={{ width: '39%' }}
                    >
                      Sản phẩm
                    </th>
                    <th
                      className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 print:py-2"
                      style={{ width: '12%' }}
                    >
                      ĐVT
                    </th>
                    <th
                      className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 print:py-2"
                      style={{ width: '12%' }}
                    >
                      Số lượng
                    </th>
                    <th
                      className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 print:py-2"
                      style={{ width: '15%' }}
                    >
                      Đơn giá
                    </th>
                    <th
                      className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 print:py-2"
                      style={{ width: '15%' }}
                    >
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {items.map((item, index) => (
                    <tr
                      key={item.id || `${item.productName}-${index}`}
                      className="transition-colors hover:bg-slate-50/60 print:border-b print:border-slate-200"
                    >
                      {/* STT — center */}
                      <td className="px-3 py-2.5 text-center text-sm text-slate-400 print:py-2 print:text-xs">
                        {index + 1}
                      </td>
                      {/* Product name — left, wraps up to 2 lines, no layout breaking */}
                      <td className="product-name-cell px-3 py-2.5 text-left text-sm font-semibold leading-snug text-slate-900 print:py-2 print:text-xs">
                        <span
                          className="line-clamp-2 break-words"
                          title={item.productName || 'Sản phẩm'}
                        >
                          {item.productName || 'Sản phẩm'}
                        </span>
                      </td>
                      {/* Unit — center */}
                      <td className="px-3 py-2.5 text-center text-sm text-slate-600 print:py-2 print:text-xs">
                        {item.unitName || '—'}
                      </td>
                      {/* Quantity — center */}
                      <td className="px-3 py-2.5 text-center text-sm tabular-nums text-slate-700 print:py-2 print:text-xs">
                        {quantity(item.quantity)}
                      </td>
                      {/* Unit price — right */}
                      <td className="px-3 py-2.5 text-right text-sm tabular-nums text-slate-700 print:py-2 print:text-xs">
                        {money(item.unitPrice)}
                      </td>
                      {/* Line total — right, bold */}
                      <td className="px-3 py-2.5 text-right text-sm font-bold tabular-nums text-slate-900 print:py-2 print:text-xs">
                        {money(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Summary Block ── */}
            <div className="my-3 border-t border-slate-200 print:my-2.5" />

            <div className="flex justify-end">
              <section className="sales-invoice-summary-block w-full max-w-sm space-y-1.5 text-sm sm:mr-2 sm:w-80 md:w-96 print:mr-0 print:text-xs">
                {/* Subtotal */}
                <div className="flex items-center justify-between gap-4 py-1 text-slate-600 print:text-xs">
                  <span>Tổng tiền hàng</span>
                  <span className="text-right font-medium tabular-nums text-slate-800">
                    {money(detail.subtotal ?? detail.totalAmount)}
                  </span>
                </div>

                {/* Discount */}
                {hasDiscount && (
                  <div className="flex items-center justify-between gap-4 py-1 text-slate-600 print:text-xs">
                    <span>Giảm giá</span>
                    <span className="text-right font-medium tabular-nums text-slate-800">
                      {money(detail.discount)}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="my-1 border-t border-slate-200" />

                {/* Grand total — prominent */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <span className="text-sm font-black uppercase tracking-tight text-slate-950 sm:text-base print:text-xs">
                    Tổng thanh toán
                  </span>
                  <span className="text-right text-base font-black tabular-nums text-slate-950 sm:text-lg print:text-sm">
                    {money(detail.totalAmount)}
                  </span>
                </div>

                {/* Payment method */}
                {hasPayment && (
                  <div className="flex items-center justify-between gap-4 pt-0.5 text-xs text-slate-500 print:text-[11px]">
                    <span>Phương thức thanh toán</span>
                    <span className="text-right font-semibold text-slate-700">
                      {detail.paymentMethod}
                    </span>
                  </div>
                )}
              </section>
            </div>

            {/* ── Note ── */}
            {detail.note && (
              <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm leading-relaxed text-slate-600 print:mt-3 print:bg-slate-100 print:px-3 print:py-2 print:text-xs">
                <strong className="font-semibold text-slate-700">Ghi chú:</strong> {detail.note}
              </p>
            )}
          </article>

          {profileLoading && (
            <div className="sales-invoice-loading-indicator pb-3 text-center text-xs text-slate-400 print:hidden">
              <RefreshCw className="mr-1 inline h-3 w-3 animate-spin" /> Đang tải thông tin cửa
              hàng...
            </div>
          )}
        </div>
      </div>
    </>
  );
}
