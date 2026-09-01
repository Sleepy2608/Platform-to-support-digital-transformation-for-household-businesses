'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle, Lock, Mail, LogOut, Menu, X,
  ChevronRight, Briefcase, ListOrdered, ShoppingCart, BellRing,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, clearAuth, getAccessToken, getAuthItem } from '../lib/apiClient';
import { isEmployee } from '../lib/roles';
import { EntitlementProvider } from '../lib/EntitlementContext';
import NotificationBell from '../components/NotificationBell';

const NAV_ITEMS = [
  { label: 'Bán hàng tại quầy', href: '/employee/orders/new', icon: ShoppingCart, hash: '' },
  { label: 'Danh sách đơn hàng', href: '/employee/orders/history', icon: ListOrdered, hash: '' },
  { label: 'Cảnh báo tồn kho', href: '/employee/inventory-alerts', icon: BellRing, hash: '' },
  { label: 'Hồ sơ cá nhân', href: '/employee/account#profile', icon: UserCircle, hash: '#profile' },
  { label: 'Thay đổi thông tin cá nhân', href: '/employee/account#personal-info', icon: Lock, hash: '#personal-info' },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [position, setPosition] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('#profile');
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = getAccessToken();
      const rolesRaw = getAuthItem('roles');
      if (!token || !rolesRaw) {
        router.push('/login');
        return;
      }
      try {
        const roles: string[] = JSON.parse(rolesRaw);
        if (!isEmployee(roles as never)) {
          router.push('/login');
          return;
        }
        setFullName(getAuthItem('fullName') || 'Nhân viên');
        setUsername(getAuthItem('username') || '');
        setAvatarUrl(getAuthItem('avatarUrl') || '');
        setPosition(getAuthItem('position') || 'Nhân viên');
        setLoading(false);
      } catch {
        router.push('/login');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (loading) return;
    let active = true;
    const refreshCount = async () => {
      try {
        const summary = await apiClient.get<{ totalLowStock: number }>(
          '/api/inventory/low-stock/summary?limit=1',
        );
        if (active) setLowStockCount(summary.totalLowStock);
      } catch {
        // Employee can keep using the app if the optional badge is unavailable.
      }
    };
    void refreshCount();
    const timer = window.setInterval(() => void refreshCount(), 30_000);
    const handleNotification = () => void refreshCount();

    window.addEventListener('hbdt-notification', handleNotification);
    window.addEventListener('product-updated', handleNotification);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('hbdt-notification', handleNotification);
      window.removeEventListener('product-updated', handleNotification);
    };
  }, [loading]);

  useEffect(() => {
    const syncHash = () => {
      setCurrentHash(window.location.hash || '#profile');
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    const interval = setInterval(syncHash, 250);
    return () => {
      window.removeEventListener('hashchange', syncHash);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin" />
          <span className="text-slate-500 text-sm font-medium animate-pulse">Đang tải hệ thống...</span>
        </div>
      </div>
    );
  }

  const initials = fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-[#ededed] text-slate-900 flex flex-col md:flex-row relative font-sans antialiased">

      {/* ── Mobile Top Header ── */}
      <div className="md:hidden bg-white/90 border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 text-sm">HBDT.DIGITAL</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-[270px] bg-white border-r border-slate-200/80
              flex flex-col justify-between py-6 h-screen md:translate-x-0 shadow-xs
              ${sidebarOpen ? 'flex' : 'hidden md:flex'}`}
          >
            <div className="flex flex-col gap-6 px-5">
              {/* Brand */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">HBDT.DIGITAL</span>
                    <span className="text-[11px] text-slate-500 font-medium">Cổng nhân viên</span>
                  </div>
                </div>
                <NotificationBell className="shrink-0" />
              </div>

              {/* User summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3 shadow-2xs">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-11 h-11 rounded-full object-cover border border-slate-300 flex-shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {initials || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{fullName}</p>
                  <span className="text-xs text-slate-500 font-medium">@{username}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-200/60 mt-1">
                    <Briefcase className="w-3 h-3" /> {position || 'Nhân viên'}
                  </span>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                  TÀI KHOẢN CỦA TÔI
                </p>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.hash
                    ? pathname === '/employee/account' && currentHash === item.hash
                    : pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group cursor-pointer
                        ${isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span>{item.label}</span>
                        {item.href === '/employee/inventory-alerts' && lowStockCount > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isActive ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'}`}>
                            {lowStockCount > 99 ? '99+' : lowStockCount}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0' : 'opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="px-5">
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border border-transparent hover:border-red-200/60"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <EntitlementProvider>
          {children}
        </EntitlementProvider>
      </main>
    </div>
  );
}
