export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort: string | null;
  order: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function createPagination(total: number, page: number, limit: number): PaginationResult {
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
  const sort = searchParams.get('sort');
  const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
  return { page, limit, sort, order };
}

export function createCursorPagination<T extends { id: string }>(
  items: T[],
  cursor?: string
): CursorPaginationResult<T> {
  const pageSize = items.length;
  const hasMore = pageSize > 20;
  const trimmedItems = hasMore ? items.slice(0, 20) : items;
  const nextCursor = hasMore ? trimmedItems[trimmedItems.length - 1]?.id || null : null;

  return {
    items: trimmedItems,
    nextCursor,
    hasMore,
  };
}
