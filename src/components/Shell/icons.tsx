interface IconProps {
  size?: number;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PitchIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CalendarIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function RosterIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 20c0-3 2.2-5 5-5s5 2 5 5" />
      <circle cx="17.5" cy="9" r="2.3" />
      <path d="M15.3 20c-.1-2.1 1.1-3.8 3.4-4" />
    </svg>
  );
}

export function TrophyIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 7 8.5" />
      <path d="M17 5h2.5A2.5 2.5 0 0 1 17 8.5" />
      <line x1="12" y1="14" x2="12" y2="17" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="17" x2="12" y2="20" />
    </svg>
  );
}

export function TacticsIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <path d="M14 9l4 4M18 9l-4 4" />
    </svg>
  );
}

export function AttendanceIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8l2 2 3-3" />
      <line x1="13.5" y1="8.5" x2="18" y2="8.5" />
      <path d="M7 15l2 2 3-3" />
      <line x1="13.5" y1="15.5" x2="18" y2="15.5" />
    </svg>
  );
}

export function TrainingIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="12" cy="13" r="8" />
      <line x1="12" y1="13" x2="12" y2="9" />
      <line x1="12" y1="13" x2="15" y2="14" />
      <line x1="9" y1="2" x2="15" y2="2" />
      <line x1="12" y1="2" x2="12" y2="5" />
    </svg>
  );
}

export function FinesIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5c-.5-.8-1.5-1.3-2.6-1.3-1.7 0-3 1-3 2.3 0 1.1.9 1.7 2.4 2.1l.6.15c1.7.4 2.7 1 2.7 2.25 0 1.35-1.3 2.35-3 2.35-1.2 0-2.3-.5-2.9-1.4" />
      <line x1="12" y1="6.5" x2="12" y2="17.5" />
    </svg>
  );
}

export function MoreIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="19" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function TeamCardIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="10" r="2.5" />
      <line x1="13" y1="9" x2="19" y2="9" />
      <line x1="13" y1="12" x2="19" y2="12" />
      <line x1="6" y1="16" x2="18" y2="16" />
    </svg>
  );
}

export function PictureIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M5 16l5-7 4 4 3-3 3 4" />
    </svg>
  );
}

export function ShareIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <line x1="7.7" y1="11" x2="16.3" y2="7" />
      <line x1="7.7" y1="13" x2="16.3" y2="17" />
    </svg>
  );
}
