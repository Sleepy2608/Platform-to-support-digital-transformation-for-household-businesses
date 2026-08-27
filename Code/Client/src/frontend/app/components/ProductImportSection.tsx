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
  failedCount: number;
  errorCount: number;
  skipCount: number;
  errors?: ProductImportRowError[];
}

interface ProductImportSectionProps {
  onImportSuccess?: (successCount: number) => void | Promise<void>;
}

interface ApiResponseBody<T> {
  message?: string;
  data?: T;
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
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [result, setResult] = useState<ProductImportResponse | null>(null);
  const [error, setError] = useState('');

  const resultErrors = result?.errors ?? [];
  const failedRowCount = result?.failedCount
    ?? new Set(resultErrors.map((rowError) => rowError.rowNumber)).size;
  const hasResultErrors = Boolean(result && result.errorCount > 0);
  const isCompleteFailure = Boolean(result && result.successCount === 0 && result.errorCount > 0);

  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    setError('');
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_BASE}/api/v1/products/import/template?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Không thể tải tệp mẫu.'));
      }
      const blob = await response.blob();
      downloadBlob(blob, `mau_nhap_san_pham.${format}`);
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
      const json = await readApiResponse<ProductImportResponse>(response);
      if (!json.data) {
        throw new Error('Máy chủ không trả về kết quả nhập sản phẩm.');
      }
      const importResult = json.data;
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

  const handleDownloadErrorReport = async () => {
    if (!resultErrors.length) return;
    setIsDownloadingReport(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_BASE}/api/v1/products/import/error-report`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultErrors),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Không thể tải báo cáo lỗi.'));
      }
      downloadBlob(await response.blob(), 'bao_cao_loi_nhap_san_pham.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo cáo lỗi.');
    } finally {
      setIsDownloadingReport(false);
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDownloadTemplate('xlsx')}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    <Download className="h-4 w-4" />
                    Tải mẫu Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownloadTemplate('csv')}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" />
                    Tải mẫu CSV
                  </button>
                </div>
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
                          ? `Nhập hoàn tất: ${result.successCount} thành công, ${failedRowCount} thất bại`
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
                      <p className="text-lg font-black text-rose-600">{failedRowCount}</p>
                      <p className="text-xs text-slate-500">Thất bại</p>
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
                        <button
                          type="button"
                          onClick={() => void handleDownloadErrorReport()}
                          disabled={isDownloadingReport}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          {isDownloadingReport ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Tải báo cáo lỗi
                        </button>
                      </div>

                      <ol className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                        {resultErrors.map((rowError, index) => (
                          <li key={`${rowError.rowNumber}-${rowError.field}-${index}`} className="px-4 py-3">
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-md bg-rose-100 px-2 py-1 font-bold text-rose-700">
                                Lỗi {index + 1}
                              </span>
                              <span className="font-semibold text-slate-700">
                                Dòng trong tệp {rowError.rowNumber}
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

async function readApiResponse<T>(response: Response): Promise<ApiResponseBody<T>> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(httpStatusMessage(response.status));
  }

  let body: ApiResponseBody<T>;
  try {
    body = JSON.parse(text) as ApiResponseBody<T>;
  } catch {
    throw new Error('Máy chủ trả về dữ liệu không hợp lệ.');
  }

  if (!response.ok) {
    throw new Error(body.message || httpStatusMessage(response.status));
  }
  return body;
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  const text = await response.text();
  if (text.trim()) {
    try {
      const body = JSON.parse(text) as ApiResponseBody<unknown>;
      if (body.message) return body.message;
    } catch {
      // Phản hồi lỗi có thể là văn bản thuần.
      return text;
    }
  }
  return response.status ? httpStatusMessage(response.status) : fallback;
}

function httpStatusMessage(status: number) {
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status >= 500) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.';
  return `Yêu cầu không thành công (HTTP ${status}).`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}
