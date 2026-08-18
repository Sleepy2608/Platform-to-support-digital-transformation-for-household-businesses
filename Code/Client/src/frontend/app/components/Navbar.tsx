'use client';

import Link from 'next/link';
import { Store, UserPlus, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-700/60 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between relative z-20">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-white/10 rounded-xl border border-zinc-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-wider text-white transition-opacity duration-200 group-hover:opacity-80">
              HKD.DIGITAL
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="#features" 
              className="relative py-1 text-zinc-300 hover:text-white font-medium transition-colors duration-200 active:scale-95 group"
            >
              Tính năng
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-white transition-all duration-300 ease-out group-hover:w-full" />
            </Link>
            <Link 
              href="#pricing" 
              className="relative py-1 text-zinc-300 hover:text-white font-medium transition-colors duration-200 active:scale-95 group"
            >
              Bảng giá
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-white transition-all duration-300 ease-out group-hover:w-full" />
            </Link>
            <Link 
              href="/login" 
              className="flex items-center gap-1 text-zinc-300 hover:text-white font-medium transition-all duration-200 active:scale-95 hover:scale-105"
            >
              <LogIn className="w-4 h-4" /> Đăng nhập
            </Link>
            <Link 
              href="/register" 
              className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md active:shadow-none"
            >
              <UserPlus className="w-4 h-4" /> Đăng ký ngay
            </Link>
          </div>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-zinc-300 hover:text-white focus:outline-none transition-transform active:scale-90"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl px-6 py-6 flex flex-col gap-4 shadow-2xl absolute left-0 right-0 top-full z-20"
            >
              <Link 
                href="#features" 
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-white py-2 font-medium transition-colors flex items-center justify-between border-b border-zinc-800/60"
              >
                <span>Tính năng</span>
              </Link>
              <Link 
                href="#pricing" 
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-white py-2 font-medium transition-colors flex items-center justify-between border-b border-zinc-800/60"
              >
                <span>Bảng giá</span>
              </Link>
              <Link 
                href="/login" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-zinc-300 hover:text-white py-2 font-medium transition-colors border-b border-zinc-800/60"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập
              </Link>
              <Link 
                href="/register" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 bg-white text-zinc-950 py-3 rounded-xl font-bold active:scale-95 transition-all mt-2 shadow-lg"
              >
                <UserPlus className="w-4 h-4" /> Đăng ký ngay
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
