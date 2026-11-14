import { getPaginationMeta } from "../utils/pagination.util";

describe("getPaginationMeta", () => {
  // Scenario 1
  it("standard case: 100 total, page 1, limit 10", () => {
    const meta = getPaginationMeta(100, 1, 10);

    expect(meta.totalPages).toBe(10);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(false);
  });

  // Scenario 2
  it("last page: 100 total, page 10, limit 10", () => {
    const meta = getPaginationMeta(100, 10, 10);

    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(true);
  });

  // Scenario 3
  it("middle page: 50 total, page 3, limit 5", () => {
    const meta = getPaginationMeta(50, 3, 5);

    expect(meta.totalPages).toBe(10);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  // Scenario 4
  it("partial last page: 23 total, page 3, limit 10", () => {
    const meta = getPaginationMeta(23, 3, 10);

    // 23 / 10 = 2.3 -> must round UP to 3 pages
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(true);
  });

  // Scenario 5
  it("single page: 5 total, page 1, limit 10", () => {
    const meta = getPaginationMeta(5, 1, 10);

    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });

  // Scenario 6
  it("zero total records: 0 total, page 1, limit 10", () => {
    const meta = getPaginationMeta(0, 1, 10);

    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });

  // ---- Extra checks beyond the required six scenarios ----

  it("returns the full expected shape and echoes the inputs", () => {
    expect(getPaginationMeta(100, 1, 10)).toEqual({
      total: 100,
      totalPages: 10,
      currentPage: 1,
      limit: 10,
      hasNextPage: true,
      hasPrevPage: false,
    });
  });

  it("exact multiple of limit does not create an extra empty page", () => {
    // 20 / 10 = exactly 2, not 3
    expect(getPaginationMeta(20, 1, 10).totalPages).toBe(2);
  });

  it("throws a RangeError when limit is 0 (avoids division by zero)", () => {
    expect(() => getPaginationMeta(10, 1, 0)).toThrow(RangeError);
  });

  it("throws a RangeError when limit is negative", () => {
    expect(() => getPaginationMeta(10, 1, -5)).toThrow(RangeError);
  });
});
