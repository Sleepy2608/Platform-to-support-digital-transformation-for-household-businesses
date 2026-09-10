import { jsPDF } from 'jspdf';
import { BusinessProfileResponse } from '@/app/lib/business-profile';
import { formatBusinessAddress } from '@/app/lib/invoice-format';

export interface SalesInvoiceItem {
  id: number;
  productName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalesInvoiceDetail {
  id: number;
  orderCode: string;
  createdAt: string;
  totalAmount: number;
  customerId?: number;
  items: SalesInvoiceItem[];
  note?: string;
  sellerName?: string;
  paymentMethod?: string;
  discount?: number;
  subtotal?: number;
}

const formatMoney = (val: unknown) => {
  const num = typeof val === 'number' && Number.isFinite(val) ? val : 0;
  return `${num.toLocaleString('vi-VN')} đ`;
};

const formatQuantity = (val: unknown) => {
  const num = typeof val === 'number' && Number.isFinite(val) ? val : 0;
  return num.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
};

const formatDate = (val: string) => {
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return 'Không xác định';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (val: string) => {
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadFont(doc: jsPDF, fontUrl: string, fontName: string, fontStyle: string) {
  try {
    const res = await fetch(fontUrl);
    if (!res.ok) return false;
    const buffer = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const fileName = `${fontName}-${fontStyle}.ttf`;
    doc.addFileToVFS(fileName, base64);
    doc.addFont(fileName, fontName, fontStyle);
    return true;
  } catch {
    return false;
  }
}

export async function downloadSalesInvoicePdf(
  detail: SalesInvoiceDetail,
  profile: BusinessProfileResponse | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const hasRegular = await loadFont(doc, '/fonts/NotoSans-Regular.ttf', 'NotoSans', 'normal');
  const hasBold = await loadFont(doc, '/fonts/NotoSans-Bold.ttf', 'NotoSans', 'bold');
  const fontFamily = hasRegular ? 'NotoSans' : 'helvetica';

  const marginX = 15;
  const pageWidth = 180; // 210 - 30
  let y = 15;

  const setFont = (style: 'normal' | 'bold', size: number) => {
    doc.setFont(fontFamily, hasBold || style === 'normal' ? style : 'normal');
    doc.setFontSize(size);
  };

  const address = formatBusinessAddress(profile);
  const phone = profile?.representative?.phoneNumber?.trim() || '';

  // Title
  setFont('bold', 16);
  doc.text('HÓA ĐƠN BÁN HÀNG', marginX + pageWidth / 2, y, { align: 'center' });
  y += 7;

  // Code & Date & Time (ngày và thời gian được tách riêng, thời gian có label)
  setFont('normal', 9);
  const codeText = `Mã hóa đơn: ${detail.orderCode || 'Không xác định'}`;
  const dateText = `Ngày tạo: ${formatDate(detail.createdAt)}`;
  const timeText = formatTime(detail.createdAt);
  const dateTimeText = timeText ? `${dateText}    Thời gian: ${timeText}` : dateText;
  doc.text(codeText, marginX, y);
  doc.text(dateTimeText, marginX + pageWidth, y, { align: 'right' });
  y += 5;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, marginX + pageWidth, y);
  y += 6;

  // Customer & Seller section
  setFont('bold', 8.5);
  doc.text('KHÁCH HÀNG', marginX, y);
  y += 4.5;

  setFont('normal', 9);
  doc.text(`Mã khách hàng: ${detail.customerId ? `#${detail.customerId}` : 'Khách lẻ'}`, marginX, y);
  if (detail.sellerName?.trim()) {
    doc.text(`Nhân viên bán hàng: ${detail.sellerName.trim()}`, marginX + pageWidth, y, {
      align: 'right',
    });
  }
  y += 4.5;

  if (address) {
    const addressLabel = 'Địa chỉ: ';
    const labelWidth = doc.getTextWidth(addressLabel);
    const splitAddress = doc.splitTextToSize(address, pageWidth - labelWidth);
    doc.text(addressLabel, marginX, y);
    doc.text(splitAddress, marginX + labelWidth, y);
    y += splitAddress.length * 4.5;
  }

  if (phone) {
    doc.text(`Số điện thoại: ${phone}`, marginX, y);
    y += 4.5;
  }

  // Divider
  y += 1.5;
  doc.line(marginX, y, marginX + pageWidth, y);
  y += 6.5;

  // Product Table
  // Columns: STT (12), Sản phẩm (68), ĐVT (20), SL (20), Đơn giá (28), Thành tiền (32)
  const cols = [
    { header: 'STT', width: 12, align: 'center' },
    { header: 'Sản phẩm', width: 68, align: 'left' },
    { header: 'ĐVT', width: 20, align: 'center' },
    { header: 'SL', width: 20, align: 'center' },
    { header: 'Đơn giá', width: 28, align: 'right' },
    { header: 'Thành tiền', width: 32, align: 'right' },
  ];

  // Table Header
  doc.setFillColor(245, 247, 250);
  doc.rect(marginX, y, pageWidth, 7, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(marginX, y, pageWidth, 7, 'S');

  setFont('bold', 9);
  let x = marginX;
  cols.forEach((col) => {
    let textX = x + 2;
    if (col.align === 'center') textX = x + col.width / 2;
    if (col.align === 'right') textX = x + col.width - 2;
    doc.text(col.header, textX, y + 5, { align: col.align as 'left' | 'center' | 'right' });
    x += col.width;
  });
  y += 7;

  // Table Rows
  setFont('normal', 8.5);
  const items = Array.isArray(detail.items) ? detail.items : [];

  items.forEach((item, index) => {
    const productName = item.productName || 'Sản phẩm';
    const splitName = doc.splitTextToSize(productName, cols[1].width - 4);
    const rowHeight = Math.max(7, splitName.length * 4 + 3);

    // Page overflow check
    if (y + rowHeight > 275) {
      doc.addPage();
      y = 15;
    }

    doc.rect(marginX, y, pageWidth, rowHeight, 'S');

    let rowX = marginX;

    // STT
    doc.text(String(index + 1), rowX + cols[0].width / 2, y + 4.5, { align: 'center' });
    rowX += cols[0].width;

    // Sản phẩm
    doc.text(splitName, rowX + 2, y + 4.5);
    rowX += cols[1].width;

    // ĐVT (center)
    doc.text(item.unitName || '—', rowX + cols[2].width / 2, y + 4.5, { align: 'center' });
    rowX += cols[2].width;

    // Số lượng (center)
    doc.text(formatQuantity(item.quantity), rowX + cols[3].width / 2, y + 4.5, { align: 'center' });
    rowX += cols[3].width;

    // Đơn giá
    doc.text(formatMoney(item.unitPrice), rowX + cols[4].width - 2, y + 4.5, { align: 'right' });
    rowX += cols[4].width;

    // Thành tiền
    doc.text(formatMoney(item.lineTotal), rowX + cols[5].width - 2, y + 4.5, { align: 'right' });

    y += rowHeight;
  });

  // Divider
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, marginX + pageWidth, y);
  y += 6;

  // Summary
  const summaryX = marginX + pageWidth - 80;

  if (y + 30 > 275) {
    doc.addPage();
    y = 15;
  }

  setFont('normal', 9);

  // Subtotal
  doc.text('Tổng tiền hàng:', summaryX, y);
  doc.text(formatMoney(detail.subtotal ?? detail.totalAmount), marginX + pageWidth, y, { align: 'right' });
  y += 5;

  // Discount if present
  if (typeof detail.discount === 'number' && Number.isFinite(detail.discount)) {
    doc.text('Giảm giá:', summaryX, y);
    doc.text(formatMoney(detail.discount), marginX + pageWidth, y, { align: 'right' });
    y += 5;
  }

  // Total
  doc.line(summaryX, y, marginX + pageWidth, y);
  y += 4;
  setFont('bold', 11);
  doc.text('Tổng thanh toán:', summaryX, y);
  doc.text(formatMoney(detail.totalAmount), marginX + pageWidth, y, { align: 'right' });
  y += 6;

  // Payment Method if present
  if (detail.paymentMethod?.trim()) {
    setFont('normal', 9);
    doc.text('Phương thức TT:', summaryX, y);
    doc.text(detail.paymentMethod.trim(), marginX + pageWidth, y, { align: 'right' });
    y += 5;
  }

  // Note
  if (detail.note?.trim()) {
    y += 4;
    setFont('normal', 9);
    doc.text(`Ghi chú: ${detail.note.trim()}`, marginX, y);
  }

  const safeCode = (detail.orderCode || 'hoa-don').replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`${safeCode}.pdf`);
}