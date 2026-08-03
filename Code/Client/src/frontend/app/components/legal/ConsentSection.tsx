'use client';

import { useState } from 'react';
import { Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import PolicyModal from './PolicyModal';
import {
  CONSENT_ITEMS,
  isAllConsented,
  LEGAL_DOCS,
  type ConsentState,
  type LegalDocKey,
} from '@/app/lib/legal-content';

// Map tài liệu pháp lý → mục xác nhận tương ứng (để "đồng ý" trong modal tự tick ô).
const DOC_TO_CONSENT_KEY: Record<LegalDocKey, keyof ConsentState> = {
  terms: 'termsAccepted',
  privacy: 'privacyAccepted',
  circular88: 'circular88Accepted',
};

interface ConsentSectionProps {
  value: ConsentState;
  onChange: (next: ConsentState) => void;
}

/**
 * Khu vực xác nhận Điều khoản sử dụng & Chính sách bảo mật (dark theme).
 * Gồm 6 ô xác nhận + link "Xem chi tiết" mở modal văn bản đầy đủ.
 */
export default function ConsentSection({ value, onChange }: ConsentSectionProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocKey | null>(null);

  const toggle = (key: keyof ConsentState) => {
    onChange({ ...value, [key]: !value[key] });
  };

  const openDoc = (key: LegalDocKey) => setActiveDoc(key);

  const acceptDoc = (key: LegalDocKey) => {
    // Tick ô xác nhận tương ứng rồi đóng modal
    onChange({ ...value, [DOC_TO_CONSENT_KEY[key]]: true });
    setActiveDoc(null);
  };

  const allConsented = isAllConsented(value);
  const checkedCount = CONSENT_ITEMS.filter((item) => value[item.key]).length;

  return (
    <div
      className={`p-4 rounded-2xl border transition-colors ${
        allConsented
          ? 'bg-zinc-800/40 border-zinc-700/60'
          : 'bg-zinc-800/50 border-amber-500/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
          Xác nhận điều khoản &amp; chính sách bảo mật
        </h3>
      </div>
      <p className="text-[11px] text-zinc-500 mb-3">
        Bạn phải xác nhận đầy đủ {CONSENT_ITEMS.length} mục bên dưới để tiếp tục đăng ký ({checkedCount}/{CONSENT_ITEMS.length} đã xác nhận).
      </p>

      {/* Checkboxes */}
      <div className="space-y-2.5">
        {CONSENT_ITEMS.map((item) => {
          const checked = value[item.key];
          return (
            <div key={item.key} className="flex items-start gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(item.key)}
                className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                  checked
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-zinc-800/80 border-zinc-600 hover:border-zinc-400'
                }`}
                aria-label="Xác nhận điều khoản"
              >
                {checked && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <label
                onClick={() => toggle(item.key)}
                className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed select-none cursor-pointer flex-1"
              >
                {item.segments.map((seg, i) =>
                  seg.link ? (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDoc(seg.link!);
                      }}
                      className="inline text-zinc-100 font-semibold underline decoration-dotted underline-offset-2 hover:text-white hover:decoration-solid transition-colors cursor-pointer"
                    >
                      {seg.text}
                    </button>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </label>
            </div>
          );
        })}
      </div>

      {/* Helper khi chưa xác nhận đủ */}
      {!allConsented && (
        <p className="flex items-center gap-1.5 mt-3 text-[11px] text-amber-400 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Vui lòng xác nhận tất cả các mục trên để tiếp tục đăng ký tài khoản.
        </p>
      )}

      {/* Modal xem chi tiết văn bản */}
      <PolicyModal
        docKey={activeDoc}
        doc={activeDoc ? LEGAL_DOCS[activeDoc] : null}
        onClose={() => setActiveDoc(null)}
        onAccept={acceptDoc}
      />
    </div>
  );
}
