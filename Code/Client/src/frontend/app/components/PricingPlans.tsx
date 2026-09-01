'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';

interface PublicPlan {
  id: number;
  planCode: string;
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  description?: string;
  status: string;
}

const DEFAULT_PLANS: PublicPlan[] = [
  {
    id: 1,
    planCode: 'FREE',
    planName: 'Gói Miễn Phí',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Dùng thử cơ bản',
    status: 'ACTIVE',
  },
  {
    id: 2,
    planCode: 'BASIC',
    planName: 'Gói Cơ Bản',
    monthlyPrice: 199000,
    annualPrice: 2200000,
    description: 'Cho hộ kinh doanh nhỏ',
    status: 'ACTIVE',
  },
  {
    id: 6,
    planCode: 'VIP',
    planName: 'Gói VIP',
    monthlyPrice: 399000,
    annualPrice: 4500000,
    description: 'Đầy đủ sức mạnh AI & Kế toán tự động',
    status: 'ACTIVE',
  },
];

const ORDERED_CODES = ['FREE', 'BASIC', 'VIP'];

export default function PricingPlans() {
  const [plans, setPlans] = useState<PublicPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8080/api/public/subscription-plans')
      .then(async (response) => {
        if (!response.ok) throw new Error('Cannot load plans');
        const payload = await response.json();
        const fetched: PublicPlan[] = payload.data || [];
        
        // Filter only FREE, BASIC, VIP and sort by ORDERED_CODES
        const validPlans = fetched
          .filter((p) => ORDERED_CODES.includes(p.planCode.toUpperCase()))
          .sort((a, b) => ORDERED_CODES.indexOf(a.planCode.toUpperCase()) - ORDERED_CODES.indexOf(b.planCode.toUpperCase()));

        if (validPlans.length > 0) {
          setPlans(validPlans);
        }
      })
      .catch(() => {
        // Fallback to default 3 plans on error
        setPlans(DEFAULT_PLANS);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang tải bảng giá...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 max-w-6xl mx-auto items-stretch">
      {plans.map((plan) => {
        const code = plan.planCode.toUpperCase();
        const featured = code === 'VIP';
        const isFree = code === 'FREE';

        return (
          <article
            key={plan.id || plan.planCode}
            className={`flex h-full flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-2 select-none ${
              featured
                ? 'border-2 border-white bg-white text-zinc-950 shadow-2xl hover:shadow-white/20'
                : 'border border-zinc-700 bg-zinc-900/90 text-white backdrop-blur-md hover:border-zinc-500 hover:shadow-xl'
            }`}
            style={{ userSelect: 'none' }}
          >
            <div>
              {featured && (
                <span className="mb-4 inline-block rounded-full bg-zinc-950 px-3.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white shadow-xs">
                  Đề xuất
                </span>
              )}
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                {code === 'VIP' ? 'Gói VIP' : plan.planName}
              </h3>
              <p className={`mt-1 min-h-10 text-xs sm:text-sm ${featured ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {plan.description || 'Gói dịch vụ dành cho hộ kinh doanh'}
              </p>

              <div className="mt-6">
                <span className="text-3xl sm:text-4xl font-extrabold">
                  {formatVnd(plan.monthlyPrice)}
                </span>
                <span className={`text-xs sm:text-sm ${featured ? 'text-zinc-600' : 'text-zinc-400'}`}> /tháng</span>
              </div>
              
              <p className={`mt-2 text-xs ${featured ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {isFree
                  ? 'Gói miễn phí vĩnh viễn'
                  : `${formatVnd(plan.annualPrice)} khi thanh toán theo năm`}
              </p>

              <ul className={`mt-7 space-y-3.5 text-xs sm:text-sm font-medium ${featured ? 'text-zinc-800' : 'text-zinc-200'}`}>
                {featuresFor(code).map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    {featured ? (
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-zinc-950" />
                    ) : (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-zinc-100" />
                    )}
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/register"
              className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-bold transition-all duration-200 active:scale-95 hover:scale-[1.02] ${
                featured
                  ? 'bg-zinc-950 text-white shadow-md hover:bg-zinc-800'
                  : 'border border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              Đăng ký {code === 'VIP' ? 'Gói VIP' : plan.planName}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function formatVnd(value: number) {
  if (!value || value === 0) return '0đ';
  return `${Number(value).toLocaleString('vi-VN')}đ`;
}

function featuresFor(code: string) {
  const c = code.toUpperCase();
  if (c === 'VIP') {
    return [
      'Tất cả tính năng của Gói Cơ Bản',
      'Trợ lý AI thông minh (đọc đơn, phân tích)',
      'Quản lý Sổ kế toán tự động',
      'Không giới hạn số lượng khách hàng',
    ];
  }
  if (c === 'BASIC') {
    return [
      'Tất cả tính năng của Gói Miễn Phí',
      'Quản lý kho hàng & nhân viên',
      'Quản lý công nợ & tạo báo cáo',
      'Quản lý thuế',
      'Quản lý nhiều khách hàng hơn',
    ];
  }
  // FREE
  return [
    'Quản lý sản phẩm & danh mục',
    'Quản lý đơn hàng',
    'Quản lý khách hàng',
  ];
}
