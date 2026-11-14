export type PaginationMeta = {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/**
 * Calculates pagination metadata.
 * @param total - Total number of records in DB
 * @param page - Current page number (1-based)
 * @param limit - Records per page
 * @returns - Object with totalPages, hasNextPage, hasPrevPage, currentPage, limit
 */
export function getPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  // A limit of 0 (or less) would cause a division by zero / Infinity pages.
  if (limit <= 0) {
    throw new RangeError("limit must be greater than 0");
  }

  // No records -> no pages (not 1 page), so Math.ceil(0 / limit) = 0 works,
  // but we guard negative totals too.
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  return {
    total,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    // Only true when there is at least one page AND we are past the first.
    hasPrevPage: totalPages > 0 && page > 1,
  };
}
