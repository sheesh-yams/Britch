/* global React, ReactDOM, Banner, Hero, Performance, Audience, Scope,
   RateMenu, Bundles, AddOns, Cart, StickyBar, DealModal, money */
const { useState: useApp, useMemo, useRef } = React;

function TopNav() {
  return (
    <header className="topnav">
      <div className="wrap topnav__inner">
        <a className="brandmark" href="Britch Landing.html">
          <span className="brandmark__b">B</span>
          <span className="brandmark__word">BRITCH</span>
        </a>
        <div className="topnav__right">
          <span className="topnav__url mono">britch.co/sarah-creates</span>
          <button
            className="topnav__share"
            onClick={() => { navigator.clipboard && navigator.clipboard.writeText("https://britch.co/sarah-creates"); }}
          >
            ⧉ Copy link
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer({ d }) {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <div className="footer__share">
          <div className="kicker muted">Share this rate page</div>
          <div className="footer__url">
            <span className="mono">britch.co/sarah-creates</span>
            <button
              className="footer__copy mono"
              onClick={() => { navigator.clipboard && navigator.clipboard.writeText("https://britch.co/sarah-creates"); }}
            >Copy</button>
          </div>
        </div>
        <a className="footer__powered" href="Britch Landing.html">
          <span className="tag muted">Powered by</span>
          <span className="footer__brand">
            <span className="brandmark__b brandmark__b--sm">B</span>BRITCH
          </span>
        </a>
      </div>
    </footer>
  );
}

function App() {
  const d = window.BRITCH;
  const buildRef = useRef(null);

  const [selected, setSelected] = useApp(new Set());
  const [bundles, setBundles] = useApp(new Set(["b-cross"]));
  const [addons, setAddons] = useApp(new Set(["usage"]));
  const [modal, setModal] = useApp(false);

  const bundleItems = useMemo(() => {
    const s = new Set();
    d.bundles.forEach((b) => { if (bundles.has(b.id)) b.items.forEach((i) => s.add(i)); });
    return s;
  }, [bundles]);

  const toggleRate = (id) => {
    if (bundleItems.has(id)) return;
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const toggleBundle = (id) => {
    const n = new Set(bundles);
    if (n.has(id)) { n.delete(id); }
    else {
      n.add(id);
      // drop any individually-selected items now covered by this bundle
      const b = d.bundles.find((x) => x.id === id);
      const ns = new Set(selected);
      b.items.forEach((i) => ns.delete(i));
      setSelected(ns);
    }
    setBundles(n);
  };
  const toggleAddon = (id) => {
    const n = new Set(addons);
    n.has(id) ? n.delete(id) : n.add(id);
    setAddons(n);
  };
  const clear = () => { setSelected(new Set()); setBundles(new Set()); setAddons(new Set()); };

  const { lines, subtotal, savings, total, count } = useMemo(() => {
    const L = [];
    let save = 0;
    d.bundles.forEach((b) => {
      if (bundles.has(b.id)) { L.push({ id: b.id, name: b.name, price: b.price, kind: "bundle" }); save += (b.list - b.price); }
    });
    d.rates.forEach((r) => {
      if (selected.has(r.id) && !bundleItems.has(r.id)) {
        const plat = r.platform === "tiktok" ? "TikTok" : "Instagram";
        L.push({ id: r.id, name: `${r.name} · ${plat}`, price: r.price, kind: "rate" });
      }
    });
    d.addons.forEach((a) => {
      if (addons.has(a.id)) L.push({ id: a.id, name: a.name, price: a.price, kind: "addon" });
    });
    const tot = L.reduce((s, l) => s + l.price, 0);
    return { lines: L, subtotal: tot, savings: save, total: tot, count: L.length };
  }, [selected, bundles, addons, bundleItems]);

  const scrollToBuild = () => buildRef.current && window.scrollTo({ top: buildRef.current.offsetTop - 20, behavior: "smooth" });

  return (
    <div className="page">
      <TopNav />
      <Banner d={d} dealValue={total || 3100} onJump={scrollToBuild} />
      <Hero d={d} />
      <Performance d={d} />
      <Audience d={d} />
      <Scope d={d} />

      {/* ---------- BUILD THE DEAL ---------- */}
      <section className="section build" id="build" ref={buildRef}>
        <div className="wrap">
          <div className="sec-head">
            <span className="num">03</span>
            <h2>Build The Deal</h2>
            <span className="aside">Toggle deliverables.<br />Watch the total move →</span>
          </div>

          <div className="build__grid">
            <div className="build__menu">
              <RateMenu d={d} selected={selected} bundleItems={bundleItems} onToggle={toggleRate} />
              <Bundles d={d} activeBundles={bundles} onToggleBundle={toggleBundle} />
              <AddOns d={d} selected={addons} onToggle={toggleAddon} />
            </div>
            <aside className="build__rail">
              <Cart
                d={d} lines={lines} subtotal={subtotal} savings={savings}
                total={total} count={count} onClear={clear} onRequest={() => setModal(true)}
              />
            </aside>
          </div>
        </div>
      </section>

      {/* ---------- CLOSING CTA ---------- */}
      <section className="closer">
        <div className="wrap closer__inner">
          <h2 className="closer__title display">
            Let's make<br /><span className="swipe swipe--ink">something loud.</span>
          </h2>
          <p className="closer__sub">
            {d.creator.responds} · {d.creator.available ? "Booking now for " + d.brand.note.split("—")[0].trim() : "Currently booked"}.
          </p>
          <button className="btn btn--flush btn--lg closer__cta" onClick={() => (count ? setModal(true) : scrollToBuild())}>
            {count ? `Request to work together → ${money(total)}` : "Build the deal ↓"}
          </button>
        </div>
      </section>

      <Footer d={d} />

      <StickyBar count={count} total={total} savings={savings} onRequest={() => setModal(true)} onScroll={scrollToBuild} />
      {modal && (
        <DealModal d={d} lines={lines} total={total} savings={savings} count={count} onClose={() => setModal(false)} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
