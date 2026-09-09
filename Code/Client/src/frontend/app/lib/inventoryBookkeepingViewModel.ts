export interface InventoryTransactionItem {
  transactionId: number;
  productId: number;
  productName: string;
  productCode: string;
  transactionType: string;
  referenceType: string;
  referenceId: number;
  referenceCode?: string;
  enteredQuantity: number;
  baseQuantity: number;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  unitName: string;
  unitCost: number;
  transactionValue: number;
  note: string;
  createdByName: string;
  createdAt: string;
}

export interface InventoryLedgerEntry {
  transactionId: number;
  transactionType: string;
  referenceType: string;
  referenceId: number;
  referenceCode?: string;
  voucherNo: string;
  voucherDate: string;
  description: string;
  unitName: string;
  unitCost: number;
  importQuantity: number;
  importAmount: number;
  exportQuantity: number;
  exportAmount: number;
  balanceAfterQuantity: number;
  balanceAfterValue: number;
  createdAt: string;
}

export interface InventoryLedgerData {
  businessId: number;
  businessName: string;
  ownerName: string;
  taxCode: string;
  businessAddress: string;
  productId: number;
  productCode: string;
  productName: string;
  baseUnitId: number;
  unitName: string;
  startDate: string;
  endDate: string;
  fiscalYear: number;
  openingQuantity: number;
  openingUnitCost: number;
  openingAmount: number;
  entries: InventoryLedgerEntry[];
  totalImportQuantity: number;
  totalImportAmount: number;
  totalExportQuantity: number;
  totalExportAmount: number;
  netQuantityChange: number;
  netAmountChange: number;
  closingQuantity: number;
  closingUnitCost: number;
  closingAmount: number;
}

export interface InventoryProductSummary {
  productId: number;
  productCode: string;
  productName: string;
  unitName: string;
  openingQuantity: number;
  openingAmount: number;
  importQuantity: number;
  importAmount: number;
  exportQuantity: number;
  exportAmount: number;
  closingQuantity: number;
  closingAmount: number;
}

export interface InventoryBookkeepingSummary {
  businessId: number;
  businessName: string;
  taxCode: string;
  businessAddress: string;
  startDate: string;
  endDate: string;
  totalImportQuantity: number;
  totalImportAmount: number;
  totalExportQuantity: number;
  totalExportAmount: number;
  totalTransactions: number;
  productSummaries: InventoryProductSummary[];
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const quantityFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 3,
});

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return currencyFormatter.format(amount);
}

export function formatQuantity(qty: number | null | undefined): string {
  if (qty === null || qty === undefined || isNaN(qty)) return '0';
  return quantityFormatter.format(qty);
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatDateOnly(isoString?: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
  }).format(date);
}

export function getTransactionTypeBadge(type: string): { label: string; colorClass: string } {
  switch (type) {
    case 'STOCK_IN':
      return { label: 'Nhập kho', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'STOCK_OUT':
      return { label: 'Xuất kho', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'CANCEL_SALE':
      return { label: 'Hoàn kho (Hủy đơn)', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'ADJUSTMENT':
      return { label: 'Điều chỉnh kiểm kê', colorClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    default:
      return { label: type, colorClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

/**
 * Tạo và tải xuống file CSV chuẩn UTF-8 BOM cho Excel
 */
export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Tạo nội dung CSV cho Sổ kho chi tiết S2-HKD
 */
export function generateLedgerCsv(ledger: InventoryLedgerData): string {
  const lines: string[] = [];
  lines.push(`"MẪU SỐ S2-HKD: SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA"`);
  lines.push(`"(Ban hành kèm theo Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ trưởng Bộ Tài chính)"`);
  lines.push(`"Hộ kinh doanh:","${ledger.businessName || ''}"`);
  lines.push(`"Địa chỉ:","${ledger.businessAddress || ''}"`);
  lines.push(`"Mã số thuế:","${ledger.taxCode || ''}"`);
  lines.push(`"Tên sản phẩm:","${ledger.productName || ''}"`);
  lines.push(`"Mã sản phẩm:","${ledger.productCode || ''}"`);
  lines.push(`"Đơn vị tính:","${ledger.unitName || ''}"`);
  lines.push(`"Kỳ báo cáo:","${formatDateOnly(ledger.startDate)} đến ${formatDateOnly(ledger.endDate)}"`);
  lines.push('');

  // Headers
  lines.push([
    '"Số chứng từ"',
    '"Ngày chứng từ"',
    '"Diễn giải"',
    '"ĐVT"',
    '"Đơn giá"',
    '"Nhập - Số lượng"',
    '"Nhập - Thành tiền"',
    '"Xuất - Số lượng"',
    '"Xuất - Thành tiền"',
    '"Tồn - Số lượng"',
    '"Tồn - Thành tiền"',
  ].join(','));

  // Opening balance row
  lines.push([
    '""',
    '""',
    '"Số dư đầu kỳ"',
    `"${ledger.unitName || ''}"`,
    `"${ledger.openingUnitCost || 0}"`,
    '""',
    '""',
    '""',
    '""',
    `"${ledger.openingQuantity || 0}"`,
    `"${ledger.openingAmount || 0}"`,
  ].join(','));

  // Entries
  for (const entry of ledger.entries) {
    lines.push([
      `"${entry.referenceCode || entry.voucherNo || ''}"`,
      `"${formatDateOnly(entry.voucherDate)}"`,
      `"${(entry.description || '').replace(/"/g, '""')}"`,
      `"${entry.unitName || ''}"`,
      `"${entry.unitCost || 0}"`,
      `"${entry.importQuantity || 0}"`,
      `"${entry.importAmount || 0}"`,
      `"${entry.exportQuantity || 0}"`,
      `"${entry.exportAmount || 0}"`,
      `"${entry.balanceAfterQuantity || 0}"`,
      `"${entry.balanceAfterValue || 0}"`,
    ].join(','));
  }

  // Total row
  lines.push([
    '""',
    '""',
    '"Cộng phát sinh trong kỳ"',
    '""',
    '""',
    `"${ledger.totalImportQuantity || 0}"`,
    `"${ledger.totalImportAmount || 0}"`,
    `"${ledger.totalExportQuantity || 0}"`,
    `"${ledger.totalExportAmount || 0}"`,
    '""',
    '""',
  ].join(','));

  // Closing balance row
  lines.push([
    '""',
    '""',
    '"Số dư cuối kỳ"',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    `"${ledger.closingQuantity || 0}"`,
    `"${ledger.closingAmount || 0}"`,
  ].join(','));

  return lines.join('\r\n');
}

/**
 * Tạo nội dung CSV cho Bảng tổng hợp nhập xuất tồn
 */
export function generateSummaryCsv(summary: InventoryBookkeepingSummary): string {
  const lines: string[] = [];
  lines.push(`"BÁO CÁO TỔNG HỢP NHẬP - XUẤT - TỒN KHO HÀNG HÓA (MẪU S2-HKD)"`);
  lines.push(`"Hộ kinh doanh:","${summary.businessName || ''}"`);
  lines.push(`"Mã số thuế:","${summary.taxCode || ''}"`);
  lines.push(`"Địa chỉ:","${summary.businessAddress || ''}"`);
  lines.push(`"Kỳ báo cáo:","${formatDateOnly(summary.startDate)} đến ${formatDateOnly(summary.endDate)}"`);
  lines.push('');

  lines.push([
    '"STT"',
    '"Mã sản phẩm"',
    '"Tên sản phẩm"',
    '"ĐVT"',
    '"Đầu kỳ - SL"',
    '"Đầu kỳ - Tiền"',
    '"Nhập kỳ - SL"',
    '"Nhập kỳ - Tiền"',
    '"Xuất kỳ - SL"',
    '"Xuất kỳ - Tiền"',
    '"Cuối kỳ - SL"',
    '"Cuối kỳ - Tiền"',
  ].join(','));

  summary.productSummaries.forEach((p, index) => {
    lines.push([
      `"${index + 1}"`,
      `"${p.productCode || ''}"`,
      `"${(p.productName || '').replace(/"/g, '""')}"`,
      `"${p.unitName || ''}"`,
      `"${p.openingQuantity || 0}"`,
      `"${p.openingAmount || 0}"`,
      `"${p.importQuantity || 0}"`,
      `"${p.importAmount || 0}"`,
      `"${p.exportQuantity || 0}"`,
      `"${p.exportAmount || 0}"`,
      `"${p.closingQuantity || 0}"`,
      `"${p.closingAmount || 0}"`,
    ].join(','));
  });

  return lines.join('\r\n');
}
