/**
 * KP-Baden-Logo: Karteikarte mit umgeknickter Ecke und Häkchen (Active Recall),
 * optional mit Wortmarke. Rein dekorativ – Farben aus dem App-Akzent.
 */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="KP Baden"
    >
      <rect width="64" height="64" rx="15" className="fill-accent" />
      <path
        d="M17 14h20l10 10v26a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z"
        fill="#ffffff"
      />
      <path d="M37 14l10 10H39a2 2 0 0 1-2-2z" fill="#c9e0fb" />
      <path
        d="M22 37l6 6 12-14"
        fill="none"
        className="stroke-accent"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  size = 26,
  withWordmark = true,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className="text-base font-semibold tracking-tight text-accent">KP Baden</span>
      )}
    </span>
  );
}
