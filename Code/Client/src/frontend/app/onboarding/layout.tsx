'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Store, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 1, label: 'Tạo tài khoản', path: '/register' },
  { id: 2, label: 'Hồ sơ doanh nghiệp', path: '/onboarding/business-profile' },
  { id: 3, label: 'Chọn gói dịch vụ', path: '/onboarding/package-selection' },
];

function getActiveStep(pathname: string): number {
  if (pathname.includes('business-profile')) return 2;
  if (pathname.includes('package-selection')) return 3;
  return 1;
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeStep, setActiveStep] = useState(2);
  const [username, setUsername] = useState('');

  useEffect(() => {
    setActiveStep(getActiveStep(pathname));
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const rolesRaw = localStorage.getItem('roles');
    if (!token || !rolesRaw) {
      router.push('/login');
      return;
    }
    try {
      const roles: string[] = JSON.parse(rolesRaw);
      if (!roles.includes('BUSINESS_OWNER')) {
        router.push('/login');
        return;
      }
      setUsername(localStorage.getItem('fullName') || localStorage.getItem('username') || '');
    } catch {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm hidden sm:block">HBDT Platform</span>
          </Link>

          {/* User greeting */}
          {username && (
            <span className="text-xs text-slate-500 hidden sm:block">
              Xin chào, <span className="font-semibold text-slate-700">{username}</span>
            </span>
          )}
        </div>

        {/* ── Stepper ── */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-4">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((step, idx) => {
              const isDone = step.id < activeStep;
              const isActive = step.id === activeStep;

              return (
                <div key={step.id} className="flex items-center">
                  {/* Step node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isActive
                          ? 'bg-white border-emerald-500 text-emerald-600'
                          : 'bg-white border-slate-300 text-slate-400'
                        }
                      `}
                    >
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4" />
                        : isActive
                        ? <span className="text-xs font-bold">{step.id}</span>
                        : <Circle className="w-3.5 h-3.5" />
                      }
                    </motion.div>
                    <span
                      className={`text-xs font-medium whitespace-nowrap transition-colors ${
                        isActive ? 'text-emerald-600' : isDone ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`
                        h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-all duration-500
                        ${step.id < activeStep ? 'bg-emerald-400' : 'bg-slate-200'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
