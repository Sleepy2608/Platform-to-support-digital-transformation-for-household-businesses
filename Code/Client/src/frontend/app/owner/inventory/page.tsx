'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Warehouse } from 'lucide-react';
import CurrentStockBalanceDashboard from '../../components/CurrentStockBalanceDashboard';
import { InventoryTransactionsView } from '../../components/InventoryTransactionsView';
import { InventoryBookkeepingView } from '../../components/InventoryBookkeepingView';
import { FeatureGate } from '../../components/FeatureGate';

function OwnerInventoryContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'balances';

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
