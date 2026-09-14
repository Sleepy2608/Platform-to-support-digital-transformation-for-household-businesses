export type AdjustmentType = 'SET' | 'INCREASE' | 'DECREASE';

export interface ProductUnitOption {
  id: number;
  productId: number;
  unitId: number;
  unitName: string;
  unitCode: string;
  conversionRate: number;
  baseUnit: boolean;
  status: string;
}

export interface AdjustmentPreview {
  balanceBefore: number;
  enteredQuantity: number;
  baseQuantity: number;
  quantityChange: number;
  balanceAfter: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Tính toán số lượng cơ sở từ số lượng nhập và tỷ lệ quy đổi
 */
export function calculateBaseQuantity(quantity: number, conversionRate: number): number {
  if (isNaN(quantity) || quantity <= 0) return 0;
  const rate = isNaN(conversionRate) || conversionRate <= 0 ? 1 : conversionRate;
  return Number((quantity * rate).toFixed(3));
}

/**
 * Tính toán preview chênh lệch tồn kho theo hình thức điều chỉnh
 */
export function previewStockAdjustment(
  currentBalance: number,
  quantity: number,
  conversionRate: number,
  adjustmentType: AdjustmentType
): AdjustmentPreview {
  const safeCurrent = isNaN(currentBalance) ? 0 : Number(currentBalance.toFixed(3));
  const enteredQty = isNaN(quantity) ? 0 : Number(quantity.toFixed(3));
  const rate = isNaN(conversionRate) || conversionRate <= 0 ? 1 : conversionRate;

  if (enteredQty < 0) {
    return {
      balanceBefore: safeCurrent,
      enteredQuantity: enteredQty,
      baseQuantity: 0,
      quantityChange: 0,
      balanceAfter: safeCurrent,
      isValid: false,
      errorMessage: 'Số lượng điều chỉnh không thể nhỏ hơn 0.',
    };
  }

  const baseQty = Number((enteredQty * rate).toFixed(3));

  let quantityChange = 0;
  let balanceAfter = 0;

  switch (adjustmentType) {
    case 'SET':
      // Đặt lại tồn kho theo số lượng thực tế kiểm kê
      balanceAfter = baseQty;
      quantityChange = Number((balanceAfter - safeCurrent).toFixed(3));
      break;

    case 'INCREASE':
      // Tăng thêm số lượng
      quantityChange = baseQty;
      balanceAfter = Number((safeCurrent + quantityChange).toFixed(3));
      break;

    case 'DECREASE':
      // Giảm bớt số lượng
      quantityChange = Number((-baseQty).toFixed(3));
      balanceAfter = Number((safeCurrent + quantityChange).toFixed(3));
      break;
  }

  if (balanceAfter < 0) {
    return {
      balanceBefore: safeCurrent,
      enteredQuantity: enteredQty,
      baseQuantity: baseQty,
      quantityChange,
      balanceAfter,
      isValid: false,
      errorMessage: `Số lượng tồn kho sau điều chỉnh không thể nhỏ hơn 0 (Hiện tại: ${safeCurrent}, Cần giảm: ${baseQty}).`,
    };
  }

  return {
    balanceBefore: safeCurrent,
    enteredQuantity: enteredQty,
    baseQuantity: baseQty,
    quantityChange,
    balanceAfter,
    isValid: true,
  };
}

/**
 * Validate toàn bộ form điều chỉnh kho
 */
export function validateAdjustmentForm(
  productId: number | undefined,
  unitId: number | undefined,
  quantity: number,
  reason: string,
  preview: AdjustmentPreview
): { isValid: boolean; error?: string } {
  if (!productId) {
    return { isValid: false, error: 'Vui lòng chọn sản phẩm cần điều chỉnh.' };
  }
  if (!unitId) {
    return { isValid: false, error: 'Vui lòng chọn đơn vị tính.' };
  }
  if (isNaN(quantity) || quantity < 0) {
    return { isValid: false, error: 'Số lượng không hợp lệ.' };
  }
  if (!preview.isValid) {
    return { isValid: false, error: preview.errorMessage || 'Số lượng điều chỉnh không hợp lệ.' };
  }
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { isValid: false, error: 'Lý do điều chỉnh không được để trống.' };
  }
  if (trimmedReason.length > 500) {
    return { isValid: false, error: 'Lý do điều chỉnh không được vượt quá 500 ký tự.' };
  }
  return { isValid: true };
}
