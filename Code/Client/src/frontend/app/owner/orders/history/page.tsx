'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Eye, RefreshCw, Search, X,
  CreditCard, CheckCircle2, AlertCircle, Loader2, DollarSign,
} from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface SalesOrderSummary {
  id: number;
  orderCode: string;
  source: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  createdAt: string;
}

interface SalesOrderItem {
  id: number;
  productId: number;
  productName: string;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  pricingRuleName: string;
}

interface SalesOrderDetail extends SalesOrderSummary {
  customerId?: number;
  note?: string;
  items: SalesOrderItem[];
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  order,
  onClose,
  onSuccess,
}: {
  order: SalesOrderSummary;
  onClose: () => void;
  onSuccess: (updated: SalesOrderDetail) => void;
}) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const remaining = order.debtAmount;
  const parsed = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;
  const afterPaid = Math.min(order.paidAmount + parsed, order.totalAmount);
  const afterDebt = Math.max(order.totalAmount - afterPaid, 0);
  const willFullyPay = afterDebt === 0 && parsed > 0;

  const handlePay = async () => {
    setError('');
    if (parsed <= 0) { setError('Vui lòng nhập số tiền hợp lệ'); return; }
    if (parsed > remaining) {
      setError(`Số tiền nhập (${formatVnd(parsed)}) vượt quá số còn nợ (${formatVnd(remaining)})`);
      return;
    }
    setLoading(true);
    try {
      const updated = await apiClient.patch<SalesOrderDetail>(
        `/api/sales-orders/${order.id}/payment?amount=${parsed}`
      );
      onSuccess(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => setAmount(String(remaining));

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Ghi nhận thanh toán</h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">Đơn hàng {order.orderCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tổng tiền</p>
              <p className="text-sm font-black text-slate-900">{formatVnd(order.totalAmount)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Đã trả</p>
              <p className="text-sm font-black text-emerald-700">{formatVnd(order.paidAmount)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Còn nợ</p>
              <p className="text-sm font-black text-amber-700">{formatVnd(order.debtAmount)}</p>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Số tiền khách trả lần này
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="number"
                min={1}
                max={remaining}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') void handlePay(); }}
                placeholder="Nhập số tiền..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors"
              >
                Trả đủ số nợ còn lại ({formatVnd(remaining)})
              </button>
            </div>
          </div>

          {/* Preview */}
          {parsed > 0 && (
            <div className={`rounded-xl p-4 border text-sm space-y-2 ${willFullyPay ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Kết quả sau thanh toán</p>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Đã trả (cộng dồn)</span>
                <span className="font-black text-emerald-700 text-xs">{formatVnd(afterPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Còn nợ</span>
                <span className={`font-black text-xs ${afterDebt === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{formatVnd(afterDebt)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
                <span className="text-slate-500 text-xs">Trạng thái</span>
                <span className={`font-black text-xs px-2 py-0.5 rounded-full ${willFullyPay ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {willFullyPay ? 'Đã thanh toán đầy đủ ✓' : 'Chưa thanh toán hết'}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => void handlePay()}
              disabled={loading || parsed <= 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 active:scale-95 disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-40"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Payment Bar ────────────────────────────────────────────────────────
function QuickPaymentBar({ orders, onPayOrder }: {
  orders: SalesOrderSummary[];
  onPayOrder: (order: SalesOrderSummary) => void;
}) {
  const unpaidOrders = orders.filter(o => o.debtAmount > 0 && o.status !== 'CANCELLED');
  const totalDebt = unpaidOrders.reduce((sum, o) => sum + o.debtAmount, 0);

  if (unpaidOrders.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-100 border border-amber-200 p-2.5">
          <CreditCard className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-black text-amber-900">
            {unpaidOrders.length} đơn chưa thanh toán hết
          </p>
          <p className="text-xs text-amber-700 font-medium mt-0.5">
            Tổng còn nợ: <span className="font-black">{formatVnd(totalDebt)}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {unpaidOrders.slice(0, 4).map((o) => (
          <button
            key={o.id}
            onClick={() => onPayOrder(o)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 transition-all"
          >
            <CreditCard className="h-3.5 w-3.5" />
            {o.orderCode} — còn {formatVnd(o.debtAmount)}
          </button>
        ))}
        {unpaidOrders.length > 4 && (
          <span className="text-xs text-amber-700 font-semibold self-center">
            +{unpaidOrders.length - 4} đơn khác
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalesOrderHistoryPage() {
  const [orders, setOrders] = useState<PageResponse<SalesOrderSummary> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<SalesOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<SalesOrderSummary | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), size: '15' });
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (status) params.set('status', status);
    if (source) params.set('source', source);
    try {
      setOrders(await apiClient.get<PageResponse<SalesOrderSummary>>(`/api/sales-orders?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [keyword, page, source, status]);

  useEffect(() => {
    const timer = setTimeout(() => void loadOrders(), 250);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const openDetail = async (orderId: number) => {
    setDetailLoading(true);
    setError('');
    try {
      setDetail(await apiClient.get<SalesOrderDetail>(`/api/sales-orders/${orderId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePaymentSuccess = (updated: SalesOrderDetail) => {
    setPaymentTarget(null);
    setSuccessMsg(`✓ Đã ghi nhận thanh toán cho đơn ${updated.orderCode}. ${updated.debtAmount === 0 ? 'Đơn hàng đã thanh toán đầy đủ!' : `Còn nợ: ${formatVnd(updated.debtAmount)}`}`);
    setTimeout(() => setSuccessMsg(''), 5000);
    void loadOrders();
  };

  return (
    <div className="min-h-screen p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Bán hàng</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Danh sách đơn hàng</h1>
            <p className="mt-2 text-sm text-slate-500">Tra cứu các đơn đã tạo và xem lại giá được lưu tại thời điểm bán.</p>
          </div>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Quick Payment Bar — hiển thị khi có đơn chưa thanh toán hết */}
        {orders && (
          <QuickPaymentBar
            orders={orders.content}
            onPayOrder={setPaymentTarget}
          />
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_190px_190px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                placeholder="Tìm theo mã đơn hàng..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
              />
            </label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(0); }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Tất cả nguồn đơn</option>
              <option value="POS">Bán tại quầy</option>
              <option value="ONLINE">Đơn trực tuyến</option>
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <button
              onClick={() => void loadOrders()}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
              title="Tải lại"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải đơn hàng...
            </div>
          ) : !orders?.content.length ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <p className="font-semibold">Chưa có đơn hàng phù hợp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-5 py-3">Ngày tạo</th>
                    <th className="px-5 py-3">Nguồn đơn</th>
                    <th className="px-5 py-3">Tổng tiền</th>
                    <th className="px-5 py-3">Đã trả</th>
                    <th className="px-5 py-3">Còn nợ</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.content.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-black text-slate-900">{order.orderCode}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td>
                      <td className="px-5 py-4 text-slate-600">{sourceLabel(order.source)}</td>
                      <td className="px-5 py-4 font-bold">{formatVnd(order.totalAmount)}</td>
                      <td className="px-5 py-4 text-emerald-700 font-semibold">{formatVnd(order.paidAmount)}</td>
                      <td className="px-5 py-4 font-semibold text-amber-700">{formatVnd(order.debtAmount)}</td>
                      <td className="px-5 py-4"><OrderStatus status={order.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.debtAmount > 0 && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setPaymentTarget(order)}
                              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-all"
                              title="Thanh toán"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Thanh toán
                            </button>
                          )}
                          <button
                            disabled={detailLoading}
                            onClick={() => void openDetail(order.id)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {orders && orders.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
              <span>{orders.totalElements} đơn hàng</span>
              <div className="flex items-center gap-2">
                <button disabled={orders.first} onClick={() => setPage((v) => Math.max(0, v - 1))} className="rounded-lg border p-2 disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>Trang {orders.page + 1}/{orders.totalPages}</span>
                <button disabled={orders.last} onClick={() => setPage((v) => v + 1)} className="rounded-lg border p-2 disabled:opacity-30">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Đơn hàng {detail.orderCode}</h2>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(detail.createdAt)} · {sourceLabel(detail.source)}</p>
              </div>
              <div className="flex items-center gap-2">
                {detail.debtAmount > 0 && detail.status !== 'CANCELLED' && (
                  <button
                    onClick={() => { setDetail(null); setPaymentTarget(detail); }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-all"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Thanh toán
                  </button>
                )}
                <button onClick={() => setDetail(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-3 sm:grid-cols-4">
                <Summary label="Tổng tiền" value={formatVnd(detail.totalAmount)} />
                <Summary label="Đã trả" value={formatVnd(detail.paidAmount)} highlight="emerald" />
                <Summary label="Còn nợ" value={formatVnd(detail.debtAmount)} highlight={detail.debtAmount > 0 ? 'amber' : 'emerald'} />
                <Summary label="Trạng thái" value={statusLabel(detail.status)} />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Đơn vị</th>
                      <th className="px-4 py-3">Số lượng</th>
                      <th className="px-4 py-3">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.items.map((item) => (
                      <tr key={item.id}>
                        <td className="break-words px-4 py-4 font-bold text-slate-900">{item.productName}</td>
                        <td className="px-4 py-4 text-slate-600">{item.unitName}</td>
                        <td className="px-4 py-4">{formatNumber(item.quantity)}</td>
                        <td className="px-4 py-4">{formatVnd(item.unitPrice)}</td>
                        <td className="px-4 py-4 text-right font-black">{formatVnd(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detail.note && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <strong>Ghi chú:</strong> {detail.note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentTarget && (
        <PaymentModal
          order={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

function Summary({ label, value, highlight }: { label: string; value: string; highlight?: 'emerald' | 'amber' }) {
  const cls = highlight === 'emerald'
    ? 'bg-emerald-50 text-emerald-700'
    : highlight === 'amber'
    ? 'bg-amber-50 text-amber-700'
    : 'bg-slate-50 text-slate-900';
  return (
    <div className={`rounded-xl p-4 ${cls}`}>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className={`mt-2 font-black ${highlight ? '' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const className = status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>{statusLabel(status)}</span>;
}

function statusLabel(status: string) {
  if (status === 'CONFIRMED') return 'Đã thanh toán đầy đủ';
  if (status === 'CANCELLED') return 'Đã hủy';
  return 'Chưa thanh toán hết';
}

function sourceLabel(source: string) {
  return source === 'ONLINE' ? 'Đơn trực tuyến' : 'Bán tại quầy';
}

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
