import { describe, expect, it } from 'vitest';
import emojiList from './data/emoji.json';
import { checkEmoji, emojiForShortcode, replaceShortcodes, splitGraphemes } from './emoji';

describe('emoji.json', () => {
  const all = emojiList.map((e) => e.emoji);

  it('has the expected size for Emoji 15.0 without variants, flags, or components', () => {
    // 1,597 when generated against Emoji 15.0. A big jump means a filter or the version pin changed.
    expect(all.length).toBeGreaterThan(1500);
    expect(all.length).toBeLessThan(1700);
  });

  it('holds only fully-qualified emoji, with no stray or missing U+FE0F', () => {
    // RGI_Emoji matches exactly the fully-qualified forms listed in Unicode's emoji-test.txt.
    // Built with `new RegExp` because the `v` flag is newer than our tsconfig target.
    const rgi = new RegExp('^\\p{RGI_Emoji}$', 'v');
    expect(all.filter((e) => !rgi.test(e))).toEqual([]);
  });

  it('holds one grapheme per entry, with no duplicates', () => {
    expect(all.every((e) => splitGraphemes(e).length === 1)).toBe(true);
    expect(new Set(all).size).toBe(all.length);
  });

  it('excludes skin tones, hair styles, regional indicators, and tag sequences', () => {
    expect(all.filter((e) => /[\u{1F3FB}-\u{1F3FF}]/u.test(e))).toEqual([]);
    expect(all.filter((e) => /\u200D[\u{1F9B0}-\u{1F9B3}]/u.test(e))).toEqual([]);
    expect(all.filter((e) => /[\u{1F1E6}-\u{1F1FF}\u{E0020}-\u{E007F}]/u.test(e))).toEqual([]);
  });

  it('excludes emoji newer than 15.0', () => {
    expect(all).toContain('🪿'); // goose, 15.0
    expect(all).not.toContain('🙂‍↔️'); // head shaking horizontally, 15.1
    expect(all).not.toContain('🫈'); // hairy creature, 17.0
  });
});

describe('splitGraphemes', () => {
  it('counts ZWJ sequences as one emoji', () => {
    expect(splitGraphemes('👨‍🔧')).toEqual(['👨‍🔧']);
    expect(splitGraphemes('🍄👨‍🔧🚽🪠😩')).toHaveLength(5);
  });

  it('counts keycaps, families, and skin-toned emoji as one each', () => {
    expect(splitGraphemes('1️⃣👨‍👩‍👧👍🏽')).toHaveLength(3);
  });
});

describe('checkEmoji', () => {
  it('accepts emoji in the set', () => {
    for (const e of ['🍄', '👨‍🔧', '🪠', '🐍', '🏴‍☠️', '🏁', '1️⃣', '👱']) {
      expect(checkEmoji(e)).toEqual({ ok: true, emoji: e });
    }
  });

  it('accepts unqualified forms and returns the fully-qualified one', () => {
    expect(checkEmoji('❤')).toEqual({ ok: true, emoji: '❤️' });
    expect(checkEmoji('❤︎')).toEqual({ ok: true, emoji: '❤️' }); // text-style selector
    expect(checkEmoji('🏳‍🌈')).toEqual({ ok: true, emoji: '🏳️‍🌈' });
  });

  it('rejects skin-tone variants and suggests the base form', () => {
    expect(checkEmoji('👍🏽')).toEqual({ ok: false, reason: 'skin-tone', suggestion: '👍' });
    expect(checkEmoji('👨🏿‍🔧')).toEqual({ ok: false, reason: 'skin-tone', suggestion: '👨‍🔧' });
    expect(checkEmoji('🧑🏻‍🤝‍🧑🏿')).toEqual({ ok: false, reason: 'skin-tone', suggestion: '🧑‍🤝‍🧑' });
    expect(checkEmoji('👨🏽‍🦰')).toEqual({ ok: false, reason: 'skin-tone', suggestion: '👨' });
  });

  it('rejects hair-style variants and suggests the base form', () => {
    expect(checkEmoji('👨‍🦰')).toEqual({ ok: false, reason: 'hair-style', suggestion: '👨' });
    expect(checkEmoji('🧑‍🦲')).toEqual({ ok: false, reason: 'hair-style', suggestion: '🧑' });
  });

  it('rejects country and subdivision flags', () => {
    expect(checkEmoji('🇺🇸')).toEqual({ ok: false, reason: 'flag' });
    expect(checkEmoji('🇦')).toEqual({ ok: false, reason: 'flag' });
    expect(checkEmoji('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toEqual({ ok: false, reason: 'flag' }); // Scotland
  });

  it('rejects standalone components', () => {
    expect(checkEmoji('🦰')).toEqual({ ok: false, reason: 'component' });
    expect(checkEmoji('🏽')).toEqual({ ok: false, reason: 'component' });
  });

  it('rejects emoji newer than the pinned version', () => {
    expect(checkEmoji('🫈')).toEqual({ ok: false, reason: 'too-new' });
    expect(checkEmoji('🙂‍↔️')).toEqual({ ok: false, reason: 'too-new' });
  });

  it('rejects text', () => {
    for (const t of ['a', '1', '?', ' ', 'é']) {
      expect(checkEmoji(t)).toEqual({ ok: false, reason: 'not-emoji' });
    }
  });

  it('gives the same answer when called repeatedly', () => {
    expect([1, 2, 3].map(() => checkEmoji('👍🏽').ok)).toEqual([false, false, false]);
  });
});

describe('shortcodes', () => {
  it('looks up emojibase shortcodes, with or without colons', () => {
    expect(emojiForShortcode('mushroom')).toBe('🍄');
    expect(emojiForShortcode(':man_mechanic:')).toBe('👨‍🔧');
    expect(emojiForShortcode(':THUMBSUP:')).toBe('👍');
    expect(emojiForShortcode(':+1:')).toBe('👍');
    expect(emojiForShortcode(':not_a_real_code:')).toBeUndefined();
  });

  it('replaces known shortcodes in text and leaves unknown ones', () => {
    expect(replaceShortcodes(':tomato::door::skull:')).toBe('🍅🚪💀');
    expect(replaceShortcodes('🍄:man_mechanic::nope:')).toBe('🍄👨‍🔧:nope:');
  });
});
