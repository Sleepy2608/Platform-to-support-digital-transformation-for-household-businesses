'use client';

import PlatformAnalyticsDashboard from '../../components/PlatformAnalyticsDashboard';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Thống kê nền tảng</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Báo cáo tình hình tăng trưởng Owner, người dùng active và lượt subscription mới.
        </p>
      </div>

      <PlatformAnalyticsDashboard variant="dark" />
    </div>
  );
}
