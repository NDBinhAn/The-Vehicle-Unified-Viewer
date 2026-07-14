export interface PaginatedResult<T> {
  items: T[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
}

export function sortByTimestampDescending<
  T extends { timestamp: string | Date | number },
>(documents: T[]): T[] {
  return [...documents].sort((left, right) => {
    const leftTime = new Date(left.timestamp).getTime();
    const rightTime = new Date(right.timestamp).getTime();
    return rightTime - leftTime;
  });
}

export function paginateDocuments<T>(
  documents: T[],
  page: number,
  size: number,
): PaginatedResult<T> {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Number(size) || 10);
  const start = (safePage - 1) * safeSize;
  const end = start + safeSize;
  const totalRecords = documents.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / safeSize));

  return {
    items: documents.slice(start, end),
    totalRecords,
    currentPage: safePage,
    totalPages,
  };
}
