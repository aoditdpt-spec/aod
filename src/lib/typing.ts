// The search bar's typing placeholder: types a word, holds it, deletes it, moves to the next
// (in a random order, reshuffled each round). It writes straight to the page through `write`, so
// React doesn't re-render for every letter. Under "reduce motion" the words only swap.
// Returns a function that stops it.
export function startTyping(words: readonly string[], write: (text: string) => void): () => void {
  const shuffled = () => [...words].sort(() => Math.random() - 0.5);
  const swapOnly = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let list = shuffled();
  let w = 0;
  let i = 0;
  let deleting = false;
  let timer = 0;

  const later = (ms: number) => {
    timer = window.setTimeout(tick, ms);
  };
  const next = () => {
    w++;
    if (w === list.length) {
      list = shuffled();
      w = 0;
    }
  };

  function tick() {
    if (document.hidden) return later(1000); // waits while the tab is in the background
    if (swapOnly) {
      write(list[w]);
      next();
      return later(2800);
    }
    const word = list[w];
    if (!deleting) {
      i++;
      write(word.slice(0, i));
      if (i === word.length) {
        deleting = true;
        return later(1500);
      }
      return later(60 + Math.random() * 50);
    }
    i--;
    write(word.slice(0, i));
    if (i === 0) {
      deleting = false;
      next();
      return later(350);
    }
    later(30);
  }

  later(600);
  return () => window.clearTimeout(timer);
}
