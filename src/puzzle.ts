import games from './data/games.json';

// Puzzle #1 is this calendar day in America/New_York.
export const LAUNCH_DATE = '2026-10-15';

// One fixed timezone so the whole group flips to the next puzzle at the same moment.
export const TIME_ZONE = 'America/New_York';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The calendar date (YYYY-MM-DD) in America/New_York at the given instant. */
export function dateInTimeZone(now: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Whole days from one YYYY-MM-DD calendar date to another. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

/** The puzzle number at the given instant. Before launch, everyone sees puzzle #1. */
export function puzzleNumber(now: Date): number {
  return Math.max(1, daysBetween(LAUNCH_DATE, dateInTimeZone(now)) + 1);
}

/** The game for puzzle #n. Past the end of the list, play wraps back to the start. */
export function gameFor(n: number, list: readonly string[] = games): string {
  return list[(n - 1) % list.length];
}

/** A puzzle is a Remaster if its game already appeared in an earlier puzzle. */
export function isRemaster(n: number, list: readonly string[] = games): boolean {
  if (n > list.length) return true;
  return list.slice(0, n - 1).includes(gameFor(n, list));
}
