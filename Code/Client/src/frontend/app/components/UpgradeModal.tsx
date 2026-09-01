'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, ArrowRight, Lock } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureCode: string;
  featureName: string;
  requiredPackage: string | null;
}

/**
 * Modal thông báo giới hạn tính năng và call-to-action nâng cấp gói.
 * Hiển thị khi user tương tác vào feature bị khóa.
 */
export function UpgradeModal({
  isOpen,
  onClose,
  featureCode,
  featureName,
  requiredPackage,
}: UpgradeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header gradient */}
            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 px-6 pt-8 pb-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                Tính năng bị giới hạn
              </h3>
              <p className="text-amber-100 text-sm font-medium">
                Nâng cấp gói để sử dụng đầy đủ
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* Feature info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Crown className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 mb-0.5">
                      {featureName}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tính năng này yêu cầu gói{' '}
                      <span className="font-semibold text-amber-600">
                        {requiredPackage || 'cao hơn'}
                      </span>{' '}
                      để sử dụng.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits teaser */}
              <div className="space-y-2.5 mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lợi ích khi nâng cấp
                </p>
                {[
                  'Mở khóa tất cả tính năng nâng cao',
                  'Không giới hạn số lượng sử dụng',
                  'Hỗ trợ ưu tiên từ đội ngũ kỹ thuật',
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <a
                  href="/owner/account#subscription"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group"
                >
                  <Crown className="w-4 h-4" />
                  Nâng cấp gói ngay
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Để sau
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
