'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Archive, Boxes, ChevronDown, ChevronLeft, ChevronRight, FolderTree, Pencil, Plus,
  RefreshCw, Search, X,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

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

const EMPTY_CATEGORY = { categoryCode: '', categoryName: '', description: '', status: 'ACTIVE' as Status };
const EMPTY_PRODUCT = {
  productCode: '', productName: '', categoryId: '', quantityOnHand: '0', defaultTaxActivityGroupId: '',
  imageUrl: '', description: '', status: 'ACTIVE' as Status,
};

export default function ProductManagementPage() {
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<PageResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxGroups, setTaxGroups] = useState<ReferenceOption[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [categoryModal, setCategoryModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    const result = await apiClient.get<PageResponse<Category>>('/api/categories?size=100&sortBy=categoryName&direction=asc');
    setCategories(result.content);
  }, []);

  const loadReferences = useCallback(async () => {
    setTaxGroups(await apiClient.get<ReferenceOption[]>('/api/products/references/tax-activity-groups'));
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

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
      baseUnitId: editingProduct?.baseUnitId ?? null,
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
            <ProductTable items={products?.content || []} onEdit={openProduct} onDeactivate={(id) => void deactivate('product', id)} />
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
            <FormField label="Số lượng sản phẩm" hint="Chỉ nhập số nguyên từ 0 trở lên"><div className="relative"><input required min="0" step="1" inputMode="numeric" type="number" value={productForm.quantityOnHand} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setProductForm({ ...productForm, quantityOnHand: e.target.value }); }} className="form-input pr-24" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-400">sản phẩm</span></div></FormField>
            <FormField label="Nhóm hoạt động tính thuế"><SelectControl value={productForm.defaultTaxActivityGroupId} onChange={(value) => setProductForm({ ...productForm, defaultTaxActivityGroupId: value })}><option value="">Không chọn</option>{taxGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</SelectControl></FormField>
            <FormField label="Trạng thái"><StatusSelect value={productForm.status} onChange={(value) => setProductForm({ ...productForm, status: value })} /></FormField>
            <div className="sm:col-span-2"><FormField label="Đường dẫn ảnh"><input maxLength={500} type="url" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} className="form-input" /></FormField></div>
            <div className="sm:col-span-2"><FormField label="Mô tả"><textarea rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="form-input" /></FormField></div>
            <div className="sm:col-span-2"><SubmitButton saving={saving} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{icon}{label}</button>;
}

function ProductTable({ items, onEdit, onDeactivate }: { items: Product[]; onEdit: (item: Product) => void; onDeactivate: (id: number) => void }) {
  if (!items.length) return <EmptyState label="Chưa có sản phẩm phù hợp" />;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">Danh mục</th><th className="px-5 py-3">Số lượng</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-bold text-slate-900">{item.productName}</p><p className="text-xs text-slate-400">{item.productCode}</p></td><td className="px-5 py-4 text-slate-600">{item.categoryName || 'Chưa phân loại'}</td><td className="px-5 py-4 font-semibold text-slate-700">{Number(item.quantityOnHand || 0).toLocaleString('vi-VN')} sản phẩm</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><RowActions inactive={item.status === 'INACTIVE'} onEdit={() => onEdit(item)} onDeactivate={() => onDeactivate(item.id)} /></td></tr>)}</tbody></table></div>;
}

function CategoryTable({ items, onEdit, onDeactivate }: { items: Category[]; onEdit: (item: Category) => void; onDeactivate: (id: number) => void }) {
  if (!items.length) return <EmptyState label="Chưa có danh mục phù hợp" />;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Tên danh mục</th><th className="px-5 py-3">Mô tả</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-mono text-xs font-bold">{item.categoryCode}</td><td className="px-5 py-4 font-bold text-slate-900">{item.categoryName}</td><td className="max-w-xs truncate px-5 py-4 text-slate-500">{item.description || '—'}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><RowActions inactive={item.status === 'INACTIVE'} onEdit={() => onEdit(item)} onDeactivate={() => onDeactivate(item.id)} /></td></tr>)}</tbody></table></div>;
}

function RowActions({ inactive, onEdit, onDeactivate }: { inactive: boolean; onEdit: () => void; onDeactivate: () => void }) {
  return <div className="flex justify-end gap-2"><button onClick={onEdit} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title="Chỉnh sửa"><Pencil className="h-4 w-4" /></button><button disabled={inactive} onClick={onDeactivate} className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30" title="Vô hiệu hóa"><Archive className="h-4 w-4" /></button></div>;
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng sử dụng'}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-56 flex-col items-center justify-center gap-3 text-slate-400"><Boxes className="h-10 w-10 stroke-1" /><p className="text-sm font-medium">{label}</p></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><h2 className="text-lg font-black text-slate-950">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="p-6">{children}</div></div></div>;
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
