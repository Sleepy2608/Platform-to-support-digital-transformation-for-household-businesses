'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare, Send, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, CheckCircle2, Loader2,
  Eye, X, Clock, Tag, FileText, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type FeedbackStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface FeedbackType {
  code: string;
  label: string;
}

interface Feedback {
  id: number;
  feedbackType: string;
  feedbackTypeLabel: string;
  subject: string;
  content: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  adminResponse: string | null;
}

interface PagedResult {
  content: Feedback[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface FeedbackHistory {
  id: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedByName: string | null;
  note: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<FeedbackStatus, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
};

const STATUS_STYLE: Record<FeedbackStatus, string> = {
  NEW: 'bg-amber-50 text-amber-700 border border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-500 border border-slate-200',
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  // Feedback types
  const [feedbackTypes, setFeedbackTypes] = useState<FeedbackType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Feedback list
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Detail modal
  const [viewingFeedback, setViewingFeedback] = useState<Feedback | null>(null);
  const [viewingHistory, setViewingHistory] = useState<FeedbackHistory[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load feedback types
  const loadFeedbackTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const data = await apiClient.get<FeedbackType[]>('/api/feedback/types');
      setFeedbackTypes(data);
      if (data.length > 0) {
        setSelectedTypeId((current) => current || data[0].code);
      }
    } catch {
      // Silently fail, form will show placeholder
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  // Load feedbacks list
  const loadFeedbacks = useCallback(async (pageNumber: number) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({ page: String(pageNumber), size: '10' });
      const data = await apiClient.get<PagedResult>(`/api/feedback?${params}`);
      setFeedbacks(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch {
      // Silently fail
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFeedbackTypes(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFeedbackTypes]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFeedbacks(page), 0);
    return () => window.clearTimeout(timer);
  }, [page, loadFeedbacks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!selectedTypeId) {
      setSubmitError('Vui lòng chọn loại phản hồi');
      return;
    }
    if (!subject.trim()) {
      setSubmitError('Vui lòng nhập tiêu đề');
      return;
    }
    if (!content.trim()) {
      setSubmitError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/feedback', {
        feedbackType: selectedTypeId,
        subject: subject.trim(),
        content: content.trim(),
      });
      setSubject('');
      setContent('');
      setSubmitSuccess('Gửi phản hồi thành công! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      void loadFeedbacks(0);
      setPage(0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (feedback: Feedback) => {
    setLoadingDetail(true);
    setViewingFeedback(null);
    try {
      const [detail, history] = await Promise.all([
        apiClient.get<Feedback>(`/api/feedback/${feedback.id}`),
        apiClient.get<FeedbackHistory[]>(`/api/feedback/${feedback.id}/history`),
      ]);
      setViewingFeedback(detail);
      setViewingHistory(history);
    } catch {
      setViewingFeedback(feedback); // Fallback to list item
      setViewingHistory([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 lg:p-10 select-none" style={{ cursor: 'default' }}>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight select-none" style={{ userSelect: 'none' }}>
              Phản hồi & Hỗ trợ
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 select-none" style={{ userSelect: 'none' }}>
              Gửi yêu cầu hỗ trợ hoặc phản hồi về dịch vụ
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              Hỗ trợ
            </span>
          </div>
        </div>

        {/* Feedback Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Gửi phản hồi mới</h2>
                <p className="text-xs text-slate-500 font-medium">Chia sẻ ý kiến, báo lỗi hoặc yêu cầu hỗ trợ</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {(submitError || submitSuccess) && (
              <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                submitError
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                {submitError ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{submitError || submitSuccess}</span>
              </div>
            )}

            {/* Feedback Type */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Loại phản hồi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  disabled={loadingTypes}
                  required
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {loadingTypes ? (
                    <option value="">Đang tải loại phản hồi...</option>
                  ) : feedbackTypes.length === 0 ? (
                    <option value="">Chưa có loại phản hồi</option>
                  ) : (
                    feedbackTypes.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.label}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Nhập tiêu đề phản hồi..."
                  maxLength={255}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả chi tiết vấn đề hoặc ý kiến của bạn..."
                rows={5}
                maxLength={2000}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition resize-none"
              />
              <div className="mt-1.5 flex justify-end">
                <span className="text-xs text-slate-400 font-medium">
                  {content.length}/2000 ký tự
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || loadingTypes}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xs cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Previous Feedbacks List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Phản hồi đã gửi</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {totalElements > 0 ? `${totalElements} phản hồi đã gửi` : 'Danh sách phản hồi của bạn'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void loadFeedbacks(page)}
                disabled={loadingList}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                title="Tải lại"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                Tải lại
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500 font-medium">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              Đang tải...
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
              <MessageSquare className="h-10 w-10 opacity-40" />
              <p className="font-semibold text-sm">Bạn chưa gửi phản hồi nào</p>
              <p className="text-xs">Sử dụng biểu mẫu bên trên để gửi phản hồi</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedbacks.map((feedback, index) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => void handleViewDetail(feedback)}
                  className="flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{feedback.id}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[feedback.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          feedback.status === 'NEW' ? 'bg-amber-500' :
                          feedback.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          feedback.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                        {STATUS_LABEL[feedback.status]}
                      </span>
                    </div>
                    <p className="mt-1 font-bold text-slate-900 truncate">{feedback.subject}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {feedback.feedbackTypeLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(feedback.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <Eye className="h-4 w-4 text-slate-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm">
              <span className="font-semibold text-slate-500">
                Trang {page + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0 || loadingList}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Trước
                </button>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages || loadingList}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Feedback Detail Modal */}
      <AnimatePresence>
        {viewingFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setViewingFeedback(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Chi tiết phản hồi</h3>
                    <p className="text-xs text-slate-500 font-mono">#{viewingFeedback.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingFeedback(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {loadingDetail ? (
                  <div className="flex h-32 items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    Đang tải chi tiết...
                  </div>
                ) : (
                  <>
                    {/* Status & Type */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[viewingFeedback.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          viewingFeedback.status === 'NEW' ? 'bg-amber-500' :
                          viewingFeedback.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          viewingFeedback.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                        {STATUS_LABEL[viewingFeedback.status]}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        <Tag className="h-3 w-3" />
                        {viewingFeedback.feedbackTypeLabel}
                      </span>
                    </div>

                    {/* Subject */}
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Tiêu đề
                      </h4>
                      <p className="font-bold text-slate-900">{viewingFeedback.subject}</p>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Nội dung
                      </h4>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                          {viewingFeedback.content}
                        </p>
                      </div>
                    </div>

                    {/* Admin Response */}
                    {viewingFeedback.adminResponse && (
                      <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Phản hồi từ quản trị viên
                        </h4>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                          <p className="whitespace-pre-wrap text-sm text-emerald-800 leading-relaxed">
                            {viewingFeedback.adminResponse}
                          </p>
                        </div>
                      </div>
                    )}

                    {viewingHistory.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Lịch sử trao đổi
                        </h4>
                        <div className="space-y-2">
                          {viewingHistory.map((item) => (
                            <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                              <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="font-bold text-slate-700">{item.performedByName || 'Người dùng'}</span>
                                <span className="text-slate-400">{formatDateTime(item.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{item.action}</p>
                              {item.action === 'RESPONSE_ADDED' && item.newValue && (
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.newValue}</p>
                              )}
                              {item.action === 'STATUS_CHANGED' && (
                                <p className="mt-2 text-sm text-slate-700">{item.oldValue} → {item.newValue}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-semibold text-slate-500">Ngày gửi:</span>
                          <p className="mt-0.5 font-semibold text-slate-700">{formatDateTime(viewingFeedback.createdAt)}</p>
                        </div>
                        {viewingFeedback.resolvedAt && (
                          <div>
                            <span className="font-semibold text-slate-500">Ngày giải quyết:</span>
                            <p className="mt-0.5 font-semibold text-emerald-700">{formatDateTime(viewingFeedback.resolvedAt)}</p>
                          </div>
                        )}
                        {viewingFeedback.updatedAt && viewingFeedback.updatedAt !== viewingFeedback.createdAt && (
                          <div>
                            <span className="font-semibold text-slate-500">Cập nhật lần cuối:</span>
                            <p className="mt-0.5 font-semibold text-slate-700">{formatDateTime(viewingFeedback.updatedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => setViewingFeedback(null)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
