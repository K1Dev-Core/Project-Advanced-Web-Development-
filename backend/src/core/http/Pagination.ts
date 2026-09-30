export interface PageRequest {
  page: number;
  limit: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export class Pagination {
  static offset(request: PageRequest): number {
    return (request.page - 1) * request.limit;
  }

  static meta<T>(page: Page<T>): Record<string, number> {
    return {
      total: page.total,
      page: page.page,
      limit: page.limit,
      totalPages: Math.max(1, Math.ceil(page.total / page.limit)),
    };
  }
}
