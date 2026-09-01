'use client';

import React, { useState } from 'react';
import { useEntitlement } from '../lib/useEntitlement';
import { UpgradeModal } from './UpgradeModal';

type FallbackMode = 'hidden' | 'disabled' | 'locked';

interface FeatureGateProps {
  /** Mã feature cần kiểm tra (ví dụ: "EMPLOYEE_MANAGEMENT") */
  feature: string;
  /**
   * Cách xử lý khi feature bị khóa:
   * - "hidden": Ẩn hoàn toàn component
   * - "disabled": Render nhưng greyed out, không tương tác được
   * - "locked": Render với overlay khóa, click mở UpgradeModal
   */
  fallback?: FallbackMode;
  /** Nội dung hiển thị khi feature được phép */
  children: React.ReactNode;
  /** Custom className cho wrapper */
  className?: string;
}

/**
 * Wrapper component quản lý hiển thị UI dựa trên entitlement.
 *
 * Ví dụ:
 * ```tsx
 * <FeatureGate feature="EMPLOYEE_MANAGEMENT" fallback="locked">
 *   <EmployeeManagementPanel />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  fallback = 'locked',
  children,
  className = '',
}: FeatureGateProps) {
  const { allowed, isLoading, requiredPackage, featureName } = useEntitlement(feature);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Đang tải — render placeholder
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-slate-200 rounded-lg w-full" />
      </div>
    );
  }

  // Feature được phép — render bình thường
  if (allowed) {
    return <>{children}</>;
  }

  // Feature bị khóa — xử lý theo fallback mode
  switch (fallback) {
    case 'hidden':
      return null;

    case 'disabled':
      return (
        <div
          className={`relative opacity-50 pointer-events-none select-none ${className}`}
          aria-disabled="true"
          title={`Tính năng "${featureName || feature}" yêu cầu nâng cấp gói`}
        >
          {children}
        </div>
      );

    case 'locked':
    default:
      return (
        <>
          <div
            className={`relative cursor-pointer group ${className}`}
            onClick={() => setShowUpgradeModal(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowUpgradeModal(true);
              }
            }}
          >
            {/* Nội dung bị làm mờ */}
            <div className="opacity-40 pointer-events-none select-none blur-[1px]">
              {children}
            </div>

            {/* Overlay khóa */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 rounded-xl backdrop-blur-[0.5px] transition-all group-hover:bg-slate-900/10">
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-white/90 px-3 py-1 rounded-full shadow-sm border border-slate-200">
                  Nâng cấp để mở khóa
                </span>
              </div>
            </div>
          </div>

          {/* Upgrade Modal */}
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            featureCode={feature}
            featureName={featureName || feature}
            requiredPackage={requiredPackage}
          />
        </>
      );
  }
}
