import { gameFor, puzzleNumber } from './puzzle';

const app = document.querySelector<HTMLElement>('#app')!;
const n = puzzleNumber(new Date());

const heading = document.createElement('h1');
heading.textContent = `Demake #${n}`;

const title = document.createElement('p');
title.className = 'game';
title.textContent = gameFor(n);

app.append(heading, title);
