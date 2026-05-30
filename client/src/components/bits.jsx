// Small shared presentational bits.
export function Logo({ size = 28 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="wf-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path d="M5 7l5 18 6-13 6 13 5-18" fill="none" stroke="url(#wf-lg)"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandSplash() {
  return (
    <div className="splash">
      <div className="brand big">
        <div className="brand-mark"><Logo /></div>
        <div className="brand-text">
          <span className="brand-name">WorkFlow</span>
          <span className="brand-sub">loading…</span>
        </div>
      </div>
    </div>
  );
}

export function Loading() {
  return <div className="ai-loading"><span /><span /><span /></div>;
}
