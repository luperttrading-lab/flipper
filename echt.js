// Zero Time – Echt-Ansicht (seit 0.93 Standard; bisherige 3D-Ansicht mit „?drei“, flach mit „?2d“): das ganze Spiel im Stil des Echt-Stücks.
// Physik und Regeln bleiben in index.html (Daten in window.__ZT); hier wird nur gezeichnet – ohne die 2D-Zeichnung als Bodentextur:
// Der Boden ist ein fester Druck (einmal gezeichnet), die Einsätze sind Kunststoff mit Glühlampe darunter und folgen `lamps[].i`.
// Hochkant: ganzer Tisch, Blick 50°, Punktmatrix oben. Quer: Spielerblick 30°, Kamera folgt der untersten Kugel, Punktmatrix schwebt oben.
// Koordinaten wie drei.js: Tisch (x, y) → 3D (X = x − 200, Z = y − 380), Höhe = Y; eine Tischeinheit = eine 3D-Einheit (Kugel R 9).
import * as THREE from './lib/three.module.min.js';
import { EffectComposer } from './lib/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './lib/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './lib/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './lib/jsm/postprocessing/OutputPass.js';

const Z = window.__ZT;
const { W, H, R } = Z;
const PI = Math.PI;
const P = (x, y, h = 0) => new THREE.Vector3(x - W / 2, h, y - H / 2);

// ======================================================================================================================
// Renderer, Szene, Kamera
// ======================================================================================================================
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;        // Schatten einmal je Bild (nicht für Spiegel- und Würfelbilder)
const gl = renderer.domElement;
gl.id = 'c3d';
Object.assign(gl.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', touchAction: 'none', display: 'block' });
stage.style.position = 'relative';
stage.appendChild(gl);
const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
const TYP = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(36, 1, 5, 5000);
// Ebenen: 0 = normal (auch im Bodenspiegel), 1 = in der Kugel-Spiegelung, 2 = nur Hauptbild (flache Teile auf dem Boden)
camera.layers.enable(2);
const ebene = (o, ...n) => { o.layers.set(n[0]); for (const e of n.slice(1)) o.layers.enable(e); return o; };

{ // Umgebung für Metall: dunkler Raum, warme Lampenstreifen, kühles Raumlicht von oben
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

// Punktlampen spiegeln sich im Klarlack nur gedämpft (echte Lampen sind Flächen; als Punkt gäbe es grelle Flecken, Echt-Stück)
const lackGedaempft = sh => {
  sh.fragmentShader = sh.fragmentShader.replace('( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat',
    '( clearcoatSpecularDirect * 0.12 + clearcoatSpecularIndirect ) * material.clearcoat');
};
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
M.weiss.onBeforeCompile = lackGedaempft;

// ======================================================================================================================
// Einsätze (aus index.html: lamps mit Form, Farbe, Beschriftung und Helligkeit i)
// ======================================================================================================================
const FARBE = { rot: '#ff3040', gelb: '#ffd23a', gruen: '#2fe07a', weiss: '#eaf4ff', amber: '#ff9a2e', blau: '#46b0ff' };
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
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

// ======================================================================================================================
// Druckbilder (einmal gezeichnet)
// ======================================================================================================================
const ladeBild = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const [strudelBild, schleuderBild, schaedelBild, kopfBild, zeigerH, zeigerM, zeigerN] = await Promise.all(['strudel.png', 'bilder/eingang/schleuder_v1.png',
  'schaedel.png', 'kopf.jpg', 'zeiger_h.png', 'zeiger_m.png', 'zeiger_n.png'].map(ladeBild));
const SCHRIFT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const canvasTex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t; };
const bildTex = (img, w, h) => {      // über eine Zeichenfläche: direkt als <img> blieb die Textur auf dem iPhone leer (Echt-Stück)
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); return canvasTex(c);
};

const FELD_S = 4;
function baueSpielfeld() {
  const c = document.createElement('canvas'); c.width = W * FELD_S; c.height = H * FELD_S;
  const g = c.getContext('2d'); g.scale(FELD_S, FELD_S);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Grund: oben tiefes Nachtblau, unten warmes Rot (gedruckte Farbe, kein Licht)
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#050816'); gr.addColorStop(0.35, '#08112c'); gr.addColorStop(0.62, '#0b1534'); gr.addColorStop(0.85, '#1a0d24'); gr.addColorStop(1, '#2a0c10');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const rot = g.createRadialGradient(188, 760, 10, 188, 760, 270);
  rot.addColorStop(0, 'rgba(190,40,12,.7)'); rot.addColorStop(0.5, 'rgba(120,20,10,.35)'); rot.addColorStop(1, 'rgba(60,0,0,0)');
  g.fillStyle = rot; g.fillRect(0, 380, W, 380);
  const blau = g.createRadialGradient(215, 170, 10, 215, 170, 190);         // kühles Leuchten um die Bumper
  blau.addColorStop(0, 'rgba(40,90,200,.35)'); blau.addColorStop(1, 'rgba(10,20,60,0)');
  g.fillStyle = blau; g.fillRect(0, 0, W, 380);
  // Umlauf-Gassen und Abschussrinne dunkler
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(12, 200, 46, 280); g.fillRect(326, 200, 38, 182); g.fillRect(364, 300, 28, 460);
  // Strahlenkränze hinter dem Bonus-Fächer und um die Bumper
  const kranz = (x, y, r, n, a) => {
    g.save(); g.translate(x, y);
    for (let i = 0; i < n; i++) { g.rotate(2 * PI / n); g.fillStyle = i % 2 ? `rgba(255,170,60,${a})` : `rgba(0,0,0,${a * 1.2})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(r, -r * PI / n); g.lineTo(r, r * PI / n); g.closePath(); g.fill(); }
    g.restore();
  };
  kranz(188, 668, 150, 36, 0.1);
  for (const b of Z.bumpers) {
    const q = g.createRadialGradient(b.x, b.y, b.r, b.x, b.y, b.r + 26); q.addColorStop(0, 'rgba(255,90,40,.45)'); q.addColorStop(1, 'rgba(255,90,40,0)');
    g.fillStyle = q; g.beginPath(); g.arc(b.x, b.y, b.r + 26, 0, 2 * PI); g.fill();
    g.strokeStyle = 'rgba(255,200,120,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, b.r + 8, 0, 2 * PI); g.stroke();
  }
  // Leiterbahnen in Kupfer/Gold mit Lötpunkten
  for (let i = 0; i < 230; i++) {
    let x = 14 + rnd() * 372, y = 30 + rnd() * 690;
    g.strokeStyle = `rgba(${200 + rnd() * 40 | 0},${140 + rnd() * 40 | 0},60,${0.22 + rnd() * 0.25})`; g.lineWidth = 0.7 + rnd() * 0.8;
    g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      const l = 8 + rnd() * 30, r = rnd();
      if (r < 0.35) x += l; else if (r < 0.6) y += l; else if (r < 0.8) { x += l * 0.7; y += l * 0.7; } else { x -= l * 0.7; y += l * 0.7; }
      g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(x, y, 1.5, 0, 2 * PI); g.fill();
  }
  // Bogen oben: gedrucktes Band entlang der Außenwand
  g.strokeStyle = 'rgba(255,120,40,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(202, 200, 178, PI, 2 * PI); g.stroke();
  g.strokeStyle = 'rgba(255,200,120,.25)'; g.lineWidth = 1; g.beginPath(); g.arc(202, 200, 172, PI, 2 * PI); g.stroke();
  // Schädel-Gasse: rot glühender Weg zum Loch
  { const q = g.createLinearGradient(0, 360, 0, 250); q.addColorStop(0, 'rgba(160,20,10,0)'); q.addColorStop(1, 'rgba(200,40,20,.45)');
    g.fillStyle = q; g.beginPath(); g.moveTo(66, 300); g.lineTo(130, 300); g.lineTo(136, 360); g.lineTo(60, 360); g.closePath(); g.fill(); }
  g.fillStyle = '#020203'; g.beginPath(); g.arc(Z.SKULL.x, Z.SKULL.y, 10.5, 0, 2 * PI); g.fill();        // Schädel-Loch
  g.fillStyle = '#020203'; g.beginPath(); g.arc(Z.MULDE.x, Z.MULDE.y, 9.5, 0, 2 * PI); g.fill();        // Mulde
  // Rote Rahmen hinter den Leitern, Uhr, Schriftzug
  g.strokeStyle = 'rgba(200,40,50,.6)'; g.lineWidth = 1.6;
  g.strokeRect(84 - 33, 453, 66, 114); g.strokeRect(294 - 33, 446, 66, 118); g.strokeRect(166, 348, 44, 54);
  g.save(); g.translate(188, 500);
  g.fillStyle = '#05060a'; g.beginPath(); g.arc(0, 0, 47, 0, 2 * PI); g.fill();
  if (strudelBild) { g.save(); g.beginPath(); g.arc(0, 0, 37, 0, 2 * PI); g.clip(); g.globalAlpha = 0.85; g.drawImage(strudelBild, -40, -40, 80, 80); g.restore(); }
  const ring = g.createLinearGradient(-47, -47, 47, 47);
  ring.addColorStop(0, '#f3f6fa'); ring.addColorStop(0.35, '#8a96a4'); ring.addColorStop(0.6, '#e2e8ef'); ring.addColorStop(1, '#5d6874');
  g.strokeStyle = ring; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 43, 0, 2 * PI); g.stroke();
  g.font = `700 6px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2e6cc';
  ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((t, k) => { const a = k / 12 * 2 * PI - PI / 2; g.fillText(t, Math.cos(a) * 33, Math.sin(a) * 33); });
  g.restore();
  g.save(); g.translate(188, 590); g.font = `900 15px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 2.4; g.strokeStyle = '#1a0500'; g.strokeText('ZERO TIME', 0, 0);
  const sg = g.createLinearGradient(0, -8, 0, 8); sg.addColorStop(0, '#ffe08a'); sg.addColorStop(0.5, '#ff8a1e'); sg.addColorStop(1, '#c2280c');
  g.fillStyle = sg; g.fillText('ZERO TIME', 0, 0); g.restore();
  // Zielmarke der Kanone (Eckklammern um die Rundziele, Fadenkreuz)
  g.strokeStyle = 'rgba(255,170,110,.7)'; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath();
  for (const [x, y, dx, dy] of [[50, 371, 1, 1], [93, 371, -1, 1], [50, 449, 1, -1], [93, 449, -1, -1]]) { g.moveTo(x + dx * 7, y); g.lineTo(x, y); g.lineTo(x, y + dy * 7); }
  g.moveTo(71 - 15, 354); g.lineTo(71 - 3, 354); g.moveTo(71 + 3, 354); g.lineTo(71 + 15, 354); g.moveTo(71, 339); g.lineTo(71, 351); g.moveTo(71, 357); g.lineTo(71, 369);
  g.stroke(); g.beginPath(); g.arc(71, 354, 10, 0, 2 * PI); g.stroke();
  // Beschriftungen
  const senkrecht = (t, x, y, a, f, farbe) => { g.save(); g.translate(x, y); g.rotate(a); g.font = f; g.textAlign = 'center'; g.fillStyle = farbe; g.fillText(t, 0, 2); g.restore(); };
  senkrecht('FLUCHTWEG', 35, 320, -PI / 2, `700 7px ${SCHRIFT}`, 'rgba(200,220,255,.5)');
  senkrecht('SCHLEIFE', 345, 300, PI / 2, `700 7px ${SCHRIFT}`, 'rgba(200,220,255,.5)');
  senkrecht('ABZUG', 378, 640, -PI / 2, `900 9px ${SCHRIFT}`, 'rgba(255,90,70,.6)');
  senkrecht('SPECIAL', 350, 700, -PI / 2, `700 6.5px ${SCHRIFT}`, 'rgba(255,200,120,.7)');
  g.fillStyle = 'rgba(240,240,240,.7)';
  for (const x of [55, 321]) for (const y of [588, 596]) { g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.lineTo(x, y + 5); g.closePath(); g.fill(); }
  for (const x of [166, 202, 238]) { g.beginPath(); g.moveTo(x - 4, 92); g.lineTo(x + 4, 92); g.lineTo(x, 97); g.closePath(); g.fill(); }
  // Fassungen der Einsätze: schwarzer Rand, feiner Ring in der Lampenfarbe; Sonnen-Lampen mit gedrucktem Strahlenkranz
  for (const l of Z.lamps) {
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
  // Abnutzung über den Flippern, Druckkorn
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 26; i++) { const x = 120 + rnd() * 140, r = 40 + rnd() * 90; g.strokeStyle = `rgba(255,255,255,${0.015 + rnd() * 0.02})`; g.lineWidth = 2 + rnd() * 5; g.beginPath(); g.arc(x, 700, r, PI * 1.15, PI * 1.85); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 18000; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; g.fillRect(rnd() * W, rnd() * H, 0.35, 0.35); }
  return c;
}
function einsatzTexturen(l) {          // Grund (unbeleuchtet: getönter Kunststoff, Fassung sichtbar) und Glut (beleuchtet)
  const pk = einsatzPunkte(l), xs = pk.map(p => p[0]), ys = pk.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), S = 9;
  const w = Math.max(8, Math.ceil((x1 - x0) * S)), h = Math.max(8, Math.ceil((y1 - y0) * S));
  const [r, gg, b] = rgb(FARBE[l.farbe]), [mx, my] = mitte(l);
  const mache = glut => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, -x0 * S, -y0 * S);
    const rad = Math.max(x1 - x0, y1 - y0) * 0.62, q = g.createRadialGradient(mx, my, 0, mx, my, rad);
    if (glut) {
      q.addColorStop(0, `rgb(${Math.min(255, r + 150)},${Math.min(255, gg + 150)},${Math.min(255, b + 150)})`);
      q.addColorStop(0.35, FARBE[l.farbe]); q.addColorStop(1, `rgb(${r * 0.35 | 0},${gg * 0.35 | 0},${b * 0.35 | 0})`);
    } else { q.addColorStop(0, `rgb(${r * 0.5 | 0},${gg * 0.5 | 0},${b * 0.5 | 0})`); q.addColorStop(1, `rgb(${r * 0.2 | 0},${gg * 0.2 | 0},${b * 0.2 | 0})`); }
    g.fillStyle = q; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (!glut) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.6; g.beginPath(); g.arc(mx, my, Math.min(3.2, rad * 0.4), 0, 2 * PI); g.stroke(); }
    if (l.label) {
      const fs = l.form === 'keil' ? 6.4 : l.form === 'kreis' ? Math.min(4.6, l.r * 0.55) : Math.min(6.6, l.h * 0.5);
      g.font = `900 ${fs}px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = glut ? 'rgba(20,6,0,.9)' : 'rgba(255,245,230,.72)';
      g.fillText(l.label, mx, my + 0.3, (l.w || (l.r || 20) * 1.8) * 0.92);
    }
    return canvasTex(c);
  };
  return { grund: mache(false), glut: mache(true), x0, x1, y0, y1 };
}
function baueSchuerze() {
  const c = document.createElement('canvas'); c.width = 1408; c.height = 168;
  const g = c.getContext('2d'); g.scale(4, 4);
  const v = g.createLinearGradient(0, 0, 0, 42); v.addColorStop(0, '#3a3f48'); v.addColorStop(0.15, '#23262c'); v.addColorStop(1, '#14161a');
  g.fillStyle = v; g.fillRect(0, 0, 352, 42);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(0, Math.random() * 42, 352, 0.3); }
  const karte = (x, titel, zeilen) => {
    g.fillStyle = '#f2ede1'; g.fillRect(x, 10, 78, 28); g.strokeStyle = '#8a8f96'; g.lineWidth = 0.8; g.strokeRect(x - 1, 9, 80, 30);
    g.fillStyle = '#b3201c'; g.font = `900 4.6px ${SCHRIFT}`; g.textAlign = 'center'; g.fillText(titel, x + 39, 16);
    g.fillStyle = '#222'; g.font = '600 3.2px system-ui, sans-serif'; zeilen.forEach((z, i) => g.fillText(z, x + 39, 21.5 + i * 4.2));
  };
  karte(16, 'ZERO TIME · REGELN', ['Rampen füllen die Säulen', 'Klappziel öffnet den Schädel', 'Kanone trifft = Multiball', 'Leiter kassieren im Umlauf']);
  karte(258, 'FREISPIEL', ['bei 50.000.000 Punkten', 'Extra Ball bei Alarm 5', 'Rekord gilt auf diesem Gerät', '1 Spiel = 3 Kugeln']);
  g.font = `900 10px ${SCHRIFT}`; g.textAlign = 'center';
  const sg = g.createLinearGradient(0, 18, 0, 30); sg.addColorStop(0, '#ffd27a'); sg.addColorStop(1, '#d2350f'); g.fillStyle = sg; g.fillText('ZERO TIME', 176, 28);
  for (const x of [6, 106, 246, 346]) { g.fillStyle = '#9aa3ad'; g.beginPath(); g.arc(x, 21, 2.2, 0, 2 * PI); g.fill(); g.strokeStyle = '#3a3f46'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 1.4, 21); g.lineTo(x + 1.4, 21); g.stroke(); }
  return canvasTex(c);
}
function baueSeitenwand() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 128); v.addColorStop(0, '#120c10'); v.addColorStop(1, '#050406'); g.fillStyle = v; g.fillRect(0, 0, 1024, 128);
  for (let x = -128; x < 1024; x += 64) { g.fillStyle = 'rgba(200,40,20,.22)'; g.beginPath(); g.moveTo(x, 128); g.lineTo(x + 24, 128); g.lineTo(x + 104, 0); g.lineTo(x + 80, 0); g.fill(); }
  g.fillStyle = 'rgba(255,140,60,.18)'; g.font = `900 40px ${SCHRIFT}`; g.fillText('ZERO TIME', 380, 80);
  const t = canvasTex(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1); return t;
}
const verlauf = (innen, aussen) => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const q = g.createRadialGradient(32, 32, 0, 32, 32, 32); innen.forEach(([s, f]) => q.addColorStop(s, f)); q.addColorStop(1, aussen);
  g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
};
const glowTex = verlauf([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.45)']], 'rgba(255,255,255,0)');
const fleckTex = verlauf([[0, 'rgba(0,0,0,.9)'], [0.4, 'rgba(0,0,0,.5)']], 'rgba(0,0,0,0)');
const augenTex = verlauf([[0, 'rgba(255,190,90,1)'], [0.35, 'rgba(255,130,30,.55)']], 'rgba(255,90,0,0)');

// ======================================================================================================================
// Szene bauen
// ======================================================================================================================
// ---------- Lackboden mit Spiegelung ----------
const feldTex = canvasTex(baueSpielfeld());
const spiegelZiel = new THREE.WebGLRenderTarget(1, 1, { type: TYP });
const spiegelMatrix = new THREE.Matrix4();
const spiegelStaerke = { value: 1.7 };
const bodenMat = new THREE.MeshPhysicalMaterial({ map: feldTex, roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
bodenMat.onBeforeCompile = sh => {
  lackGedaempft(sh);
  sh.uniforms.tSpiegel = { value: spiegelZiel.texture }; sh.uniforms.uSpiegelM = { value: spiegelMatrix }; sh.uniforms.uSpiegel = spiegelStaerke;
  sh.vertexShader = 'uniform mat4 uSpiegelM;\nvarying vec4 vSpiegelUv;\n' +
    sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n\tvSpiegelUv = uSpiegelM * vec4( position, 1.0 );');
  sh.fragmentShader = 'uniform sampler2D tSpiegel;\nuniform float uSpiegel;\nvarying vec4 vSpiegelUv;\n' +
    sh.fragmentShader.replace('#include <opaque_fragment>', `{
      float fr = 0.04 + 0.96 * pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 5.0 );
      outgoingLight += texture2DProj( tSpiegel, vSpiegelUv ).rgb * uSpiegel * fr;
    }
    #include <opaque_fragment>`);
};
const boden = new THREE.Mesh(new THREE.PlaneGeometry(W, H), bodenMat);
boden.rotation.x = -PI / 2; boden.receiveShadow = true;
scene.add(ebene(boden, 0, 1));

// ---------- Einsätze ----------
const einsaetze = (() => {
  const liste = [];
  for (const l of Z.lamps) {
    const tx = einsatzTexturen(l), pk = einsatzPunkte(l);
    const geo = new THREE.ShapeGeometry(new THREE.Shape(pk.map(([x, y]) => new THREE.Vector2(x - W / 2, H / 2 - y)))); geo.rotateX(-PI / 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + W / 2, y = pos.getZ(i) + H / 2; uv.setXY(i, (x - tx.x0) / (tx.x1 - tx.x0), 1 - (y - tx.y0) / (tx.y1 - tx.y0)); }
    const mat = new THREE.MeshPhysicalMaterial({ map: tx.grund, emissive: 0xffffff, emissiveMap: tx.glut, emissiveIntensity: 0, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04 });
    mat.onBeforeCompile = lackGedaempft;
    const m = new THREE.Mesh(geo, mat); m.position.y = 0.08; m.receiveShadow = true;
    scene.add(ebene(m, 2, 1));
    liste.push({ l, mat, farbe: new THREE.Color(FARBE[l.farbe]), groesse: Math.max(tx.x1 - tx.x0, tx.y1 - tx.y0) });
  }
  // Lichtschein der Einsätze auf dem Lack: alle in einem Zeichenaufruf, Farbe je Bild nach Helligkeit
  const n = liste.length, pos = new Float32Array(n * 12), farb = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = [];
  liste.forEach((e, k) => {
    const [mx, my] = mitte(e.l), s = e.groesse * 1.5;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], j) => { pos.set([mx - W / 2 + a * s, 0.2, my - H / 2 + b * s], k * 12 + j * 3); uv.set([(a + 1) / 2, (b + 1) / 2], k * 8 + j * 2); });
    idx.push(k * 4, k * 4 + 2, k * 4 + 1, k * 4, k * 4 + 3, k * 4 + 2);
  });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const farbAttr = new THREE.BufferAttribute(farb, 3); sg.setAttribute('color', farbAttr); sg.setIndex(idx);
  const schein = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(ebene(schein, 2));
  return () => {
    liste.forEach((e, k) => {
      e.mat.emissiveIntensity = 2.6 * e.l.i;
      const c = e.farbe, s = 0.22 * e.l.i;
      for (let j = 0; j < 4; j++) farbAttr.setXYZ(k * 4 + j, c.r * s, c.g * s, c.b * s);
    });
    farbAttr.needsUpdate = true;
  };
})();

// ---------- Gehäuse: Seitenwände mit Druck, Schienen, Kopfende, vordere Kante mit Verriegelungsleiste ----------
{
  const wandMat = new THREE.MeshStandardMaterial({ map: baueSeitenwand(), roughness: 0.5 });
  const schieneMat = new THREE.MeshStandardMaterial({ color: 0xc9d1da, metalness: 1, roughness: 0.22 });
  wandMat.userData.fest = schieneMat.userData.fest = true;
  for (const [x0, x1, innen] of [[-10, 12, 12], [392, 414, 392]]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 46, H + 30), M.holz); box.position.copy(P((x0 + x1) / 2, H / 2 - 5, 23)); box.receiveShadow = true; scene.add(ebene(box, 0, 1));
    const innenseite = new THREE.Mesh(new THREE.PlaneGeometry(H + 30, 46), wandMat);
    innenseite.position.copy(P(innen + (innen < 200 ? 0.05 : -0.05), H / 2 - 5, 23)); innenseite.rotation.y = innen < 200 ? PI / 2 : -PI / 2;
    innenseite.receiveShadow = true; scene.add(ebene(innenseite, 0, 1));
    const schiene = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, H + 30, 14), schieneMat); schiene.rotation.x = PI / 2;
    schiene.position.copy(P(innen + (innen < 200 ? -4 : 4), H / 2 - 5, 47)); scene.add(ebene(schiene, 0, 1));
  }
  const hinten = new THREE.Mesh(new THREE.BoxGeometry(W + 24, 60, 20), M.holz); hinten.position.copy(P(W / 2, -20, 30)); scene.add(ebene(hinten, 0, 1));
  // Ecken oben zwischen Bogen und Gehäuse: Holz
  const ecke = new THREE.Shape(); ecke.moveTo(-200, 380); ecke.lineTo(200, 380); ecke.lineTo(200, 180);
  for (let i = 0; i <= 40; i++) { const a = 2 * PI - i / 40 * PI; ecke.lineTo(2 + Math.cos(a) * 190, 380 - 200 - Math.sin(a) * 190); }
  ecke.lineTo(-200, 180); ecke.closePath();
  const eg = new THREE.ExtrudeGeometry(ecke, { depth: 18, bevelEnabled: false }); eg.rotateX(-PI / 2);
  scene.add(ebene(new THREE.Mesh(eg, M.holz), 0, 1));
  const vorn = new THREE.Mesh(new THREE.BoxGeometry(424, 20, 26), M.holz); vorn.position.copy(P(202, 775, 10)); scene.add(ebene(vorn, 0, 1));
  const leiste = new THREE.Mesh(new THREE.BoxGeometry(428, 4, 20), schieneMat); leiste.position.copy(P(202, 775, 22)); scene.add(ebene(leiste, 0, 1));
  const rinne = new THREE.Mesh(new THREE.BoxGeometry(4, 20, 460), M.holz); rinne.position.copy(P(Z.LANE_X, 530, 10)); rinne.castShadow = true; scene.add(ebene(rinne, 0, 1));
  const kolben = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 22, 16), M.chrom); kolben.rotation.x = PI / 2; kolben.position.copy(P(Z.SHOOT_X, 772, 6)); scene.add(kolben);
  const kopf = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 4, 20), M.gummiS); kopf.rotation.x = PI / 2; kopf.position.copy(P(Z.SHOOT_X, 763, 6)); scene.add(kopf);
  // Schürze
  const koerper = new THREE.Mesh(new THREE.BoxGeometry(352, 6, 38), M.schwarz); koerper.position.copy(P(188, 743, 3)); koerper.castShadow = true; scene.add(ebene(koerper, 0, 1));
  const druckMat = new THREE.MeshPhysicalMaterial({ map: baueSchuerze(), roughness: 0.35, metalness: 0.6, clearcoat: 0.6 }); druckMat.onBeforeCompile = lackGedaempft;
  const druck = new THREE.Mesh(new THREE.PlaneGeometry(352, 38), druckMat); druck.rotation.x = -PI / 2; druck.position.copy(P(188, 743, 6.05)); druck.receiveShadow = true; scene.add(ebene(druck, 0, 1));
  const kante = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 352, 12), M.stahl); kante.rotation.z = PI / 2; kante.position.copy(P(188, 724, 5)); scene.add(kante);
}

// ---------- Führungen: Stahlblech mit Rollkante, am Bogen und an den Außenwänden höher; Pfosten an freien Enden ----------
function pfosten(x, y, art) {          // Metallpfosten mit Mutter oben, Ring auf Kugelhöhe
  const g = new THREE.Group(); g.position.copy(P(x, y));
  const st = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 22, 16), M.chrom); st.position.y = 11; st.castShadow = true;
  const mutter = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 2.4, 6), M.chrom); mutter.position.y = 23;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(art === 'gummi' ? 3.9 : 3.2, art === 'gummi' ? 1.7 : 0.9, 10, 24), art === 'gummi' ? M.gummiS : M.chrom);
  ring.rotation.x = PI / 2; ring.position.y = 9; ring.castShadow = true;
  g.add(st, mutter, ring); scene.add(g); ebene(st, 0, 1);
}
{
  const fuehr = Z.walls.filter(w => !w.schleuder && !w.kick && !((w.x1 === Z.LANE_X && w.x2 === Z.LANE_X) || (w.x1 <= 12.5 && w.x2 <= 12.5) || (w.x1 >= 391.5 && w.x2 >= 391.5)));
  const blech = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.stahl, fuehr.length);
  const rolle = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10), M.chrom, fuehr.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
  fuehr.forEach((w, i) => {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, l = Math.hypot(dx, dy), mx = (w.x1 + w.x2) / 2, my = (w.y1 + w.y2) / 2;
    const bogen = Math.hypot(mx - 202, my - 200) > 180 && my < 205, hh = w.nurRunter ? 8 : bogen ? 20 : 14;
    e.set(0, -Math.atan2(dy, dx), 0); q.setFromEuler(e);
    blech.setMatrixAt(i, m.compose(P(mx, my, hh / 2), q, s.set(l + (bogen ? 1.5 : 0), hh, w.nurRunter ? 1.2 : 2.2)));
    e.set(0, -Math.atan2(dy, dx), PI / 2); q.setFromEuler(e);
    rolle.setMatrixAt(i, m.compose(P(mx, my, hh), q, s.set(1.5, l + (bogen ? 1.5 : 0), 1.5)));
  });
  blech.castShadow = true; blech.receiveShadow = true; rolle.castShadow = true;
  scene.add(ebene(blech, 0, 1), ebene(rolle, 0, 1));
  const n = new Map(), key = (x, y) => Math.round(x) + ',' + Math.round(y);
  for (const w of fuehr) for (const [x, y] of [[w.x1, w.y1], [w.x2, w.y2]]) { const k = key(x, y); if (!n.has(k)) n.set(k, { x, y, c: 0 }); n.get(k).c++; }
  const enden = [];
  for (const p of n.values()) if (p.c === 1 && p.x > 14 && p.x < 390 && p.y < 758 && !enden.some(q2 => Math.hypot(q2.x - p.x, q2.y - p.y) < 8)
    && !Z.flippers.some(f => Math.hypot(f.px - p.x, f.py - p.y) < 14)) enden.push(p);
  for (const p of enden) pfosten(p.x, p.y, 'gummi');
  for (const p of Z.posts) pfosten(p.x, p.y, 'chrom');
}

// ---------- Schleudern: Gummiring um drei Pfosten, darüber der bedruckte Kunststoff mit Glühlampe darunter ----------
const schleuderTex = schleuderBild ? bildTex(schleuderBild, 768, 1376) : null;
const SCHLEUDER_BILD = [[150, 145], [148, 940], [622, 1228]];     // Pfosten/Muttern im Bild ↔ Ecken der linken Schleuder
const schleudern = Z.slings.map(sl => {
  const g = new THREE.Group(), pk = sl.pts;
  const cx = (pk[0][0] + pk[1][0] + pk[2][0]) / 3, cy = (pk[0][1] + pk[1][1] + pk[2][1]) / 3;
  for (const [x, y] of pk) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.6, 26, 18), M.chrom); p.position.copy(P(x, y, 13)); p.castShadow = true; g.add(p);
    const mu = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 3, 6), M.chrom); mu.position.copy(P(x, y, 29.5)); g.add(mu);
  }
  const RP = 3.6, RG = 2.0, HG = 9, oben = new THREE.Vector3(0, 1, 0);
  let bogen = null;
  for (let i = 0; i < 3; i++) {
    const a = pk[i], b = pk[(i + 1) % 3], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    let nx = -dy / l, ny = dx / l; if ((cx - a[0]) * nx + (cy - a[1]) * ny > 0) { nx = -nx; ny = -ny; }
    const A = [a[0] + nx * RP, a[1] + ny * RP], B = [b[0] + nx * RP, b[1] + ny * RP];
    const teile = (i === 2 ? [0, 1] : [0]).map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(RG, RG, 1, 12), M.gummiW); m.castShadow = true; m.userData.beweglich = i === 2; g.add(m); return m; });
    const lege = d => {
      const Mi = [(A[0] + B[0]) / 2 + nx * d, (A[1] + B[1]) / 2 + ny * d];
      (teile.length === 2 ? [[A, Mi], [Mi, B]] : [[A, B]]).forEach(([u, v], k) => {
        const p0 = P(u[0], u[1], HG), p1 = P(v[0], v[1], HG), dir = p1.clone().sub(p0), len = dir.length();
        teile[k].position.copy(p0).addScaledVector(dir, 0.5); teile[k].quaternion.setFromUnitVectors(oben, dir.normalize()); teile[k].scale.set(1, len + RG * 0.6, 1);
      });
    };
    lege(0); if (i === 2) bogen = lege;
  }
  for (const [x, y] of pk) { const t = new THREE.Mesh(new THREE.TorusGeometry(RP, RG, 10, 24), M.gummiW); t.rotation.x = PI / 2; t.position.copy(P(x, y, HG)); g.add(t); }
  const [a, b, c] = pk, la = Math.hypot(b[0] - c[0], b[1] - c[1]), lb = Math.hypot(a[0] - c[0], a[1] - c[1]), lc = Math.hypot(a[0] - b[0], a[1] - b[1]);
  const s2 = (la + lb + lc) / 2, rIn = Math.sqrt((s2 - la) * (s2 - lb) * (s2 - lc) / s2);
  const ix = (la * a[0] + lb * b[0] + lc * c[0]) / (2 * s2), iy = (la * a[1] + lb * b[1] + lc * c[1]) / (2 * s2), k = (rIn + 6) / rIn;
  const gross = pk.map(([x, y]) => [ix + (x - ix) * k, iy + (y - iy) * k]);
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(gross.map(([x, y]) => new THREE.Vector2(x - W / 2, H / 2 - y))), { depth: 1.6, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 });
  geo.rotateX(-PI / 2);
  const [p0, p1, p2] = pk, [b0, b1, b2] = SCHLEUDER_BILD, det = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + W / 2, y = pos.getZ(i) + H / 2;
    const s = ((x - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (y - p0[1])) / det, t = ((p1[0] - p0[0]) * (y - p0[1]) - (x - p0[0]) * (p1[1] - p0[1])) / det;
    uv.setXY(i, (b0[0] + s * (b1[0] - b0[0]) + t * (b2[0] - b0[0])) / 768, 1 - (b0[1] + s * (b1[1] - b0[1]) + t * (b2[1] - b0[1])) / 1376);
  }
  const mat = new THREE.MeshPhysicalMaterial({ map: schleuderTex, color: schleuderTex ? 0xffffff : 0xc41f2c, emissive: 0xffffff, emissiveMap: schleuderTex,
    emissiveIntensity: 0.5, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.1, transparent: true, opacity: 0.97 });
  const plastik = new THREE.Mesh(geo, mat); plastik.position.y = 27; plastik.castShadow = true; g.add(plastik);
  const birne = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd29a).multiplyScalar(5) }));
  birne.scale.y = 1.5; birne.position.copy(P(ix, iy, 6)); g.add(birne);
  scene.add(g); ebene(plastik, 0, 1); ebene(birne, 0, 1);
  return { sl, mat, bogen };
});

// ---------- Flipper ----------
function flipperGeo(r0, r1, hoehe, bt, bs, segs) {
  const s = Math.asin((r0 - r1) / Z.FL), sh = new THREE.Shape();
  sh.absarc(0, 0, r0, PI / 2 + s, PI * 1.5 - s, false); sh.absarc(Z.FL, 0, r1, -PI / 2 - s, PI / 2 + s, false); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: hoehe, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: segs, curveSegments: 18 });
  g.rotateX(-PI / 2); g.translate(0, bt, 0); return g;
}
const flipper3d = Z.flippers.map(f => {
  const g = new THREE.Group(); g.userData.beweglich = true;
  const gummi = new THREE.Mesh(flipperGeo(8.4, 4.9, 10.6, 1.2, 0.6, 3), M.gummiR); gummi.position.y = 0.6;
  const koerper = new THREE.Mesh(flipperGeo(4.6, 1.5, 6.6, 3.6, 2.2, 6), M.weiss); koerper.position.y = 0.8;
  const achse = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3, 16), M.chrom); achse.position.y = 15.6;
  for (const m of [gummi, koerper, achse]) { m.castShadow = true; m.receiveShadow = true; g.add(m); ebene(m, 0, 1); }
  scene.add(g); return { f, g };
});

// ---------- Pop-Bumper: schwarzer Sockel, Chromring, durchscheinende rote Kappe mit Lampe, weißer Deckel ----------
const bumper3d = Z.bumpers.map(b => {
  const g = new THREE.Group(); g.position.copy(P(b.x, b.y));
  const sockel = new THREE.Mesh(new THREE.CylinderGeometry(b.r + 3, b.r + 4, 4, 32), M.schwarz); sockel.position.y = 2;
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(b.r + 2, b.r + 2.5, 3, 32, 1, true), M.chrom); rock.position.y = 6; rock.userData.beweglich = true;
  const kappeMat = new THREE.MeshPhysicalMaterial({ color: 0xc81a28, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0xff2030, emissiveIntensity: 0.3, transparent: true, opacity: 0.93 });
  kappeMat.onBeforeCompile = lackGedaempft;
  const kappe = new THREE.Mesh(new THREE.CylinderGeometry(b.r * 0.92, b.r + 0.6, 13, 32), kappeMat); kappe.position.y = 14;
  const deckel = new THREE.Mesh(new THREE.CylinderGeometry(b.r * 0.82, b.r * 0.92, 3, 32), M.weiss); deckel.position.y = 22;
  const stern = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 1.2, 6), M.chrom); stern.position.y = 24;
  for (const m of [sockel, rock, kappe, deckel, stern]) { m.castShadow = true; m.receiveShadow = true; g.add(m); ebene(m, 0, 1); }
  scene.add(g); return { b, kappeMat, rock };
});

// ---------- Rampen: Drahtrampen entlang der Tunnelbahnen (Höhe wie drei.js), mit Bügeln, Stützen und Einfahrtsblech ----------
const RAMPE_SPITZE = [72, 46];
const rampenHoehe = (i, t) => RAMPE_SPITZE[i] * Math.pow(Math.sin(PI * Math.min(1, t)), 0.8);
Z.ramps.forEach((r, i) => {
  const N = 90, mittel = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N, [x, y] = Z.bez(r.pfad, t), [x2, y2] = Z.bez(r.pfad, Math.min(1, t + 0.01)), [x0, y0] = Z.bez(r.pfad, Math.max(0, t - 0.01));
    let dx = x2 - x0, dy = y2 - y0; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    mittel.push({ x, y, h: rampenHoehe(i, t) + R, nx: -dy, ny: dx, t });
  }
  for (const [quer, tief, rd] of [[-5.2, -7.3, 0.8], [5.2, -7.3, 0.8], [-10.5, 2, 0.75], [10.5, 2, 0.75]]) {
    const pts = mittel.map(p => P(p.x + p.nx * quer, p.y + p.ny * quer, Math.max(0.8, p.h + tief)));
    const draht = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, rd, 8), M.chrom);
    draht.castShadow = true; scene.add(ebene(draht, 0, 1));
  }
  for (let k = 3; k < N; k += 5) {
    const p = mittel[k], bug = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.7, 6, 20, PI), M.chrom);
    bug.position.copy(P(p.x, p.y, p.h - 1)); bug.rotation.set(PI, -Math.atan2(p.ny, p.nx), 0, 'YXZ'); bug.castShadow = true; scene.add(bug);
    if (p.h > 18 && k % 10 === 3) for (const sd of [-1, 1]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, p.h - 11, 8), M.chrom);
      st.position.copy(P(p.x + p.nx * 10.5 * sd, p.y + p.ny * 10.5 * sd, (p.h - 11) / 2)); st.castShadow = true; scene.add(st);
    }
  }
  const [x0, y0] = Z.bez(r.pfad, 0), [x1, y1] = Z.bez(r.pfad, 0.04);
  const ein = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 18), M.stahl);
  ein.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, 1.2)); ein.rotation.y = -Math.atan2(y1 - y0, x1 - x0) + PI / 2; ein.receiveShadow = true; scene.add(ein);
});

// ---------- Schädel (aufrecht, nach hinten geneigt), Augen glühen; Klappziel davor; Mulde ----------
const augen = [];
if (schaedelBild) {
  const sw = 66, sh = sw * schaedelBild.naturalHeight / schaedelBild.naturalWidth;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshStandardMaterial({ map: bildTex(schaedelBild, 288, 422), transparent: true, alphaTest: 0.02, roughness: 0.4, metalness: 0.3 }));
  m.geometry.translate(0, sh / 2, 0); m.position.copy(P(Z.SKULL.x, Z.SKULL.y - 6, 3)); m.rotation.x = -32 * PI / 180; m.castShadow = true;
  for (const ax of [0.268, 0.723]) {
    const a = new THREE.Sprite(new THREE.SpriteMaterial({ map: augenTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    a.scale.set(24, 24, 1); a.position.set(ax * sw - sw / 2, 0.403 * sh, 2); m.add(a); augen.push(a);
  }
  scene.add(ebene(m, 0, 1));
}
const ziele = (() => {
  const teil = (geo, mat, x, y, h, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.copy(P(x, y, h)); m.rotation.set(rx, 0, rz); m.castShadow = true; m.receiveShadow = true; scene.add(ebene(m, 0, 1)); return m; };
  const d0 = Z.drops[0], d2 = Z.drops[Z.drops.length - 1];
  teil(new THREE.BoxGeometry(d2.x - d0.x + 24, 6, 4), M.schwarz, (d0.x + d2.x) / 2, d0.y - 3.5, 3);
  const rot = Z.drops.map(d => {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xc8202e, roughness: 0.3, clearcoat: 1, emissive: 0xff3040, emissiveIntensity: 0.1 }); mat.onBeforeCompile = lackGedaempft;
    teil(new THREE.BoxGeometry(3, 8, 2), M.schwarz, d.x, d.y - 2, 4);
    teil(new THREE.CylinderGeometry(9, 9, 2.6, 32), mat, d.x, d.y, 11, PI / 2);
    teil(new THREE.SphereGeometry(1.8, 12, 8), M.chrom, d.x, d.y + 1.4, 11);
    return { d, mat };
  });
  const orange = Z.standups.map(st => {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xff8a1a, roughness: 0.3, clearcoat: 1, emissive: 0xff7a10, emissiveIntensity: 0 }); mat.onBeforeCompile = lackGedaempft;
    teil(new THREE.BoxGeometry(4, 15, st.h), mat, st.x + 1, st.y, 9);
    teil(new THREE.BoxGeometry(7, 4, st.h + 2), M.schwarz, st.x + 3, st.y, 2);
    return { st, mat };
  });
  const weissZ = Z.rund.map(r => {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xeef1f4, roughness: 0.3, clearcoat: 1, emissive: 0xffd23a, emissiveIntensity: 0 }); mat.onBeforeCompile = lackGedaempft;
    teil(new THREE.BoxGeometry(2, 9, 2), M.schwarz, r.x + 1, r.y, 4.5);
    teil(new THREE.CylinderGeometry(6, 6, 2.6, 24), mat, r.x + 3, r.y, 9, 0, PI / 2);
    return { r, mat };
  });
  const sd = Z.sdrop, klapp = new THREE.Group(); klapp.userData.beweglich = true;
  const platte = new THREE.Mesh(new THREE.BoxGeometry(sd.x1 - sd.x0 - 4, 14, 3), M.chrom); platte.position.y = 7; platte.castShadow = true;
  const lampeMat = new THREE.MeshStandardMaterial({ color: 0x5a1a20, emissive: 0x2fe07a, emissiveIntensity: 0 });
  const lampe = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 1), lampeMat); lampe.position.set(0, 8, 1.8);
  klapp.add(platte, lampe); klapp.position.copy(P((sd.x0 + sd.x1) / 2, sd.y)); scene.add(klapp); ebene(platte, 0, 1);
  const mring = new THREE.Mesh(new THREE.TorusGeometry(10.5, 1.8, 10, 32), M.chrom); mring.rotation.x = PI / 2; mring.position.copy(P(Z.MULDE.x, Z.MULDE.y, 1)); scene.add(ebene(mring, 0, 1));
  const lring = new THREE.Mesh(new THREE.TorusGeometry(11.5, 1.4, 10, 32), M.chrom); lring.rotation.x = PI / 2; lring.position.copy(P(Z.SKULL.x, Z.SKULL.y, 1)); scene.add(ebene(lring, 0, 1));
  let tiefe = 0;
  return () => {
    for (const { d, mat } of rot) mat.emissiveIntensity = 0.1 + 1.8 * (d.an ? 1 : d.blitz);
    for (const { st, mat } of orange) mat.emissiveIntensity = st.an ? 0.9 : 0;
    Z.rund.forEach((r, k) => { weissZ[k].mat.emissiveIntensity = r.blitz > 0 ? 1.6 : Z.kanone.ziel === k ? 0.9 : 0; });
    tiefe += ((sd.unten ? -15 : 0) - tiefe) * 0.3; klapp.position.y = tiefe; klapp.visible = tiefe > -14.5;
    lampeMat.emissiveIntensity = Z.gunLit ? 1.6 : 0.2; lampeMat.emissive.setHex(Z.gunLit ? 0x2fe07a : 0x8a1e2b);
  };
})();

// ---------- Kanone rechts (Form wie drei.js): dreht mit kanone.a; geladen glüht sie, Ziellinie und Feuer-Ring ----------
const kanone3d = (() => {
  const g = new THREE.Group(), L = Z.K_LAUF;
  const dunkel = new THREE.MeshStandardMaterial({ color: 0x6d7c8e, metalness: 0.85, roughness: 0.28 });
  const blauGlut = new THREE.MeshStandardMaterial({ color: 0x1d5fb8, emissive: 0x3d8fff, emissiveIntensity: 1.2, roughness: 0.3 });
  const teller = new THREE.Mesh(new THREE.CylinderGeometry(21, 23, 4, 40), dunkel); teller.position.y = 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(19, 1.5, 10, 48), blauGlut); ring.rotation.x = PI / 2; ring.position.y = 4.4;
  const kranz = new THREE.Mesh(new THREE.CylinderGeometry(15, 17, 4, 32), M.chrom); kranz.position.y = 6.5;
  const dreh = new THREE.Group(); dreh.position.y = 8.5; dreh.userData.beweglich = true;
  const prof = new THREE.Shape();
  prof.moveTo(-15, 0); prof.lineTo(-15, 9); prof.lineTo(-8, 15); prof.lineTo(6, 15.5); prof.lineTo(15, 11); prof.lineTo(15, 4); prof.lineTo(11, 0); prof.closePath();
  const gehGeo = new THREE.ExtrudeGeometry(prof, { depth: 20, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 1.4, bevelSegments: 2 }); gehGeo.translate(0, 0, -10);
  const kuppel = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12, 0, PI * 2, 0, PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x9fd0ff, metalness: 0.2, roughness: 0.05, clearcoat: 1, emissive: 0x2a6fd0, emissiveIntensity: 0.6 }));
  kuppel.position.set(-3, 15.5, 0); kuppel.scale.y = 0.7;
  const mantel = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.8, 16, 24), M.chrom); mantel.rotation.z = PI / 2; mantel.position.set(22, 9, 0);
  const rohr = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.4, L - 6, 20), M.stahl); rohr.rotation.z = PI / 2; rohr.position.set(12 + (L - 6) / 2 + 3, 9, 0);
  const muendung = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5, 4.5, 24), dunkel); muendung.rotation.z = PI / 2; muendung.position.set(L + 4, 9, 0);
  const kernMat = new THREE.MeshStandardMaterial({ color: 0x300808, emissive: 0xff3a2a, emissiveIntensity: 0 });
  const kern = new THREE.Mesh(new THREE.CircleGeometry(3.4, 20), kernMat); kern.rotation.y = PI / 2; kern.position.set(L + 6.3, 9, 0);
  // Ziellinie: gestrichelter Leuchtstreifen in Schussrichtung (nur geladen)
  const strich = document.createElement('canvas'); strich.width = 64; strich.height = 4;
  { const sg = strich.getContext('2d'); sg.fillStyle = '#fff'; sg.fillRect(0, 0, 36, 4); }
  const strichTex = new THREE.CanvasTexture(strich); strichTex.wrapS = THREE.RepeatWrapping; strichTex.repeat.set(26, 1);
  const linieMat = new THREE.MeshBasicMaterial({ map: strichTex, color: new THREE.Color(1, 0.25, 0.2).multiplyScalar(2.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const linie = new THREE.Mesh(new THREE.PlaneGeometry(260, 1.8), linieMat); linie.rotation.x = -PI / 2; linie.position.set(L + 12 + 130, -8, 0);
  dreh.add(new THREE.Mesh(gehGeo, dunkel), kuppel, mantel, rohr, muendung, kern, linie);
  const feuerMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.2, 0.15).multiplyScalar(2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const feuerRing = new THREE.Mesh(new THREE.TorusGeometry(30, 1.2, 8, 48), feuerMat); feuerRing.rotation.x = PI / 2; feuerRing.position.y = 1;
  g.add(teller, ring, kranz, dreh, feuerRing); g.position.copy(P(Z.kanone.x, Z.kanone.y)); scene.add(g);
  g.traverse(o => { if (o.isMesh && o !== linie && o !== feuerRing) { o.castShadow = true; ebene(o, 0, 1); } });
  return { dreh, kernMat, blauGlut, linie, feuerRing, feuerMat };
})();

// ---------- Abzug: Ring um die wartende Kugel, Kraftbalken in der Rinne; Zeiger der Bodenuhr ----------
const abzug3d = (() => {
  const leucht = farbe => new THREE.MeshBasicMaterial({ color: new THREE.Color(farbe).multiplyScalar(2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const ringMat = leucht(0xff4636);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 4, 0.9, 8, 40), ringMat); ring.rotation.x = PI / 2; ring.position.copy(P(Z.SHOOT_X, Z.SHOOT_Y, 1)); scene.add(ebene(ring, 2));
  const y0 = 700, y1 = 320, hh = y0 - y1, FZ = Z.FZ;
  const zonen = [[0, FZ[0], 0xff4636], [FZ[0], FZ[1], 0x46ff82], [FZ[1], FZ[2], 0xffdc3c], [FZ[2], 1, 0xebf0ff]].map(([a, b, f]) => {
    const grund = new THREE.Mesh(new THREE.PlaneGeometry(10, (b - a) * hh), leucht(f)); grund.rotation.x = -PI / 2; grund.position.copy(P(Z.SHOOT_X, y0 - (a + b) / 2 * hh, 0.4)); scene.add(ebene(grund, 2));
    const voll = new THREE.Mesh(new THREE.PlaneGeometry(10, 1), leucht(f)); voll.rotation.x = -PI / 2; scene.add(ebene(voll, 2));
    return { a, b, grund, voll };
  });
  const zeigerMat = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff9a2e, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.4 });
  const zeiger = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 2.6), zeigerMat); zeiger.geometry.translate(11, 0, 0);
  const zeigerG = new THREE.Group(); zeigerG.userData.beweglich = true; zeigerG.position.copy(P(188, 500, 0.9)); zeigerG.add(zeiger); scene.add(zeigerG);
  const nabe = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 2, 16), M.chrom); nabe.position.copy(P(188, 500, 1.2)); scene.add(nabe);
  return () => {
    const zt = Z.zeit, puls = 0.55 + 0.45 * Math.sin(zt * 6), f = Z.feder, bereit = Z.abschussBereit();
    const gespannt = f.an && f.t >= Z.TIPP_T, zone = f.c < FZ[0] ? 0 : f.c < FZ[1] ? 1 : f.c < FZ[2] ? 2 : 3;
    ringMat.opacity = bereit ? (gespannt ? 1 : puls) : 0;
    ringMat.color.set([0xff4636, 0x46ff82, 0xffdc3c, 0xebf0ff][gespannt ? zone : 0]).multiplyScalar(2);
    ring.scale.setScalar(1 + (gespannt ? 0.7 * f.c : 0.12 * puls));
    for (const z of zonen) {
      z.grund.material.opacity = f.an ? 0.18 : 0;
      const bis = Math.min(f.c, z.b), an = f.an && f.c > z.a;
      z.voll.visible = an; z.voll.material.opacity = 0.95;
      if (an) { const l = (bis - z.a) * hh; z.voll.scale.y = Math.max(0.01, l); z.voll.position.copy(P(Z.SHOOT_X, y0 - z.a * hh - l / 2, 0.5)); }
    }
    const geholt = Z.uhr.geholt;
    zeigerG.rotation.y = PI / 2 + (6 - geholt) * 0.42;             // −π/2 − (6 − geholt) · 0,42 im Tisch, gespiegelt um die Bildachse
    zeigerMat.emissive.setHex(geholt >= 5 ? 0xff3a3a : 0xff9a2e);
  };
})();

// ---------- Lampen, die Licht werfen ----------
const lichtL = [];
const licht = (o, basis) => { scene.add(ebene(o, 0, 1, 2)); lichtL.push({ o, basis }); return o; };
licht(new THREE.HemisphereLight(0x8090b0, 0x140c08, 0.12), 0.12);
for (const [x, y, h, st] of [[86, 606, 12, 2600], [290, 606, 12, 2600], [24, 520, 16, 2600], [376, 520, 16, 2600], [202, 70, 30, 3200], [220, 180, 40, 2400]]) {
  const l = new THREE.PointLight(0xffc88a, st, 460, 1.7); l.position.copy(P(x, y, h)); licht(l, st);
}
for (const [x, y, h] of [[24, 520, 16], [376, 520, 16], [26, 640, 10], [350, 560, 10], [24, 300, 16], [376, 300, 16]]) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(2.3, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd6a0).multiplyScalar(6) }));
  b.scale.y = 1.5; b.position.copy(P(x, y, h)); scene.add(ebene(b, 0, 1));
}
const schattenLicht = (pos, ziel, st) => {
  const s = new THREE.SpotLight(0xfff0dc, st, 3000, 0.75, 0.85, 0); s.position.copy(pos); s.target.position.copy(ziel);
  s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.6;
  s.shadow.camera.near = 80; s.shadow.camera.far = 2000; licht(s, st); scene.add(s.target); return s;
};
// Raumleuchte über dem Spieler, zweite seitlich: ihre Spiegelbilder im Lack liegen außerhalb des Bildes (Echt-Stück)
schattenLicht(P(170, 820, 700), P(200, 400), 1.0);
schattenLicht(P(600, 420, 260), P(170, 400), 0.6);
const blitzer = new THREE.PointLight(0xffd0b0, 0, 420, 1.5); scene.add(ebene(blitzer, 0, 1, 2));

// ---------- Kugeln: Live-Spiegelung (Würfelkamera an der vordersten Kugel), Kontaktschatten, Bewegungsunschärfe ----------
const wuerfelZiel = new THREE.WebGLCubeRenderTarget(128, { type: TYP, generateMipmaps: false });
const wuerfel = new THREE.CubeCamera(1.5, 3000, wuerfelZiel);
for (const c of wuerfel.children) c.layers.set(1);
const kugelMat = new THREE.MeshPhongMaterial({ color: 0x0c0c0c, specular: 0xffffff, shininess: 260, envMap: wuerfelZiel.texture, combine: THREE.AddOperation, reflectivity: 0.85 });
const kugelGeo = new THREE.SphereGeometry(R, 40, 28);
const geistMats = [0.38, 0.22, 0.1].map(o => { const m = kugelMat.clone(); m.transparent = true; m.opacity = o; m.depthWrite = false; return m; });
const fleckGeo = new THREE.PlaneGeometry(R * 2.6, R * 2.6); fleckGeo.rotateX(-PI / 2);
const kugeln = [];
function kugelTeile(i) {
  while (kugeln.length <= i) {
    const m = new THREE.Mesh(kugelGeo, kugelMat); m.castShadow = true; scene.add(m);
    const fleck = new THREE.Mesh(fleckGeo, new THREE.MeshBasicMaterial({ map: fleckTex, transparent: true, depthWrite: false })); scene.add(ebene(fleck, 2, 1));
    const geister = geistMats.map(gm => { const g = new THREE.Mesh(kugelGeo, gm); g.visible = false; scene.add(g); return g; });
    kugeln.push({ m, fleck, geister, vorher: null });
  }
  return kugeln[i];
}
for (const [b, h, farbe, x, y, z] of [[320, 40, 0xfff1dc, 200, 470, 520], [120, 80, 0xbfd4ff, -140, 380, 360], [90, 90, 0xffd6b0, 560, 520, 330]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(b, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(farbe).multiplyScalar(2.2), side: THREE.DoubleSide }));
  m.position.copy(P(x, y, z)); m.lookAt(P(200, 600, 0)); ebene(m, 1); scene.add(m);   // Raumlicht über dem Tisch, nur in der Kugel-Spiegelung
}
function kugelLage(b) {               // 3D-Lage der Kugel (null = nicht sichtbar)
  if (b.weg) return null;
  if (b.rampe) { const t = Math.min(1, b.rampe.t / Z.RAMP_T), i = Z.ramps.indexOf(b.rampe.r), [x, y] = Z.bez(b.rampe.r.pfad, t); return P(x, y, rampenHoehe(i, t) + R); }
  if (b.kanone) return P(b.x, b.y, R + 16);
  if (b.halt > 0) return P(b.x, b.y, R - 7);                     // im Loch (Schädel, Mulde): halb versenkt
  if (b.y > 722 && b.x < Z.LANE_X) return b.y > 742 ? null : P(b.x, b.y, R - (b.y - 722) * 0.9);   // unter der Schürze in den Abfluss (nicht in der Rinne)
  return P(b.x, b.y, R);
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
composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.38, 0.4, hdr ? 1.0 : 0.85));
composer.addPass(new OutputPass());

// ---------- Kopfteil: Hinterglas (kopf.jpg) mit Uhr – Strudel dreht, Zeiger auf fünf vor zwölf (im Multiball drehen sie), Augen glimmen –,
// darunter die Punktmatrix als Bildschirm. Steht hinter dem Tisch; hochkant sichtbar, quer nur oben im Bild ----------
const kopfteil = (() => {
  const g = new THREE.Group(); g.userData.beweglich = true; const B = W + 24, IW = B - 14, IH = IW * 890 / 1768, DW = B - 24, DH = DW / 4, HT = 12 + DH + 10 + IH + 10;
  const kasten = new THREE.Mesh(new THREE.BoxGeometry(B + 10, HT, 46), M.holz); kasten.position.set(0, HT / 2, -23); g.add(kasten);
  const rahmenMat = new THREE.MeshStandardMaterial({ color: 0xc8d2dc, metalness: 1, roughness: 0.25 });
  const leiste = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), rahmenMat); m.position.set(x, y, 1); g.add(m); };
  leiste(B + 12, 3, 0, HT); leiste(B + 12, 3, 0, 0); leiste(3, HT, -(B + 10) / 2, HT / 2); leiste(3, HT, (B + 10) / 2, HT / 2); leiste(B + 12, 3, 0, 12 + DH + 5);
  const dmdTex = new THREE.CanvasTexture(document.getElementById('dmd')); dmdTex.colorSpace = THREE.SRGBColorSpace; dmdTex.anisotropy = 4;
  const schirm = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), new THREE.MeshBasicMaterial({ map: dmdTex, color: new THREE.Color(1.3, 1.3, 1.3) }));
  schirm.position.set(0, 12 + DH / 2, 0.6); g.add(schirm);
  let bildG = null, strudel = null, zM = null, zH = null; const augenK = [];
  if (kopfBild) {
    const bild = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), new THREE.MeshBasicMaterial({ map: bildTex(kopfBild, 1768, 890) }));
    bild.position.set(0, 12 + DH + 10 + IH / 2, 0.6); g.add(bild); bildG = bild;
    const s = IW / 1768, uhr = new THREE.Group(); uhr.position.set((886 - 884) * s, (445 - 319) * s, 0.2); bild.add(uhr);   // Uhrmitte 886/319 im Bild
    const teil = (img, seite, z) => {
      if (!img) return null;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(seite, seite), new THREE.MeshBasicMaterial({ map: bildTex(img, img.naturalWidth, img.naturalHeight), transparent: true, depthWrite: false }));
      m.position.z = z; uhr.add(m); return m;
    };
    strudel = teil(strudelBild, 2 * 191 * s, 0.1);
    zH = teil(zeigerH, 2 * 125 / 0.967 * s, 0.3); zM = teil(zeigerM, 2 * 190 / 0.985 * s, 0.5); teil(zeigerN, 2 * 17 * 90 / 78.5 * s, 0.7);
    for (const [x, y, r] of [[485, 310, 46], [612, 305, 40]]) {
      const a = new THREE.Mesh(new THREE.PlaneGeometry(2 * r * s, 2 * r * s), new THREE.MeshBasicMaterial({ map: augenTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
      a.position.set((x - 884) * s, (445 - y) * s, 0.4); bild.add(a); augenK.push(a);
    }
  }
  g.rotation.x = -8 * PI / 180; g.position.copy(P(W / 2, -32, 60)); scene.add(g);                 // steht auf der Rückwand (60 hoch)
  g.traverse(o => { if (o.isMesh) ebene(o, 0, 1); });
  let stand = -1, mW = 55 / 60 * 2 * PI, hW = (11 + 55 / 60) / 12 * 2 * PI;
  return {
    g, HT, B,
    schritt(dt) {
      if (window.__dmdStand !== stand) { stand = window.__dmdStand; dmdTex.needsUpdate = true; }
      if (strudel) strudel.rotation.z -= dt * (Z.multiball ? 2.6 : 0.6);
      if (Z.multiball) { mW += dt * PI; hW -= dt * PI * 0.6; } else { mW += (55 / 60 * 2 * PI - mW) * Math.min(1, dt * 4); hW += ((11 + 55 / 60) / 12 * 2 * PI - hW) * Math.min(1, dt * 4); }
      if (zM) zM.rotation.z = -mW; if (zH) zH.rotation.z = -hW;
      const glut = Z.multiball ? 1 : 0.45 + 0.2 * Math.sin(Z.zeit * 2.2);
      for (const a of augenK) a.material.opacity = glut;
    },
  };
})();

// ---------- 0.98: feste Teile zusammenfassen – gleiches (unveränderliches) Material, gleiche Ebenen und Schatten-Einstellung → ein Zeichenaufruf ----------
// Gemessen 0.97 (Stufe 4): ~850 Zeichenaufrufe je Bild – Hauptbild 367, zwei Schattenbilder je 203, Kugel-Spiegelung 130. Auf dem iPhone ist das der
// Engpass, nicht die Auflösung (1× lief nur mit 52–56 fps). Bewegliche Teile (userData.beweglich, auch an Eltern) und Materialien, die sich ändern, bleiben einzeln.
function verschmelze(geos) {
  const namen = ['position', 'normal', 'uv'], breite = { position: 3, normal: 3, uv: 2 };
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const arr = Object.fromEntries(namen.map(n => [n, new Float32Array(nv * breite[n])])), idx = new (nv > 65535 ? Uint32Array : Uint16Array)(ni);
  let ov = 0, oi = 0;
  for (const g of geos) {
    const c = g.attributes.position.count;
    for (const n of namen) {
      const a = g.attributes[n]; if (!a) continue;
      for (let i = 0; i < c; i++) { const o = (ov + i) * breite[n]; arr[n][o] = a.getX(i); arr[n][o + 1] = a.getY(i); if (breite[n] === 3) arr[n][o + 2] = a.getZ(i); }
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi++] = g.index.getX(i) + ov; else for (let i = 0; i < c; i++) idx[oi++] = ov + i;
    ov += c;
  }
  const out = new THREE.BufferGeometry();
  for (const n of namen) out.setAttribute(n, new THREE.BufferAttribute(arr[n], breite[n]));
  out.setIndex(new THREE.BufferAttribute(idx, 1)); out.computeBoundingSphere(); return out;
}
const zusammengefasst = (() => {
  scene.updateMatrixWorld(true);
  const festMat = new Set(Object.values(M)), gruppen = new Map();
  scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible || Array.isArray(o.material) || !(festMat.has(o.material) || o.material.userData.fest)) return;
    for (let p = o; p; p = p.parent) if (p.userData.beweglich) return;
    if (o.matrixWorld.determinant() <= 0 || !o.geometry.attributes.normal) return;
    const k = [o.material.uuid, o.layers.mask, o.castShadow, o.receiveShadow].join('|');
    if (!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(o);
  });
  let vorher = 0, nachher = 0;
  for (const liste of gruppen.values()) {
    vorher += liste.length; nachher++;
    if (liste.length < 2) continue;
    const m = new THREE.Mesh(verschmelze(liste.map(o => o.geometry.clone().applyMatrix4(o.matrixWorld))), liste[0].material);
    m.layers.mask = liste[0].layers.mask; m.castShadow = liste[0].castShadow; m.receiveShadow = liste[0].receiveShadow; m.matrixAutoUpdate = false;
    for (const o of liste) o.removeFromParent();
    scene.add(m);
  }
  return { vorher, nachher };
})();

// ======================================================================================================================
// Kamera: hochkant ganzer Tisch (50°), quer Spielerblick (30°), der der untersten Kugel folgt
// ======================================================================================================================
// 0.98: Schärfe zuerst – die Auflösung sinkt erst, nachdem Bodenspiegel und Kugel-Spiegelung schon reduziert sind; Start 1,5×, darf auf 1,75×/2× steigen
const STUFEN = [{ dpr: 2, spiegel: 0.5, seiten: 3 }, { dpr: 1.75, spiegel: 0.5, seiten: 2 }, { dpr: 1.5, spiegel: 0.4, seiten: 2 },
  { dpr: 1.5, spiegel: 0, seiten: 1 }, { dpr: 1.25, spiegel: 0, seiten: 1 }, { dpr: 1, spiegel: 0, seiten: 1 }];
let stufe = Math.max(0, Math.min(STUFEN.length - 1, (+new URLSearchParams(location.search).get('stufe') || 3) - 1));
const kam = { quer: false, dir: new THREE.Vector3(), dist: 900, zielUnten: new THREE.Vector3(), weg: 0, folge: 0 };
function passe(ecken, neig, unten) {   // Abstand und Ziel so, dass alle Ecken ins Bild passen (unten bündig)
  kam.dir.set(0, Math.sin(neig), Math.cos(neig));
  const ziel = P(200, unten ? 600 : 380);
  const proj = d => {
    camera.position.copy(ziel).addScaledVector(kam.dir, d); camera.lookAt(ziel); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const e of ecken) { const v = e.clone().project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    return { x0, x1, y0, y1 };
  };
  let dist = 900;
  for (let r = 0; r < 10; r++) {
    let lo = 100, hi = 6000;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, b = proj(m); if (b.x0 < -1 || b.x1 > 1 || b.y0 < -1.02 || b.y1 > 1) lo = m; else hi = m; }
    dist = hi; const b = proj(dist);
    ziel.z -= unten ? (b.y0 + 1.02) * 120 : (b.y0 + b.y1) / 2 * 200;
  }
  proj(dist);
  return { dist, ziel };
}
function einpassen() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setPixelRatio(Math.min(STUFEN[stufe].dpr, devicePixelRatio || 1)); renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  const db = renderer.getDrawingBufferSize(new THREE.Vector2()), sf = STUFEN[stufe].spiegel || 0.25;
  spiegelZiel.setSize(Math.max(1, Math.round(db.x * sf)), Math.max(1, Math.round(db.y * sf)));
  camera.aspect = w / h;
  kam.quer = w > h * 1.15;
  document.body.classList.toggle('echt-quer', kam.quer);
  if (kam.quer) {
    kopfteil.g.scale.setScalar(1);
    // Fenster über das untere Feld (y 368…768); nach oben folgt die Kamera bis an den Bogen (Verschiebung bis 374)
    const r = passe([P(8, 368, 0), P(392, 368, 0), P(4, 768, 22), P(396, 768, 22), P(4, 768, 0), P(396, 768, 0)], 30 * PI / 180, true);
    kam.dist = r.dist; kam.zielUnten.copy(r.ziel); kam.weg = 374;
  } else {
    const tisch = [P(4, -4, 20), P(396, -4, 20), P(4, 768, 22), P(396, 768, 22), P(4, 768, 0), P(396, 768, 0)];
    const d0 = passe(tisch, 50 * PI / 180, true).dist;
    let r = null;
    for (let s = 1; s >= 0.3; s -= 0.05) {                       // Kopfteil so groß wie möglich, Tisch höchstens 3,5 % kleiner
      kopfteil.g.scale.setScalar(s); kopfteil.g.updateMatrixWorld(true);
      const oben = [-1, 1].map(sd => kopfteil.g.localToWorld(new THREE.Vector3(sd * (kopfteil.B + 12) / 2, kopfteil.HT, 0)));
      r = passe([...tisch, ...oben], 50 * PI / 180, true);
      if (r.dist <= d0 * 1.035) break;
    }
    kam.dist = r.dist; kam.zielUnten.copy(r.ziel); kam.weg = 0;
  }
  kamSetzen();
}
function kamSetzen() {
  const ziel = kam.zielUnten.clone(); ziel.z -= kam.folge;
  camera.position.copy(ziel).addScaledVector(kam.dir, kam.dist); camera.lookAt(ziel); camera.updateMatrixWorld();
}
window.addEventListener('resize', () => setTimeout(einpassen, 50));
einpassen();

// ---------- Tipp → Tischkoordinaten (für Abzug, Kanone, Pause) ----------
const ray = new THREE.Raycaster(), tischEbene = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), treffer = new THREE.Vector3();
window.__ZT3D = {
  bildschirm(x, y, h = 0) { const v = P(x, y, h).project(camera), r = gl.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
  rampenHoehe,
  tischPunkt(cx, cy) {
    const r = gl.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    if (!ray.ray.intersectPlane(tischEbene, treffer)) return { x: -999, y: -999 };
    return { x: treffer.x + W / 2, y: treffer.z + H / 2 };
  },
};

// ======================================================================================================================
// Schleife
// ======================================================================================================================
const fpsAnz = document.createElement('div');
Object.assign(fpsAnz.style, { position: 'fixed', left: 'calc(env(safe-area-inset-left, 0px) + 6px)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)', zIndex: 5,
  font: '600 11px system-ui, sans-serif', color: 'rgba(200,220,255,.6)', pointerEvents: 'none', textShadow: '0 1px 2px #000' });
document.body.appendChild(fpsAnz);
let letzt = performance.now(), bilder = 0, mStart = performance.now(), langsam = 0, flott = 0, warm = performance.now() + 5000, flaeche = 0, nr = 0, probe = null;
// 0.98: Sperren nur auf Zeit (vorher für immer – ein einzelner Ruckler hielt die App bis zum Neustart auf der schlechtesten Stufe, iPhone-Screenshot 0.97)
const gesperrt = new Map(), weg = new THREE.Vector3();
function messen(jetzt) {
  bilder++;
  if (jetzt - mStart < 1500) return;
  const fps = bilder * 1000 / (jetzt - mStart); bilder = 0; mStart = jetzt;
  if (jetzt > warm && !window.__ZT_FEST) {
    // 0.99 (iPhone 0.98: 57 fps auf 1× – Aufstieg verlangte 58 und kam nie): Probe nach oben schon ab 55 fps; sie gilt, wenn die Bildrate danach
    // höchstens 2,5 fps niedriger ist (wo die Auflösung nichts kostet, steigt die Schärfe ohne Bildverlust), sonst zurück und 3 min Sperre
    if (probe) {
      if (fps < Math.max(52, probe.vorher - 2.5)) { gesperrt.set(stufe, jetzt + 180000); stufe++; probe = null; langsam = flott = 0; einpassen(); warm = jetzt + 3000; }
      else if (++probe.gut >= 2) probe = null;
    } else if (fps < 52) { flott = 0; if (++langsam >= 2 && stufe < STUFEN.length - 1) { langsam = 0; gesperrt.set(stufe, jetzt + 45000); stufe++; einpassen(); warm = jetzt + 3000; } }
    else { langsam = 0; if (fps >= 55 && ++flott >= 4 && stufe > 0 && !((gesperrt.get(stufe - 1) || 0) > jetzt)) { flott = 0; probe = { vorher: fps, gut: 0 }; stufe--; einpassen(); warm = jetzt + 3000; } }
  }
  fpsAnz.textContent = `${Math.round(fps)} fps · Stufe ${stufe + 1}/${STUFEN.length} · ${STUFEN[stufe].dpr}×`;
}

function bild(jetzt) {
  const dt = Math.min(0.05, (jetzt - letzt) / 1000); letzt = jetzt; nr++;
  messen(jetzt);
  einsaetze();
  ziele();
  abzug3d();
  kopfteil.schritt(dt);
  // Teile nachführen
  for (const { f, g } of flipper3d) { const t = Z.tip(f); g.position.copy(P(f.px, f.py)); g.rotation.y = Math.atan2(-(t.y - f.py), t.x - f.px); }
  for (const s of schleudern) { s.mat.emissiveIntensity = 0.5 + 2.2 * s.sl.flash; if (s.bogen) s.bogen(3.5 * Math.max(0, Math.min(1, s.sl.flash))); }
  for (const k of bumper3d) { k.kappeMat.emissiveIntensity = 0.3 + 2.6 * k.b.flash; k.rock.position.y = 6 - 2.5 * k.b.flash; }
  const K = Z.kanone, geladen = !!K.kugel;
  kanone3d.dreh.rotation.y = -K.a;
  kanone3d.kernMat.emissiveIntensity = geladen ? 1.4 + 0.8 * Math.sin(Z.zeit * 9) : 0;
  kanone3d.blauGlut.emissiveIntensity = geladen ? 2 : 1.1;
  kanone3d.linie.visible = geladen; kanone3d.feuerRing.visible = geladen;
  if (geladen) { const p = 0.55 + 0.45 * Math.sin(Z.zeit * 8); kanone3d.feuerMat.opacity = p; kanone3d.feuerRing.scale.setScalar(1 + 0.08 * p); kanone3d.linie.material.map.offset.x -= dt * 2; }
  const glut = Z.haelt() ? 1 : 0.35 + 0.3 * Math.sin(Z.zeit * 3);
  for (const a of augen) a.material.opacity = glut;
  // Licht: Grundbeleuchtung folgt dem Spiel (Jackpot-Flackern, Einbruch bei Treffern), Game over gedämpft
  const gi = Math.max(0.12, Math.min(1.4, Z.grundLicht()));
  for (const { o, basis } of lichtL) o.intensity = basis * gi;
  renderer.toneMappingExposure += ((Z.gameOver ? 0.55 : 1.05) - renderer.toneMappingExposure) * Math.min(1, dt * 3);
  let st = 0, wo = null, farbe = 0xffd0b0;
  for (const s of Z.slings) if (s.flash > st) { st = s.flash; const [a, b, c] = s.pts; wo = P((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, 36); farbe = 0xffd2b4; }
  for (const b of Z.bumpers) if (b.flash > st) { st = b.flash; wo = P(b.x, b.y, 34); farbe = 0xff4a3a; }
  if (Z.grundLicht() > 1.2) { st = 1.4; wo = P(200, 380, 200); farbe = 0xffffff; }
  blitzer.intensity = st > 0.02 ? 7000 * st : 0; if (wo) { blitzer.position.copy(wo); blitzer.color.setHex(farbe); }

  // Kugeln
  let probe = null, fokus = null;
  const bs = Z.balls;
  bs.forEach((b, i) => {
    const k = kugelTeile(i), lage = kugelLage(b);
    k.m.visible = !!lage; k.fleck.visible = false;
    if (!lage) { k.geister.forEach(g => { g.visible = false; }); k.vorher = null; return; }
    k.m.position.copy(lage);
    const hh = lage.y - R; k.fleck.visible = hh < 30 && hh > -8; k.fleck.position.set(lage.x, 0.3, lage.z); k.fleck.material.opacity = 0.85 * Math.max(0, 1 - Math.max(0, hh) / 30);
    if (k.vorher) {
      weg.subVectors(lage, k.vorher); const l = weg.length(), zeig = l > R * 0.7 && l < 150;
      k.geister.forEach((g, j) => { g.visible = zeig; if (zeig) g.position.copy(lage).addScaledVector(weg, -(j + 1) * 0.25); });
    }
    k.vorher = (k.vorher || new THREE.Vector3()).copy(lage);
    if (!probe || lage.z > probe.position.z) probe = k.m;
    if (!b.ruht && !b.kanone && (!fokus || b.y > fokus.y)) fokus = b;
  });
  for (let i = bs.length; i < kugeln.length; i++) { const k = kugeln[i]; k.m.visible = false; k.fleck.visible = false; k.geister.forEach(g => { g.visible = false; }); k.vorher = null; }
  // Quer: Kamera folgt der untersten Kugel im Spiel (weich), sonst unten
  if (kam.quer) {
    const by = fokus ? (fokus.rampe ? Z.bez(fokus.rampe.r.pfad, Math.min(1, fokus.rampe.t / Z.RAMP_T))[1] : fokus.y) : 700;
    const soll = Math.max(0, Math.min(kam.weg, 560 - by));
    kam.folge += (soll - kam.folge) * Math.min(1, dt * 2.6);
  } else kam.folge = 0;
  kamSetzen();
  if (probe) {
    probe.visible = false; for (const k of kugeln) k.geister.forEach(g => { g.userData.v = g.visible; g.visible = false; });
    wuerfel.position.copy(probe.position); wuerfel.updateMatrixWorld(true);
    const seiten = STUFEN[stufe].seiten;
    if (seiten >= 6 || nr % 97 === 0) wuerfel.update(renderer, scene);
    else { const alt = renderer.getRenderTarget(); for (let i = 0; i < seiten; i++) { renderer.setRenderTarget(wuerfelZiel, flaeche); renderer.render(scene, wuerfel.children[flaeche]); flaeche = (flaeche + 1) % 6; } renderer.setRenderTarget(alt); }
    probe.visible = true; for (const k of kugeln) k.geister.forEach(g => { g.visible = g.userData.v; });
  }
  if (STUFEN[stufe].spiegel) { spiegelStaerke.value = 1.7; bodenSpiegeln(); } else spiegelStaerke.value = 0;
  renderer.shadowMap.needsUpdate = true;
  composer.render(dt);
  requestAnimationFrame(bild);
}
wuerfel.update(renderer, scene);
requestAnimationFrame(bild);
