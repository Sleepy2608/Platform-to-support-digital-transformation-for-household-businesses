'use client';

import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';

interface SalesOrderItem {
  id: number;
  productId: number;
  productName: string;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface SalesOrderDetail {
  id: number;
  orderCode: string;
  createdAt: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
  items: SalesOrderItem[];
  note?: string;
}

interface Props {
  orderId: number;
  onClose: () => void;
}

const fmt = (v: number) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;
const fmtNum = (v: number) => Number(v || 0).toLocaleString('vi-VN');
const fmtDate = (v: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(v));

export default function CustomerOrderDetailModal({ orderId, onClose }: Props) {
  const [detail, setDetail] = useState<SalesOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setDetail(await apiClient.get<SalesOrderDetail>(`/api/sales-orders/${orderId}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Chi tiết đơn hàng {detail ? detail.orderCode : `#${orderId}`}
            </h2>
            {detail && <p className="text-xs text-slate-500">{fmtDate(detail.createdAt)}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" /> Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Tổng tiền</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{fmt(detail.totalAmount)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase text-emerald-600">Đã trả</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">{fmt(detail.paidAmount)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase text-amber-600">Còn nợ</p>
                  <p className="mt-1 text-lg font-black text-amber-700">{fmt(detail.debtAmount)}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase text-blue-600">Trạng thái</p>
                  <p className="mt-1 text-lg font-black text-blue-700">
                    {detail.status === 'CONFIRMED'
                      ? 'Đã xác nhận'
                      : detail.status === 'CANCEL_REQUESTED'
                      ? 'Chờ duyệt hủy'
                      : detail.status === 'CANCELLED'
                      ? 'Đã hủy'
                      : 'Nháp'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Đơn vị</th>
                      <th className="px-4 py-3 text-right">Số lượng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-bold text-slate-900">{item.productName}</td>
                        <td className="px-4 py-4 text-slate-600">{item.unitName}</td>
                        <td className="px-4 py-4 text-right font-semibold">{fmtNum(item.quantity)}</td>
                        <td className="px-4 py-4 text-right">{fmt(item.unitPrice)}</td>
                        <td className="px-4 py-4 text-right font-black text-slate-800">
                          {fmt(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detail.note && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <strong className="text-slate-800">Ghi chú:</strong> {detail.note}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
