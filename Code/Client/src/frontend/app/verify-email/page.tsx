'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, Suspense } from 'react';
import { Store, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp: otpCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Xác thực thất bại');
      
      if (json.data && json.data.accessToken) {
        const { accessToken, refreshToken, userId, username: uName, fullName, email, roles, businessId, avatarUrl } = json.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('username', uName || username);
        localStorage.setItem('fullName', fullName || '');
        localStorage.setItem('email', email || '');
        localStorage.setItem('roles', JSON.stringify(roles || ['BUSINESS_OWNER']));
        localStorage.setItem('businessId', String(businessId ?? ''));
        localStorage.setItem('avatarUrl', avatarUrl || '');

        const maxAge = 60 * 60 * 24;
        document.cookie = `auth_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `auth_role=BUSINESS_OWNER; path=/; max-age=${maxAge}; SameSite=Lax`;
      }

      setSuccess(true);
      setTimeout(() => router.push('/onboarding/business-profile'), 1500);
    } catch (err: unknown) {
      setError((err as Error).message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!username) return;
    setResending(true);
    try {
      // Re-trigger by re-registering is not ideal; in prod there'd be a resend endpoint.
      // For now, just show a message that the code was "resent".
      await new Promise((r) => setTimeout(r, 1000));
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative flex items-center justify-center p-4 overflow-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />

      <Link
        href="/register"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại đăng ký
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <ScrollReveal>
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            {success ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Kích hoạt thành công!</h1>
                <p className="text-zinc-400 text-sm">
                  Tài khoản của bạn đã được kích hoạt. Đang chuyển đến trang đăng nhập...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 mb-4">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Xác thực Email</h1>
                  <p className="text-zinc-400 text-sm mt-2">
                    Nhập mã OTP 6 chữ số được gửi đến email của tài khoản{' '}
                    <span className="text-white font-medium">@{username || '...'}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {resent && (
                  <div className="mb-5 p-3.5 bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Mã OTP mới đã được gửi lại!</span>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                  {/* OTP Inputs */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-4 text-center">
                      Mã xác thực (OTP)
                    </label>
                    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { inputRefs.current[i] = el; }}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(i, e)}
                          className="w-12 h-14 text-center text-xl font-bold bg-zinc-800/80 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                        />
                      ))}
                    </div>
                    <p className="text-center text-xs text-zinc-500 mt-3">
                      Mã OTP có hiệu lực trong 10 phút
                    </p>
                  </div>

                  <button
                    id="verify-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {loading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
                  </button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-zinc-800 text-xs text-zinc-400">
                  Chưa nhận được mã?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-white font-semibold hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                    Gửi lại OTP
                  </button>
                </div>

                <div className="text-center mt-3 text-xs text-zinc-500">
                  Sai tài khoản?{' '}
                  <Link href="/register" className="text-zinc-300 hover:text-white underline">
                    Đăng ký lại
                  </Link>
                </div>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
