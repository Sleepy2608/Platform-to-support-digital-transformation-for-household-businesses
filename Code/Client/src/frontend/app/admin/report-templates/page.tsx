'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ReportTemplatesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/templates');
  }, [router]);

  return (
    <div className="flex h-96 items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Đang chuyển hướng đến trang Mẫu báo cáo...</span>
      </div>
    </div>
  );
}
