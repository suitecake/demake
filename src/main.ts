import { PITCH_LENGTH, movePick, processInput, removePick, shareText, type InputError } from './pitch';
import { gameFor, isRemaster, puzzleNumber } from './puzzle';
import { findEarlierPitch, loadPitch, savePitch } from './storage';

const n = puzzleNumber(new Date());
const title = gameFor(n);
const remaster = isRemaster(n);
const saved = loadPitch(n);

let picks: string[] = saved?.title === title ? saved.picks : [];
let locked = saved?.title === title;
let selected: number | undefined;
let savedOk = true;

// Small helper for building elements.
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function keyboardHint(): string {
  const ua = navigator.userAgent;
  const touch = /Android|iPhone|iPad|Mobile/.test(ua) || navigator.maxTouchPoints > 1;
  const shortcodes = 'or type :shortcodes: like :mushroom:';
  if (touch) return `Switch to your emoji keyboard, ${shortcodes}.`;
  if (/Windows/.test(ua)) return `Press Win + . for emoji, ${shortcodes}.`;
  if (/Mac/.test(ua)) return `Press Ctrl + Cmd + Space for emoji, ${shortcodes}.`;
  return `Paste emoji, ${shortcodes}.`;
}

function describe(error: InputError): string {
  switch (error.reason) {
    case 'skin-tone':
    case 'hair-style':
      return `Base emoji only, so everyone's shares match.${error.suggestion ? ` Try ${error.suggestion}` : ''}`;
    case 'flag':
      return 'Country flags show up as letters on Windows, so they’re out.';
    case 'component':
      return 'That’s only part of an emoji.';
    case 'too-new':
      return 'That emoji is too new to show up on everyone’s devices.';
    case 'not-emoji':
      return 'Emoji only! Tip: type :shortcodes: like :mushroom:.';
    case 'unknown-shortcode':
      return `No emoji called ${error.shortcode}.`;
    case 'duplicate':
      return 'Already in your pitch. No repeats!';
    case 'full':
      return 'That’s five! Remove one to swap it out.';
  }
}

// Header

const app = document.querySelector<HTMLElement>('#app')!;
const header = el(
  'header',
  {},
  el('h1', { textContent: `Demake #${n}` }),
  el('p', { className: 'game', textContent: title }),
);
if (remaster) header.append(el('p', { className: 'badge', textContent: 'Remaster: same game, fresh pitch' }));

// Play view

const slots = Array.from({ length: PITCH_LENGTH }, (_, i) =>
  el('button', { type: 'button', className: 'slot', onclick: () => onSlot(i) }),
);
const moveLeft = el('button', { type: 'button', textContent: '◀ Move', onclick: () => onMove(-1) });
const moveRight = el('button', { type: 'button', textContent: 'Move ▶', onclick: () => onMove(1) });
const remove = el('button', { type: 'button', textContent: 'Remove', onclick: onRemove });
const actions = el('div', { className: 'actions' }, moveLeft, remove, moveRight);
const entry = el('input', {
  className: 'entry',
  type: 'text',
  placeholder: 'Type emoji here',
  autocomplete: 'off',
  spellcheck: false,
  ariaLabel: 'Type or paste emoji',
});
entry.setAttribute('autocapitalize', 'off');
entry.setAttribute('autocorrect', 'off');
const message = el('p', { className: 'message', role: 'status' });
const lock = el('button', { type: 'button', className: 'primary', textContent: 'Lock it in', onclick: onLock });
const play = el(
  'section',
  { className: 'play' },
  el('p', { className: 'prompt', textContent: 'Pitch this game in exactly five emoji.' }),
  el('div', { className: 'slots' }, ...slots),
  actions,
  entry,
  message,
  el('p', { className: 'hint', textContent: keyboardHint() }),
  lock,
);

// Locked view

const finalPitch = el('p', { className: 'final' });
const preview = el('textarea', { className: 'preview', readOnly: true, rows: 4, ariaLabel: 'Share text' });
const copyStatus = el('p', { className: 'message', role: 'status' });
const copy = el('button', { type: 'button', className: 'primary', textContent: 'Copy for Discord', onclick: onCopy });
const extras = el('div', { className: 'extras' });
const done = el('section', { className: 'done' }, finalPitch, preview, copy, copyStatus, extras);

app.append(header, play, done);

// Events

function handleEntry() {
  const result = processInput(entry.value, picks);
  picks = result.picks;
  entry.value = result.rest;
  message.textContent = result.error ? describe(result.error) : '';
  selected = undefined;
  render();
}

// Wait for IME composition to finish before reading the input.
entry.addEventListener('input', (e) => {
  if (!(e as InputEvent).isComposing) handleEntry();
});
entry.addEventListener('compositionend', handleEntry);
entry.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace' && entry.value === '' && picks.length > 0) {
    e.preventDefault();
    picks = picks.slice(0, -1);
    selected = undefined;
    message.textContent = '';
    render();
  }
});

function onSlot(i: number) {
  if (i >= picks.length) {
    entry.focus();
    return;
  }
  selected = selected === i ? undefined : i;
  message.textContent = '';
  render();
}

function onMove(dir: -1 | 1) {
  if (selected === undefined) return;
  picks = movePick(picks, selected, dir);
  selected = Math.min(Math.max(selected + dir, 0), picks.length - 1);
  render();
}

function onRemove() {
  if (selected === undefined) return;
  picks = removePick(picks, selected);
  selected = undefined;
  message.textContent = '';
  render();
}

function onLock() {
  if (picks.length !== PITCH_LENGTH) return;
  locked = true;
  savedOk = savePitch(n, { title, picks });
  render();
  copy.focus();
}

async function onCopy() {
  const text = preview.value;
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = 'Copied! Paste it in Discord.';
  } catch {
    // Clipboard API unavailable or denied: select the text so it can be copied by hand.
    preview.focus();
    preview.select();
    copyStatus.textContent = 'Couldn’t copy automatically. The text is selected, so copy it from there.';
  }
}

// Rendering

function render() {
  play.hidden = locked;
  done.hidden = !locked;

  if (!locked) {
    slots.forEach((slot, i) => {
      const pick = picks[i];
      slot.textContent = pick ?? '';
      slot.classList.toggle('filled', pick !== undefined);
      slot.classList.toggle('selected', i === selected);
      slot.ariaLabel = pick ? `Emoji ${i + 1}: ${pick}` : `Empty slot ${i + 1}`;
      slot.ariaPressed = pick ? String(i === selected) : null;
    });
    actions.hidden = selected === undefined;
    moveLeft.disabled = selected === 0;
    moveRight.disabled = selected === picks.length - 1;
    lock.disabled = picks.length !== PITCH_LENGTH;
    entry.placeholder = picks.length < PITCH_LENGTH ? 'Type emoji here' : '';
    return;
  }

  finalPitch.textContent = picks.join('');
  preview.value = shareText(n, picks, title, location.origin);
  extras.replaceChildren();
  if (!savedOk) {
    extras.append(el('p', { className: 'note', textContent: 'Couldn’t save on this device, so copy your pitch before you leave.' }));
  }
  const earlier = remaster ? findEarlierPitch(n, title) : undefined;
  if (earlier) {
    extras.append(
      el('p', { className: 'note' }, `Your pitch last time (#${earlier.n}): `, el('span', { className: 'earlier', textContent: earlier.pitch.picks.join('') })),
    );
  }
}

render();
