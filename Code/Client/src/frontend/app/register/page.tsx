'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Store, ArrowLeft, UserPlus, Lock, Mail, Phone, User,
  CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import ConsentSection from '../components/legal/ConsentSection';
import {
  EMPTY_CONSENT,
  isAllConsented,
  PRIVACY_VERSION,
  TERMS_VERSION,
  type ConsentState,
} from '../lib/legal-content';

type Step = 'form' | 'success';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Xác nhận Điều khoản sử dụng & Chính sách bảo mật (6 mục)
  const [consent, setConsent] = useState<ConsentState>({ ...EMPTY_CONSENT });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (!isAllConsented(consent)) {
      setError('Vui lòng xác nhận đầy đủ Điều khoản sử dụng và Chính sách bảo mật để tiếp tục.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName, username, email, phone, password,
          consent: {
            ...consent,
            termsVersion: TERMS_VERSION,
            privacyVersion: PRIVACY_VERSION,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Đăng ký thất bại');

      setStep('success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const goVerify = () => {
    router.push(`/verify-email?username=${encodeURIComponent(username)}`);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />

      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </Link>

      <div className="relative z-10 w-full max-w-xl my-12">
        <ScrollReveal>
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">

            {step === 'success' ? (
              /* ── Success State ── */
              <div className="text-center py-8 space-y-5">
                <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30 mb-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Đăng ký thành công!</h1>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                  Chúng tôi đã gửi mã OTP 6 chữ số đến email{' '}
                  <span className="text-white font-medium">{email}</span>.
                  Vui lòng kiểm tra hộp thư và nhập mã để kích hoạt tài khoản.
                </p>
                <button
                  onClick={goVerify}
                  className="w-full py-3.5 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác thực ngay
                </button>
                <p className="text-xs text-zinc-500">
                  Không nhận được email?{' '}
                  <button
                    onClick={handleRegister as unknown as React.MouseEventHandler}
                    className="text-zinc-300 hover:text-white underline"
                  >
                    Gửi lại
                  </button>
                </p>
              </div>
            ) : (
              /* ── Registration Form ── */
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-white/10 rounded-2xl border border-zinc-600 mb-4 shadow-inner">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Đăng Ký Dùng Thử</h1>
                  <p className="text-zinc-400 text-sm mt-2">
                    Trải nghiệm trọn bộ giải pháp AI Quản lý &amp; Kế toán TT88 miễn phí 14 ngày
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reg-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        required
                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reg-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="vd: nguyenvana123"
                        required
                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="reg-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912345678"
                          required
                          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                        Địa chỉ Email
                      </label>
                      <div className="relative">
                        <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="reg-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          required
                          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          required
                          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="reg-confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          required
                          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="p-3.5 bg-zinc-800/50 rounded-xl border border-zinc-700/50 text-xs text-zinc-300 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Miễn phí 14 ngày không cần thẻ tín dụng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Hỗ trợ cài đặt &amp; hướng dẫn AI trực tiếp</span>
                    </div>
                  </div>

                  {/* Xác nhận Điều khoản sử dụng & Chính sách bảo mật */}
                  <ConsentSection value={consent} onChange={setConsent} />

                  <button
                    id="reg-submit"
                    type="submit"
                    disabled={loading || !isAllConsented(consent)}
                    className="w-full py-3.5 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                  </button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-zinc-800 text-xs text-zinc-400">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="text-white font-semibold hover:underline">
                    Đăng nhập tại đây
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