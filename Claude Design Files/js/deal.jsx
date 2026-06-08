/* global React, PlatformMark */
const { useState: useStateDeal } = React;

function money(n) { return "$" + n.toLocaleString(); }

/* ---------- negotiation floor cue ---------- */
function FloorCue({ price, floor }) {
  const room = Math.round(((price - floor) / price) * 100);
  const floorPos = (floor / price) * 100;
  return (
    <div className="floor">
      <div className="floor__track">
        <div className="floor__band" style={{ left: floorPos + "%" }} />
        <div className="floor__tick floor__tick--floor" style={{ left: floorPos + "%" }} />
        <div className="floor__tick floor__tick--target" />
      </div>
      <div className="floor__labels">
        <span className="mono">Floor {money(floor)}</span>
        <span className="floor__room mono">↔ {room}% room</span>
        <span className="mono floor__target">Target {money(price)}</span>
      </div>
    </div>
  );
}

/* ---------- why this rate ---------- */
function WhyThisRate({ r }) {
  const base = Math.round(r.reachNum * (r.cpm / 1000) * r.mult);
  return (
    <div className="why">
      <div className="why__title kicker volt-text">⌖ Why this rate</div>
      <div className="why__eq">
        <div className="why__factor">
          <span className="why__factor-num mono-num">{r.reach}</span>
          <span className="why__factor-label tag">avg reach</span>
        </div>
        <span className="why__op mono">×</span>
        <div className="why__factor">
          <span className="why__factor-num mono-num">${r.cpm}</span>
          <span className="why__factor-label tag">CPM ÷ 1k</span>
        </div>
        <span className="why__op mono">×</span>
        <div className="why__factor">
          <span className="why__factor-num mono-num">{r.mult.toFixed(1)}×</span>
          <span className="why__factor-label tag">format</span>
        </div>
        <span className="why__op mono">=</span>
        <div className="why__factor why__factor--base">
          <span className="why__factor-num mono-num">{money(base)}</span>
          <span className="why__factor-label tag">model base</span>
        </div>
        <span className="why__op mono why__arrow">→</span>
        <div className="why__factor why__factor--final">
          <span className="why__factor-num mono-num">{money(r.price)}</span>
          <span className="why__factor-label tag">your rate</span>
        </div>
      </div>
      <p className="why__note">
        Modeled on real 90-day {r.platform === "tiktok" ? "TikTok" : "Instagram"} reach × a {r.platform === "tiktok" ? "$8" : "$12"} lifestyle CPM, then rounded. No vanity follower math.
      </p>
    </div>
  );
}

/* ---------- a single rate row ---------- */
function RateRow({ r, active, locked, onToggle }) {
  const [open, setOpen] = useStateDeal(false);
  return (
    <div className={"rate" + (active ? " rate--on" : "") + (locked ? " rate--locked" : "")}>
      <div className="rate__main">
        <button
          className="rate__check"
          onClick={() => !locked && onToggle(r.id)}
          aria-pressed={active}
          disabled={locked}
          title={locked ? "Included in an active bundle" : "Add to deal"}
        >
          {active ? "✕" : "+"}
        </button>

        <div className="rate__info">
          <div className="rate__name">{r.name}</div>
          <div className="rate__desc">{r.desc}</div>
          <button className="rate__why-toggle" onClick={() => setOpen(!open)}>
            {open ? "Hide the math" : "Why this rate?"} <span className="rate__chev">{open ? "▲" : "▼"}</span>
          </button>
        </div>

        <div className="rate__price">
          <div className="rate__price-num mono-num">{money(r.price)}</div>
          <div className="rate__price-floor mono">{locked ? "in bundle" : "per deliverable"}</div>
        </div>
      </div>

      {open && (
        <div className="rate__expand">
          <WhyThisRate r={r} />
          <FloorCue price={r.price} floor={r.floor} />
        </div>
      )}
    </div>
  );
}

/* ---------- the rate menu, grouped by platform ---------- */
function RateMenu({ d, selected, bundleItems, onToggle }) {
  const groups = [
    { key: "tiktok", label: "TikTok" },
    { key: "instagram", label: "Instagram" },
  ];
  return (
    <div className="menu">
      {groups.map((g) => (
        <div className="menu__group" key={g.key}>
          <div className="menu__group-head">
            <PlatformMark k={g.key} size={18} color="var(--volt)" />
            <span className="mono">{g.label}</span>
            <span className="menu__group-line" />
          </div>
          {d.rates.filter((r) => r.platform === g.key).map((r) => (
            <RateRow
              key={r.id}
              r={r}
              active={selected.has(r.id) || bundleItems.has(r.id)}
              locked={bundleItems.has(r.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- bundles ---------- */
function Bundles({ d, activeBundles, onToggleBundle }) {
  return (
    <div className="bundles">
      <div className="bundles__head kicker">Pre-built bundles · stack the savings</div>
      <div className="bundles__row">
        {d.bundles.map((b) => {
          const on = activeBundles.has(b.id);
          const save = b.list - b.price;
          const pct = Math.round((save / b.list) * 100);
          return (
            <button
              key={b.id}
              className={"bundle" + (on ? " bundle--on" : "")}
              onClick={() => onToggleBundle(b.id)}
            >
              <div className="bundle__top">
                <span className="bundle__name">{b.name}</span>
                <span className="bundle__save mono">−{pct}%</span>
              </div>
              <p className="bundle__blurb">{b.blurb}</p>
              <div className="bundle__foot">
                <span className="bundle__list mono">{money(b.list)}</span>
                <span className="bundle__price mono-num">{money(b.price)}</span>
                <span className="bundle__cta">{on ? "✓ In deal" : "Add bundle +"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- add-ons ---------- */
function AddOns({ d, selected, onToggle }) {
  return (
    <div className="addons">
      <div className="addons__head kicker">Usage & add-ons</div>
      <div className="addons__row">
        {d.addons.map((a) => {
          const on = selected.has(a.id);
          return (
            <button key={a.id} className={"addon" + (on ? " addon--on" : "")} onClick={() => onToggle(a.id)}>
              <div className="addon__check">{on ? "✓" : "+"}</div>
              <div className="addon__info">
                <span className="addon__name">{a.name}</span>
                <span className="addon__desc">{a.desc}</span>
              </div>
              <span className="addon__price mono-num">+{money(a.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { money, FloorCue, WhyThisRate, RateRow, RateMenu, Bundles, AddOns });
