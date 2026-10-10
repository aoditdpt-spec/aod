// Event times. Forms store "HH:MM" (24-hour, as <input type="time"> gives it); people see
// 12-hour times with the length: "9:00 AM – 12:00 PM (3 hours)". An end time earlier than the
// start means the event runs past midnight ("8:00 PM – 1:00 AM (5 hours, ends next day)").
// No imports, so it works in both browser and server code.

export const isTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

// "19:30" → "7:30 PM". Anything that isn't a time is returned as it is.
export function time12(t: string): string {
  if (!isTime(t)) return t;
  const h = Number(t.slice(0, 2));
  return `${h % 12 || 12}:${t.slice(3, 5)} ${h >= 12 ? "PM" : "AM"}`;
}

// Length of the event in minutes, or null if a time is missing or start and end are the same.
export function eventMinutes(start: string, end: string): number | null {
  if (!isTime(start) || !isTime(end)) return null;
  let d = minutesOf(end) - minutesOf(start);
  if (d === 0) return null;
  if (d < 0) d += 24 * 60;
  return d;
}

export const endsNextDay = (start: string, end: string) => isTime(start) && isTime(end) && minutesOf(end) < minutesOf(start);

// 180 → "3 hours", 150 → "2 hours 30 min", 45 → "45 min".
export function durationText(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = h ? `${h} hour${h === 1 ? "" : "s"}` : "";
  const mins = m ? `${m} min` : "";
  return [hours, mins].filter(Boolean).join(" ");
}

// "9:00 AM – 12:00 PM (3 hours)". With only a start time, just that time.
export function timeRange(start: string, end?: string): string {
  if (!end || !isTime(end)) return time12(start);
  const length = eventMinutes(start, end);
  const extra = length ? ` (${durationText(length)}${endsNextDay(start, end) ? ", ends next day" : ""})` : "";
  return `${time12(start)} – ${time12(end)}${extra}`;
}
