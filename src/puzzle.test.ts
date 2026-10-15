import { describe, expect, it } from 'vitest';
import games from './data/games.json';
import { dateInTimeZone, gameFor, isRemaster, puzzleNumber } from './puzzle';

// The list as of launch. games.json is append-only: these must stay first, in this order,
// or past puzzles change.
const SEED = [
  'Animal Crossing: New Horizons',
  'Untitled Goose Game',
  'Metroid',
  'Goat Simulator',
  'GoldenEye 007',
  'Braid',
  'Space Invaders',
  'Elden Ring',
  'Rocket League',
  'Halo: Combat Evolved',
  'Fallout 3',
  'StarCraft',
  'Dark Souls',
  'Hollow Knight',
  'The Sims',
  'Metal Gear Solid',
  'Minecraft',
  'Street Fighter II',
  'Civilization',
  'Dance Dance Revolution',
  'Doom',
  'Resident Evil 4',
  'Celeste',
  'Red Dead Redemption 2',
  'The Legend of Zelda: Breath of the Wild',
  'Overwatch',
  'The Elder Scrolls V: Skyrim',
  'Frogger',
  'Hades',
  'Portal',
  'Fortnite',
  'Super Smash Bros. Melee',
  'Donkey Kong',
  'EarthBound',
  'Final Fantasy VII',
  'Mario Kart 64',
  'Guitar Hero',
  'Limbo',
  'Silent Hill 2',
  'Shadow of the Colossus',
  'World of Warcraft',
  'Team Fortress 2',
  'Diablo II',
  'Undertale',
  'Journey',
  'Tetris',
  'Pokémon Red and Blue',
  'Among Us',
  'Myst',
  'Half-Life 2',
  'Oregon Trail',
  'Sonic the Hedgehog',
  'Uncharted 2: Among Thieves',
  'BioShock',
  'Grand Theft Auto: San Andreas',
  'Pac-Man',
  'Castlevania: Symphony of the Night',
  'SimCity',
  'Stardew Valley',
  'Katamari Damacy',
  'Chrono Trigger',
  'Duck Hunt',
  'The Last of Us',
  'Super Mario Bros.',
  'Mass Effect 2',
];

describe('games.json', () => {
  it('starts with the seed list, unchanged and in order', () => {
    expect(games.slice(0, SEED.length)).toEqual(SEED);
  });
});

describe('dateInTimeZone', () => {
  it('uses the New York calendar date, not UTC', () => {
    // 01:00 UTC on the 16th is still 21:00 on the 15th in New York (EDT).
    expect(dateInTimeZone(new Date('2026-10-16T01:00:00Z'))).toBe('2026-10-15');
  });
});

describe('puzzleNumber', () => {
  it('is #1 on launch day', () => {
    expect(puzzleNumber(new Date('2026-10-15T12:00:00-04:00'))).toBe(1);
  });

  it('flips at midnight New York time', () => {
    expect(puzzleNumber(new Date('2026-10-15T23:59:59-04:00'))).toBe(1);
    expect(puzzleNumber(new Date('2026-10-16T00:00:00-04:00'))).toBe(2);
  });

  it('counts days correctly across the fall-back DST change', () => {
    // DST ends 2026-11-01. Midnight on Nov 2 is UTC-5.
    expect(puzzleNumber(new Date('2026-11-01T23:59:59-05:00'))).toBe(18);
    expect(puzzleNumber(new Date('2026-11-02T00:00:00-05:00'))).toBe(19);
  });

  it('counts days correctly across the spring-forward DST change', () => {
    // DST starts 2027-03-14. Midnight on Mar 15 is UTC-4.
    expect(puzzleNumber(new Date('2027-03-14T23:59:59-04:00'))).toBe(151);
    expect(puzzleNumber(new Date('2027-03-15T00:00:00-04:00'))).toBe(152);
  });

  it('shows #1 before launch', () => {
    expect(puzzleNumber(new Date('2026-10-01T12:00:00-04:00'))).toBe(1);
  });
});

describe('gameFor', () => {
  const list = ['A', 'B', 'C'];

  it('plays straight down the list', () => {
    expect([1, 2, 3].map((n) => gameFor(n, list))).toEqual(['A', 'B', 'C']);
  });

  it('wraps back to the start when the list runs out', () => {
    expect([4, 5, 6, 7].map((n) => gameFor(n, list))).toEqual(['A', 'B', 'C', 'A']);
  });

  it('maps puzzle #1 to the first game in games.json', () => {
    expect(gameFor(1)).toBe('Animal Crossing: New Horizons');
    expect(gameFor(games.length)).toBe(games.at(-1));
    expect(gameFor(games.length + 1)).toBe(games[0]);
  });
});

describe('isRemaster', () => {
  it('is false for a game appearing for the first time', () => {
    expect(isRemaster(2, ['A', 'B', 'C'])).toBe(false);
  });

  it('is true for every wrapped puzzle', () => {
    expect([4, 5, 6].every((n) => isRemaster(n, ['A', 'B', 'C']))).toBe(true);
  });

  it('is true when a title appears earlier in the list as an explicit rerun', () => {
    const list = ['A', 'B', 'A', 'C'];
    expect(isRemaster(3, list)).toBe(true);
    expect(isRemaster(4, list)).toBe(false);
  });

  it('is false for every seed game on its first run', () => {
    expect(SEED.some((_, i) => isRemaster(i + 1))).toBe(false);
  });
});
