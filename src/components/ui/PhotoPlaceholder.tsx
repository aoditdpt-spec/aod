import { Icon, type AnyIconName } from "./Icon";

// Stand-in for a real artist/event photo. Swap for next/image once AOD has its own photos.
export function PhotoPlaceholder({
  icon,
  label,
  className = "",
}: {
  icon: AnyIconName;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${label} (photo coming soon)`}
      className={`relative flex items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-wash via-peach/40 to-peach ${className}`}
    >
      <Icon name={icon} className="relative h-12 w-12 text-ink" strokeWidth={1.25} />
    </div>
  );
}
