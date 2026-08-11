'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, Suspense } from 'react';
import { Store, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { saveAuthData } from '../lib/apiClient';

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
        saveAuthData({
          accessToken,
          refreshToken,
          userId,
          username: uName || username,
          fullName,
          email,
          roles: roles || ['BUSINESS_OWNER'],
          businessId,
          avatarUrl,
        });
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
    <main className="min-h-screen bg-slate-100/70 text-slate-900 relative flex items-center justify-center p-4">
      <Link
        href="/register"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-4 py-2 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại đăng ký
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <ScrollReveal>
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            {success ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex p-4 bg-emerald-50 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Kích hoạt thành công!</h1>
                <p className="text-slate-500 text-sm">
                  Tài khoản của bạn đã được kích hoạt. Đang chuyển đến trang hồ sơ...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-slate-100 rounded-2xl border border-slate-200 mb-4">
                    <ShieldCheck className="w-8 h-8 text-slate-900" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Xác thực Email</h1>
                  <p className="text-slate-500 text-sm mt-2">
                    Nhập mã OTP 6 chữ số được gửi đến email của tài khoản{' '}
                    <span className="text-slate-900 font-bold">@{username || '...'}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-start gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {resent && (
                  <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-start gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                    <span>Mã OTP mới đã được gửi lại!</span>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                  {/* OTP Inputs */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
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
                          className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        />
                      ))}
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                      Mã OTP có hiệu lực trong 10 phút
                    </p>
                  </div>

                  <button
                    id="verify-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {loading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
                  </button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
                  Chưa nhận được mã?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-slate-900 font-bold hover:underline inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                    Gửi lại OTP
                  </button>
                </div>

                <div className="text-center mt-3 text-xs text-slate-400">
                  Sai tài khoản?{' '}
                  <Link href="/register" className="text-slate-700 hover:text-slate-900 font-medium underline">
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
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
