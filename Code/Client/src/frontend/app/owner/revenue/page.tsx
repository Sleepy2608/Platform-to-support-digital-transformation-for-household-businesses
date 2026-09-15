'use client';

import RevenueLedgerView from '@/app/components/RevenueLedgerView';
import RevenueChart from '@/app/components/RevenueChart';

export default function OwnerRevenuePage() {
  return <><div className="px-4 pt-6 sm:px-6 lg:px-8"><RevenueChart /></div><RevenueLedgerView role="owner" /></>;
}
