const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(str: string): boolean {
  return OBJECT_ID_RE.test(str);
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MAX_PAGE_LIMIT = 100;

export function clampPagination(
  page?: string | number | null,
  limit?: string | number | null
): { page: number; limit: number; skip: number } {
  const p = Math.max(1, Math.floor(Number(page) || 1));
  const l = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(Number(limit) || 20)));
  return { page: p, limit: l, skip: (p - 1) * l };
}

export function isValidDate(str: string): boolean {
  const d = new Date(str);
  return !isNaN(d.getTime());
}

/** 10 MB max file size for base64 data */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
