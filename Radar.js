/**
 * LANCERO OS — Radar.js
 * Motor de renderizado del Sistema Dinámico de Radar Táctico
 */

const canvas = document.getElementById('radarCanvas');
const ctx    = canvas.getContext('2d');

// ── Redimensionamiento y Extensión de Cobertura ──
let W, H, cx, cy, R;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  cx = W / 2;
  cy = H / 2;
  // Radio extendido usando la diagonal total para cubrir toda la pantalla
  R = Math.hypot(W, H) * 0.55;
}
resize();
window.addEventListener('resize', resize);

const SWEEP_SECS = 4.0;
const TRAIL_DEG  = 85;

// ── Conservación de Objetivos Tácticos (Blips) ──
const NUM_BLIPS = 9;
const blips = [];

function makeBlips() {
  blips.length = 0;
  for (let i = 0; i < NUM_BLIPS; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = R * (0.12 + Math.random() * 0.75);
    blips.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      angleDeg: ((a * 180 / Math.PI) + 360) % 360,
      brightness: 0,
    });
  }
}
makeBlips();

window.addEventListener('resize', () => {
  for (const b of blips) {
    b.x = cx + (b.x - window.innerWidth  / 2);
    b.y = cy + (b.y - window.innerHeight / 2);
  }
});

// ── Renderizado del Sistema Dinámico de Radar ──
let startTime = performance.now();

function drawRadar(now) {
  requestAnimationFrame(drawRadar);

  const elapsed  = (now - startTime) / 1000;
  const sweepRad = ((elapsed / SWEEP_SECS) % 1) * Math.PI * 2;
  const sweepDeg = (sweepRad * 180 / Math.PI + 360) % 360;

  ctx.clearRect(0, 0, W, H);

  // Fondo de gradiente de barrido profundo
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  bg.addColorStop(0,   'rgba(255, 140, 0, 0.05)');
  bg.addColorStop(0.6, 'rgba(255, 100, 0, 0.01)');
  bg.addColorStop(1,   '#050505');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Rejilla Táctica Estructurada
  ctx.strokeStyle = 'rgba(255, 140, 0, 0.03)';
  ctx.lineWidth = 1;
  const step = 85;
  for (let x = (cx % step); x < W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = (cy % step); y < H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Círculos concéntricos de medición
  const rings = [0.15, 0.30, 0.45, 0.60, 0.75, 0.90];
  rings.forEach((frac, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * frac, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 140, 0, ${(0.10 - i * 0.012).toFixed(3)})`;
    ctx.stroke();
  });

  // Retícula en cruz ortogonal
  ctx.strokeStyle = 'rgba(255, 140, 0, 0.06)';
  ctx.beginPath(); ctx.moveTo(0, cy);  ctx.lineTo(W, cy);  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

  // Trail cónico de fósforo (alta persistencia)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const TRAIL = TRAIL_DEG * Math.PI / 180;
  const STEPS = 60;
  for (let s = 0; s < STEPS; s++) {
    const t     = s / STEPS;
    const a0    = sweepRad - TRAIL * t;
    const a1    = sweepRad - TRAIL * ((s + 1) / STEPS);
    const alpha = (1 - t) * 0.12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a0, a1, true);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 140, 0, ${alpha.toFixed(4)})`;
    ctx.fill();
  }
  ctx.restore();

  // Haz lumínico del barrido (Sweep Line Vector)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const lineGrad = ctx.createLinearGradient(
    cx, cy,
    cx + Math.cos(sweepRad) * R,
    cy + Math.sin(sweepRad) * R
  );
  lineGrad.addColorStop(0,   'rgba(255, 180, 0, 0.90)');
  lineGrad.addColorStop(0.3, 'rgba(255, 140, 0, 0.40)');
  lineGrad.addColorStop(1,   'rgba(255, 140, 0, 0)');
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sweepRad) * R, cy + Math.sin(sweepRad) * R);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth   = 2;
  ctx.shadowColor = 'rgba(255, 152, 0, 0.7)';
  ctx.shadowBlur  = 8;
  ctx.stroke();
  ctx.restore();

  // Actualización de contactos de radar (Blips)
  for (const b of blips) {
    const diff = (sweepDeg - b.angleDeg + 360) % 360;
    if (diff < 4) {
      b.brightness = 1.0;
    } else {
      b.brightness = Math.max(0, 1 - diff / TRAIL_DEG);
    }

    if (b.brightness <= 0.01) continue;

    const alpha = b.brightness;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 14 * alpha + 2);
    grd.addColorStop(0,   `rgba(255, 210, 70,  ${(alpha * 0.85).toFixed(3)})`);
    grd.addColorStop(0.4, `rgba(255, 150, 0,   ${(alpha * 0.4).toFixed(3)})`);
    grd.addColorStop(1,   'rgba(255, 140, 0, 0)');

    ctx.beginPath();
    ctx.arc(b.x, b.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 235, 150, ${alpha.toFixed(3)})`;
    ctx.fill();
    ctx.restore();
  }

  // Emisor de origen — Núcleo central
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle  = '#ff9800';
  ctx.shadowColor = '#ff9800';
  ctx.shadowBlur  = 12;
  ctx.fill();
  ctx.restore();
}

requestAnimationFrame(drawRadar);

// ── Sincronización del Reloj UTC ──
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('utc-clock').textContent = `${h}:${m}:${s} UTC`;
}
setInterval(updateClock, 1000);
updateClock();
