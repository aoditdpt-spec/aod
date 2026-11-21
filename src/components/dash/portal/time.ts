// "21 Nov, 4:00 PM": a meeting's date and time.
export function meetingWhenPlain(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toUpperCase()}`;
}
