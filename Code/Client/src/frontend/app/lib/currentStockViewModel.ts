export type CurrentStockSort = 'NAME' | 'QUANTITY_ASC' | 'UPDATED_DESC';

export interface CurrentStockListItem {
  productId: number;
  productCode: string;
  productName: string;
  categoryId: number | null;
  categoryName: string | null;
  baseUnitId: number;
  baseUnitName: string | null;
  quantityOnHand: number;
  updatedAt: string | null;
}

export interface CurrentStockStatistics {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
}

export function normalizeStockSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (character) => character === 'đ' ? 'd' : 'D')
    .toLocaleLowerCase('vi-VN')
    .trim();
}

export function matchesCurrentStockSearch(
  item: Pick<CurrentStockListItem, 'productCode' | 'productName' | 'categoryName'>,
  query: string,
): boolean {
  const normalizedQuery = normalizeStockSearch(query);
  if (!normalizedQuery) return true;

  return [item.productCode, item.productName, item.categoryName ?? '']
    .some((value) => normalizeStockSearch(value).includes(normalizedQuery));
}

export function sortCurrentStock<T extends CurrentStockListItem>(
  items: T[],
  sort: CurrentStockSort,
): T[] {
  return [...items].sort((left, right) => {
    if (sort === 'QUANTITY_ASC') {
      return left.quantityOnHand - right.quantityOnHand
        || left.productName.localeCompare(right.productName, 'vi');
    }
    if (sort === 'UPDATED_DESC') {
      const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
      const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
      return rightTime - leftTime
        || left.productName.localeCompare(right.productName, 'vi');
    }
    return left.productName.localeCompare(right.productName, 'vi');
  });
}

export function filterAndSortCurrentStock<T extends CurrentStockListItem>(
  items: T[],
  query: string,
  sort: CurrentStockSort,
): T[] {
  return sortCurrentStock(
    items.filter((item) => matchesCurrentStockSearch(item, query)),
    sort,
  );
}

export function calculateCurrentStockStatistics(
  items: CurrentStockListItem[],
): CurrentStockStatistics {
  return items.reduce<CurrentStockStatistics>((statistics, item) => {
    statistics.totalProducts += 1;
    if (item.quantityOnHand > 0) {
      statistics.inStockProducts += 1;
    } else {
      statistics.outOfStockProducts += 1;
    }
    return statistics;
  }, {
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
  });
}

export function paginateCurrentStock<T>(items: T[], requestedPage: number, pageSize = 12) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, Math.floor(requestedPage)), pageCount)
    : 1;
  const start = (page - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page,
    pageCount,
    totalItems: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + safePageSize, items.length),
  };
}
