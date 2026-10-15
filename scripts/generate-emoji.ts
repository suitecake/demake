// Generates src/data/emoji.json from Unicode's emoji list, via emojibase-data.
// Run with `npm run generate:emoji`. Don't edit emoji.json by hand.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Newest Emoji version allowed. Newer emoji render as blank boxes on friends' older devices.
// Raise this deliberately, not by accident.
const MAX_EMOJI_VERSION = 15.0;

interface Emoji {
  label: string;
  hexcode: string;
  emoji: string;
  group?: number;
  subgroup?: number;
  version: number;
}

interface Messages {
  groups: { key: string; order: number }[];
  subgroups: { key: string; order: number }[];
}

// data.json lists base forms only: skin-tone variants are nested under `skins`, which we ignore.
// Every `emoji` value is the fully-qualified form.
const data: Emoji[] = require('emojibase-data/en/data.json');
const messages: Messages = require('emojibase-data/en/messages.json');
const shortcodes: Record<string, string | string[]> = require('emojibase-data/en/shortcodes/emojibase.json');

const group = (key: string) => messages.groups.find((g) => g.key === key)!.order;
const subgroup = (key: string) => messages.subgroups.find((s) => s.key === key)!.order;

const COMPONENT = group('component');
const FLAGS = group('flags');
// Flags like 🏁 and 🏴‍☠️ render fine everywhere. Only country and subdivision flags are built from
// regional indicators or tags, which Windows shows as letter pairs.
const SYMBOL_FLAGS = subgroup('flag');
// Hair-style components: red, curly, white, bald. A ZWJ sequence containing one is a hair variant.
const HAIR_STYLE = /-1F9B[0-3]\b/;

function keep(e: Emoji): boolean {
  if (e.group === undefined) return false; // Regional indicators.
  if (e.group === COMPONENT) return false;
  if (e.group === FLAGS && e.subgroup !== SYMBOL_FLAGS) return false;
  if (HAIR_STYLE.test(e.hexcode)) return false;
  return e.version <= MAX_EMOJI_VERSION;
}

// emojibase sometimes adds U+FE0F where Unicode doesn't (👍️ instead of 👍). In emoji-test.txt's
// fully-qualified forms, FE0F only follows characters that default to text presentation.
const fullyQualified = (s: string) => s.replace(/(\p{Emoji_Presentation})️/gu, '$1');

const emoji = data.filter(keep).map((e) => ({
  emoji: fullyQualified(e.emoji),
  label: e.label,
  shortcodes: [shortcodes[e.hexcode] ?? []].flat(),
}));

// One emoji per line, so a version bump reads as a clean diff.
const json = `[\n${emoji.map((e) => '  ' + JSON.stringify(e)).join(',\n')}\n]\n`;
writeFileSync(new URL('../src/data/emoji.json', import.meta.url), json);
console.log(`Wrote ${emoji.length} emoji (Emoji ${MAX_EMOJI_VERSION.toFixed(1)} and earlier).`);
