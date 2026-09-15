'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePrimaryCta() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/login')}
      className="w-full sm:w-auto bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 group text-sm sm:text-base"
    >
      Bắt đầu trải nghiệm ngay
      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  );
}