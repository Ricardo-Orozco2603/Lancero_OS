// ================================================
// LANCERO OS — RADAR ENGINE v4.0
// Dual radar | Cyan palette | Improved tracking
// ================================================

// ── Run both radars ───────────────────────────
initRadar(document.getElementById('radar-left'),  4.5, false);
initRadar(document.getElementById('radar-right'), 6.2, true);

// ── Color map ─────────────────────────────────
const COLOR = {
  FRIEND:  '#00ffff',
  HOSTILE: '#ff4455',
  UNKNOWN: '#f0c050',
};

// ── Contacts for left radar ───────────────────
const LEFT_CONTACTS = [
  { x:  155, y:  -95, type: 'FRIEND'  },
  { x: -180, y:   85, type: 'HOSTILE' },
  { x:   95, y:  175, type: 'UNKNOWN' },
  { x:  -75, y: -145, type: 'FRIEND'  },
  { x:  205, y:   30, type: 'HOSTILE' },
  { x: -130, y: -200, type: 'FRIEND'  },
  { x:   50, y:  -55, type: 'FRIEND'  },
  { x: -105, y:   50, type: 'UNKNOWN' },
  { x:  160, y:  125, type: 'HOSTILE' },
  { x: -220, y: -110, type: 'FRIEND'  },
  { x:  -45, y:  215, type: 'UNKNOWN' },
];

// ── Contacts for right radar (different layout) ─
const RIGHT_CONTACTS = [
  { x:  120, y: -160, type: 'FRIEND'  },
  { x: -200, y:  120, type: 'HOSTILE' },
  { x:   80, y:  200, type: 'UNKNOWN' },
  { x: -100, y: -120, type: 'FRIEND'  },
  { x:  190, y:   70, type: 'HOSTILE' },
  { x:  -60, y: -190, type: 'FRIEND'  },
  { x:  -90, y:  140, type: 'UNKNOWN' },
  { x:  210, y: -100, type: 'FRIEND'  },
];

// ── Main initializer ──────────────────────────
function initRadar(radarEl, sweepDuration, isRight) {
  if (!radarEl) return;

  const contacts = isRight ? RIGHT_CONTACTS : LEFT_CONTACTS;
  let sweepAngle = isRight ? 180 : 0; // right starts at opposite phase

  // ── Spawn contact markers ──────────────────
  contacts.forEach(c => {
    c.cooldown     = false;
    c.trailOpacity = 0;

    const col = COLOR[c.type];

    // Main blip dot
    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;
      width:7px; height:7px;
      border-radius:50%;
      background:${col};
      box-shadow:0 0 8px ${col}, 0 0 16px ${col}66;
      left:calc(50% + ${c.x}px - 3.5px);
      top:calc(50% + ${c.y}px - 3.5px);
      opacity:.10;
      pointer-events:none; z-index:5;
      transition:opacity .1s;
    `;
    c.el = dot;
    radarEl.appendChild(dot);

    // IFF bracket (square corners)
    const br = document.createElement('div');
    br.style.cssText = `
      position:absolute;
      width:18px; height:18px;
      border:1px solid ${col};
      left:calc(50% + ${c.x}px - 9px);
      top:calc(50% + ${c.y}px - 9px);
      opacity:.06;
      pointer-events:none; z-index:4;
    `;
    c.bracket = br;
    radarEl.appendChild(br);

    // Afterglow trail (blurred halo that persists after sweep)
    const trail = document.createElement('div');
    trail.style.cssText = `
      position:absolute;
      width:22px; height:22px;
      border-radius:50%;
      background:radial-gradient(circle, ${col}55, transparent 70%);
      left:calc(50% + ${c.x}px - 11px);
      top:calc(50% + ${c.y}px - 11px);
      opacity:0;
      pointer-events:none; z-index:3;
      filter:blur(5px);
    `;
    c.trail = trail;
    radarEl.appendChild(trail);
  });

  // ── Sweep element ──────────────────────────
  const sweepEl = radarEl.querySelector('.sweep');

  gsap.to(sweepEl, {
    rotation: 360,
    duration: sweepDuration,
    repeat: -1,
    ease: 'none',
    transformOrigin: 'center center',
    onUpdate() {
      sweepAngle = gsap.getProperty(sweepEl, 'rotation');
      checkContacts(radarEl, contacts, sweepAngle);
    }
  });

  // ── Glow trail & flash intervals ──────────
  setInterval(() => {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position:absolute; inset:0; border-radius:50%;
      background:conic-gradient(from ${sweepAngle - 1}deg,
        rgba(0,255,255,.14),
        rgba(0,200,200,.07) 16%,
        transparent 32%);
      pointer-events:none; z-index:3;
    `;
    radarEl.appendChild(glow);
    gsap.to(glow, { opacity:0, duration:1.1, onComplete:() => glow.remove() });
  }, 250);

  setInterval(() => {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position:absolute; inset:0; border-radius:50%;
      background:conic-gradient(from ${sweepAngle}deg,
        rgba(0,255,255,.26),
        transparent 3%);
      pointer-events:none; z-index:6;
    `;
    radarEl.appendChild(flash);
    gsap.fromTo(flash, { opacity:1 }, { opacity:0, duration:.25, onComplete:() => flash.remove() });
  }, 140);

  // ── Static noise blips ─────────────────────
  function staticBlip() {
    const dot    = document.createElement('div');
    const angle  = Math.random() * Math.PI * 2;
    const maxR   = radarEl.clientWidth * .44;
    const radius = 25 + Math.random() * (maxR - 25);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const bright = Math.random() > .78;
    const sz  = bright ? 2.5 + Math.random() * 3 : 1.2 + Math.random() * 2;
    const col = bright
      ? 'rgba(0,255,255,.88)'
      : `rgba(0,${150+Math.floor(Math.random()*80)},${150+Math.floor(Math.random()*80)},.32)`;

    dot.style.cssText = `
      position:absolute;
      width:${sz}px; height:${sz}px; border-radius:50%;
      background:${col};
      left:calc(50% + ${x}px - ${sz/2}px);
      top:calc(50% + ${y}px - ${sz/2}px);
      opacity:0; pointer-events:none; z-index:5;
      box-shadow:0 0 ${bright?9:4}px ${col};
    `;
    radarEl.appendChild(dot);
    gsap.fromTo(dot,
      { scale:.1, opacity:0 },
      { scale:1.4, opacity: bright?.80:.38, duration: bright?.18:.38, ease:'power2.out',
        onComplete() {
          gsap.to(dot, { scale: bright?2.8:2, opacity:0, duration: bright?.60:1.0,
            ease:'power1.in', onComplete:() => dot.remove() });
        }
      });
  }

  function noiseDot() {
    const dot    = document.createElement('div');
    const angle  = Math.random() * Math.PI * 2;
    const maxR   = radarEl.clientWidth * .44;
    const radius = 15 + Math.random() * (maxR - 15);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const sz  = .7 + Math.random() * 1.3;
    const col = `rgba(0,212,212,${.08+Math.random()*.18})`;
    dot.style.cssText = `
      position:absolute;
      width:${sz}px; height:${sz}px; border-radius:50%;
      background:${col};
      left:calc(50% + ${x}px - ${sz/2}px);
      top:calc(50% + ${y}px - ${sz/2}px);
      opacity:0; pointer-events:none; z-index:4;
    `;
    radarEl.appendChild(dot);
    gsap.fromTo(dot,
      { opacity:0 },
      { opacity:1, duration:.12,
        onComplete() { gsap.to(dot, { opacity:0, duration:.50, onComplete:() => dot.remove() }); }
      });
  }

  setInterval(staticBlip, 480);
  setInterval(() => { if (Math.random()>.40) staticBlip(); }, 280);
  setInterval(noiseDot, 160);
  setInterval(noiseDot, 85);

  // ── Center pulse ───────────────────────────
  const center = radarEl.querySelector('.radar-center');
  gsap.to(center, {
    scale:2.0, opacity:.20,
    duration:1.8, repeat:-1, yoyo:true, ease:'sine.inOut'
  });

  // Expanding ring from center
  function spawnCenterRing(delay, maxScale, dur) {
    const ring = document.createElement('div');
    ring.style.cssText = `
      position:absolute; top:50%; left:50%;
      width:22px; height:22px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      border:1px solid rgba(0,212,212,.50);
      pointer-events:none; z-index:9;
    `;
    radarEl.appendChild(ring);
    gsap.to(ring, {
      scale: maxScale, opacity:0,
      duration: dur, delay: delay,
      repeat:-1, repeatDelay: delay,
      ease:'power1.out'
    });
  }
  spawnCenterRing(0,   3.0, 2.0);
  spawnCenterRing(1.2, 5.5, 3.2);
}

// ── Contact visibility (shared) ───────────────
function checkContacts(radarEl, contacts, sweepAngle) {
  const WINDOW = 4;
  const FADE   = 75;

  contacts.forEach(c => {
    const angle = (Math.atan2(c.y, c.x) * 180 / Math.PI + 360) % 360;
    const diff  = (sweepAngle - angle + 360) % 360;

    if (diff < WINDOW) {
      // Sweep is hitting the contact — full brightness
      gsap.to(c.el,      { opacity:1,    duration:.07 });
      gsap.to(c.bracket, { opacity:.75,  duration:.07 });
      gsap.to(c.trail,   { opacity:.60,  duration:.07 });
      createPing(radarEl, c);
    } else if (diff < FADE) {
      // Afterglow decay — linear fade
      const t = 1 - (diff - WINDOW) / (FADE - WINDOW);
      gsap.to(c.el,      { opacity: Math.max(.08, t * .92), duration:.5 });
      gsap.to(c.bracket, { opacity: Math.max(.03, t * .68), duration:.5 });
      gsap.to(c.trail,   { opacity: Math.max(0,   t * .45), duration:.5 });
    } else {
      // Dormant — ghost presence
      gsap.to(c.el,      { opacity:.08, duration:1.0 });
      gsap.to(c.bracket, { opacity:.03, duration:1.0 });
      gsap.to(c.trail,   { opacity:0,   duration:.7  });
    }
  });
}

// ── Detection ping ─────────────────────────────
function createPing(radarEl, c) {
  if (c.cooldown) return;
  c.cooldown = true;
  const col = COLOR[c.type];

  // Two concentric expanding rings
  [7, 13].forEach((halfSz, i) => {
    const ping = document.createElement('div');
    ping.style.cssText = `
      position:absolute;
      width:${halfSz*2}px; height:${halfSz*2}px; border-radius:50%;
      border:1px solid ${col};
      left:calc(50% + ${c.x}px - ${halfSz}px);
      top:calc(50% + ${c.y}px - ${halfSz}px);
      pointer-events:none; z-index:7;
      box-shadow:0 0 8px ${col}66;
    `;
    radarEl.appendChild(ping);
    gsap.fromTo(ping,
      { scale:.2, opacity:1 },
      { scale: i===0?5.5:3.5, opacity:0,
        duration:1.4 + i*.4, delay: i*.18,
        ease:'power2.out', onComplete:() => ping.remove() });
  });

  // Core bright flash
  const flash = document.createElement('div');
  flash.style.cssText = `
    position:absolute;
    width:14px; height:14px; border-radius:50%;
    background:${col};
    left:calc(50% + ${c.x}px - 7px);
    top:calc(50% + ${c.y}px - 7px);
    pointer-events:none; z-index:9;
    box-shadow:0 0 16px ${col}, 0 0 32px ${col}88;
  `;
  radarEl.appendChild(flash);
  gsap.fromTo(flash,
    { scale:.3, opacity:1 },
    { scale:0, opacity:0, duration:.50, ease:'power3.out', onComplete:() => flash.remove() });

  // IFF type label
  const lbl = document.createElement('div');
  lbl.textContent = c.type;
  lbl.style.cssText = `
    position:absolute;
    font-family:'Share Tech Mono',monospace;
    font-size:clamp(7px,.7vw,9px);
    letter-spacing:.10em;
    color:${col};
    left:calc(50% + ${c.x+12}px);
    top:calc(50% + ${c.y-14}px);
    pointer-events:none; z-index:8;
    white-space:nowrap;
    text-shadow:0 0 7px ${col};
  `;
  radarEl.appendChild(lbl);
  gsap.fromTo(lbl,
    { opacity:1 },
    { opacity:0, duration:2.5, ease:'power2.out', onComplete:() => lbl.remove() });

  setTimeout(() => { c.cooldown = false; }, 2800);
}
