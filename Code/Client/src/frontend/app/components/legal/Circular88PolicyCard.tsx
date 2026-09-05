'use client';

import React from 'react';
import {
  FileText, Download, Scale, BookOpen, ShieldCheck,
  CheckCircle2, FileSpreadsheet, Layers, Info, ExternalLink,
} from 'lucide-react';

interface Circular88PolicyCardProps {
  className?: string;
}

export default function Circular88PolicyCard({ className = '' }: Circular88PolicyCardProps) {
  const taxRates = [
    {
      stt: '1',
      category: 'Phân phối, cung cấp hàng hóa',
      subtext: 'Bán lẻ vật liệu xây dựng, đồ kim khí, hàng hóa tổng hợp...',
      vat: '1.0%',
      pit: '0.5%',
      total: '1.5%',
      highlight: false,
    },
    {
      stt: '2',
      category: 'Dịch vụ, xây dựng không bao thầu nguyên vật liệu',
      subtext: 'Dịch vụ sửa chữa, tư vấn, thiết kế, thi công nhân công...',
      vat: '5.0%',
      pit: '2.0%',
      total: '7.0%',
      highlight: true,
    },
    {
      stt: '3',
      category: 'Sản xuất, vận tải, dịch vụ có gắn với hàng hóa',
      subtext: 'Sản xuất gia công, vận tải hàng hóa/hành khách, xây dựng bao thầu NVL...',
      vat: '3.0%',
      pit: '1.5%',
      total: '4.5%',
      highlight: false,
    },
    {
      stt: '4',
      category: 'Hoạt động kinh doanh khác',
      subtext: 'Các nhóm ngành kinh doanh chưa được quy định cụ thể ở trên...',
      vat: '2.0%',
      pit: '1.0%',
      total: '3.0%',
      highlight: false,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── Main Banner ── */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 border border-white/15">
              <Scale className="w-3.5 h-3.5" />
              <span>Chính sách & Pháp lý Kế toán Hộ kinh doanh</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Thông tư 88/2021/TT-BTC & Chế độ Kế toán Tự động hóa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Quy định chế độ kế toán cho hộ kinh doanh, cá nhân kinh doanh nộp thuế theo phương pháp kê khai. Nền tảng hỗ trợ chuẩn hóa 03 loại sổ kế toán cốt lõi (S1-HKD, S2-HKD, S4-HKD) và tính toán nghĩa vụ thuế tự động.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-3 shrink-0">
            <a
              href="/docs/88-btc.pdf"
              download="Thong-tu-88-2021-TT-BTC.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải Thông tư 88 (PDF)</span>
            </a>
            <a
              href="/docs/88-btc.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white text-xs font-medium rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trực tuyến</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Section 1: 3 Sổ Kế Toán Cốt Lõi ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
            <BookOpen className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">03 Loại Sổ Kế Toán Trọng Tâm Đã Được Tự Động Hóa</h3>
            <p className="text-xs text-slate-500">Tự động tích hợp và chiết xuất số liệu trực tiếp từ các hoạt động bán hàng và kho</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* S1-HKD */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200">
                  S1-HKD
                </span>
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Sổ Chi Tiết Doanh Thu</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Theo dõi doanh thu bán hàng hóa, dịch vụ theo từng nhóm ngành nghề và tỷ lệ thuế. Tự động bóc tách doanh thu khi đơn bán hàng hoàn thành hoặc đơn nháp AI được duyệt.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tự động cập nhật theo đơn hàng</span>
            </div>
          </div>

          {/* S2-HKD */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                  S2-HKD
                </span>
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Sổ Vật Liệu & Hàng Hóa</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Theo dõi tình hình nhập - xuất - tồn kho từng mã sản phẩm. Tự động áp dụng phương pháp tính giá xuất kho (Bình quân gia quyền hoặc FIFO) đảm bảo chính xác giá vốn.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tự động trừ/tăng tồn kho thực tế</span>
            </div>
          </div>

          {/* S4-HKD */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg border border-purple-200">
                  S4-HKD
                </span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Sổ Nghĩa Vụ Thuế NSNN</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Theo dõi tình hình thực hiện nghĩa vụ thuế đối với Ngân sách Nhà nước. Tự động tính số thuế GTGT, TNCN phải nộp, số đã nộp và số dư nợ/nộp thừa theo kỳ.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Kết xuất báo cáo thuế đúng mẫu</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Bảng Tỷ Lệ Thuế % Theo Ngành Nghề ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
              <FileText className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bảng Tỷ Lệ % Thuế GTGT & TNCN Tính Trên Doanh Thu</h3>
              <p className="text-xs text-slate-500">Áp dụng theo Thông tư 88/2021/TT-BTC & Quyết định 3389/QĐ-BTC</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-y border-slate-200">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Danh Mục Ngành Nghề Kinh Doanh</th>
                <th className="py-3 px-3 text-center">Thuế GTGT</th>
                <th className="py-3 px-3 text-center">Thuế TNCN</th>
                <th className="py-3 px-4 text-center">Tổng Tỷ Lệ Trích Nộp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {taxRates.map((row) => (
                <tr key={row.stt} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">{row.stt}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{row.category}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{row.subtext}</p>
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-800">{row.vat}</td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-800">{row.pit}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-2xs">
                      {row.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Quy Định Kiểm Soát & Audit Trail ── */}
      <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
          <Info className="w-5 h-5 text-blue-600" />
          <span>Quy Định Kiểm Soát, Nhật Ký Truy Vết (Audit Trail) & Giới Hạn Hệ Thống</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Xác nhận thông tin (Human-in-the-loop)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Hệ thống là nền tảng hỗ trợ kế toán. Tất cả báo cáo thuế, đơn hàng nháp do AI đề xuất hoặc điều chỉnh dữ liệu cần được xác nhận bởi Chủ hộ kinh doanh (Owner) hoặc người được ủy quyền trước khi ghi nhận chính thức.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Nhật ký truy vết (Audit Trail)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Mọi hành động tạo, chỉnh sửa hoặc phê duyệt báo cáo đều được ghi lại trong nhật ký vết (Audit Logs) gồm: Người thực hiện, thời điểm, dữ liệu trước/sau thay đổi và lý do điều chỉnh để đáp ứng yêu cầu thanh kiểm tra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
