import emojiList from './data/emoji.json';

export type Rejection =
  | 'skin-tone' // 👍🏽: base forms only
  | 'hair-style' // 👨‍🦰: base forms only
  | 'flag' // 🇺🇸: Windows shows country flags as letter pairs
  | 'component' // 🦰 or 🏽 on its own
  | 'too-new' // An emoji newer than our pinned version, which may not render for friends
  | 'not-emoji';

export type EmojiCheck =
  | { ok: true; emoji: string }
  | { ok: false; reason: Rejection; suggestion?: string };

// Variation selectors (U+FE0F emoji style, U+FE0E text style). Keyboards don't always send the
// fully-qualified form (❤ vs ❤️), so lookups ignore them and return the fully-qualified form.
const VARIATION_SELECTORS = /[\uFE0E\uFE0F]/g;
const SKIN_TONE = /[\u{1F3FB}-\u{1F3FF}]/gu;
const HAIR_STYLE = /\u200D[\u{1F9B0}-\u{1F9B3}]/gu;
const COMPONENT = /^[\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]$/u;
const FLAG = /[\u{1F1E6}-\u{1F1FF}\u{E0020}-\u{E007F}]/u; // Regional indicators and tag characters
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;

const strip = (s: string) => s.replace(VARIATION_SELECTORS, '');

const byKey = new Map(emojiList.map((e) => [strip(e.emoji), e.emoji]));
const byShortcode = new Map(emojiList.flatMap((e) => e.shortcodes.map((code) => [code, e.emoji])));

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/** Splits text into user-perceived characters, so 👨‍🔧 counts as one. */
export function splitGraphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

const lookup = (s: string) => byKey.get(strip(s));

/** Checks a single grapheme against the supported set. */
export function checkEmoji(grapheme: string): EmojiCheck {
  const emoji = lookup(grapheme);
  if (emoji) return { ok: true, emoji };

  const bare = strip(grapheme);
  if (COMPONENT.test(bare)) return { ok: false, reason: 'component' };
  const toneless = bare.replace(SKIN_TONE, '');
  const base = toneless.replace(HAIR_STYLE, '');
  if (toneless !== bare) return { ok: false, reason: 'skin-tone', suggestion: lookup(base) };
  if (base !== bare) return { ok: false, reason: 'hair-style', suggestion: lookup(base) };
  if (FLAG.test(bare)) return { ok: false, reason: 'flag' };
  if (PICTOGRAPHIC.test(bare)) return { ok: false, reason: 'too-new' };
  return { ok: false, reason: 'not-emoji' };
}

/** The emoji for a shortcode, with or without colons: "mushroom" or ":mushroom:". */
export function emojiForShortcode(code: string): string | undefined {
  return byShortcode.get(code.replace(/^:|:$/g, '').toLowerCase());
}

/** Replaces every known :shortcode: in text with its emoji. Unknown ones are left as typed. */
export function replaceShortcodes(text: string): string {
  return text.replace(/:[a-z0-9_+-]+:/gi, (match) => emojiForShortcode(match) ?? match);
}
