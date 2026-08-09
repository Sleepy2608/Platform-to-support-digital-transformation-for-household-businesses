'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, Store, Menu, X, Database, KeyRound, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [needKey, setNeedKey] = useState(false);
  const [keyInitialized, setKeyInitialized] = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);

  const checkKey = useCallback(async () => {
    try {
      const status = await apiClient.get<{ initialized: boolean; unlocked: boolean }>('/api/seed/key-status');
      setKeyInitialized(status.initialized);
      setNeedKey(!status.unlocked);
    } catch {
      setNeedKey(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const rolesStr = localStorage.getItem('roles');

    if (!token || !rolesStr) {
      router.push('/login');
      return;
    }

    try {
      const roles = JSON.parse(rolesStr);
      if (!roles.includes('ADMIN')) {
        router.push('/login');
        return;
      }

      const uname = localStorage.getItem('username') || 'admin';
      setFullName(localStorage.getItem('fullName') || 'Administrator');
      setUsername(uname);
      if (uname === 'Admin') {
        checkKey().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch (e) {
      router.push('/login');
    }
  }, [router, checkKey]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleUnlock = async () => {
    if (!keyInput.trim()) return;
    setKeyBusy(true);
    setKeyError('');
    try {
      await apiClient.post('/api/seed/unlock', { key: keyInput });
      setNeedKey(false);
      setKeyInput('');
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : 'Key không đúng');
    } finally {
      setKeyBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-white animate-spin" />
          <span className="text-zinc-400 text-sm animate-pulse">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  if (needKey) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Nhập Key Database</h1>
          </div>
          <p className="text-zinc-400 text-sm mb-6">
            {keyInitialized
              ? 'Nhập key để mở khóa dữ liệu. Không có key sẽ không truy cập được.'
              : 'Chưa có key. Nhập key mới để thiết lập lần đầu (hãy nhớ kỹ key này).'}
          </p>
          <div className="relative mb-4">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Nhập key database..."
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
            />
          </div>
          {keyError && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-sm text-red-400">
              {keyError}
            </div>
          )}
          <button
            onClick={handleUnlock}
            disabled={!keyInput.trim() || keyBusy}
            className="w-full flex items-center justify-center gap-2 bg-white text-zinc-950 font-semibold px-5 py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-zinc-200 transition-colors mb-3"
          >
            {keyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {keyInitialized ? 'Mở khóa' : 'Thiết lập key'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
    { name: 'Tài khoản Admin', href: '/admin/accounts', icon: Users },
    ...(username === 'Admin'
      ? [{ name: 'Seek Data', href: '/admin/seed', icon: Database }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-zinc-900/90 border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 rounded-lg border border-zinc-700">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-wider text-sm">HKD.DIGITAL</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 text-zinc-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <AnimatePresence>
        {(sidebarOpen || !loading) && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-[260px] bg-zinc-900 border-r border-zinc-800/80 flex flex-col justify-between p-6 h-screen md:translate-x-0 ${
              sidebarOpen ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="flex flex-col gap-8">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl border border-zinc-700">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-wider">HKD.DIGITAL</span>
              </div>

              {/* User Profile Summary */}
              <div className="p-4 bg-zinc-800/50 border border-zinc-700/40 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-zinc-200 border border-zinc-600">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate leading-none">{fullName}</p>
                  <span className="text-[10px] text-zinc-400">@{username}</span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-white text-zinc-950 shadow-lg shadow-white/5 font-bold scale-[1.02]' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-xl text-sm font-medium transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile menu */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-6 py-8 sm:px-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
