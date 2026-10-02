// Zero Time – 3D-Ansicht (Standard seit 0.54; flach mit „?2d“)
// Physik und Regeln bleiben in index.html (2D). Hier wird nur gezeichnet:
// Boden = die 2D-Zeichnung als Textur, darauf echte 3D-Teile (Chromschienen, Pfosten, Bumper, Flipper, Kugeln, Drahtrampen).
// Koordinaten: Tisch (x, y) → 3D (X = x − 200, Z = y − 380), Höhe = Y. Eine Tischeinheit = eine 3D-Einheit.
import * as THREE from './lib/three.module.min.js';

const Z = window.__ZT;
const { W, H, R } = Z;
const X0 = W / 2, Y0 = H / 2;
const P = (x, y, h = 0) => new THREE.Vector3(x - X0, h, y - Y0);

// ---------- Renderer, Szene, Kamera ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const GERAET_DPR = window.devicePixelRatio || 1;
const STUFEN = [2, 1.5, 1.25, 1];            // Auflösung; fällt automatisch, wenn die Bildrate einbricht
let stufe = 0;
renderer.setPixelRatio(Math.min(STUFEN[0], GERAET_DPR));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const gl = renderer.domElement;
gl.id = 'c3d';
Object.assign(gl.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', touchAction: 'none', display: 'block' });
stage.style.position = 'relative';
stage.appendChild(gl);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06080c);
try {                                       // Hintergrund wie die Seite, damit die Luft über dem Tisch nicht als schwarzer Kasten wirkt
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) scene.background = new THREE.Color(bg);
} catch (_) {}
const camera = new THREE.PerspectiveCamera(34, 1, 10, 6000);

// Umgebung für Spiegelungen: dunkler Raum mit ein paar hellen Leuchtflächen (selbst gebaut, keine fremde Bilddatei)
{
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x2a313d);
  const panel = (w, h, farbe, x, y, z, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(farbe).multiplyScalar(4), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m);
  };
  panel(8, 2, 0xffffff, 0, 6, 0, Math.PI / 2);           // Deckenlicht
  panel(2, 6, 0xbcd4ff, -7, 2, -2, 0, Math.PI / 2);       // kühles Seitenlicht links
  panel(2, 6, 0xffd9b0, 7, 2, 2, 0, -Math.PI / 2);        // warmes Seitenlicht rechts
  panel(10, 1.2, 0x9fb8ff, 0, 1, -8);                     // Streifen hinten
  panel(30, 30, 0x0a0c10, 0, -3, 0, Math.PI / 2);          // Boden (dunkel, wird ×4 aufgehellt)
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.02).texture;
}

// Licht: gedämpftes Grundlicht, ein Hauptlicht von vorn oben mit Schatten, zwei farbige Akzente
const hemi = new THREE.HemisphereLight(0xbfd6ff, 0x1a1410, 0.35);
scene.add(hemi);
const sonne = new THREE.DirectionalLight(0xfff4e6, 1.6);
sonne.position.set(-120, 700, 520);
sonne.target.position.set(0, 0, 0);
sonne.castShadow = true;
sonne.shadow.mapSize.set(1024, 1024);
Object.assign(sonne.shadow.camera, { left: -230, right: 230, top: 420, bottom: -420, near: 100, far: 1600 });
sonne.shadow.bias = -0.001;
sonne.shadow.normalBias = 0.8;
scene.add(sonne, sonne.target);
const akzentL = new THREE.PointLight(0x4f7dff, 900, 500, 1.6); akzentL.position.set(-200, 120, -200); scene.add(akzentL);
const akzentR = new THREE.PointLight(0xff5a3a, 700, 500, 1.6); akzentR.position.set(200, 120, 150); scene.add(akzentR);

// ---------- Materialien ----------
const chrom = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 1, roughness: 0.18 });
const stahl = new THREE.MeshStandardMaterial({ color: 0xaab5c2, metalness: 0.9, roughness: 0.32 });
const gummiSchwarz = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.7 });
const weiss = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.35 });
const gummiWeiss = new THREE.MeshStandardMaterial({ color: 0xefe9dc, roughness: 0.6 });
const gummiRot = new THREE.MeshStandardMaterial({ color: 0xc21f2f, roughness: 0.55 });
const holz = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.5, metalness: 0.3 });
const kugelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12, envMapIntensity: 1.4 });

// ---------- Boden: die 2D-Zeichnung als Textur ----------
const tex = new THREE.CanvasTexture(Z.cv);
tex.colorSpace = THREE.SRGBColorSpace;
tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
const bodenMat = new THREE.MeshStandardMaterial({
  map: tex, roughness: 0.42, metalness: 0.05, envMapIntensity: 0.25,
  emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5,      // Einsätze leuchten auch ohne Licht
});
const boden = new THREE.Mesh(new THREE.PlaneGeometry(W, H), bodenMat);
boden.rotation.x = -Math.PI / 2;
boden.receiveShadow = true;
scene.add(boden);

// Gehäuse: dunkle Seitenwände und Kopfleiste, vorn eine flache Blende
const kasten = (x, y, w, d, h, mat = holz) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.copy(P(x + w / 2, y + d / 2, h / 2)); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
};
kasten(-22, -22, 22, H + 44, 46);
kasten(W, -22, 22, H + 44, 46);
kasten(0, -22, W, 22, 46);
kasten(0, H, W, 22, 16);
{ // Chromkante oben auf den Seitenwänden
  const kante = new THREE.MeshStandardMaterial({ color: 0xc8d2dc, metalness: 1, roughness: 0.25 });
  for (const x of [-22, W]) { const m = new THREE.Mesh(new THREE.BoxGeometry(22, 3, H + 44), kante); m.position.copy(P(x + 11, Y0, 47.5)); scene.add(m); }
}

// ---------- Führungsbleche (alle Wände außer Schleuder-Schlagseiten) ----------
{
  const liste = Z.walls.filter(w => !w.kick && !w.schleuder);      // Schleudern baue ich als eigene Körper
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const inst = new THREE.InstancedMesh(geo, stahl, liste.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  liste.forEach((w, i) => {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, l = Math.hypot(dx, dy);
    const aussen = w.x1 <= 12.5 && w.x2 <= 12.5 || w.x1 >= 391.5 && w.x2 >= 391.5;
    const hoch = aussen ? 30 : 13;
    e.set(0, -Math.atan2(dy, dx), 0); q.setFromEuler(e);
    m.compose(P((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2, hoch / 2), q, new THREE.Vector3(l + 1.5, hoch, 3.6));
    inst.setMatrixAt(i, m);
  });
  inst.castShadow = true; inst.receiveShadow = true;
  scene.add(inst);
  // Chrompfosten an den freien Enden (wie in der 2D-Zeichnung)
  const n = new Map(), key = (x, y) => Math.round(x) + ',' + Math.round(y);
  for (const w of liste) for (const [x, y] of [[w.x1, w.y1], [w.x2, w.y2]]) { const k = key(x, y); if (!n.has(k)) n.set(k, { x, y, c: 0 }); n.get(k).c++; }
  const enden = [...n.values()].filter(e => e.c === 1 && e.x > 14 && e.x < 390 && e.y < 758);
  const pg = new THREE.CylinderGeometry(4.2, 4.2, 17, 20);
  const kopf = new THREE.SphereGeometry(4.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const e of enden) {
    const p = new THREE.Mesh(pg, chrom); p.position.copy(P(e.x, e.y, 8.5)); p.castShadow = true; scene.add(p);
    const k = new THREE.Mesh(kopf, chrom); k.position.copy(P(e.x, e.y, 17)); scene.add(k);
  }
}

// ---------- Pfosten an den Rampeneinläufen: schlanker Chrompfosten mit silbernem Ring (0.67: kleiner, silber statt schwarz) ----------
for (const p of Z.posts) {
  const s = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.6, p.r * 0.6, 20, 16), chrom);
  s.position.copy(P(p.x, p.y, 10)); s.castShadow = true; scene.add(s);
  const g = new THREE.Mesh(new THREE.TorusGeometry(p.r - 0.8, 0.8, 10, 24), chrom);
  g.rotation.x = Math.PI / 2; g.position.copy(P(p.x, p.y, 8)); g.castShadow = true; scene.add(g);
}

// ---------- Pop-Bumper: weißer Sockel, durchscheinende rote Kappe, leuchtet beim Treffer ----------
const bumperKappen = Z.bumpers.map(b => {
  const g = new THREE.Group(); g.position.copy(P(b.x, b.y));
  const sockel = new THREE.Mesh(new THREE.CylinderGeometry(b.r + 3, b.r + 4, 5, 32), weiss); sockel.position.y = 2.5;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(b.r + 0.5, b.r + 0.5, 4, 32, 1, true), chrom); ring.position.y = 7;
  const kappeMat = new THREE.MeshPhysicalMaterial({ color: 0xd4202e, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1,
    emissive: 0xff2030, emissiveIntensity: 0.25, transparent: true, opacity: 0.92 });
  const kappe = new THREE.Mesh(new THREE.CylinderGeometry(b.r * 0.95, b.r + 1, 12, 32), kappeMat); kappe.position.y = 15;
  const deckel = new THREE.Mesh(new THREE.SphereGeometry(b.r * 0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), kappeMat);
  deckel.position.y = 21; deckel.scale.y = 0.55;
  for (const m of [sockel, ring, kappe, deckel]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  scene.add(g);
  return { b, kappeMat };
});

// ---------- Flipper: weißer Körper, rotes Gummi, Chromachse ----------
function flipperGeo(r0, r1, hoehe, bt, bs, seg) {
  // r0/r1: Radien der Grundform (Bevel wächst um bs nach außen), hoehe: gerader Teil, bt: Wölbung oben/unten
  const l = Z.FL, s = Math.asin((r0 - r1) / l), sh = new THREE.Shape();
  sh.absarc(0, 0, r0, Math.PI / 2 + s, Math.PI * 1.5 - s, false);
  sh.absarc(l, 0, r1, -Math.PI / 2 - s, Math.PI / 2 + s, false);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: hoehe, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: seg, curveSegments: 18 });
  g.rotateX(-Math.PI / 2);          // Form liegt flach, Höhe nach oben (von −bt bis hoehe + bt)
  g.translate(0, bt, 0);            // Unterkante auf y = 0
  return g;
}
const flipper3d = Z.flippers.map(f => {
  const g = new THREE.Group();
  // Gummiring: 13 hoch, leicht gerundet; weißer Körper darin mit gewölbter Oberseite, Spitze ~14 (Kugel ist 18 hoch)
  const gummi = new THREE.Mesh(flipperGeo(8.4, 4.9, 10.6, 1.2, 0.6, 3), gummiRot); gummi.position.y = 0.6;
  const koerper = new THREE.Mesh(flipperGeo(4.6, 1.5, 6.6, 3.6, 2.2, 6), weiss); koerper.position.y = 0.8;
  const achse = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3, 16), chrom); achse.position.y = 15.6;
  const kappe = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), chrom); kappe.position.y = 17;
  for (const m of [gummi, koerper, achse, kappe]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  scene.add(g);
  return { f, g };
});

// ---------- Schleudern: Kunststoffdreieck mit Wölbung, drei Chrompfosten, schwarzer Gummiwulst an der Schlagseite ----------
const schleuderMat = new THREE.MeshPhysicalMaterial({ color: 0xc41f2c, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08,
  emissive: 0xff2a2a, emissiveIntensity: 0.15, transparent: true, opacity: 0.94 });
const schleudern3d = Z.slings.map(sl => {
  const g = new THREE.Group(), pk = sl.pts;
  // Dreieck etwas nach innen ziehen, damit die Wölbung (Bevel) an den Pfosten nicht über die Kante hinauswächst
  const cx = (pk[0][0] + pk[1][0] + pk[2][0]) / 3, cy = (pk[0][1] + pk[1][1] + pk[2][1]) / 3, k = 0.86;
  const sh = new THREE.Shape(pk.map(([x, y]) => new THREE.Vector2((cx + (x - cx) * k) - X0, Y0 - (cy + (y - cy) * k))));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 13, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 2, bevelSegments: 5 });   // 0.63: Höhe 18 (Nutzerwahl), Gummi auf Ballmitte 9
  geo.rotateX(-Math.PI / 2); geo.translate(0, 2.5, 0);
  const koerper = new THREE.Mesh(geo, schleuderMat); koerper.castShadow = true; koerper.receiveShadow = true; g.add(koerper);
  for (const [x, y] of pk) {                                   // drei Chrompfosten an den Ecken
    const p = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.6, 20, 18), chrom); p.position.copy(P(x, y, 10)); p.castShadow = true; g.add(p);
    const kp = new THREE.Mesh(new THREE.SphereGeometry(3.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), chrom); kp.position.copy(P(x, y, 20)); g.add(kp);
  }
  // Weißer Gummiring rund um alle drei Pfosten (wie im Schleuder-Bild; 0.55 statt schwarzem Wulst nur an der Schlagseite)
  const RP = 3.6, RG = 2.0, HG = 9;                              // Pfostenradius, Gummidicke, Höhe
  let bogen = null;
  for (let i = 0; i < 3; i++) {
    const a = pk[i], b = pk[(i + 1) % 3], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    let nx = -dy / l, ny = dx / l; if ((cx - a[0]) * nx + (cy - a[1]) * ny > 0) { nx = -nx; ny = -ny; }   // nach außen
    if (i === 2) {
      // 0.64: Schlagseite (Pfosten 2 → 0) aus zwei Hälften, die sich beim Schlag in der Mitte nach außen wölben (wie am Original)
      const haelften = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(RG, RG, 1, 12), gummiWeiss); m.castShadow = true; g.add(m); return m; });
      const A = [a[0] + nx * RP, a[1] + ny * RP], B = [b[0] + nx * RP, b[1] + ny * RP], oben = new THREE.Vector3(0, 1, 0);
      bogen = d => {
        const M = [(A[0] + B[0]) / 2 + nx * d, (A[1] + B[1]) / 2 + ny * d];
        [[A, M], [M, B]].forEach(([u, v], k) => {
          const p0 = P(u[0], u[1], HG), p1 = P(v[0], v[1], HG), dir = p1.clone().sub(p0), len = dir.length();
          haelften[k].position.copy(p0).addScaledVector(dir, 0.5);
          haelften[k].quaternion.setFromUnitVectors(oben, dir.normalize());
          haelften[k].scale.set(1, len + RG * 0.6, 1);           // etwas länger, damit die Mitte geschlossen bleibt
        });
      };
      bogen(0);
      continue;
    }
    const strang = new THREE.Mesh(new THREE.CylinderGeometry(RG, RG, l, 12), gummiWeiss);
    strang.rotation.z = Math.PI / 2;                             // Achse entlang x
    const holder = new THREE.Group(); holder.add(strang);
    holder.position.copy(P((a[0] + b[0]) / 2 + nx * RP, (a[1] + b[1]) / 2 + ny * RP, HG));
    holder.rotation.y = -Math.atan2(dy, dx); strang.castShadow = true; g.add(holder);
  }
  for (const [x, y] of pk) {                                     // um jeden Pfosten herum
    const t = new THREE.Mesh(new THREE.TorusGeometry(RP, RG, 10, 24), gummiWeiss);
    t.rotation.x = Math.PI / 2; t.position.copy(P(x, y, HG)); t.castShadow = true; g.add(t);
  }
  scene.add(g);
  return { sl, mat: schleuderMat, bogen };
});

// ---------- Drahtrampen entlang der bisherigen Tunnelbahnen ----------
// Höhenverlauf: steigt vom Einlauf an, höchster Punkt ~ Mitte, läuft flach in die Rückkehrgasse aus.
// Beide Rampen kreuzen sich – die linke liegt höher, damit sie übereinander weglaufen.
const RAMPE_SPITZE = [72, 46];
// Band entlang der Bahn, 18 breit; v = Bogenlänge / Kachelhöhe (Kachel wiederholt sich, Pfeile zeigen in Fahrtrichtung)
const rampeTex = new THREE.TextureLoader().load('rampe.png', t => { t.needsUpdate = true; });
rampeTex.colorSpace = THREE.SRGBColorSpace; rampeTex.wrapT = THREE.RepeatWrapping; rampeTex.anisotropy = 8;
const rampeMat = new THREE.MeshStandardMaterial({ map: rampeTex, transparent: true, side: THREE.DoubleSide, depthWrite: false,
  roughness: 0.2, metalness: 0.1, emissive: 0xffffff, emissiveMap: rampeTex, emissiveIntensity: 0.15 });
const KACHEL = 64 / 16;                      // Höhe der Kachel in Tischeinheiten (288 × 64 px, 16 px je Einheit)
function rampenBand(pkt) {
  const pos = [], uv = [], idx = [];
  let s = 0;
  pkt.forEach((p, k) => {
    const a = pkt[Math.max(0, k - 1)], b = pkt[Math.min(pkt.length - 1, k + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    if (k) { const q = pkt[k - 1]; s += Math.hypot(p.x - q.x, p.y - q.y, p.h - q.h); }
    for (const [sd, u] of [[-9, 0], [9, 1]]) { const v = P(p.x + nx * sd, p.y + ny * sd, p.h + 0.4); pos.push(v.x, v.y, v.z); uv.push(u, s / KACHEL); }
    if (k) { const i = 2 * k; idx.push(i - 2, i - 1, i, i - 1, i + 1, i); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, rampeMat); m.renderOrder = 2; m.receiveShadow = true; scene.add(m);
}
const rampenHoehe = (i, t) => RAMPE_SPITZE[i] * Math.pow(Math.sin(Math.PI * Math.min(1, t)), 0.8);
Z.ramps.forEach((r, i) => {
  const N = 90, pkt = [];
  for (let k = 0; k <= N; k++) { const t = k / N, [x, y] = Z.bez(r.pfad, t); pkt.push({ x, y, h: rampenHoehe(i, t), t }); }
  const draht = (seitlich, oben) => {
    const kurve = new THREE.CatmullRomCurve3(pkt.map((p, k) => {
      const a = pkt[Math.max(0, k - 1)], b = pkt[Math.min(N, k + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      return P(p.x + nx * seitlich, p.y + ny * seitlich, p.h + oben);
    }));
    const m = new THREE.Mesh(new THREE.TubeGeometry(kurve, 220, 1.15, 8, false), chrom);
    m.castShadow = true; scene.add(m);
  };
  rampenBand(pkt);                            // Laufbahn: Kunststoffband mit rampe.png (statt der zwei Laufdrähte)
  draht(-10, 9); draht(10, 9);                // Seitendrähte oben
  // Stützen: alle paar Punkte ein dünner Stab zum Boden, wo die Rampe hoch genug ist
  const stuetze = new THREE.CylinderGeometry(1, 1, 1, 8);
  for (let k = 6; k < N - 3; k += 9) {
    const p = pkt[k]; if (p.h < 10) continue;
    const s = new THREE.Mesh(stuetze, stahl); s.scale.y = p.h; s.position.copy(P(p.x, p.y, p.h / 2)); s.castShadow = true; scene.add(s);
  }
  // Einfahrt: flaches Blech vom Boden auf die Drähte
  const [x0, y0] = Z.bez(r.pfad, 0), [x1, y1] = Z.bez(r.pfad, 0.04);
  const ein = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 16), stahl);
  ein.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, 1.5));
  ein.rotation.y = -Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2; ein.receiveShadow = true; scene.add(ein);
});

// ---------- Schädel: steht aufrecht (leicht nach hinten geneigt) über dem Loch, Augen glühen ----------
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,190,90,1)'); gr.addColorStop(0.35, 'rgba(255,130,30,.55)'); gr.addColorStop(1, 'rgba(255,90,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const augen = [];
new THREE.TextureLoader().load('schaedel.png', t => {
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const sw = 66, sh = sw * t.image.naturalHeight / t.image.naturalWidth;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.02 }));
  m.geometry.translate(0, sh / 2, 0);                       // Drehpunkt an der Unterkante
  m.position.copy(P(Z.SKULL.x, Z.SKULL.y - 6, 3));
  m.rotation.x = -32 * Math.PI / 180;                       // nach hinten geneigt: wirkt räumlich, bleibt gut lesbar
  for (const ax of [0.268, 0.723]) {
    const a = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    a.scale.set(26, 26, 1); a.position.set(ax * sw - sw / 2, 0.403 * sh, 2); m.add(a); augen.push(a);
  }
  scene.add(m);
});

// ---------- Kanone (Entwurf 2): Drehkranz mit blauem Leuchtring, Kuppel, keilförmiges Gehäuse, Lauf mit Kühlringen ----------
// Alles dreht mit dem Schwenkwinkel; die Mündung sitzt bei K_LAUF + 6 (dort verlässt die Kugel den Lauf).
const kanone3d = (() => {
  const g = new THREE.Group(), K = Z.kanone, L = Z.K_LAUF;
  const dunkel = new THREE.MeshStandardMaterial({ color: 0x6d7c8e, metalness: 0.8, roughness: 0.3 });
  const blauGlut = new THREE.MeshStandardMaterial({ color: 0x1d5fb8, emissive: 0x3d8fff, emissiveIntensity: 1.1, roughness: 0.3 });
  // Drehkranz: flacher Stahlteller, darauf ein leuchtender blauer Ring
  const teller = new THREE.Mesh(new THREE.CylinderGeometry(21, 23, 4, 40), dunkel); teller.position.y = 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(19, 1.5, 10, 48), blauGlut); ring.rotation.x = Math.PI / 2; ring.position.y = 4.4;
  const kranz = new THREE.Mesh(new THREE.CylinderGeometry(15, 17, 4, 32), chrom); kranz.position.y = 6.5;
  // Drehteil
  const dreh = new THREE.Group(); dreh.position.y = 8.5;
  // Gehäuse: Seitenprofil (x = Laufrichtung, y = Höhe) als Keil, in die Breite (z) ausgezogen
  const prof = new THREE.Shape();
  prof.moveTo(-15, 0); prof.lineTo(-15, 9); prof.lineTo(-8, 15); prof.lineTo(6, 15.5); prof.lineTo(15, 11); prof.lineTo(15, 4); prof.lineTo(11, 0); prof.closePath();
  const gehGeo = new THREE.ExtrudeGeometry(prof, { depth: 20, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 1.4, bevelSegments: 2 });
  gehGeo.translate(0, 0, -10);
  const gehaeuse = new THREE.Mesh(gehGeo, dunkel);
  // Kuppel oben auf dem Gehäuse (Sichtfenster des Zielers)
  const kuppel = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: 0x9fd0ff, metalness: 0.2, roughness: 0.05, clearcoat: 1, emissive: 0x2a6fd0, emissiveIntensity: 0.5 }));
  kuppel.position.set(-3, 15.5, 0); kuppel.scale.y = 0.7;
  // Energiezellen an den Flanken
  const zellen = [-1, 1].map(sd => {
    const z = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 14, 16), blauGlut);
    z.rotation.z = Math.PI / 2; z.position.set(-2, 6, sd * 13.5); return z;
  });
  // Lauf: Mantel, Kühlringe, Mündungsbremse, innen ein leuchtender Kern
  const mantel = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.8, 16, 24), chrom);
  mantel.rotation.z = Math.PI / 2; mantel.position.set(14 + 8, 9, 0);
  const rohr = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.4, L - 6, 20), stahl);
  rohr.rotation.z = Math.PI / 2; rohr.position.set(12 + (L - 6) / 2 + 3, 9, 0);
  const kuehl = [0, 1, 2].map(k => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(5.4, 1, 8, 24), gummiSchwarz);
    r.rotation.y = Math.PI / 2; r.position.set(27 + k * 3.4, 9, 0); return r;
  });
  const muendung = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5, 4.5, 24), dunkel);
  muendung.rotation.z = Math.PI / 2; muendung.position.set(L + 4, 9, 0);
  const kernMat = new THREE.MeshStandardMaterial({ color: 0x300808, emissive: 0xff3a2a, emissiveIntensity: 0, roughness: 0.4 });
  const kern = new THREE.Mesh(new THREE.CircleGeometry(3.4, 20), kernMat); kern.rotation.y = Math.PI / 2; kern.position.set(L + 6.3, 9, 0);
  const lampeMat = new THREE.MeshStandardMaterial({ color: 0x5a1a1a, emissive: 0xff3a3a, emissiveIntensity: 0 });
  const lampe = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 9), lampeMat); lampe.position.set(-10, 16.3, 0);
  dreh.add(gehaeuse, kuppel, mantel, rohr, muendung, kern, lampe, ...zellen, ...kuehl);
  for (const m of [teller, kranz, gehaeuse, mantel, rohr, muendung, ...zellen, ...kuehl]) { m.castShadow = true; m.receiveShadow = true; }
  g.add(teller, ring, kranz, dreh); g.position.copy(P(K.x, K.y)); scene.add(g);
  return { dreh, lampeMat, kernMat, blauGlut };
})();

// ---------- Ziele als Körper (vorher flach auf der Bodentextur) ----------
const ziele3d = (() => {
  const schwarz = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.6, metalness: 0.3 });
  const teil = (geo, mat, x, y, h, rx = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.copy(P(x, y, h)); m.rotation.set(rx, 0, rz);
    m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
  };
  // Rote Dreierbank: runde Scheiben mit Niete, stehend, Blick zum Spieler; dahinter eine schwarze Halterung
  const d0 = Z.drops[0], d2 = Z.drops[Z.drops.length - 1];
  teil(new THREE.BoxGeometry(d2.x - d0.x + 24, 6, 4), schwarz, (d0.x + d2.x) / 2, d0.y - 3.5, 3);
  const niete = new THREE.SphereGeometry(1.8, 12, 8);
  const rot = Z.drops.map(d => {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xc8202e, roughness: 0.3, clearcoat: 1, emissive: 0xff3040, emissiveIntensity: 0.1 });
    teil(new THREE.BoxGeometry(3, 8, 2), schwarz, d.x, d.y - 2, 4);                               // Stiel
    teil(new THREE.CylinderGeometry(9, 9, 2.6, 32), mat, d.x, d.y, 11, Math.PI / 2);                 // Scheibe
    teil(niete, chrom, d.x, d.y + 1.4, 11);
    return { d, mat };
  });
  // Orange Stehziele rechts: flache Platten, Blick nach links ins Feld
  const orange = Z.standups.map(st => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf0e6d4, roughness: 0.35, emissive: 0xffa030, emissiveIntensity: 0 });
    teil(new THREE.BoxGeometry(3, 16, st.h), mat, st.x, st.y, 8);
    teil(new THREE.BoxGeometry(3, 10, 4), schwarz, st.x + 3, st.y, 5);
    return { st, mat };
  });
  // Fünf weiße Rundziele links: Scheibe auf Halter, Blick nach rechts
  const weissZ = Z.rund.map(r => {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xdfe4ea, roughness: 0.3, clearcoat: 1, emissive: 0xffd23a, emissiveIntensity: 0 });
    teil(new THREE.BoxGeometry(3, 10, r.h), stahl, r.x - 1.5, r.y, 5);
    teil(new THREE.CylinderGeometry(6, 6, 2.2, 24), mat, r.x + 3, r.y, 9, 0, Math.PI / 2);
    return { r, mat };
  });
  // Klappziel vor dem Schädel: Chromplatte über die Gasse, grüne Lampe bei LOAD GUN; versinkt, wenn umgeworfen
  const sd = Z.sdrop, klapp = new THREE.Group();
  const platte = new THREE.Mesh(new THREE.BoxGeometry(sd.x1 - sd.x0 - 4, 14, 3), chrom); platte.position.y = 7;
  const lampeMat = new THREE.MeshStandardMaterial({ color: 0x5a1a20, emissive: 0x2fe07a, emissiveIntensity: 0 });
  const lampe = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 1), lampeMat); lampe.position.set(0, 8, 1.8);
  platte.castShadow = true; klapp.add(platte, lampe); klapp.position.copy(P((sd.x0 + sd.x1) / 2, sd.y)); scene.add(klapp);
  // Mulde oben rechts: Chromring um das Loch
  const ring = new THREE.Mesh(new THREE.TorusGeometry(10.5, 1.8, 10, 32), chrom);
  ring.rotation.x = Math.PI / 2; ring.position.copy(P(Z.MULDE.x, Z.MULDE.y, 1)); ring.castShadow = true; scene.add(ring);
  let tiefe = 0;
  return function aktualisiere() {
    for (const { d, mat } of rot) { const h = d.an ? 1 : d.blitz; mat.emissiveIntensity = 0.1 + 1.8 * h; }
    for (const { st, mat } of orange) mat.emissiveIntensity = st.an ? 0.9 : 0;
    Z.rund.forEach((r, k) => { weissZ[k].mat.emissiveIntensity = r.blitz > 0 ? 1.6 : Z.kanone.ziel === k ? 0.8 : 0; });
    tiefe += ((sd.unten ? -15 : 0) - tiefe) * 0.3;                // weich versenken / aufstellen
    klapp.position.y = tiefe; klapp.visible = tiefe > -14.5;
    lampeMat.emissiveIntensity = Z.gunLit ? 1.5 : 0.2;
    lampeMat.emissive.setHex(Z.gunLit ? 0x2fe07a : 0x8a1e2b);
  };
})();

// ---------- Kugeln ----------
const kugelGeo = new THREE.SphereGeometry(R, 32, 20);
const kugeln = [];
function kugelMesh(i) {
  while (kugeln.length <= i) { const m = new THREE.Mesh(kugelGeo, kugelMat); m.castShadow = true; scene.add(m); kugeln.push(m); }
  return kugeln[i];
}

// ---------- Kopfteil (0.70): unten die Anzeige in voller Breite, darüber das Bild – nur so hoch, wie Platz ist ----------
// Die Bildhöhe `hb` wählt einpassen(): so groß wie möglich, ohne dass der Tisch kleiner wird (Tisch bleibt breitenbegrenzt).
// Bild: kopf.jpg (falls vorhanden), sonst Platzhalter; es wird mittig auf die verfügbare Höhe zugeschnitten.
const RK = { b: W + 44, t: 60, neig: 8 * Math.PI / 180, unten: 122, sockel: 40, hb: 0, hbMax: 400 };
const UNTEN_RAND = 0.01;                      // Abstand Tischunterkante – Bildschirmunterkante (Anteil der halben Höhe)
const TISCH_VERLUST = 1.035;                  // Bildteil darf den Tisch höchstens 3,5 % verkleinern
const dmdTex = new THREE.CanvasTexture(document.getElementById('dmd'));
dmdTex.colorSpace = THREE.SRGBColorSpace; dmdTex.anisotropy = 4;
let dmdStand = -1;
const kopfBildTex = (() => {                  // Platzhalter: eigenes Motiv aus Verlauf, Uhr und Schriftzug (wird durch kopf.jpg ersetzt)
  const c = document.createElement('canvas'); c.width = 1024; c.height = 768;
  const g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 768); v.addColorStop(0, '#05070d'); v.addColorStop(0.6, '#10213f'); v.addColorStop(1, '#2a0d08');
  g.fillStyle = v; g.fillRect(0, 0, 1024, 768);
  for (let k = 0; k < 7; k++) {                // Suchscheinwerfer
    g.save(); g.translate(150 + k * 120, 768); g.rotate(-0.5 + k * 0.17);
    const l = g.createLinearGradient(0, 0, 0, -768); l.addColorStop(0, 'rgba(160,200,255,.25)'); l.addColorStop(1, 'rgba(160,200,255,0)');
    g.fillStyle = l; g.beginPath(); g.moveTo(-8, 0); g.lineTo(-60, -768); g.lineTo(60, -768); g.lineTo(8, 0); g.fill(); g.restore();
  }
  g.strokeStyle = 'rgba(255,120,50,.9)'; g.lineWidth = 10; g.beginPath(); g.arc(512, 330, 170, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(512 + Math.cos(a) * 142, 330 + Math.sin(a) * 142); g.lineTo(512 + Math.cos(a) * 160, 330 + Math.sin(a) * 160); g.stroke(); }
  g.lineWidth = 14; g.beginPath(); g.moveTo(512, 330); g.lineTo(512, 190); g.moveTo(512, 330); g.lineTo(537, 222); g.stroke();
  g.font = '900 110px Bungee, Impact, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ff5a26';
  g.shadowColor = '#ff3a10'; g.shadowBlur = 30; g.fillText('ZERO TIME', 512, 600);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const kopfBildMat = new THREE.MeshBasicMaterial({ map: kopfBildTex, toneMapped: false });
const KOPF_MIN_BREITE = 0.82;
const bildZuschnitt = () => {                 // 0.74: wie CSS „cover“ – Fläche immer gefüllt, Seitenverhältnis bleibt
  const t = kopfBildMat.map, img = t.image, bb = RK.b - 24, bh = Math.max(1, RK.hb - 14);
  const ib = img && img.width ? img.width / img.height : 4 / 3, fb = bb / bh;          // Seitenverhältnis Bild / Fläche
  // Bild breiter: seitlich mittig abschneiden, aber höchstens bis KOPF_MIN_BREITE (Schriftzug in kopf.jpg reicht von 11 % bis 89 % der
  // Breite) – reicht das nicht, wird das Bild senkrecht leicht gestreckt (bei 932 px Höhe ≈ 10 %)
  if (ib > fb) { t.repeat.set(Math.max(fb / ib, KOPF_MIN_BREITE), 1); t.offset.set((1 - t.repeat.x) / 2, 0); }
  else { t.repeat.set(1, ib / fb); t.offset.set(0, (1 - t.repeat.y) * 0.35); }        // Bild höher: unten weniger abschneiden (Schriftzug)
  t.needsUpdate = true;
};
new THREE.TextureLoader().load('kopf.jpg', t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; kopfBildMat.map = t; kopfBildMat.needsUpdate = true; bildZuschnitt(); }, undefined, () => {});
const randMat = new THREE.MeshStandardMaterial({ color: 0xc8d2dc, metalness: 1, roughness: 0.25 });
const kopf = new THREE.Group();
kopf.position.copy(P(X0, -22, RK.sockel)); kopf.rotation.x = -RK.neig;     // steht auf der Rückwand
scene.add(kopf);
{ // feste Leiste unten mit der Anzeige in voller Breite
  const kasten = new THREE.Mesh(new THREE.BoxGeometry(RK.b, RK.unten, RK.t), holz);
  kasten.position.set(0, RK.unten / 2, -RK.t / 2); kasten.castShadow = true; kopf.add(kasten);
  const sb = RK.b - 28, sh = sb / 4, my = RK.unten / 2;
  const rahmen = new THREE.Mesh(new THREE.PlaneGeometry(sb + 10, sh + 10), new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: 0.6 }));
  rahmen.position.set(0, my, 0.6); kopf.add(rahmen);
  const schirm = new THREE.Mesh(new THREE.PlaneGeometry(sb, sh), new THREE.MeshBasicMaterial({ map: dmdTex, toneMapped: false }));
  schirm.position.set(0, my, 1); kopf.add(schirm);
  const glimm = new THREE.PointLight(0xff5a26, 300, 160, 1.8); glimm.position.set(0, my, 30); kopf.add(glimm);
}
const kopfOben = new THREE.Group(); kopf.add(kopfOben);
function setzeKopf(hb) {                      // oberer Teil mit Bild, Höhe hb (0 = nur die Anzeige-Leiste)
  RK.hb = hb;
  for (const c of [...kopfOben.children]) { kopfOben.remove(c); c.geometry && c.geometry.dispose(); }
  const H = RK.unten + hb, rand = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 5), randMat); m.position.set(x, y, 1.5); kopfOben.add(m); };
  if (hb > 20) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(RK.b, hb, RK.t), holz); k.position.set(0, RK.unten + hb / 2, -RK.t / 2); k.castShadow = true; kopfOben.add(k);
    const bild = new THREE.Mesh(new THREE.PlaneGeometry(RK.b - 24, hb - 14), kopfBildMat); bild.position.set(0, RK.unten + hb / 2, 1); kopfOben.add(bild);
    rand(RK.b, 4, 0, RK.unten); bildZuschnitt();
  }
  rand(RK.b + 4, 5, 0, H); rand(RK.b + 4, 5, 0, 0); rand(5, H, -RK.b / 2, H / 2); rand(5, H, RK.b / 2, H / 2);
}

// ---------- Kamera einpassen: ganzer Tisch sichtbar, möglichst groß ----------
const NEIG = 50 * Math.PI / 180;              // Blickwinkel von der Waagrechten (90° = senkrecht von oben; 0.54: 50° statt 60°, mehr von vorn)
let bw = 0, bh = 0;
function einpassen() {
  // 0.68: Ränder der Bühne (Statusleiste oben, Home-Leiste unten) freilassen
  const cs = getComputedStyle(stage), pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
  Object.assign(gl.style, { inset: '', left: '0', right: '0', top: pt + 'px', bottom: pb + 'px', height: 'auto' });
  const w = stage.clientWidth, h = stage.clientHeight - pt - pb;
  bw = w; bh = h;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const ecken = [];
  for (const x of [4, W - 4]) for (const y of [0, H + 6]) for (const hh of [0, 14]) ecken.push(P(x, y, hh));   // Spielfeld; Gehäuse darf angeschnitten sein
  const nurTisch = ecken.length;
  const kopfEcken = hb => { const h = RK.unten + hb, oz = -22 - Math.sin(RK.neig) * h, oy = RK.sockel + Math.cos(RK.neig) * h;
    ecken.length = nurTisch; for (const x of [4, W - 4]) ecken.push(P(x, oz, oy)); };
  const dir = new THREE.Vector3(0, Math.sin(NEIG), Math.cos(NEIG));
  let ziel = new THREE.Vector3(0, 0, 40), dist = 1200;
  const passt = d => {
    camera.position.copy(ziel).addScaledVector(dir, d); camera.lookAt(ziel); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const e of ecken) { const v = e.clone().project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    return { x0, x1, y0, y1 };
  };
  const einpass = () => {
    for (let runde = 0; runde < 10; runde++) {
      let lo = 200, hi = 6000;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, b = passt(m); if (b.x0 < -1 || b.x1 > 1 || b.y0 < -1.001 || b.y1 > 0.99) lo = m; else hi = m; }
      dist = hi;
      const b = passt(dist);
      ziel.z -= (b.y0 + 1 - UNTEN_RAND) * 300;    // 0.71: unten mit kleinem Rand (vorher mittig – unten blieb zu viel Luft)
    }
    return dist;
  };
  // 0.70: Bildhöhe so groß wie möglich, solange der Tisch höchstens 2,5 % kleiner wird als nur mit Anzeige (gemessen: jede
  // Bildhöhe kostet etwas Tischgröße, volle Höhe 270 ≈ 5 %)
  kopfEcken(0); ziel.set(0, 0, 40); const d0 = einpass(); let best = 0;
  for (let hb = RK.hbMax; hb >= 30; hb -= 10) { kopfEcken(hb); ziel.set(0, 0, 40); if (einpass() <= d0 * TISCH_VERLUST) { best = hb; break; } }
  kopfEcken(best); ziel.set(0, 0, 40); einpass(); setzeKopf(best);
  passt(dist);
}
window.addEventListener('resize', einpassen);
einpassen();

// ---------- Tipp → Tischkoordinaten (für Abzug und Kanone) ----------
const ray = new THREE.Raycaster(), ebene = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), treffer = new THREE.Vector3();
window.__ZT3D = {
  bildschirm(x, y) {                // Tisch → Bildschirm (nur zum Prüfen)
    const v = P(x, y).project(camera), r = gl.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  },
  tischPunkt(cx, cy) {
    const r = gl.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    if (!ray.ray.intersectPlane(ebene, treffer)) return { x: -999, y: -999 };
    return { x: treffer.x + X0, y: treffer.z + Y0 };
  },
};

// ---------- Bildrate messen, anzeigen, bei Einbruch Auflösung senken ----------
const fpsAnz = document.createElement('div');
Object.assign(fpsAnz.style, { position: 'fixed', left: '6px', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)', zIndex: 5,
  font: '600 11px system-ui, sans-serif', color: 'rgba(200,220,255,.7)', pointerEvents: 'none', textShadow: '0 1px 2px #000' });
document.body.appendChild(fpsAnz);
let fZaehler = 0, fStart = performance.now(), fWarm = performance.now() + 6000;
let langsam = 0, flott = 0, probe = false;
const gesperrt = new Set();                                    // Stufen, die nach einem Versuch nicht flüssig liefen
function stufeSetzen(i) {
  stufe = i; renderer.setPixelRatio(Math.min(STUFEN[i], GERAET_DPR)); renderer.setSize(bw, bh, false);
}
function messeFps(jetzt) {
  fZaehler++;
  if (jetzt - fStart < 1500) return;
  const fps = fZaehler * 1000 / (jetzt - fStart); fZaehler = 0; fStart = jetzt;
  if (!window.__ZT_FEST && jetzt > fWarm) {
    if (fps < 40) {
      flott = 0;
      if (++langsam >= 2) {                                   // erst nach zwei schlechten Messungen in Folge senken
        langsam = 0;
        if (probe) { gesperrt.add(stufe); probe = false; }    // Hochschalten hat nicht getragen: diese Stufe nicht mehr versuchen
        if (stufe < STUFEN.length - 1) { stufeSetzen(stufe + 1); fWarm = jetzt + 2500; }
        else if (fps < 30 && sonne.castShadow) { sonne.castShadow = false; fWarm = jetzt + 2500; }
      }
    } else {
      langsam = 0;
      if (probe && fps >= 50) probe = false;                  // neue Stufe läuft flüssig: behalten
      if (fps >= 57 && ++flott >= 3 && stufe > 0 && !gesperrt.has(stufe - 1) && Math.min(STUFEN[stufe - 1], GERAET_DPR) > Math.min(STUFEN[stufe], GERAET_DPR)) {
        flott = 0; probe = true; stufeSetzen(stufe - 1); fWarm = jetzt + 2500;   // wieder schärfer, wenn Luft ist
      }
    }
  }
  fpsAnz.textContent = `${Math.round(fps)} fps · ${Math.min(STUFEN[stufe], GERAET_DPR)}× ${sonne.castShadow ? '' : '· ohne Schatten'}`;
}

// ---------- Schleife ----------
const basis = { hemi: hemi.intensity, sonne: sonne.intensity, l: akzentL.intensity, r: akzentR.intensity };
let letzteZeichnung = -1;
function bild(jetzt) {
  messeFps(jetzt || performance.now());
  if (Z.gezeichnet !== letzteZeichnung) { letzteZeichnung = Z.gezeichnet; tex.needsUpdate = true; }
  if (window.__dmdStand !== dmdStand) { dmdStand = window.__dmdStand; dmdTex.needsUpdate = true; }
  const gi = Math.max(0.12, Math.min(1.4, Z.grundLicht()));
  hemi.intensity = basis.hemi * gi; sonne.intensity = basis.sonne * gi;
  akzentL.intensity = basis.l * gi; akzentR.intensity = basis.r * gi;

  for (const k of bumperKappen) {
    const f = k.b.flash;
    k.kappeMat.emissiveIntensity = 0.25 + 2.2 * f;
  }
  { const fl = Math.max(...Z.slings.map(x => x.flash)); schleuderMat.emissiveIntensity = 0.15 + 2.4 * fl; }
  for (const s3 of schleudern3d) if (s3.bogen) s3.bogen(3.5 * Math.max(0, Math.min(1, s3.sl.flash)));   // Gummi schnellt beim Schlag nach außen
  ziele3d();
  kanone3d.dreh.rotation.y = -Z.kanone.a;
  kanone3d.lampeMat.emissiveIntensity = Z.kanone.kugel ? 1.6 : 0;
  kanone3d.kernMat.emissiveIntensity = Z.kanone.kugel ? 1.2 + 0.8 * Math.sin(Z.zeit * 9) : 0;
  kanone3d.blauGlut.emissiveIntensity = Z.kanone.kugel ? 1.6 : 0.9;
  const glut = Z.haelt() ? 1 : 0.35 + 0.3 * Math.sin(Z.zeit * 3);
  for (const a of augen) a.material.opacity = glut;
  for (const { f, g } of flipper3d) {
    const t = Z.tip(f), dx = t.x - f.px, dy = t.y - f.py;
    g.position.copy(P(f.px, f.py));
    g.rotation.y = Math.atan2(-dy, dx);
  }
  const bs = Z.balls;
  bs.forEach((b, i) => {
    const m = kugelMesh(i); m.visible = !b.weg;
    if (b.rampe) {
      const t = Math.min(1, b.rampe.t / Z.RAMP_T), [x, y] = Z.bez(b.rampe.r.pfad, t);
      m.position.copy(P(x, y, rampenHoehe(Z.ramps.indexOf(b.rampe.r), t) + R - 1));
    } else m.position.copy(P(b.x, b.y, b.kanone ? R + 16 : R));
  });
  for (let i = bs.length; i < kugeln.length; i++) kugeln[i].visible = false;

  renderer.render(scene, camera);
  requestAnimationFrame(bild);
}
requestAnimationFrame(bild);
