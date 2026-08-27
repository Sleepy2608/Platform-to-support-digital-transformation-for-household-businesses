'use client';

import { useState } from 'react';
import { AlertCircle, Check, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { getAccessToken } from '@/app/lib/apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface ProductImportRowError {
  rowNumber: number;
  field: string;
  value: string | null;
  errorMessage: string;
}

interface ProductImportResponse {
  success: boolean;
  message: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  errors?: ProductImportRowError[];
}

interface ProductImportSectionProps {
  onImportSuccess?: (successCount: number) => void | Promise<void>;
}

const IMPORT_FIELD_LABELS: Record<string, string> = {
  productCode: 'Mã sản phẩm',
  productName: 'Tên sản phẩm',
  categoryCode: 'Mã danh mục',
  baseUnitCode: 'Mã đơn vị tính',
  salePrice: 'Giá bán',
  quantityOnHand: 'Số lượng tồn kho',
  status: 'Trạng thái',
  description: 'Mô tả',
};

export function ProductImportSection({ onImportSuccess }: ProductImportSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ProductImportResponse | null>(null);
  const [error, setError] = useState('');

  const resultErrors = result?.errors ?? [];
  const hasResultErrors = Boolean(result && result.errorCount > 0);
  const isCompleteFailure = Boolean(result && result.successCount === 0 && result.errorCount > 0);

  const handleDownloadTemplate = async () => {
    setError('');
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_BASE}/api/v1/products/import/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền tải tệp mẫu.');
        }
        throw new Error(`Không thể tải tệp mẫu (HTTP ${response.status}).`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_nhap_san_pham.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tệp mẫu.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lowerFileName = file.name.toLowerCase();
    if (!lowerFileName.endsWith('.xlsx') && !lowerFileName.endsWith('.csv')) {
      setError('Vui lòng chọn tệp .xlsx hoặc .csv');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng tệp không được vượt quá 5MB');
      return;
    }
    setSelectedFile(file);
    setError('');
    setResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError('');
    setResult(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch(`${API_BASE}/api/v1/products/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || `HTTP ${response.status}`);
      }
      const importResult = json.data as ProductImportResponse;
      setResult(importResult);

      if (importResult.successCount > 0) {
        try {
          await onImportSuccess?.(importResult.successCount);
        } catch {
          setError('Đã nhập sản phẩm nhưng chưa thể cập nhật danh sách. Vui lòng thử làm mới danh sách.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi nhập dữ liệu');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition"
      >
        <Upload className="h-4 w-4 text-emerald-600" />
        <span>Nhập từ tệp</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">Nhập sản phẩm từ tệp</h2>
                  <p className="text-xs text-slate-500">Hỗ trợ định dạng .xlsx và .csv</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <AlertCircle className="h-4 w-4 text-slate-500" />
                  Hướng dẫn
                </h3>
                <ol className="space-y-1 text-xs text-slate-600">
                  <li>1. Tải tệp mẫu bên dưới</li>
                  <li>2. Nhập dữ liệu sản phẩm vào tệp</li>
                  <li>3. Tải lên tệp đã điền đầy đủ thông tin</li>
                </ol>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
                >
                  <Download className="h-4 w-4" />
                  Tải tệp mẫu
                </button>
              </div>

              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Chọn tệp dữ liệu
                </span>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-slate-500">
                    Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div
                  className={`rounded-xl border p-4 ${
                    isCompleteFailure
                      ? 'border-rose-200 bg-rose-50'
                      : hasResultErrors
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {hasResultErrors ? (
                      <AlertCircle
                        className={`h-5 w-5 ${isCompleteFailure ? 'text-rose-600' : 'text-amber-600'}`}
                      />
                    ) : (
                      <Check className="h-5 w-5 text-emerald-600" />
                    )}
                    <span
                      className={`font-bold ${
                        isCompleteFailure
                          ? 'text-rose-800'
                          : hasResultErrors
                            ? 'text-amber-800'
                            : 'text-emerald-800'
                      }`}
                    >
                      {isCompleteFailure
                        ? `Không thể nhập ${result.totalRows} dòng dữ liệu`
                        : hasResultErrors
                          ? `Nhập hoàn tất: ${result.successCount} thành công, ${result.errorCount} lỗi`
                          : `Nhập thành công ${result.successCount} sản phẩm`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white p-3 text-center border border-slate-200">
                      <p className="text-lg font-black text-slate-800">{result.totalRows}</p>
                      <p className="text-xs text-slate-500">Tổng dòng</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center border border-emerald-200">
                      <p className="text-lg font-black text-emerald-600">{result.successCount}</p>
                      <p className="text-xs text-slate-500">Thành công</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center border border-rose-200">
                      <p className="text-lg font-black text-rose-600">{result.errorCount}</p>
                      <p className="text-xs text-slate-500">Lỗi</p>
                    </div>
                  </div>

                  {resultErrors.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-rose-200 bg-white">
                      <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          <h3 className="text-sm font-bold text-rose-800">
                            Chi tiết {resultErrors.length} lỗi
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-rose-600">
                          Kiểm tra và sửa tệp trước khi nhập lại
                        </span>
                      </div>

                      <ol className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                        {resultErrors.map((rowError, index) => (
                          <li key={`${rowError.rowNumber}-${rowError.field}-${index}`} className="px-4 py-3">
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-md bg-rose-100 px-2 py-1 font-bold text-rose-700">
                                Lỗi {index + 1}
                              </span>
                              <span className="font-semibold text-slate-700">
                                Dòng dữ liệu {rowError.rowNumber}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-semibold text-slate-700">
                                {IMPORT_FIELD_LABELS[rowError.field] ?? rowError.field}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-rose-700">{rowError.errorMessage}</p>
                            {rowError.value && (
                              <p className="mt-1 text-xs text-slate-500">
                                Giá trị trong tệp:{' '}
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                                  {rowError.value}
                                </code>
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isUploading ? 'Đang nhập...' : 'Nhập sản phẩm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
