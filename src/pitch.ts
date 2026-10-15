import { checkEmoji, emojiForShortcode, splitGraphemes, type Rejection } from './emoji';

export const PITCH_LENGTH = 5;

export type InputError =
  | { reason: Rejection; suggestion?: string }
  | { reason: 'duplicate' | 'full' }
  | { reason: 'unknown-shortcode'; shortcode: string };

export interface InputResult {
  picks: string[];
  /** Text to leave in the input: a :shortcode still being typed. */
  rest: string;
  error?: InputError;
}

// A complete :shortcode:, or one still being typed at the end of the input.
const TOKEN = /:[a-z0-9_+-]+:|:[a-z0-9_+-]*$/gi;

/**
 * Moves whatever was typed or pasted into the picks. Valid emoji fill the next empty slots;
 * anything else is dropped and reported. Only the first error is reported.
 */
export function processInput(text: string, picks: readonly string[]): InputResult {
  const next = [...picks];
  let rest = '';
  let error: InputError | undefined;

  const add = (emoji: string) => {
    if (next.includes(emoji)) error ??= { reason: 'duplicate' };
    else if (next.length >= PITCH_LENGTH) error ??= { reason: 'full' };
    else next.push(emoji);
  };

  const addGraphemes = (chunk: string) => {
    for (const g of splitGraphemes(chunk)) {
      if (!g.trim()) continue; // Ignore spaces and newlines between pasted emoji.
      const check = checkEmoji(g);
      if (check.ok) add(check.emoji);
      else error ??= { reason: check.reason, suggestion: check.suggestion };
    }
  };

  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    addGraphemes(text.slice(last, match.index));
    last = match.index + match[0].length;
    const token = match[0];
    if (last === text.length && !(token.length > 1 && token.endsWith(':'))) {
      rest = token; // Still typing it.
      continue;
    }
    const emoji = emojiForShortcode(token);
    if (emoji) add(emoji);
    else error ??= { reason: 'unknown-shortcode', shortcode: token };
  }
  addGraphemes(text.slice(last));

  return { picks: next, rest, error };
}

/** Swaps the pick at index i with its neighbour in direction dir (-1 left, +1 right). */
export function movePick(picks: readonly string[], i: number, dir: -1 | 1): string[] {
  const j = i + dir;
  if (j < 0 || j >= picks.length) return [...picks];
  const next = [...picks];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function removePick(picks: readonly string[], i: number): string[] {
  return picks.filter((_, k) => k !== i);
}

/** The text copied to the clipboard. The answer is hidden in a Discord spoiler tag. */
export function shareText(n: number, picks: readonly string[], title: string, url: string): string {
  return `Demake #${n}\n${picks.join('')}\n||${title}||\n${url}`;
}
