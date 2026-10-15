import { describe, expect, it } from 'vitest';
import { movePick, processInput, removePick, shareText } from './pitch';

describe('processInput', () => {
  it('moves typed emoji into the picks and clears the input', () => {
    expect(processInput('🍄', [])).toEqual({ picks: ['🍄'], rest: '' });
    expect(processInput('👨‍🔧', ['🍄'])).toEqual({ picks: ['🍄', '👨‍🔧'], rest: '' });
  });

  it('takes a pasted pitch in order, ignoring spaces', () => {
    expect(processInput('🍅 🚪 💀\n🔁 🐍', []).picks).toEqual(['🍅', '🚪', '💀', '🔁', '🐍']);
  });

  it('normalizes unqualified emoji', () => {
    expect(processInput('❤', []).picks).toEqual(['❤️']);
  });

  it('converts complete shortcodes and keeps one still being typed', () => {
    expect(processInput(':mushroom:', [])).toEqual({ picks: ['🍄'], rest: '' });
    expect(processInput(':mush', [])).toEqual({ picks: [], rest: ':mush' });
    expect(processInput(':', [])).toEqual({ picks: [], rest: ':' });
    expect(processInput('🍄:man_mech', [])).toEqual({ picks: ['🍄'], rest: ':man_mech' });
    expect(processInput(':tomato::door:', []).picks).toEqual(['🍅', '🚪']);
  });

  it('reports an unknown shortcode and drops it', () => {
    expect(processInput(':nope:', [])).toEqual({
      picks: [],
      rest: '',
      error: { reason: 'unknown-shortcode', shortcode: ':nope:' },
    });
  });

  it('rejects repeats', () => {
    expect(processInput('🍄', ['🍄'])).toEqual({ picks: ['🍄'], rest: '', error: { reason: 'duplicate' } });
    expect(processInput('🍄🍄', []).picks).toEqual(['🍄']);
  });

  it('stops at five', () => {
    const five = ['🍅', '🚪', '💀', '🔁', '🐍'];
    expect(processInput('🍄', five)).toEqual({ picks: five, rest: '', error: { reason: 'full' } });
    expect(processInput('1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣', []).picks).toHaveLength(5);
  });

  it('keeps valid emoji and reports the first problem', () => {
    expect(processInput('🍄👍🏽a🐍', [])).toEqual({
      picks: ['🍄', '🐍'],
      rest: '',
      error: { reason: 'skin-tone', suggestion: '👍' },
    });
  });

  it('rejects plain text', () => {
    expect(processInput('mario', [])).toEqual({ picks: [], rest: '', error: { reason: 'not-emoji' } });
  });
});

describe('movePick and removePick', () => {
  const picks = ['A', 'B', 'C'];

  it('swaps with a neighbour', () => {
    expect(movePick(picks, 0, 1)).toEqual(['B', 'A', 'C']);
    expect(movePick(picks, 2, -1)).toEqual(['A', 'C', 'B']);
  });

  it('does nothing past either end', () => {
    expect(movePick(picks, 0, -1)).toEqual(picks);
    expect(movePick(picks, 2, 1)).toEqual(picks);
  });

  it('removes and closes the gap', () => {
    expect(removePick(picks, 1)).toEqual(['A', 'C']);
  });
});

describe('shareText', () => {
  it('matches the Discord share format exactly', () => {
    expect(shareText(12, ['🍅', '🚪', '💀', '🔁', '🐍'], 'Hades', 'https://demake.example')).toBe(
      'Demake #12\n🍅🚪💀🔁🐍\n||Hades||\nhttps://demake.example',
    );
  });
});
