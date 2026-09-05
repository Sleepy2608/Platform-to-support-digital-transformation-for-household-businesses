'use client';

import { useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { apiClient } from '@/app/lib/apiClient';
import type { CartResolvedPrice, CartUnit } from './OrderCartDrawer';

export interface AiOrderProposal {
  provider: string;
  readyToApply: boolean;
  customerName: string | null;
  customer: { id: number; customerCode: string; customerName: string; phone?: string } | null;
  paymentType: 'CASH' | 'TRANSFER' | 'DEBT' | 'UNKNOWN';
  items: {
    requestedProductName: string;
    quantity: number | null;
    requestedUnit: string | null;
    product: {
      id: number; productCode: string; productName: string;
      imageUrl?: string; baseUnitName?: string; quantityOnHand?: number;
    } | null;
    units: CartUnit[];
    price: CartResolvedPrice | null;
    issues: string[];
  }[];
  ambiguities: string[];
  message: string;
}

export function AiOrderInput({ onApply, cartHasItems }: {
  onApply: (proposal: AiOrderProposal) => void;
  cartHasItems: boolean;
}) {
  const [text, setText] = useState('');
  const [proposal, setProposal] = useState<AiOrderProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0);

  const parse = async () => {
    const requestRevision = ++revision.current;
    setLoading(true);
    setError('');
    setProposal(null);
    try {
      const result = await apiClient.post<AiOrderProposal>('/api/ai/parse-order', { text: text.trim() });
      if (revision.current === requestRevision) setProposal(result);
    } catch (err) {
      if (revision.current === requestRevision) {
        setError(err instanceof Error ? err.message : 'Chưa thể xử lý câu đặt hàng. Bạn có thể tạo đơn thủ công.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
      <div className="flex items-center gap-2 font-bold text-slate-900">
        <Sparkles className="h-5 w-5 text-indigo-600" /> Nhập đơn bằng câu tiếng Việt
      </div>
      <p className="mt-1 text-sm text-slate-600">Mô tả đơn hàng, kiểm tra gợi ý rồi đưa vào giỏ để chỉnh sửa và xác nhận.</p>
      <label htmlFor="ai-order-text" className="sr-only">Câu đặt hàng</label>
      <textarea id="ai-order-text" value={text} maxLength={4000} rows={3}
        onChange={(event) => { revision.current++; setText(event.target.value); setProposal(null); setError(''); }}
        placeholder="Ví dụ: Lấy 5 bao xi măng Hà Tiên cho anh Ba, ghi nợ"
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-500" />
      <button type="button" disabled={loading || !text.trim()} onClick={() => void parse()}
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Đang đọc câu đặt hàng…' : 'Xem gợi ý đơn hàng'}
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {proposal && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
          <p className="text-sm text-slate-700">
            Khách: <strong>{proposal.customer?.customerName || proposal.customerName || 'Khách lẻ'}</strong>
            {' · '}Thanh toán: <strong>{({ CASH: 'Tiền mặt', TRANSFER: 'Chuyển khoản', DEBT: 'Ghi nợ', UNKNOWN: 'Chưa rõ' })[proposal.paymentType]}</strong>
          </p>
          <ul className="divide-y divide-slate-100">
            {proposal.items.map((item, index) => (
              <li key={index} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span>{item.product?.productName || item.requestedProductName} — {item.quantity ?? '?'} {item.price?.unitName || item.requestedUnit || '(chưa rõ đơn vị)'}</span>
                <strong>{item.price ? Number(item.price.lineTotal).toLocaleString('vi-VN') + ' ₫' : 'Cần kiểm tra'}</strong>
              </li>
            ))}
          </ul>
          {proposal.ambiguities.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-bold">Cần làm rõ trước khi đưa vào giỏ:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">{proposal.ambiguities.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
              <p className="mt-2">Bạn có thể sửa câu phía trên và thử lại, hoặc chọn sản phẩm thủ công bên dưới.</p>
            </div>
          )}
          <p className="text-xs text-slate-500">{proposal.message}</p>
          {cartHasItems && <p className="text-sm text-amber-800">Giỏ đang có hàng. Hoàn tất hoặc xóa giỏ hiện tại trước khi dùng gợi ý này.</p>}
          <button type="button" disabled={!proposal.readyToApply || cartHasItems}
            onClick={() => { onApply(proposal); setProposal(null); }}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
            Đưa vào giỏ để kiểm tra
          </button>
        </div>
      )}
    </section>
  );
}
