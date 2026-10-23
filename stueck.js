// Zero Time – Echt-Stück (Probe): unteres halbes Spielfeld, so echt wie möglich, quer im Spielerblick.
// Eigene Seite, unabhängig von der App. Physik mit den Maßen und Werten aus index.html (0.91), 1000 Schritte je Sekunde.
// Was es „echt“ machen soll: bedruckter Lackboden, der Teile spiegelt; Einsätze als Kunststoff mit Glühlampe darunter (glimmen an und
// aus); bedruckte Schleuder-Kunststoffe auf Pfosten; Metallführungen mit Rollkante; sichtbare Lampen, die echtes Licht werfen;
// Kugel spiegelt den Tisch live; Drahtrampen kommen aus dem Dunkel; Ton (Spulen, Schleuder, Rollen).
// Koordinaten wie überall: Tisch (x, y) → 3D (X = x − 200, Z = y − 380), Höhe = Y; eine Tischeinheit = eine 3D-Einheit (Kugel R 9).
import * as THREE from './lib/three.module.min.js';
import { EffectComposer } from './lib/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './lib/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './lib/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './lib/jsm/postprocessing/OutputPass.js';

const PI = Math.PI;
const R = 9;
const OBEN = 372;                     // darüber liegt das (nicht gebaute) obere Spielfeld: Kugel verschwindet im Dunkel und kommt zurück
const P = (x, y, h = 0) => new THREE.Vector3(x - 200, h, y - 380);
const zufall = (a, b) => a + Math.random() * (b - a);

// ======================================================================================================================
// Physik (wie index.html: Wände als Strecken, Kugel als Kreis, Flipper als bewegte Strecke)
// ======================================================================================================================
const G = 1150, TEMPO = 0.7, DT = 0.001;
const REST_WALL = 0.5, REST_FLIP = 0.3, WEICH_AB = 40, WEICH_VOLL = 300;
const LANE_X = 364, SHOOT_X = 378, SHOOT_Y = 745;
const weich = (rest, vn) => rest * Math.min(1, Math.max(0, (-vn - WEICH_AB) / (WEICH_VOLL - WEICH_AB)));

const walls = [];
const seg = (x1, y1, x2, y2, extra = {}) => walls.push({ x1, y1, x2, y2, ...extra });
seg(12, 330, 12, 780, { aussen: true }); seg(392, 330, 392, 780, { aussen: true });
seg(LANE_X, 330, LANE_X, 780, { rinne: true }); seg(LANE_X, 760, 392, 760, { aussen: true });
seg(58, 330, 58, 470);                                    // linker Umlauf: Innenführung
seg(326, 330, 326, 382); seg(364, 402, 330, 446);         // rechter Umlauf und Abweiser
seg(12, 470, 40, 574);                                    // Zuführung linker Umlauf → linke Rückkehrgasse
seg(40, 578, 40, 640.6); seg(40, 640.6, 115.4, 681.9);    // Rückkehrgassen: Führung endet am Flipper-Drehpunkt
seg(336, 578, 336, 640.6); seg(336, 640.6, 260.6, 681.9);
const SCHLEUDER_DICK = 5.6;
const slings = [
  { pts: [[70, 572], [70, 628], [104, 648]], seite: 1, flash: 0 },
  { pts: [[306, 572], [306, 628], [272, 648]], seite: -1, flash: 0 },
];
for (const s of slings) {
  const [a, b, c] = s.pts;
  seg(a[0], a[1], b[0], b[1], { schleuder: true, dick: SCHLEUDER_DICK });
  seg(b[0], b[1], c[0], c[1], { schleuder: true, dick: SCHLEUDER_DICK });
  seg(c[0], c[1], a[0], a[1], { schleuder: true, kick: s, dick: SCHLEUDER_DICK });
}
const posts = [{ x: 134, y: 405, r: 3.5 }, { x: 178, y: 405, r: 3.5 }, { x: 256, y: 395, r: 3.5 }, { x: 300, y: 395, r: 3.5 }];
const standups = [460, 485, 510].map(y => ({ x: 358, y, h: 20, an: false, blitz: 0 }));
const RUND_X = 61;
const rund = [386, 401, 416, 431, 446].map(y => ({ x: RUND_X, y, h: 13, blitz: 0 }));
const FL = 66, A_REST = 0.5, A_UP = -0.45, A_SPEED = 22, EFFET = 0.8;
const flippers = [
  { px: 112.1, py: 688, side: 1, a: A_REST, on: false, prev: null, demoAus: 0, demoBis: 0 },
  { px: 263.9, py: 688, side: -1, a: A_REST, on: false, prev: null, demoAus: 0, demoBis: 0 },
];
const tip = f => ({ x: f.px + f.side * FL * Math.cos(f.a), y: f.py + FL * Math.sin(f.a) });
// Drahtrampen-Enden (Bahnen der Tunnel-Rampen aus index.html): kommen oben aus dem Dunkel und legen die Kugel in die Rückkehrgassen
const RAMPEN = [
  { pfad: [[156, 400], [150, 70], [380, 180], [321, 585]], aus: { x: 321, y: 585 } },
  { pfad: [[278, 390], [250, 60], [-40, 200], [55, 585]], aus: { x: 55, y: 585 } },
];
const RAMPE_T0 = 0.78, RAMPE_DAUER = 0.75;
const bez = (p, t) => {
  const u = 1 - t;
  return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]];
};
const rampenHoehe = u => R + 46 * Math.pow(1 - u, 1.6);   // Kugelmitte über dem Boden; u = 0 oben im Dunkel … 1 in der Gasse

const kugel = { x: SHOOT_X, y: SHOOT_Y, vx: 0, vy: 0, z: 'rinne', warte: 1.5, rampe: 0, u: 0, ruhig: 0 };
let zeit = 0;
const cool = {};
const frei = (k, s) => { if ((cool[k] || 0) > zeit) return false; cool[k] = zeit + s; return true; };
const gasse = [0, 0];                 // Rückkehrgassen: bis wann ihre Lampe leuchtet
let rettungBis = 0, zielLicht = 2, zielWechsel = 0;

function collideSeg(x1, y1, x2, y2, rad, rest, svx = 0, svy = 0) {
  const k = kugel, dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  let t = ((k.x - x1) * dx + (k.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  let nx = k.x - cx, ny = k.y - cy;
  const d = Math.hypot(nx, ny);
  if (d >= rad || d === 0) return null;
  nx /= d; ny /= d;
  k.x = cx + nx * rad; k.y = cy + ny * rad;
  const rvx = k.vx - svx * t, rvy = k.vy - svy * t, vn = rvx * nx + rvy * ny;
  if (vn < 0) { const e = weich(rest, vn); k.vx -= (1 + e) * vn * nx; k.vy -= (1 + e) * vn * ny; }
  return { nx, ny, vn };
}
function collideCircle(cx, cy, r, rest) {
  const k = kugel, dx = k.x - cx, dy = k.y - cy, d = Math.hypot(dx, dy), min = r + R;
  if (d >= min || d === 0) return null;
  const nx = dx / d, ny = dy / d;
  k.x = cx + nx * min; k.y = cy + ny * min;
  const vn = k.vx * nx + k.vy * ny;
  if (vn < 0) { const e = weich(rest, vn); k.vx -= (1 + e) * vn * nx; k.vy -= (1 + e) * vn * ny; }
  return { nx, ny, vn };
}
const setze = (x, y, vx, vy) => Object.assign(kugel, { x, y, vx, vy, z: 'feld', ruhig: 0 });
function zurueck() {                  // Kugel kommt aus dem oberen Feld zurück: über eine Drahtrampe, durch die Mitte oder aus einem Umlauf
  const r = Math.random();
  if (r < 0.3) Object.assign(kugel, { z: 'rampe', rampe: 0, u: 0 });
  else if (r < 0.6) Object.assign(kugel, { z: 'rampe', rampe: 1, u: 0 });
  else if (r < 0.8) setze(zufall(150, 240), OBEN + 3, zufall(-70, 70), zufall(80, 220));
  else if (r < 0.9) setze(35, OBEN + 3, 0, 380);
  else setze(345, OBEN + 3, 0, 320);
}
function abschuss() {
  if (kugel.z !== 'rinne') return;
  Object.assign(kugel, { z: 'feld', x: SHOOT_X, y: SHOOT_Y, vx: 0, vy: -1950 });
  rettungBis = zeit + 8; ton.schuss();
}

function schritt(dt) {
  zeit += dt;
  for (const f of flippers) {
    f.prev = tip(f);
    const ziel = f.on ? A_UP : A_REST, maxd = A_SPEED * dt;
    f.a += Math.max(-maxd, Math.min(maxd, ziel - f.a));
  }
  for (const s of slings) s.flash = Math.max(0, s.flash - dt * 8);
  for (const s of [...standups, ...rund]) s.blitz = Math.max(0, s.blitz - dt * 3);
  if (zeit > zielWechsel) { zielLicht = (zielLicht + 1 + Math.floor(Math.random() * 4)) % 5; zielWechsel = zeit + 3; }
  const k = kugel;
  if (k.z === 'oben' || k.z === 'aus') {
    k.warte -= dt;
    if (k.warte <= 0) {
      if (k.z === 'oben') zurueck();
      else Object.assign(k, { z: 'rinne', x: SHOOT_X, y: SHOOT_Y, vx: 0, vy: 0, warte: 1.6 });
    }
    return;
  }
  if (k.z === 'rinne') { if (demo.an && (k.warte -= dt) <= 0) abschuss(); return; }
  if (k.z === 'rampe') {
    k.u += dt / RAMPE_DAUER;
    if (k.u >= 1) { const a = RAMPEN[k.rampe].aus; setze(a.x, a.y, 0, 140); ton.landen(); }
    return;
  }
  // ---- Kugel im Feld ----
  k.vy += G * dt; k.x += k.vx * dt; k.y += k.vy * dt;
  for (const w of walls) {
    const c = collideSeg(w.x1, w.y1, w.x2, w.y2, R + (w.dick || 0), REST_WALL);
    if (!c) continue;
    if (w.kick && -c.vn > 60 && frei('sling' + w.kick.seite, 0.15)) {
      k.vx += c.nx * 420; k.vy += c.ny * 420; w.kick.flash = 1; ton.schleuder(); lampen.blitz('sicher', 0.25);
    } else if (-c.vn > 90) ton.anschlag(Math.min(1, -c.vn / 900));
  }
  for (const p of posts) { const c = collideCircle(p.x, p.y, p.r, REST_WALL); if (c && -c.vn > 90) ton.anschlag(Math.min(1, -c.vn / 900)); }
  standups.forEach((s, i) => {
    const c = collideSeg(s.x, s.y - s.h / 2, s.x, s.y + s.h / 2, R + 2, REST_WALL);
    if (c && -c.vn > 40 && frei('stand' + i, 0.3)) { s.an = true; s.blitz = 1; ton.ziel(Math.min(1, -c.vn / 700)); if (standups.every(x => x.an)) lampen.blitz('kick', 1.5); }
  });
  if (k.x > RUND_X && k.x < RUND_X + R + 6 && k.y > 376 && k.y < 456) rund.forEach((r, i) => {
    const c = collideSeg(r.x, r.y - r.h / 2, r.x, r.y + r.h / 2, R + 2, REST_WALL);
    if (c && -c.vn > 40 && frei('rund', 0.3)) { r.blitz = 1; ton.ziel(Math.min(1, -c.vn / 700)); if (i === zielLicht) lampen.blitz('rund', 1); }
  });
  for (const f of flippers) {
    const t = tip(f), svx = (t.x - f.prev.x) / dt, svy = (t.y - f.prev.y) / dt;
    const c = collideSeg(f.px, f.py, t.x, t.y, R + 7, REST_FLIP, svx, svy);
    if (!c) continue;
    if (f.on && f.a > A_UP + 0.02 && -c.vn > 150 && frei('effet' + f.side, 0.1)) {   // Trefferstelle lenkt (wie 0.67)
      const lx = t.x - f.px, ly = t.y - f.py, u = Math.max(0, Math.min(1, ((k.x - f.px) * lx + (k.y - f.py) * ly) / (lx * lx + ly * ly)));
      const d = -f.side * EFFET * (u - 0.5), cs = Math.cos(d), sn = Math.sin(d), mx = k.vx, my = -k.vy;
      k.vx = mx * cs - my * sn; k.vy = -(mx * sn + my * cs);
    }
    if (-c.vn > 140) ton.flipperTreffer(Math.min(1, -c.vn / 1500));
  }
  [55, 321].forEach((x, i) => { if (Math.abs(k.x - x) < 10 && Math.abs(k.y - 612) < 8 && frei('gasse' + i, 0.6)) { gasse[i] = zeit + 3; ton.ziel(0.4); } });
  // Hängt die Kugel irgendwo fest (nicht auf einem gehaltenen Flipper), bekommt sie einen kleinen Stoß
  const ruht = Math.hypot(k.vx, k.vy) < 8 && !flippers.some(f => f.on);
  k.ruhig = ruht ? k.ruhig + dt : 0;
  if (k.ruhig > 4) { k.vx = zufall(-120, 120); k.vy = -300; k.ruhig = 0; }
  if (k.y < OBEN && k.vy < 0) { k.z = 'oben'; k.warte = zufall(0.45, 1.3); }
  else if (k.y > 785) { k.z = 'aus'; k.warte = 1.4; ton.aus(); }
}

// Demo: spielt selbst, solange niemand tippt (nach 12 s ohne Tipp wieder Demo)
const demo = { an: true, letzterTipp: -99 };
function demoSchritt() {
  demo.an = performance.now() / 1000 - demo.letzterTipp > 12;
  if (!demo.an) return;
  const k = kugel;
  for (const f of flippers) {
    const nah = k.z === 'feld' && k.y > 628 && k.y < f.py + 24 && Math.abs(k.x - (f.px + f.side * 40)) < 36 && k.vy > -60;
    if (nah && !f.on && zeit > f.demoBis) { f.on = true; f.demoAus = zeit + 0.2 + Math.random() * 0.1; ton.flipperAn(); }
    if (f.on && zeit > f.demoAus) { f.on = false; f.demoBis = zeit + 0.3; ton.flipperAus(); }
  }
}

// ======================================================================================================================
// Ton (Web Audio, synthetisch): Spulen, Schleuder, Anschläge, Rollgeräusch nach Tempo, Drahtrampe
// ======================================================================================================================
const ton = (() => {
  let ac = null, master = null, rausch = null, rollG = null, rollF = null;
  function an() {
    if (ac) { if (ac.state !== 'running') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC(); master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    const n = ac.sampleRate * 2; rausch = ac.createBuffer(1, n, ac.sampleRate);
    const d = rausch.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = rausch; s.loop = true;
    rollF = ac.createBiquadFilter(); rollF.type = 'lowpass'; rollF.frequency.value = 400; rollF.Q.value = 0.8;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 60;
    rollG = ac.createGain(); rollG.gain.value = 0;
    s.connect(hp).connect(rollF).connect(rollG).connect(master); s.start();
  }
  // tiefer Schlag (Spule, Holz) + kurzes gefiltertes Rauschen (Mechanik)
  function knall(laut, f0, f1, dauer, rl, rf) {
    if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dauer);
    g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dauer);
    o.connect(g).connect(master); o.start(t); o.stop(t + dauer + 0.02);
    if (!rl) return;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g2 = ac.createGain();
    s.buffer = rausch; f.type = 'bandpass'; f.frequency.value = rf; f.Q.value = 1.1;
    g2.gain.setValueAtTime(rl, t); g2.gain.exponentialRampToValueAtTime(0.0008, t + 0.07);
    s.connect(f).connect(g2).connect(master); s.start(t, Math.random() * 1.5); s.stop(t + 0.09);
  }
  return {
    an,
    flipperAn: () => knall(0.55, 150, 45, 0.09, 0.4, 2400),
    flipperAus: () => knall(0.14, 95, 40, 0.05, 0.12, 1700),
    schleuder: () => knall(0.7, 130, 40, 0.13, 0.55, 2000),
    anschlag: s => knall(0.1 * s, 800, 260, 0.03, 0.3 * s, 3200),
    ziel: s => knall(0.22 * s, 420, 120, 0.05, 0.35 * s, 2600),
    flipperTreffer: s => knall(0.3 * s, 220, 70, 0.06, 0.2 * s, 1400),
    landen: () => knall(0.18, 300, 90, 0.05, 0.3, 2200),
    aus: () => knall(0.4, 70, 28, 0.3, 0.12, 380),
    schuss: () => knall(0.45, 200, 50, 0.16, 0.45, 1100),
    rollen(v, art) {                   // art: 'feld' (Holz, tief), 'draht' (Drahtrampe, hell), sonst still
      if (!ac) return;
      const z = art ? Math.min(1, v / 1000) : 0, t = ac.currentTime;
      rollG.gain.setTargetAtTime((art === 'draht' ? 0.5 : 0.32) * z * Math.sqrt(z), t, 0.04);
      rollF.frequency.setTargetAtTime(art === 'draht' ? 2600 : 220 + 520 * z, t, 0.05);
    },
  };
})();

// ======================================================================================================================
// Grafik: Renderer, Szene, Kamera
// ======================================================================================================================
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;        // Schatten einmal je Bild (nicht für Spiegel- und Würfelbilder)
document.body.prepend(renderer.domElement);
const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
const TYP = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 800, 1200);
const camera = new THREE.PerspectiveCamera(38, 1, 5, 4000);
// Ebenen: 0 = normal (auch im Bodenspiegel), 1 = in der Kugel-Spiegelung, 2 = nur Hauptbild (flache Teile auf dem Boden)
camera.layers.enable(2);
const ebene = (o, ...n) => { o.layers.set(n[0]); for (const e of n.slice(1)) o.layers.enable(e); return o; };

// Umgebung für Metall: dunkler Raum, warme Lampenstreifen, kühles Raumlicht von oben
{
  const env = new THREE.Scene(); env.background = new THREE.Color(0x0b0d12);
  const panel = (w, h, farbe, st, x, y, z, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(farbe).multiplyScalar(st), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m);
  };
  panel(10, 1.4, 0xfff0dc, 5, 0, 6, -1, PI / 2);
  panel(2, 5, 0xffc890, 3, -6, 1, 2, 0, PI / 2);
  panel(2, 5, 0xffc890, 3, 6, 1, 2, 0, -PI / 2);
  panel(8, 3, 0x9fb6ff, 1.5, 0, 3, -7);
  panel(30, 30, 0x120c08, 1, 0, -2, 0, PI / 2);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0.03).texture;
}

// ---------- Materialien ----------
const M = {
  chrom: new THREE.MeshStandardMaterial({ color: 0xeef2f6, metalness: 1, roughness: 0.1 }),
  stahl: new THREE.MeshStandardMaterial({ color: 0xbfc8d2, metalness: 1, roughness: 0.34 }),
  gummiS: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.5 }),
  gummiW: new THREE.MeshStandardMaterial({ color: 0xf0ece2, roughness: 0.45 }),
  gummiR: new THREE.MeshStandardMaterial({ color: 0xb51b28, roughness: 0.45 }),
  weiss: new THREE.MeshPhysicalMaterial({ color: 0xf3efe6, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
  holz: new THREE.MeshStandardMaterial({ color: 0x17120f, roughness: 0.55, metalness: 0.1 }),
  schwarz: new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.4, metalness: 0.3 }),
};

// ======================================================================================================================
// Einsätze (Lampen unter durchsichtigem Kunststoff) – Lage und Farben wie in index.html, unteres Feld
// ======================================================================================================================
const FARBE = { rot: '#ff3040', gelb: '#ffd23a', gruen: '#2fe07a', weiss: '#eaf4ff', amber: '#ff9a2e', blau: '#46b0ff' };
const lampDef = [];
const L = o => lampDef.push(Object.assign({ k: 0 }, o));
['SEC. PASS', 'HOLD BONUS', 'LITE LANES', 'MULTIBALL', 'EXTRA BALL', '10 MILLION'].forEach((t, k) =>
  L({ form: 'rechteck', x: 84, y: 556 - k * 18.5, w: 56, h: 13, farbe: 'rot', label: t, gruppe: 'leiter', k }));
['250K', '500K', '1M', '3M', '5M'].forEach((t, k) =>
  L({ form: 'rechteck', x: 294, y: 552 - k * 24, w: 52, h: 16, farbe: 'rot', label: t, gruppe: 'wert', k }));
['CHECK', 'CODE', 'ALARM', 'KEY', 'CPU'].forEach((t, k) => {
  L({ form: 'kreis', x: 130, y: 548 - k * 22, r: 9, farbe: 'amber', label: t, gruppe: 'sicher', sonne: true, k });
  L({ form: 'kreis', x: 246, y: 548 - k * 22, r: 9, farbe: 'amber', label: t, gruppe: 'sicher', sonne: true, k: k + 0.5 });
});
[['2X', 'gruen'], ['4X', 'gruen'], ['HOLD', 'gelb'], ['6X', 'gruen'], ['8X', 'gruen']].forEach(([t, f], k) => {
  const a0 = PI * 1.2 + k * PI * 0.12;
  L({ form: 'keil', x: 188, y: 668, r0: 30, r1: 61, a0, a1: a0 + PI * 0.105, farbe: f, label: t, gruppe: 'fach', k });
});
L({ form: 'rechteck', x: 188, y: 684, w: 42, h: 11, farbe: 'rot', label: 'RESCUE', gruppe: 'rettung' });
L({ form: 'kreis', x: 188, y: 711, r: 8, farbe: 'amber', label: 'AGAIN', gruppe: 'again' });
[55, 321].forEach((x, k) => L({ form: 'kreis', x, y: 612, r: 5.5, farbe: 'weiss', gruppe: 'gasse', k }));
[0, 1, 2].forEach(k => L({ form: 'kreis', x: 350, y: 596 + k * 11, r: 4.2, farbe: 'amber', gruppe: 'kick', k }));
L({ form: 'rechteck', x: 350, y: 640, w: 22, h: 9, farbe: 'rot', label: 'KICK', gruppe: 'kickR' });
standups.forEach((s, k) => L({ form: 'pfeil', x: 340, y: s.y, w: 11, h: 12, dir: 0, farbe: 'amber', gruppe: 'stand', k }));
rund.forEach((r, k) => L({ form: 'trapez', x: 81, y: r.y, w: 15, h: 6, farbe: 'gelb', gruppe: 'rund', k }));
[[156, 462], [156, 438]].forEach(([x, y], k) => L({ form: 'pfeil', x, y, w: 15, h: 16, dir: -PI / 2, farbe: 'weiss', gruppe: 'rampeL', k }));
[[278, 452], [278, 428]].forEach(([x, y], k) => L({ form: 'pfeil', x, y, w: 15, h: 16, dir: -PI / 2, farbe: 'gelb', gruppe: 'rampeR', k }));
L({ form: 'rechteck', x: 218, y: 418, w: 42, h: 11, farbe: 'rot', label: 'JACKPOT', gruppe: 'jackpot' });
L({ form: 'pfeil', x: 313, y: 425, w: 15, h: 20, dir: -PI / 2, farbe: 'weiss', label: 'HURRY', gruppe: 'hurry' });
L({ form: 'pfeil', x: 35, y: 420, w: 15, h: 17, dir: -PI / 2, farbe: 'amber', gruppe: 'orbit' });
L({ form: 'pfeil', x: 35, y: 446, w: 13, h: 15, dir: -PI / 2, farbe: 'gruen', gruppe: 'orbit', k: 1 });
L({ form: 'rechteck', x: 117, y: 380, w: 40, h: 10, farbe: 'gruen', label: 'LOAD GUN', gruppe: 'gun' });

function einsatzPunkte(l) {           // Umriss als Vieleck in Tischkoordinaten
  const p = [];
  if (l.form === 'kreis') for (let i = 0; i < 32; i++) { const a = i / 32 * 2 * PI; p.push([l.x + Math.cos(a) * l.r, l.y + Math.sin(a) * l.r]); }
  else if (l.form === 'keil') {
    for (let i = 0; i <= 10; i++) { const a = l.a0 + (l.a1 - l.a0) * i / 10; p.push([l.x + Math.cos(a) * l.r1, l.y + Math.sin(a) * l.r1]); }
    for (let i = 10; i >= 0; i--) { const a = l.a0 + (l.a1 - l.a0) * i / 10; p.push([l.x + Math.cos(a) * l.r0, l.y + Math.sin(a) * l.r0]); }
  } else if (l.form === 'pfeil') {
    const c = Math.cos(l.dir), s = Math.sin(l.dir);
    for (const [u, v] of [[0.5 * l.h, 0], [-0.5 * l.h, 0.5 * l.w], [-0.2 * l.h, 0], [-0.5 * l.h, -0.5 * l.w]]) p.push([l.x + u * c - v * s, l.y + u * s + v * c]);
  } else if (l.form === 'trapez') {
    p.push([l.x - l.w / 2, l.y + l.h / 2], [l.x + l.w / 2, l.y + l.h / 2], [l.x + l.w * 0.3, l.y - l.h / 2], [l.x - l.w * 0.3, l.y - l.h / 2]);
  } else {                             // Rechteck mit runden Ecken
    const r = Math.min(2.6, l.h / 3), x0 = l.x - l.w / 2, x1 = l.x + l.w / 2, y0 = l.y - l.h / 2, y1 = l.y + l.h / 2;
    for (const [cx, cy, a0] of [[x1 - r, y0 + r, -PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, PI / 2], [x0 + r, y0 + r, PI]])
      for (let i = 0; i <= 4; i++) { const a = a0 + i / 4 * PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  }
  return p;
}
const mitte = l => l.form === 'keil'
  ? [l.x + Math.cos((l.a0 + l.a1) / 2) * (l.r0 + l.r1) / 2, l.y + Math.sin((l.a0 + l.a1) / 2) * (l.r0 + l.r1) / 2] : [l.x, l.y];
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ======================================================================================================================
// Druckbilder (einmal gezeichnet, kein Hochladen je Bild)
// ======================================================================================================================
const ladeBild = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const [strudelBild, schleuderBild] = await Promise.all([ladeBild('strudel.png'), ladeBild('bilder/eingang/schleuder_v1.png')]);
const SCHRIFT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

// Spielfeld-Druck: x 0…400, y 360…760 bei 4 Pixel je Einheit
const FELD_Y0 = 360, FELD_S = 4;
function baueSpielfeld() {
  const c = document.createElement('canvas'); c.width = 400 * FELD_S; c.height = 400 * FELD_S;
  const g = c.getContext('2d');
  g.setTransform(FELD_S, 0, 0, FELD_S, 0, -FELD_Y0 * FELD_S);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Grund: tiefes Nachtblau, unten in warmes Rot übergehend (gedruckte Farbe, kein Licht)
  const gr = g.createLinearGradient(0, FELD_Y0, 0, 760);
  gr.addColorStop(0, '#060a18'); gr.addColorStop(0.45, '#0b1534'); gr.addColorStop(0.8, '#1a0d24'); gr.addColorStop(1, '#2a0c10');
  g.fillStyle = gr; g.fillRect(0, FELD_Y0, 400, 400);
  const rot = g.createRadialGradient(188, 760, 10, 188, 760, 270);
  rot.addColorStop(0, 'rgba(190,40,12,.7)'); rot.addColorStop(0.5, 'rgba(120,20,10,.35)'); rot.addColorStop(1, 'rgba(60,0,0,0)');
  g.fillStyle = rot; g.fillRect(0, FELD_Y0, 400, 400);
  // Strahlenkranz hinter dem Bonus-Fächer
  g.save(); g.translate(188, 668);
  for (let i = 0; i < 36; i++) {
    g.rotate(PI / 18); g.fillStyle = i % 2 ? 'rgba(255,170,60,.10)' : 'rgba(0,0,0,.12)';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(150, -13); g.lineTo(150, 13); g.closePath(); g.fill();
  }
  g.restore();
  // Leiterbahnen in Kupfer/Gold mit Lötpunkten
  for (let i = 0; i < 110; i++) {
    let x = rnd() * 400, y = FELD_Y0 + 10 + rnd() * 380;
    g.strokeStyle = `rgba(${200 + rnd() * 40 | 0},${140 + rnd() * 40 | 0},60,${0.25 + rnd() * 0.25})`; g.lineWidth = 0.7 + rnd() * 0.8;
    g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      const l = 8 + rnd() * 30, r = rnd();
      if (r < 0.35) x += l; else if (r < 0.6) y += l; else if (r < 0.8) { x += l * 0.7; y += l * 0.7; } else { x -= l * 0.7; y += l * 0.7; }
      g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(x, y, 1.5, 0, 2 * PI); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 0.4; g.stroke();
  }
  // Uhr (Zero Time) mit gedrucktem Strudel aus dem Kopfbild
  g.save(); g.translate(188, 500);
  g.fillStyle = '#05060a'; g.beginPath(); g.arc(0, 0, 47, 0, 2 * PI); g.fill();
  if (strudelBild) { g.save(); g.beginPath(); g.arc(0, 0, 37, 0, 2 * PI); g.clip(); g.globalAlpha = 0.85; g.drawImage(strudelBild, -40, -40, 80, 80); g.restore(); }
  const ring = g.createLinearGradient(-47, -47, 47, 47);
  ring.addColorStop(0, '#f3f6fa'); ring.addColorStop(0.35, '#8a96a4'); ring.addColorStop(0.6, '#e2e8ef'); ring.addColorStop(1, '#5d6874');
  g.strokeStyle = ring; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 43, 0, 2 * PI); g.stroke();
  g.font = `700 6px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2e6cc';
  ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((t, k) => {
    const a = k / 12 * 2 * PI - PI / 2; g.fillText(t, Math.cos(a) * 33, Math.sin(a) * 33);
  });
  g.strokeStyle = '#f2e6cc'; g.lineCap = 'round';
  g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(-PI / 2 - 0.1) * 20, Math.sin(-PI / 2 - 0.1) * 20); g.stroke();
  g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(-PI / 2 - 0.52) * 29, Math.sin(-PI / 2 - 0.52) * 29); g.stroke();
  g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(0, 0, 2.5, 0, 2 * PI); g.fill();
  g.restore();
  // Schriftzug
  g.save(); g.translate(188, 590); g.font = `900 15px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 2.4; g.strokeStyle = '#1a0500'; g.strokeText('ZERO TIME', 0, 0);
  const sg = g.createLinearGradient(0, -8, 0, 8); sg.addColorStop(0, '#ffe08a'); sg.addColorStop(0.5, '#ff8a1e'); sg.addColorStop(1, '#c2280c');
  g.fillStyle = sg; g.fillText('ZERO TIME', 0, 0); g.restore();
  // Gassen: Pfeile und Beschriftung
  g.fillStyle = 'rgba(240,240,240,.75)';
  for (const x of [55, 321]) for (const y of [588, 596]) { g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.lineTo(x, y + 5); g.closePath(); g.fill(); }
  g.save(); g.translate(350, 700); g.rotate(-PI / 2); g.font = `700 6.5px ${SCHRIFT}`; g.textAlign = 'center'; g.fillStyle = 'rgba(255,200,120,.75)';
  g.fillText('SPECIAL', 0, 2); g.restore();
  g.save(); g.translate(26, 520); g.rotate(-PI / 2); g.font = `700 6px ${SCHRIFT}`; g.textAlign = 'center'; g.fillStyle = 'rgba(200,220,255,.55)';
  g.fillText('FLUCHTWEG', 0, 2); g.restore();
  // Fassungen der Einsätze: schwarzer Rand, feiner heller Ring; CPU-Lampen mit gedrucktem Strahlenkranz
  for (const l of lampDef) {
    const pk = einsatzPunkte(l), [mx, my] = mitte(l);
    if (l.sonne) {
      g.save(); g.translate(mx, my); g.strokeStyle = 'rgba(255,150,60,.45)'; g.lineWidth = 0.8;
      for (let a = 0; a < 2 * PI; a += PI / 8) { g.beginPath(); g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a) * 14.5, Math.sin(a) * 14.5); g.stroke(); }
      g.restore();
    }
    g.beginPath(); pk.forEach(([x, y], i) => { const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy) || 1, e = (d + 2.2) / d; i ? g.lineTo(mx + dx * e, my + dy * e) : g.moveTo(mx + dx * e, my + dy * e); });
    g.closePath(); g.fillStyle = 'rgba(0,0,0,.92)'; g.fill();
    g.strokeStyle = `rgba(${rgb(FARBE[l.farbe]).join(',')},.55)`; g.lineWidth = 0.7; g.stroke();
  }
  // Abnutzung: helle Bögen, wo die Kugel oft rollt (über den Flippern, in den Gassen)
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 26; i++) {
    const x = 120 + rnd() * 140, r = 40 + rnd() * 90;
    g.strokeStyle = `rgba(255,255,255,${0.015 + rnd() * 0.02})`; g.lineWidth = 2 + rnd() * 5;
    g.beginPath(); g.arc(x, 700, r, PI * 1.15, PI * 1.85); g.stroke();
  }
  // Druckkorn
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 9000; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; g.fillRect(rnd() * 400, FELD_Y0 + rnd() * 400, 0.35, 0.35); }
  return c;
}

function einsatzTexturen(l) {          // Grund (unbeleuchtet: getönter Kunststoff, Fassung der Lampe sichtbar) und Glut (beleuchtet)
  const pk = einsatzPunkte(l), xs = pk.map(p => p[0]), ys = pk.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), S = 9;
  const w = Math.max(8, Math.ceil((x1 - x0) * S)), h = Math.max(8, Math.ceil((y1 - y0) * S));
  const [r, gg, b] = rgb(FARBE[l.farbe]), [mx, my] = mitte(l);
  const mache = glut => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, -x0 * S, -y0 * S);
    const rad = Math.max(x1 - x0, y1 - y0) * 0.62;
    const q = g.createRadialGradient(mx, my, 0, mx, my, rad);
    if (glut) {
      q.addColorStop(0, `rgb(${Math.min(255, r + 150)},${Math.min(255, gg + 150)},${Math.min(255, b + 150)})`);
      q.addColorStop(0.35, FARBE[l.farbe]); q.addColorStop(1, `rgb(${r * 0.35 | 0},${gg * 0.35 | 0},${b * 0.35 | 0})`);
    } else {
      q.addColorStop(0, `rgb(${r * 0.5 | 0},${gg * 0.5 | 0},${b * 0.5 | 0})`); q.addColorStop(1, `rgb(${r * 0.2 | 0},${gg * 0.2 | 0},${b * 0.2 | 0})`);
    }
    g.fillStyle = q; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (!glut) {                       // Fassung der Glühlampe schimmert durch
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.6; g.beginPath(); g.arc(mx, my, Math.min(3.2, rad * 0.4), 0, 2 * PI); g.stroke();
    }
    if (l.label) {
      const fs = l.form === 'keil' ? 6.4 : l.form === 'kreis' ? Math.min(4.6, l.r * 0.55) : Math.min(6.6, l.h * 0.5);
      g.font = `900 ${fs}px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = glut ? 'rgba(20,6,0,.9)' : 'rgba(255,245,230,.72)';
      g.fillText(l.label, mx, my + 0.3, (l.w || (l.r || 20) * 1.8) * 0.92);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t;
  };
  return { grund: mache(false), glut: mache(true), x0, x1, y0, y1 };
}

function baueSchuerze() {              // bedrucktes Metall mit Regelkarten
  const c = document.createElement('canvas'); c.width = 1408; c.height = 168;
  const g = c.getContext('2d'); g.scale(4, 4);
  const v = g.createLinearGradient(0, 0, 0, 42); v.addColorStop(0, '#3a3f48'); v.addColorStop(0.15, '#23262c'); v.addColorStop(1, '#14161a');
  g.fillStyle = v; g.fillRect(0, 0, 352, 42);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(0, Math.random() * 42, 352, 0.3); }
  const karte = (x, titel, zeilen) => {
    g.fillStyle = '#f2ede1'; g.fillRect(x, 10, 78, 28); g.strokeStyle = '#8a8f96'; g.lineWidth = 0.8; g.strokeRect(x - 1, 9, 80, 30);
    g.fillStyle = '#b3201c'; g.font = `900 4.6px ${SCHRIFT}`; g.textAlign = 'center'; g.fillText(titel, x + 39, 16);
    g.fillStyle = '#222'; g.font = '600 3.2px system-ui, sans-serif';
    zeilen.forEach((z, i) => g.fillText(z, x + 39, 21.5 + i * 4.2));
  };
  karte(16, 'ZERO TIME · REGELN', ['Rampen füllen die Säulen', 'Klappziel öffnet den Schädel', 'Kanone trifft = Multiball', 'Leiter kassieren im Umlauf']);
  karte(258, 'FREISPIEL', ['bei 50.000.000 Punkten', 'Extra Ball bei Alarm 5', 'Rekord gilt auf diesem Gerät', '1 Spiel = 3 Kugeln']);
  g.font = `900 10px ${SCHRIFT}`; g.textAlign = 'center';
  const sg = g.createLinearGradient(0, 18, 0, 30); sg.addColorStop(0, '#ffd27a'); sg.addColorStop(1, '#d2350f');
  g.fillStyle = sg; g.fillText('ZERO TIME', 176, 28);
  for (const x of [6, 106, 246, 346]) {                // Schrauben
    g.fillStyle = '#9aa3ad'; g.beginPath(); g.arc(x, 21, 2.2, 0, 2 * PI); g.fill();
    g.strokeStyle = '#3a3f46'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 1.4, 21); g.lineTo(x + 1.4, 21); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t;
}
function baueSeitenwand() {            // Innenseite des Gehäuses: dunkel mit roten Streifen
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 128); v.addColorStop(0, '#120c10'); v.addColorStop(1, '#050406'); g.fillStyle = v; g.fillRect(0, 0, 1024, 128);
  for (let x = -128; x < 1024; x += 64) { g.fillStyle = 'rgba(200,40,20,.22)'; g.beginPath(); g.moveTo(x, 128); g.lineTo(x + 24, 128); g.lineTo(x + 104, 0); g.lineTo(x + 80, 0); g.fill(); }
  g.fillStyle = 'rgba(255,140,60,.18)'; g.font = `900 40px ${SCHRIFT}`; g.fillText('ZERO TIME', 380, 80);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.3, 'rgba(255,255,255,.45)'); q.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const fleckTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(0,0,0,.9)'); q.addColorStop(0.4, 'rgba(0,0,0,.5)'); q.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();

// ======================================================================================================================
// Szene bauen
// ======================================================================================================================
// ---------- Lackboden mit Spiegelung ----------
const feldTex = new THREE.CanvasTexture(baueSpielfeld());
feldTex.colorSpace = THREE.SRGBColorSpace; feldTex.anisotropy = ANISO;
const spiegelZiel = new THREE.WebGLRenderTarget(1, 1, { type: TYP });
const spiegelMatrix = new THREE.Matrix4();
const spiegelStaerke = { value: 1.7 };
const testSchalter = { ohneSpiegel: false };
const bodenMat = new THREE.MeshPhysicalMaterial({ map: feldTex, roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
bodenMat.onBeforeCompile = sh => {
  sh.uniforms.tSpiegel = { value: spiegelZiel.texture }; sh.uniforms.uSpiegelM = { value: spiegelMatrix }; sh.uniforms.uSpiegel = spiegelStaerke;
  sh.vertexShader = 'uniform mat4 uSpiegelM;\nvarying vec4 vSpiegelUv;\n' +
    sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n\tvSpiegelUv = uSpiegelM * vec4( position, 1.0 );');
  // Lack spiegelt nach Fresnel: steil kaum, flach stark (Klarlack F0 ≈ 0,04)
  // Punktlampen spiegeln sich im Lack nur gedämpft (echte Lampen sind Flächen; als Punkt gäbe es grelle Flecken vor den Flippern)
  sh.fragmentShader = 'uniform sampler2D tSpiegel;\nuniform float uSpiegel;\nvarying vec4 vSpiegelUv;\n' +
    sh.fragmentShader.replace('( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat',
      '( clearcoatSpecularDirect * 0.12 + clearcoatSpecularIndirect ) * material.clearcoat').replace('#include <opaque_fragment>', `{
      float fr = 0.04 + 0.96 * pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 5.0 );
      outgoingLight += texture2DProj( tSpiegel, vSpiegelUv ).rgb * uSpiegel * fr;
    }
    #include <opaque_fragment>`);
};
const boden = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), bodenMat);
boden.rotation.x = -PI / 2; boden.position.copy(P(200, FELD_Y0 + 200)); boden.receiveShadow = true;
ebene(boden, 0, 1);                    // im Kugelspiegel ja, im eigenen Spiegel nicht (wird beim Spiegeln versteckt)
scene.add(boden);
// Dunkle Fläche unter dem Ganzen und ins obere Feld hinein (verschwindet im Nebel)
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.6 }));
  m.rotation.x = -PI / 2; m.position.set(0, -0.6, -300); scene.add(m); }

// ---------- Einsätze ----------
const lampen = (() => {
  const liste = [];
  for (const l of lampDef) {
    const tx = einsatzTexturen(l), pk = einsatzPunkte(l);
    const sh = new THREE.Shape(pk.map(([x, y]) => new THREE.Vector2(x - 200, 380 - y)));
    const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-PI / 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + 200, y = pos.getZ(i) + 380;
      uv.setXY(i, (x - tx.x0) / (tx.x1 - tx.x0), 1 - (y - tx.y0) / (tx.y1 - tx.y0));
    }
    const mat = new THREE.MeshPhysicalMaterial({ map: tx.grund, emissive: 0xffffff, emissiveMap: tx.glut, emissiveIntensity: 0,
      roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04 });
    const m = new THREE.Mesh(geo, mat); m.position.y = 0.08; m.receiveShadow = true;
    ebene(m, 2, 1); scene.add(m);
    liste.push({ l, mat, i: 0, ziel: 0, blitzBis: 0, farbe: new THREE.Color(FARBE[l.farbe]), groesse: Math.max(tx.x1 - tx.x0, tx.y1 - tx.y0) });
  }
  // Lichtschein der Einsätze auf dem Lack (alle in einem Zeichenaufruf, Farbe je Bild nach Helligkeit)
  const n = liste.length, pos = new Float32Array(n * 12), farb = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = [];
  liste.forEach((e, k) => {
    const [mx, my] = mitte(e.l), s = e.groesse * 1.5;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], j) => {
      pos.set([mx - 200 + a * s, 0.2, my - 380 + b * s], k * 12 + j * 3); uv.set([(a + 1) / 2, (b + 1) / 2], k * 8 + j * 2);
    });
    idx.push(k * 4, k * 4 + 2, k * 4 + 1, k * 4, k * 4 + 3, k * 4 + 2);
  });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const farbAttr = new THREE.BufferAttribute(farb, 3); sg.setAttribute('color', farbAttr); sg.setIndex(idx);
  const schein = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  ebene(schein, 2); scene.add(schein);
  const blitze = {};
  return {
    liste,
    blitz(gruppe, sek) { blitze[gruppe] = performance.now() / 1000 + sek; },
    schritt(dt) {
      const t = zeit, jetzt = performance.now() / 1000, blink = f => Math.floor(t * f * 2) % 2;
      for (const e of liste) {
        const { gruppe, k } = e.l;
        let z = 0;
        if (gruppe === 'leiter') z = Math.floor(t * 3) % 9 >= k + 1 ? 1 : 0;
        else if (gruppe === 'wert') z = k === 1 ? 1 : k === 2 ? blink(2) : 0;
        else if (gruppe === 'sicher') z = Math.floor(t * 6) % 6 === Math.floor(k) ? 1 : (k < 2 ? 1 : 0);
        else if (gruppe === 'fach') z = Math.floor(t * 4) % 8 === k ? 1 : (k === 0 ? 1 : 0);
        else if (gruppe === 'rettung') z = zeit < rettungBis ? (rettungBis - zeit < 2 ? blink(4) : 1) : 0;
        else if (gruppe === 'again') z = blink(0.5);
        else if (gruppe === 'gasse') z = zeit < gasse[k] ? 1 : 0;
        else if (gruppe === 'kick') z = standups[k].an ? 1 : 0;
        else if (gruppe === 'kickR') z = standups.every(s => s.an) ? blink(2) : 0;
        else if (gruppe === 'stand') z = standups[k].an ? 1 : blink(1.5);
        else if (gruppe === 'rund') z = k === zielLicht ? 1 : 0;
        else if (gruppe === 'rampeL' || gruppe === 'rampeR') z = (Math.floor(t * 5) + (1 - k)) % 3 === 0 ? 1 : 0;
        else if (gruppe === 'hurry' || gruppe === 'jackpot') z = 0;
        else if (gruppe === 'orbit') z = k ? blink(1) : 1;
        else if (gruppe === 'gun') z = blink(0.8);
        if ((blitze[gruppe] || 0) > jetzt) z = blink(6);
        e.ziel = z;
        // Glühlampe: geht schnell an (≈ 30 ms), langsamer aus (≈ 80 ms)
        const tau = e.ziel > e.i ? 0.03 : 0.08;
        e.i += (e.ziel - e.i) * (1 - Math.exp(-dt / tau));
        e.mat.emissiveIntensity = 2.6 * e.i;
      }
      liste.forEach((e, k) => { const c = e.farbe, s = 0.32 * e.i; for (let j = 0; j < 4; j++) farbAttr.setXYZ(k * 4 + j, c.r * s, c.g * s, c.b * s); });
      farbAttr.needsUpdate = true;
      if (standups.every(s => s.an) && Math.floor(t) % 6 === 5) standups.forEach(s => { s.an = false; });
    },
  };
})();

// ---------- Gehäuse: Seitenwände mit Druck, Chromschienen oben, Verriegelungsleiste vorn ----------
{
  const wandTex = baueSeitenwand();
  const wandMat = new THREE.MeshStandardMaterial({ map: wandTex, roughness: 0.5 });
  // Seitenwände 46 hoch, oben eine schmale polierte Schiene; vorn nur eine niedrige Kante mit der Verriegelungsleiste (Flipper bleiben sichtbar)
  const schieneMat = new THREE.MeshStandardMaterial({ color: 0xc9d1da, metalness: 1, roughness: 0.22 });
  for (const [x0, x1, innen] of [[-10, 12, 12], [392, 414, 392]]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 46, 470), M.holz);
    box.position.copy(P((x0 + x1) / 2, 560, 23)); box.receiveShadow = true; scene.add(ebene(box, 0, 1));
    const innenseite = new THREE.Mesh(new THREE.PlaneGeometry(470, 46), wandMat);
    innenseite.position.copy(P(innen + (innen < 200 ? 0.05 : -0.05), 560, 23)); innenseite.rotation.y = innen < 200 ? PI / 2 : -PI / 2;
    innenseite.receiveShadow = true; scene.add(ebene(innenseite, 0, 1));
    const schiene = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 470, 14), schieneMat);
    schiene.rotation.x = PI / 2; schiene.position.copy(P(innen + (innen < 200 ? -4 : 4), 560, 47)); scene.add(ebene(schiene, 0, 1));
  }
  const vorn = new THREE.Mesh(new THREE.BoxGeometry(424, 20, 26), M.holz); vorn.position.copy(P(202, 775, 10)); scene.add(ebene(vorn, 0, 1));
  const leiste = new THREE.Mesh(new THREE.BoxGeometry(428, 4, 20), schieneMat); leiste.position.copy(P(202, 775, 22)); scene.add(ebene(leiste, 0, 1));
  // Trennwand der Abschussrinne (Holz) und Kolben
  const rinne = new THREE.Mesh(new THREE.BoxGeometry(4, 20, 432), M.holz); rinne.position.copy(P(LANE_X, 546, 10)); rinne.castShadow = true; scene.add(ebene(rinne, 0, 1));
  const kolben = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 22, 16), M.chrom); kolben.rotation.x = PI / 2; kolben.position.copy(P(SHOOT_X, 765, 6)); scene.add(kolben);
  const kopf = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 4, 20), M.gummiS); kopf.rotation.x = PI / 2; kopf.position.copy(P(SHOOT_X, 756, 6)); scene.add(kopf);
}

// ---------- Schürze ----------
{
  const tex = baueSchuerze();
  const koerper = new THREE.Mesh(new THREE.BoxGeometry(352, 6, 38), M.schwarz); koerper.position.copy(P(188, 743, 3)); koerper.castShadow = true; scene.add(ebene(koerper, 0, 1));
  const druck = new THREE.Mesh(new THREE.PlaneGeometry(352, 38), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, metalness: 0.6, clearcoat: 0.6 }));
  druck.rotation.x = -PI / 2; druck.position.copy(P(188, 743, 6.05)); druck.receiveShadow = true; scene.add(ebene(druck, 0, 1));
  const kante = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 352, 12), M.stahl); kante.rotation.z = PI / 2; kante.position.copy(P(188, 724, 5)); scene.add(kante);
}

// ---------- Führungen aus Stahlblech mit Rollkante, Pfosten mit Gummiring an freien Enden ----------
const fuehrungen = walls.filter(w => !w.aussen && !w.rinne && !w.schleuder);
{
  const blech = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.stahl, fuehrungen.length);
  const rolle = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10), M.chrom, fuehrungen.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
  fuehrungen.forEach((w, i) => {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, l = Math.hypot(dx, dy), mx = (w.x1 + w.x2) / 2, my = (w.y1 + w.y2) / 2;
    e.set(0, -Math.atan2(dy, dx), 0); q.setFromEuler(e);
    blech.setMatrixAt(i, m.compose(P(mx, my, 7), q, s.set(l, 14, 2.2)));
    e.set(0, -Math.atan2(dy, dx), PI / 2); q.setFromEuler(e);
    rolle.setMatrixAt(i, m.compose(P(mx, my, 14), q, s.set(1.5, l, 1.5)));
  });
  blech.castShadow = true; blech.receiveShadow = true; rolle.castShadow = true;
  scene.add(ebene(blech, 0, 1), ebene(rolle, 0, 1));
  const n = new Map(), key = (x, y) => Math.round(x) + ',' + Math.round(y);
  for (const w of fuehrungen) for (const [x, y] of [[w.x1, w.y1], [w.x2, w.y2]]) { const k = key(x, y); if (!n.has(k)) n.set(k, { x, y, c: 0 }); n.get(k).c++; }
  const enden = [];                   // freie Enden; dicht beieinander nur ein Pfosten, nicht unter den Flippern
  for (const p of n.values()) if (p.c === 1 && p.y > OBEN - 2 && p.x > 14 && p.x < 390 && !enden.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 8)
    && !flippers.some(f => Math.hypot(f.px - p.x, f.py - p.y) < 14)) enden.push(p);
  for (const p of [...enden, ...posts]) pfosten(p.x, p.y, p.r ? 'chrom' : 'gummi');
}
function pfosten(x, y, art) {          // Metallpfosten mit Mutter oben, Gummiring auf Kugelhöhe
  const g = new THREE.Group(); g.position.copy(P(x, y));
  const st = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 22, 16), M.chrom); st.position.y = 11; st.castShadow = true;
  const mutter = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 2.4, 6), M.chrom); mutter.position.y = 23;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.9, art === 'gummi' ? 1.7 : 0.9, 10, 24), art === 'gummi' ? M.gummiS : M.chrom);
  ring.rotation.x = PI / 2; ring.position.y = 9; ring.castShadow = true;
  g.add(st, mutter, ring); scene.add(g);
  ebene(st, 0, 1);                     // in der Kugel-Spiegelung nur der Pfosten (Kleinteile kosten nur Zeichenaufrufe)
}

// ---------- Schleudern: Gummiring um drei Pfosten, darüber der bedruckte Kunststoff mit Glühlampe darunter ----------
const schleuderTex = schleuderBild ? new THREE.Texture(schleuderBild) : null;
if (schleuderTex) { schleuderTex.colorSpace = THREE.SRGBColorSpace; schleuderTex.anisotropy = ANISO; schleuderTex.needsUpdate = true; }
const SCHLEUDER_BILD = [[150, 145], [148, 940], [622, 1228]];     // Pfosten/Muttern im Bild ↔ Ecken der linken Schleuder
const schleudern = slings.map(sl => {
  const g = new THREE.Group(), pk = sl.pts;
  const cx = (pk[0][0] + pk[1][0] + pk[2][0]) / 3, cy = (pk[0][1] + pk[1][1] + pk[2][1]) / 3;
  for (const [x, y] of pk) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.6, 26, 18), M.chrom); p.position.copy(P(x, y, 13)); p.castShadow = true; g.add(p);
    const mu = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 3, 6), M.chrom); mu.position.copy(P(x, y, 29.5)); g.add(mu);
  }
  // Gummiring: drei Stränge außen an den Pfosten, die Schlagseite wölbt sich beim Schlag
  const RP = 3.6, RG = 2.0, HG = 9, oben = new THREE.Vector3(0, 1, 0);
  let bogen = null;
  for (let i = 0; i < 3; i++) {
    const a = pk[i], b = pk[(i + 1) % 3], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    let nx = -dy / l, ny = dx / l; if ((cx - a[0]) * nx + (cy - a[1]) * ny > 0) { nx = -nx; ny = -ny; }
    const A = [a[0] + nx * RP, a[1] + ny * RP], B = [b[0] + nx * RP, b[1] + ny * RP];
    const teile = (i === 2 ? [0, 1] : [0]).map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(RG, RG, 1, 12), M.gummiW); m.castShadow = true; g.add(m); return m; });
    const lege = d => {
      const Mi = [(A[0] + B[0]) / 2 + nx * d, (A[1] + B[1]) / 2 + ny * d];
      const stuecke = teile.length === 2 ? [[A, Mi], [Mi, B]] : [[A, B]];
      stuecke.forEach(([u, v], k) => {
        const p0 = P(u[0], u[1], HG), p1 = P(v[0], v[1], HG), dir = p1.clone().sub(p0), len = dir.length();
        teile[k].position.copy(p0).addScaledVector(dir, 0.5); teile[k].quaternion.setFromUnitVectors(oben, dir.normalize());
        teile[k].scale.set(1, len + RG * 0.6, 1);
      });
    };
    lege(0); if (i === 2) bogen = lege;
  }
  for (const [x, y] of pk) { const t = new THREE.Mesh(new THREE.TorusGeometry(RP, RG, 10, 24), M.gummiW); t.rotation.x = PI / 2; t.position.copy(P(x, y, HG)); g.add(t); }
  // Kunststoff: Dreieck 6 Einheiten größer (deckt Gummi und Pfosten), Bild per affiner Abbildung (rechts gespiegelt)
  const ink = 6, rIn = (() => { const [a, b, c] = pk, la = Math.hypot(b[0] - c[0], b[1] - c[1]), lb = Math.hypot(a[0] - c[0], a[1] - c[1]), lc = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const s = (la + lb + lc) / 2; return { r: Math.sqrt((s - la) * (s - lb) * (s - lc) / s), x: (la * a[0] + lb * b[0] + lc * c[0]) / (2 * s), y: (la * a[1] + lb * b[1] + lc * c[1]) / (2 * s) }; })();
  const k = (rIn.r + ink) / rIn.r, gross = pk.map(([x, y]) => [rIn.x + (x - rIn.x) * k, rIn.y + (y - rIn.y) * k]);
  const sh = new THREE.Shape(gross.map(([x, y]) => new THREE.Vector2(x - 200, 380 - y)));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 });
  geo.rotateX(-PI / 2);
  // UV: Tischpunkt → Bildpunkt über die drei Pfosten (affin), dann normiert
  const [p0, p1, p2] = pk, [b0, b1, b2] = SCHLEUDER_BILD, det = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + 200, y = pos.getZ(i) + 380;
    const s = ((x - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (y - p0[1])) / det, t = ((p1[0] - p0[0]) * (y - p0[1]) - (x - p0[0]) * (p1[1] - p0[1])) / det;
    const bx = b0[0] + s * (b1[0] - b0[0]) + t * (b2[0] - b0[0]), by = b0[1] + s * (b1[1] - b0[1]) + t * (b2[1] - b0[1]);
    uv.setXY(i, bx / 768, 1 - by / 1376);
  }
  const mat = new THREE.MeshPhysicalMaterial({ map: schleuderTex, color: schleuderTex ? 0xffffff : 0xc41f2c, emissive: 0xffffff,
    emissiveMap: schleuderTex, emissiveIntensity: 0.5, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.1, transparent: true, opacity: 0.97 });
  const plastik = new THREE.Mesh(geo, mat); plastik.position.y = 27; plastik.castShadow = true; g.add(plastik);
  // Glühlampe unter dem Kunststoff
  const birne = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd29a).multiplyScalar(5) }));
  birne.scale.y = 1.5; birne.position.copy(P(rIn.x, rIn.y, 6)); g.add(birne);
  scene.add(g);
  ebene(plastik, 0, 1); ebene(birne, 0, 1);
  return { sl, mat, bogen };
});

// ---------- Flipper ----------
function flipperGeo(r0, r1, hoehe, bt, bs, segs) {
  const s = Math.asin((r0 - r1) / FL), sh = new THREE.Shape();
  sh.absarc(0, 0, r0, PI / 2 + s, PI * 1.5 - s, false);
  sh.absarc(FL, 0, r1, -PI / 2 - s, PI / 2 + s, false);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: hoehe, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: segs, curveSegments: 18 });
  g.rotateX(-PI / 2); g.translate(0, bt, 0);
  return g;
}
const flipper3d = flippers.map(f => {
  const g = new THREE.Group();
  const gummi = new THREE.Mesh(flipperGeo(8.4, 4.9, 10.6, 1.2, 0.6, 3), M.gummiR); gummi.position.y = 0.6;
  const koerper = new THREE.Mesh(flipperGeo(4.6, 1.5, 6.6, 3.6, 2.2, 6), M.weiss); koerper.position.y = 0.8;
  const achse = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3, 16), M.chrom); achse.position.y = 15.6;
  for (const m of [gummi, koerper, achse]) { m.castShadow = true; m.receiveShadow = true; g.add(m); ebene(m, 0, 1); }
  scene.add(g);
  return { f, g };
});

// ---------- Ziele: drei orange Stehziele rechts, fünf weiße Rundziele links ----------
const stand3d = standups.map(s => {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xff8a1a, roughness: 0.3, clearcoat: 1, emissive: 0xff7a10, emissiveIntensity: 0 });
  const t = new THREE.Mesh(new THREE.BoxGeometry(4, 15, s.h), mat); t.position.copy(P(s.x + 1, s.y, 9)); t.castShadow = true;
  const fuss = new THREE.Mesh(new THREE.BoxGeometry(7, 4, s.h + 2), M.schwarz); fuss.position.copy(P(s.x + 3, s.y, 2));
  scene.add(ebene(t, 0, 1), fuss); return { s, mat };
});
const rund3d = rund.map(r => {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xeef1f4, roughness: 0.3, clearcoat: 1, emissive: 0xffd23a, emissiveIntensity: 0 });
  const t = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 2.6, 24), mat); t.rotation.z = PI / 2; t.position.copy(P(r.x + 3, r.y, 9)); t.castShadow = true;
  const stiel = new THREE.Mesh(new THREE.BoxGeometry(2, 9, 2), M.schwarz); stiel.position.copy(P(r.x + 1, r.y, 4.5));
  scene.add(ebene(t, 0, 1), stiel); return { r, mat };
});

// ---------- Kanone rechts (Form wie drei.js, Entwurf 2) – schwenkt im Leerlauf ----------
const kanone3d = (() => {
  const g = new THREE.Group(), L = 30;
  const dunkel = new THREE.MeshStandardMaterial({ color: 0x6d7c8e, metalness: 0.85, roughness: 0.28 });
  const blauGlut = new THREE.MeshStandardMaterial({ color: 0x1d5fb8, emissive: 0x3d8fff, emissiveIntensity: 1.6, roughness: 0.3 });
  const teller = new THREE.Mesh(new THREE.CylinderGeometry(21, 23, 4, 40), dunkel); teller.position.y = 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(19, 1.5, 10, 48), blauGlut); ring.rotation.x = PI / 2; ring.position.y = 4.4;
  const kranz = new THREE.Mesh(new THREE.CylinderGeometry(15, 17, 4, 32), M.chrom); kranz.position.y = 6.5;
  const dreh = new THREE.Group(); dreh.position.y = 8.5;
  const prof = new THREE.Shape();
  prof.moveTo(-15, 0); prof.lineTo(-15, 9); prof.lineTo(-8, 15); prof.lineTo(6, 15.5); prof.lineTo(15, 11); prof.lineTo(15, 4); prof.lineTo(11, 0); prof.closePath();
  const gehGeo = new THREE.ExtrudeGeometry(prof, { depth: 20, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 1.4, bevelSegments: 2 }); gehGeo.translate(0, 0, -10);
  const gehaeuse = new THREE.Mesh(gehGeo, dunkel);
  const kuppel = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12, 0, PI * 2, 0, PI / 2),
    new THREE.MeshPhysicalMaterial({ color: 0x9fd0ff, metalness: 0.2, roughness: 0.05, clearcoat: 1, emissive: 0x2a6fd0, emissiveIntensity: 0.6 }));
  kuppel.position.set(-3, 15.5, 0); kuppel.scale.y = 0.7;
  const mantel = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.8, 16, 24), M.chrom); mantel.rotation.z = PI / 2; mantel.position.set(22, 9, 0);
  const rohr = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.4, L - 6, 20), M.stahl); rohr.rotation.z = PI / 2; rohr.position.set(12 + (L - 6) / 2 + 3, 9, 0);
  const muendung = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5, 4.5, 24), dunkel); muendung.rotation.z = PI / 2; muendung.position.set(L + 4, 9, 0);
  dreh.add(gehaeuse, kuppel, mantel, rohr, muendung);
  g.add(teller, ring, kranz, dreh); g.position.copy(P(340, 548)); scene.add(g);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; ebene(o, 0, 1); } });
  return { dreh };
})();

// ---------- Drahtrampen-Enden: vier Drähte, Bügel, Stützen – kommen oben aus dem Dunkel ----------
const rampenPunkt = (r, u) => { const t = RAMPE_T0 + (1 - RAMPE_T0) * u, [x, y] = bez(RAMPEN[r].pfad, t); return { x, y, h: rampenHoehe(u) }; };
for (let r = 0; r < 2; r++) {
  const N = 40, mittel = [], seitlich = [];
  for (let i = 0; i <= N; i++) {
    const u = -0.15 + 1.12 * i / N, a = rampenPunkt(r, Math.max(-0.15, u)), b = rampenPunkt(r, Math.min(1, u + 0.01));
    let dx = b.x - a.x, dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    mittel.push({ ...a, nx: -dy, ny: dx });
  }
  for (const [quer, tief] of [[-5.2, -7.3], [5.2, -7.3], [-10.5, 1.5], [10.5, 1.5]]) {
    const pts = mittel.map(p => P(p.x + p.nx * quer, p.y + p.ny * quer, p.h + tief));
    const draht = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.75, 8), M.chrom);
    draht.castShadow = true; scene.add(ebene(draht, 0, 1));
  }
  for (let i = 4; i <= N; i += 6) {                  // Bügel quer unter der Bahn, Stütze zum Boden
    const p = mittel[i], bug = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.7, 6, 20, PI), M.chrom);
    bug.position.copy(P(p.x, p.y, p.h - 1)); bug.rotation.set(PI, -Math.atan2(p.ny, p.nx), 0, 'YXZ'); bug.castShadow = true; scene.add(bug);
    if (p.h > 14 && p.y > OBEN) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, p.h - 11, 8), M.chrom); st.position.copy(P(p.x + p.nx * 10.5, p.y + p.ny * 10.5, (p.h - 11) / 2)); st.castShadow = true; scene.add(st); }
  }
}

// ---------- Lampen, die Licht werfen ----------
scene.add(ebene(new THREE.HemisphereLight(0x8090b0, 0x140c08, 0.12), 0, 1, 2));
const giLichter = [[86, 606, 12], [290, 606, 12], [24, 520, 16], [376, 520, 16]].map(([x, y, h]) => {
  const l = new THREE.PointLight(0xffc88a, 2600, 420, 1.7); l.position.copy(P(x, y, h)); scene.add(ebene(l, 0, 1, 2)); return l;
});
for (const [x, y, h] of [[24, 520, 16], [376, 520, 16], [26, 640, 10], [350, 560, 10]]) {     // sichtbare Birnen an den Seitenwänden
  const b = new THREE.Mesh(new THREE.SphereGeometry(2.3, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd6a0).multiplyScalar(6) }));
  b.scale.y = 1.5; b.position.copy(P(x, y, h)); scene.add(ebene(b, 0, 1));
}
const schattenLicht = (pos, ziel, st) => {
  const s = new THREE.SpotLight(0xfff0dc, st, 2400, 0.62, 0.85, 0); s.position.copy(pos); s.target.position.copy(ziel);
  s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.6;
  s.shadow.camera.near = 80; s.shadow.camera.far = 1800; scene.add(ebene(s, 0, 1, 2), s.target); return s;
};
// Raumleuchte über dem Spieler: ihr Spiegelbild im Lack liegt unterhalb des Bildes (bei 30° Blick spiegelt sich jede Lampe, die
// weiter vorn hängt, als greller Fleck in Lack und Einsätzen). Schatten fallen nach hinten wie im Spielsalon.
const lichtA = schattenLicht(P(170, 700, 600), P(200, 520), 1.0);
const lichtB = schattenLicht(P(560, 600, 230), P(170, 560), 0.6);       // rechts seitlich (Raum) – Spiegelbild im Lack fällt aus dem Bild
const blitzer = new THREE.PointLight(0xffd0b0, 0, 380, 1.5); scene.add(ebene(blitzer, 0, 1, 2));

// ---------- Kugel: Live-Spiegelung, Kontaktschatten, Bewegungsunschärfe ----------
const wuerfelZiel = new THREE.WebGLCubeRenderTarget(128, { type: TYP, generateMipmaps: false });
const wuerfel = new THREE.CubeCamera(1.5, 3000, wuerfelZiel);
for (const c of wuerfel.children) c.layers.set(1);
const kugelMat = new THREE.MeshPhongMaterial({ color: 0x0c0c0c, specular: 0xffffff, shininess: 260, envMap: wuerfelZiel.texture, combine: THREE.AddOperation, reflectivity: 0.85 });
const kugelMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), kugelMat); kugelMesh.castShadow = true; scene.add(kugelMesh);
const geister = [0.38, 0.22, 0.1].map(o => {
  const m = kugelMat.clone(); m.transparent = true; m.opacity = o; m.depthWrite = false;
  const g = new THREE.Mesh(kugelMesh.geometry, m); g.visible = false; scene.add(g); return g;
});
const fleckGeo = new THREE.PlaneGeometry(R * 2.6, R * 2.6); fleckGeo.rotateX(-PI / 2);
const fleck = new THREE.Mesh(fleckGeo, new THREE.MeshBasicMaterial({ map: fleckTex, transparent: true, depthWrite: false })); scene.add(ebene(fleck, 2, 1));
// Raumlicht über dem Tisch, nur in der Kugel-Spiegelung (Glas, Decke)
for (const [b, h, farbe, x, y, z] of [[320, 40, 0xfff1dc, 200, 470, 520], [120, 80, 0xbfd4ff, -140, 380, 360], [90, 90, 0xffd6b0, 560, 520, 330]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(b, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(farbe).multiplyScalar(2.2), side: THREE.DoubleSide, fog: false }));
  m.position.copy(P(x, y, z)); m.lookAt(P(200, 600, 0)); ebene(m, 1); scene.add(m);
}

// ---------- Bodenspiegel (wie three.js Reflector, Ebene y = 0) ----------
const spiegelKam = new THREE.PerspectiveCamera(); spiegelKam.layers.set(0);
const sp = { n: new THREE.Vector3(0, 1, 0), welt: new THREE.Vector3(), kam: new THREE.Vector3(), rot: new THREE.Matrix4(), blick: new THREE.Vector3(),
  ziel: new THREE.Vector3(), schau: new THREE.Vector3(), ebene: new THREE.Plane(), clip: new THREE.Vector4(), q: new THREE.Vector4() };
function bodenSpiegeln() {
  sp.welt.setFromMatrixPosition(boden.matrixWorld); sp.kam.setFromMatrixPosition(camera.matrixWorld);
  sp.blick.subVectors(sp.welt, sp.kam).reflect(sp.n).negate().add(sp.welt);
  sp.rot.extractRotation(camera.matrixWorld);
  sp.schau.set(0, 0, -1).applyMatrix4(sp.rot).add(sp.kam);
  sp.ziel.subVectors(sp.welt, sp.schau).reflect(sp.n).negate().add(sp.welt);
  spiegelKam.position.copy(sp.blick); spiegelKam.up.set(0, 1, 0).applyMatrix4(sp.rot).reflect(sp.n); spiegelKam.lookAt(sp.ziel);
  spiegelKam.far = camera.far; spiegelKam.updateMatrixWorld(); spiegelKam.projectionMatrix.copy(camera.projectionMatrix);
  spiegelMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  spiegelMatrix.multiply(spiegelKam.projectionMatrix).multiply(spiegelKam.matrixWorldInverse).multiply(boden.matrixWorld);
  sp.ebene.setFromNormalAndCoplanarPoint(sp.n, sp.welt).applyMatrix4(spiegelKam.matrixWorldInverse);
  sp.clip.set(sp.ebene.normal.x, sp.ebene.normal.y, sp.ebene.normal.z, sp.ebene.constant);
  const pm = spiegelKam.projectionMatrix.elements;
  sp.q.set((Math.sign(sp.clip.x) + pm[8]) / pm[0], (Math.sign(sp.clip.y) + pm[9]) / pm[5], -1, (1 + pm[10]) / pm[14]);
  sp.clip.multiplyScalar(2 / sp.clip.dot(sp.q));
  pm[2] = sp.clip.x; pm[6] = sp.clip.y; pm[10] = sp.clip.z + 1; pm[14] = sp.clip.w;
  boden.visible = false;
  const alt = renderer.getRenderTarget();
  renderer.setRenderTarget(spiegelZiel); renderer.clear(); renderer.render(scene, spiegelKam);
  renderer.setRenderTarget(alt);
  boden.visible = true;
}

// ---------- Nachbearbeitung: Leuchten ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: TYP, samples: Math.min(4, renderer.capabilities.maxSamples || 0) }));
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.4, hdr ? 1.0 : 0.85));
composer.addPass(new OutputPass());

// ---------- Kamera einpassen: quer = Spielerblick 30°, unteres Feld füllt den Schirm ----------
// Stufen: Auflösung, Bodenspiegel (Anteil der Auflösung, 0 = aus), Würfelseiten der Kugelspiegelung je Bild. Start in Stufe 2.
const STUFEN = [{ dpr: 2, spiegel: 0.5, seiten: 6 }, { dpr: 1.5, spiegel: 0.5, seiten: 3 }, { dpr: 1.25, spiegel: 0.35, seiten: 2 }, { dpr: 1, spiegel: 0, seiten: 1 }];
let stufe = 1;
function einpassen() {
  const w = innerWidth, h = innerHeight, quer = w > h;
  renderer.setPixelRatio(Math.min(STUFEN[stufe].dpr, devicePixelRatio || 1)); renderer.setSize(w, h);
  composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  const db = renderer.getDrawingBufferSize(new THREE.Vector2()), sf = STUFEN[stufe].spiegel || 0.25;
  spiegelZiel.setSize(Math.max(1, Math.round(db.x * sf)), Math.max(1, Math.round(db.y * sf)));
  camera.aspect = w / h;
  const neig = (quer ? 30 : 46) * PI / 180, dir = new THREE.Vector3(0, Math.sin(neig), Math.cos(neig));
  const ecken = [P(8, OBEN - 4, 0), P(392, OBEN - 4, 0), P(4, 768, 22), P(396, 768, 22), P(4, 768, 0), P(396, 768, 0)];
  const ziel = P(200, 600, 0); let dist = 900;
  const passt = d => {
    camera.position.copy(ziel).addScaledVector(dir, d); camera.lookAt(ziel); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const e of ecken) { const v = e.clone().project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    return { x0, x1, y0, y1 };
  };
  for (let r = 0; r < 10; r++) {
    let lo = 100, hi = 5000;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, b = passt(m); if (b.x0 < -1 || b.x1 > 1 || b.y0 < -1.02 || b.y1 > 1) lo = m; else hi = m; }
    dist = hi; const b = passt(dist);
    ziel.z -= (b.y0 + 1.02) * 120;      // unten bündig (Verriegelungsleiste darf angeschnitten sein)
  }
  passt(dist);
  const d0 = camera.position.distanceTo(P(200, 480)), d1 = camera.position.distanceTo(P(200, OBEN - 30));
  scene.fog.near = d0; scene.fog.far = d1 + (d1 - d0) * 0.6;
}
addEventListener('resize', einpassen);
einpassen();

// ======================================================================================================================
// Eingabe
// ======================================================================================================================
const startEl = document.getElementById('start');
const finger = new Map();
function halte() {
  for (const s of [0, 1]) {
    const an = [...finger.values()].includes(s), f = flippers[s];
    if (an && !f.on) ton.flipperAn(); if (!an && f.on) ton.flipperAus();
    f.on = an;
  }
}
addEventListener('pointerdown', e => {
  e.preventDefault(); ton.an();
  if (!startEl.hidden) { startEl.hidden = true; return; }
  demo.letzterTipp = performance.now() / 1000;
  if (demo.an) for (const f of flippers) f.on = false;
  const seite = e.clientX < innerWidth / 2 ? 0 : 1;
  finger.set(e.pointerId, seite); halte();
  if (seite === 1) abschuss();
}, { passive: false });
for (const t of ['pointerup', 'pointercancel']) addEventListener(t, e => { finger.delete(e.pointerId); halte(); });
addEventListener('blur', () => { finger.clear(); halte(); });
const tasten = { ArrowLeft: 0, z: 0, ArrowRight: 1, m: 1 };
addEventListener('keydown', e => {
  if (e.repeat) return; ton.an(); startEl.hidden = true; demo.letzterTipp = performance.now() / 1000;
  if (e.key in tasten) { finger.set('t' + tasten[e.key], tasten[e.key]); halte(); }
  if (e.key === ' ') abschuss();
});
addEventListener('keyup', e => { if (e.key in tasten) { finger.delete('t' + tasten[e.key]); halte(); } });

// ======================================================================================================================
// Schleife
// ======================================================================================================================
const info = document.getElementById('info');
let letzt = performance.now(), rest = 0, bilder = 0, mStart = performance.now(), langsam = 0, flott = 0, warm = performance.now() + 4000;
const gesperrt = new Set(), vorher = new THREE.Vector3(), weg = new THREE.Vector3();
let hatteVorher = false, flaeche = 0;

function kugelLage() {                 // 3D-Lage der Kugel (null = nicht sichtbar)
  const k = kugel;
  if (k.z === 'oben' || k.z === 'aus') return null;
  if (k.z === 'rampe') { const p = rampenPunkt(k.rampe, k.u); return P(p.x, p.y, p.h); }
  if (k.y > 722) return k.y > 742 ? null : P(k.x, k.y, R - (k.y - 722) * 0.9);   // unter der Schürze in den Abfluss
  return P(k.x, k.y, R);
}
function messen(jetzt) {
  bilder++;
  if (jetzt - mStart < 1500) return;
  const fps = bilder * 1000 / (jetzt - mStart); bilder = 0; mStart = jetzt;
  if (jetzt > warm && !window.__STUECK_FEST) {
    if (fps < 52) { flott = 0; if (++langsam >= 2 && stufe < STUFEN.length - 1) { langsam = 0; gesperrt.add(stufe); stufe++; einpassen(); warm = jetzt + 3000; } }
    else { langsam = 0; if (fps >= 58 && ++flott >= 4 && stufe > 0 && !gesperrt.has(stufe - 1)) { flott = 0; stufe--; einpassen(); warm = jetzt + 3000; } }
  }
  info.textContent = `${Math.round(fps)} fps · Stufe ${stufe + 1}/4${demo.an ? ' · Demo' : ''}`;
}

function bild(jetzt) {
  const dt = Math.min(0.05, (jetzt - letzt) / 1000); letzt = jetzt;
  messen(jetzt);
  demoSchritt();
  rest += dt * TEMPO;
  let n = 0;
  while (rest >= DT && n++ < 80) { schritt(DT); rest -= DT; }
  if (rest > DT) rest = 0;
  lampen.schritt(dt);

  // Teile nachführen
  for (const { f, g } of flipper3d) { const t = tip(f); g.position.copy(P(f.px, f.py)); g.rotation.y = Math.atan2(-(t.y - f.py), t.x - f.px); }
  for (const s of schleudern) { s.mat.emissiveIntensity = 0.35 + 2.2 * s.sl.flash; if (s.bogen) s.bogen(3.5 * s.sl.flash); }
  for (const { s, mat } of stand3d) mat.emissiveIntensity = s.blitz * 2 + (s.an ? 0.5 : 0);
  rund3d.forEach(({ r, mat }, k) => { mat.emissiveIntensity = r.blitz * 2 + (k === zielLicht ? 0.9 : 0); });
  kanone3d.dreh.rotation.y = -(PI + 0.5 - 0.22 * Math.cos(zeit * 0.8));
  let st = 0, wo = null;
  for (const s of slings) if (s.flash > st) { st = s.flash; const [a, b, c] = s.pts; wo = P((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, 36); }
  blitzer.intensity = st > 0.02 ? 9000 * st : 0; if (wo) blitzer.position.copy(wo);

  // Kugel
  const lage = kugelLage();
  kugelMesh.visible = !!lage; fleck.visible = !!lage;
  if (lage) {
    kugelMesh.position.copy(lage);
    const hh = lage.y - R; fleck.position.set(lage.x, 0.3, lage.z); fleck.material.opacity = 0.85 * Math.max(0, 1 - hh / 30); fleck.visible = hh < 30;
    if (hatteVorher) {
      weg.subVectors(lage, vorher); const l = weg.length(), zeig = l > R * 0.7 && l < 150;
      geister.forEach((g, j) => { g.visible = zeig; if (zeig) g.position.copy(lage).addScaledVector(weg, -(j + 1) * 0.25); });
    }
    vorher.copy(lage); hatteVorher = true;
    // Live-Spiegelung (bei Last nur einige Würfelseiten je Bild, reihum)
    kugelMesh.visible = false; geister.forEach(g => { g.userData.v = g.visible; g.visible = false; });
    wuerfel.position.copy(lage); wuerfel.updateMatrixWorld(true);
    const seiten = STUFEN[stufe].seiten;
    if (seiten >= 6 || bilder % 97 === 0) wuerfel.update(renderer, scene);
    else { const alt = renderer.getRenderTarget(); for (let i = 0; i < seiten; i++) { renderer.setRenderTarget(wuerfelZiel, flaeche); renderer.render(scene, wuerfel.children[flaeche]); flaeche = (flaeche + 1) % 6; } renderer.setRenderTarget(alt); }
    kugelMesh.visible = true; geister.forEach(g => { g.visible = g.userData.v; });
  } else { hatteVorher = false; geister.forEach(g => { g.visible = false; }); }
  const v = kugel.z === 'rampe' ? 700 : Math.hypot(kugel.vx, kugel.vy);
  ton.rollen(v, kugel.z === 'feld' && kugel.y < 778 ? 'feld' : kugel.z === 'rampe' ? 'draht' : null);

  // Bodenspiegel, Schatten, Bild
  if (STUFEN[stufe].spiegel && !testSchalter.ohneSpiegel) { spiegelStaerke.value = 1.7; bodenSpiegeln(); } else spiegelStaerke.value = 0;
  renderer.shadowMap.needsUpdate = true;
  composer.render(dt);
  requestAnimationFrame(bild);
}
wuerfel.update(renderer, scene);
requestAnimationFrame(bild);
window.__STUECK = { kugel, flippers, setze, abschuss, get zeit() { return zeit; }, get stufe() { return stufe; },
  test: { testSchalter, schleudern, lampen, scene, THREE, lichtA, lichtB, giLichter, flipper3d, blitzer, kugelMesh, geister, camera, schritt, demoSchritt, demo } };   // nur für Tests
