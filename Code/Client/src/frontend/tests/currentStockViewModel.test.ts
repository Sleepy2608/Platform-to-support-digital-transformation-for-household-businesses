import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  calculateCurrentStockStatistics,
  filterAndSortCurrentStock,
  matchesCurrentStockSearch,
  paginateCurrentStock,
  type CurrentStockListItem,
} from '../app/lib/currentStockViewModel.ts';

function stock(overrides: Partial<CurrentStockListItem> = {}): CurrentStockListItem {
  return {
    productId: 1,
    productCode: 'SP-CA-PHE',
    productName: 'Cà phê rang',
    categoryId: 2,
    categoryName: 'Đồ uống',
    baseUnitId: 3,
    baseUnitName: 'Kilôgam',
    quantityOnHand: 12.5,
    updatedAt: '2026-08-31T09:30:00',
    ...overrides,
  };
}

describe('current stock search and sort', () => {
  test('tìm không dấu theo mã, tên và danh mục', () => {
    const item = stock();
    assert.equal(matchesCurrentStockSearch(item, 'ca phe'), true);
    assert.equal(matchesCurrentStockSearch(item, 'sp-ca'), true);
    assert.equal(matchesCurrentStockSearch(item, 'do uong'), true);
    assert.equal(matchesCurrentStockSearch(item, 'banh keo'), false);
  });

  test('lọc rồi sắp xếp tồn ít nhất', () => {
    const items = [
      stock({ productId: 1, productName: 'Cà phê', quantityOnHand: 12 }),
      stock({ productId: 2, productName: 'Trà', productCode: 'SP-TRA', quantityOnHand: 2 }),
      stock({ productId: 3, productName: 'Bánh', productCode: 'SP-BANH', categoryName: 'Đồ ăn', quantityOnHand: 0 }),
    ];

    assert.deepEqual(
      filterAndSortCurrentStock(items, 'sp-', 'QUANTITY_ASC').map((item) => item.productId),
      [3, 2, 1],
    );
  });
});

describe('current stock statistics', () => {
  test('tính tổng sản phẩm theo trạng thái tồn kho', () => {
    const result = calculateCurrentStockStatistics([
      stock({ productId: 1, quantityOnHand: 2 }),
      stock({ productId: 2, quantityOnHand: 0 }),
      stock({ productId: 3, quantityOnHand: -1 }),
    ]);

    assert.deepEqual(result, {
      totalProducts: 3,
      inStockProducts: 1,
      outOfStockProducts: 2,
    });
  });
});

describe('current stock pagination', () => {
  test('chuẩn hóa trang vượt giới hạn', () => {
    const items = Array.from({ length: 13 }, (_, index) => stock({ productId: index + 1 }));
    const result = paginateCurrentStock(items, 99, 12);
    assert.equal(result.page, 2);
    assert.equal(result.from, 13);
    assert.equal(result.to, 13);
    assert.equal(result.items.length, 1);
  });

  test('danh sách rỗng không tạo chỉ số sai', () => {
    const result = paginateCurrentStock([], 1, 12);
    assert.equal(result.page, 1);
    assert.equal(result.pageCount, 1);
    assert.equal(result.from, 0);
    assert.equal(result.to, 0);
  });
});
