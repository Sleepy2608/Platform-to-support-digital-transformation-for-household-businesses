'use client';

import { useEffect, useState } from 'react';
import { 
  Users, UserPlus, Edit2, Trash2, Search, X, 
  Check, AlertTriangle, Eye, EyeOff, Loader2, Phone, Mail, User, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthItem } from '../../lib/apiClient';
import { isAdmin, type AppRole } from '../../lib/roles';

interface AdminAccount {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';
  createdAt: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AdminAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isRootAdmin, setIsRootAdmin] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Selected account for edit or delete
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    const token = sessionStorage.getItem('accessToken');
    try {
      const response = await fetch('http://localhost:8080/api/admin/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy danh sách tài khoản');
      }
      if (data.success && Array.isArray(data.data)) {
        setAccounts(data.data);
        setFilteredAccounts(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const rolesStr = getAuthItem('roles');
      if (rolesStr) {
        const roles = JSON.parse(rolesStr) as AppRole[];
        setIsRootAdmin(isAdmin(roles));
      }
    } catch (e) {
      console.error(e);
    }
    fetchAccounts();
  }, []);

  // Search filter
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(acc => 
        acc.fullName.toLowerCase().includes(query) ||
        acc.username.toLowerCase().includes(query) ||
        acc.email.toLowerCase().includes(query) ||
        (acc.phone && acc.phone.includes(query))
      );
      setFilteredAccounts(filtered);
    }
  }, [searchQuery, accounts]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const validateForm = (isEdit = false) => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Họ và tên không được để trống';
    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!isEdit) {
      if (!formData.username.trim()) {
        errors.username = 'Tên đăng nhập không được để trống';
      } else if (formData.username.length < 4) {
        errors.username = 'Tên đăng nhập phải từ 4 ký tự trở lên';
      }
      if (!formData.password) {
        errors.password = 'Mật khẩu không được để trống';
      } else if (formData.password.length < 6) {
        errors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
      }
    } else {
      if (formData.password && formData.password.length < 6) {
        errors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setActionLoading(true);
    const token = sessionStorage.getItem('accessToken');
    try {
      const response = await fetch('http://localhost:8080/api/admin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone
        })
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Lỗi thêm tài khoản');
      }

      showSuccess('Thêm tài khoản Admin mới thành công');
      setIsAddOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Lỗi xử lý yêu cầu' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    if (!validateForm(true)) return;

    setActionLoading(true);
    const token = sessionStorage.getItem('accessToken');
    try {
      const response = await fetch(`http://localhost:8080/api/admin/accounts/${selectedAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          status: formData.status,
          password: formData.password || undefined // Only pass if typed
        })
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Lỗi cập nhật tài khoản');
      }

      showSuccess('Cập nhật thông tin Admin thành công');
      setIsEditOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Lỗi xử lý yêu cầu' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedAccount) return;
    setActionLoading(true);
    const token = sessionStorage.getItem('accessToken');
    try {
      const response = await fetch(`http://localhost:8080/api/admin/accounts/${selectedAccount.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Lỗi xóa tài khoản');
      }

      showSuccess('Xóa tài khoản Admin thành công');
      setIsDeleteOpen(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa tài khoản');
      setIsDeleteOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (acc: AdminAccount) => {
    setSelectedAccount(acc);
    setFormData({
      username: acc.username,
      password: '',
      email: acc.email,
      fullName: acc.fullName,
      phone: acc.phone || '',
      status: acc.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openDelete = (acc: AdminAccount) => {
    setSelectedAccount(acc);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      phone: '',
      status: 'ACTIVE'
    });
    setFormErrors({});
    setShowPassword(false);
  };

  return (
    <div className="space-y-6 relative pb-10">
      {/* Toast Alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xl"
          >
            <div className="p-1 bg-emerald-500 rounded-full text-zinc-950">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý Tài khoản Admin</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Xem danh sách, thêm mới, điều chỉnh quyền lực hoặc vô hiệu hóa các tài khoản quản trị viên.
          </p>
        </div>
        {isRootAdmin && (
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Thêm Admin
          </button>
        )}
      </div>

      {/* Filter and search bar */}
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-4 gap-3">
        <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo họ tên, username, email, số điện thoại..."
          className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-zinc-500"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="p-1 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main content table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            <span className="text-zinc-400 text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-4">
            <div className="text-red-400 text-sm">{error}</div>
            <button 
              onClick={fetchAccounts}
              className="px-4 py-2 border border-zinc-700 rounded-xl hover:bg-zinc-800 text-xs"
            >
              Thử lại
            </button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            {searchQuery ? 'Không tìm thấy tài khoản admin nào khớp với từ khóa' : 'Chưa có tài khoản admin nào được đăng ký'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold bg-zinc-800/20">
                  <th className="p-4 pl-6">Họ và tên</th>
                  <th className="p-4">Tên đăng nhập</th>
                  <th className="p-4">Thông tin liên hệ</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4">Ngày tạo</th>
                  {isRootAdmin && <th className="p-4 pr-6 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4 pl-6 font-medium text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-zinc-300">
                        {acc.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{acc.fullName}</div>
                        {acc.username === 'admin' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] bg-white/10 text-white font-semibold px-2 py-0.5 rounded-full mt-0.5">
                            <ShieldCheck className="w-3 h-3" /> Root Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300 font-mono">@{acc.username}</td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{acc.email}</span>
                      </div>
                      {acc.phone && (
                        <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{acc.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        acc.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60'
                      }`}>
                        {acc.status === 'ACTIVE' ? 'Đang hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-xs">
                      {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    {isRootAdmin && (
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(acc)}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDelete(acc)}
                            disabled={acc.username === 'admin'}
                            className={`p-2 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer ${
                              acc.username === 'admin' ? 'opacity-30 pointer-events-none' : ''
                            }`}
                            title={acc.username === 'admin' ? 'Không thể xóa Admin mặc định' : 'Xóa tài khoản'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 overflow-hidden shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Thêm mới Admin</h2>
                </div>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.submit && (
                <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Họ và tên</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                  {formErrors.fullName && <p className="text-red-400 text-xs mt-1">{formErrors.fullName}</p>}
                </div>

                {/* Tên đăng nhập */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tên đăng nhập</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">@</span>
                    <input 
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '')})}
                      placeholder="nguyenvana"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all font-mono"
                    />
                  </div>
                  {formErrors.username && <p className="text-red-400 text-xs mt-1">{formErrors.username}</p>}
                </div>

                {/* Email & Điện thoại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="a@domain.com"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="0912345678"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mật khẩu</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-sm transition-colors active:scale-95 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {isEditOpen && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 overflow-hidden shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                    <Edit2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Cập nhật tài khoản Admin</h2>
                </div>
                <button 
                  onClick={() => setIsEditOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.submit && (
                <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Username (Locked) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tên đăng nhập (Không thể đổi)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">@</span>
                    <input 
                      type="text"
                      value={formData.username}
                      disabled
                      className="w-full bg-zinc-800/40 border border-zinc-800 text-zinc-500 rounded-xl py-2.5 pl-10 pr-4 text-sm cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Họ và tên</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                  {formErrors.fullName && <p className="text-red-400 text-xs mt-1">{formErrors.fullName}</p>}
                </div>

                {/* Email & Điện thoại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="a@domain.com"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="0912345678"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Trạng thái hoạt động */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Trạng thái hoạt động</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                    disabled={selectedAccount.username === 'admin'}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Khóa tài khoản (INACTIVE)</option>
                  </select>
                  {selectedAccount.username === 'admin' && (
                    <p className="text-zinc-500 text-[10px] mt-1">Không thể thay đổi trạng thái của Root Admin</p>
                  )}
                </div>

                {/* Đổi mật khẩu (Optional) */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Đổi mật khẩu</label>
                    <span className="text-[10px] text-zinc-500 font-medium">Bỏ trống nếu không muốn thay đổi</span>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-sm transition-colors active:scale-95 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteOpen && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-850 rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-2xl z-10"
            >
              <div className="flex flex-col items-center text-center p-4">
                <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-full text-red-400 mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Xác nhận xóa Admin?</h2>
                <p className="text-zinc-400 text-sm mb-6">
                  Bạn có chắc chắn muốn xóa tài khoản quản trị <strong className="text-white">@{selectedAccount.username}</strong> ({selectedAccount.fullName})? Hành động này sẽ loại bỏ hoàn toàn quyền truy cập của họ và không thể hoàn tác.
                </p>

                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(false)}
                    className="flex-1 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold rounded-xl text-sm transition-colors active:scale-95 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Đồng ý xóa
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
