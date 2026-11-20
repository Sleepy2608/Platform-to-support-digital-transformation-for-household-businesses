import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  formatCurrency,
  formatQuantity,
  formatDateTime,
  formatDateOnly,
  getTransactionTypeBadge,
  generateLedgerCsv,
  generateSummaryCsv,
  type InventoryLedgerData,
  type InventoryBookkeepingSummary,
} from '../app/lib/inventoryBookkeepingViewModel.ts';

describe('inventoryBookkeepingViewModel formatters', () => {
  test('formatCurrency định dạng tiền VND chính xác', () => {
    assert.match(formatCurrency(500000), /500\.000/);
    assert.equal(formatCurrency(0), '0\u00A0₫');
    assert.equal(formatCurrency(null), '0 ₫');
    assert.equal(formatCurrency(undefined), '0 ₫');
    assert.equal(formatCurrency(NaN), '0 ₫');
  });

  test('formatQuantity định dạng số lượng chính xác', () => {
    assert.equal(formatQuantity(10), '10');
    assert.equal(formatQuantity(12.5), '12,5');
    assert.equal(formatQuantity(0), '0');
    assert.equal(formatQuantity(null), '0');
    assert.equal(formatQuantity(undefined), '0');
  });

  test('formatDateTime định dạng ngày giờ ISO an toàn', () => {
    assert.equal(formatDateTime(null), '—');
    assert.equal(formatDateTime(''), '—');
    assert.equal(formatDateTime('invalid-date'), '—');
    const formatted = formatDateTime('2026-08-31T09:30:00Z');
    assert.notEqual(formatted, '—');
  });

  test('formatDateOnly định dạng ngày an toàn', () => {
    assert.equal(formatDateOnly(null), '—');
    assert.equal(formatDateOnly(''), '—');
    assert.equal(formatDateOnly('invalid-date'), '—');
    const formatted = formatDateOnly('2026-08-31T09:30:00Z');
    assert.notEqual(formatted, '—');
  });

  test('getTransactionTypeBadge trả đúng nhãn và class', () => {
    const stockIn = getTransactionTypeBadge('STOCK_IN');
    assert.equal(stockIn.label, 'Nhập kho');
    assert.match(stockIn.colorClass, /emerald/);

    const stockOut = getTransactionTypeBadge('STOCK_OUT');
    assert.equal(stockOut.label, 'Xuất kho');
    assert.match(stockOut.colorClass, /amber/);

    const cancel = getTransactionTypeBadge('CANCEL_SALE');
    assert.equal(cancel.label, 'Hoàn kho (Hủy đơn)');
    assert.match(cancel.colorClass, /blue/);

    const adj = getTransactionTypeBadge('ADJUSTMENT');
    assert.equal(adj.label, 'Điều chỉnh kiểm kê');
    assert.match(adj.colorClass, /purple/);

    const unknown = getTransactionTypeBadge('OTHER_TYPE');
    assert.equal(unknown.label, 'OTHER_TYPE');
    assert.match(unknown.colorClass, /slate/);
  });
});

describe('generateLedgerCsv (S2-HKD compliance)', () => {
  const sampleLedger: InventoryLedgerData = {
    businessId: 1,
    businessName: 'Cửa hàng Tạp hóa An Bình',
    ownerName: 'Nguyễn Văn A',
    taxCode: '0312345678',
    businessAddress: '123 Đường Số 1, Quận 1, TP.HCM',
    productId: 10,
    productCode: 'SP-GAO-ST25',
    productName: 'Gạo ST25 Thơm Ngon',
    baseUnitId: 2,
    unitName: 'Bao 25kg',
    startDate: '2026-08-01T00:00:00Z',
    endDate: '2026-08-31T23:59:59Z',
    fiscalYear: 2026,
    openingQuantity: 20,
    openingUnitCost: 450000,
    openingAmount: 9000000,
    entries: [
      {
        transactionId: 101,
        transactionType: 'STOCK_IN',
        referenceType: 'STOCK_IMPORT',
        referenceId: 5,
        referenceCode: 'NK-001',
        voucherNo: 'NK-001',
        voucherDate: '2026-08-05T10:00:00Z',
        description: 'Nhập hàng từ nhà cung cấp "Đại Phát"',
        unitName: 'Bao 25kg',
        unitCost: 450000,
        importQuantity: 50,
        importAmount: 22500000,
        exportQuantity: 0,
        exportAmount: 0,
        balanceAfterQuantity: 70,
        balanceAfterValue: 31500000,
        createdAt: '2026-08-05T10:05:00Z',
      },
      {
        transactionId: 102,
        transactionType: 'STOCK_OUT',
        referenceType: 'SALES_ORDER',
        referenceId: 12,
        referenceCode: 'XK-001',
        voucherNo: 'XK-001',
        voucherDate: '2026-08-10T15:00:00Z',
        description: 'Xuất bán lẻ cho khách hàng',
        unitName: 'Bao 25kg',
        unitCost: 450000,
        importQuantity: 0,
        importAmount: 0,
        exportQuantity: 15,
        exportAmount: 6750000,
        balanceAfterQuantity: 55,
        balanceAfterValue: 24750000,
        createdAt: '2026-08-10T15:02:00Z',
      },
    ],
    totalImportQuantity: 50,
    totalImportAmount: 22500000,
    totalExportQuantity: 15,
    totalExportAmount: 6750000,
    netQuantityChange: 35,
    netAmountChange: 15750000,
    closingQuantity: 55,
    closingUnitCost: 450000,
    closingAmount: 24750000,
  };

  test('tạo nội dung CSV với tiêu đề Thông tư 88 và thông tin hộ kinh doanh', () => {
    const csv = generateLedgerCsv(sampleLedger);

    assert.match(csv, /MẪU SỐ S2-HKD/);
    assert.match(csv, /Thông tư số 88\/2021\/TT-BTC/);
    assert.match(csv, /Cửa hàng Tạp hóa An Bình/);
    assert.match(csv, /0312345678/);
    assert.match(csv, /SP-GAO-ST25/);
    assert.match(csv, /Gạo ST25 Thơm Ngon/);
  });

  test('chứa đầy đủ số dư đầu kỳ, dòng giao dịch và số dư cuối kỳ', () => {
    const csv = generateLedgerCsv(sampleLedger);

    assert.match(csv, /Số dư đầu kỳ/);
    assert.match(csv, /NK-001/);
    assert.match(csv, /Nhập hàng từ nhà cung cấp ""Đại Phát""/);
    assert.match(csv, /Cộng phát sinh trong kỳ/);
    assert.match(csv, /Số dư cuối kỳ/);
  });
});

describe('generateSummaryCsv', () => {
  const sampleSummary: InventoryBookkeepingSummary = {
    businessId: 1,
    businessName: 'Cửa hàng An Bình',
    taxCode: '0312345678',
    businessAddress: '123 Đường Số 1',
    startDate: '2026-08-01T00:00:00Z',
    endDate: '2026-08-31T23:59:59Z',
    totalImportQuantity: 100,
    totalImportAmount: 50000000,
    totalExportQuantity: 40,
    totalExportAmount: 20000000,
    totalTransactions: 15,
    productSummaries: [
      {
        productId: 1,
        productCode: 'SP-01',
        productName: 'Sản phẩm "Test"',
        unitName: 'Hộp',
        openingQuantity: 10,
        openingAmount: 1000000,
        importQuantity: 50,
        importAmount: 5000000,
        exportQuantity: 20,
        exportAmount: 2000000,
        closingQuantity: 40,
        closingAmount: 4000000,
      },
    ],
  };

  test('sinh bảng CSV tổng hợp đúng cấu trúc', () => {
    const csv = generateSummaryCsv(sampleSummary);

    assert.match(csv, /BÁO CÁO TỔNG HỢP NHẬP - XUẤT - TỒN/);
    assert.match(csv, /SP-01/);
    assert.match(csv, /Sản phẩm ""Test""/);
    assert.match(csv, /Hộp/);
  });
});
