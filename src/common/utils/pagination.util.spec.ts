import {
  paginateDocuments,
  sortByTimestampDescending,
} from './pagination.util';

describe('pagination util', () => {
  it('sorts documents descending by timestamp', () => {
    const result = sortByTimestampDescending([
      { timestamp: '2024-01-01T00:00:00.000Z' },
      { timestamp: '2024-02-01T00:00:00.000Z' },
    ]);

    expect(result[0].timestamp).toBe('2024-02-01T00:00:00.000Z');
  });

  it('paginates documents with safe defaults', () => {
    const result = paginateDocuments([1, 2, 3], 1, 2);

    expect(result.items).toEqual([1, 2]);
    expect(result.totalRecords).toBe(3);
    expect(result.totalPages).toBe(2);
  });
});
