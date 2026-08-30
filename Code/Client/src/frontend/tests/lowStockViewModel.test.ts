import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  calculateLowStockStatistics,
  clampPage,
  filterAndSortAlerts,
  matchesProductSearch,
  normalizeSearchText,
  paginate,
  shortageAmount,
  sortLowStockAlerts,
  stockRatio,
  stockSeverity,
  validateMinimumStock,
  type LowStockListItem,
  type ThresholdListItem,
} from '../app/lib/lowStockViewModel.ts';

function alert(overrides: Partial<LowStockListItem> = {}): LowStockListItem {
  return {
    id: 1,
    productId: 10,
    productCode: 'SP-CA-PHE',
    productName: 'Cà phê rang xay',
    quantityOnHand: 2,
    minimumStock: 10,
    status: 'ACTIVE',
    needsRestock: true,
    triggeredAt: '2026-08-27T08:00:00',
    lastDetectedAt: '2026-08-28T08:00:00',
    resolvedAt: null,
    ...overrides,
  };
}

function threshold(overrides: Partial<ThresholdListItem> = {}): ThresholdListItem {
  return {
    productId: 10,
    productCode: 'SP-CA-PHE',
    productName: 'Cà phê rang xay',
    quantityOnHand: 2,
    minimumStock: 10,
    configured: true,
    lowStock: true,
    ...overrides,
  };
}

describe('normalizeSearchText', () => {
  test('loại bỏ dấu tiếng Việt và chuyển về chữ thường', () => {
    assert.equal(normalizeSearchText('  CÀ PHÊ ĐẶC BIỆT  '), 'ca phe dac biet');
  });

  test('xử lý chuỗi rỗng, null và undefined an toàn', () => {
    assert.equal(normalizeSearchText(''), '');
    assert.equal(normalizeSearchText(null), '');
    assert.equal(normalizeSearchText(undefined), '');
  });

  test('giữ nguyên chữ số và mã sản phẩm', () => {
    assert.equal(normalizeSearchText('SP-001 / Lô 12'), 'sp-001 / lo 12');
  });
});

describe('matchesProductSearch', () => {
  const item = alert();

  test('tìm theo tên không phân biệt dấu', () => {
    assert.equal(matchesProductSearch(item, 'ca phe'), true);
    assert.equal(matchesProductSearch(item, 'CÀ PHÊ'), true);
  });

  test('tìm theo mã không phân biệt hoa thường', () => {
    assert.equal(matchesProductSearch(item, 'sp-ca-phe'), true);
    assert.equal(matchesProductSearch(item, 'SP-CA'), true);
  });

  test('yêu cầu tất cả từ khóa cùng xuất hiện', () => {
    assert.equal(matchesProductSearch(item, 'ca rang'), true);
    assert.equal(matchesProductSearch(item, 'ca sua'), false);
  });

  test('truy vấn rỗng luôn khớp', () => {
    assert.equal(matchesProductSearch(item, '   '), true);
  });
});

describe('stock calculations', () => {
  test('tính lượng thiếu so với ngưỡng', () => {
    assert.equal(shortageAmount(alert({ quantityOnHand: 3, minimumStock: 10 })), 7);
  });

  test('không trả về lượng thiếu âm khi kho đã an toàn', () => {
    assert.equal(shortageAmount(alert({ quantityOnHand: 15, minimumStock: 10 })), 0);
  });

  test('tính tỷ lệ tồn kho trên ngưỡng', () => {
    assert.equal(stockRatio(alert({ quantityOnHand: 4, minimumStock: 10 })), 0.4);
  });

  test('ngưỡng bằng 0 được xem là an toàn', () => {
    assert.equal(stockRatio(alert({ quantityOnHand: 0, minimumStock: 0 })), 1);
  });

  test('số lượng không hợp lệ được quy về 0', () => {
    assert.equal(stockRatio(alert({ quantityOnHand: Number.NaN, minimumStock: 10 })), 0);
  });

  test('phân loại mức rất thấp', () => {
    assert.equal(stockSeverity(alert({ quantityOnHand: 2, minimumStock: 10 })), 'CRITICAL');
  });

  test('phân loại mức sắp hết', () => {
    assert.equal(stockSeverity(alert({ quantityOnHand: 5, minimumStock: 10 })), 'HIGH');
  });

  test('phân loại mức dưới ngưỡng nhẹ', () => {
    assert.equal(stockSeverity(alert({ quantityOnHand: 8, minimumStock: 10 })), 'LOW');
  });

  test('cảnh báo đã đóng luôn có trạng thái resolved', () => {
    assert.equal(stockSeverity(alert({ status: 'RESOLVED' })), 'RESOLVED');
  });
});

describe('sortLowStockAlerts', () => {
  const items = [
    alert({ id: 1, productName: 'Bánh mì', quantityOnHand: 7, minimumStock: 10 }),
    alert({ id: 2, productName: 'Áo sơ mi', quantityOnHand: 1, minimumStock: 20 }),
    alert({ id: 3, productName: 'Cà phê', quantityOnHand: 2, minimumStock: 5 }),
  ];

  test('sắp xếp theo mức thiếu lớn nhất', () => {
    const result = sortLowStockAlerts(items, 'URGENCY');
    assert.deepEqual(result.map((item) => item.id), [2, 3, 1]);
  });

  test('sắp xếp theo thời điểm phát hiện mới nhất', () => {
    const result = sortLowStockAlerts([
      alert({ id: 1, lastDetectedAt: '2026-08-20T08:00:00' }),
      alert({ id: 2, lastDetectedAt: '2026-08-28T08:00:00' }),
      alert({ id: 3, lastDetectedAt: '2026-08-25T08:00:00' }),
    ], 'NEWEST');
    assert.deepEqual(result.map((item) => item.id), [2, 3, 1]);
  });

  test('sắp xếp theo tên tiếng Việt', () => {
    const result = sortLowStockAlerts(items, 'NAME');
    assert.deepEqual(result.map((item) => item.productName), ['Áo sơ mi', 'Bánh mì', 'Cà phê']);
  });

  test('không thay đổi mảng nguồn', () => {
    const before = items.map((item) => item.id);
    sortLowStockAlerts(items, 'URGENCY');
    assert.deepEqual(items.map((item) => item.id), before);
  });

  test('ưu tiên cảnh báo active trước lịch sử resolved', () => {
    const result = sortLowStockAlerts([
      alert({ id: 1, status: 'RESOLVED', quantityOnHand: 0, minimumStock: 100 }),
      alert({ id: 2, status: 'ACTIVE', quantityOnHand: 9, minimumStock: 10 }),
    ], 'URGENCY');
    assert.deepEqual(result.map((item) => item.id), [2, 1]);
  });
});

describe('filterAndSortAlerts', () => {
  test('lọc trước rồi mới sắp xếp', () => {
    const result = filterAndSortAlerts([
      alert({ id: 1, productCode: 'SP-01', productName: 'Cà phê', quantityOnHand: 8 }),
      alert({ id: 2, productCode: 'SP-02', productName: 'Cà phê hòa tan', quantityOnHand: 1 }),
      alert({ id: 3, productCode: 'SP-03', productName: 'Bánh mì', quantityOnHand: 0 }),
    ], 'ca phe', 'URGENCY');
    assert.deepEqual(result.map((item) => item.id), [2, 1]);
  });
});

describe('pagination', () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);

  test('trả đúng trang đầu', () => {
    const result = paginate(items, 1, 9);
    assert.deepEqual(result.items, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.equal(result.pageCount, 3);
    assert.equal(result.from, 1);
    assert.equal(result.to, 9);
  });

  test('trả đúng trang cuối không đủ page size', () => {
    const result = paginate(items, 3, 9);
    assert.deepEqual(result.items, [19, 20, 21, 22, 23]);
    assert.equal(result.from, 19);
    assert.equal(result.to, 23);
  });

  test('kẹp trang vượt giới hạn về trang cuối', () => {
    assert.equal(paginate(items, 99, 9).page, 3);
  });

  test('kẹp trang âm về trang đầu', () => {
    assert.equal(paginate(items, -10, 9).page, 1);
  });

  test('xử lý danh sách rỗng', () => {
    const result = paginate([], 1, 9);
    assert.deepEqual(result.items, []);
    assert.equal(result.page, 1);
    assert.equal(result.pageCount, 1);
    assert.equal(result.from, 0);
    assert.equal(result.to, 0);
  });

  test('page size không hợp lệ được chuẩn hóa', () => {
    assert.equal(paginate(items, 1, 0).pageSize, 1);
  });

  test('clampPage xử lý NaN', () => {
    assert.equal(clampPage(Number.NaN, 4), 1);
  });
});

describe('validateMinimumStock', () => {
  test('chấp nhận số nguyên không âm', () => {
    assert.deepEqual(validateMinimumStock('10'), { valid: true, value: 10, message: '' });
  });

  test('chấp nhận số nguyên tối đa 15 chữ số', () => {
    assert.deepEqual(validateMinimumStock('999999999999999'), { valid: true, value: 999999999999999, message: '' });
  });

  test('từ chối dấu chấm thập phân', () => {
    const result = validateMinimumStock('10.125');
    assert.equal(result.valid, false);
    assert.match(result.message, /số nguyên/i);
  });

  test('từ chối dấu phẩy phân tách', () => {
    const result = validateMinimumStock('5,006');
    assert.equal(result.valid, false);
    assert.match(result.message, /số nguyên/i);
  });

  test('từ chối chuỗi rỗng', () => {
    const result = validateMinimumStock('   ');
    assert.equal(result.valid, false);
    assert.match(result.message, /nhập ngưỡng/i);
  });

  test('từ chối giá trị âm', () => {
    const result = validateMinimumStock('-1');
    assert.equal(result.valid, false);
    assert.match(result.message, /không được âm/i);
  });

  test('từ chối chuỗi không phải số', () => {
    const result = validateMinimumStock('mười');
    assert.equal(result.valid, false);
    assert.match(result.message, /số nguyên/i);
  });

  test('từ chối số vượt giới hạn hệ thống', () => {
    const result = validateMinimumStock('1000000000000000');
    assert.equal(result.valid, false);
    assert.match(result.message, /giới hạn/i);
  });
});

describe('calculateLowStockStatistics', () => {
  test('tính đủ các chỉ số dashboard', () => {
    const alerts = [
      alert({ id: 1, productId: 1, status: 'ACTIVE' }),
      alert({ id: 2, productId: 2, status: 'ACTIVE' }),
      alert({ id: 3, productId: 2, status: 'ACTIVE' }),
      alert({ id: 4, productId: 3, status: 'RESOLVED' }),
    ];
    const thresholds = [
      threshold({ productId: 1, configured: true, lowStock: true }),
      threshold({ productId: 2, configured: true, lowStock: true }),
      threshold({ productId: 3, configured: true, lowStock: false }),
      threshold({ productId: 4, configured: false, lowStock: false }),
    ];
    assert.deepEqual(calculateLowStockStatistics(alerts, thresholds), {
      activeAlerts: 2,
      trackedProducts: 4,
      configuredProducts: 3,
      safeProducts: 1,
      configurationProgress: 75,
    });
  });

  test('dùng danh sách cảnh báo khi Employee không tải thresholds', () => {
    const result = calculateLowStockStatistics([
      alert({ productId: 1 }),
      alert({ id: 2, productId: 1 }),
      alert({ id: 3, productId: 2 }),
    ], []);
    assert.equal(result.trackedProducts, 2);
    assert.equal(result.configurationProgress, 0);
  });

  test('danh sách rỗng không gây chia cho 0', () => {
    assert.deepEqual(calculateLowStockStatistics([], []), {
      activeAlerts: 0,
      trackedProducts: 0,
      configuredProducts: 0,
      safeProducts: 0,
      configurationProgress: 0,
    });
  });
});
