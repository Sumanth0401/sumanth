import sparkIcon from "../../../assets/iconn.png";

export function Logo({ size = 22 }) {
  // custom logo from assets
  return (
    <img src={sparkIcon} width={size} height={size} alt="logo" style={{ filter: "brightness(0) invert(1)" }} />
  );
}

export function BrandSplash() {
  return (
    <div className="splash">
      <div className="glass col center gap14" style={{ padding: "34px 44px" }}>
        <div className="brand-mark" style={{ width: 48, height: 48, borderRadius: 14 }}><Logo size={26} /></div>
        <div className="col center gap4">
          <span className="brand-name" style={{ fontSize: 22 }}>TaskFlow</span>
          <span className="brand-sub"></span>
        </div>
        <Loading />
      </div>
    </div>
  );
}

export function Loading() {
  return <div className="ai-loading"><span /><span /><span /></div>;
}
