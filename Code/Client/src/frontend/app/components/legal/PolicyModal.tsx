'use client';

import { useEffect } from 'react';
import { X, FileText, Check } from 'lucide-react';
import type { LegalDoc, LegalDocKey, LegalSection } from '@/app/lib/legal-content';

interface PolicyModalProps {
  /** Doc đang mở; null/undefined = đóng modal. */
  docKey: LegalDocKey | null;
  doc: LegalDoc | null;
  onClose: () => void;
  /** Khi người dùng bấm "Tôi đã đọc và đồng ý". */
  onAccept: (docKey: LegalDocKey) => void;
  /** Nhãn nút đồng ý (mặc định). */
  acceptLabel?: string;
}

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-bold text-zinc-100 mb-2">{section.heading}</h3>
      {section.body && (
        <p className="text-sm text-zinc-300 leading-relaxed mb-2">{section.body}</p>
      )}
      {section.bullets && section.bullets.length > 0 && (
        <ul className="space-y-1.5 pl-1">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {section.subSections && section.subSections.length > 0 && (
        <div className="space-y-3 mt-1">
          {section.subSections.map((sub, i) => (
            <div key={i} className="pl-3 border-l-2 border-zinc-700">
              <h4 className="text-sm font-semibold text-zinc-200 mb-1.5">{sub.heading}</h4>
              <ul className="space-y-1.5">
                {sub.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function PolicyModal({
  docKey,
  doc,
  onClose,
  onAccept,
  acceptLabel = 'Tôi đã đọc và đồng ý',
}: PolicyModalProps) {
  // Đóng bằng phím Escape + khóa scroll nền khi mở
  useEffect(() => {
    if (!doc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [doc, onClose]);

  if (!doc || !docKey) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-zinc-700 bg-zinc-900/95 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-zinc-600 flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{doc.title}</h2>
              {doc.version && (
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                  Phiên bản {doc.version}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {doc.intro && (
            <p className="text-sm text-zinc-300 leading-relaxed mb-6 border-l-2 border-l-white/30 pl-3">
              {doc.intro}
            </p>
          )}
          {doc.sections.map((section, i) => (
            <SectionBlock key={i} section={section} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-700 bg-zinc-900/95 sticky bottom-0 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => onAccept(docKey)}
            className="px-6 py-2.5 bg-white text-zinc-950 rounded-xl text-sm font-bold hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
