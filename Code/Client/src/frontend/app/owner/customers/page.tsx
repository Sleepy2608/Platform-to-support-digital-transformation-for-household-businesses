'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search, UserCircle, ChevronLeft, ChevronRight, RefreshCw, Phone, UserPlus,
  AlertCircle, Loader2, X, Pencil, Eye, Power, Mail, MapPin, FileText
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/app/lib/apiClient';

interface CustomerListItem {
  id: number;
  customerCode: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  debtBalance: number;
}

interface CustomerDetail extends CustomerListItem {
  address: string | null;
  note: string | null;
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

export default function OwnerCustomerDirectoryPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDetail | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const search = useCallback(async (q: string, s: string, pageNumber: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(pageNumber), size: '20' });
      if (q.trim()) params.set('keyword', q.trim());
      if (s) params.set('status', s);
      const data = await apiClient.get<PagedResult>(`/api/customers?${params}`);
      setCustomers(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void search(keyword, status, page), 300);
    return () => clearTimeout(timer);
  }, [keyword, status, page, search]);

  const handleOpenEdit = async (customerId: number) => {
    setEditLoadingId(customerId);
    setError('');
    try {
      const detail = await apiClient.get<CustomerDetail>(`/api/customers/${customerId}`);
      setEditingCustomer(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin khách hàng');
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleToggleStatus = async (customer: CustomerListItem) => {
    const nextStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (nextStatus === 'INACTIVE' && customer.debtBalance > 0) {
      setError(`Không thể vô hiệu hóa khách hàng "${customer.customerName}" vì còn nợ ${formatVnd(customer.debtBalance)}`);
      return;
    }
    const action = nextStatus === 'INACTIVE' ? 'vô hiệu hóa' : 'kích hoạt lại';
    if (!window.confirm(`Xác nhận ${action} khách hàng "${customer.customerName}"?`)) return;

    setTogglingId(customer.id);
    setError('');
    try {
      await apiClient.patch(`/api/customers/${customer.id}/status`, {
        status: nextStatus,
      });
      await search(keyword, status, page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingCustomer(null);
    void search(keyword, status, page);
  };

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Khách hàng</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Quản lý Khách hàng</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tra cứu, thêm mới và chỉnh sửa thông tin khách hàng.
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {totalElements} khách hàng
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Thêm khách hàng
          </button>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
              placeholder="Tìm kiếm theo tên, SĐT hoặc mã KH..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-500 cursor-pointer min-w-[180px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Vô hiệu hóa</option>
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : customers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <UserCircle className="h-10 w-10 opacity-40" />
              <p className="font-semibold">
                {keyword || status ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Mã KH</th>
                    <th className="px-5 py-3">Họ và tên</th>
                    <th className="px-5 py-3">Số điện thoại</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Dư nợ</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700">
                          {c.customerCode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-black text-sm">
                            {c.customerName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{c.customerName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {c.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {c.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[180px] inline-block">{c.email}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-bold ${c.debtBalance > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                          {formatVnd(c.debtBalance)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                          {c.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/owner/customers/${c.id}/purchase-history`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Xem lịch sử giao dịch"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={editLoadingId === c.id}
                            onClick={() => void handleOpenEdit(c.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
                            title="Chỉnh sửa"
                          >
                            {editLoadingId === c.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Pencil className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            disabled={togglingId === c.id}
                            onClick={() => void handleToggleStatus(c)}
                            className={`inline-flex items-center justify-center rounded-lg border p-2 transition-colors disabled:opacity-50 ${
                              c.status === 'ACTIVE'
                                ? 'border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                : 'border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                            }`}
                            title={c.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span className="font-semibold text-slate-500">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            void search(keyword, status, page);
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          key={editingCustomer.id}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

interface AddCustomerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddCustomerModal({ onClose, onSuccess }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên khách hàng');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/customers', {
        customerName: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        note: note.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Thêm khách hàng mới</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <CustomerFormFields
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            email={email} setEmail={setEmail}
            address={address} setAddress={setAddress}
            note={note} setNote={setNote}
          />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang tạo...' : 'Tạo khách hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditCustomerModalProps {
  customer: CustomerDetail;
  onClose: () => void;
  onSuccess: () => void;
}

function EditCustomerModal({ customer, onClose, onSuccess }: EditCustomerModalProps) {
  const [name, setName] = useState(customer.customerName);
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [address, setAddress] = useState(customer.address ?? '');
  const [note, setNote] = useState(customer.note ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên khách hàng');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.put(`/api/customers/${customer.id}`, {
        customerName: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        note: note.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Chỉnh sửa khách hàng</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <CustomerFormFields
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            email={email} setEmail={setEmail}
            address={address} setAddress={setAddress}
            note={note} setNote={setNote}
          />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FormFieldsProps {
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  note: string; setNote: (v: string) => void;
}

function CustomerFormFields({ name, setName, phone, setPhone, email, setEmail, address, setAddress, note, setNote }: FormFieldsProps) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-700">
          Họ và tên <span className="text-red-500">*</span>
        </span>
        <div className="relative">
          <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            required
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn An"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
          />
        </div>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">
            Số điện thoại <span className="text-red-500">*</span>
          </span>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              required
              maxLength={20}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">Email</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              maxLength={120}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
            />
          </div>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-700">Địa chỉ</span>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            maxLength={200}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Số nhà, đường, quận/huyện..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-700">Ghi chú</span>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <textarea
            maxLength={500}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú thêm về khách hàng..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all resize-none"
          />
        </div>
      </label>
    </>
  );
}
