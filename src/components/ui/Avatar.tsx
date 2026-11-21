import Image from "next/image";

// A person's round picture: their photo when they've added one, otherwise their initials on the
// quiet grey. The sample artists have no photos (on request, 2026-11-20), so they show initials.
export function Avatar({ src, name, size }: { src?: string; name: string; size: number }) {
  const style = { width: size, height: size };
  if (src) return <Image src={src} alt="" width={size} height={size} style={style} className="shrink-0 rounded-full object-cover" />;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span aria-hidden style={{ ...style, fontSize: Math.max(11, Math.round(size * 0.36)) }} className="grid shrink-0 place-items-center rounded-full bg-wash font-medium text-ink">
      {initials}
    </span>
  );
}
