'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';

interface PublicPlan {
  id: number;
  planCode: string;
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  description?: string;
  status: string;
}

export default function PricingPlans() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8080/api/public/subscription-plans')
      .then(async (response) => {
        if (!response.ok) throw new Error('Cannot load plans');
        const payload = await response.json();
        setPlans(payload.data || []);
      })
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-48 items-center justify-center text-sm text-zinc-400"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải bảng giá...</div>;
  }

  if (unavailable) {
    return <div className="rounded-2xl border border-amber-700/50 bg-amber-950/30 p-6 text-center text-sm text-amber-200">Bảng giá đang được cập nhật. Vui lòng quay lại sau.</div>;
  }

  if (!plans.length) {
    return <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-8 text-center text-sm text-zinc-400">Hiện chưa có gói dịch vụ đang mở đăng ký.</div>;
  }

  return (
    <div className={`grid grid-cols-1 gap-6 sm:gap-8 ${plans.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'}`}>
      {plans.map((plan) => {
        const featured = plan.planCode.toUpperCase() === 'VIP';
        return (
          <article key={plan.id} className={`flex h-full flex-col justify-between rounded-3xl p-6 sm:p-8 transition hover:-translate-y-2 ${featured ? 'border-2 border-white bg-white text-zinc-950 shadow-2xl' : 'border border-zinc-700 bg-zinc-900/90 text-white'}`}>
            <div>
              {featured && <span className="mb-4 inline-block rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">Đề xuất</span>}
              <h3 className="text-xl font-bold">{plan.planName}</h3>
              <p className={`mt-1 min-h-10 text-sm ${featured ? 'text-zinc-600' : 'text-zinc-400'}`}>{plan.description || 'Gói dịch vụ dành cho hộ kinh doanh'}</p>
              <div className="mt-6"><span className="text-3xl font-extrabold">{formatVnd(plan.monthlyPrice)}</span><span className={featured ? 'text-zinc-600' : 'text-zinc-400'}> /tháng</span></div>
              <p className={`mt-2 text-xs ${featured ? 'text-zinc-600' : 'text-zinc-500'}`}>{formatVnd(plan.annualPrice)} khi thanh toán theo năm</p>
              <ul className="mt-7 space-y-3 text-sm">
                {featuresFor(plan.planCode).map((feature) => <li key={feature} className="flex items-center gap-3"><CheckCircle className="h-4 w-4 flex-shrink-0" />{feature}</li>)}
              </ul>
            </div>
            <Link href="/register" className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-bold transition hover:scale-[1.02] ${featured ? 'bg-zinc-950 text-white hover:bg-zinc-800' : 'border border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700'}`}>Đăng ký {plan.planName}</Link>
          </article>
        );
      })}
    </div>
  );
}

function formatVnd(value: number) {
  return `${Number(value).toLocaleString('vi-VN')}đ`;
}

function featuresFor(code: string) {
  if (code.toUpperCase() === 'VIP') return ['Tất cả tính năng gói Standard', 'Trợ lý AI tạo đơn', 'Báo cáo thuế tự động', 'Không giới hạn nhân viên'];
  if (code.toUpperCase() === 'STANDARD') return ['Quản lý sản phẩm và kho', 'Quản lý công nợ', 'Sổ kế toán TT 88/2021'];
  return ['Quản lý hộ kinh doanh trên một nền tảng', 'Hỗ trợ cập nhật liên tục'];
}
