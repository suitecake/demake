// M0 walking skeleton: the puzzle number is hardcoded until M1 wires up the date → puzzle pipeline.
const app = document.querySelector<HTMLElement>('#app')!;

const heading = document.createElement('h1');
heading.textContent = 'Demake #1';
app.append(heading);
