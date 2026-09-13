'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare, Search, X, Check, Loader2,
  Eye, Clock, User, Tag, Calendar, ChevronLeft, ChevronRight,
  Send, RefreshCw, History, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAccessToken } from '@/app/lib/apiClient';

interface Feedback {
  id: number;
  submittedBy: number;
  submittedByName: string | null;
  submittedByEmail: string | null;
  feedbackType: FeedbackType;
  feedbackTypeLabel: string;
  subject: string;
  content: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  adminResponse?: string | null;
  responses?: FeedbackResponse[];
  history?: FeedbackHistory[];
}

interface FeedbackResponse {
  id: number;
  feedbackId: number;
  performedBy: number;
  performedByName: string;
  content: string;
  createdAt: string;
}

interface FeedbackHistory {
  id: number;
  feedbackId: number;
  performedBy: number;
  performedByName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

type FeedbackStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type FeedbackType = 'SUGGESTION' | 'BUG_REPORT' | 'SUPPORT_REQUEST' | 'COMPLAINT';

const statusConfig: Record<FeedbackStatus, { label: string; className: string }> = {
  NEW: { label: 'Mới', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  RESOLVED: { label: 'Đã giải quyết', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  CLOSED: { label: 'Đã đóng', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

const typeConfig: Record<FeedbackType, { label: string; className: string }> = {
  SUGGESTION: { label: 'Góp ý', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  BUG_REPORT: { label: 'Báo lỗi', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  SUPPORT_REQUEST: { label: 'Yêu cầu hỗ trợ', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  COMPLAINT: { label: 'Khiếu nại', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

const nextStatus: Partial<Record<FeedbackStatus, FeedbackStatus>> = {
  NEW: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Detail modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Response form state
  const [responseContent, setResponseContent] = useState('');
  const [newStatus, setNewStatus] = useState<FeedbackStatus>('NEW');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = getAccessToken();
    try {
      const params = new URLSearchParams({
        page: String(currentPage - 1),
        size: String(itemsPerPage),
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('feedbackType', typeFilter);
      const response = await fetch(`http://localhost:8080/api/feedback/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy danh sách phản hồi');
      }
      const pageData = data.data;
      setFeedbacks(Array.isArray(pageData?.content) ? pageData.content : []);
      setTotalPages(pageData?.totalPages ?? 0);
      setTotalElements(pageData?.totalElements ?? 0);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Lỗi kết nối máy chủ'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchFeedbacks(), 250);
    return () => window.clearTimeout(timer);
  }, [fetchFeedbacks]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const openDetail = async (fb: Feedback) => {
    setSelectedFeedback(fb);
    setNewStatus(fb.status);
    setResponseContent('');
    setActiveTab('details');
    setIsDetailOpen(true);

    // Fetch full details with responses and history
    const token = getAccessToken();
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [detailResponse, historyResponse] = await Promise.all([
        fetch(`http://localhost:8080/api/feedback/${fb.id}`, { headers }),
        fetch(`http://localhost:8080/api/feedback/${fb.id}/history`, { headers }),
      ]);
      const detailData = await detailResponse.json();
      const historyData = await historyResponse.json();
      if (detailResponse.ok && detailData.success) {
        const history: FeedbackHistory[] = historyResponse.ok && Array.isArray(historyData.data) ? historyData.data : [];
        const responses: FeedbackResponse[] = history
          .filter((item) => item.action === 'RESPONSE_ADDED')
          .map((item) => ({
            id: item.id,
            feedbackId: item.feedbackId,
            performedBy: item.performedBy,
            performedByName: item.performedByName,
            content: item.newValue || '',
            createdAt: item.createdAt,
          }));
        setSelectedFeedback({ ...detailData.data, history, responses });
        setNewStatus(detailData.data.status);
      }
    } catch {
      console.error('Failed to fetch feedback details');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedFeedback) return;

    setActionLoading(true);
    const token = getAccessToken();
    try {
      const response = await fetch(`http://localhost:8080/api/feedback/admin/${selectedFeedback.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi cập nhật trạng thái');
      }
      showSuccess('Cập nhật trạng thái thành công');
      fetchFeedbacks();
      // Update selected feedback
      if (selectedFeedback) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus });
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Lỗi xử lý yêu cầu'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddResponse = async () => {
    if (!selectedFeedback || !responseContent.trim()) return;

    setActionLoading(true);
    const token = getAccessToken();
    try {
      const response = await fetch(`http://localhost:8080/api/feedback/admin/${selectedFeedback.id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: responseContent })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi gửi phản hồi');
      }
      showSuccess('Gửi phản hồi thành công');
      setResponseContent('');
      // Refresh feedback details
      await openDetail(selectedFeedback);
      fetchFeedbacks();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Lỗi xử lý yêu cầu'));
    } finally {
      setActionLoading(false);
    }
  };

  const paginatedFeedbacks = feedbacks;
  const startIndex = (currentPage - 1) * itemsPerPage;

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
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý Phản hồi</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Xem và quản lý các phản hồi từ người dùng về hệ thống.
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 border border-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        {/* Search */}
        <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl px-3 flex-1 min-w-0">
          <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm kiếm theo tiêu đề, nội dung, người gửi..."
            className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-zinc-500 py-2.5 px-2"
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 cursor-pointer min-w-[160px]"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="NEW">Mới</option>
          <option value="IN_PROGRESS">Đang xử lý</option>
          <option value="RESOLVED">Đã giải quyết</option>
          <option value="CLOSED">Đã đóng</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 cursor-pointer min-w-[180px]"
        >
          <option value="ALL">Tất cả loại</option>
          <option value="SUGGESTION">Góp ý</option>
          <option value="BUG_REPORT">Báo lỗi</option>
          <option value="SUPPORT_REQUEST">Yêu cầu hỗ trợ</option>
          <option value="COMPLAINT">Khiếu nại</option>
        </select>
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
              onClick={fetchFeedbacks}
              className="px-4 py-2 border border-zinc-700 rounded-xl hover:bg-zinc-800 text-xs"
            >
              Thử lại
            </button>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Không tìm thấy phản hồi nào khớp với bộ lọc'
              : 'Chưa có phản hồi nào được gửi'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold bg-zinc-800/20">
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Người gửi</th>
                  <th className="p-4">Loại</th>
                  <th className="p-4">Tiêu đề</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedFeedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4 pl-6 text-zinc-400 font-mono text-xs">#{fb.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-zinc-300 text-xs flex-shrink-0">
                          {fb.submittedByName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-white text-sm truncate max-w-[120px]">{fb.submittedByName || 'N/A'}</div>
                          <div className="text-zinc-500 text-xs truncate max-w-[120px]">{fb.submittedByEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${typeConfig[fb.feedbackType]?.className || typeConfig.SUGGESTION.className}`}>
                        {fb.feedbackTypeLabel || fb.feedbackType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white truncate max-w-[200px]" title={fb.subject}>
                        {fb.subject}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig[fb.status]?.className || statusConfig.NEW.className}`}>
                        {statusConfig[fb.status]?.label || fb.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-xs">
                      {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => openDetail(fb)}
                        className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && feedbacks.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-800/20">
            <div className="text-zinc-400 text-xs">
              Hiển thị {startIndex + 1}-{Math.min(startIndex + feedbacks.length, totalElements)} trong {totalElements} phản hồi
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-white text-zinc-950'
                        : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Chi tiết Phản hồi</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-xs font-mono">#{selectedFeedback.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[selectedFeedback.status]?.className || statusConfig.NEW.className}`}>
                        {statusConfig[selectedFeedback.status]?.label || selectedFeedback.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-800 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'details'
                      ? 'text-white border-b-2 border-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Chi tiết
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'history'
                      ? 'text-white border-b-2 border-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <History className="w-4 h-4" /> Lịch sử
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'details' ? (
                  <div className="space-y-6">
                    {/* Feedback Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                        <User className="w-5 h-5 text-zinc-500" />
                        <div>
                          <div className="text-zinc-400 text-xs">Người gửi</div>
                          <div className="text-white font-medium">{selectedFeedback.submittedByName || 'N/A'}</div>
                          <div className="text-zinc-500 text-xs">{selectedFeedback.submittedByEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                        <Tag className="w-5 h-5 text-zinc-500" />
                        <div>
                          <div className="text-zinc-400 text-xs">Loại phản hồi</div>
                          <div className="mt-1">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${typeConfig[selectedFeedback.feedbackType]?.className || typeConfig.SUGGESTION.className}`}>
                              {selectedFeedback.feedbackTypeLabel || selectedFeedback.feedbackType}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                        <Calendar className="w-5 h-5 text-zinc-500" />
                        <div>
                          <div className="text-zinc-400 text-xs">Ngày tạo</div>
                          <div className="text-white font-medium text-sm">
                            {selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                        <Clock className="w-5 h-5 text-zinc-500" />
                        <div>
                          <div className="text-zinc-400 text-xs">Cập nhật lần cuối</div>
                          <div className="text-white font-medium text-sm">
                            {selectedFeedback.updatedAt ? new Date(selectedFeedback.updatedAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subject and Content */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tiêu đề</label>
                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 text-white font-medium">
                          {selectedFeedback.subject || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nội dung</label>
                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 text-zinc-300 text-sm whitespace-pre-wrap">
                          {selectedFeedback.content || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Responses */}
                    {selectedFeedback.responses && selectedFeedback.responses.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                          Phản hồi ({selectedFeedback.responses.length})
                        </label>
                        <div className="space-y-3">
                          {selectedFeedback.responses.map((resp) => (
                            <div key={resp.id} className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <span className="text-emerald-400 text-xs font-bold">
                                      {resp.performedByName?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                  </div>
                                  <span className="text-white text-sm font-medium">{resp.performedByName || 'Admin'}</span>
                                </div>
                                <span className="text-zinc-500 text-xs">
                                  {resp.createdAt ? new Date(resp.createdAt).toLocaleDateString('vi-VN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : ''}
                                </span>
                              </div>
                              <div className="text-zinc-300 text-sm whitespace-pre-wrap pl-8">
                                {resp.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* History Tab */
                  <div className="space-y-3">
                    {selectedFeedback.history && selectedFeedback.history.length > 0 ? (
                      selectedFeedback.history.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-zinc-300 text-xs font-bold">
                              {item.performedByName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-white text-sm font-medium">{item.performedByName || 'Người dùng'}</span>
                              <span className="text-zinc-500 text-xs">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''}
                              </span>
                            </div>
                            <div className="text-zinc-300 text-sm mt-1">{item.action}</div>
                            {(item.oldValue || item.newValue) && (
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                {item.oldValue && (
                                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20 line-through">
                                    {item.oldValue}
                                  </span>
                                )}
                                {item.oldValue && item.newValue && (
                                  <span className="text-zinc-500">→</span>
                                )}
                                {item.newValue && (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                                    {item.newValue}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-zinc-500 text-sm">
                        Chưa có lịch sử xử lý
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer - Action Bar */}
              <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex-shrink-0 space-y-4">
                {/* Status Update */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-zinc-400 text-sm whitespace-nowrap">Cập nhật trạng thái:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as FeedbackStatus)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value={selectedFeedback.status}>{statusConfig[selectedFeedback.status].label}</option>
                      {nextStatus[selectedFeedback.status] && (
                        <option value={nextStatus[selectedFeedback.status]}>
                          {statusConfig[nextStatus[selectedFeedback.status]!].label}
                        </option>
                      )}
                    </select>
                  </div>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={actionLoading || newStatus === selectedFeedback.status}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    Cập nhật
                  </button>
                </div>

                {/* Response Form */}
                <div className="space-y-2">
                  <label className="text-zinc-400 text-sm">Thêm phản hồi:</label>
                  <div className="flex gap-2">
                    <textarea
                      value={responseContent}
                      onChange={(e) => setResponseContent(e.target.value)}
                      placeholder="Nhập nội dung phản hồi..."
                      rows={2}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                    <button
                      onClick={handleAddResponse}
                      disabled={actionLoading || !responseContent.trim()}
                      className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                      <Send className="w-4 h-4" />
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
