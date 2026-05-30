// Small shared presentational bits.
export function Logo({ size = 22 }) {
  // concentric "target" mark — matches the Liquid Glass brand
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="#fff" stroke="none" />
    </svg>
  );
}

export function BrandSplash() {
  return (
    <div className="splash">
      <div className="glass col center gap14" style={{ padding: "34px 44px" }}>
        <div className="brand-mark" style={{ width: 48, height: 48, borderRadius: 14 }}><Logo size={26} /></div>
        <div className="col center gap4">
          <span className="brand-name" style={{ fontSize: 22 }}>WorkFlow</span>
          <span className="brand-sub">Accountability OS</span>
        </div>
        <Loading />
      </div>
    </div>
  );
}

export function Loading() {
  return <div className="ai-loading"><span /><span /><span /></div>;
}
