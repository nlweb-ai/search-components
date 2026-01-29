/**
 * abridgedCount(999) => "999"
 * abridgedCount(1_500) => "1.5K"
 * abridgedCount(15_000) => "15K"
 * abridgedCount(150_000) => "150K"
 * abridgedCount(2_500_000) => "2.5M"
 * abridgedCount(25_000_000) => "25M"
 * abridgedCount(3_600_000_000) => "3.6B"
 * abridgedCount(7_000_000_000) => "7B"
 * ...
 */
export function abridgedCount(n: number): string {
  if (n < 1000) {
    return n.toString();
  }
  
  if (n < 1_000_000) {
    const divided = n / 1000;
    const formatted = divided % 1 === 0 ? divided.toString() : divided.toFixed(1);
    return formatted + 'K';
  }
  
  if (n < 1_000_000_000) {
    const divided = n / 1_000_000;
    const formatted = divided % 1 === 0 ? divided.toString() : divided.toFixed(1);
    return formatted + 'M';
  }
  
  const divided = n / 1_000_000_000;
  const formatted = divided % 1 === 0 ? divided.toString() : divided.toFixed(1);
  return formatted + 'B';
}

/**
 * The order of magnitude of a number in base 10.
 */
export function magnitude(n: number): number {
  if (n === 0) return 0;
  return Math.floor(Math.log10(Math.abs(n)));
}

/** 
 * Picks only truthy values from an array.
 */
export function filterTruthy<T>(arr: (T | null | undefined | false)[]): T[] {
  return arr.filter(Boolean) as T[];
}

export function intersperse<T>(arr: T[], sep: T): T[] {
  if (arr.length === 0) return [];
  return arr.slice(1).reduce((acc, item) => acc.concat([sep, item]), [arr[0]]);
}

export function shortQuantity(value: string | number): string {
  const parsed = tryParseNumber(value);
  return typeof parsed === 'number' && !isNaN(parsed) ?
    abridgedCount(parsed) :
    String(value);
}

function tryParseNumber(value: string | number): string | number {
  try {
    return typeof value === 'string' ? parseFloat(value) : value;
  } catch {
    // Should not happen given type of `value`, but just in case.
    return value;
  }
}
