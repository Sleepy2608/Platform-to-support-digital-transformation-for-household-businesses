'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Warehouse, History, BookOpen } from 'lucide-react';
import CurrentStockBalanceDashboard from '../../components/CurrentStockBalanceDashboard';
import { InventoryTransactionsView } from '../../components/InventoryTransactionsView';
import { InventoryBookkeepingView } from '../../components/InventoryBookkeepingView';
import { FeatureGate } from '../../components/FeatureGate';

function OwnerInventoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get('tab') || 'balances';

  const handleTabChange = (tabKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabKey);
    router.push(`/owner/inventory?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Navigation Tabs Header */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 mb-1">
              <Warehouse className="h-4 w-4 text-purple-600" /> Hệ thống quản lý kho
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Kho hàng & Sổ sách kế toán
            </h1>
          </div>

          <div className="flex rounded-xl bg-slate-200/80 p-1 w-fit">
            <button
              type="button"
              onClick={() => handleTabChange('balances')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                currentTab === 'balances'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Warehouse className="h-4 w-4" />
              Tồn kho hiện tại
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('transactions')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                currentTab === 'transactions'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="h-4 w-4" />
              Lịch sử biến động
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('bookkeeping')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                currentTab === 'bookkeeping'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Sổ kho S2-HKD
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {currentTab === 'balances' && (
          <CurrentStockBalanceDashboard readOnly={false} hideHeader={true} />
        )}
        {currentTab === 'transactions' && (
          <InventoryTransactionsView />
        )}
        {currentTab === 'bookkeeping' && (
          <InventoryBookkeepingView />
        )}

      </div>
    </div>
  );
}

export default function OwnerInventoryPage() {
  return (
    <FeatureGate feature="INVENTORY_MANAGEMENT" fallback="locked">
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>}>
        <OwnerInventoryContent />
      </Suspense>
    </FeatureGate>
  );
}
