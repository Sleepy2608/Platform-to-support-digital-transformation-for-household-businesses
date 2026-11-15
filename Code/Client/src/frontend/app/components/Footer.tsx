'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  ShieldCheck,
  ChevronUp,
  FileText,
  Users,
  Scale,
  Mail,
  ExternalLink,
} from 'lucide-react';
import PolicyModal from './legal/PolicyModal';
import { LEGAL_DOCS, type LegalDocKey } from '@/app/lib/legal-content';

interface TeamMember {
  name: string;
  mssv: string;
  role: string;
  github?: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  { name: 'Nguyễn Lê Huy Tâm', mssv: '056206011188', role: 'Leader / Fullstack', github: 'https://github.com/Sleepy2608' },
  { name: 'Trần Duy Tân', mssv: '083206003584', role: 'UI Designer / Frontend', github: 'https://github.com/dzytan' },
  { name: 'Trần Văn Ngọc Thắng', mssv: '046206001641', role: 'Tester & Debugger', github: 'https://github.com/Thang414' },
  { name: 'Nguyễn Ngọc Gia Bảo', mssv: '079206008279', role: 'Database Manager', github: 'https://github.com/Baon5824' },
  { name: 'Trần Hồng Sơn', mssv: '060206012202', role: 'Feature Developer', github: 'https://github.com/sontran310306' },
  { name: 'Huỳnh Đình Chấn', mssv: '077206002307', role: 'Feature Developer', github: 'https://github.com/Chan-2006' },
];

export default function Footer() {
  const [activeDoc, setActiveDoc] = useState<LegalDocKey | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative z-10 bg-zinc-950/95 border-t border-zinc-800 text-zinc-300 pt-12 pb-8 overflow-hidden backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-zinc-800/80">
          
          {/* MỤC 1: BRAND & BẢN QUYỀN HỆ THỐNG (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2.5 group w-fit mb-4">
                <div className="p-2 bg-white/10 rounded-xl border border-zinc-700 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-wider text-white">
                  HBDT<span className="text-blue-400">.DIGITAL</span>
                </span>
              </Link>

              <div className="space-y-2 text-sm text-zinc-300 font-medium leading-relaxed">
                <p className="text-white font-semibold">
                  © 2026 HBDT.DIGITAL. Phát triển bởi Nhóm HBDT Platform.
                </p>
                <p className="text-zinc-400 text-xs">
                  Bảo lưu mọi quyền theo giấy phép <span className="text-zinc-200 font-medium">GNU AGPLv3</span>.
                </p>
              </div>

              <p className="mt-3 text-xs text-zinc-400 leading-relaxed max-w-sm">
                Nền tảng hỗ trợ chuyển đổi số toàn diện cho hộ kinh doanh cá thể: Bán hàng nhanh POS, Quản lý kho, Sổ sách kế toán Thông tư 88/2021/TT-BTC tích hợp Trợ lý AI.
              </p>
            </div>

            {/* Live System Status Indicator */}
            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-medium text-emerald-400">Hệ thống đang hoạt động</span>
              </div>
            </div>
          </div>

          {/* MỤC 2: QUY CHUẨN PHÁP LÝ (3 COLS) */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Quy Chuẩn Pháp Lý
              </h3>
            </div>
            
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('terms')}
                  className="hover:text-white transition-colors duration-150 flex items-center gap-2 text-left cursor-pointer group"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                  <span className="group-hover:underline">Điều khoản dịch vụ</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('privacy')}
                  className="hover:text-white transition-colors duration-150 flex items-center gap-2 text-left cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                  <span className="group-hover:underline">Chính sách bảo mật</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('circular88')}
                  className="hover:text-white transition-colors duration-150 flex items-center gap-2 text-left cursor-pointer group"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                  <span className="group-hover:underline">Thông tư 88/2021/TT-BTC</span>
                </button>
              </li>
              <li>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  <span>Bảo vệ DLCN (Nghị định 13/2023/NĐ-CP)</span>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  <span>Giấy phép mã nguồn mở GNU AGPLv3</span>
                </div>
              </li>
            </ul>
          </div>

          {/* MỤC 3: THÔNG TIN NHÓM (5 COLS) */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Thông Tin Nhóm Phát Triển
                </h3>
              </div>
              <a
                href="mailto:huytamnguyenle2608@gmail.com"
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Email liên hệ Leader"
              >
                <Mail className="w-3 h-3 text-blue-400" />
                <span>Liên hệ nhóm</span>
              </a>
            </div>

            {/* Grid 6 thành viên nhóm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEAM_MEMBERS.map((member) => (
                <div
                  key={member.mssv}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {member.role}
                    </p>
                  </div>
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800 transition-colors"
                      aria-label={`GitHub của ${member.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SUB-FOOTER: BẢN QUYỀN RÚT GỌN & NÚT VỀ ĐẦU TRANG */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="text-center sm:text-left">
            <span>© 2026 HBDT.DIGITAL. Phát triển bởi Nhóm HBDT Platform. Bảo lưu mọi quyền theo giấy phép GNU AGPLv3.</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer group"
            aria-label="Về đầu trang"
          >
            <span>Về đầu trang</span>
            <div className="p-1 rounded bg-zinc-900 border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
              <ChevronUp className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* POLICY MODAL: XEM ĐIỀU KHOẢN, CHÍNH SÁCH BẢO MẬT & TT88 */}
      <PolicyModal
        docKey={activeDoc}
        doc={activeDoc ? LEGAL_DOCS[activeDoc] : null}
        onClose={() => setActiveDoc(null)}
        onAccept={() => setActiveDoc(null)}
        acceptLabel="Đã hiểu và đóng"
      />
    </footer>
  );
}
