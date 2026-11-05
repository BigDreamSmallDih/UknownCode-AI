interface LogoProps {
  size?: number;
  /** Adds the pulsing glow used on the splash screen. */
  glow?: boolean;
}

/** Brand mark: a rounded hexagon holding code brackets and a spark. Colors follow the theme. */
export function Logo({ size = 40, glow = false }: LogoProps) {
  return (
    <svg
      className={glow ? 'logo logo-glow' : 'logo'}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="UknownCode AI"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 57 17.5v29L32 61 7 46.5v-29z"
        fill="none"
        stroke="url(#logo-grad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="m26 24-9 8 9 8M38 24l9 8-9 8"
        fill="none"
        stroke="url(#logo-grad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3" fill="url(#logo-grad)" />
    </svg>
  );
}
