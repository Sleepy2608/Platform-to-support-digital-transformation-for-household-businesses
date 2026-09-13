import { apiClient } from './apiClient';

export interface PlatformAnalyticsData {
  totalOwners: number;
  activeUsers: number;
  newUsers?: number;
  newSubscriptions: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PlatformUserDetail {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  roleName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'LOCKED' | 'DEACTIVATED';
  businessId?: number;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Fetch platform analytics overview data.
 * @param startDate Optional start date in YYYY-MM-DD format
 * @param endDate Optional end date in YYYY-MM-DD format
 */
export async function fetchPlatformAnalytics(
  startDate?: string,
  endDate?: string
): Promise<PlatformAnalyticsData> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const query = params.toString();
  const path = `/api/platform/analytics${query ? `?${query}` : ''}`;
  return await apiClient.get<PlatformAnalyticsData>(path);
}

/**
 * Fetch platform user list for drill-down metrics.
 * @param type Metric type: 'owners' | 'active_users' | 'new_users'
 * @param startDate Optional start date
 * @param endDate Optional end date
 */
export async function fetchPlatformUserDetails(
  type: 'owners' | 'active_users' | 'new_users',
  startDate?: string,
  endDate?: string
): Promise<PlatformUserDetail[]> {
  const params = new URLSearchParams();
  params.append('type', type);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const query = params.toString();
  const path = `/api/platform/analytics/details?${query}`;
  return await apiClient.get<PlatformUserDetail[]>(path);
}
