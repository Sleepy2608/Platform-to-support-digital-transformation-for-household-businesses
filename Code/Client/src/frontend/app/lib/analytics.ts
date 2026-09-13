import { apiClient } from './apiClient';

export interface PlatformAnalyticsData {
  totalOwners: number;
  activeUsers: number;
  newSubscriptions: number;
  startDate?: string | null;
  endDate?: string | null;
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
