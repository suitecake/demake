// Locked pitches live in localStorage, keyed by puzzle number. Storage can be missing or throw
// (private browsing, blocked cookies), so every access is guarded and the game works without it.

export interface SavedPitch {
  title: string;
  picks: string[];
}

const PREFIX = 'demake:pitch:';

// Even reading window.localStorage can throw (Safari with cookies blocked), so it's read inside try.
function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isSavedPitch(value: unknown): value is SavedPitch {
  const v = value as SavedPitch;
  return typeof v?.title === 'string' && Array.isArray(v.picks) && v.picks.every((p) => typeof p === 'string');
}

export function loadPitch(n: number, storage = defaultStorage()): SavedPitch | undefined {
  try {
    const value: unknown = JSON.parse(storage?.getItem(PREFIX + n) ?? 'null');
    return isSavedPitch(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function savePitch(n: number, pitch: SavedPitch, storage = defaultStorage()): boolean {
  try {
    storage?.setItem(PREFIX + n, JSON.stringify(pitch));
    return storage !== undefined;
  } catch {
    return false;
  }
}

/** The most recent pitch for the same game from an earlier puzzle, for Remaster days. */
export function findEarlierPitch(
  n: number,
  title: string,
  storage = defaultStorage(),
): { n: number; pitch: SavedPitch } | undefined {
  for (let earlier = n - 1; earlier >= 1; earlier--) {
    const pitch = loadPitch(earlier, storage);
    if (pitch?.title === title) return { n: earlier, pitch };
  }
  return undefined;
}
