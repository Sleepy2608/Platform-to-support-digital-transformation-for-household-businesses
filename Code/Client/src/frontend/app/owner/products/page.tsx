'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, Boxes, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, FolderTree,
  History, Pencil, Plus, RefreshCw, Ruler, Search, ShoppingBag, ShoppingCart, X,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import {
  CartItem,
  CartResolvedPrice,
  CartUnit,
  CheckoutData,
  OrderCartDrawer,
} from '@/app/components/OrderCartDrawer';

type Status = 'ACTIVE' | 'INACTIVE';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
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

interface Product {
  id: number;
  productCode: string;
  productName: string;
  categoryId?: number;
  categoryName?: string;
  baseUnitId: number;
  baseUnitName?: string;
  quantityOnHand: number;
  defaultTaxActivityGroupId?: number;
  defaultTaxActivityGroupName?: string;
  imageUrl?: string;
  description?: string;
  status: Status;
}

interface ReferenceOption {
  id: number;
  code: string;
  name: string;
}

interface ProductUnit {
  id: number;
  productId: number;
  unitId: number;
  unitName: string;
  unitCode: string;
  conversionRate: number;
  baseUnit: boolean;
  status: Status;
}

interface ProductPrice {
  id: number;
  productUnitId: number;
  unitId: number;
  unitName: string;
  salePrice: number;
  ruleName: string;
  status: Status;
  effectiveFrom: string;
  effectiveTo?: string;
  changedBy?: number;
}

interface SalesOrderResponse {
  orderCode: string;
}

const EMPTY_CATEGORY = { categoryCode: '', categoryName: '', description: '', status: 'ACTIVE' as Status };
const EMPTY_PRODUCT = {
  productCode: '', productName: '', categoryId: '', baseUnitId: '', quantityOnHand: '0', defaultTaxActivityGroupId: '',
  imageUrl: '', description: '', status: 'ACTIVE' as Status,
};

export default function ProductManagementPage() {
  const nextCartKey = useRef(1);
  const cartResolveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<PageResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxGroups, setTaxGroups] = useState<ReferenceOption[]>([]);
  const [units, setUnits] = useState<ReferenceOption[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [categoryModal, setCategoryModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [unitModal, setUnitModal] = useState(false);
  const [priceModal, setPriceModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [unitProduct, setUnitProduct] = useState<Product | null>(null);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [editingProductUnit, setEditingProductUnit] = useState<ProductUnit | null>(null);
  const [unitForm, setUnitForm] = useState({ unitId: '', conversionRate: '1' });
  const [priceProduct, setPriceProduct] = useState<Product | null>(null);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [priceHistory, setPriceHistory] = useState<ProductPrice[]>([]);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);
  const [priceForm, setPriceForm] = useState({ productUnitId: '', salePrice: '', ruleName: '' });
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const cartQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + parseQuantity(item.quantity), 0),
    [cartItems],
  );

  const loadCategories = useCallback(async () => {
    const result = await apiClient.get<PageResponse<Category>>('/api/categories?size=100&sortBy=categoryName&direction=asc');
    setCategories(result.content);
  }, []);

  const loadReferences = useCallback(async () => {
    const [taxGroupResult, unitResult] = await Promise.all([
      apiClient.get<ReferenceOption[]>('/api/products/references/tax-activity-groups'),
      apiClient.get<ReferenceOption[]>('/api/products/references/units'),
    ]);
    setTaxGroups(taxGroupResult);
    setUnits(unitResult);
  }, []);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), size: '10' });
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (status) params.set('status', status);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    const result = await apiClient.get<PageResponse<Product>>(`/api/products?${params}`);
    setProducts(result);
  }, [categoryFilter, keyword, page, status]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadProducts(), loadCategories(), loadReferences()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadProducts, loadReferences]);

  useEffect(() => {
    // Data is loaded when filters or the current page change.
    void reload();
  }, [reload]);

  useEffect(() => {
    const timers = cartResolveTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

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
      baseUnitId: String(product.baseUnitId),
      quantityOnHand: String(product.quantityOnHand ?? 0),
      defaultTaxActivityGroupId: product.defaultTaxActivityGroupId ? String(product.defaultTaxActivityGroupId) : '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      status: product.status,
    } : EMPTY_PRODUCT);
    setProductModal(true);
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingCategory) {
        await apiClient.put(`/api/categories/${editingCategory.id}`, categoryForm);
      } else {
        await apiClient.post('/api/categories', categoryForm);
      }
      setCategoryModal(false);
      showNotice(editingCategory ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...productForm,
      categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
      baseUnitId: productForm.baseUnitId ? Number(productForm.baseUnitId) : null,
      quantityOnHand: Number(productForm.quantityOnHand),
      defaultTaxActivityGroupId: productForm.defaultTaxActivityGroupId
        ? Number(productForm.defaultTaxActivityGroupId) : null,
    };
    try {
      if (editingProduct) {
        await apiClient.put(`/api/products/${editingProduct.id}`, payload);
      } else {
        await apiClient.post('/api/products', payload);
      }
      setProductModal(false);
      showNotice(editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const loadProductUnits = async (productId: number) => {
    setProductUnits(await apiClient.get<ProductUnit[]>(`/api/products/${productId}/units`));
  };

  const openUnits = async (product: Product) => {
    setUnitProduct(product);
    setEditingProductUnit(null);
    setUnitForm({ unitId: '', conversionRate: '1' });
    setUnitModal(true);
    setError('');
    try {
      await loadProductUnits(product.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải đơn vị tính');
    }
  };

  const editUnit = (productUnit: ProductUnit) => {
    setEditingProductUnit(productUnit);
    setUnitForm({ unitId: String(productUnit.unitId), conversionRate: String(productUnit.conversionRate) });
  };

  const saveUnit = async (event: FormEvent) => {
    event.preventDefault();
    if (!unitProduct) return;
    const conversionRate = Number(unitForm.conversionRate.replace(',', '.'));
    if (!Number.isFinite(conversionRate) || conversionRate <= 0) {
      setError('Tỷ lệ quy đổi phải là số lớn hơn 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingProductUnit) {
        await apiClient.put(`/api/products/${unitProduct.id}/units/${editingProductUnit.id}`, {
          conversionRate,
        });
      } else {
        await apiClient.post(`/api/products/${unitProduct.id}/units`, {
          unitId: Number(unitForm.unitId),
          conversionRate,
        });
      }
      setEditingProductUnit(null);
      setUnitForm({ unitId: '', conversionRate: '1' });
      await loadProductUnits(unitProduct.id);
      showNotice(editingProductUnit ? 'Đã cập nhật tỷ lệ quy đổi' : 'Đã thêm đơn vị tính');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu đơn vị tính');
    } finally {
      setSaving(false);
    }
  };

  const deactivateUnit = async (productUnitId: number) => {
    if (!unitProduct || !window.confirm('Bạn chắc chắn muốn xóa đơn vị quy đổi này?')) return;
    try {
      await apiClient.delete(`/api/products/${unitProduct.id}/units/${productUnitId}`);
      await loadProductUnits(unitProduct.id);
      showNotice('Đã xóa đơn vị quy đổi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa đơn vị tính');
    }
  };

  const loadPrices = async (productId: number) => {
    const [unitResult, priceResult] = await Promise.all([
      apiClient.get<ProductUnit[]>(`/api/products/${productId}/units`),
      apiClient.get<ProductPrice[]>(`/api/products/${productId}/prices`),
    ]);
    setProductUnits(unitResult);
    setPrices(priceResult);
  };

  const openPrices = async (product: Product) => {
    setPriceProduct(product);
    setEditingPrice(null);
    setPriceForm({ productUnitId: '', salePrice: '', ruleName: '' });
    setShowPriceHistory(false);
    setPriceHistory([]);
    setPriceModal(true);
    setError('');
    try {
      await loadPrices(product.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải bảng giá');
    }
  };

  const editPrice = (price: ProductPrice) => {
    setEditingPrice(price);
    setPriceForm({
      productUnitId: String(price.productUnitId),
      salePrice: String(price.salePrice),
      ruleName: price.ruleName || '',
    });
  };

  const savePrice = async (event: FormEvent) => {
    event.preventDefault();
    if (!priceProduct) return;
    const salePrice = Number(priceForm.salePrice.replace(',', '.'));
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      setError('Đơn giá phải là số hợp lệ, không được âm');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingPrice) {
        await apiClient.put(`/api/products/${priceProduct.id}/prices/${editingPrice.id}`, {
          salePrice,
          ruleName: priceForm.ruleName,
        });
      } else {
        await apiClient.post(`/api/products/${priceProduct.id}/prices`, {
          productUnitId: Number(priceForm.productUnitId),
          salePrice,
          ruleName: priceForm.ruleName,
        });
      }
      setEditingPrice(null);
      setPriceForm({ productUnitId: '', salePrice: '', ruleName: '' });
      setPriceHistory([]);
      await loadPrices(priceProduct.id);
      showNotice(editingPrice ? 'Đã cập nhật và lưu lịch sử giá' : 'Đã thêm mức giá');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu mức giá');
    } finally {
      setSaving(false);
    }
  };

  const deactivatePrice = async (priceId: number) => {
    if (!priceProduct || !window.confirm('Bạn chắc chắn muốn ngừng áp dụng mức giá này?')) return;
    try {
      await apiClient.delete(`/api/products/${priceProduct.id}/prices/${priceId}`);
      setPriceHistory([]);
      await loadPrices(priceProduct.id);
      showNotice('Đã ngừng áp dụng mức giá');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ngừng áp dụng mức giá');
    }
  };

  const togglePriceHistory = async () => {
    if (!priceProduct) return;
    const nextValue = !showPriceHistory;
    setShowPriceHistory(nextValue);
    if (nextValue && !priceHistory.length) {
      try {
        setPriceHistory(await apiClient.get<ProductPrice[]>(`/api/products/${priceProduct.id}/prices/history`));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải lịch sử giá');
      }
    }
  };

  const deactivate = async (kind: 'product' | 'category', id: number) => {
    if (!window.confirm(`Bạn chắc chắn muốn vô hiệu hóa ${kind === 'product' ? 'sản phẩm' : 'danh mục'} này?`)) return;
    try {
      await apiClient.delete(`/api/${kind === 'product' ? 'products' : 'categories'}/${id}`);
      showNotice('Đã vô hiệu hóa thành công');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể vô hiệu hóa');
    }
  };

  const patchCartItem = (key: number, patch: Partial<CartItem>) => {
    setCartItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  };

  const resolveCartItem = async (
    key: number,
    productId: number,
    unitId: number,
    quantity: string,
  ) => {
    const parsedQuantity = parseQuantity(quantity);
    if (!parsedQuantity) {
      patchCartItem(key, { resolving: false, resolved: undefined, error: 'Số lượng phải lớn hơn 0' });
      return;
    }

    patchCartItem(key, { resolving: true, resolved: undefined, error: undefined });
    try {
      const resolved = await apiClient.post<CartResolvedPrice>('/api/product-prices/resolve', {
        productId,
        unitId,
        quantity: parsedQuantity,
      });
      setCartItems((current) => current.map((item) => {
        const unchanged = item.key === key
          && item.productId === productId
          && item.unitId === unitId
          && item.quantity === quantity;
        return unchanged ? { ...item, resolving: false, resolved, error: undefined } : item;
      }));
    } catch (err) {
      setCartItems((current) => current.map((item) => {
        const unchanged = item.key === key
          && item.productId === productId
          && item.unitId === unitId
          && item.quantity === quantity;
        return unchanged ? {
          ...item,
          resolving: false,
          resolved: undefined,
          error: err instanceof Error ? err.message : 'Không thể tính giá',
        } : item;
      }));
    }
  };

  const scheduleCartResolve = (
    key: number,
    productId: number,
    unitId: number,
    quantity: string,
  ) => {
    clearTimeout(cartResolveTimers.current[key]);
    cartResolveTimers.current[key] = setTimeout(
      () => void resolveCartItem(key, productId, unitId, quantity),
      300,
    );
  };

  const maximumCartQuantity = (item: CartItem, unitId: number) => {
    const selectedUnit = item.units.find((unit) => unit.unitId === unitId);
    const selectedRate = Number(selectedUnit?.conversionRate || 0);
    if (selectedRate <= 0) return 0;

    const usedByOtherLines = cartItems
      .filter((candidate) => candidate.productId === item.productId && candidate.key !== item.key)
      .reduce((total, candidate) => {
        const candidateUnit = candidate.units.find((unit) => unit.unitId === candidate.unitId);
        return total + parseQuantity(candidate.quantity) * Number(candidateUnit?.conversionRate || 0);
      }, 0);
    const remainingBaseQuantity = Math.max(0, Number(item.quantityOnHand || 0) - usedByOtherLines);
    return remainingBaseQuantity / selectedRate;
  };

  const changeCartQuantity = (key: number, quantity: string) => {
    if (!/^\d*(?:[.,]\d{0,3})?$/.test(quantity)) return;
    const item = cartItems.find((candidate) => candidate.key === key);
    if (!item) return;
    const maximum = maximumCartQuantity(item, item.unitId);
    if (parseQuantity(quantity) > maximum + 0.000001) {
      const unitName = item.units.find((unit) => unit.unitId === item.unitId)?.unitName || 'đơn vị';
      patchCartItem(key, {
        stockWarning: `Chỉ còn tối đa ${formatQuantity(maximum)} ${unitName} trong kho`,
      });
      return;
    }
    patchCartItem(key, { quantity, resolving: true, resolved: undefined, error: undefined, stockWarning: undefined });
    scheduleCartResolve(key, item.productId, item.unitId, quantity);
  };

  const addProductToCart = async (product: Product) => {
    if (product.status !== 'ACTIVE') return;
    setError('');
    if (Number(product.quantityOnHand || 0) <= 0) {
      setError(`Sản phẩm ${product.productName} đã hết hàng`);
      return;
    }
    setCartOpen(true);

    const existingBaseItem = cartItems.find(
      (item) => item.productId === product.id && item.unitId === product.baseUnitId,
    );
    if (existingBaseItem) {
      const nextQuantity = String(
        Math.round((parseQuantity(existingBaseItem.quantity) + 1) * 1000) / 1000,
      );
      changeCartQuantity(existingBaseItem.key, nextQuantity);
      return;
    }

    try {
      const configuredUnits = await apiClient.get<CartUnit[]>(`/api/products/${product.id}/units`);
      const preferredUnit = configuredUnits.find((unit) => unit.unitId === product.baseUnitId)
        || configuredUnits.find((unit) => unit.baseUnit)
        || configuredUnits[0];
      if (!preferredUnit) throw new Error('Sản phẩm chưa được cấu hình đơn vị tính');

      const key = nextCartKey.current++;
      const item: CartItem = {
        key,
        productId: product.id,
        productCode: product.productCode,
        productName: product.productName,
        imageUrl: product.imageUrl,
        baseUnitName: product.baseUnitName,
        quantityOnHand: product.quantityOnHand,
        unitId: preferredUnit.unitId,
        quantity: '1',
        units: configuredUnits,
        resolving: true,
      };
      setCartItems((current) => [...current, item]);
      void resolveCartItem(key, product.id, preferredUnit.unitId, '1');
    } catch (err) {
      setCartOpen(false);
      setError(err instanceof Error ? err.message : 'Không thể thêm sản phẩm vào đơn');
    }
  };

  const changeCartUnit = (key: number, unitId: number) => {
    const item = cartItems.find((candidate) => candidate.key === key);
    if (!item) return;
    const maximum = maximumCartQuantity(item, unitId);
    const currentQuantity = parseQuantity(item.quantity);
    const nextQuantity = currentQuantity > maximum
      ? formatQuantityInput(maximum)
      : item.quantity;
    const unitName = item.units.find((unit) => unit.unitId === unitId)?.unitName || 'đơn vị';
    if (maximum <= 0) {
      patchCartItem(key, {
        unitId,
        quantity: '',
        resolving: false,
        resolved: undefined,
        error: 'Không đủ tồn kho cho đơn vị đã chọn',
        stockWarning: undefined,
      });
      return;
    }
    patchCartItem(key, {
      unitId,
      quantity: nextQuantity,
      resolving: true,
      resolved: undefined,
      error: undefined,
      stockWarning: currentQuantity > maximum
        ? `Số lượng đã được điều chỉnh còn ${formatQuantity(maximum)} ${unitName}`
        : undefined,
    });
    scheduleCartResolve(key, item.productId, unitId, nextQuantity);
  };

  const removeCartItem = (key: number) => {
    clearTimeout(cartResolveTimers.current[key]);
    setCartItems((current) => current.filter((item) => item.key !== key));
  };

  const clearCart = () => {
    Object.values(cartResolveTimers.current).forEach(clearTimeout);
    cartResolveTimers.current = {};
    setCartItems([]);
  };

  const checkoutCart = async (data: CheckoutData) => {
    const result = await apiClient.post<SalesOrderResponse>('/api/sales-orders', {
      orderCode: data.orderCode,
      source: data.source,
      paidAmount: data.paidAmount,
      note: data.note,
      items: cartItems.map((item) => ({
        productId: item.productId,
        unitId: item.unitId,
        quantity: parseQuantity(item.quantity),
      })),
    });
    await loadProducts();
    return { orderCode: result.orderCode };
  };

  const visibleCategories = categories.filter((item) => {
    const matchesKeyword = !keyword.trim() || `${item.categoryCode} ${item.categoryName}`.toLowerCase().includes(keyword.toLowerCase());
    return matchesKeyword && (!status || item.status === status);
  });

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">HBDT-25</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Sản phẩm & Danh mục</h1>
            <p className="mt-2 text-sm text-slate-500">Quản lý danh mục hàng hóa riêng của hộ kinh doanh.</p>
          </div>
          <button
            onClick={() => tab === 'products' ? openProduct() : openCategory()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Thêm {tab === 'products' ? 'sản phẩm' : 'danh mục'}
          </button>
        </header>

        {(error || notice) && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-2">
            <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={<Boxes className="h-4 w-4" />} label="Sản phẩm" />
            <TabButton active={tab === 'categories'} onClick={() => setTab('categories')} icon={<FolderTree className="h-4 w-4" />} label="Danh mục" />
          </div>

          <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_180px_220px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(0); }} placeholder="Tìm theo mã hoặc tên..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500" />
            </label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none">
              <option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng sử dụng</option>
            </select>
            {tab === 'products' ? (
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none">
                <option value="">Tất cả danh mục</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.categoryName}</option>)}
              </select>
            ) : <div />}
            <button onClick={() => void reload()} className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50" title="Tải lại"><RefreshCw className="h-4 w-4" /></button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải...</div>
          ) : tab === 'products' ? (
            <ProductTable items={products?.content || []} onAddToOrder={(item) => void addProductToCart(item)} onEdit={openProduct} onUnits={(item) => void openUnits(item)} onPrices={(item) => void openPrices(item)} onDeactivate={(id) => void deactivate('product', id)} />
          ) : (
            <CategoryTable items={visibleCategories} onEdit={openCategory} onDeactivate={(id) => void deactivate('category', id)} />
          )}

          {tab === 'products' && products && products.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
              <span>{products.totalElements} sản phẩm</span>
              <div className="flex items-center gap-2">
                <button disabled={products.first} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-lg border p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                <span>Trang {products.page + 1}/{products.totalPages}</span>
                <button disabled={products.last} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </section>
      </div>

      {categoryModal && (
        <Modal title={editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục'} onClose={() => setCategoryModal(false)}>
          <form onSubmit={saveCategory} className="space-y-4">
            <FormField label="Mã danh mục"><input required maxLength={30} value={categoryForm.categoryCode} onChange={(e) => setCategoryForm({ ...categoryForm, categoryCode: e.target.value })} className="form-input" /></FormField>
            <FormField label="Tên danh mục"><input required maxLength={150} value={categoryForm.categoryName} onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })} className="form-input" /></FormField>
            <FormField label="Mô tả"><textarea maxLength={500} rows={3} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="form-input" /></FormField>
            <FormField label="Trạng thái"><StatusSelect value={categoryForm.status} onChange={(value) => setCategoryForm({ ...categoryForm, status: value })} /></FormField>
            <SubmitButton saving={saving} />
          </form>
        </Modal>
      )}

      {productModal && (
        <Modal title={editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'} onClose={() => setProductModal(false)}>
          <form onSubmit={saveProduct} className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <FormField label="Mã sản phẩm"><input required maxLength={50} value={productForm.productCode} onChange={(e) => setProductForm({ ...productForm, productCode: e.target.value })} className="form-input" /></FormField>
            <FormField label="Tên sản phẩm"><input required maxLength={255} value={productForm.productName} onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })} className="form-input" /></FormField>
            <FormField label="Danh mục"><SelectControl value={productForm.categoryId} onChange={(value) => setProductForm({ ...productForm, categoryId: value })}><option value="">Chưa phân loại</option>{categories.filter((c) => c.status === 'ACTIVE').map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}</SelectControl></FormField>
            <FormField label="Đơn vị tính chuẩn" hint={editingProduct ? 'Không thể đổi sau khi đã tạo sản phẩm' : 'Tồn kho sẽ được lưu theo đơn vị này'}><SelectControl value={productForm.baseUnitId} onChange={(value) => setProductForm({ ...productForm, baseUnitId: value })}><option value="">Chọn đơn vị tính</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</SelectControl></FormField>
            <FormField label="Số lượng ban đầu" hint="Cho phép tối đa 3 chữ số thập phân"><div className="relative"><input required min="0" step="0.001" inputMode="decimal" type="number" value={productForm.quantityOnHand} onChange={(e) => setProductForm({ ...productForm, quantityOnHand: e.target.value })} className="form-input pr-24" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-400">{units.find((unit) => String(unit.id) === productForm.baseUnitId)?.name || editingProduct?.baseUnitName || 'đơn vị'}</span></div></FormField>
            <FormField label="Nhóm hoạt động tính thuế"><SelectControl value={productForm.defaultTaxActivityGroupId} onChange={(value) => setProductForm({ ...productForm, defaultTaxActivityGroupId: value })}><option value="">Không chọn</option>{taxGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</SelectControl></FormField>
            <FormField label="Trạng thái"><StatusSelect value={productForm.status} onChange={(value) => setProductForm({ ...productForm, status: value })} /></FormField>
            <div className="sm:col-span-2"><FormField label="Đường dẫn ảnh"><input maxLength={500} type="url" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} className="form-input" /></FormField></div>
            <div className="sm:col-span-2"><FormField label="Mô tả"><textarea rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="form-input" /></FormField></div>
            <div className="sm:col-span-2"><SubmitButton saving={saving} /></div>
          </form>
        </Modal>
      )}

      {unitModal && unitProduct && (
        <Modal title={`Đơn vị tính — ${unitProduct.productName}`} onClose={() => setUnitModal(false)}>
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Đơn vị chuẩn: <strong>{unitProduct.baseUnitName}</strong>. Mọi tồn kho đều được tự động quy đổi về đơn vị này.
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-4 py-3">Đơn vị</th><th className="px-4 py-3">Quy đổi</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {productUnits.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold">{item.unitName} {item.baseUnit && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Chuẩn</span>}</td><td className="px-4 py-3 text-slate-600">1 {item.unitName} = {Number(item.conversionRate).toLocaleString('vi-VN')} {unitProduct.baseUnitName}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" disabled={item.baseUnit} onClick={() => editUnit(item)} className="rounded-lg border p-2 text-slate-600 disabled:opacity-30" title="Sửa tỷ lệ"><Pencil className="h-4 w-4" /></button><button type="button" disabled={item.baseUnit} onClick={() => void deactivateUnit(item.id)} className="rounded-lg border p-2 text-red-600 disabled:opacity-30" title="Xóa đơn vị"><Archive className="h-4 w-4" /></button></div></td></tr>)}
                </tbody>
              </table>
            </div>

            <form onSubmit={saveUnit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <FormField label="Đơn vị quy đổi"><select required disabled={Boolean(editingProductUnit)} value={unitForm.unitId} onChange={(e) => setUnitForm({ ...unitForm, unitId: e.target.value })} className="form-input"><option value="">Chọn đơn vị</option>{units.filter((unit) => unit.id !== unitProduct.baseUnitId && !productUnits.some((configured) => configured.unitId === unit.id && configured.id !== editingProductUnit?.id)).map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></FormField>
              <FormField label={`1 đơn vị bằng bao nhiêu ${unitProduct.baseUnitName}`}><input required type="text" inputMode="decimal" pattern="^(?:0|[1-9]\d*)(?:[.,]\d{0,6})?$" title="Nhập số lớn hơn 0, tối đa 6 chữ số thập phân" value={unitForm.conversionRate} onChange={(e) => { const value = e.target.value; if (/^\d*(?:[.,]\d{0,6})?$/.test(value)) setUnitForm({ ...unitForm, conversionRate: value }); }} className="form-input" placeholder="Ví dụ: 10" /></FormField>
              <div className="flex gap-2"><button disabled={saving} type="submit" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{editingProductUnit ? 'Cập nhật' : 'Thêm'}</button>{editingProductUnit && <button type="button" onClick={() => { setEditingProductUnit(null); setUnitForm({ unitId: '', conversionRate: '1' }); }} className="rounded-xl border px-4 py-3 text-sm font-bold">Hủy</button>}</div>
            </form>
          </div>
        </Modal>
      )}

      {priceModal && priceProduct && (
        <Modal title={`Bảng giá — ${priceProduct.productName}`} onClose={() => setPriceModal(false)} wide>
          <div className="space-y-5">
            <div className="flex justify-end">
              <button type="button" onClick={() => void togglePriceHistory()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"><History className="h-4 w-4" /> {showPriceHistory ? 'Giá hiện hành' : 'Lịch sử giá'}</button>
            </div>

            {showPriceHistory ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-3 py-3">Đơn vị</th><th className="px-3 py-3">Giá bán</th><th className="px-3 py-3">Số lượng</th><th className="px-3 py-3">Đơn giá</th><th className="w-56 px-3 py-3">Hiệu lực</th><th className="w-36 px-3 py-3">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">{priceHistory.map((item) => <tr key={`${item.id}-${item.effectiveFrom}`}><td className="break-words px-3 py-3 font-semibold">{item.unitName}</td><td className="break-words px-3 py-3 font-medium text-slate-700">{item.ruleName}</td><td className="px-3 py-3 text-slate-600">1 {item.unitName}</td><td className="px-3 py-3 font-bold">{formatVnd(item.salePrice)}</td><td className="px-3 py-3 text-xs text-slate-500">{formatDateTime(item.effectiveFrom)}{item.effectiveTo ? ` → ${formatDateTime(item.effectiveTo)}` : ' → hiện tại'}</td><td className="px-3 py-3"><StatusBadge status={item.status} /></td></tr>)}</tbody></table>
                {!priceHistory.length && <div className="p-6 text-center text-sm text-slate-400">Chưa có lịch sử thay đổi giá</div>}
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-3 py-3">Đơn vị</th><th className="px-3 py-3">Giá bán</th><th className="px-3 py-3">Số lượng</th><th className="px-3 py-3">Đơn giá</th><th className="w-28 px-3 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{prices.map((item) => <tr key={item.id}><td className="break-words px-3 py-3 font-semibold">{item.unitName}</td><td className="break-words px-3 py-3 font-medium text-slate-700">{item.ruleName}</td><td className="px-3 py-3 text-slate-600">1 {item.unitName}</td><td className="px-3 py-3 font-black text-slate-900">{formatVnd(item.salePrice)}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => editPrice(item)} className="rounded-lg border p-2 text-slate-600" title="Sửa giá"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void deactivatePrice(item.id)} className="rounded-lg border p-2 text-red-600" title="Ngừng áp dụng"><Archive className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>
                  {!prices.length && <div className="p-6 text-center text-sm text-slate-400">Chưa thiết lập giá bán cho sản phẩm</div>}
                </div>

                <form onSubmit={savePrice} className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Đơn vị bán"><select required disabled={Boolean(editingPrice)} value={priceForm.productUnitId} onChange={(e) => setPriceForm({ ...priceForm, productUnitId: e.target.value })} className="form-input"><option value="">Chọn đơn vị</option>{productUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitName}{unit.baseUnit ? ' (chuẩn)' : ''}</option>)}</select></FormField>
                  <FormField label="Giá bán" hint="Ví dụ: Giá mặc định, giá sỉ"><input maxLength={150} value={priceForm.ruleName} onChange={(e) => setPriceForm({ ...priceForm, ruleName: e.target.value })} className="form-input" placeholder="Tự đặt tên hoặc để trống" /></FormField>
                  <FormField label="Đơn giá"><input required type="text" inputMode="decimal" value={priceForm.salePrice} onChange={(e) => { const value = e.target.value; if (/^\d*(?:[.,]\d{0,2})?$/.test(value)) setPriceForm({ ...priceForm, salePrice: value }); }} className="form-input" placeholder="Ví dụ: 150000" /></FormField>
                  <div className="flex gap-2 sm:col-span-2"><button disabled={saving} type="submit" className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{editingPrice ? 'Cập nhật giá' : 'Thêm giá bán'}</button>{editingPrice && <button type="button" onClick={() => { setEditingPrice(null); setPriceForm({ productUnitId: '', salePrice: '', ruleName: '' }); }} className="rounded-xl border px-5 py-3 text-sm font-bold">Hủy</button>}</div>
                </form>
              </>
            )}
          </div>
        </Modal>
      )}

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
      >
        <ShoppingBag className="h-5 w-5 text-emerald-600" />
        <span>Đơn hàng</span>
        <span className="min-w-7 rounded-full bg-emerald-600 px-2 py-1 text-center text-xs text-white">
          {formatQuantity(cartQuantity)}
        </span>
      </button>

      <OrderCartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onChangeUnit={changeCartUnit}
        onChangeQuantity={changeCartQuantity}
        onRemoveItem={removeCartItem}
        onClearCart={clearCart}
        onCheckout={checkoutCart}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{icon}{label}</button>;
}

function ProductTable({ items, onAddToOrder, onEdit, onUnits, onPrices, onDeactivate }: { items: Product[]; onAddToOrder: (item: Product) => void; onEdit: (item: Product) => void; onUnits: (item: Product) => void; onPrices: (item: Product) => void; onDeactivate: (id: number) => void }) {
  if (!items.length) return <EmptyState label="Chưa có sản phẩm phù hợp" />;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">Danh mục</th><th className="px-5 py-3">Số lượng</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-bold text-slate-900">{item.productName}</p><p className="text-xs text-slate-400">{item.productCode}</p></td><td className="px-5 py-4 text-slate-600">{item.categoryName || 'Chưa phân loại'}</td><td className="px-5 py-4 font-semibold text-slate-700">{Number(item.quantityOnHand || 0).toLocaleString('vi-VN')} {item.baseUnitName || 'đơn vị'}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button disabled={item.status !== 'ACTIVE'} onClick={() => onAddToOrder(item)} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30" title="Thêm vào đơn hàng"><ShoppingCart className="h-4 w-4" /></button><button onClick={() => onPrices(item)} className="rounded-lg border border-slate-200 p-2 text-emerald-600 hover:bg-emerald-50" title="Quản lý giá bán"><CircleDollarSign className="h-4 w-4" /></button><button onClick={() => onUnits(item)} className="rounded-lg border border-slate-200 p-2 text-indigo-600 hover:bg-indigo-50" title="Quản lý đơn vị tính"><Ruler className="h-4 w-4" /></button><RowActions inactive={item.status === 'INACTIVE'} onEdit={() => onEdit(item)} onDeactivate={() => onDeactivate(item.id)} /></div></td></tr>)}</tbody></table></div>;
}

function CategoryTable({ items, onEdit, onDeactivate }: { items: Category[]; onEdit: (item: Category) => void; onDeactivate: (id: number) => void }) {
  if (!items.length) return <EmptyState label="Chưa có danh mục phù hợp" />;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Tên danh mục</th><th className="px-5 py-3">Mô tả</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-mono text-xs font-bold">{item.categoryCode}</td><td className="px-5 py-4 font-bold text-slate-900">{item.categoryName}</td><td className="max-w-xs truncate px-5 py-4 text-slate-500">{item.description || '—'}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><RowActions inactive={item.status === 'INACTIVE'} onEdit={() => onEdit(item)} onDeactivate={() => onDeactivate(item.id)} /></td></tr>)}</tbody></table></div>;
}

function RowActions({ inactive, onEdit, onDeactivate }: { inactive: boolean; onEdit: () => void; onDeactivate: () => void }) {
  return <div className="flex justify-end gap-2"><button onClick={onEdit} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title="Chỉnh sửa"><Pencil className="h-4 w-4" /></button><button disabled={inactive} onClick={onDeactivate} className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30" title="Vô hiệu hóa"><Archive className="h-4 w-4" /></button></div>;
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng sử dụng'}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-56 flex-col items-center justify-center gap-3 text-slate-400"><Boxes className="h-10 w-10 stroke-1" /><p className="text-sm font-medium">{label}</p></div>;
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}><div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><h2 className="text-lg font-black text-slate-950">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="p-6">{children}</div></div></div>;
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}{hint && <span className="mt-1.5 block text-xs font-medium text-slate-400">{hint}</span>}</label>;
}

function SelectControl({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className="relative"><select value={value} onChange={(e) => onChange(e.target.value)} className="form-input appearance-none bg-white pr-10">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></div>;
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value as Status)} className="form-input"><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng sử dụng</option></select>;
}

function SubmitButton({ saving }: { saving: boolean }) {
  return <button disabled={saving} type="submit" className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>;
}

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function parseQuantity(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function formatQuantityInput(value: number) {
  return String(Math.floor(Math.max(0, value) * 1000) / 1000);
}
