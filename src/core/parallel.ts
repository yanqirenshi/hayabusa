/**
 * Bounded-concurrency map. Like Promise.all(items.map(fn)) but at most `limit`
 * tasks run at once.
 *
 * Used to throttle external API calls (Azure ARM / Graph / DevOps,
 * Snowflake `SHOW GRANTS OF ROLE`, etc.) so we get the speed of parallelism
 * without overwhelming connection pools or hitting rate limits.
 *
 * Results preserve input order; thrown errors propagate (the first rejection
 * wins, like Promise.all).
 */
export async function parallelMap<T, U>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<U>
): Promise<U[]> {
  if (items.length === 0) return [];
  const cap = Math.max(1, Math.min(limit, items.length));
  const results: U[] = new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  };

  await Promise.all(Array.from({ length: cap }, () => worker()));
  return results;
}
