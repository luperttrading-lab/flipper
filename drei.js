// Zero Time – 3D-Ansicht (Prototyp, nur mit „?3d“ in der Adresse)
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
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const gl = renderer.domElement;
gl.id = 'c3d';
Object.assign(gl.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', touchAction: 'none', display: 'block' });
stage.style.position = 'relative';
stage.appendChild(gl);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06080c);
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
sonne.shadow.mapSize.set(2048, 2048);
Object.assign(sonne.shadow.camera, { left: -230, right: 230, top: 420, bottom: -420, near: 100, far: 1600 });
sonne.shadow.bias = -0.0006;
sonne.shadow.normalBias = 0.6;
scene.add(sonne, sonne.target);
const akzentL = new THREE.PointLight(0x4f7dff, 900, 500, 1.6); akzentL.position.set(-200, 120, -200); scene.add(akzentL);
const akzentR = new THREE.PointLight(0xff5a3a, 700, 500, 1.6); akzentR.position.set(200, 120, 150); scene.add(akzentR);

// ---------- Materialien ----------
const chrom = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 1, roughness: 0.18 });
const stahl = new THREE.MeshStandardMaterial({ color: 0xaab5c2, metalness: 0.9, roughness: 0.32 });
const gummiSchwarz = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.7 });
const weiss = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.35 });
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
  const liste = Z.walls.filter(w => !w.kick && !(w.schleuder && Z.schleuderBildOk()));
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

// ---------- Pfosten an den Rampeneinläufen: Chrom mit schwarzem Gummiring ----------
for (const p of Z.posts) {
  const s = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.6, p.r * 0.6, 20, 16), chrom);
  s.position.copy(P(p.x, p.y, 10)); s.castShadow = true; scene.add(s);
  const g = new THREE.Mesh(new THREE.TorusGeometry(p.r, 1.6, 10, 24), gummiSchwarz);
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
function flipperGeo(r0, r1, hoehe) {
  const l = Z.FL, s = Math.asin((r0 - r1) / l), sh = new THREE.Shape();
  sh.absarc(0, 0, r0, Math.PI / 2 + s, Math.PI * 1.5 - s, false);
  sh.absarc(l, 0, r1, -Math.PI / 2 - s, Math.PI / 2 + s, false);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: hoehe, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.6, bevelSegments: 2, curveSegments: 18 });
  g.rotateX(-Math.PI / 2);          // Form liegt flach, Höhe nach oben
  return g;
}
const flipper3d = Z.flippers.map(f => {
  const g = new THREE.Group();
  const gummi = new THREE.Mesh(flipperGeo(9, 5.5, 7), gummiRot); gummi.position.y = 1;
  const koerper = new THREE.Mesh(flipperGeo(6.8, 3.6, 10), weiss); koerper.position.y = 1;
  const achse = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 13, 12), chrom); achse.position.y = 6.5;
  for (const m of [gummi, koerper, achse]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  scene.add(g);
  return { f, g };
});

// ---------- Drahtrampen entlang der bisherigen Tunnelbahnen ----------
// Höhenverlauf: steigt vom Einlauf an, höchster Punkt ~ Mitte, läuft flach in die Rückkehrgasse aus.
// Beide Rampen kreuzen sich – die linke liegt höher, damit sie übereinander weglaufen.
const RAMPE_SPITZE = [72, 46];
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
  draht(-5.5, 0.5); draht(5.5, 0.5);          // Laufdrähte unten
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

// ---------- Kugeln ----------
const kugelGeo = new THREE.SphereGeometry(R, 32, 20);
const kugeln = [];
function kugelMesh(i) {
  while (kugeln.length <= i) { const m = new THREE.Mesh(kugelGeo, kugelMat); m.castShadow = true; scene.add(m); kugeln.push(m); }
  return kugeln[i];
}

// ---------- Kamera einpassen: ganzer Tisch sichtbar, möglichst groß ----------
const NEIG = 68 * Math.PI / 180;              // Blickwinkel von der Waagrechten (90° = senkrecht von oben)
function einpassen() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const ecken = [];
  for (const x of [4, W - 4]) for (const y of [0, H + 6]) for (const hh of [0, 14]) ecken.push(P(x, y, hh));   // Spielfeld; Gehäuse darf angeschnitten sein
  const dir = new THREE.Vector3(0, Math.sin(NEIG), Math.cos(NEIG));
  let ziel = new THREE.Vector3(0, 0, 40), dist = 1200;
  const passt = d => {
    camera.position.copy(ziel).addScaledVector(dir, d); camera.lookAt(ziel); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const e of ecken) { const v = e.clone().project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    return { x0, x1, y0, y1 };
  };
  for (let runde = 0; runde < 4; runde++) {
    let lo = 200, hi = 6000;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, b = passt(m); if (b.x0 < -1 || b.x1 > 1 || b.y0 < -1.001 || b.y1 > 0.99) lo = m; else hi = m; }
    dist = hi;
    const b = passt(dist);
    // Tisch unten bündig (oben bleibt ggf. Luft unter der Anzeige)
    ziel.z -= (b.y0 + 1) * 300;
  }
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

// ---------- Schleife ----------
const basis = { hemi: hemi.intensity, sonne: sonne.intensity, l: akzentL.intensity, r: akzentR.intensity };
function bild() {
  tex.needsUpdate = true;
  const gi = Math.max(0.12, Math.min(1.4, Z.grundLicht()));
  hemi.intensity = basis.hemi * gi; sonne.intensity = basis.sonne * gi;
  akzentL.intensity = basis.l * gi; akzentR.intensity = basis.r * gi;

  for (const k of bumperKappen) {
    const f = k.b.flash;
    k.kappeMat.emissiveIntensity = 0.25 + 2.2 * f;
  }
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
