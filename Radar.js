// ================================================
// LANCERO OS — RADAR ENGINE v3.0
// Cyan tactical palette: #00d4d4 / #00ffff
// ================================================

const radar  = document.querySelector('.radar');
const sweep  = document.querySelector('.sweep');

let sweepAngle = 0;

// ── Contacts ──────────────────────────────────
const contacts = [
  { x:  180, y: -120, type: 'FRIEND'  },
  { x: -220, y:  100, type: 'HOSTILE' },
  { x:  120, y:  220, type: 'UNKNOWN' },
  { x:  -90, y: -180, type: 'FRIEND'  },
  { x:  260, y:   40, type: 'HOSTILE' },
  { x: -160, y: -260, type: 'FRIEND'  },
  { x:  320, y: -180, type: 'UNKNOWN' },
  { x:   60, y:  -70, type: 'FRIEND'  },
  { x: -130, y:   60, type: 'UNKNOWN' },
  { x:  200, y:  160, type: 'HOSTILE' },
  { x: -280, y: -140, type: 'FRIEND'  },
];

// Cyan palette: FRIEND=bright cyan, HOSTILE=red, UNKNOWN=amber
const COLOR = {
  FRIEND:  '#00ffff',
  HOSTILE: '#ff4444',
  UNKNOWN: '#f0c050',
};

// Trail history per contact — stores last-seen sweep angle for fade arc
contacts.forEach(c => {
  c.trailOpacity = 0;
  c.lastSeenAngle = null;

  const m = document.createElement('div');
  const col = COLOR[c.type];
  m.style.cssText = `
    position:absolute;
    width:8px; height:8px;
    border-radius:50%;
    background:${col};
    box-shadow:0 0 10px ${col}, 0 0 18px ${col}55;
    left:calc(50% + ${c.x}px - 4px);
    top:calc(50% + ${c.y}px - 4px);
    opacity:.12;
    pointer-events:none;
    z-index:5;
  `;
  c.el = m;
  radar.appendChild(m);

  // IFF bracket — square corners
  const br = document.createElement('div');
  br.style.cssText = `
    position:absolute;
    width:20px; height:20px;
    border:1px solid ${col};
    left:calc(50% + ${c.x}px - 10px);
    top:calc(50% + ${c.y}px - 10px);
    opacity:.07;
    pointer-events:none;
    z-index:4;
  `;
  c.bracket = br;
  radar.appendChild(br);

  // Persistent afterglow trail element (arc that fades after each sweep pass)
  const trail = document.createElement('div');
  trail.style.cssText = `
    position:absolute;
    width:20px; height:20px;
    border-radius:50%;
    background:${col};
    left:calc(50% + ${c.x}px - 10px);
    top:calc(50% + ${c.y}px - 10px);
    opacity:0;
    pointer-events:none;
    z-index:3;
    filter:blur(6px);
  `;
  c.trail = trail;
  radar.appendChild(trail);
});

// ── Main sweep ────────────────────────────────
gsap.to(sweep, {
  rotation: 360,
  duration: 4.5,
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
    let diff = (sweepAngle - angle + 360) % 360;
    // diff: how many degrees the sweep has passed beyond the contact
    // contact "lights up" when sweep is within 5° ahead, then fades over 60°

    const WINDOW = 5;
    const FADE   = 70;

    if (diff < WINDOW) {
      // Sweep is just hitting the contact
      gsap.to(c.el,      { opacity: 1,    duration: 0.08 });
      gsap.to(c.bracket, { opacity: 0.70, duration: 0.08 });
      gsap.to(c.trail,   { opacity: 0.55, duration: 0.08 });
      createPing(c);
    } else if (diff < FADE) {
      // Afterglow — linear decay from last hit
      const t = 1 - (diff - WINDOW) / (FADE - WINDOW);
      gsap.to(c.el,      { opacity: Math.max(0.10, t * 0.90), duration: 0.6 });
      gsap.to(c.bracket, { opacity: Math.max(0.04, t * 0.65), duration: 0.6 });
      gsap.to(c.trail,   { opacity: Math.max(0,    t * 0.40), duration: 0.6 });
    } else {
      // Dormant — minimal ghost presence
      gsap.to(c.el,      { opacity: 0.10, duration: 1.2 });
      gsap.to(c.bracket, { opacity: 0.04, duration: 1.2 });
      gsap.to(c.trail,   { opacity: 0,    duration: 0.8 });
    }
  });
}

// ── Detection ping ────────────────────────────
function createPing(c) {
  if (c.cooldown) return;
  c.cooldown = true;
  const col = COLOR[c.type];

  // Two expanding concentric rings
  [7, 12].forEach((halfSz, i) => {
    const ping = document.createElement('div');
    ping.style.cssText = `
      position:absolute;
      width:${halfSz*2}px; height:${halfSz*2}px;
      border-radius:50%;
      border:1px solid ${col};
      left:calc(50% + ${c.x}px - ${halfSz}px);
      top:calc(50% + ${c.y}px - ${halfSz}px);
      pointer-events:none; z-index:7;
      box-shadow: 0 0 8px ${col}88;
    `;
    radar.appendChild(ping);
    gsap.fromTo(ping,
      { scale: .2, opacity: 1 },
      { scale: i === 0 ? 5 : 3.5,
        opacity: 0,
        duration: 1.3 + i * .35,
        delay: i * .15,
        ease: 'power2.out',
        onComplete: () => ping.remove() });
  });

  // Core flash
  const flash = document.createElement('div');
  flash.style.cssText = `
    position:absolute;
    width:16px; height:16px;
    border-radius:50%;
    background:${col};
    left:calc(50% + ${c.x}px - 8px);
    top:calc(50% + ${c.y}px - 8px);
    pointer-events:none; z-index:9;
    box-shadow: 0 0 18px ${col}, 0 0 36px ${col}88;
  `;
  radar.appendChild(flash);
  gsap.fromTo(flash,
    { scale: .3, opacity: 1 },
    { scale: 0,  opacity: 0, duration: .55, ease: 'power3.out',
      onComplete: () => flash.remove() });

  // Type label
  const lbl = document.createElement('div');
  lbl.textContent = c.type;
  lbl.style.cssText = `
    position:absolute;
    font-family:'Share Tech Mono',monospace;
    font-size:clamp(7px,.75vw,10px);
    letter-spacing:.1em;
    color:${col};
    left:calc(50% + ${c.x + 14}px);
    top:calc(50% + ${c.y - 16}px);
    pointer-events:none; z-index:8;
    white-space:nowrap;
    text-shadow: 0 0 8px ${col};
  `;
  radar.appendChild(lbl);
  gsap.fromTo(lbl,
    { opacity: 1 },
    { opacity: 0, duration: 2.4, ease: 'power2.out',
      onComplete: () => lbl.remove() });

  setTimeout(() => { c.cooldown = false; }, 2800);
}

// ── Background static (cyan-tinted) ──────────
function staticBlip() {
  const dot = document.createElement('div');
  const angle  = Math.random() * Math.PI * 2;
  const maxR   = Math.min(radar.clientWidth * .44, 420);
  const radius = 30 + Math.random() * (maxR - 30);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const isBright = Math.random() > .75;
  const sz = isBright ? 2.5 + Math.random() * 3 : 1.2 + Math.random() * 2;

  let col;
  if (isBright) {
    col = `rgba(0,255,255,0.9)`;
  } else {
    const alpha = .25 + Math.random() * .35;
    col = `rgba(0,${160 + Math.floor(Math.random()*80)},${160 + Math.floor(Math.random()*80)},${alpha})`;
  }

  dot.style.cssText = `
    position:absolute;
    width:${sz}px; height:${sz}px;
    border-radius:50%;
    background:${col};
    left:calc(50% + ${x}px - ${sz/2}px);
    top:calc(50% + ${y}px - ${sz/2}px);
    opacity:0; pointer-events:none; z-index:5;
    box-shadow:0 0 ${isBright?9:4}px ${col};
  `;
  radar.appendChild(dot);

  const peak = isBright ? .82 : .40;
  gsap.fromTo(dot,
    { scale: .1, opacity: 0 },
    { scale: 1.3, opacity: peak, duration: isBright ? .18 : .38, ease: 'power2.out',
      onComplete() {
        gsap.to(dot, {
          scale: isBright ? 2.6 : 1.9,
          opacity: 0,
          duration: isBright ? .65 : 1.05,
          ease: 'power1.in',
          onComplete: () => dot.remove()
        });
      }
    });
}

// Fine-grain noise layer
function noiseDot() {
  const dot = document.createElement('div');
  const angle  = Math.random() * Math.PI * 2;
  const maxR   = Math.min(radar.clientWidth * .44, 420);
  const radius = 20 + Math.random() * (maxR - 20);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const sz = .8 + Math.random() * 1.4;
  const col = `rgba(0,212,212,${.10 + Math.random() * .20})`;

  dot.style.cssText = `
    position:absolute;
    width:${sz}px; height:${sz}px;
    border-radius:50%;
    background:${col};
    left:calc(50% + ${x}px - ${sz/2}px);
    top:calc(50% + ${y}px - ${sz/2}px);
    opacity:0; pointer-events:none; z-index:4;
  `;
  radar.appendChild(dot);
  gsap.fromTo(dot,
    { opacity: 0 },
    { opacity: 1, duration: .12,
      onComplete() {
        gsap.to(dot, { opacity: 0, duration: .55,
          onComplete: () => dot.remove() });
      }
    });
}

setInterval(staticBlip, 480);
setInterval(() => { if (Math.random() > .38) staticBlip(); }, 280);
setInterval(noiseDot, 160);
setInterval(noiseDot, 80);

// ── Sweep glow trail (persistent afterimage arc) ──
function sweepGlow() {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position:absolute; inset:0;
    border-radius:50%;
    background: conic-gradient(from ${sweepAngle - 2}deg,
      rgba(0,255,255,.16),
      rgba(0,200,200,.09) 14%,
      transparent 30%);
    pointer-events:none; z-index:3;
  `;
  radar.appendChild(glow);
  gsap.to(glow, { opacity: 0, duration: 1.1,
    onComplete: () => glow.remove() });
}

// Leading-edge flash — very thin, bright
function sweepFlash() {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position:absolute; inset:0;
    border-radius:50%;
    background: conic-gradient(from ${sweepAngle - 1}deg,
      rgba(0,255,255,.28),
      transparent 3.5%);
    pointer-events:none; z-index:6;
  `;
  radar.appendChild(flash);
  gsap.fromTo(flash,
    { opacity: 1 },
    { opacity: 0, duration: .28,
      onComplete: () => flash.remove() });
}

setInterval(sweepGlow,  240);
setInterval(sweepFlash, 130);

// ── Center pulse ──────────────────────────────
gsap.to('.radar-center', {
  scale: 2.0, opacity: .22,
  duration: 1.9, repeat: -1, yoyo: true,
  ease: 'sine.inOut'
});

// Secondary expanding ring from center
const centerOuter = document.createElement('div');
centerOuter.style.cssText = `
  position:absolute;
  top:50%; left:50%;
  width:26px; height:26px;
  transform:translate(-50%,-50%);
  border-radius:50%;
  border:1px solid rgba(0,212,212,.55);
  pointer-events:none; z-index:9;
`;
radar.appendChild(centerOuter);
gsap.to(centerOuter, {
  scale: 3.2, opacity: 0,
  duration: 2.0, repeat: -1, ease: 'power1.out'
});

// Tertiary slower ring
const centerOuter2 = document.createElement('div');
centerOuter2.style.cssText = `
  position:absolute;
  top:50%; left:50%;
  width:26px; height:26px;
  transform:translate(-50%,-50%);
  border-radius:50%;
  border:1px solid rgba(0,212,212,.30);
  pointer-events:none; z-index:9;
`;
radar.appendChild(centerOuter2);
gsap.to(centerOuter2, {
  scale: 5.5, opacity: 0,
  duration: 3.4, repeat: -1, delay: 1.0, ease: 'power1.out'
});

// ── Contact count HUD ─────────────────────────
const countEl = document.getElementById('contact-count');
if (countEl) countEl.textContent = `CONTACTOS: ${contacts.length}`;
