// ================================================
// LANCERO OS — RADAR ENGINE v2.0
// Gold tactical palette: #d4a843 / #f0c050
// ================================================

const radar  = document.querySelector('.radar');
const sweep  = document.querySelector('.sweep');

let sweepAngle = 0;

// ── Contacts ──────────────────────────────────
const contacts = [
  { x: 180,  y: -120, type: 'FRIEND'  },
  { x: -220, y:  100, type: 'HOSTILE' },
  { x:  120, y:  220, type: 'UNKNOWN' },
  { x:  -90, y: -180, type: 'FRIEND'  },
  { x:  260, y:   40, type: 'HOSTILE' },
  { x: -160, y: -260, type: 'FRIEND'  },
  { x:  320, y: -180, type: 'UNKNOWN' },
];

const COLOR = {
  FRIEND:  '#aaffaa',
  HOSTILE: '#ff5555',
  UNKNOWN: '#f0c050',
};

contacts.forEach(c => {
  const m = document.createElement('div');
  const col = COLOR[c.type];
  m.style.cssText = `
    position:absolute;
    width:9px; height:9px;
    border-radius:50%;
    background:${col};
    box-shadow:0 0 12px ${col}, 0 0 20px ${col}44;
    left:calc(50% + ${c.x}px - 4.5px);
    top:calc(50% + ${c.y}px - 4.5px);
    opacity:.15;
    pointer-events:none;
    z-index:5;
    transition:opacity .2s;
  `;
  c.el = m;
  radar.appendChild(m);

  // IFF bracket around each contact
  const br = document.createElement('div');
  br.style.cssText = `
    position:absolute;
    width:18px; height:18px;
    border:1px solid ${col};
    left:calc(50% + ${c.x}px - 9px);
    top:calc(50% + ${c.y}px - 9px);
    opacity:.08;
    pointer-events:none;
    z-index:4;
  `;
  c.bracket = br;
  radar.appendChild(br);
});

// ── Main sweep ────────────────────────────────
gsap.to(sweep, {
  rotation: 360,
  duration: 5,
  repeat: -1,
  ease: 'none',
  transformOrigin: 'center center',
  onUpdate() {
    sweepAngle = gsap.getProperty(sweep, 'rotation');
    checkContacts();
  }
});

// ── Contact detection ─────────────────────────
function checkContacts() {
  contacts.forEach(c => {
    const angle = (Math.atan2(c.y, c.x) * 180 / Math.PI + 360) % 360;
    let diff = Math.abs(angle - sweepAngle);
    if (diff > 180) diff = 360 - diff;

    if (diff < 7) {
      gsap.to(c.el,      { opacity: 1,    duration: 0.1 });
      gsap.to(c.bracket, { opacity: 0.6,  duration: 0.1 });
      createPing(c);
    } else {
      const fade = Math.max(0.12, 1 - diff / 60);
      gsap.to(c.el,      { opacity: fade * .9, duration: 1.5 });
      gsap.to(c.bracket, { opacity: fade * .3, duration: 1.5 });
    }
  });
}

// ── Detection ping ────────────────────────────
function createPing(c) {
  if (c.cooldown) return;
  c.cooldown = true;
  const col = COLOR[c.type];

  // outer ring expand
  const ping = document.createElement('div');
  ping.style.cssText = `
    position:absolute;
    width:12px; height:12px;
    border-radius:50%;
    border:1px solid ${col};
    left:calc(50% + ${c.x}px - 6px);
    top:calc(50% + ${c.y}px - 6px);
    pointer-events:none; z-index:6;
  `;
  radar.appendChild(ping);
  gsap.fromTo(ping, { scale:.4, opacity:1 },
    { scale:5, opacity:0, duration:1.2, ease:'power2.out',
      onComplete: () => ping.remove() });

  // label flash
  const lbl = document.createElement('div');
  lbl.textContent = c.type;
  lbl.style.cssText = `
    position:absolute;
    font-family:'Share Tech Mono',monospace;
    font-size:clamp(7px,.75vw,10px);
    letter-spacing:.1em;
    color:${col};
    left:calc(50% + ${c.x + 12}px);
    top:calc(50% + ${c.y - 14}px);
    pointer-events:none; z-index:7;
    white-space:nowrap;
  `;
  radar.appendChild(lbl);
  gsap.fromTo(lbl, { opacity:1 },
    { opacity:0, duration:2, ease:'power2.out',
      onComplete: () => lbl.remove() });

  setTimeout(() => { c.cooldown = false; }, 2600);
}

// ── Background static (gold) ──────────────────
function staticBlip() {
  const dot = document.createElement('div');
  const angle  = Math.random() * Math.PI * 2;
  const maxR   = Math.min(radar.clientWidth * .44, 420);
  const radius = 40 + Math.random() * (maxR - 40);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const sz = 2 + Math.random() * 3;

  // gold-tinted static
  const r = 180 + Math.floor(Math.random() * 60);
  const g = 130 + Math.floor(Math.random() * 60);
  const col = `rgb(${r},${g},30)`;

  dot.style.cssText = `
    position:absolute;
    width:${sz}px; height:${sz}px;
    border-radius:50%;
    background:${col};
    left:calc(50% + ${x}px - ${sz/2}px);
    top:calc(50% + ${y}px - ${sz/2}px);
    opacity:0; pointer-events:none; z-index:5;
    box-shadow:0 0 6px ${col};
  `;
  radar.appendChild(dot);
  gsap.fromTo(dot,
    { scale:.2, opacity:0 },
    { scale:1.3, opacity:.5, duration:.35,
      onComplete() {
        gsap.to(dot, { scale:2, opacity:0, duration:.9,
          onComplete: () => dot.remove() });
      }
    });
}

setInterval(staticBlip, 900);
setInterval(() => { if (Math.random() > .6) staticBlip(); }, 600);

// ── Pulse: sweep trail glow ───────────────────
function sweepGlow() {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position:absolute; inset:0;
    border-radius:50%;
    background: conic-gradient(from ${sweepAngle}deg,
      rgba(212,168,67,.12), transparent 20%);
    pointer-events:none; z-index:3;
  `;
  radar.appendChild(glow);
  gsap.to(glow, { opacity:0, duration:.8,
    onComplete: () => glow.remove() });
}
setInterval(sweepGlow, 400);

// ── Center pulse ──────────────────────────────
gsap.to('.radar-center', {
  scale: 1.6, opacity: .3,
  duration: 1.6, repeat: -1, yoyo: true,
  ease: 'power1.inOut'
});

// ── Contact count HUD ─────────────────────────
const countEl = document.getElementById('contact-count');
if (countEl) countEl.textContent = `CONTACTOS: ${contacts.length}`;
