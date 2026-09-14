'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import {
  MOCK_CATEGORIES,
  MOCK_CUSTOMERS,
  MOCK_PRODUCTS,
} from './FastSalesMockData';
import {
  FastSalesCartItem,
  FastSalesCustomer,
  FastSalesProduct,
} from './FastSalesTypes';
import { FastSalesHeader } from './FastSalesHeader';
import { FastSalesProductCatalog } from './FastSalesProductCatalog';
import { FastSalesCustomerSection } from './FastSalesCustomerSection';
import { FastSalesCart } from './FastSalesCart';
import { FastSalesOrderSummary } from './FastSalesOrderSummary';
import { FastSalesConfirmModal } from './FastSalesConfirmModal';

export function FastSalesView() {
  // Products and Category State
  const [products] = useState<FastSalesProduct[]>(MOCK_PRODUCTS);
  const [categories] = useState(MOCK_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);

  // Cart State (Initialized with 1 sample item to demonstrate layout)
  const [cartItems, setCartItems] = useState<FastSalesCartItem[]>([
    {
      productId: 101,
      productCode: 'SP001',
      productName: 'Sữa tươi tiệt trùng Vinamilk 1L',
      unitName: 'Hộp',
      unitPrice: 38000,
      quantity: 2,
      quantityOnHand: 45,
    },
  ]);

  // Customer State (null represents "Khách mua lẻ")
  const [selectedCustomer, setSelectedCustomer] = useState<FastSalesCustomer | null>(null);

  // Mobile Tab State ('products' vs 'cart')
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

  // Modal States
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);

  // Cart helper maps
  const cartProductQuantities = useMemo(() => {
    const map: Record<number, number> = {};
    cartItems.forEach((item) => {
      map[item.productId] = item.quantity;
    });
    return map;
  }, [cartItems]);

  // Financial Calculations
  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  const discount = 0;
  const totalAmount = Math.max(0, subtotal - discount);

  // Cart Operations
  const handleAddToCart = (product: FastSalesProduct) => {
    if (product.quantityOnHand <= 0) return;

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantityOnHand) {
          return prevItems; // Cannot exceed stock
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
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          const clampedQty = Math.min(newQty, item.quantityOnHand);
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

  const handleCreateOrderClick = () => {
    if (cartItems.length === 0) return;
    setShowOrderSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-[#ededed] text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <FastSalesHeader
        cartItemCount={cartItems.length}
        totalQuantity={totalQuantity}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClearCartClick={() => setShowClearCartModal(true)}
      />

      {/* Main Responsive Body Container */}
      <div className="flex-1 mx-auto w-full max-w-7xl p-3 sm:p-5 lg:p-6">
        {/* Responsive Grid: Desktop (2 Columns) / Mobile (Tabs/Stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Product Catalog (Visible on Desktop OR when activeTab is 'products' on Mobile) */}
          <section
            className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-4 ${
              activeTab === 'products' ? 'block' : 'hidden lg:block'
            }`}
          >
            <FastSalesProductCatalog
              products={products}
              categories={categories}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={setSelectedCategoryId}
              onAddToCart={handleAddToCart}
              cartProductQuantities={cartProductQuantities}
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
              customers={MOCK_CUSTOMERS}
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
              onCreateOrderClick={handleCreateOrderClick}
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
        title="Xóa toàn bộ giỏ hàng?"
        message="Hành động này sẽ xóa tất cả sản phẩm đang có trong giỏ hàng hiện tại. Bạn có chắc chắn muốn xóa không?"
        confirmLabel="Xóa tất cả"
        cancelLabel="Giữ lại"
        isDestructive={true}
        onConfirm={handleClearCart}
        onCancel={() => setShowClearCartModal(false)}
      />

      {/* Task 1 Mock Order Modal */}
      <FastSalesConfirmModal
        isOpen={showOrderSuccessModal}
        title="Giao diện Fast Sales (Task 1)"
        message={`Đơn hàng với tổng tiền ${totalAmount.toLocaleString(
          'vi-VN'
        )} ₫ (${totalQuantity} sản phẩm) đã được chuẩn bị sẵn sàng trên giao diện. Tính năng kết nối API tạo đơn hàng (POST /api/sales-orders) sẽ được triển khai ở các task tiếp theo.`}
        confirmLabel="Đóng"
        cancelLabel="Kiểm tra lại"
        onConfirm={() => setShowOrderSuccessModal(false)}
        onCancel={() => setShowOrderSuccessModal(false)}
      />
    </div>
  );
}
