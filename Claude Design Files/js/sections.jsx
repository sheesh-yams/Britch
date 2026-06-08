/* global React */
const { useState } = React;

/* ---------- platform glyphs (simple, allowed shapes only) ---------- */
function PlatformMark({ k, size = 16, color }) {
  if (k === "tiktok") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M16.5 3c.3 2.1 1.6 3.7 3.5 4v2.6c-1.3 0-2.6-.4-3.6-1.1v5.9c0 3-2.4 5.4-5.4 5.4S5.6 17.4 5.6 14.4 8 9 11 9c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.4 0-2.5 1.1-2.5 2.6S9.6 17 11 17s2.6-1.1 2.6-2.6V3h2.9z"
          fill={color || "currentColor"} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke={color || "currentColor"} strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke={color || "currentColor"} strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.3" fill={color || "currentColor"} />
    </svg>
  );
}

/* ============================================================
   1 — PERSONALIZATION BANNER  (who it's for / by / deal value)
   ============================================================ */
function Banner({ d, dealValue, onJump }) {
  return (
    <div className="banner">
      <div className="wrap banner__inner">
        <div className="banner__col">
          <div className="kicker volt-text">Prepared exclusively for</div>
          <div className="banner__for display">{d.brand.name}</div>
          <div className="banner__note mono">{d.brand.note}</div>
        </div>

        <div className="banner__rule" aria-hidden="true">
          <span className="perf" />
        </div>

        <div className="banner__col banner__col--by">
          <div className="kicker muted">Partnership proposal by</div>
          <div className="banner__by">
            <span className="display">{d.creator.name}</span>
            {d.creator.available && (
              <span className="chip chip--volt"><span className="dot dot--live" /> Available</span>
            )}
          </div>
          <div className="banner__note mono">Valid 30 days · Quote #BR-2026-0412</div>
        </div>

        <div className="banner__deal">
          <div className="kicker">Est. campaign value</div>
          <div className="banner__deal-num mono-num">${dealValue.toLocaleString()}</div>
          <button className="btn btn--lg banner__cta" onClick={onJump}>
            Build the deal ↓
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   2 — CREATOR IDENTITY HERO
   ============================================================ */
function Hero({ d }) {
  return (
    <section className="hero">
      <div className="wrap hero__grid">
        <div className="hero__photo">
          <image-slot
            id="sarah-portrait"
            shape="rect"
            placeholder="Drop creator portrait"
            style={{ width: "100%", height: "100%", display: "block" }}
          ></image-slot>
          <div className="hero__photo-tag tag">@ {d.creator.location}</div>
        </div>

        <div className="hero__body">
          <div className="hero__niches">
            {d.creator.niches.map((n, i) => (
              <span key={n} className="hero__niche">
                {n}{i < d.creator.niches.length - 1 && <span className="hero__dot">·</span>}
              </span>
            ))}
          </div>

          <h1 className="hero__name display">
            {d.creator.name.split(" ")[0]}<br />
            <span className="hero__name-2">{d.creator.name.split(" ").slice(1).join(" ")}</span>
          </h1>

          <p className="hero__tag">
            <span className="swipe swipe--ink">{d.creator.tagline}</span>
          </p>

          <div className="hero__handles">
            {d.platforms.map((p) => (
              <div className="handle" key={p.key}>
                <div className="handle__top">
                  <PlatformMark k={p.key} size={20} />
                  <span className="handle__name mono">{p.handle}</span>
                </div>
                <div className="handle__count mono-num">{p.followers}</div>
                <div className="handle__label tag">followers · {p.engagement} eng</div>
              </div>
            ))}
          </div>

          <div className="hero__meta">
            <span className="chip"><span className="dot" /> {d.creator.responds}</span>
            <span className="chip">{d.audience.source} audience verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   3 — PERFORMANCE SNAPSHOT  (reach is the hero number)
   ============================================================ */
function Performance({ d }) {
  return (
    <section className="section" id="performance">
      <div className="wrap">
        <div className="sec-head">
          <span className="num">01</span>
          <h2>The Numbers</h2>
          <span className="aside">We price on <strong className="volt-text">reach</strong>,<br />not follower count.</span>
        </div>

        <div className="perf-grid">
          {d.platforms.map((p) => (
            <div className="perf-card panel-ink" key={p.key}>
              <div className="perf-card__head">
                <PlatformMark k={p.key} size={22} color="var(--volt)" />
                <span className="mono">{p.label} · {p.handle}</span>
              </div>

              <div className="perf-card__hero">
                <div className="perf-card__hero-num mono-num">{p.reach}</div>
                <div className="perf-card__hero-label">
                  <span className="kicker volt-text">Avg. reach / post</span>
                  <span className="tag muted">the number your spend buys</span>
                </div>
              </div>

              <div className="perf-card__row">
                <div className="perf-stat">
                  <span className="perf-stat__num mono-num">{p.followers}</span>
                  <span className="perf-stat__label tag">Followers</span>
                </div>
                <div className="perf-stat">
                  <span className="perf-stat__num mono-num">{p.engagement}</span>
                  <span className="perf-stat__label tag">Engagement</span>
                </div>
                <div className="perf-stat">
                  <span className="perf-stat__num mono-num">${p.cpm}</span>
                  <span className="perf-stat__label tag">Niche CPM</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   4 — AUDIENCE SNAPSHOT
   ============================================================ */
function Bar({ pct, color = "var(--volt)", h = 10 }) {
  return (
    <div className="bar" style={{ height: h }}>
      <div className="bar__fill" style={{ width: pct + "%", background: color }} />
    </div>
  );
}

function Audience({ d }) {
  const a = d.audience;
  const genderColors = ["var(--volt)", "var(--paper)", "var(--flush)"];
  return (
    <section className="section" id="audience">
      <div className="wrap">
        <div className="sec-head">
          <span className="num">02</span>
          <h2>Who's Watching</h2>
          <span className="aside">Source: {a.source}<br />analytics · last 90 days</span>
        </div>

        <div className="aud-grid">
          {/* gender as a single stacked bar */}
          <div className="aud-card panel-ink">
            <div className="kicker muted">Gender split</div>
            <div className="aud-stack">
              {a.gender.map((g, i) => (
                <div
                  key={g.label}
                  className="aud-stack__seg"
                  style={{ width: g.pct + "%", background: genderColors[i], color: i === 1 ? "var(--ink)" : (i === 0 ? "var(--ink)" : "var(--paper)") }}
                  title={`${g.label} ${g.pct}%`}
                >
                  {g.pct >= 8 && <span className="mono-num">{g.pct}%</span>}
                </div>
              ))}
            </div>
            <div className="aud-legend">
              {a.gender.map((g, i) => (
                <span key={g.label} className="aud-legend__item">
                  <span className="aud-legend__sw" style={{ background: genderColors[i] }} />
                  {g.label}
                </span>
              ))}
            </div>
          </div>

          {/* age bands */}
          <div className="aud-card panel-ink">
            <div className="kicker muted">Age bands</div>
            <div className="aud-rows">
              {a.age.map((b) => (
                <div className="aud-row" key={b.label}>
                  <span className="aud-row__label mono">{b.label}</span>
                  <Bar pct={b.pct} color={b.pct >= 38 ? "var(--volt)" : "var(--ink-3)"} />
                  <span className="aud-row__pct mono-num">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* countries */}
          <div className="aud-card panel-ink">
            <div className="kicker muted">Top countries</div>
            <div className="aud-rows">
              {a.countries.map((c) => (
                <div className="aud-row" key={c.code}>
                  <span className="aud-row__flag mono">{c.code}</span>
                  <span className="aud-row__label aud-row__label--wide">{c.label}</span>
                  <Bar pct={c.pct * 2} color="var(--flush)" />
                  <span className="aud-row__pct mono-num">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   5 — SCOPE OF WORK band
   ============================================================ */
function Scope({ d }) {
  return (
    <section className="scope-band">
      <div className="wrap">
        <div className="scope-band__head">
          <span className="kicker">Scope of work · every deliverable includes</span>
        </div>
        <div className="scope-grid">
          {d.scope.map((s) => (
            <div className="scope-cell" key={s.k}>
              <div className="scope-cell__v mono-num">{s.v}</div>
              <div className="scope-cell__k tag">{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { PlatformMark, Banner, Hero, Performance, Audience, Scope, Bar });
