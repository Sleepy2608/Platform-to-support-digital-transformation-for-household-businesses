'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Printer, Download, Search, Calendar,
  RefreshCw, AlertCircle, FileSpreadsheet, Loader2, ArrowRight
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import {
  InventoryLedgerData,
  InventoryBookkeepingSummary,
  formatCurrency,
  formatQuantity,
  formatDateOnly,
  downloadCsv,
  generateLedgerCsv,
  generateSummaryCsv,
} from '../lib/inventoryBookkeepingViewModel';

interface ProductPickerItem {
  id: number;
  productCode: string;
  productName: string;
  baseUnitName?: string;
}

export function InventoryBookkeepingView() {
  // Mode: 'LEDGER' (Sổ chi tiết) or 'SUMMARY' (Tổng hợp nhập xuất tồn)
  const [viewMode, setViewMode] = useState<'LEDGER' | 'SUMMARY'>('LEDGER');

  // Product Selection for Ledger
  const [selectedProduct, setSelectedProduct] = useState<ProductPickerItem | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductPickerItem[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);

  // Date filters (defaults to current month)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Data states
  const [ledgerData, setLedgerData] = useState<InventoryLedgerData | null>(null);
  const [summaryData, setSummaryData] = useState<InventoryBookkeepingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial load: pick the first active product if none selected
  useEffect(() => {
    const fetchInitialProduct = async () => {
      try {
        const res = await apiClient.get<{ content?: ProductPickerItem[]; data?: ProductPickerItem[] }>(
          '/api/products?status=ACTIVE&size=1'
        );
        const list = res.content || res.data || [];
        if (list.length > 0 && !selectedProduct) {
          setSelectedProduct({
            id: list[0].id,
            productCode: list[0].productCode,
            productName: list[0].productName,
            baseUnitName: list[0].baseUnitName,
          });
        }
      } catch {
        // Ignored
      }
    };
    void fetchInitialProduct();
  }, []);

  // Product autocomplete search
  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingProduct(true);
      try {
        const res = await apiClient.get<{ content?: ProductPickerItem[]; data?: ProductPickerItem[] }>(
          `/api/products?keyword=${encodeURIComponent(productQuery.trim())}&status=ACTIVE&size=5`
        );
        setProductResults(res.content || res.data || []);
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProduct(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productQuery]);

  // Load Ledger
  const fetchLedger = useCallback(async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        productId: String(selectedProduct.id),
      });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const data = await apiClient.get<InventoryLedgerData>(
        `/api/inventory/bookkeeping/ledger?${params.toString()}`
      );
      setLedgerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu Sổ kho S2-HKD.');
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, startDate, endDate]);

  // Load Summary
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const data = await apiClient.get<InventoryBookkeepingSummary>(
        `/api/inventory/bookkeeping/summary?${params.toString()}`
      );
      setSummaryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo cáo tổng hợp sổ kho.');
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch when viewMode, product, or dates change
  useEffect(() => {
    if (viewMode === 'LEDGER') {
      if (selectedProduct) void fetchLedger();
    } else {
      void fetchSummary();
    }
  }, [viewMode, selectedProduct, fetchLedger, fetchSummary]);

  // Handle Export CSV
  const handleExportCsv = () => {
    if (viewMode === 'LEDGER' && ledgerData) {
      const csv = generateLedgerCsv(ledgerData);
      const filename = `So-kho-S2-HKD_${ledgerData.productCode}_${startDate}_${endDate}.csv`;
      downloadCsv(filename, csv);
    } else if (viewMode === 'SUMMARY' && summaryData) {
      const csv = generateSummaryCsv(summaryData);
      const filename = `Tong-hop-so-kho-S2-HKD_${startDate}_${endDate}.csv`;
      downloadCsv(filename, csv);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-specific stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Control Bar (Hidden when printing) */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setViewMode('LEDGER')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                viewMode === 'LEDGER'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Sổ chi tiết hàng hóa (Mẫu S2-HKD)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SUMMARY')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                viewMode === 'SUMMARY'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Bảng tổng hợp nhập - xuất - tồn
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || (viewMode === 'LEDGER' && !ledgerData) || (viewMode === 'SUMMARY' && !summaryData)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              In sổ (A4)
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={loading || (viewMode === 'LEDGER' && !ledgerData) || (viewMode === 'SUMMARY' && !summaryData)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Xuất Excel (CSV)
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Product selector for Ledger */}
          {viewMode === 'LEDGER' && (
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Chọn sản phẩm xem sổ
              </label>
              {selectedProduct ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-50/80 px-3.5 py-2">
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-xs font-bold text-slate-900">{selectedProduct.productName}</p>
                    <p className="text-[11px] font-semibold text-slate-500">{selectedProduct.productCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedProduct(null); setProductQuery(''); }}
                    className="text-xs font-bold text-purple-600 hover:underline shrink-0"
                  >
                    Đổi
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc mã SP..."
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-purple-600"
                  />
                  {searchingProduct && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                  )}
                  {productResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                      {productResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductResults([]);
                            setProductQuery('');
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-b-0"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{p.productName}</p>
                            <p className="text-[10px] text-slate-500">{p.productCode}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">{p.baseUnitName || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-purple-600"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area (Covered by #print-area for window.print) */}
      <div id="print-area" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Đang lập sổ kho kế toán...</p>
          </div>
        ) : viewMode === 'LEDGER' ? (
          ledgerData ? (
            /* --- LEDGER VIEW (MẪU S2-HKD) --- */
            <div className="space-y-6">
              {/* Header Standard S2-HKD */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-5">
                <div className="flex flex-col sm:flex-row justify-between text-left text-xs text-slate-600 mb-2">
                  <div>
                    <p><strong>Hộ kinh doanh:</strong> {ledgerData.businessName || '—'}</p>
                    <p><strong>Địa chỉ:</strong> {ledgerData.businessAddress || '—'}</p>
                    <p><strong>Mã số thuế:</strong> {ledgerData.taxCode || '—'}</p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="font-bold text-slate-900">Mẫu số S2-HKD</p>
                    <p className="text-[11px] text-slate-500 italic max-w-xs">
                      (Ban hành kèm theo Thông tư 88/2021/TT-BTC ngày 11/10/2021 của Bộ trưởng Bộ Tài chính)
                    </p>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA
                </h1>
                <p className="text-sm font-semibold text-slate-700">
                  Tên hàng hóa: <span className="text-purple-700 uppercase font-bold">{ledgerData.productName}</span> | Mã số: <strong>{ledgerData.productCode}</strong> | ĐVT: <strong>{ledgerData.unitName}</strong>
                </p>
                <p className="text-xs text-slate-500 italic">
                  Kỳ báo cáo: Từ {formatDateOnly(ledgerData.startDate)} đến {formatDateOnly(ledgerData.endDate)}
                </p>
              </div>

              {/* S2-HKD Accounting Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-center font-bold">
                      <th colSpan={2} className="border border-slate-300 p-2">Chứng từ</th>
                      <th rowSpan={2} className="border border-slate-300 p-2 min-w-[160px]">Diễn giải</th>
                      <th rowSpan={2} className="border border-slate-300 p-2">ĐVT</th>
                      <th rowSpan={2} className="border border-slate-300 p-2">Đơn giá</th>
                      <th colSpan={2} className="border border-slate-300 p-2">Nhập</th>
                      <th colSpan={2} className="border border-slate-300 p-2">Xuất</th>
                      <th colSpan={2} className="border border-slate-300 p-2">Tồn</th>
                      <th rowSpan={2} className="border border-slate-300 p-2">Ghi chú</th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-700 text-center font-bold">
                      <th className="border border-slate-300 p-1.5 min-w-[85px]">Số hiệu (A)</th>
                      <th className="border border-slate-300 p-1.5 min-w-[80px]">Ngày (B)</th>
                      <th className="border border-slate-300 p-1.5">Số lượng (2)</th>
                      <th className="border border-slate-300 p-1.5">Thành tiền (3)</th>
                      <th className="border border-slate-300 p-1.5">Số lượng (4)</th>
                      <th className="border border-slate-300 p-1.5">Thành tiền (5)</th>
                      <th className="border border-slate-300 p-1.5">Số lượng (6)</th>
                      <th className="border border-slate-300 p-1.5">Thành tiền (7)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="border border-slate-300 p-2 text-center">—</td>
                      <td className="border border-slate-300 p-2 text-center">—</td>
                      <td className="border border-slate-300 p-2">Số dư đầu kỳ</td>
                      <td className="border border-slate-300 p-2 text-center">{ledgerData.unitName}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(ledgerData.openingUnitCost)}</td>
                      <td className="border border-slate-300 p-2 text-right">—</td>
                      <td className="border border-slate-300 p-2 text-right">—</td>
                      <td className="border border-slate-300 p-2 text-right">—</td>
                      <td className="border border-slate-300 p-2 text-right">—</td>
                      <td className="border border-slate-300 p-2 text-right text-purple-900 font-black">
                        {formatQuantity(ledgerData.openingQuantity)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-purple-900 font-black">
                        {formatCurrency(ledgerData.openingAmount)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center">—</td>
                    </tr>

                    {/* Transaction Rows */}
                    {ledgerData.entries.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="border border-slate-300 py-6 text-center text-slate-400 italic">
                          Không có giao dịch phát sinh trong kỳ báo cáo này
                        </td>
                      </tr>
                    ) : (
                      ledgerData.entries.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="border border-slate-300 p-2 text-center font-semibold text-slate-800 whitespace-nowrap">
                            {entry.referenceCode || entry.voucherNo}
                          </td>
                          <td className="border border-slate-300 p-2 text-center whitespace-nowrap">
                            {formatDateOnly(entry.voucherDate)}
                          </td>
                          <td className="border border-slate-300 p-2">{entry.description}</td>
                          <td className="border border-slate-300 p-2 text-center">{entry.unitName}</td>
                          <td className="border border-slate-300 p-2 text-right">
                            {entry.unitCost ? formatCurrency(entry.unitCost) : '—'}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-semibold text-emerald-700">
                            {entry.importQuantity > 0 ? formatQuantity(entry.importQuantity) : '—'}
                          </td>
                          <td className="border border-slate-300 p-2 text-right text-emerald-700">
                            {entry.importAmount > 0 ? formatCurrency(entry.importAmount) : '—'}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-semibold text-amber-700">
                            {entry.exportQuantity > 0 ? formatQuantity(entry.exportQuantity) : '—'}
                          </td>
                          <td className="border border-slate-300 p-2 text-right text-amber-700">
                            {entry.exportAmount > 0 ? formatCurrency(entry.exportAmount) : '—'}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-bold text-slate-900">
                            {formatQuantity(entry.balanceAfterQuantity)}
                          </td>
                          <td className="border border-slate-300 p-2 text-right text-slate-900">
                            {formatCurrency(entry.balanceAfterValue)}
                          </td>
                          <td className="border border-slate-300 p-2 text-center text-[11px] text-slate-500">
                            {entry.transactionType}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* Total Row */}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={2} className="border border-slate-300 p-2 text-center">—</td>
                      <td className="border border-slate-300 p-2">Cộng phát sinh trong kỳ</td>
                      <td className="border border-slate-300 p-2 text-center">{ledgerData.unitName}</td>
                      <td className="border border-slate-300 p-2 text-center">—</td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-800 font-black">
                        {formatQuantity(ledgerData.totalImportQuantity)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-800 font-black">
                        {formatCurrency(ledgerData.totalImportAmount)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-amber-800 font-black">
                        {formatQuantity(ledgerData.totalExportQuantity)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-amber-800 font-black">
                        {formatCurrency(ledgerData.totalExportAmount)}
                      </td>
                      <td colSpan={3} className="border border-slate-300 p-2 text-center">—</td>
                    </tr>

                    {/* Closing Balance Row */}
                    <tr className="bg-purple-50/70 font-black text-purple-950">
                      <td colSpan={2} className="border border-slate-300 p-2 text-center">—</td>
                      <td className="border border-slate-300 p-2">Số dư cuối kỳ</td>
                      <td className="border border-slate-300 p-2 text-center">{ledgerData.unitName}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(ledgerData.closingUnitCost)}</td>
                      <td colSpan={4} className="border border-slate-300 p-2 text-center">—</td>
                      <td className="border border-slate-300 p-2 text-right text-base text-purple-700">
                        {formatQuantity(ledgerData.closingQuantity)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-base text-purple-700">
                        {formatCurrency(ledgerData.closingAmount)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Section */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">Người ghi sổ</p>
                  <p className="text-slate-400 italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                </div>
                <div>
                  <p className="italic text-slate-500 mb-1">
                    Ngày ..... tháng ..... năm 20....
                  </p>
                  <p className="font-bold text-slate-800">Chủ hộ kinh doanh</p>
                  <p className="text-slate-400 italic text-[11px] mt-0.5">(Ký, họ tên, đóng dấu nếu có)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">
              Vui lòng chọn sản phẩm để hiển thị Sổ chi tiết Mẫu S2-HKD.
            </div>
          )
        ) : (
          /* --- SUMMARY VIEW (TỔNG HỢP NHẬP XUẤT TỒN) --- */
          summaryData ? (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-5">
                <div className="flex flex-col sm:flex-row justify-between text-left text-xs text-slate-600 mb-2">
                  <div>
                    <p><strong>Hộ kinh doanh:</strong> {summaryData.businessName || '—'}</p>
                    <p><strong>Địa chỉ:</strong> {summaryData.businessAddress || '—'}</p>
                    <p><strong>Mã số thuế:</strong> {summaryData.taxCode || '—'}</p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="font-bold text-slate-900">Báo cáo Mẫu S2-HKD</p>
                    <p className="text-[11px] text-slate-500 italic">Tổng hợp xuất - nhập - tồn kho</p>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  BÁO CÁO TỔNG HỢP NHẬP - XUẤT - TỒN KHO
                </h1>
                <p className="text-xs text-slate-500 italic">
                  Kỳ báo cáo: Từ {formatDateOnly(summaryData.startDate)} đến {formatDateOnly(summaryData.endDate)}
                </p>
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-center font-bold">
                      <th rowSpan={2} className="border border-slate-300 p-2">STT</th>
                      <th rowSpan={2} className="border border-slate-300 p-2">Mã SP</th>
                      <th rowSpan={2} className="border border-slate-300 p-2 min-w-[150px]">Tên hàng hóa</th>
                      <th rowSpan={2} className="border border-slate-300 p-2">ĐVT</th>
                      <th colSpan={2} className="border border-slate-300 p-2">Đầu kỳ</th>
                      <th colSpan={2} className="border border-slate-300 p-2">Nhập trong kỳ</th>
                      <th colSpan={2} className="border border-slate-300 p-2">Xuất trong kỳ</th>
                      <th colSpan={2} className="border border-slate-300 p-2">Cuối kỳ</th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-700 text-center font-bold">
                      <th className="border border-slate-300 p-1.5">Số lượng</th>
                      <th className="border border-slate-300 p-1.5">Thành tiền</th>
                      <th className="border border-slate-300 p-1.5">Số lượng</th>
                      <th className="border border-slate-300 p-1.5">Thành tiền</th>
                      <th className="border border-slate-300 p-1.5">Số lượng</th>
                      <th className="border border-slate-300 p-1.5">Thành tiền</th>
                      <th className="border border-slate-300 p-1.5">Số lượng</th>
                      <th className="border border-slate-300 p-1.5">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.productSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="border border-slate-300 py-8 text-center text-slate-400 italic">
                          Không có dữ liệu tổng hợp kho trong kỳ này
                        </td>
                      </tr>
                    ) : (
                      summaryData.productSummaries.map((p, idx) => (
                        <tr key={p.productId} className="hover:bg-slate-50/60 transition">
                          <td className="border border-slate-300 p-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-mono font-semibold">{p.productCode}</td>
                          <td className="border border-slate-300 p-2 font-bold text-slate-900">{p.productName}</td>
                          <td className="border border-slate-300 p-2 text-center text-slate-600">{p.unitName}</td>
                          <td className="border border-slate-300 p-2 text-right">{formatQuantity(p.openingQuantity)}</td>
                          <td className="border border-slate-300 p-2 text-right">{formatCurrency(p.openingAmount)}</td>
                          <td className="border border-slate-300 p-2 text-right font-semibold text-emerald-700">
                            {formatQuantity(p.importQuantity)}
                          </td>
                          <td className="border border-slate-300 p-2 text-right text-emerald-700">
                            {formatCurrency(p.importAmount)}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-semibold text-amber-700">
                            {formatQuantity(p.exportQuantity)}
                          </td>
                          <td className="border border-slate-300 p-2 text-right text-amber-700">
                            {formatCurrency(p.exportAmount)}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-black text-purple-900">
                            {formatQuantity(p.closingQuantity)}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-black text-purple-900">
                            {formatCurrency(p.closingAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {summaryData.productSummaries.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900">
                        <td colSpan={6} className="border border-slate-300 p-2 text-center uppercase">Tổng cộng phát sinh toàn bộ kho</td>
                        <td className="border border-slate-300 p-2 text-right text-emerald-800 font-black">
                          {formatQuantity(summaryData.totalImportQuantity)}
                        </td>
                        <td className="border border-slate-300 p-2 text-right text-emerald-800 font-black">
                          {formatCurrency(summaryData.totalImportAmount)}
                        </td>
                        <td className="border border-slate-300 p-2 text-right text-amber-800 font-black">
                          {formatQuantity(summaryData.totalExportQuantity)}
                        </td>
                        <td className="border border-slate-300 p-2 text-right text-amber-800 font-black">
                          {formatCurrency(summaryData.totalExportAmount)}
                        </td>
                        <td colSpan={2} className="border border-slate-300 p-2 text-center">—</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Signature Section */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">Người lập biểu</p>
                  <p className="text-slate-400 italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                </div>
                <div>
                  <p className="italic text-slate-500 mb-1">
                    Ngày ..... tháng ..... năm 20....
                  </p>
                  <p className="font-bold text-slate-800">Chủ hộ kinh doanh</p>
                  <p className="text-slate-400 italic text-[11px] mt-0.5">(Ký, họ tên, đóng dấu nếu có)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">
              Chưa có dữ liệu tổng hợp kho.
            </div>
          )
        )}
      </div>
    </div>
  );
}
