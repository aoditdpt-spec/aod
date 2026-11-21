// Button looks, as class names (plain strings, so server components can use them too).
const base =
  "inline-flex h-12 items-center justify-center rounded-lg px-6 text-[15px] font-medium transition-[background-color,color,border-color,transform] active:scale-[0.97]";

export const primaryButton = `${base} bg-brand text-white hover:bg-brand-hover`;
export const secondaryButton = `${base} border border-ink text-ink hover:bg-ink hover:text-paper`;
// For dark backgrounds.
export const lightButton = `${base} bg-paper text-ink hover:bg-wash`;
