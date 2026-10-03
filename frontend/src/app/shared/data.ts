import { Api } from '../services/api';
// Select controls must include every record, not just the first list page.
export async function allRecords<T>(api: Api, path: string): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  while (true) {
    const result = await api.request<T[]>(
      `${path}${path.includes('?') ? '&' : '?'}limit=100&page=${page}`,
    );
    rows.push(...result.data);
    if (!result.meta || page >= result.meta.totalPages) return rows;
    page++;
  }
}
