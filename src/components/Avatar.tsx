interface AvatarProps {
  name: string;
  src: string | null;
  /** Pixel size; keep on the 4px grid */
  size?: number;
  className?: string;
}

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export function Avatar({ name, src, size = 40, className = "" }: AvatarProps) {
  const style = { width: size, height: size };
  if (src) {
    return <img src={src} alt="" width={size} height={size} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: Math.max(12, Math.round(size * 0.38)) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-700 font-medium text-slate-100 ${className}`}
    >
      {initials(name) || "?"}
    </span>
  );
}
