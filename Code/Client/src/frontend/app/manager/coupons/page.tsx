import Link from 'next/link';
import CouponManagementPage from '@/app/components/coupons/CouponManagementPage';

export default function ManagerCouponsPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Link href="/manager" className="text-sm font-semibold text-amber-400 hover:text-amber-300">
          Về trang quản lý
        </Link>
      </div>
      <CouponManagementPage />
    </main>
  );
}
