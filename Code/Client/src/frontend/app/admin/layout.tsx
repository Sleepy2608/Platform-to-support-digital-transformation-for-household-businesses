'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, Store, Menu, X, Database, BadgeDollarSign, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { clearAuth, getAccessToken, getAuthItem } from '../lib/apiClient';
import { isAdmin, type AppRole } from '../lib/roles';

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
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Trang đăng nhập admin không cần token -> bỏ qua kiểm tra
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    const rolesStr = getAuthItem('roles');

    if (!token || !rolesStr) {
      router.push('/admin/login');
      return;
    }

    try {
      const parsedRoles: AppRole[] = JSON.parse(rolesStr);

      // Route Guard: chỉ ADMIN được vào /admin
      if (!isAdmin(parsedRoles)) {
        router.push('/admin/login');
        return;
      }

      setRoles(parsedRoles);
      setFullName(getAuthItem('fullName') || 'Administrator');
      setUsername(getAuthItem('username') || 'admin');
      setLoading(false);
    } catch {
      router.push('/admin/login');
    }
  }, [router, pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push('/admin/login');
  };

  // Trang đăng nhập admin: render thẳng, không bọc sidebar/kiểm tra quyền
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

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

  const headAdmin = isAdmin(roles);

  /**
   * Menu Guard: ADMIN (toàn quyền)
   */
  const navItems = [
    { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
    { name: 'Tài khoản Manager', href: '/admin/accounts', icon: Users },
    { name: 'Gói thuê bao', href: '/admin/subscription-plans', icon: BadgeDollarSign },
    { name: 'Seek Data', href: '/admin/seed', icon: Database },
  ];

  // Badge hiển thị role trong sidebar
  const roleBadge = (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold mt-1">
      <ShieldCheck className="w-3 h-3" /> ADMIN
    </span>
  );

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
                  {/* Role badge – Menu Guard indicator */}
                  <div>{roleBadge}</div>
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
