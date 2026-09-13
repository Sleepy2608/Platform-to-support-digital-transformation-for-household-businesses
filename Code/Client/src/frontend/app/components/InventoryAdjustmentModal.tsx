'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, AlertTriangle, CheckCircle2, ArrowRight,
  RotateCcw, Scale, Search, Loader2
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import {
  AdjustmentType,
  ProductUnitOption,
  previewStockAdjustment,
  validateAdjustmentForm,
} from '../lib/inventoryAdjustmentViewModel';

export interface SelectedProductInfo {
  id: number;
  productCode: string;
  productName: string;
  baseUnitName?: string | null;
  baseUnitId?: number | null;
  quantityOnHand?: number;
}

interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: SelectedProductInfo | null;
  onSuccess?: () => void;
}

interface ProductSearchItem {
  id: number;
  productCode: string;
  productName: string;
  baseUnitId: number;
  baseUnitName?: string;
  quantityOnHand: number;
  status: string;
}

export function InventoryAdjustmentModal({
  isOpen,
  onClose,
  initialProduct,
  onSuccess,
}: InventoryAdjustmentModalProps) {
  // Product state
  const [selectedProduct, setSelectedProduct] = useState<SelectedProductInfo | null>(null);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Units state
  const [units, setUnits] = useState<ProductUnitOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | undefined>();
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Current balance
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Form inputs
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('SET');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // UI state
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Reset form when opened or product changed
  useEffect(() => {
    if (isOpen) {
      setApiError('');
      setSuccessMessage('');
      setIsConfirmStep(false);
      if (initialProduct) {
        setSelectedProduct(initialProduct);
        setCurrentBalance(initialProduct.quantityOnHand ?? 0);
      } else {
        setSelectedProduct(null);
        setCurrentBalance(0);
      }
      setQuantityInput('');
      setReason('');
      setAdjustmentType('SET');
    }
  }, [isOpen, initialProduct]);

  // Fetch product balance whenever selectedProduct changes
  const fetchBalance = useCallback(async (productId: number) => {
    setLoadingBalance(true);
    try {
      const res = await apiClient.get<{ quantityOnHand: number }>(`/api/inventory/products/${productId}`);
      if (res && typeof res.quantityOnHand === 'number') {
        setCurrentBalance(res.quantityOnHand);
      }
    } catch {
      // Giữ nguyên số lượng hiện tại nếu API balance lỗi
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // Fetch units whenever selectedProduct changes
  const fetchUnits = useCallback(async (productId: number) => {
    setLoadingUnits(true);
    try {
      const data = await apiClient.get<ProductUnitOption[]>(`/api/products/${productId}/units`);
      const activeUnits = Array.isArray(data) ? data.filter(u => u.status !== 'INACTIVE') : [];
      setUnits(activeUnits);

      // Default to baseUnit or first unit
      const base = activeUnits.find(u => u.baseUnit) || activeUnits[0];
      if (base) {
        setSelectedUnitId(base.unitId);
      }
    } catch {
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProduct?.id) {
      void fetchUnits(selectedProduct.id);
      void fetchBalance(selectedProduct.id);
    } else {
      setUnits([]);
      setSelectedUnitId(undefined);
    }
  }, [selectedProduct, fetchUnits, fetchBalance]);

  // Product search
  useEffect(() => {
    if (!productSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiClient.get<{ content?: ProductSearchItem[]; data?: ProductSearchItem[] }>(
          `/api/products?keyword=${encodeURIComponent(productSearchQuery.trim())}&status=ACTIVE&size=5`
        );
        const list = res.content || res.data || [];
        setSearchResults(list);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearchQuery]);

  // Current selected unit object
  const currentUnit = useMemo(() => {
    return units.find(u => u.unitId === selectedUnitId);
  }, [units, selectedUnitId]);

  const conversionRate = currentUnit?.conversionRate ?? 1;

  // Parsed quantity
  const parsedQuantity = useMemo(() => {
    const val = parseFloat(quantityInput);
    return isNaN(val) ? 0 : val;
  }, [quantityInput]);

  // Preview difference calculation
  const preview = useMemo(() => {
    return previewStockAdjustment(
      currentBalance,
      parsedQuantity,
      conversionRate,
      adjustmentType
    );
  }, [currentBalance, parsedQuantity, conversionRate, adjustmentType]);

  // Validate form
  const formValidation = useMemo(() => {
    return validateAdjustmentForm(
      selectedProduct?.id,
      selectedUnitId,
      parsedQuantity,
      reason,
      preview
    );
  }, [selectedProduct, selectedUnitId, parsedQuantity, reason, preview]);

  // Submit adjustment to API
  const handleSubmit = async () => {
    if (!formValidation.isValid || !selectedProduct?.id || !selectedUnitId) {
      setApiError(formValidation.error || 'Dữ liệu không hợp lệ');
      return;
    }

    setSubmitting(true);
    setApiError('');
    try {
      await apiClient.post('/api/inventory/adjustment', {
        productId: selectedProduct.id,
        unitId: selectedUnitId,
        quantity: parsedQuantity,
        adjustmentType,
        reason: reason.trim(),
      });

      setSuccessMessage('Điều chỉnh tồn kho thành công!');
      window.dispatchEvent(new CustomEvent('product-updated'));

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi điều chỉnh tồn kho.');
      setIsConfirmStep(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Điều chỉnh tồn kho</h3>
              <p className="text-xs text-slate-500">Cập nhật số lượng kiểm kê thực tế hoặc điều chỉnh phát sinh</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {apiError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Lỗi điều chỉnh tồn kho</p>
                <p className="mt-0.5 text-xs text-red-700">{apiError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {!isConfirmStep ? (
            <>
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Sản phẩm <span className="text-red-500">*</span>
                </label>
                {selectedProduct ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div>
                      <p className="font-bold text-slate-900">{selectedProduct.productName}</p>
                      <p className="text-xs font-semibold text-slate-500">Mã: {selectedProduct.productCode}</p>
                    </div>
                    {!initialProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          setProductSearchQuery('');
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Đổi sản phẩm
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên hoặc mã sản phẩm..."
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                      )}
                    </div>
                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-10 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct({
                                id: p.id,
                                productCode: p.productCode,
                                productName: p.productName,
                                baseUnitName: p.baseUnitName,
                                baseUnitId: p.baseUnitId,
                                quantityOnHand: p.quantityOnHand,
                              });
                              setCurrentBalance(p.quantityOnHand);
                              setProductSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-b-0"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{p.productName}</p>
                              <p className="text-xs text-slate-500">{p.productCode}</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-600">
                              Tồn: {p.quantityOnHand} {p.baseUnitName || ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Unit Selection & Current Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Đơn vị tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedUnitId ?? ''}
                    onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                    disabled={loadingUnits || units.length === 0}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-purple-600 disabled:bg-slate-100"
                  >
                    {units.length === 0 ? (
                      <option value="">{loadingUnits ? 'Đang tải đơn vị...' : 'Chưa có đơn vị'}</option>
                    ) : (
                      units.map((u) => (
                        <option key={u.id} value={u.unitId}>
                          {u.unitName} {u.baseUnit ? '(Đơn vị chuẩn)' : `(Quy đổi: x${u.conversionRate})`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Tồn kho hiện tại
                  </label>
                  <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <span className="text-sm font-bold text-slate-900">
                      {loadingBalance ? '...' : currentBalance.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                    </span>
                    <span className="ml-1.5 text-xs font-semibold text-slate-500">
                      {selectedProduct?.baseUnitName || 'đơn vị chuẩn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjustment Mode Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Hình thức điều chỉnh
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'SET', label: 'Đặt lại tồn', desc: 'Kiểm kê thực tế' },
                    { type: 'INCREASE', label: 'Tăng tồn (+)', desc: 'Nhập bù / Tìm thấy' },
                    { type: 'DECREASE', label: 'Giảm tồn (-)', desc: 'Hao hụt / Hỏng vỡ' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setAdjustmentType(item.type as AdjustmentType)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                        adjustmentType === item.type
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm font-bold">{item.label}</span>
                      <span className="text-[11px] opacity-75 mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {adjustmentType === 'SET'
                    ? 'Số lượng thực tế kiểm kê'
                    : adjustmentType === 'INCREASE'
                    ? 'Số lượng tăng thêm'
                    : 'Số lượng giảm bớt'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    placeholder="0.000"
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-4 text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    {currentUnit?.unitName || ''}
                  </span>
                </div>
                {conversionRate > 1 && parsedQuantity > 0 && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Quy đổi cơ sở: <strong>{preview.baseQuantity} {selectedProduct?.baseUnitName || ''}</strong> (x{conversionRate})
                  </p>
                )}
              </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Xem trước chênh lệch tồn</span>
                  <RotateCcw className="h-3.5 w-3.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500">Tồn hiện tại</p>
                    <p className="mt-1 text-base font-black text-slate-800">
                      {preview.balanceBefore}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500">Thay đổi</p>
                    <p
                      className={`mt-1 text-base font-black ${
                        preview.quantityChange > 0
                          ? 'text-emerald-600'
                          : preview.quantityChange < 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {preview.quantityChange > 0 ? `+${preview.quantityChange}` : preview.quantityChange}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500">Tồn sau điều chỉnh</p>
                    <p
                      className={`mt-1 text-base font-black ${
                        preview.balanceAfter < 0 ? 'text-red-600' : 'text-purple-700'
                      }`}
                    >
                      {preview.balanceAfter}
                    </p>
                  </div>
                </div>

                {preview.errorMessage && (
                  <p className="text-xs font-bold text-red-600 pt-1">
                    ⚠️ {preview.errorMessage}
                  </p>
                )}
              </div>

              {/* Reason Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lý do điều chỉnh <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">{reason.length}/500</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Kiểm kê định kỳ tháng 9, Hàng hỏng do vận chuyển, Nhập dư..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </>
          ) : (
            /* Confirmation Step */
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
                <p className="font-bold">Xác nhận điều chỉnh tồn kho</p>
                <p className="mt-1 text-xs text-amber-800">
                  Hành động này sẽ ghi nhận vào Sổ kho S2-HKD và lịch sử biến động kho. Vui lòng kiểm tra kỹ các thông tin dưới đây:
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-sm">
                <div className="flex justify-between px-4 py-3 bg-slate-50/50">
                  <span className="text-slate-500">Sản phẩm:</span>
                  <span className="font-bold text-slate-900">{selectedProduct?.productName} ({selectedProduct?.productCode})</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-slate-500">Hình thức:</span>
                  <span className="font-bold text-purple-700">
                    {adjustmentType === 'SET'
                      ? 'Đặt lại tồn kiểm kê'
                      : adjustmentType === 'INCREASE'
                      ? 'Tăng thêm tồn kho'
                      : 'Giảm bớt tồn kho'}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-slate-50/50">
                  <span className="text-slate-500">Số lượng nhập:</span>
                  <span className="font-bold text-slate-900">{parsedQuantity} {currentUnit?.unitName}</span>
                </div>
                {conversionRate > 1 && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-slate-500">Quy đổi cơ sở:</span>
                    <span className="font-bold text-slate-900">{preview.baseQuantity} {selectedProduct?.baseUnitName}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-slate-50/50">
                  <span className="text-slate-500">Biến động tồn:</span>
                  <span className="font-bold text-slate-900">
                    {preview.balanceBefore} → <strong className="text-purple-700">{preview.balanceAfter}</strong> ({preview.quantityChange > 0 ? `+${preview.quantityChange}` : preview.quantityChange})
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-slate-500">Lý do:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-xs">{reason.trim()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={isConfirmStep ? () => setIsConfirmStep(false) : onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            {isConfirmStep ? 'Quay lại' : 'Hủy bỏ'}
          </button>

          {!isConfirmStep ? (
            <button
              type="button"
              onClick={() => {
                if (!formValidation.isValid) {
                  setApiError(formValidation.error || 'Vui lòng kiểm tra lại thông tin.');
                  return;
                }
                setApiError('');
                setIsConfirmStep(true);
              }}
              disabled={!formValidation.isValid || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
            >
              Tiếp tục
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận & Lưu'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
