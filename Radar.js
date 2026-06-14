/**
 * LANCERO OS — Radar.js
 * Motor de renderizado del Sistema Dinámico de Radar Táctico v2.4
 */

const canvas = document.getElementById('radarCanvas');
const ctx    = canvas.getContext('2d');

let W, H, cx, cy, R;

function resize() {
  W  = canvas.width  = window.innerWidth;
  H  = canvas.height = window.innerHeight;
  cx = W / 2;
  cy = H / 2;
  R  = Math.hypot(W, H) * 0.55;
}
resize();
window.addEventListener('resize', resize);

// ── Sweep configuration ──
const SWEEP_SECS = 4.2;
const TRAIL_DEG  = 88;

// ── Tactical blips ──
const NUM_BLIPS = 11;
const blips = [];

function makeBlips() {
  blips.length = 0;
  for (let i = 0; i < NUM_BLIPS; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = R * (0.1 + Math.random() * 0.78);
    blips.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      angleDeg: ((a * 180 / Math.PI) + 360) % 360,
      brightness: 0,
      size: 0.8 + Math.random() * 1.4,
    });
  }
}
makeBlips();

window.addEventListener('resize', () => {
  const dx = W / 2 - (window.innerWidth  / 2);
  const dy = H / 2 - (window.innerHeight / 2);
  for (const b of blips) {
    b.x -= dx;
    b.y -= dy;
  }
});

// ── Render loop ──
let startTime = performance.now();

function drawRadar(now) {
  requestAnimationFrame(drawRadar);

  const elapsed  = (now - startTime) / 1000;
  const sweepRad = ((elapsed / SWEEP_SECS) % 1) * Math.PI * 2;
  const sweepDeg = (sweepRad * 180 / Math.PI + 360) % 360;

  // ── Clear ──
  ctx.clearRect(0, 0, W, H);

  // ── Deep radial background ──
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
  bg.addColorStop(0,   'rgba(255, 130, 0, 0.06)');
  bg.addColorStop(0.4, 'rgba(200,  90, 0, 0.02)');
  bg.addColorStop(1,   '#030303');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Tactical grid ──
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 130, 0, 0.025)';
  ctx.lineWidth   = 1;
  const step = 90;
  for (let x = cx % step; x < W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = cy % step; y < H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // ── Concentric range rings ──
  const rings = [0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 0.98];
  rings.forEach((frac, i) => {
    const alpha = Math.max(0.005, 0.085 - i * 0.011);
    ctx.beginPath();
    ctx.arc(cx, cy, R * frac, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 130, 0, ${alpha.toFixed(4)})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // range tick marks at cardinal points on each ring
    if (i < 5) {
      [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(angle => {
        const r0 = R * frac;
        const r1 = r0 + 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
        ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
        ctx.strokeStyle = `rgba(255,130,0,${(alpha * 1.8).toFixed(4)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  });

  // ── Crosshair ──
  ctx.strokeStyle = 'rgba(255, 130, 0, 0.055)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

  // ── Diagonal range lines (45°) ──
  ctx.strokeStyle = 'rgba(255, 130, 0, 0.018)';
  ctx.lineWidth   = 1;
  const diagLen = Math.hypot(W, H);
  [45, 135].forEach(deg => {
    const rad = deg * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(rad) * diagLen, cy - Math.sin(rad) * diagLen);
    ctx.lineTo(cx + Math.cos(rad) * diagLen, cy + Math.sin(rad) * diagLen);
    ctx.stroke();
  });

  // ── Phosphor sweep trail ──
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const TRAIL = TRAIL_DEG * Math.PI / 180;
  const STEPS = 70;
  for (let s = 0; s < STEPS; s++) {
    const t     = s / STEPS;
    const a0    = sweepRad - TRAIL * t;
    const a1    = sweepRad - TRAIL * ((s + 1) / STEPS);
    const alpha = (1 - t) * 0.11;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a0, a1, true);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 140, 0, ${alpha.toFixed(4)})`;
    ctx.fill();
  }
  ctx.restore();

  // ── Sweep line beam ──
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const lineGrad = ctx.createLinearGradient(
    cx, cy,
    cx + Math.cos(sweepRad) * R,
    cy + Math.sin(sweepRad) * R
  );
  lineGrad.addColorStop(0,   'rgba(255, 200, 80, 0.95)');
  lineGrad.addColorStop(0.25, 'rgba(255, 152, 0, 0.55)');
  lineGrad.addColorStop(1,   'rgba(255, 140, 0, 0)');
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sweepRad) * R, cy + Math.sin(sweepRad) * R);
  ctx.strokeStyle  = lineGrad;
  ctx.lineWidth    = 2.5;
  ctx.shadowColor  = 'rgba(255, 152, 0, 0.8)';
  ctx.shadowBlur   = 10;
  ctx.stroke();
  ctx.restore();

  // ── Blip contacts ──
  for (const b of blips) {
    const diff = (sweepDeg - b.angleDeg + 360) % 360;
    if (diff < 3.5) {
      b.brightness = 1.0;
    } else {
      b.brightness = Math.max(0, 1 - diff / TRAIL_DEG);
    }
    if (b.brightness <= 0.01) continue;

    const alpha = b.brightness;
    const s     = b.size;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // glow halo
    const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 18 * alpha * s + 2);
    grd.addColorStop(0,   `rgba(255, 220, 80,  ${(alpha * 0.9).toFixed(3)})`);
    grd.addColorStop(0.3, `rgba(255, 152,  0,  ${(alpha * 0.5).toFixed(3)})`);
    grd.addColorStop(1,   'rgba(255, 140,  0, 0)');
    ctx.beginPath();
    ctx.arc(b.x, b.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // core dot
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 240, 160, ${alpha.toFixed(3)})`;
    ctx.shadowColor = '#ffdd80';
    ctx.shadowBlur  = 8;
    ctx.fill();

    // diamond reticle around the blip when bright
    if (alpha > 0.5) {
      const d = 9 * s;
      ctx.beginPath();
      ctx.moveTo(b.x,     b.y - d);
      ctx.lineTo(b.x + d, b.y    );
      ctx.lineTo(b.x,     b.y + d);
      ctx.lineTo(b.x - d, b.y    );
      ctx.closePath();
      ctx.strokeStyle = `rgba(255,200,60, ${(alpha * 0.55).toFixed(3)})`;
      ctx.lineWidth   = 0.8;
      ctx.shadowBlur  = 0;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Origin emitter (center node) ──
  ctx.save();
  // outer pulse ring
  const pulseSize = 8 + 4 * Math.abs(Math.sin(elapsed * 1.8));
  const pulseGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseSize);
  pulseGrd.addColorStop(0,   'rgba(255,200,60,0.18)');
  pulseGrd.addColorStop(1,   'rgba(255,152, 0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = pulseGrd;
  ctx.fill();

  // inner solid dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle   = '#ffaa20';
  ctx.shadowColor = '#ff9800';
  ctx.shadowBlur  = 14;
  ctx.fill();
  ctx.restore();
}

requestAnimationFrame(drawRadar);

// ── UTC Clock ──
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('utc-clock').textContent = `${h}:${m}:${s} UTC`;
}
setInterval(updateClock, 1000);
updateClock();
