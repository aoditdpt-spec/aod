// Turns horizontal wheel events (trackpad two-finger swipes, Shift + mouse wheel) into
// carousel movement, measured in cards.
//
// While the fingers move, movement follows them (PX_PER_CARD of travel = one card), so a
// full-width trackpad stroke moves about 3–4 cards. After the fingers lift, browsers keep
// sending decaying "inertia" events for a second or more; left alone those would carry the
// carousel round several times. We spot that tail by the speed's *trend* over the last few
// events (a steady decline), because individual inertia deltas wobble up and down — then
// fade it out and cap its total distance. A real speed-up (fingers moving again) resumes.

const PX_PER_CARD = 360; // finger travel per card while the fingers are moving
const MAX_STEP = 0.18; // top speed: never more than this many cards from a single event
const GESTURE_GAP_MS = 140; // a pause this long starts a new gesture
const TREND_WINDOW = 3; // events to compare the speed against
const DECAYING = 0.92; // speed below 92% of what it was TREND_WINDOW events ago = slowing down / lifted
const RESUMING = 1.2; // speed above 120% of that = fingers pushing again
const TAIL_FACTOR = 0.2; // inertia counts for at most a fifth, fading with speed
const TAIL_BUDGET = 0.25; // and adds at most a quarter of a card in total per tail

export type SwipeInterpreter = {
  // Cards to move for this event (positive = forwards).
  step: (deltaX: number, deltaMode: number, timeStamp: number) => number;
  reset: () => void;
};

export function createSwipeInterpreter(): SwipeInterpreter {
  let lastT = -Infinity;
  let speed = 0; // smoothed |delta| per event
  let peak = 0;
  let history: number[] = []; // recent smoothed speeds
  let inTail = false;
  let tailLeft = TAIL_BUDGET;

  const reset = () => {
    lastT = -Infinity;
    speed = 0;
    peak = 0;
    history = [];
    inTail = false;
    tailLeft = TAIL_BUDGET;
  };

  const step = (deltaX: number, deltaMode: number, timeStamp: number) => {
    if (timeStamp - lastT > GESTURE_GAP_MS) reset();
    lastT = timeStamp;

    const dx = deltaMode === 1 ? deltaX * 16 : deltaX; // lines → pixels
    speed = speed === 0 ? Math.abs(dx) : speed * 0.6 + Math.abs(dx) * 0.4;
    const before = history.length >= TREND_WINDOW ? history[history.length - TREND_WINDOW] : undefined;
    history.push(speed);
    if (history.length > TREND_WINDOW) history.shift();

    if (!inTail) {
      peak = Math.max(peak, speed);
      if (before !== undefined && speed < before * DECAYING) inTail = true;
    } else if (before !== undefined && speed > before * RESUMING && speed > peak * 0.5) {
      // Clearly accelerating again: the fingers are back on the trackpad and moving.
      inTail = false;
      tailLeft = TAIL_BUDGET;
      peak = speed;
    }

    let cards = dx / PX_PER_CARD;
    if (inTail) {
      cards *= TAIL_FACTOR * Math.min(1, speed / (peak || 1));
      const allowed = Math.max(0, tailLeft);
      cards = Math.max(-allowed, Math.min(allowed, cards));
      tailLeft -= Math.abs(cards);
    }
    return Math.max(-MAX_STEP, Math.min(MAX_STEP, cards));
  };

  return { step, reset };
}
