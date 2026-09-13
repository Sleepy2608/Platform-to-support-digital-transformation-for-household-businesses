import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  calculateBaseQuantity,
  previewStockAdjustment,
  validateAdjustmentForm,
} from '../app/lib/inventoryAdjustmentViewModel.ts';

describe('inventoryAdjustmentViewModel', () => {
  describe('calculateBaseQuantity', () => {
    test('tính quy đổi với conversion rate chuẩn', () => {
      assert.equal(calculateBaseQuantity(10, 1), 10);
      assert.equal(calculateBaseQuantity(2, 24), 48);
      assert.equal(calculateBaseQuantity(1.5, 10), 15);
    });

    test('xử lý số âm hoặc không hợp lệ', () => {
      assert.equal(calculateBaseQuantity(-5, 10), 0);
      assert.equal(calculateBaseQuantity(0, 10), 0);
    });
  });

  describe('previewStockAdjustment', () => {
    test('SET: đặt lại tồn thực tế', () => {
      // Tồn hiện tại 50, kiểm kê thực tế 40 (đơn vị cơ sở rate 1)
      const res = previewStockAdjustment(50, 40, 1, 'SET');
      assert.equal(res.isValid, true);
      assert.equal(res.balanceBefore, 50);
      assert.equal(res.quantityChange, -10);
      assert.equal(res.balanceAfter, 40);
    });

    test('SET: đặt lại tồn thực tế với đơn vị quy đổi (1 Thùng = 12 Hộp)', () => {
      // Tồn hiện tại 100 Hộp, thực tế đếm 10 Thùng (= 120 Hộp)
      const res = previewStockAdjustment(100, 10, 12, 'SET');
      assert.equal(res.isValid, true);
      assert.equal(res.baseQuantity, 120);
      assert.equal(res.quantityChange, 20);
      assert.equal(res.balanceAfter, 120);
    });

    test('INCREASE: tăng thêm tồn kho', () => {
      // Tồn hiện tại 20, tăng thêm 5
      const res = previewStockAdjustment(20, 5, 1, 'INCREASE');
      assert.equal(res.isValid, true);
      assert.equal(res.balanceBefore, 20);
      assert.equal(res.quantityChange, 5);
      assert.equal(res.balanceAfter, 25);
    });

    test('DECREASE: giảm bớt tồn kho hợp lệ', () => {
      // Tồn hiện tại 20, giảm 5
      const res = previewStockAdjustment(20, 5, 1, 'DECREASE');
      assert.equal(res.isValid, true);
      assert.equal(res.balanceBefore, 20);
      assert.equal(res.quantityChange, -5);
      assert.equal(res.balanceAfter, 15);
    });

    test('DECREASE: chặn tồn âm khi giảm quá số lượng hiện có', () => {
      // Tồn hiện tại 10, giảm 15
      const res = previewStockAdjustment(10, 15, 1, 'DECREASE');
      assert.equal(res.isValid, false);
      assert.equal(res.balanceAfter, -5);
      assert.match(res.errorMessage || '', /không thể nhỏ hơn 0/);
    });

    test('chặn số lượng nhập âm', () => {
      const res = previewStockAdjustment(10, -2, 1, 'SET');
      assert.equal(res.isValid, false);
      assert.match(res.errorMessage || '', /không thể nhỏ hơn 0/);
    });
  });

  describe('validateAdjustmentForm', () => {
    test('hợp lệ khi đủ thông tin', () => {
      const preview = previewStockAdjustment(10, 12, 1, 'SET');
      const val = validateAdjustmentForm(1, 1, 12, 'Kiểm kê định kỳ tháng 9', preview);
      assert.equal(val.isValid, true);
    });

    test('lỗi khi thiếu lý do', () => {
      const preview = previewStockAdjustment(10, 12, 1, 'SET');
      const val = validateAdjustmentForm(1, 1, 12, '   ', preview);
      assert.equal(val.isValid, false);
      assert.match(val.error || '', /Lý do/);
    });

    test('lỗi khi lý do vượt quá 500 ký tự', () => {
      const preview = previewStockAdjustment(10, 12, 1, 'SET');
      const val = validateAdjustmentForm(1, 1, 12, 'a'.repeat(501), preview);
      assert.equal(val.isValid, false);
      assert.match(val.error || '', /500 ký tự/);
    });

    test('lỗi khi preview không hợp lệ (tồn âm)', () => {
      const preview = previewStockAdjustment(5, 10, 1, 'DECREASE');
      const val = validateAdjustmentForm(1, 1, 10, 'Hỏng vỡ', preview);
      assert.equal(val.isValid, false);
    });
  });
});
