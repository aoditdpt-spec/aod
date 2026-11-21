// In-page notices instead of the browser's own alert box (on request, 2026-11-21): showNotice()
// from anywhere (components, stores, server-action replies) adds a message that <Notices />
// (src/components/ui/Notices.tsx, in the root layout) shows at the bottom of the screen.

export type Notice = { id: number; text: string };

let list: Notice[] = [];
let next = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showNotice(text: string) {
  if (!text) return;
  // The same message twice in a row shows once.
  if (list.some((n) => n.text === text)) return;
  list = [...list, { id: next++, text }];
  emit();
}

export function dismissNotice(id: number) {
  list = list.filter((n) => n.id !== id);
  emit();
}

export const noticeStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => list,
  server: (): Notice[] => [],
};
