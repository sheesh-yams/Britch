/* global React, money */
const { useState: useS } = React;

/* ---------- the live "Your Deal" cart ---------- */
function Cart({ d, lines, subtotal, savings, total, count, onClear, onRequest }) {
  return (
    <div className="cart panel-ink">
      <div className="cart__head">
        <span className="cart__title display">Your Deal</span>
        {count > 0 && <button className="cart__clear mono" onClick={onClear}>clear</button>}
      </div>

      {count === 0 ? (
        <div className="cart__empty">
          <div className="cart__empty-mark mono-num">$0</div>
          <p className="cart__empty-text">Tap <strong className="volt-text">+</strong> on any deliverable or bundle to start building. Watch the total move.</p>
        </div>
      ) : (
        <div className="cart__lines">
          {lines.map((l) => (
            <div className={"cart__line" + (l.kind === "bundle" ? " cart__line--bundle" : "")} key={l.id}>
              <span className="cart__line-name">
                {l.kind === "bundle" && <span className="cart__line-tag">BUNDLE</span>}
                {l.name}
              </span>
              <span className="cart__line-price mono-num">{money(l.price)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="cart__totals">
        {savings > 0 && (
          <div className="cart__total-row cart__total-row--save">
            <span>Bundle savings</span>
            <span className="mono-num">−{money(savings)}</span>
          </div>
        )}
        <div className="cart__total-row cart__total-row--grand">
          <span className="display">Total</span>
          <span className="mono-num cart__grand">{money(total)}</span>
        </div>
      </div>

      <button className="btn btn--flush btn--lg cart__cta" onClick={onRequest} disabled={count === 0}>
        Request to work together →
      </button>
      <p className="cart__fine mono">No charge now · starts a conversation, not an invoice.</p>
    </div>
  );
}

/* ---------- sticky bottom deal bar (mobile + scroll) ---------- */
function StickyBar({ count, total, savings, onRequest, onScroll }) {
  if (count === 0) return null;
  return (
    <div className="stickybar">
      <div className="wrap stickybar__inner">
        <button className="stickybar__summary" onClick={onScroll}>
          <span className="stickybar__count mono">{count} item{count > 1 ? "s" : ""}{savings > 0 ? ` · saving ${money(savings)}` : ""}</span>
          <span className="stickybar__total mono-num">{money(total)}</span>
        </button>
        <button className="btn btn--flush stickybar__cta" onClick={onRequest}>
          Request to work →
        </button>
      </div>
    </div>
  );
}

/* ---------- request modal / deal flow ---------- */
function DealModal({ d, lines, total, savings, count, onClose }) {
  const [step, setStep] = useS(0);
  const [form, setForm] = useS({ brand: d.brand.name, name: "", email: "", msg: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal__x" onClick={onClose} aria-label="Close">✕</button>

        {step === 0 ? (
          <div className="modal__body">
            <div className="kicker" style={{ color: "var(--electric)" }}>Request to work together</div>
            <h3 className="modal__title display">Lock {d.creator.name.split(" ")[0]} for<br />{form.brand || "your brand"}.</h3>

            <div className="modal__summary">
              <div className="modal__summary-head mono">YOUR DEAL · {count} item{count > 1 ? "s" : ""}</div>
              {lines.map((l) => (
                <div className="modal__sum-line" key={l.id}>
                  <span>{l.kind === "bundle" ? "◆ " : ""}{l.name}</span>
                  <span className="mono-num">{money(l.price)}</span>
                </div>
              ))}
              {savings > 0 && (
                <div className="modal__sum-line modal__sum-line--save">
                  <span>Bundle savings</span><span className="mono-num">−{money(savings)}</span>
                </div>
              )}
              <div className="modal__sum-line modal__sum-line--total">
                <span className="display">Total</span><span className="mono-num">{money(total)}</span>
              </div>
            </div>

            <div className="modal__fields">
              <label className="field field--full">
                <span className="field__label tag">Brand</span>
                <input className="field__input mono" value={form.brand} onChange={set("brand")} />
              </label>
              <label className="field">
                <span className="field__label tag">Your name</span>
                <input className="field__input mono" value={form.name} onChange={set("name")} placeholder="Alex Rivera" />
              </label>
              <label className="field">
                <span className="field__label tag">Work email</span>
                <input className="field__input mono" value={form.email} onChange={set("email")} placeholder="alex@glowlabs.co" />
              </label>
              <label className="field field--full">
                <span className="field__label tag">Anything else? (optional)</span>
                <textarea className="field__input field__input--area mono" value={form.msg} onChange={set("msg")} placeholder="Timing, must-have dates, hero product…" />
              </label>
            </div>

            <button className="btn btn--lg modal__send" onClick={() => setStep(1)}>
              Send request → {money(total)}
            </button>
          </div>
        ) : (
          <div className="modal__body modal__body--done">
            <div className="modal__done-mark">✓</div>
            <h3 className="modal__title display">Request sent.</h3>
            <p className="modal__done-text">
              {d.creator.name.split(" ")[0]} got your <strong>{money(total)}</strong> brief for <strong>{form.brand}</strong>.
              Expect a reply <span className="swipe swipe--ink">within 24 hours</span> — usually with a yes.
            </p>
            <div className="modal__done-meta mono">REF #BR-2026-0412 · {count} deliverables</div>
            <button className="btn btn--paper btn--lg" onClick={onClose}>Back to proposal</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Cart, StickyBar, DealModal });
