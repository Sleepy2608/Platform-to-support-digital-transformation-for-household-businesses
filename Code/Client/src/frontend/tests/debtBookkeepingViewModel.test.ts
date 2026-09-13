import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  calculateOrderDebt,
  calculateProjectedCustomerDebt,
  validateOrderCheckout,
  validatePaymentAmount,
  getTransactionTypeMeta,
} from '../app/lib/debtBookkeepingViewModel.ts';

describe('HBDT-66: Tạo đơn hàng và tính toán nợ (POS)', () => {
  test('Khách trả đủ hoặc không nhập số tiền trả: debt = 0, status PAID', () => {
    // Trường hợp không truyền input khách trả (mặc định trả đủ)
    const result1 = calculateOrderDebt(500000);
    assert.equal(result1.totalAmount, 500000);
    assert.equal(result1.paidAmount, 500000);
    assert.equal(result1.debtAmount, 0);
    assert.equal(result1.paymentStatus, 'PAID');
    assert.equal(result1.isPaidInFull, true);
    assert.equal(result1.isPartialPaid, false);
    assert.equal(result1.isUnpaid, false);

    // Trường hợp nhập đúng 500.000
    const result2 = calculateOrderDebt(500000, 500000);
    assert.equal(result2.debtAmount, 0);
    assert.equal(result2.paymentStatus, 'PAID');

    // Validation checkout không cần customerId khi trả đủ
    const validation = validateOrderCheckout(500000, 500000, null);
    assert.equal(validation.valid, true);
  });

  test('Khách mua chịu toàn bộ (paidAmount = 0): debt = totalAmount, status UNPAID', () => {
    const result = calculateOrderDebt(1200000, 0);
    assert.equal(result.totalAmount, 1200000);
    assert.equal(result.paidAmount, 0);
    assert.equal(result.debtAmount, 1200000);
    assert.equal(result.paymentStatus, 'UNPAID');
    assert.equal(result.isUnpaid, true);
    assert.equal(result.isPaidInFull, false);

    // Bắt buộc phải chọn khách hàng khi có công nợ
    const invalidValidation = validateOrderCheckout(1200000, 0, null);
    assert.equal(invalidValidation.valid, false);
    assert.match(invalidValidation.error || '', /bắt buộc phải chọn khách hàng/i);

    // Hợp lệ khi đã chọn khách hàng
    const validValidation = validateOrderCheckout(1200000, 0, 10);
    assert.equal(validValidation.valid, true);
  });

  test('Khách mua chịu một phần (0 < paid < total): debt = total - paid, status PARTIALLY_PAID', () => {
    const result = calculateOrderDebt(1000000, 400000);
    assert.equal(result.totalAmount, 1000000);
    assert.equal(result.paidAmount, 400000);
    assert.equal(result.debtAmount, 600000);
    assert.equal(result.paymentStatus, 'PARTIALLY_PAID');
    assert.equal(result.isPartialPaid, true);

    // Bắt buộc chọn khách hàng
    const invalidValidation = validateOrderCheckout(1000000, 400000, undefined);
    assert.equal(invalidValidation.valid, false);

    const validValidation = validateOrderCheckout(1000000, 400000, 5);
    assert.equal(validValidation.valid, true);
  });

  test('Kiểm tra dữ liệu tiền trả không hợp lệ hoặc vượt quá tổng tiền', () => {
    // Khách trả âm
    const negativeValidation = validateOrderCheckout(500000, -50000, 1);
    assert.equal(negativeValidation.valid, false);
    assert.match(negativeValidation.error || '', /không được nhỏ hơn 0/i);

    // Khách trả vượt tổng tiền đơn
    const excessValidation = validateOrderCheckout(500000, 600000, 1);
    assert.equal(excessValidation.valid, false);
    assert.match(excessValidation.error || '', /không được vượt quá tổng tiền/i);
  });
});

describe('HBDT-66: Thanh toán nợ đơn hàng', () => {
  test('Thanh toán một phần hợp lệ', () => {
    // Đơn nợ 600.000, khách hàng tổng nợ 1.500.000
    // Khách trả 200.000
    const validation = validatePaymentAmount(200000, 600000, 1500000);
    assert.equal(validation.valid, true);
  });

  test('Thanh toán đủ nợ của đơn hàng', () => {
    // Đơn nợ 600.000, khách trả đúng 600.000
    const validation = validatePaymentAmount(600000, 600000, 1500000);
    assert.equal(validation.valid, true);
  });

  test('Từ chối thanh toán số tiền <= 0', () => {
    const zeroValidation = validatePaymentAmount(0, 500000, 500000);
    assert.equal(zeroValidation.valid, false);
    assert.match(zeroValidation.error || '', /phải lớn hơn 0/i);

    const negativeValidation = validatePaymentAmount(-100000, 500000, 500000);
    assert.equal(negativeValidation.valid, false);
    assert.match(negativeValidation.error || '', /phải lớn hơn 0/i);
  });

  test('Từ chối thanh toán vượt quá số nợ còn lại của đơn hàng', () => {
    // Đơn nợ 300.000, cố thanh toán 400.000
    const validation = validatePaymentAmount(400000, 300000, 1000000);
    assert.equal(validation.valid, false);
    assert.match(validation.error || '', /vượt quá số nợ còn lại của đơn/i);
  });

  test('Từ chối thanh toán vượt quá tổng công nợ hiện tại của khách hàng', () => {
    // Đơn ghi nợ 500.000, nhưng số dư công nợ khách hàng hiện chỉ còn 200.000 (do điều chỉnh/đảo nợ)
    const validation = validatePaymentAmount(300000, 500000, 200000);
    assert.equal(validation.valid, false);
    assert.match(validation.error || '', /vượt quá tổng công nợ hiện tại của khách hàng/i);
  });
});

describe('HBDT-66: Dự báo lũy kế số dư công nợ nhiều đơn hàng', () => {
  test('Nhiều đơn cùng 1 khách hàng tăng nợ tuần tự', () => {
    let customerBalance = 0;

    // Đơn 1: Mua chịu 500.000
    const order1 = calculateOrderDebt(500000, 0);
    customerBalance = calculateProjectedCustomerDebt(customerBalance, order1.debtAmount);
    assert.equal(customerBalance, 500000);

    // Đơn 2: Mua chịu 1.000.000, trả trước 300.000 -> nợ phát sinh 700.000
    const order2 = calculateOrderDebt(1000000, 300000);
    customerBalance = calculateProjectedCustomerDebt(customerBalance, order2.debtAmount);
    assert.equal(customerBalance, 1200000);

    // Đơn 3: Mua 800.000, trả đủ 800.000 -> nợ phát sinh 0
    const order3 = calculateOrderDebt(800000, 800000);
    customerBalance = calculateProjectedCustomerDebt(customerBalance, order3.debtAmount);
    assert.equal(customerBalance, 1200000);
  });
});

describe('HBDT-66: Đồng bộ loại giao dịch công nợ (DebtTransactionType)', () => {
  test('DEBT_INCREASE: dấu +, nhãn Phát sinh nợ', () => {
    const meta = getTransactionTypeMeta('DEBT_INCREASE');
    assert.equal(meta.sign, '+');
    assert.equal(meta.label, 'Phát sinh nợ');
    assert.match(meta.badgeClass, /rose/);
  });

  test('PAYMENT: dấu -, nhãn Thanh toán nợ', () => {
    const meta = getTransactionTypeMeta('PAYMENT');
    assert.equal(meta.sign, '-');
    assert.equal(meta.label, 'Thanh toán nợ');
    assert.match(meta.badgeClass, /emerald/);
  });

  test('VOID: dấu -, nhãn Đảo nợ (Hủy đơn)', () => {
    const meta = getTransactionTypeMeta('VOID');
    assert.equal(meta.sign, '-');
    assert.equal(meta.label, 'Đảo nợ (Hủy đơn)');
    assert.match(meta.badgeClass, /amber/);
  });

  test('ADJUSTMENT: dấu ±, nhãn Điều chỉnh nợ', () => {
    const meta = getTransactionTypeMeta('ADJUSTMENT');
    assert.equal(meta.sign, '±');
    assert.equal(meta.label, 'Điều chỉnh nợ');
    assert.match(meta.badgeClass, /blue/);
  });
});
