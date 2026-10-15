import { describe, expect, it } from 'vitest';
import { findEarlierPitch, loadPitch, savePitch } from './storage';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

const throwing = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
} as unknown as Storage;

describe('storage', () => {
  it('saves and loads a pitch by puzzle number', () => {
    const s = memoryStorage();
    expect(savePitch(3, { title: 'Metroid', picks: ['👾'] }, s)).toBe(true);
    expect(loadPitch(3, s)).toEqual({ title: 'Metroid', picks: ['👾'] });
    expect(loadPitch(4, s)).toBeUndefined();
  });

  it('ignores corrupt entries', () => {
    const s = memoryStorage();
    s.setItem('demake:pitch:1', '{not json');
    s.setItem('demake:pitch:2', '{"title": 5}');
    expect(loadPitch(1, s)).toBeUndefined();
    expect(loadPitch(2, s)).toBeUndefined();
  });

  it('works without storage, or when storage throws', () => {
    expect(savePitch(1, { title: 'Doom', picks: [] }, undefined)).toBe(false);
    expect(loadPitch(1, undefined)).toBeUndefined();
    expect(savePitch(1, { title: 'Doom', picks: [] }, throwing)).toBe(false);
    expect(loadPitch(1, throwing)).toBeUndefined();
    expect(findEarlierPitch(5, 'Doom', throwing)).toBeUndefined();
  });

  it('finds the most recent earlier pitch for the same game', () => {
    const s = memoryStorage();
    savePitch(1, { title: 'Hades', picks: ['🍅'] }, s);
    savePitch(2, { title: 'Doom', picks: ['👹'] }, s);
    savePitch(66, { title: 'Hades', picks: ['🔥'] }, s);
    expect(findEarlierPitch(131, 'Hades', s)).toEqual({ n: 66, pitch: { title: 'Hades', picks: ['🔥'] } });
    expect(findEarlierPitch(66, 'Hades', s)).toEqual({ n: 1, pitch: { title: 'Hades', picks: ['🍅'] } });
    expect(findEarlierPitch(1, 'Hades', s)).toBeUndefined();
  });
});
