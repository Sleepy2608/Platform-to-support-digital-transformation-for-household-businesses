'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import {
  ArrowLeft, Mail, KeyRound, Lock, AlertCircle,
  CheckCircle2, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  // Step 1: email
  const [email, setEmail] = useState('');

  // Step 2: OTP + new passwords
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Step 1: Request OTP ──────────────────────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không tìm thấy email');
      setStep('reset');
    } catch (err: unknown) {
      setError((err as Error).message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP inputs ───────────────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
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

  // ── Step 2: Reset password ───────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpCode,
          newPassword,
          confirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Đặt lại mật khẩu thất bại');
      setStep('done');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      setError((err as Error).message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative flex items-center justify-center p-4 overflow-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />

      <Link
        href="/login"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <ScrollReveal>
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">

            {/* ── Done State ── */}
            {step === 'done' && (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Đặt lại thành công!</h1>
                <p className="text-zinc-400 text-sm">
                  Mật khẩu của bạn đã được cập nhật. Đang chuyển đến trang đăng nhập...
                </p>
              </div>
            )}

            {/* ── Step 1: Email ── */}
            {step === 'email' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 mb-4">
                    <KeyRound className="w-8 h-8 text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Quên Mật Khẩu</h1>
                  <p className="text-zinc-400 text-sm mt-2">
                    Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    id="forgot-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-500 text-zinc-950 font-bold rounded-xl hover:bg-amber-400 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
                  </button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-zinc-800 text-xs text-zinc-400">
                  Nhớ mật khẩu rồi?{' '}
                  <Link href="/login" className="text-white font-semibold hover:underline">
                    Đăng nhập
                  </Link>
                </div>
              </>
            )}

            {/* ── Step 2: OTP + New Password ── */}
            {step === 'reset' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 mb-4">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Đặt Lại Mật Khẩu</h1>
                  <p className="text-zinc-400 text-sm mt-2">
                    Nhập mã OTP đã gửi đến <span className="text-white">{email}</span> và mật khẩu mới.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* OTP */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3 text-center">
                      Mã OTP (6 chữ số)
                    </label>
                    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { inputRefs.current[i] = el; }}
                          id={`reset-otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(i, e)}
                          className="w-11 h-13 text-center text-lg font-bold bg-zinc-800/80 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reset-new-password"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reset-confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        required
                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="reset-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']); }}
                    className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
                  >
                    ← Sử dụng email khác
                  </button>
                </form>
              </>
            )}

          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
