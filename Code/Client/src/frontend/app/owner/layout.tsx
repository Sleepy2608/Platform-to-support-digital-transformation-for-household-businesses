'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store, UserCircle, Lock, Mail, CreditCard,
  AlertTriangle, LogOut, Menu, X, ChevronRight,
  Shield, Users, PackageOpen, ReceiptText, ListOrdered,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearAuth, getAccessToken, getAuthItem } from '../lib/apiClient';
import { isOwner } from '../lib/roles';

function getCleanHash(rawHash?: string): string {
  if (!rawHash) return 'profile';
  const clean = rawHash.replace(/^#+/, '').split('#')[0].toLowerCase().trim();
  if (clean === 'email' || clean === 'phone') return 'contact';
  if (clean === 'plans' || clean === 'package') return 'subscription';
  if (clean === 'danger-zone') return 'danger';
  if (clean === 'business') return 'business-profile';
  return clean || 'profile';
}

const ACCOUNT_NAV_ITEMS: Array<{ label: string; href: string; icon: LucideIcon; hash: string }> = [
  { label: 'Hồ sơ cá nhân', href: '/owner/account#profile', icon: UserCircle, hash: '#profile' },
  { label: 'Đổi mật khẩu', href: '/owner/account#password', icon: Lock, hash: '#password' },
  { label: 'Email & Số điện thoại', href: '/owner/account#contact', icon: Mail, hash: '#contact' },
  { label: 'Gói đăng ký', href: '/owner/account#subscription', icon: CreditCard, hash: '#subscription' },
  { label: 'Vùng nguy hiểm', href: '/owner/account#danger', icon: AlertTriangle, hash: '#danger' },
];

const MANAGE_NAV_ITEMS: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  path: string;
  children?: Array<{ label: string; href: string; icon: LucideIcon }>;
}> = [
  { label: 'Sản phẩm & Danh mục', href: '/owner/products', icon: PackageOpen, path: '/owner/products' },
  {
    label: 'Đơn hàng',
    href: '/owner/orders/history',
    icon: ReceiptText,
    path: '/owner/orders',
    children: [
      { label: 'Danh sách đơn hàng', href: '/owner/orders/history', icon: ListOrdered },
    ],
  },
  { label: 'Quản lý nhân viên', href: '/owner/employees', icon: Users, path: '/owner/employees' },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('#profile');

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
        if (!isOwner(roles as never)) {
          router.push('/login');
          return;
        }

        setFullName(getAuthItem('fullName') || 'Chủ hộ kinh doanh');
        setUsername(getAuthItem('username') || '');
        setAvatarUrl(getAuthItem('avatarUrl') || '');
        setLoading(false);
      } catch {
        router.push('/login');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const syncOwnerSummary = (event?: Event) => {
      const detail = event instanceof CustomEvent
        ? event.detail as { fullName?: string; avatarUrl?: string }
        : undefined;
      setFullName(detail?.fullName ?? getAuthItem('fullName') ?? 'Chủ hộ kinh doanh');
      setAvatarUrl(detail?.avatarUrl ?? getAuthItem('avatarUrl') ?? '');
    };

    window.addEventListener('owner-profile-updated', syncOwnerSummary);
    return () => {
      window.removeEventListener('owner-profile-updated', syncOwnerSummary);
    };
  }, []);

  // Keep track of current URL hash to highlight active nav item
  useEffect(() => {
    const syncHash = () => {
      if (typeof window === 'undefined') return;
      const clean = getCleanHash(window.location.hash);
      setCurrentHash(`#${clean}`);
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    const handleCustomTab = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setCurrentHash(`#${getCleanHash(detail)}`);
      }
    };
    window.addEventListener('owner-tab-change', handleCustomTab);

    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('owner-tab-change', handleCustomTab);
    };
  }, []);

  const handleNavAccount = (e: React.MouseEvent, href: string, hash: string) => {
    e.preventDefault();
    const clean = getCleanHash(hash);
    setCurrentHash(`#${clean}`);
    setSidebarOpen(false);

    if (pathname === '/owner/account') {
      window.history.replaceState(null, '', `/owner/account#${clean}`);
      window.dispatchEvent(new CustomEvent('owner-tab-change', { detail: clean }));
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      router.push(href);
    }
  };

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

  const initials = fullName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col md:flex-row relative font-sans antialiased">

      {/* ── Mobile Top Header ── */}
      <div className="md:hidden bg-white/90 border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 text-sm">HKD.DIGITAL</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Sidebar Component ── */}
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
            {/* Top Container */}
            <div className="flex flex-col gap-6 px-5">
              {/* Brand Logo */}
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">HKD.DIGITAL</span>
                  <span className="text-[11px] text-slate-500 font-medium">Quản lý Hộ kinh doanh</span>
                </div>
              </div>

              {/* User Profile Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3 shadow-2xs">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-11 h-11 rounded-full object-cover border border-slate-300 flex-shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-2xs">
                    {initials || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{fullName}</p>
                  <span className="text-xs text-slate-500 font-medium">@{username}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/60 mt-1">
                    <Shield className="w-3 h-3" /> Owner
                  </span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="flex flex-col gap-3">
                {/* Quản lý cửa hàng */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    QUẢN LÝ CỬA HÀNG
                  </p>
                  {MANAGE_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.path);
                    return (
                      <div key={item.path}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group cursor-pointer
                            ${isActive
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90' : 'opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0'}`} />
                        </Link>

                        {isActive && item.children && (
                          <div className="ml-5 mt-1 border-l border-slate-200 pl-3">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const childActive = pathname === child.href;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                    childActive
                                      ? 'bg-slate-100 text-slate-950'
                                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  <ChildIcon className="h-3.5 w-3.5" />
                                  <span>{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Cài đặt tài khoản */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    CÀI ĐẶT TÀI KHOẢN
                  </p>
                  {ACCOUNT_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isDanger = item.hash === '#danger';
                    const isActive = pathname === '/owner/account' && currentHash === item.hash;

                    return (
                      <Link
                        key={item.hash}
                        href={item.href}
                        onClick={(event) => handleNavAccount(event, item.href, item.hash || '#profile')}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group cursor-pointer
                          ${isActive
                            ? isDanger
                              ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-2xs'
                              : 'bg-slate-900 text-white shadow-sm'
                            : isDanger
                            ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (isDanger ? 'text-red-600' : 'text-white') : 'text-slate-400 group-hover:text-slate-600'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0' : 'opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0'}`} />
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Footer / Logout */}
            <div className="px-5">
              <div className="pt-4 border-t border-slate-100 space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Store className="w-4 h-4" />
                  <span>Trang chủ</span>
                </Link>
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

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
