'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, X, ArrowRight, CheckCircle2, DollarSign, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CartItem {
  productId: number;
  productCode: string;
  productName: string;
  baseUnitName?: string;
  salePrice: number;
  quantity: number;
  imageUrl?: string;
  quantityOnHand?: number;
}

interface OrderCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: (customerName: string, note: string) => Promise<void> | void;
}

const STORAGE_KEY_CUSTOMER = 'hbdt_order_cart_customer';
const STORAGE_KEY_NOTE = 'hbdt_order_cart_note';

export function OrderCartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: OrderCartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Rehydrate customer and note from localStorage on mount
  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem(STORAGE_KEY_CUSTOMER);
      const savedNote = localStorage.getItem(STORAGE_KEY_NOTE);
      if (savedCustomer) setCustomerName(savedCustomer);
      if (savedNote) setNote(savedNote);
    } catch {
      // Ignore localStorage access errors
    }
    setIsHydrated(true);
  }, []);

  // Save draft inputs to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (customerName) {
        localStorage.setItem(STORAGE_KEY_CUSTOMER, customerName);
      } else {
        localStorage.removeItem(STORAGE_KEY_CUSTOMER);
      }
    } catch {
      // Ignore
    }
  }, [customerName, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (note) {
        localStorage.setItem(STORAGE_KEY_NOTE, note);
      } else {
        localStorage.removeItem(STORAGE_KEY_NOTE);
      }
    } catch {
      // Ignore
    }
  }, [note, isHydrated]);

  const totalAmount = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onCheckout(customerName, note);
      setSuccessMessage('Đơn hàng đã được tạo thành công!');
      try {
        localStorage.removeItem(STORAGE_KEY_CUSTOMER);
        localStorage.removeItem(STORAGE_KEY_NOTE);
      } catch {
        // Ignore
      }
      setCustomerName('');
      setNote('');
      setTimeout(() => {
        setSuccessMessage('');
        onClearCart();
        onClose();
      }, 1500);
    } catch {
      // Error handling is handled in page caller
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearAll = () => {
    onClearCart();
    setCustomerName('');
    setNote('');
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOMER);
      localStorage.removeItem(STORAGE_KEY_NOTE);
    } catch {
      // Ignore
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer Slide-in Panel from Right */}
          <motion.div
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-slate-900 p-2 text-white shadow-xs">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Đơn hàng mới</h2>
                  <p className="text-xs text-slate-500">{totalItems} mặt hàng trong giỏ</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Alert */}
            {successMessage && (
              <div className="m-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
                  <ShoppingBag className="mb-3 h-12 w-12 stroke-1 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Chưa có sản phẩm nào trong đơn</p>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    Chọn &quot;+ Thêm vào đơn&quot; từ danh sách sản phẩm để bắt đầu tạo đơn hàng nhanh.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sản phẩm đã chọn</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const lineTotal = item.salePrice * item.quantity;
                      const maxStock = item.quantityOnHand ?? 999999;
                      const isMaxStockReached = item.quantity >= maxStock;

                      return (
                        <div
                          key={item.productId}
                          className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:bg-slate-50"
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300 font-bold text-xs">
                                SP
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-bold text-slate-900">{item.productName}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="font-mono">{item.productCode}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">
                                {item.salePrice.toLocaleString('vi-VN')} đ / {item.baseUnitName || 'SP'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="font-bold text-xs text-emerald-700">
                                = {lineTotal.toLocaleString('vi-VN')} đ
                              </div>
                              {item.quantityOnHand !== undefined && (
                                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                                  isMaxStockReached
                                    ? 'bg-amber-100 text-amber-800 font-semibold'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  Tồn kho: {item.quantityOnHand}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-l-lg transition-colors cursor-pointer"
                                title="Giảm 1"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isMaxStockReached}
                                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-r-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title={isMaxStockReached ? `Đã đạt giới hạn tồn kho (${maxStock})` : 'Tăng 1'}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.productId)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                              title="Xóa sản phẩm khỏi đơn"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer Checkout Form */}
            {items.length > 0 && (
              <form onSubmit={handleCheckout} className="border-t border-slate-200 bg-slate-50/80 p-6 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Khách hàng (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Khách lẻ / Tên người mua..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-slate-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Ghi chú đơn hàng
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú giao hàng, giảm giá..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-slate-500 transition-all"
                    />
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Số lượng sản phẩm</span>
                    <span className="font-semibold text-slate-700">{totalItems} món</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Tổng thanh toán</span>
                    <span className="text-base font-black text-emerald-700">
                      {totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <span>Đang tạo đơn & cập nhật kho...</span>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      <span>Xác nhận tạo đơn ({totalAmount.toLocaleString('vi-VN')} đ)</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
