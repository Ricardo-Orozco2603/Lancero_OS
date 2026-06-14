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
  { x:   60, y:  -70, type: 'FRIEND'  },
  { x: -130, y:   60, type: 'UNKNOWN' },
  { x:  200, y:  160, type: 'HOSTILE' },
  { x: -280, y: -140, type: 'FRIEND'  },
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

  // outer ring expand — 2 concentric rings
  [6, 10].forEach((halfSz, i) => {
    const ping = document.createElement('div');
    ping.style.cssText = `
      position:absolute;
      width:${halfSz*2}px; height:${halfSz*2}px;
      border-radius:50%;
      border:1px solid ${col};
      left:calc(50% + ${c.x}px - ${halfSz}px);
      top:calc(50% + ${c.y}px - ${halfSz}px);
      pointer-events:none; z-index:6;
      box-shadow: 0 0 6px ${col};
    `;
    radar.appendChild(ping);
    gsap.fromTo(ping,
      { scale:.3, opacity:1 },
      { scale: i === 0 ? 6 : 4, opacity:0,
        duration: 1.4 + i * .4,
        delay: i * .18,
        ease:'power2.out',
        onComplete: () => ping.remove() });
  });

  // bright core flash on detection
  const flash = document.createElement('div');
  flash.style.cssText = `
    position:absolute;
    width:18px; height:18px;
    border-radius:50%;
    background:${col};
    left:calc(50% + ${c.x}px - 9px);
    top:calc(50% + ${c.y}px - 9px);
    pointer-events:none; z-index:8;
    box-shadow: 0 0 20px ${col}, 0 0 40px ${col}88;
  `;
  radar.appendChild(flash);
  gsap.fromTo(flash, { scale:.4, opacity:1 },
    { scale:0, opacity:0, duration:.6, ease:'power3.out',
      onComplete: () => flash.remove() });

  // label flash
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
    pointer-events:none; z-index:7;
    white-space:nowrap;
    text-shadow: 0 0 8px ${col};
  `;
  radar.appendChild(lbl);
  gsap.fromTo(lbl, { opacity:1 },
    { opacity:0, duration:2.5, ease:'power2.out',
      onComplete: () => lbl.remove() });

  setTimeout(() => { c.cooldown = false; }, 2600);
}

// ── Background static (gold) ──────────────────
function staticBlip() {
  const dot = document.createElement('div');
  const angle  = Math.random() * Math.PI * 2;
  const maxR   = Math.min(radar.clientWidth * .44, 420);
  const radius = 30 + Math.random() * (maxR - 30);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const isBright = Math.random() > .72;
  const sz = isBright ? 3 + Math.random() * 3.5 : 1.5 + Math.random() * 2.5;

  // gold-tinted static with occasional bright white-gold spike
  let col;
  if (isBright) {
    col = `rgb(255,230,120)`;
  } else {
    const r = 180 + Math.floor(Math.random() * 60);
    const g = 120 + Math.floor(Math.random() * 60);
    col = `rgb(${r},${g},20)`;
  }

  dot.style.cssText = `
    position:absolute;
    width:${sz}px; height:${sz}px;
    border-radius:50%;
    background:${col};
    left:calc(50% + ${x}px - ${sz/2}px);
    top:calc(50% + ${y}px - ${sz/2}px);
    opacity:0; pointer-events:none; z-index:5;
    box-shadow:0 0 ${isBright?10:5}px ${col}, 0 0 ${isBright?20:8}px ${col}66;
  `;
  radar.appendChild(dot);

  const peakOpacity = isBright ? .85 : .45;
  gsap.fromTo(dot,
    { scale:.1, opacity:0 },
    { scale:1.4, opacity:peakOpacity, duration: isBright ? .2 : .4,
      ease: 'power2.out',
      onComplete() {
        gsap.to(dot, {
          scale: isBright ? 2.8 : 2,
          opacity:0,
          duration: isBright ? .7 : 1.1,
          ease:'power1.in',
          onComplete: () => dot.remove()
        });
      }
    });
}

// Extra fine-grain noise layer
function noiseDot() {
  const dot = document.createElement('div');
  const angle  = Math.random() * Math.PI * 2;
  const maxR   = Math.min(radar.clientWidth * .44, 420);
  const radius = 20 + Math.random() * (maxR - 20);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const sz = 1 + Math.random() * 1.5;
  const col = `rgba(212,168,67,${.15 + Math.random() * .25})`;

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
    { opacity:0 },
    { opacity:1, duration:.15,
      onComplete() {
        gsap.to(dot, { opacity:0, duration:.6,
          onComplete: () => dot.remove() });
      }
    });
}

setInterval(staticBlip, 500);
setInterval(() => { if (Math.random() > .4) staticBlip(); }, 300);
setInterval(noiseDot, 180);
setInterval(noiseDot, 90);

// ── Pulse: sweep trail glow ───────────────────
function sweepGlow() {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position:absolute; inset:0;
    border-radius:50%;
    background: conic-gradient(from ${sweepAngle - 2}deg,
      rgba(255,220,100,.18),
      rgba(212,168,67,.10) 12%,
      transparent 26%);
    pointer-events:none; z-index:3;
  `;
  radar.appendChild(glow);
  gsap.to(glow, { opacity:0, duration:1.0,
    onComplete: () => glow.remove() });
}

// ── Radial flash at sweep leading edge ────────
function sweepFlash() {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position:absolute; inset:0;
    border-radius:50%;
    background: conic-gradient(from ${sweepAngle - 1}deg,
      rgba(255,240,180,.22),
      transparent 4%);
    pointer-events:none; z-index:6;
  `;
  radar.appendChild(flash);
  gsap.fromTo(flash, { opacity:1 },
    { opacity:0, duration:.3,
      onComplete: () => flash.remove() });
}

setInterval(sweepGlow, 250);
setInterval(sweepFlash, 140);

// ── Center pulse ──────────────────────────────
gsap.to('.radar-center', {
  scale: 2.2, opacity: .25,
  duration: 1.8, repeat: -1, yoyo: true,
  ease: 'sine.inOut'
});

// Secondary outer ring pulse
const centerOuter = document.createElement('div');
centerOuter.style.cssText = `
  position:absolute;
  top:50%; left:50%;
  width:28px; height:28px;
  transform:translate(-50%,-50%);
  border-radius:50%;
  border:1px solid rgba(212,168,67,.5);
  pointer-events:none; z-index:9;
`;
radar.appendChild(centerOuter);
gsap.to(centerOuter, {
  scale:3, opacity:0,
  duration:2.2, repeat:-1, ease:'power1.out'
});

// ── Contact count HUD ─────────────────────────
const countEl = document.getElementById('contact-count');
if (countEl) countEl.textContent = `CONTACTOS: ${contacts.length}`;
