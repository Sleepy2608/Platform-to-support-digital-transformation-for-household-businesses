'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, Boxes, ChevronDown, ChevronLeft, ChevronRight, FolderTree, ImagePlus,
  Pencil, Plus, RefreshCw, Search, Star, Trash2, Upload, X, ShoppingBag,
  CheckCircle2, AlertCircle, Sparkles, ChevronsLeft, ChevronsRight, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';
import { useDebounce } from '@/app/lib/useDebounce';
import { OrderCartDrawer, CartItem } from '@/app/components/OrderCartDrawer';

type Status = 'ACTIVE' | 'INACTIVE';

interface PageResponse<T> {
  content: T[];
  data?: T[];
  page: number;
  size: number;
  limit?: number;
  totalElements: number;
  total?: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface Category {
  id: number;
  categoryCode: string;
  categoryName: string;
  description?: string;
  status: Status;
}

interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

interface Product {
  id: number;
  productCode: string;
  productName: string;
  categoryId?: number;
  categoryName?: string;
  baseUnitId: number;
  baseUnitName?: string;
  salePrice?: number;
  quantityOnHand: number;
  defaultTaxActivityGroupId?: number;
  defaultTaxActivityGroupName?: string;
  imageUrl?: string;
  images?: ProductImage[];
  description?: string;
  status: Status;
}

interface ReferenceOption {
  id: number;
  code: string;
  name: string;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

const EMPTY_CATEGORY = { categoryCode: '', categoryName: '', description: '', status: 'ACTIVE' as Status };
const EMPTY_PRODUCT = {
  productCode: '',
  productName: '',
  categoryId: '',
  salePrice: '',
  quantityOnHand: '0',
  defaultTaxActivityGroupId: '',
  imageUrl: '',
  description: '',
  status: 'ACTIVE' as Status,
};

export default function ProductManagementPage() {
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<PageResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxGroups, setTaxGroups] = useState<ReferenceOption[]>([]);

  // Search & Filter State
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 300);
  const [status, setStatus] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Status & Loading State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals State
  const [categoryModal, setCategoryModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);

  // Image management state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Order Cart Integration State
  const STORAGE_KEY_CART = 'hbdt_order_cart_items';
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);

  // Rehydrate Cart on mount (F5 recovery)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    setCartHydrated(true);
  }, []);

  // Persist Cart to localStorage whenever cartItems changes
  useEffect(() => {
    if (!cartHydrated) return;
    try {
      if (cartItems.length > 0) {
        localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(STORAGE_KEY_CART);
      }
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems, cartHydrated]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await apiClient.get<PageResponse<Category>>('/api/categories?size=100&sortBy=categoryName&direction=asc');
      setCategories(result.content || result.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadReferences = useCallback(async () => {
    try {
      const taxData = await apiClient.get<ReferenceOption[]>('/api/products/references/tax-activity-groups');
      setTaxGroups(taxData || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Strict primitive dependencies for loadProducts
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
      });
      if (debouncedKeyword.trim()) params.set('keyword', debouncedKeyword.trim());
      if (status) params.set('status', status);
      if (categoryFilter) params.set('categoryId', categoryFilter);

      const result = await apiClient.get<PageResponse<Product>>(`/api/products?${params}`);
      setProducts(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, debouncedKeyword, page, pageSize, status, showToast]);

  useEffect(() => {
    void loadCategories();
    void loadReferences();
  }, [loadCategories, loadReferences]);

  useEffect(() => {
    if (tab === 'products') {
      void loadProducts();
    }
  }, [tab, loadProducts]);

  const reloadAll = async () => {
    await Promise.all([loadProducts(), loadCategories(), loadReferences()]);
  };

  const handleResetFilters = () => {
    setKeyword('');
    setStatus('');
    setCategoryFilter('');
    setPage(0);
  };

  // ==========================================
  // Modal Handlers
  // ==========================================

  const openCategory = (category?: Category) => {
    setEditingCategory(category || null);
    setCategoryForm(category ? {
      categoryCode: category.categoryCode,
      categoryName: category.categoryName,
      description: category.description || '',
      status: category.status,
    } : EMPTY_CATEGORY);
    setCategoryModal(true);
  };

  const openProduct = (product?: Product) => {
    setEditingProduct(product || null);
    setProductForm(product ? {
      productCode: product.productCode,
      productName: product.productName,
      categoryId: product.categoryId ? String(product.categoryId) : '',
      salePrice: product.salePrice != null ? String(product.salePrice) : '',
      quantityOnHand: String(product.quantityOnHand ?? 0),
      defaultTaxActivityGroupId: product.defaultTaxActivityGroupId ? String(product.defaultTaxActivityGroupId) : '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      status: product.status,
    } : EMPTY_PRODUCT);
    setProductImages(product?.images || []);
    setPendingFiles([]);
    setProductModal(true);
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await apiClient.put(`/api/categories/${editingCategory.id}`, categoryForm);
      } else {
        await apiClient.post('/api/categories', categoryForm);
      }
      setCategoryModal(false);
      showToast(editingCategory ? 'Đã cập nhật danh mục thành công' : 'Đã tạo danh mục mới thành công');
      await loadCategories();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu danh mục', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...productForm,
      categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
      baseUnitId: editingProduct?.baseUnitId ?? null,
      salePrice: productForm.salePrice ? Number(productForm.salePrice) : 0,
      quantityOnHand: Number(productForm.quantityOnHand),
      defaultTaxActivityGroupId: productForm.defaultTaxActivityGroupId
        ? Number(productForm.defaultTaxActivityGroupId) : null,
    };
    try {
      let productId: number;
      if (editingProduct) {
        await apiClient.put(`/api/products/${editingProduct.id}`, payload);
        productId = editingProduct.id;
      } else {
        const created = await apiClient.post<Product>('/api/products', payload);
        productId = created.id;
      }

      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((file) => formData.append('files', file));
        await apiClient.upload(`/api/products/${productId}/images`, formData);
        setPendingFiles([]);
      }

      setProductModal(false);
      showToast(editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm mới');
      await loadProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu sản phẩm', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (kind: 'product' | 'category', id: number) => {
    if (!window.confirm(`Bạn chắc chắn muốn vô hiệu hóa ${kind === 'product' ? 'sản phẩm' : 'danh mục'} này?`)) return;
    try {
      await apiClient.delete(`/api/${kind === 'product' ? 'products' : 'categories'}/${id}`);
      showToast('Đã vô hiệu hóa thành công');
      if (kind === 'product') await loadProducts();
      else await loadCategories();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể vô hiệu hóa', 'error');
    }
  };

  // ==========================================
  // Image Handlers
  // ==========================================

  const validateFiles = (files: FileList | File[]): File[] | null => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const arr = Array.from(files);
    for (const file of arr) {
      if (!allowedTypes.includes(file.type)) {
        showToast(`File "${file.name}" không hợp lệ. Chỉ chấp nhận PNG, JPG, JPEG, WEBP.`, 'error');
        return null;
      }
      if (file.size > maxSize) {
        showToast(`File "${file.name}" vượt quá 5MB.`, 'error');
        return null;
      }
    }
    return arr;
  };

  const handlePendingFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validated = validateFiles(files);
    if (!validated) return;
    const totalCount = pendingFiles.length + productImages.length + validated.length;
    if (totalCount > 10) {
      showToast(`Tối đa 10 ảnh/sản phẩm. Hiện có ${pendingFiles.length + productImages.length}.`, 'error');
      return;
    }
    setPendingFiles((prev) => [...prev, ...validated]);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingProduct) return;
    const validated = validateFiles(files);
    if (!validated) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      validated.forEach((file) => formData.append('files', file));
      const uploaded = await apiClient.upload<ProductImage[]>(
        `/api/products/${editingProduct.id}/images`, formData
      );
      setProductImages((prev) => [...prev, ...uploaded]);
      await loadProducts();
      showToast(`Đã upload ${uploaded.length} ảnh thành công`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể upload ảnh', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    setDeleteConfirmId(null);
    try {
      await apiClient.delete(`/api/products/images/${imageId}`);
      setProductImages((prev) => prev.filter((img) => img.id !== imageId));
      await loadProducts();
      showToast('Đã xóa ảnh thành công');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xóa ảnh', 'error');
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    if (!editingProduct) return;
    try {
      await apiClient.put(`/api/products/${editingProduct.id}/images/${imageId}/primary`);
      setProductImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img.id === imageId }))
      );
      await loadProducts();
      showToast('Đã đặt ảnh đại diện thành công');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể đặt ảnh đại diện', 'error');
    }
  };

  // ==========================================
  // Order Cart Handlers (Stock Validated & API Integrated)
  // ==========================================

  const handleAddToCart = (product: Product) => {
    const maxStock = Number(product.quantityOnHand ?? 0);
    if (maxStock <= 0) {
      showToast(`Sản phẩm "${product.productName}" đã hết hàng trong kho.`, 'error');
      return;
    }

    const existingItem = cartItems.find((item) => item.productId === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty + 1 > maxStock) {
      showToast(`Số lượng trong đơn đã đạt mức tồn kho tối đa (${maxStock} ${product.baseUnitName || 'SP'})`, 'error');
      return;
    }

    if (existingItem) {
      showToast(`Đã tăng số lượng "${product.productName}" (+1)`, 'info');
      setCartItems((prev) =>
        prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, quantityOnHand: maxStock }
            : item
        )
      );
    } else {
      showToast(`Đã thêm "${product.productName}" vào đơn hàng`, 'success');
      setCartItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productCode: product.productCode,
          productName: product.productName,
          baseUnitName: product.baseUnitName || 'SP',
          salePrice: Number(product.salePrice || 0),
          quantity: 1,
          imageUrl: product.imageUrl,
          quantityOnHand: maxStock,
        },
      ]);
    }
  };

  const handleUpdateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    const item = cartItems.find((i) => i.productId === productId);
    const maxStock = item?.quantityOnHand ?? 999999;
    if (newQuantity > maxStock) {
      showToast(`Số lượng vượt quá tồn kho hiện có (${maxStock})`, 'error');
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveCartItem = (productId: number) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.productId !== productId);
      if (next.length === 0) {
        try {
          localStorage.removeItem(STORAGE_KEY_CART);
        } catch {
          // Ignore
        }
      }
      return next;
    });
    showToast('Đã xóa sản phẩm khỏi đơn', 'info');
  };

  const handleClearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY_CART);
    } catch {
      // Ignore
    }
  };

  const handleCreateOrder = async (customerName: string, note: string) => {
    if (cartItems.length === 0) return;
    try {
      const payload = {
        customerName: customerName.trim() || undefined,
        note: note.trim() || undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.salePrice,
        })),
      };

      const result = await apiClient.post<{ orderCode?: string }>('/api/orders', payload);
      showToast(`Tạo đơn hàng ${result?.orderCode ? '#' + result.orderCode : ''} thành công! Đã tự động trừ tồn kho.`, 'success');
      setCartItems([]);
      try {
        localStorage.removeItem(STORAGE_KEY_CART);
      } catch {
        // Ignore
      }
      // Immediately reload products list to reflect newly deducted stock
      await loadProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo đơn hàng';
      showToast(msg, 'error');
      throw err;
    }
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const visibleCategories = categories.filter((item) => {
    const matchesKeyword =
      !debouncedKeyword.trim() ||
      `${item.categoryCode} ${item.categoryName}`.toLowerCase().includes(debouncedKeyword.toLowerCase());
    return matchesKeyword && (!status || item.status === status);
  });

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8 font-sans antialiased text-slate-900">
      
      {/* Toast Notification Container with Framer Motion */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[110] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold shadow-xl border backdrop-blur-md ${
                t.type === 'error'
                  ? 'bg-red-900/95 text-white border-red-700'
                  : t.type === 'info'
                  ? 'bg-slate-900/95 text-white border-slate-700'
                  : 'bg-emerald-950/95 text-emerald-100 border-emerald-700'
              }`}
            >
              {t.type === 'error' ? (
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-red-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-emerald-400" />
              )}
              <span className="flex-1">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        
        {/* Top Header - Fully Responsive */}
        <header className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-950">
              Sản phẩm & Danh mục
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-medium">
              Tìm kiếm tức thời, quản lý danh mục và tạo đơn hàng nhanh cho hộ kinh doanh.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Order Cart Trigger */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartDrawerOpen(true)}
              className="relative inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-300 bg-white px-3 sm:px-3.5 lg:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Đơn hàng</span>
              {totalCartCount > 0 && (
                <motion.span
                  key={totalCartCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 350 }}
                  className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-black text-white"
                >
                  {totalCartCount}
                </motion.span>
              )}
            </motion.button>

            {/* Add Product/Category Button */}
            <button
              onClick={() => (tab === 'products' ? openProduct() : openCategory())}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-slate-950 px-3 sm:px-3.5 lg:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span>Thêm <span className="hidden sm:inline">{tab === 'products' ? 'sản phẩm' : 'danh mục'}</span></span>
            </button>
          </div>
        </header>

        {/* Main Card Container */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 p-1.5 sm:p-2">
            <div className="flex gap-1 sm:gap-1.5">
              <TabButton
                active={tab === 'products'}
                onClick={() => setTab('products')}
                icon={<Boxes className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                label="Sản phẩm"
              />
              <TabButton
                active={tab === 'categories'}
                onClick={() => setTab('categories')}
                icon={<FolderTree className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                label="Danh mục"
              />
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium pr-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Tìm kiếm & Lọc tức thời
            </span>
          </div>

          {/* Search, Filter & Controls Bar - Single row on Tablet & Desktop */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-2.5 border-b border-slate-200 p-3 sm:p-4">
            {/* Search Input with Debounce */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(0); // CRITICAL: Reset page directly in onChange, never in useEffect
                }}
                placeholder="Tìm tức thời theo mã hoặc tên sản phẩm..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 sm:py-2.5 pl-10 pr-8 text-xs sm:text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500 placeholder:text-slate-400"
              />
              {keyword && (
                <button
                  onClick={() => {
                    setKeyword('');
                    setPage(0);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Select Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0); // CRITICAL: Reset page directly in onChange
              }}
              className="w-full md:w-36 lg:w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-slate-500 cursor-pointer flex-shrink-0"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang kinh doanh</option>
              <option value="INACTIVE">Ngừng sử dụng</option>
            </select>

            {/* Category Select Filter & Refresh button */}
            <div className="flex gap-2 w-full md:w-auto">
              {tab === 'products' ? (
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(0); // CRITICAL: Reset page directly in onChange
                  }}
                  className="flex-1 md:w-44 lg:w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-slate-500 cursor-pointer flex-shrink-0"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.categoryName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="hidden md:block" />
              )}

              {/* Refresh Button */}
              <button
                onClick={() => void reloadAll()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                title="Tải lại dữ liệu"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-slate-900' : ''}`} />
              </button>
            </div>
          </div>

          {/* Content Area - Responsive Switch (Table for Desktop / Cards for Mobile) */}
          {loading ? (
            <div className="p-4 sm:p-6">
              <TableSkeleton />
            </div>
          ) : tab === 'products' ? (
            products?.content && products.content.length > 0 ? (
              <>
                {/* Desktop & Tablet Table (md:block) with Border & Smooth Scroll */}
                <div className="hidden md:block w-full overflow-x-auto rounded-lg border-b border-slate-200">
                  <ProductTable
                    items={products.content}
                    onEdit={openProduct}
                    onDeactivate={(id) => void deactivate('product', id)}
                    onAddToCart={handleAddToCart}
                  />
                </div>

                {/* Mobile Card List (block md:hidden) */}
                <div className="block md:hidden divide-y divide-slate-100 p-2">
                  <ProductCardList
                    items={products.content}
                    onEdit={openProduct}
                    onDeactivate={(id) => void deactivate('product', id)}
                    onAddToCart={handleAddToCart}
                  />
                </div>

                {/* Rich Pagination Controls - Fully Responsive */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 px-4 sm:px-5 py-3 sm:py-4 text-xs text-slate-600 bg-slate-50/40">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <span className="font-semibold text-slate-700">
                      Hiển thị {products.content.length > 0 ? page * pageSize + 1 : 0} -{' '}
                      {Math.min((page + 1) * pageSize, products.totalElements)} trong số{' '}
                      <span className="font-bold text-slate-900">{products.totalElements}</span>
                    </span>

                    {/* Page Size Selector */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                      <span className="text-slate-400 hidden sm:inline">Hiển thị:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(0);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value={5}>5 / trang</option>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                      </select>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-center sm:justify-end gap-1">
                    <button
                      disabled={products.first || page === 0}
                      onClick={() => setPage(0)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      disabled={products.first || page === 0}
                      onClick={() => setPage((val) => Math.max(0, val - 1))}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>

                    <span className="px-2.5 sm:px-3 font-bold text-slate-800 text-xs">
                      Trang {page + 1} / {products.totalPages || 1}
                    </span>

                    <button
                      disabled={products.last || page >= (products.totalPages || 1) - 1}
                      onClick={() => setPage((val) => val + 1)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      disabled={products.last || page >= (products.totalPages || 1) - 1}
                      onClick={() => setPage(products.totalPages - 1)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                      title="Trang cuối"
                    >
                      <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                label="Không tìm thấy sản phẩm phù hợp"
                description="Hãy thử nhập từ khóa khác hoặc xóa bộ lọc danh mục/trạng thái."
                onReset={handleResetFilters}
              />
            )
          ) : visibleCategories.length > 0 ? (
            <>
              <div className="hidden md:block overflow-x-auto w-full">
                <CategoryTable
                  items={visibleCategories}
                  onEdit={openCategory}
                  onDeactivate={(id) => void deactivate('category', id)}
                />
              </div>
              <div className="block md:hidden divide-y divide-slate-100 p-2">
                <CategoryCardList
                  items={visibleCategories}
                  onEdit={openCategory}
                  onDeactivate={(id) => void deactivate('category', id)}
                />
              </div>
            </>
          ) : (
            <EmptyState
              label="Không tìm thấy danh mục phù hợp"
              description="Hãy thử nhập từ khóa khác hoặc xóa bộ lọc trạng thái."
              onReset={handleResetFilters}
            />
          )}
        </section>
      </div>

      {/* Category Create/Edit Modal */}
      {categoryModal && (
        <Modal
          title={editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
          onClose={() => setCategoryModal(false)}
        >
          <form onSubmit={saveCategory} className="space-y-4">
            <FormField label="Mã danh mục">
              <input
                required
                maxLength={30}
                value={categoryForm.categoryCode}
                onChange={(e) => setCategoryForm({ ...categoryForm, categoryCode: e.target.value })}
                className="form-input"
                placeholder="VD: DM-DOUONG"
              />
            </FormField>
            <FormField label="Tên danh mục">
              <input
                required
                maxLength={150}
                value={categoryForm.categoryName}
                onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })}
                className="form-input"
                placeholder="VD: Đồ uống đóng chai"
              />
            </FormField>
            <FormField label="Mô tả">
              <textarea
                maxLength={500}
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="form-input"
                placeholder="Mô tả chi tiết nhóm hàng..."
              />
            </FormField>
            <FormField label="Trạng thái">
              <StatusSelect
                value={categoryForm.status}
                onChange={(value) => setCategoryForm({ ...categoryForm, status: value })}
              />
            </FormField>
            <SubmitButton saving={saving} label={editingCategory ? 'Cập nhật danh mục' : 'Tạo danh mục'} />
          </form>
        </Modal>
      )}

      {/* Product Create/Edit Modal */}
      {productModal && (
        <Modal
          title={editingProduct ? 'Cập nhật thông tin sản phẩm' : 'Thêm sản phẩm mới'}
          onClose={() => setProductModal(false)}
        >
          <form onSubmit={saveProduct} className="grid gap-x-4 sm:gap-x-5 gap-y-4 sm:gap-y-5 sm:grid-cols-2">
            <FormField label="Mã sản phẩm">
              <input
                required
                maxLength={50}
                value={productForm.productCode}
                onChange={(e) => setProductForm({ ...productForm, productCode: e.target.value })}
                className="form-input"
                placeholder="VD: SP-CAFE-01"
              />
            </FormField>
            <FormField label="Tên sản phẩm">
              <input
                required
                maxLength={255}
                value={productForm.productName}
                onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                className="form-input"
                placeholder="VD: Cà phê Robusta nguyên chất"
              />
            </FormField>

            <FormField label="Đơn giá bán (VND)" hint="Giá bán mặc định cho 1 đơn vị tính">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={productForm.salePrice}
                  onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                  placeholder="0"
                  className="form-input pr-12 font-bold text-emerald-800"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                  VND
                </span>
              </div>
            </FormField>

            <FormField label="Danh mục">
              <SelectControl
                value={productForm.categoryId}
                onChange={(value) => setProductForm({ ...productForm, categoryId: value })}
              >
                <option value="">Chưa phân loại</option>
                {categories
                  .filter((c) => c.status === 'ACTIVE')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.categoryName}
                    </option>
                  ))}
              </SelectControl>
            </FormField>

            <FormField label="Số lượng tồn kho" hint="Chỉ nhập số nguyên từ 0 trở lên">
              <div className="relative">
                <input
                  required
                  min="0"
                  step="1"
                  inputMode="numeric"
                  type="number"
                  value={productForm.quantityOnHand}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value))
                      setProductForm({ ...productForm, quantityOnHand: e.target.value });
                  }}
                  className="form-input pr-24"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                  sản phẩm
                </span>
              </div>
            </FormField>

            <FormField label="Nhóm hoạt động tính thuế">
              <SelectControl
                value={productForm.defaultTaxActivityGroupId}
                onChange={(value) => setProductForm({ ...productForm, defaultTaxActivityGroupId: value })}
              >
                <option value="">Không chọn</option>
                {taxGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </SelectControl>
            </FormField>

            <FormField label="Trạng thái">
              <StatusSelect
                value={productForm.status}
                onChange={(value) => setProductForm({ ...productForm, status: value })}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Mô tả sản phẩm">
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="form-input"
                  placeholder="Thông số kỹ thuật, quy cách đóng gói, lưu ý..."
                />
              </FormField>
            </div>

            {/* Image Management Section */}
            <div className="sm:col-span-2">
              <ImageSection
                images={productImages}
                pendingFiles={pendingFiles}
                uploading={uploadingImages}
                isCreateMode={!editingProduct}
                onUpload={editingProduct ? handleImageUpload : handlePendingFiles}
                onDelete={(id) => setDeleteConfirmId(id)}
                onSetPrimary={handleSetPrimary}
                onRemovePendingFile={(index) =>
                  setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <SubmitButton
                saving={saving}
                label={editingProduct ? 'Lưu thay đổi sản phẩm' : 'Tạo sản phẩm mới'}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation popup */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-950">Xác nhận xóa ảnh</h3>
            <p className="mt-2 text-sm text-slate-500">
              Bạn có chắc chắn muốn xóa ảnh này không? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleDeleteImage(deleteConfirmId)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 cursor-pointer"
              >
                Xóa ảnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Cart Drawer Integration */}
      <OrderCartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckout={handleCreateOrder}
      />
    </div>
  );
}

// =========================================================
// Image Section Component
// =========================================================

function ImageSection({
  images,
  pendingFiles = [],
  uploading,
  isCreateMode,
  onUpload,
  onDelete,
  onSetPrimary,
  onRemovePendingFile,
}: {
  images: ProductImage[];
  pendingFiles?: File[];
  uploading: boolean;
  isCreateMode?: boolean;
  onUpload: (files: FileList | null) => void;
  onDelete: (id: number) => void;
  onSetPrimary: (id: number) => void;
  onRemovePendingFile?: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onUpload(e.dataTransfer.files);
  };

  const totalCount = images.length + pendingFiles.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Hình ảnh sản phẩm</span>
        <span className="ml-auto text-xs text-slate-400">{totalCount}/10 ảnh</span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 sm:p-6 transition-all ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Đang tải ảnh lên...</span>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-7 w-7 sm:h-8 sm:w-8 stroke-1 text-slate-400" />
            <p className="text-xs sm:text-sm font-medium text-slate-600 text-center">
              Kéo thả ảnh vào đây hoặc nhấn để chọn
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-400 text-center">
              PNG, JPG, JPEG, WEBP • Tối đa 5MB/ảnh
              {isCreateMode && ' • Ảnh sẽ được tải lên khi lưu sản phẩm'}
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-600">
            ⏳ {pendingFiles.length} ảnh chờ tải lên
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
            {pendingFiles.map((file, index) => (
              <PendingFileThumbnail
                key={`pending-${index}-${file.name}`}
                file={file}
                onRemove={() => onRemovePendingFile?.(index)}
              />
            ))}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <img
                src={img.imageUrl}
                alt="Product"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />

              {img.isPrimary && (
                <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-lg bg-amber-500 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-sm">
                  <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" /> Đại diện
                </div>
              )}

              <div className="absolute inset-0 flex items-end justify-center gap-1.5 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPrimary(img.id);
                    }}
                    className="rounded-lg bg-white/90 p-1.5 text-amber-600 shadow-sm backdrop-blur-sm hover:bg-white cursor-pointer"
                    title="Đặt làm ảnh đại diện"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(img.id);
                  }}
                  className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm backdrop-blur-sm hover:bg-white cursor-pointer"
                  title="Xóa ảnh"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingFileThumbnail({ file, onRemove }: { file: File; onRemove: () => void }) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-amber-300 bg-amber-50">
      <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700 cursor-pointer"
        title="Bỏ ảnh"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 px-1.5 py-0.5 text-center text-[9px] font-bold text-white truncate">
        {file.name}
      </div>
    </div>
  );
}

// =========================================================
// Shared Tables & Responsive Card Components
// =========================================================

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
        active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Desktop & Tablet Table (Horizontal scroll support) */
function ProductTable({
  items,
  onEdit,
  onDeactivate,
  onAddToCart,
}: {
  items: Product[];
  onEdit: (item: Product) => void;
  onDeactivate: (id: number) => void;
  onAddToCart: (item: Product) => void;
}) {
  return (
    <table className="w-full min-w-[700px] text-left text-xs md:text-sm">
      <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
        <tr>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Sản phẩm</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Danh mục</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Đơn giá bán</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Tồn kho</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Trạng thái</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5 text-right">Thao tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 font-medium">
        {items.map((item) => {
          const price = Number(item.salePrice || 0);
          const qty = Number(item.quantityOnHand || 0);
          const unit = item.baseUnitName || 'SP';

          return (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
              <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <ProductThumbnail imageUrl={item.imageUrl} />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors truncate max-w-[170px] md:max-w-xs">
                      {item.productName}
                    </p>
                    <p className="font-mono text-[11px] md:text-xs text-slate-400">{item.productCode}</p>
                  </div>
                </div>
              </td>
              <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4 text-slate-600">
                {item.categoryName ? (
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-semibold text-slate-700">
                    {item.categoryName}
                  </span>
                ) : (
                  <span className="text-[11px] md:text-xs text-slate-400">Chưa phân loại</span>
                )}
              </td>
              <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4">
                <div className="font-bold text-slate-900">
                  {price.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[10px] md:text-[11px] text-slate-400">/ {unit}</div>
              </td>
              <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-bold whitespace-nowrap ${
                      qty > 10
                        ? 'bg-emerald-50 text-emerald-700'
                        : qty > 0
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {qty > 10 ? 'Còn hàng' : qty > 0 ? 'Sắp hết' : 'Hết hàng'}
                  </span>
                  <span className="text-[11px] md:text-xs text-slate-600">
                    ({qty.toLocaleString('vi-VN')} {unit})
                  </span>
                </div>
              </td>
              <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4 text-right">
                <div className="flex items-center justify-end gap-1 md:gap-1.5">
                  {/* Quick Add to Order with Micro-interaction */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => onAddToCart(item)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    title="Thêm vào đơn hàng"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tạo đơn</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-lg border border-slate-200 p-1 md:p-1.5 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={item.status === 'INACTIVE'}
                    onClick={() => onDeactivate(item.id)}
                    className="rounded-lg border border-slate-200 p-1 md:p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 transition-colors cursor-pointer"
                    title="Vô hiệu hóa"
                  >
                    <Archive className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Mobile Card List View (< 768px) */
function ProductCardList({
  items,
  onEdit,
  onDeactivate,
  onAddToCart,
}: {
  items: Product[];
  onEdit: (item: Product) => void;
  onDeactivate: (id: number) => void;
  onAddToCart: (item: Product) => void;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const price = Number(item.salePrice || 0);
        const qty = Number(item.quantityOnHand || 0);
        const unit = item.baseUnitName || 'SP';

        return (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
          >
            {/* Row 1: Thumbnail (40x40) + Title + Code + Category */}
            <div className="flex items-start gap-2.5">
              <ProductThumbnail imageUrl={item.imageUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">
                    {item.productName}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-[11px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {item.productCode}
                  </span>
                  {item.categoryName && (
                    <span className="truncate text-[11px] text-blue-700 bg-blue-50 font-medium px-1.5 py-0.5 rounded">
                      {item.categoryName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Price + Stock Quantity */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50/70 p-2 border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Đơn giá</span>
                <span className="text-sm font-black text-emerald-700">
                  {price.toLocaleString('vi-VN')} đ
                  <span className="text-[11px] font-normal text-slate-500"> / {unit}</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tồn kho</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    qty > 10
                      ? 'bg-emerald-100/70 text-emerald-800'
                      : qty > 0
                      ? 'bg-amber-100/70 text-amber-800'
                      : 'bg-red-100/70 text-red-800'
                  }`}
                >
                  {qty > 0 ? `${qty.toLocaleString('vi-VN')} ${unit}` : 'Hết hàng'}
                </span>
              </div>
            </div>

            {/* Row 3: Action Buttons (Tap friendly) */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => onAddToCart(item)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:bg-emerald-800 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo đơn</span>
              </motion.button>

              <button
                type="button"
                onClick={() => onEdit(item)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Sửa</span>
              </button>

              <button
                type="button"
                disabled={item.status === 'INACTIVE'}
                onClick={() => onDeactivate(item.id)}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 active:bg-red-100 disabled:opacity-30 transition-colors cursor-pointer"
                title="Vô hiệu hóa"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Desktop & Tablet Category Table */
function CategoryTable({
  items,
  onEdit,
  onDeactivate,
}: {
  items: Category[];
  onEdit: (item: Category) => void;
  onDeactivate: (id: number) => void;
}) {
  return (
    <table className="w-full min-w-[700px] text-left text-xs md:text-sm">
      <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
        <tr>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Mã</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Tên danh mục</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Mô tả</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5">Trạng thái</th>
          <th className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-3.5 text-right">Thao tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 font-medium">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
            <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4 font-mono text-[11px] md:text-xs font-bold text-slate-700">
              {item.categoryCode}
            </td>
            <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4 font-bold text-slate-900">{item.categoryName}</td>
            <td className="max-w-xs truncate px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4 text-[11px] md:text-xs text-slate-500">
              {item.description || '—'}
            </td>
            <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4">
              <StatusBadge status={item.status} />
            </td>
            <td className="px-3.5 py-2.5 md:px-3.5 md:py-3 lg:px-5 lg:py-4 text-right">
              <div className="flex justify-end gap-1 md:gap-1.5">
                <button
                  onClick={() => onEdit(item)}
                  className="rounded-lg border border-slate-200 p-1 md:p-1.5 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
                <button
                  disabled={item.status === 'INACTIVE'}
                  onClick={() => onDeactivate(item.id)}
                  className="rounded-lg border border-slate-200 p-1 md:p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors cursor-pointer"
                  title="Vô hiệu hóa"
                >
                  <Archive className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Mobile Category Card List */
function CategoryCardList({
  items,
  onEdit,
  onDeactivate,
}: {
  items: Category[];
  onEdit: (item: Category) => void;
  onDeactivate: (id: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {item.categoryCode}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{item.categoryName}</h3>
            </div>
            <StatusBadge status={item.status} />
          </div>

          {item.description && (
            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" /> Sửa
            </button>
            <button
              disabled={item.status === 'INACTIVE'}
              onClick={() => onDeactivate(item.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30"
            >
              <Archive className="h-3.5 w-3.5" /> Vô hiệu hóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductThumbnail({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <ImagePlus className="h-4 w-4 sm:h-5 sm:w-5 stroke-1" />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt="Product"
      className="h-10 w-10 flex-shrink-0 rounded-lg border border-slate-200 object-cover"
    />
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold whitespace-nowrap ${
        status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {status === 'ACTIVE' ? 'Đang kinh doanh' : 'Ngừng sử dụng'}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3 sm:gap-4 py-2.5 sm:py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-200 flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 sm:h-4 w-32 sm:w-48 rounded bg-slate-200" />
              <div className="h-3 w-20 sm:w-24 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-4 w-20 sm:w-28 rounded bg-slate-200 hidden sm:block" />
          <div className="h-4 w-16 sm:w-20 rounded bg-slate-200" />
          <div className="h-6 w-16 sm:w-20 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  label,
  description,
  onReset,
}: {
  label: string;
  description?: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex h-56 sm:h-64 flex-col items-center justify-center gap-2 sm:gap-2.5 p-4 sm:p-6 text-center text-slate-400">
      <div className="rounded-full bg-slate-100 p-3 sm:p-4 text-slate-400">
        <Boxes className="h-7 w-7 sm:h-8 sm:w-8 stroke-1" />
      </div>
      <p className="text-xs sm:text-sm font-bold text-slate-700">{label}</p>
      {description && <p className="max-w-xs text-[11px] sm:text-xs text-slate-400">{description}</p>}
      {onReset && (
        <button
          onClick={onReset}
          className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 sm:px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Đặt lại bộ lọc
        </button>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-lg sm:max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 py-3.5 sm:py-4">
          <h2 className="text-base sm:text-lg font-black text-slate-950">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 sm:p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 sm:mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 sm:mt-1.5 block text-[11px] font-medium text-slate-400">{hint}</span>}
    </label>
  );
}

function SelectControl({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input appearance-none bg-white pr-10 cursor-pointer text-xs sm:text-sm"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className="form-input cursor-pointer text-xs sm:text-sm"
    >
      <option value="ACTIVE">Đang kinh doanh</option>
      <option value="INACTIVE">Ngừng sử dụng</option>
    </select>
  );
}

function SubmitButton({ saving, label = 'Lưu thay đổi' }: { saving: boolean; label?: string }) {
  return (
    <button
      disabled={saving}
      type="submit"
      className="w-full rounded-xl bg-slate-950 px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
    >
      {saving ? 'Đang lưu dữ liệu...' : label}
    </button>
  );
}
