export type LowStockSort = 'URGENCY' | 'NEWEST' | 'NAME';

export interface LowStockListItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  quantityOnHand: number;
  minimumStock: number;
  status: 'ACTIVE' | 'RESOLVED';
  needsRestock: boolean;
  triggeredAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
}

export interface ThresholdListItem {
  productId: number;
  productCode: string;
  productName: string;
  quantityOnHand: number;
  minimumStock: number | null;
  configured: boolean;
  lowStock: boolean;
}

export interface PageSlice<T> {
  items: T[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalItems: number;
  from: number;
  to: number;
}

export interface ThresholdValidationResult {
  valid: boolean;
  value: number | null;
  message: string;
}

export interface LowStockStatistics {
  activeAlerts: number;
  trackedProducts: number;
  configuredProducts: number;
  safeProducts: number;
  configurationProgress: number;
}

export function normalizeSearchText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();
}

export function matchesProductSearch(
  item: Pick<LowStockListItem, 'productCode' | 'productName'>,
  query: string,
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  const searchable = normalizeSearchText(`${item.productCode} ${item.productName}`);
  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => searchable.includes(token));
}

export function shortageAmount(
  item: Pick<LowStockListItem, 'quantityOnHand' | 'minimumStock'>,
) {
  return Math.max(0, Number(item.minimumStock) - Number(item.quantityOnHand));
}

export function stockRatio(
  item: Pick<LowStockListItem, 'quantityOnHand' | 'minimumStock'>,
) {
  const threshold = Number(item.minimumStock);
  if (!Number.isFinite(threshold) || threshold <= 0) return 1;
  const quantity = Number(item.quantityOnHand);
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, quantity / threshold);
}

export function stockSeverity(
  item: Pick<LowStockListItem, 'quantityOnHand' | 'minimumStock' | 'status'>,
) {
  if (item.status === 'RESOLVED') return 'RESOLVED' as const;
  const ratio = stockRatio(item);
  if (ratio <= 0.25) return 'CRITICAL' as const;
  if (ratio <= 0.6) return 'HIGH' as const;
  return 'LOW' as const;
}

function dateValue(value: string | null | undefined) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortLowStockAlerts<T extends LowStockListItem>(
  items: T[],
  sort: LowStockSort,
) {
  return [...items].sort((left, right) => {
    if (sort === 'NAME') {
      return left.productName.localeCompare(right.productName, 'vi', { sensitivity: 'base' });
    }
    if (sort === 'NEWEST') {
      return dateValue(right.lastDetectedAt) - dateValue(left.lastDetectedAt);
    }
    if (left.status !== right.status) return left.status === 'ACTIVE' ? -1 : 1;
    const shortageDifference = shortageAmount(right) - shortageAmount(left);
    if (shortageDifference !== 0) return shortageDifference;
    return stockRatio(left) - stockRatio(right);
  });
}

export function filterAndSortAlerts<T extends LowStockListItem>(
  items: T[],
  query: string,
  sort: LowStockSort,
) {
  return sortLowStockAlerts(
    items.filter((item) => matchesProductSearch(item, query)),
    sort,
  );
}

export function clampPage(page: number, pageCount: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.min(Math.floor(page), Math.max(1, pageCount)));
}

export function paginate<T>(items: T[], requestedPage: number, pageSize: number): PageSlice<T> {
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1;
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const page = clampPage(requestedPage, pageCount);
  const start = (page - 1) * safePageSize;
  const pageItems = items.slice(start, start + safePageSize);
  return {
    items: pageItems,
    page,
    pageSize: safePageSize,
    pageCount,
    totalItems: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + safePageSize, items.length),
  };
}

export function validateMinimumStock(rawValue: string): ThresholdValidationResult {
  const normalized = rawValue.trim();
  if (!normalized) {
    return { valid: false, value: null, message: 'Vui lòng nhập ngưỡng tồn kho.' };
  }
  if (normalized.startsWith('-')) {
    return { valid: false, value: null, message: 'Ngưỡng tồn kho không được âm.' };
  }
  if (!/^\d+$/.test(normalized)) {
    return { valid: false, value: null, message: 'Ngưỡng tồn kho phải là số nguyên không âm.' };
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { valid: false, value: null, message: 'Ngưỡng tồn kho phải là một số hợp lệ.' };
  }
  if (value > 999_999_999_999_999) {
    return { valid: false, value: null, message: 'Ngưỡng tồn kho vượt quá giới hạn cho phép.' };
  }
  return { valid: true, value, message: '' };
}

export function calculateLowStockStatistics(
  alerts: LowStockListItem[],
  thresholds: ThresholdListItem[],
): LowStockStatistics {
  const activeProductIds = new Set(
    alerts.filter((alert) => alert.status === 'ACTIVE').map((alert) => alert.productId),
  );
  const configuredProducts = thresholds.filter((item) => item.configured).length;
  const trackedProducts = thresholds.length || new Set(alerts.map((alert) => alert.productId)).size;
  const safeProducts = thresholds.filter((item) => item.configured && !item.lowStock).length;
  return {
    activeAlerts: activeProductIds.size,
    trackedProducts,
    configuredProducts,
    safeProducts,
    configurationProgress: trackedProducts === 0
      ? 0
      : Math.round((configuredProducts / trackedProducts) * 100),
  };
}
