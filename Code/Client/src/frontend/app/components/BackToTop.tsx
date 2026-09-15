'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackToTopProps {
  threshold?: number;
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}

export default function BackToTop({
  threshold = 300,
  variant = 'light',
  className = '',
}: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const findScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      let curr = node?.parentElement;
      while (curr) {
        const style = window.getComputedStyle(curr);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          curr.scrollHeight > curr.clientHeight
        ) {
          return curr;
        }
        curr = curr.parentElement;
      }
      return null;
    };

    const targetEl = containerRef.current;
    const parentScroll = findScrollParent(targetEl);
    const mainEl = document.querySelector('main');

    const checkScroll = () => {
      const windowScroll = window.scrollY || document.documentElement.scrollTop;
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const parentScrollTop = parentScroll ? parentScroll.scrollTop : 0;

      const maxScroll = Math.max(windowScroll, mainScroll, parentScrollTop);
      setIsVisible(maxScroll > threshold);
    };

    // Attach scroll listeners
    window.addEventListener('scroll', checkScroll, { passive: true });
    if (mainEl) {
      mainEl.addEventListener('scroll', checkScroll, { passive: true });
    }
    if (parentScroll && parentScroll !== mainEl) {
      parentScroll.addEventListener('scroll', checkScroll, { passive: true });
    }

    // Initial check
    checkScroll();

    return () => {
      window.removeEventListener('scroll', checkScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', checkScroll);
      }
      if (parentScroll && parentScroll !== mainEl) {
        parentScroll.removeEventListener('scroll', checkScroll);
      }
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const targetEl = containerRef.current;
    let curr = targetEl?.parentElement;
    while (curr) {
      if (curr.scrollTop > 0) {
        curr.scrollTo({ top: 0, behavior: 'smooth' });
      }
      curr = curr.parentElement;
    }
  };

  const isDark = variant === 'dark';

  return (
    <span ref={containerRef} className="contents">
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={scrollToTop}
            title="Cuộn lên đầu trang"
            aria-label="Cuộn lên đầu trang"
            className={`fixed bottom-6 right-6 z-50 flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group ${
              isDark
                ? 'bg-zinc-800/90 text-white border border-zinc-700/80 hover:bg-zinc-700 hover:border-zinc-500 shadow-black/40'
                : 'bg-white/95 text-slate-800 border border-slate-200/80 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-slate-400/20'
            } ${className}`}
          >
            <ChevronUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
            <span className="hidden sm:inline text-xs font-bold tracking-tight">Đầu trang</span>
          </motion.button>
        )}
      </AnimatePresence>
    </span>
  );
}
