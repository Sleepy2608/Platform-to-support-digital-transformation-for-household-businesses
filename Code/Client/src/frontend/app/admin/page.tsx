'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Shield, Cpu, Clock, ArrowRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function AdminDashboard() {
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch('http://localhost:8080/api/admin/accounts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const res = await response.json();
          if (res.success && Array.isArray(res.data)) {
            setAdminCount(res.data.length);
          }
        }
      } catch (err) {
        console.error('Error fetching admin count', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const stats = [
    {
      name: 'Tài khoản Quản trị',
      value: adminCount !== null ? adminCount.toString() : '...',
      subText: 'Đang hoạt động trên hệ thống',
      icon: Users,
      color: 'text-white bg-white/10',
    },
    {
      name: 'Trạng thái Hệ thống',
      value: 'Hoạt động',
      subText: 'Tất cả các dịch vụ ổn định',
      icon: Cpu,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      name: 'Môi trường',
      value: 'Development',
      subText: 'Phiên bản v1.0.0',
      icon: Shield,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Tổng quan Hệ thống</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Bảng điều khiển quản trị trung tâm của HKD.DIGITAL
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <ScrollReveal key={stat.name} delay={index * 0.1}>
              <div className="p-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    {stat.name}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black">
                    {stat.value}
                  </div>
                  <span className="text-xs text-zinc-500 block">
                    {stat.subText}
                  </span>
                </div>
                <div className={`p-4 rounded-xl border border-zinc-700/50 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Quick Links & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <ScrollReveal delay={0.3}>
          <div className="p-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-6 h-full flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold">Thao tác nhanh</h2>
              <p className="text-zinc-400 text-xs mt-1">
                Các phím tắt điều hướng nhanh đến các khu vực quản trị quan trọng.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                href="/admin/accounts"
                className="p-4 bg-zinc-800/60 border border-zinc-700/40 hover:border-zinc-500 rounded-xl flex flex-col justify-between gap-4 transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-800 active:scale-95 group"
              >
                <div className="p-2.5 bg-white/5 border border-zinc-700 w-fit rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Tài khoản Admin</span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* System Activity Log */}
        <ScrollReveal delay={0.4}>
          <div className="p-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold">Nhật ký hoạt động</h2>
              <p className="text-zinc-400 text-xs mt-1">
                Các sự kiện bảo mật và vận hành hệ thống mới nhất.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 items-start text-xs border-b border-zinc-800 pb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-300">Khởi chạy hệ thống hoàn tất</p>
                  <p className="text-zinc-500 mt-0.5">DatabaseSeeder đã khởi tạo vai trò và tài khoản quản trị mặc định.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start text-xs">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-300">Biên dịch mã nguồn thành công</p>
                  <p className="text-zinc-500 mt-0.5">Lombok annotation processor hoạt động tốt trên môi trường JDK 25.</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
