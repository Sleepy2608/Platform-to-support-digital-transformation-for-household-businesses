'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import { useDebounce } from '@/app/lib/useDebounce';
import {
  FastSalesCartItem,
  FastSalesCategory,
  FastSalesCustomer,
  FastSalesProduct,
} from './FastSalesTypes';
import { FastSalesHeader } from './FastSalesHeader';
import { FastSalesProductCatalog } from './FastSalesProductCatalog';
import { FastSalesCustomerSection } from './FastSalesCustomerSection';
import { FastSalesCart } from './FastSalesCart';
import { FastSalesOrderSummary } from './FastSalesOrderSummary';
import { FastSalesConfirmModal } from './FastSalesConfirmModal';
import { FastSalesShortcutsModal } from './FastSalesShortcutsModal';

interface BackendProductItem {
  id: number;
  productCode: string;
  productName: string;
  categoryId?: number;
  categoryName?: string;
  baseUnitId?: number;
  baseUnitName?: string;
  saleUnitId?: number;
  saleUnitName?: string;
  salePrice?: number | string;
  quantityOnHand?: number | string;
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PageResponse<T> {
  content?: T[];
  data?: T[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
}

interface BackendCategoryItem {
  id: number;
  categoryName: string;
}

interface SalesOrderResponse {
  id?: number;
  orderCode: string;
  customerId?: number;
  source?: string;
  status?: string;
  totalAmount?: number;
  paidAmount?: number;
  debtAmount?: number;
}

export function FastSalesView() {
  // Search and Product State
  const [products, setProducts] = useState<FastSalesProduct[]>([]);
  const [categories, setCategories] = useState<FastSalesCategory[]>([{ id: 0, name: 'Tất cả' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Cart State
  const [cartItems, setCartItems] = useState<FastSalesCartItem[]>([]);

  // Customer State (null represents "Khách mua lẻ")
  const [selectedCustomer, setSelectedCustomer] = useState<FastSalesCustomer | null>(null);

  // Payment Mode State ('PAY_NOW' vs 'DEBT')
  const [paymentMode, setPaymentMode] = useState<'PAY_NOW' | 'DEBT'>('PAY_NOW');

  // Checkout API States (HBDT-46)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [orderFeedback, setOrderFeedback] = useState<{
    code: string;
    totalAmount: number;
    paidAmount: number;
    debtAmount: number;
    itemCount: number;
    customerName: string;
    paymentMode: 'PAY_NOW' | 'DEBT';
  } | null>(null);

  // Mobile Tab State ('products' vs 'cart')
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

  // Modal States
  const [showClearCartModal, setShowClearCartModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // DOM Refs for Keyboard Shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Categories ───────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get<PageResponse<BackendCategoryItem> | BackendCategoryItem[]>(
        '/api/categories?size=100'
      );
      const list = Array.isArray(res) ? res : res.content || res.data || [];
      const mapped: FastSalesCategory[] = [
        { id: 0, name: 'Tất cả' },
        ...list.map((c) => ({ id: c.id, name: c.categoryName })),
      ];
      setCategories(mapped);
    } catch {
      setCategories([{ id: 0, name: 'Tất cả' }]);
    }
  }, []);

  // ─── Fetch Products from API ────────────────────────────────────────────────
  const fetchProducts = useCallback(async (keyword: string, catId: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: '0',
        size: '50',
      });
      if (keyword.trim()) {
        params.set('keyword', keyword.trim());
      }
      if (catId > 0) {
        params.set('categoryId', String(catId));
      }

      const res = await apiClient.get<PageResponse<BackendProductItem>>(`/api/products?${params}`);
      const rawList = res.content || res.data || [];

      const mappedProducts: FastSalesProduct[] = rawList.map((p) => ({
        id: p.id,
        productCode: p.productCode || '',
        productName: p.productName || '',
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        baseUnitId: p.saleUnitId || p.baseUnitId || 1,
        unitName: p.saleUnitName || p.baseUnitName || 'SP',
        salePrice: Number(p.salePrice || 0),
        quantityOnHand: Number(p.quantityOnHand || 0),
        imageUrl: p.imageUrl,
        status: p.status || 'ACTIVE',
      }));

      setProducts(mappedProducts);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối đến máy chủ để tải danh sách sản phẩm'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCategories();
      void fetchProducts(debouncedSearch, selectedCategoryId);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCategories, fetchProducts, debouncedSearch, selectedCategoryId]);

  // Cart helper map
  const cartProductQuantities = useMemo(() => {
    const map: Record<number, number> = {};
    cartItems.forEach((item) => {
      map[item.productId] = item.quantity;
    });
    return map;
  }, [cartItems]);

  // Financial Calculations Realtime
  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  const discount = 0;
  const totalAmount = Math.max(0, subtotal - discount);

  // Cart Validation
  const validationError = useMemo(() => {
    if (cartItems.length === 0) return '';
    const invalidItem = cartItems.find((item) => item.quantity > item.quantityOnHand);
    if (invalidItem) {
      return `Sản phẩm "${invalidItem.productName}" vượt quá tồn kho hiện có (${invalidItem.quantityOnHand} ${invalidItem.unitName})`;
    }
    if (paymentMode === 'DEBT' && !selectedCustomer) {
      return 'Vui lòng chọn khách hàng cụ thể khi ghi nhận công nợ';
    }
    return '';
  }, [cartItems, paymentMode, selectedCustomer]);

  // Cart Operations
  const handleAddToCart = (product: FastSalesProduct) => {
    if (product.quantityOnHand <= 0) return;

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantityOnHand) {
          return prevItems;
        }
        return prevItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            productId: product.id,
            productCode: product.productCode,
            productName: product.productName,
            baseUnitId: product.baseUnitId || 1,
            unitName: product.unitName,
            unitPrice: product.salePrice,
            quantity: 1,
            quantityOnHand: product.quantityOnHand,
            imageUrl: product.imageUrl,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          const clampedQty = Math.max(1, Math.min(newQty, item.quantityOnHand));
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setShowClearCartModal(false);
  };

  // ─── Order API Integration (HBDT-46) ────────────────────────────────────────
  const handleCreateOrderClick = useCallback(async () => {
    if (cartItems.length === 0 || isSubmitting || validationError) return;

    setIsSubmitting(true);
    setErrorMessage('');

    // Generate POS order code with timestamp
    const generatedOrderCode = `POS-${Date.now().toString().slice(-8)}`;

    const payload = {
      orderCode: generatedOrderCode,
      customerId: selectedCustomer ? selectedCustomer.id : undefined,
      source: 'POS',
      paidAmount: paymentMode === 'PAY_NOW' ? totalAmount : 0,
      note:
        paymentMode === 'DEBT'
          ? `Ghi nhận công nợ (Khách: ${selectedCustomer?.customerName || ''})`
          : 'Bán hàng nhanh tại quầy (POS)',
      items: cartItems.map((item) => ({
        productId: item.productId,
        unitId: item.baseUnitId || 1,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await apiClient.post<SalesOrderResponse>('/api/sales-orders', payload);

      setOrderFeedback({
        code: response.orderCode || generatedOrderCode,
        totalAmount: Number(response.totalAmount || totalAmount),
        paidAmount: Number(response.paidAmount ?? (paymentMode === 'PAY_NOW' ? totalAmount : 0)),
        debtAmount: Number(response.debtAmount ?? (paymentMode === 'DEBT' ? totalAmount : 0)),
        itemCount: totalQuantity,
        customerName: selectedCustomer ? selectedCustomer.customerName : 'Khách mua lẻ',
        paymentMode,
      });

      // Clear cart on successful order creation
      setCartItems([]);
      setShowOrderSuccessModal(true);

      // Refresh product list stock
      void fetchProducts(debouncedSearch, selectedCategoryId);
    } catch (err) {
      // Retain cart on error so staff can adjust quantity and retry
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại giỏ hàng hoặc kết nối.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cartItems,
    isSubmitting,
    validationError,
    selectedCustomer,
    paymentMode,
    totalAmount,
    totalQuantity,
    debouncedSearch,
    selectedCategoryId,
    fetchProducts,
  ]);

  // ─── Keyboard Shortcuts Global Listener ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      // F1: Open Keyboard Shortcuts modal
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      // F2 or '/' (when not typing): Focus Product Search Bar
      if (e.key === 'F2' || (!isInputFocused && e.key === '/')) {
        e.preventDefault();
        setActiveTab('products');
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // F8: Clear cart modal
      if (e.key === 'F8') {
        e.preventDefault();
        if (cartItems.length > 0) {
          setShowClearCartModal(true);
        }
        return;
      }

      // F9 or Ctrl+Enter: Trigger Checkout / Create Order
      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cartItems.length > 0 && !isSubmitting && !validationError) {
          void handleCreateOrderClick();
        }
        return;
      }

      // Escape: Close active modals / blur active input
      if (e.key === 'Escape') {
        if (showShortcutsModal) setShowShortcutsModal(false);
        if (showClearCartModal) setShowClearCartModal(false);
        if (showOrderSuccessModal) setShowOrderSuccessModal(false);
        if (errorMessage) setErrorMessage('');
        if (isInputFocused) (target as HTMLElement).blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cartItems,
    isSubmitting,
    validationError,
    showShortcutsModal,
    showClearCartModal,
    showOrderSuccessModal,
    errorMessage,
    handleCreateOrderClick,
  ]);

  return (
    <div className="min-h-screen bg-[#ededed] text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <FastSalesHeader
        cartItemCount={cartItems.length}
        totalQuantity={totalQuantity}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClearCartClick={() => setShowClearCartModal(true)}
        onOpenShortcutsClick={() => setShowShortcutsModal(true)}
      />

      {/* Main Responsive Body Container */}
      <div className="flex-1 mx-auto w-full max-w-7xl p-3 sm:p-5 lg:p-6">
        {/* API Error Banner if any */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-sm text-red-800 animate-in fade-in">
            <span className="font-semibold">⚠️ {errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Responsive Grid: Desktop (2 Columns) / Mobile (Tabs/Stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Product Catalog (Visible on Desktop OR when activeTab is 'products' on Mobile) */}
          <section
            className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-4 ${
              activeTab === 'products' ? 'block' : 'hidden lg:block'
            }`}
          >
            <FastSalesProductCatalog
              ref={searchInputRef}
              products={products}
              categories={categories}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={setSelectedCategoryId}
              onAddToCart={handleAddToCart}
              cartProductQuantities={cartProductQuantities}
              loading={loading}
              error={error}
              onRetry={() => void fetchProducts(debouncedSearch, selectedCategoryId)}
            />
          </section>

          {/* Right Column: Customer & Cart & Order Summary (Visible on Desktop OR when activeTab is 'cart' on Mobile) */}
          <section
            className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sticky top-20 ${
              activeTab === 'cart' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Customer Picker */}
            <FastSalesCustomerSection
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
            />

            {/* Cart Items List */}
            <FastSalesCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={() => setShowClearCartModal(true)}
            />

            {/* Financial Summary & Checkout Button */}
            <FastSalesOrderSummary
              subtotal={subtotal}
              discount={discount}
              totalAmount={totalAmount}
              totalQuantity={totalQuantity}
              cartItemCount={cartItems.length}
              selectedCustomer={selectedCustomer}
              paymentMode={paymentMode}
              isSubmitting={isSubmitting}
              validationError={validationError}
              onCreateOrderClick={() => void handleCreateOrderClick()}
            />
          </section>
        </div>
      </div>

      {/* Mobile Sticky Floating Bottom Bar for Quick View Cart */}
      {activeTab === 'products' && cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
          <button
            type="button"
            onClick={() => setActiveTab('cart')}
            className="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-black text-xs">
                {cartItems.length} SP
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-300 block">Tổng thanh toán:</span>
                <span className="text-sm font-black text-emerald-400">
                  {totalAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
              <span>Xem giỏ hàng</span>
            </div>
          </button>
        </div>
      )}

      {/* Confirm Clear Cart Modal */}
      <FastSalesConfirmModal
        isOpen={showClearCartModal}
        title="Xóa toàn bộ giỏ hàng? (F8)"
        message="Hành động này sẽ xóa tất cả sản phẩm đang có trong giỏ hàng hiện tại. Bạn có chắc chắn muốn xóa không?"
        confirmLabel="Xóa tất cả"
        cancelLabel="Giữ lại"
        isDestructive={true}
        onConfirm={handleClearCart}
        onCancel={() => setShowClearCartModal(false)}
      />

      {/* Order API Success Feedback Modal */}
      <FastSalesConfirmModal
        isOpen={showOrderSuccessModal}
        title="Tạo đơn hàng thành công!"
        message={
          orderFeedback
            ? `Mã đơn hàng: ${orderFeedback.code} • Số lượng: ${orderFeedback.itemCount} món • Tổng tiền: ${orderFeedback.totalAmount.toLocaleString(
                'vi-VN'
              )} ₫ • Khách: ${orderFeedback.customerName} (${
                orderFeedback.paymentMode === 'PAY_NOW' ? 'Đã thanh toán đủ' : 'Ghi nợ đơn hàng'
              }). Đơn hàng đã được lưu vào hệ thống.`
            : 'Đơn hàng đã được tạo thành công!'
        }
        confirmLabel="Bán đơn tiếp theo"
        cancelLabel="Đóng"
        onConfirm={() => {
          setShowOrderSuccessModal(false);
          setOrderFeedback(null);
        }}
        onCancel={() => {
          setShowOrderSuccessModal(false);
          setOrderFeedback(null);
        }}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <FastSalesShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
