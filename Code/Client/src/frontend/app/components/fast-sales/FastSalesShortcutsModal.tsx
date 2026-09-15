'use client';

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface FastSalesShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FastSalesShortcutsModal({
  isOpen,
  onClose,
}: FastSalesShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', label: 'Mở hướng dẫn phím tắt này' },
    { key: 'F2', label: 'Focus vào ô tìm kiếm sản phẩm' },
    { key: 'F4', label: 'Chọn / Đổi thông tin khách hàng' },
    { key: 'F8', label: 'Xóa toàn bộ giỏ hàng (kèm xác nhận)' },
    { key: 'F9 / Ctrl+Enter', label: 'Tạo và xác nhận đơn hàng' },
    { key: 'Esc', label: 'Đóng các modal / Hủy tìm kiếm' },
    { key: '/', label: 'Tìm nhanh sản phẩm (khi không trong ô nhập text)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Danh sách phím tắt POS</h3>
              <p className="text-xs text-slate-500 font-medium">Tối ưu thao tác bán hàng tốc độ cao</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs"
            >
              <span className="font-medium text-slate-700">{item.label}</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg shadow-2xs font-mono font-extrabold text-[11px] text-slate-900 shrink-0">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đã hiểu (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
