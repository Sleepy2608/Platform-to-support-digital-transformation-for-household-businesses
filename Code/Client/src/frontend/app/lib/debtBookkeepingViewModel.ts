/**
 * debtBookkeepingViewModel.ts
 * Logic tính toán công nợ, kiểm tra hợp lệ, định dạng và dự báo số dư cho POS và quản lý công nợ.
 */

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type DebtTransactionType = 'DEBT_INCREASE' | 'PAYMENT' | 'ADJUSTMENT' | 'VOID';

export interface OrderDebtCalculation {
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: PaymentStatus;
  isPaidInFull: boolean;
  isPartialPaid: boolean;
  isUnpaid: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface TransactionTypeMeta {
  label: string;
  sign: '+' | '-' | '±';
  badgeClass: string;
  textClass: string;
  description: string;
}

/**
 * Tính toán phân tách số tiền đã trả và số nợ của đơn hàng.
 * Nếu paidInput rỗng, mặc định là trả đủ (paidAmount = totalAmount).
 */
export function calculateOrderDebt(
  totalAmount: number,
  paidInput?: string | number | null,
): OrderDebtCalculation {
  const roundedTotal = Math.max(0, Math.round(Number(totalAmount) || 0));

  let paid: number;
  if (paidInput === undefined || paidInput === null || (typeof paidInput === 'string' && paidInput.trim() === '')) {
    paid = roundedTotal;
  } else {
    const rawNum = typeof paidInput === 'string' ? Number(paidInput.replace(/\D/g, '')) : Number(paidInput);
    paid = Number.isFinite(rawNum) ? Math.round(rawNum) : Number.NaN;
  }

  const effectivePaid = Number.isFinite(paid) ? Math.max(0, paid) : 0;
  const debtAmount = Math.max(0, roundedTotal - effectivePaid);

  let paymentStatus: PaymentStatus = 'UNPAID';
  if (effectivePaid >= roundedTotal && roundedTotal > 0) {
    paymentStatus = 'PAID';
  } else if (effectivePaid > 0 && debtAmount > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  } else if (roundedTotal === 0) {
    paymentStatus = 'PAID';
  }

  return {
    totalAmount: roundedTotal,
    paidAmount: effectivePaid,
    debtAmount,
    paymentStatus,
    isPaidInFull: paymentStatus === 'PAID',
    isPartialPaid: paymentStatus === 'PARTIALLY_PAID',
    isUnpaid: paymentStatus === 'UNPAID',
  };
}

/**
 * Dự báo số dư công nợ của khách hàng sau khi tạo đơn hàng mới.
 */
export function calculateProjectedCustomerDebt(
  currentBalance: number,
  newOrderDebtAmount: number,
): number {
  const curr = Math.max(0, Math.round(Number(currentBalance) || 0));
  const newDebt = Math.max(0, Math.round(Number(newOrderDebtAmount) || 0));
  return curr + newDebt;
}

/**
 * Kiểm tra tính hợp lệ khi tạo đơn hàng có công nợ (HBDT-66).
 */
export function validateOrderCheckout(
  totalAmount: number,
  paidAmount: number,
  customerId?: number | null,
): ValidationResult {
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    return { valid: false, error: 'Tổng tiền đơn hàng không hợp lệ' };
  }
  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    return { valid: false, error: 'Số tiền khách trả không được nhỏ hơn 0' };
  }
  if (paidAmount > totalAmount) {
    return {
      valid: false,
      error: 'Số tiền thanh toán ghi nhận vào đơn không được vượt quá tổng tiền đơn hàng',
    };
  }

  const debt = totalAmount - paidAmount;
  if (debt > 0 && (!customerId || customerId <= 0)) {
    return {
      valid: false,
      error: 'Đơn hàng còn nợ bắt buộc phải chọn khách hàng cụ thể để ghi nhận công nợ',
    };
  }

  return { valid: true };
}

/**
 * Kiểm tra tính hợp lệ khi ghi nhận thanh toán công nợ cho đơn hàng.
 */
export function validatePaymentAmount(
  paymentAmount: number,
  remainingDebtOfOrder: number,
  customerDebtBalance?: number | null,
): ValidationResult {
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return { valid: false, error: 'Số tiền thanh toán phải lớn hơn 0' };
  }

  const roundedPayment = Math.round(paymentAmount);
  const roundedOrderDebt = Math.round(Math.max(0, remainingDebtOfOrder));

  if (roundedPayment > roundedOrderDebt) {
    return {
      valid: false,
      error: `Số tiền thanh toán (${roundedPayment.toLocaleString('vi-VN')} ₫) vượt quá số nợ còn lại của đơn (${roundedOrderDebt.toLocaleString('vi-VN')} ₫)`,
    };
  }

  if (customerDebtBalance !== undefined && customerDebtBalance !== null) {
    const roundedCustomerDebt = Math.round(Math.max(0, customerDebtBalance));
    if (roundedPayment > roundedCustomerDebt) {
      return {
        valid: false,
        error: `Số tiền thanh toán (${roundedPayment.toLocaleString('vi-VN')} ₫) vượt quá tổng công nợ hiện tại của khách hàng (${roundedCustomerDebt.toLocaleString('vi-VN')} ₫)`,
      };
    }
  }

  return { valid: true };
}

/**
 * Lấy metadata hiển thị cho từng loại giao dịch công nợ.
 */
export function getTransactionTypeMeta(type: DebtTransactionType | string): TransactionTypeMeta {
  switch (type) {
    case 'DEBT_INCREASE':
      return {
        label: 'Phát sinh nợ',
        sign: '+',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        textClass: 'text-rose-600 dark:text-rose-400 font-bold',
        description: 'Tăng công nợ từ đơn mua hàng',
      };
    case 'PAYMENT':
      return {
        label: 'Thanh toán nợ',
        sign: '-',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
        description: 'Khách hàng thanh toán giảm nợ',
      };
    case 'VOID':
      return {
        label: 'Đảo nợ (Hủy đơn)',
        sign: '-',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        textClass: 'text-amber-600 dark:text-amber-400 font-bold',
        description: 'Hủy đơn hàng và xóa nợ tương ứng',
      };
    case 'ADJUSTMENT':
    default:
      return {
        label: 'Điều chỉnh nợ',
        sign: '±',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        textClass: 'text-blue-600 dark:text-blue-400 font-bold',
        description: 'Điều chỉnh cân đối sổ nợ',
      };
  }
}
