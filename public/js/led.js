// Seven-segment display for the day counter. Purely visual: the real number stays in #days for screen readers.
const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };

function digit() {
  const d = document.createElement('span');
  d.className = 'led-digit';
  for (const s of 'abcdefg') {
    const i = document.createElement('i');
    i.className = 'seg seg-' + s;
    d.append(i);
  }
  return d;
}

/** Show n as a zero-padded odometer: 0,042 ... 4,797. Reuses the nodes, so it is cheap to call on every scroll. */
export function setLed(el, n) {
  const text = String(Math.max(0, Math.floor(n))).padStart(4, '0');
  if (el.dataset.value === text) return;
  if (el.dataset.value?.length !== text.length) {
    el.replaceChildren();
    [...text].forEach((_, i) => {
      if (i && (text.length - i) % 3 === 0) { const c = document.createElement('span'); c.className = 'led-comma'; el.append(c); }
      el.append(digit());
    });
  }
  el.dataset.value = text;
  el.querySelectorAll('.led-digit').forEach((d, i) => {
    const on = SEGS[text[i]];
    for (const seg of d.children) seg.classList.toggle('on', on.includes(seg.className.split('seg-')[1][0]));
  });
}
