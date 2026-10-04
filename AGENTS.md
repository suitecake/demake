# AGENTS.md

Starting brief for Demake. Copied from the idea file's spec on 2026-10-04; this file is now the source of truth for the build.

## The pitch
A daily game for my Discord crew: everyone gets the same famous video game and has to pitch it in exactly five emoji. The share output is your five emoji with the answer hidden in a Discord spoiler tag, so every share doubles as a puzzle for the channel.

## Core rules
- One puzzle per day. Everyone sees the same game.
- Any emoji in the supported set is allowed (see Emoji set). There is no daily palette: players bring their own emoji knowledge, and the better they know the set, the more they can say.
- The player picks exactly 5 emoji. Order matters. No repeats.
- The player can remove or reorder picks before locking in.
- Once locked, the pitch is saved for the day and the share button appears.

## Determinism
- The puzzle number is days since launch day (launch = puzzle #1).
- "Today" is computed in a single fixed timezone (America/New_York) so the whole group flips at the same moment.
- Puzzle #N is the Nth game in `games.json`. Play goes straight down the list. Same number, same puzzle, on any device.
- The list is append-only. Never reorder or remove a game that has already been played, or past puzzles change. New games go at the end.
- When the list runs out, it wraps back to the start: past the end, puzzle #N replays game ((N - 1) mod list length).
- Rerun days are a **Remaster**: same game, fresh pitch. If the player's earlier pitch for that game is still in storage, show it for comparison. A game is a Remaster if its title appears earlier in the list.
- Adding games after the list has wrapped must not change puzzles already played. Add games only through a script (`npm run add-game`) that first writes the reruns already played into `games.json` as explicit entries, then appends the new games. Never hand-edit the list once it has wrapped.
- Test: running `add-game` never changes the game for any puzzle up to today.

## Emoji set
- Nobody curates the list by hand. The set comes from Unicode's official list (`emoji-test.txt`), via the `emojibase-data` package, and is generated into `src/data/emoji.json` by a script.
- Pin a maximum Emoji version (start with 15.0) so shares don't render as blank boxes on friends' devices. Raise it deliberately, not by accident.
- Include only fully-qualified emoji. Exclude skin-tone and hair-style variants (base forms only), regional indicators and flags (Windows shows flags as letter pairs), and standalone components.
- Expect roughly 1,800–1,900 emoji after filtering.
- Validate picks against `emoji.json`. Count by grapheme (`Intl.Segmenter`), so 👨‍🔧 counts as one emoji.

## Input
- Native emoji keyboards are the main input: mobile keyboards, Win+. on Windows, Ctrl+Cmd+Space on macOS. That's where people's emoji knowledge already lives.
- Also accept `:shortcode:` typing (Discord habit), using emojibase shortcodes.
- A searchable in-page picker (category tabs plus keyword search) is M2 polish, not v1.

## Difficulty
- No banned emoji. The obvious pitch is allowed: if someone wants the mushroom, they can use it. But where's the fun in that?
- The delight is finding a clever kind of expressiveness. Often that means starting with the obvious and putting a weird twist on it with the later emoji: 🍄👨‍🔧🚽🪠😩 is Mario finally having to do actual plumbing. The best twists play on something true about the game.
- Difficulty comes from the group's taste, not rules. A literal pitch is legal; it just loses the vote and gets roasted.
- The sweet spot is guessable but surprising: you see the twist, then you see the game.
- The "how to play" modal (M2) should show what good looks like: obvious plus a twist, a sideways metaphor (🍅🚪💀🔁🐍 for Hades), a genre swap (Tetris as a horror movie).

## Share format
Exactly this, copied to the clipboard:

```
Demake #12
🍅🚪💀🔁🐍
||Hades||
<site url>
```

The `||...||` is Discord spoiler syntax. Readers can guess first, then click to reveal.

## Persistence (v1)
- Store today's locked pitch in `localStorage`, keyed by puzzle number, so a refresh doesn't lose it. Store the game title with it, so a Remaster can find the earlier pitch.
- Wrap storage access in try/catch and work fine without it.

## Stack (v1)
- Vite + TypeScript, no framework needed. Plain DOM is fine at this size.
- Data lives in `src/data/games.json` and `src/data/emoji.json`.
- Unit tests (Vitest) for the date → puzzle number → game pipeline, and for emoji validation (grapheme counting, rejected variants). This is the part that must never break.
- Deploy: GitHub repo connected to Netlify. Every push to `main` deploys; every PR gets a deploy preview URL. Netlify builds with `npm run build` and serves `dist/`.

## Milestones

**M0: Walking skeleton.** Repo, Vite scaffold, a page that says "Demake #1," deployed to a real URL. Done when the link works on my phone.

**M1: Playable v1.** Game title, five slots filled by native emoji input with validation, lock in, copy share text. Mobile-friendly. Done when a friend can play and paste a result into Discord without help.

**M2: Polish.** Searchable emoji picker, countdown to next puzzle, "how to play" modal, dark mode, a bit of juice on lock-in. Done when it feels like a real daily game.

**M3: Social backend.** Netlify Functions + Netlify's built-in Postgres. Before building, check the database's free-tier limits and whether it expires unless claimed. Submit pitches with a display name. A "Yesterday's Pitches" page with voting and a leaderboard. Done when the group has voted on a full week of pitches.

## Working agreements for the agent
- Work one milestone at a time. Don't build ahead.
- Keep changes small and reviewable. Explain what you changed and why.
- Never commit secrets. API keys go in environment variables.

## Seed games

A starter list spanning eras and genres, shuffled once. This order is the play order: puzzle #1 is the first game. Everyone in the group should know most of these; add obscure deep cuts once the game proves itself.

- Animal Crossing: New Horizons
- Untitled Goose Game
- Metroid
- Goat Simulator
- GoldenEye 007
- Braid
- Space Invaders
- Elden Ring
- Rocket League
- Halo: Combat Evolved
- Fallout 3
- StarCraft
- Dark Souls
- Hollow Knight
- The Sims
- Metal Gear Solid
- Minecraft
- Street Fighter II
- Civilization
- Dance Dance Revolution
- Doom
- Resident Evil 4
- Celeste
- Red Dead Redemption 2
- The Legend of Zelda: Breath of the Wild
- Overwatch
- The Elder Scrolls V: Skyrim
- Frogger
- Hades
- Portal
- Fortnite
- Super Smash Bros. Melee
- Donkey Kong
- EarthBound
- Final Fantasy VII
- Mario Kart 64
- Guitar Hero
- Limbo
- Silent Hill 2
- Shadow of the Colossus
- World of Warcraft
- Team Fortress 2
- Diablo II
- Undertale
- Journey
- Tetris
- Pokémon Red and Blue
- Among Us
- Myst
- Half-Life 2
- Oregon Trail
- Sonic the Hedgehog
- Uncharted 2: Among Thieves
- BioShock
- Grand Theft Auto: San Andreas
- Pac-Man
- Castlevania: Symphony of the Night
- SimCity
- Stardew Valley
- Katamari Damacy
- Chrono Trigger
- Duck Hunt
- The Last of Us
- Super Mario Bros.
- Mass Effect 2
