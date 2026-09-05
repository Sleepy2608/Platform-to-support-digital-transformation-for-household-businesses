'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, CheckCircle2, Loader2, X,
  Eye, Pencil, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';
import { useDebounce } from '@/app/lib/useDebounce';
import { getRoles, isOwner } from '@/app/lib/roles';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type CustomerStatus = 'ACTIVE' | 'INACTIVE';

interface CustomerListItem {
  id: number;
  customerCode: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  debtBalance: number;
  status: CustomerStatus;
  createdAt: string;
}

interface CustomerDetail {
  id: number;
  customerCode: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  debtBalance: number;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

interface PagedResult {
  content: CustomerListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface CustomerForm {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  note: string;
}

const EMPTY_FORM: CustomerForm = {
  customerName: '', phone: '', email: '', address: '', note: '',
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<CustomerStatus, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngưng hoạt động',
};

const STATUS_STYLE: Record<CustomerStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border border-slate-200',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [ownerRole, setOwnerRole] = useState(false);

  // List state
  const [data, setData] = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [page, setPage] = useState(0);

  const debouncedKeyword = useDebounce(keyword, 300);

  // Create/Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDetail | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Detail modal
  const [detailCustomer, setDetailCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ─── Init role ───
  useEffect(() => {
    setOwnerRole(isOwner(getRoles()));
  }, []);

  // ─── Fetch customers ───
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (debouncedKeyword.trim()) params.set('keyword', debouncedKeyword.trim());
      if (statusFilter) params.set('status', statusFilter);

      const result = await apiClient.get<PagedResult>(`/api/customers?${params}`);
      setData(result);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedKeyword, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ─── Toast helper ───
  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ─── Fetch detail ───
  async function fetchDetail(id: number) {
    setDetailLoading(true);
    try {
      const result = await apiClient.get<CustomerDetail>(`/api/customers/${id}`);
      setDetailCustomer(result);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Không thể tải chi tiết khách hàng');
    } finally {
      setDetailLoading(false);
    }
  }

  // ─── Open create modal ───
  function openCreateModal() {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowFormModal(true);
  }

  // ─── Open edit modal ───
  async function openEditModal(id: number) {
    setFormError('');
    setFormLoading(true);
    setShowFormModal(true);
    try {
      const detail = await apiClient.get<CustomerDetail>(`/api/customers/${id}`);
      setEditingCustomer(detail);
      setForm({
        customerName: detail.customerName,
        phone: detail.phone ?? '',
        email: detail.email ?? '',
        address: detail.address ?? '',
        note: detail.note ?? '',
      });
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Không thể tải thông tin khách hàng');
      setShowFormModal(false);
    } finally {
      setFormLoading(false);
    }
  }

  // ─── Submit create/edit ───
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const body: Record<string, string> = { customerName: form.customerName };
      if (form.phone) body.phone = form.phone;
      if (form.email) body.email = form.email;
      if (form.address) body.address = form.address;
      if (form.note) body.note = form.note;

      if (editingCustomer) {
        await apiClient.put(`/api/customers/${editingCustomer.id}`, body);
        showToast('success', 'Cập nhật khách hàng thành công!');
      } else {
        await apiClient.post('/api/customers', body);
        showToast('success', 'Tạo khách hàng thành công!');
      }

      setShowFormModal(false);
      setEditingCustomer(null);
      setForm(EMPTY_FORM);
      fetchCustomers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setFormLoading(false);
    }
  }

  // ─── Change status ───
  async function handleChangeStatus(customer: CustomerListItem) {
    const newStatus: CustomerStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (newStatus === 'INACTIVE' && customer.debtBalance > 0) {
      showToast('error', 'Không thể vô hiệu hóa khách hàng đang có dư nợ công nợ!');
      return;
    }

    if (!confirm(
      newStatus === 'INACTIVE'
        ? `Bạn có chắc muốn vô hiệu hóa khách hàng "${customer.customerName}"?`
        : `Bạn có chắc muốn kích hoạt lại khách hàng "${customer.customerName}"?`
    )) return;

    try {
      await apiClient.patch(`/api/customers/${customer.id}/status`, { status: newStatus });
      showToast('success', newStatus === 'INACTIVE' ? 'Đã vô hiệu hóa khách hàng' : 'Đã kích hoạt lại khách hàng');
      fetchCustomers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Đổi trạng thái thất bại');
    }
  }

  // ─── Detail → Edit shortcut ───
  function detailToEdit() {
    if (!detailCustomer) return;
    setDetailCustomer(null);
    openEditModal(detailCustomer.id);
  }

  // ─── Detail → Change status shortcut ───
  async function detailToChangeStatus() {
    if (!detailCustomer) return;
    const newStatus: CustomerStatus = detailCustomer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (newStatus === 'INACTIVE' && detailCustomer.debtBalance > 0) {
      showToast('error', 'Không thể vô hiệu hóa khách hàng đang có dư nợ công nợ!');
      return;
    }

    if (!confirm(
      newStatus === 'INACTIVE'
        ? `Bạn có chắc muốn vô hiệu hóa khách hàng "${detailCustomer.customerName}"?`
        : `Bạn có chắc muốn kích hoạt lại khách hàng "${detailCustomer.customerName}"?`
    )) return;

    try {
      await apiClient.patch(`/api/customers/${detailCustomer.id}/status`, { status: newStatus });
      showToast('success', newStatus === 'INACTIVE' ? 'Đã vô hiệu hóa khách hàng' : 'Đã kích hoạt lại khách hàng');
      setDetailCustomer(null);
      fetchCustomers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Đổi trạng thái thất bại');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border pointer-events-auto transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30'
                : 'bg-red-600 text-white border-red-500 shadow-red-900/30'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0 text-white" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Quản lý Khách hàng</h1>
            <p className="text-slate-500 text-sm">
              {data ? `${data.totalElements} khách hàng` : 'Đang tải...'}
            </p>
          </div>
          <button
            id="btn-create-customer"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm khách hàng
          </button>
        </div>

        {/* ─── Search & Filter Bar ─── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-customers"
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT hoặc mã KH..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
            />
          </div>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as CustomerStatus | ''); setPage(0); }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
          </select>
          <button
            onClick={fetchCustomers}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            title="Tải lại"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Table Card ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <p className="font-medium text-sm">
                {keyword || statusFilter ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
              </p>
              {!keyword && !statusFilter && (
                <button
                  onClick={openCreateModal}
                  className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  + Thêm khách hàng đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã KH</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ và tên</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Số điện thoại</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Dư nợ</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.content.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Mã KH */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{cust.customerCode}</span>
                      </td>
                      {/* Họ tên */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 text-sm">{cust.customerName}</p>
                      </td>
                      {/* SĐT */}
                      <td className="px-4 py-4 hidden md:table-cell text-slate-600 text-sm">
                        {cust.phone ?? '—'}
                      </td>
                      {/* Email */}
                      <td className="px-4 py-4 hidden lg:table-cell text-slate-500 text-sm">
                        {cust.email ?? '—'}
                      </td>
                      {/* Dư nợ */}
                      <td className="px-4 py-4 hidden sm:table-cell text-right">
                        <span className={`text-sm font-semibold ${cust.debtBalance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {formatCurrency(cust.debtBalance)}
                        </span>
                      </td>
                      {/* Trạng thái */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLE[cust.status]}`}>
                          {STATUS_LABEL[cust.status]}
                        </span>
                      </td>
                      {/* Thao tác */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Xem chi tiết */}
                          <button
                            id={`btn-view-${cust.id}`}
                            onClick={() => fetchDetail(cust.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Sửa — chỉ Owner */}
                          {ownerRole && (
                            <button
                              id={`btn-edit-${cust.id}`}
                              onClick={() => openEditModal(cust.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {/* Đổi trạng thái — chỉ Owner */}
                          {ownerRole && (
                            <button
                              id={`btn-toggle-${cust.id}`}
                              onClick={() => handleChangeStatus(cust)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                cust.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={cust.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                            >
                              {cust.status === 'ACTIVE'
                                ? <ToggleRight className="w-4 h-4" />
                                : <ToggleLeft className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/40">
              <p className="text-xs text-slate-500">
                Trang {data.page + 1} / {data.totalPages} — {data.totalElements} khách hàng
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={data.first}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.last}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Create / Edit Modal ─── */}
        <AnimatePresence>
          {showFormModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && setShowFormModal(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900 text-base">
                    {editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                  </h2>
                  <button
                    onClick={() => { setShowFormModal(false); setEditingCustomer(null); setForm(EMPTY_FORM); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {formError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {formError}
                    </div>
                  )}

                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-customer-name"
                      type="text"
                      required
                      maxLength={150}
                      value={form.customerName}
                      onChange={(e) => setForm(f => ({ ...f, customerName: e.target.value }))}
                      placeholder="vd: Nguyễn Văn An"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Số điện thoại */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="form-phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="0912345678"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Email</label>
                      <input
                        id="form-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Địa chỉ</label>
                    <input
                      id="form-address"
                      type="text"
                      maxLength={500}
                      value={form.address}
                      onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="vd: 123 Đường ABC, Quận 1, TP.HCM"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                  </div>

                  {/* Ghi chú */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Ghi chú</label>
                    <textarea
                      id="form-note"
                      maxLength={500}
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Ghi chú thêm về khách hàng..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowFormModal(false); setEditingCustomer(null); setForm(EMPTY_FORM); }}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      id="btn-submit-form"
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingCustomer ? 'Cập nhật' : 'Tạo khách hàng'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Detail Modal ─── */}
        <AnimatePresence>
          {(detailCustomer || detailLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setDetailCustomer(null);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                {detailLoading && !detailCustomer ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
                  </div>
                ) : detailCustomer ? (
                  <>
                    {/* Detail Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                      <h2 className="font-bold text-slate-900 text-base">Chi tiết Khách hàng</h2>
                      <button
                        onClick={() => setDetailCustomer(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Detail Content */}
                    <div className="p-6 space-y-4">
                      {/* Customer code + status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{detailCustomer.customerCode}</span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLE[detailCustomer.status]}`}>
                          {STATUS_LABEL[detailCustomer.status]}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="space-y-3">
                        <DetailRow label="Họ và tên" value={detailCustomer.customerName} bold />
                        <DetailRow label="Số điện thoại" value={detailCustomer.phone} />
                        <DetailRow label="Email" value={detailCustomer.email} />
                        <DetailRow label="Địa chỉ" value={detailCustomer.address} />
                        <DetailRow label="Ghi chú" value={detailCustomer.note} />
                      </div>

                      {/* Debt balance */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Số dư công nợ</p>
                        <p className={`text-xl font-bold ${detailCustomer.debtBalance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {formatCurrency(detailCustomer.debtBalance)} <span className="text-sm font-normal">VND</span>
                        </p>
                      </div>

                      {/* Timestamps */}
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                        <div>
                          <p className="font-medium mb-0.5">Ngày tạo</p>
                          <p>{formatDate(detailCustomer.createdAt)}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-0.5">Cập nhật lần cuối</p>
                          <p>{formatDate(detailCustomer.updatedAt)}</p>
                        </div>
                      </div>

                      {/* Quick actions — chỉ Owner */}
                      {ownerRole && (
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={detailToEdit}
                            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={detailToChangeStatus}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                              detailCustomer.status === 'ACTIVE'
                                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {detailCustomer.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Detail row
// ─────────────────────────────────────────────────────────────
function DetailRow({ label, value, bold }: { label: string; value: string | null; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500 font-medium shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-right ${bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
        {value || '—'}
      </span>
    </div>
  );
}
