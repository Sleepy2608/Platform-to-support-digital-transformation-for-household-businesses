'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, User, Store, ChevronLeft, ChevronRight,
  Upload, X, CheckCircle2, AlertCircle, Loader2,
  MapPin, Phone, Mail, FileText, Briefcase, Image,
} from 'lucide-react';
import {
  fetchProvinces, fetchDistricts, fetchWards,
  saveBusinessProfile, uploadStoreLogo, uploadStoreCoverImage,
  ProvinceDto, DistrictDto, WardDto, BusinessType, BusinessProfileRequest,
} from '@/app/lib/business-profile';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  businessInfo: z.object({
    businessName: z.string().min(1, 'Tên doanh nghiệp không được để trống').max(255, 'Tên doanh nghiệp tối đa 255 ký tự'),
    taxCode: z
      .string()
      .min(1, 'Mã số thuế không được để trống')
      .regex(/^\d{10}(\d{3})?$/, 'Mã số thuế phải gồm 10 hoặc 13 chữ số'),
    businessType: z
      .enum(['INDIVIDUAL', 'HOUSEHOLD', 'COOPERATIVE', 'SMALL_ENTERPRISE'])
      .or(z.literal(''))
      .refine((val) => val !== '', { message: 'Vui lòng chọn loại hình kinh doanh' }),
    provinceCode: z.string().min(1, 'Vui lòng chọn tỉnh/thành'),
    districtCode: z.string().min(1, 'Vui lòng chọn quận/huyện'),
    wardCode: z.string().min(1, 'Vui lòng chọn xã/phường'),
    detailAddress: z.string().min(1, 'Địa chỉ chi tiết không được để trống').max(500, 'Địa chỉ chi tiết tối đa 500 ký tự'),
  }),
  representative: z.object({
    fullName: z.string().min(1, 'Họ và tên người đại diện không được để trống').max(255, 'Họ và tên tối đa 255 ký tự'),
    phoneNumber: z
      .string()
      .min(1, 'Số điện thoại không được để trống')
      .regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0'),
    email: z.string().min(1, 'Email người đại diện không được để trống').email('Email không đúng định dạng (ví dụ: name@example.com)'),
  }),
  store: z.object({
    storeName: z.string().min(1, 'Tên cửa hàng không được để trống').max(255, 'Tên cửa hàng tối đa 255 ký tự'),
    logoUrl: z.string().optional(),
    coverImageUrl: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof schema>;

// ─── Business Type Labels ─────────────────────────────────────────────────────

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  INDIVIDUAL: 'Cá nhân kinh doanh',
  HOUSEHOLD: 'Hộ kinh doanh',
  COOPERATIVE: 'Hợp tác xã',
  SMALL_ENTERPRISE: 'Doanh nghiệp nhỏ',
};

// ─── Helper: Image Uploader Component ─────────────────────────────────────────

function ImageUploader({
  label,
  value,
  onChange,
  aspect = 'square',
  hint,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  aspect?: 'square' | 'wide';
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File vượt quá 5MB');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const url = label.toLowerCase().includes('logo')
        ? await uploadStoreLogo(file)
        : await uploadStoreCoverImage(file);
      onChange(url);
    } catch {
      setError('Upload thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isWide = aspect === 'wide';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all cursor-pointer group
          ${value ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/20'}
          ${isWide ? 'h-32' : 'h-32 w-32'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Thay đổi</span>
            </div>
            <button
              type="button"
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-xs text-center px-2">
                  {hint || 'Kéo thả hoặc click để chọn ảnh'}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

// ─── Helper: Field Error ──────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-xs text-red-500 mt-1"
    >
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {message}
    </motion.p>
  );
}

// ─── Helper: Section Header ───────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, color = 'emerald' }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
  };
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BusinessProfilePage() {
  const router = useRouter();

  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [districts, setDistricts] = useState<DistrictDto[]>([]);
  const [wards, setWards] = useState<WardDto[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      businessInfo: {
        businessName: '',
        taxCode: '',
        businessType: '' as any,
        provinceCode: '',
        districtCode: '',
        wardCode: '',
        detailAddress: '',
      },
      representative: {
        fullName: '',
        phoneNumber: '',
        email: '',
      },
      store: {
        storeName: '',
        logoUrl: '',
        coverImageUrl: '',
      },
    },
  });

  const selectedProvinceCode = watch('businessInfo.provinceCode');
  const selectedDistrictCode = watch('businessInfo.districtCode');

  // Load provinces on mount
  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(() => {});
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      setValue('businessInfo.districtCode', '');
      setValue('businessInfo.wardCode', '');
      return;
    }
    setLoadingDistricts(true);
    fetchDistricts(selectedProvinceCode)
      .then((data) => {
        setDistricts(data);
        setValue('businessInfo.districtCode', '');
        setValue('businessInfo.wardCode', '');
        setWards([]);
      })
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [selectedProvinceCode, setValue]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      setValue('businessInfo.wardCode', '');
      return;
    }
    setLoadingWards(true);
    fetchWards(selectedDistrictCode)
      .then((data) => {
        setWards(data);
        setValue('businessInfo.wardCode', '');
      })
      .catch(() => {})
      .finally(() => setLoadingWards(false));
  }, [selectedDistrictCode, setValue]);

  const onSubmit = async (data: FormValues) => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const response = await saveBusinessProfile(data as any);
      // Lưu businessId vào sessionStorage
      sessionStorage.setItem('businessId', String(response.id));
      sessionStorage.setItem('isRegisteringOnboarding', 'true');
      // Redirect theo nextStep từ BE
      if (response.nextStep === 'PACKAGE_SELECTION') {
        router.push('/onboarding/package-selection');
      }
    } catch (err: unknown) {
      // Xử lý field-level errors từ BE
      if (err && typeof err === 'object' && 'data' in err) {
        const fieldErrors = (err as { data: Record<string, string> }).data;
        Object.entries(fieldErrors).forEach(([field, message]) => {
          const parts = field.split('.');
          if (parts.length === 2) {
            const [section, key] = parts;
            setError(`${section}.${key}` as Parameters<typeof setError>[0], {
              type: 'server',
              message,
            });
          }
        });
      } else {
        const rawMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.';
        const is403 = rawMsg.includes('403') || rawMsg.includes('Forbidden');
        setSubmitError(
          is403
            ? 'Phiên đăng nhập hết hạn hoặc bạn không có quyền thực hiện. Vui lòng đăng nhập lại!'
            : rawMsg
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Input class helpers ─────────────────────────────────────────────────────

  const inputCls = (hasError: boolean) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium text-gray-900 placeholder:text-slate-400 bg-white transition-all outline-none cursor-text select-text
    ${hasError
      ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-200 focus:border-red-500 text-gray-900'
      : 'border-slate-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 text-gray-900'
    }`;

  const selectCls = (hasError: boolean) =>
    `${inputCls(hasError)} appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 bg-white select-none`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Page title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">
          Hồ sơ doanh nghiệp
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Điền đầy đủ thông tin để hoàn tất đăng ký. Dữ liệu sẽ được xét duyệt bởi đội ngũ HBDT.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ── Section 1: Business Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7"
        >
          <SectionHeader
            icon={Building2}
            title="Thông tin doanh nghiệp"
            subtitle="Tên, mã số thuế, loại hình và địa chỉ kinh doanh"
            color="emerald"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Business Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <FileText className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                Tên doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input
                {...register('businessInfo.businessName')}
                className={inputCls(!!errors.businessInfo?.businessName)}
                placeholder="Hộ kinh doanh Nguyễn Văn A"
              />
              <FieldError message={errors.businessInfo?.businessName?.message} />
            </div>

            {/* Tax Code */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mã số thuế <span className="text-red-500">*</span>
              </label>
              <input
                {...register('businessInfo.taxCode')}
                className={inputCls(!!errors.businessInfo?.taxCode)}
                placeholder="0123456789"
                maxLength={13}
              />
              <FieldError message={errors.businessInfo?.taxCode?.message} />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Briefcase className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                Loại hình kinh doanh <span className="text-red-500">*</span>
              </label>
              <select
                {...register('businessInfo.businessType')}
                className={selectCls(!!errors.businessInfo?.businessType)}
              >
                <option value="" className="text-gray-500 bg-white">-- Chọn loại hình --</option>
                {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map((key) => (
                  <option key={key} value={key} className="text-gray-900 bg-white">
                    {BUSINESS_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
              <FieldError message={errors.businessInfo?.businessType?.message} />
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <MapPin className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                Tỉnh / Thành phố <span className="text-red-500">*</span>
              </label>
              <select
                {...register('businessInfo.provinceCode')}
                className={selectCls(!!errors.businessInfo?.provinceCode)}
              >
                <option value="" className="text-gray-500 bg-white">-- Chọn tỉnh/thành --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code} className="text-gray-900 bg-white">{p.nameWithType || p.name}</option>
                ))}
              </select>
              <FieldError message={errors.businessInfo?.provinceCode?.message} />
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Quận / Huyện <span className="text-red-500">*</span>
              </label>
              <select
                {...register('businessInfo.districtCode')}
                className={selectCls(!!errors.businessInfo?.districtCode)}
                disabled={!selectedProvinceCode || loadingDistricts}
              >
                <option value="" className="text-gray-500 bg-white">
                  {loadingDistricts ? 'Đang tải...' : '-- Chọn quận/huyện --'}
                </option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code} className="text-gray-900 bg-white">{d.nameWithType || d.name}</option>
                ))}
              </select>
              <FieldError message={errors.businessInfo?.districtCode?.message} />
            </div>

            {/* Ward */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Xã / Phường / Thị trấn <span className="text-red-500">*</span>
              </label>
              <select
                {...register('businessInfo.wardCode')}
                className={selectCls(!!errors.businessInfo?.wardCode)}
                disabled={!selectedDistrictCode || loadingWards}
              >
                <option value="" className="text-gray-500 bg-white">
                  {loadingWards ? 'Đang tải...' : '-- Chọn xã/phường --'}
                </option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code} className="text-gray-900 bg-white">{w.nameWithType || w.name}</option>
                ))}
              </select>
              <FieldError message={errors.businessInfo?.wardCode?.message} />
            </div>

            {/* Detail Address */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <input
                {...register('businessInfo.detailAddress')}
                className={inputCls(!!errors.businessInfo?.detailAddress)}
                placeholder="Số nhà, tên đường, khu phố..."
              />
              <FieldError message={errors.businessInfo?.detailAddress?.message} />
            </div>
          </div>
        </motion.div>

        {/* ── Section 2: Representative Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7"
        >
          <SectionHeader
            icon={User}
            title="Thông tin người đại diện"
            subtitle="Người có thẩm quyền đại diện pháp lý cho doanh nghiệp"
            color="blue"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                {...register('representative.fullName')}
                className={inputCls(!!errors.representative?.fullName)}
                placeholder="Nguyễn Văn A"
              />
              <FieldError message={errors.representative?.fullName?.message} />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Phone className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                {...register('representative.phoneNumber')}
                className={inputCls(!!errors.representative?.phoneNumber)}
                placeholder="0901234567"
                maxLength={10}
                type="tel"
              />
              <FieldError message={errors.representative?.phoneNumber?.message} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Mail className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('representative.email')}
                className={inputCls(!!errors.representative?.email)}
                placeholder="nguyen@example.com"
                type="email"
              />
              <FieldError message={errors.representative?.email?.message} />
            </div>
          </div>
        </motion.div>

        {/* ── Section 3: Store Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7"
        >
          <SectionHeader
            icon={Store}
            title="Thông tin cửa hàng"
            subtitle="Tên và hình ảnh thương hiệu của cửa hàng"
            color="violet"
          />

          {/* Store Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên cửa hàng <span className="text-red-500">*</span>
            </label>
            <input
              {...register('store.storeName')}
              className={inputCls(!!errors.store?.storeName)}
              placeholder="Cửa hàng Nguyễn Văn A"
            />
            <FieldError message={errors.store?.storeName?.message} />
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo */}
            <Controller
              name="store.logoUrl"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  label="Logo cửa hàng"
                  value={field.value}
                  onChange={field.onChange}
                  aspect="square"
                  hint="PNG/JPG/WEBP, tối đa 5MB"
                />
              )}
            />

            {/* Cover Image */}
            <Controller
              name="store.coverImageUrl"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  label="Ảnh bìa cửa hàng"
                  value={field.value}
                  onChange={field.onChange}
                  aspect="wide"
                  hint="Ảnh ngang 16:9, tối đa 5MB"
                />
              )}
            />
          </div>

          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            Ảnh được upload ngay khi chọn file. Bạn có thể bỏ qua và cập nhật sau.
          </p>
        </motion.div>

        {/* ── Submit Error ── */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation Buttons ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between gap-4 pt-2 pb-8"
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                Lưu & Tiếp tục
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      </form>
    </>
  );
}
