// Zero Time – Echt-Optik (0.91, Probe; nur mit „?echt“, der Knopf oben rechts schaltet live zwischen echt und normal um)
// Setzt auf drei.js auf und ändert nur die Darstellung, nie Physik oder Regeln:
// 1. Leuchten (Bloom): alles, was heller als Weiß ist (Einsätze, Bumper, Spiegelungen), strahlt über
// 2. Kugel spiegelt den Tisch live (Würfelkamera an der Kugel, 128 px je Seite) statt eines festen Umgebungsbildes
// 3. Klarlack-Boden: glänzt; nur helle Stellen der Textur (eingeschaltete Einsätze) leuchten selbst, der Rest wird beleuchtet
// 4. Lichtinseln wie unter echten Schleuder-Kunststoffen (vorgerechnet, kostet nichts je Bild), Raumlicht gedämpft
// 5. Zweites Licht mit weichem Schatten, Kontaktschatten unter der Kugel
// 6. Blitzer bei Schleuder, Bumper und Jackpot, Bewegungsunschärfe der Kugel
import { EffectComposer } from './lib/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './lib/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './lib/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './lib/jsm/postprocessing/OutputPass.js';

export function starte({ THREE, scene, renderer, camera, Z, kugeln, kugelMat, bodenTeile, hemi, sonne, akzentL, akzentR, haken }) {
  const { W, H, R } = Z;
  const P = (x, y, h = 0) => new THREE.Vector3(x - W / 2, h, y - H / 2);
  const SPIEGEL = 1;                            // Ebene der Würfelkamera: nur größere Teile (spart Zeichenaufrufe)
  const LICHT = 11;                              // Stärke der Lichtinseln auf dem Boden
  // Halbe Gleitkommazahlen (Helligkeit über 1) nur, wenn das Gerät darin zeichnen kann – sonst 8 Bit mit tieferer Leucht-Schwelle
  const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  const typ = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;

  // ---------- 1. Leuchten ----------
  const ziel = new THREE.WebGLRenderTarget(1, 1, { type: typ, samples: Math.min(4, renderer.capabilities.maxSamples || 0) });
  const composer = new EffectComposer(renderer, ziel);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.4, hdr ? 0.95 : 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const groesse = new THREE.Vector2();
  function anpassen() { renderer.getSize(groesse); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(groesse.x, groesse.y); }
  anpassen();

  // ---------- 2. Kugel spiegelt den Tisch ----------
  const wuerfelZiel = new THREE.WebGLCubeRenderTarget(128, { type: typ, generateMipmaps: false });
  const wuerfel = new THREE.CubeCamera(1.5, 4000, wuerfelZiel);
  for (const c of wuerfel.children) c.layers.set(SPIEGEL);
  // Verchromter Stahl: fast nur Spiegelung, dazu ein scharfes Glanzlicht der Lampen
  const spiegelMat = new THREE.MeshPhongMaterial({ color: 0x0c0c0c, specular: 0xffffff, shininess: 220,
    envMap: wuerfelZiel.texture, combine: THREE.AddOperation, reflectivity: 0.82 });
  const eigene = new Set();                     // Geisterkugeln (Unschärfe) erscheinen nie in der Spiegelung
  // Raumlicht über dem Tisch (Deckenröhre, Fenster): nur in der Spiegelung sichtbar – ohne wirkt die Kugel im dunklen Raum grau
  for (const [b, h, farbe, x, y, z] of [[320, 36, 0xfff1dc, 200, 420, 620], [120, 90, 0xbfd4ff, -160, 120, 420], [90, 90, 0xffd6b0, 560, 300, 380]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(farbe).multiplyScalar(2.2), side: THREE.DoubleSide }));
    m.position.copy(P(x, y, z)); m.lookAt(P(200, 450, 0)); m.layers.set(SPIEGEL); scene.add(m);
  }
  const welt = new THREE.Vector3();
  function ebenenSetzen() {                     // neue Teile (z. B. Kopfteil nach Drehen) bekommen die Spiegel-Ebene nachträglich
    const ks = new Set(kugeln);
    scene.traverse(o => {
      if (o.isLight) { o.layers.enable(SPIEGEL); return; }           // Lichter gelten nur für Kameras derselben Ebene
      if (!o.isMesh || ks.has(o) || eigene.has(o) || o.userData.klein || o.layers.isEnabled(SPIEGEL)) return;
      const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      o.getWorldScale(welt);
      if (o.isInstancedMesh || g.boundingSphere.radius * Math.max(welt.x, welt.y, welt.z) >= 6) o.layers.enable(SPIEGEL);
      else o.userData.klein = true;
    });
  }
  let naechste = 0, wuerfelBereit = false, flaechen = 6;
  function spiegeln(pos) {                      // alle 6 Seiten je Bild; bei Last nur 3 bzw. 2 (reihum)
    wuerfel.position.copy(pos); wuerfel.updateMatrixWorld(true);
    if (flaechen >= 6 || !wuerfelBereit) { wuerfel.update(renderer, scene); wuerfelBereit = true; return; }
    const alt = renderer.getRenderTarget();
    for (let k = 0; k < flaechen; k++) {
      renderer.setRenderTarget(wuerfelZiel, naechste);
      renderer.render(scene, wuerfel.children[naechste]);
      naechste = (naechste + 1) % 6;
    }
    renderer.setRenderTarget(alt);
  }

  // ---------- 3./4. Klarlack-Boden mit Lichtinseln ----------
  function baueGrundlicht() {                   // halbe Auflösung reicht: Licht ist weich
    const S = 0.5, c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
    const g = c.getContext('2d'); g.scale(S, S);
    g.fillStyle = 'rgb(18,17,20)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const insel = (x, y, r, a) => {
      const q = g.createRadialGradient(x, y, 0, x, y, r);
      q.addColorStop(0, `rgba(255,226,186,${a})`); q.addColorStop(1, 'rgba(255,226,186,0)');
      g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    };
    insel(85, 600, 120, 0.85); insel(291, 600, 120, 0.85);          // unter den Schleuder-Kunststoffen
    insel(188, 712, 110, 0.5);                                       // Flipper und Schürze
    insel(28, 615, 70, 0.5); insel(350, 615, 70, 0.5);               // Aus- und Rückkehrgassen
    for (let y = 240; y <= 540; y += 100) { insel(24, y, 60, 0.32); insel(372, y, 60, 0.32); }   // Lampen an den Seitenwänden
    insel(202, 70, 140, 0.55); insel(220, 175, 110, 0.6);            // Bogen oben, Bumper
    insel(90, 300, 70, 0.35); insel(200, 420, 150, 0.22);            // Schädel, Mitte
    return [0, 1].map(k => {
      const t = document.createElement('canvas'); t.width = c.width; t.height = c.height / 2;
      t.getContext('2d').drawImage(c, 0, -k * c.height / 2);
      const tex = new THREE.CanvasTexture(t); tex.colorSpace = THREE.SRGBColorSpace; return tex;
    });
  }
  const giTex = baueGrundlicht();
  const lack = bodenTeile.map((b, k) => {
    const alt = b.m.material;
    const m = new THREE.MeshPhysicalMaterial({ map: alt.map, emissive: 0xffffff, emissiveMap: alt.emissiveMap, emissiveIntensity: 1,
      roughness: 0.6, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.22, lightMap: giTex[k], lightMapIntensity: LICHT });
    // Nur helle, gesättigte Stellen leuchten selbst (eingeschaltete Einsätze, über 1 → Bloom); dunkle Grafik nur durch das Licht
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float hell = max(max(emissiveColor.r, emissiveColor.g), emissiveColor.b);
        totalEmissiveRadiance *= mix(0.06, 1.5, smoothstep(0.35, 0.9, hell)); }`);
    };
    return { b, alt, m };
  });

  // ---------- 5. Zweites Licht mit weichem Schatten, Blitzer ----------
  const seite = new THREE.SpotLight(0xffe2c0, 0, 2600, 0.75, 0.9, 0);
  seite.position.copy(P(360, 860, 300)); seite.target.position.copy(P(190, 400, 0));
  seite.castShadow = true; seite.shadow.mapSize.set(1024, 1024);
  seite.shadow.bias = -0.0008; seite.shadow.normalBias = 0.8;
  seite.shadow.camera.near = 100; seite.shadow.camera.far = 1600;
  seite.visible = false;
  scene.add(seite, seite.target);
  const blitzer = new THREE.PointLight(0xffffff, 0, 420, 1.4);
  blitzer.visible = false; scene.add(blitzer);

  // ---------- 6. Kontaktschatten und Bewegungsunschärfe ----------
  const fleckTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    q.addColorStop(0, 'rgba(0,0,0,.85)'); q.addColorStop(0.45, 'rgba(0,0,0,.45)'); q.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const fleckGeo = new THREE.PlaneGeometry(R * 2.6, R * 2.6); fleckGeo.rotateX(-Math.PI / 2);
  const geistGeo = new THREE.SphereGeometry(R, 24, 16);
  const geistMats = [0.38, 0.22, 0.1].map(o => { const m = spiegelMat.clone(); m.transparent = true; m.opacity = o; m.depthWrite = false; return m; });
  const flecken = [], geister = [];
  function zubehoer(i) {
    while (flecken.length <= i) {
      const f = new THREE.Mesh(fleckGeo, new THREE.MeshBasicMaterial({ map: fleckTex, transparent: true, depthWrite: false }));
      f.visible = false; scene.add(f); flecken.push(f);
      const gs = geistMats.map(m => { const g = new THREE.Mesh(geistGeo, m); g.visible = false; scene.add(g); eigene.add(g); return g; });
      geister.push({ gs, vorher: null });
    }
  }
  const versteck = i => { flecken[i].visible = false; geister[i].gs.forEach(g => { g.visible = false; }); geister[i].vorher = null; };

  // ---------- Je Bild ----------
  let an = false, bilder = 0, mZ = 0, mStart = performance.now(), warm = performance.now() + 4000;
  const d = new THREE.Vector3();
  function jedesBild() {
    if (!an) return;
    if (bilder++ % 60 === 0) ebenenSetzen();
    mZ++;
    const jetzt = performance.now();
    if (jetzt - mStart > 1000) {                // bei Last zuerst die Spiegelung ausdünnen (drei.js senkt danach die Auflösung)
      const fps = mZ * 1000 / (jetzt - mStart); mZ = 0; mStart = jetzt;
      if (jetzt > warm && fps < 50 && flaechen > 2) { flaechen = flaechen === 6 ? 3 : 2; warm = jetzt + 2500; }
      haken.text = ' · echt' + (flaechen < 6 ? ` (Spiegel ${flaechen}/6)` : '');
    }
    // Licht: drei.js setzt die Grundwerte je Bild neu, hier nur dämpfen (Jackpot-Flackern bleibt erhalten)
    const gi = Math.max(0.12, Math.min(1.4, Z.grundLicht()));
    hemi.intensity *= 0.25; sonne.intensity *= 0.5; akzentL.intensity *= 0.7; akzentR.intensity *= 0.7;
    seite.intensity = 0.9 * gi;
    for (const l of lack) l.m.lightMapIntensity = LICHT * gi;
    // Blitzer: am stärksten gerade blitzenden Teil
    let st = 0, wo = null, farbe = 0xffffff;
    for (const s of Z.slings) if (s.flash > st) {
      st = s.flash; const [a, b, c] = s.pts; wo = P((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, 34); farbe = 0xffd2b4;
    }
    for (const b of Z.bumpers) if (b.flash > st) { st = b.flash; wo = P(b.x, b.y, 30); farbe = 0xff3a30; }
    if (Z.grundLicht() > 1.2) { st = 1.4; wo = P(200, 420, 160); farbe = 0xffffff; }
    blitzer.intensity = st > 0.02 ? 2600 * st : 0;
    if (wo) { blitzer.position.copy(wo); blitzer.color.setHex(farbe); }
    // Kugeln: Spiegel-Material, Kontaktschatten, Geister entlang des Wegs seit dem letzten Bild
    let probe = null;
    kugeln.forEach((k, i) => {
      k.material = spiegelMat; zubehoer(i);
      if (!k.visible) { versteck(i); return; }
      const f = flecken[i], gst = geister[i], h = k.position.y - R;
      f.visible = h < 24; f.position.set(k.position.x, 0.35, k.position.z); f.material.opacity = 0.85 * Math.max(0, 1 - h / 24);
      if (gst.vorher) {
        d.subVectors(k.position, gst.vorher);
        const l = d.length(), zeig = l > R * 0.7 && l < 150;     // langsam: scharf; Sprung (neue Kugel): keine Spur
        gst.gs.forEach((g, j) => { g.visible = zeig; if (zeig) g.position.copy(k.position).addScaledVector(d, -(j + 1) * 0.25); });
      }
      gst.vorher = (gst.vorher || new THREE.Vector3()).copy(k.position);
      if (!probe || k.position.z > probe.position.z) probe = k;     // gespiegelt wird an der vordersten Kugel
    });
    for (let i = kugeln.length; i < flecken.length; i++) versteck(i);
    if (probe) { probe.visible = false; spiegeln(probe.position); probe.visible = true; }
    renderer.shadowMap.needsUpdate = true;      // Schatten nur einmal je Bild (nicht für jede Würfelseite)
  }

  // ---------- Umschalten: Knöpfe oben rechts (Tipp darauf ist kein Flipper und keine Pause) ----------
  const knopfBau = (rechts, wenn) => {
    const k = document.createElement('button');
    k.type = 'button';
    Object.assign(k.style, { position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', right: rechts + 'px', zIndex: 6,
      font: '700 12px system-ui, sans-serif', letterSpacing: '.04em', padding: '7px 12px', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,.4)', color: '#fff', touchAction: 'none', background: 'rgba(10,14,22,.7)' });
    for (const t of ['pointerup', 'click', 'touchstart']) k.addEventListener(t, e => e.stopPropagation());
    k.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); wenn(); });
    document.body.appendChild(k); return k;
  };
  const knopf = knopfBau(8, () => schalte(!an));
  // Blickwinkel: 50° wie bisher oder 35° (Spielerblick – Kopfteil ragt auf, Tisch läuft nach hinten weg)
  let grad = 35;
  const blickKnopf = knopfBau(96, () => blick(grad === 35 ? 50 : 35));
  function blick(g) { grad = g; if (haken.neigung) haken.neigung(g); blickKnopf.textContent = `BLICK ${g}°`; }
  window.addEventListener('keydown', e => { if (e.key === 'e') schalte(!an); if (e.key === 'b') blick(grad === 35 ? 50 : 35); });
  function schalte(v) {
    an = v;
    for (const l of lack) l.b.m.material = v ? l.m : l.alt;
    seite.visible = v; blitzer.visible = v;
    renderer.shadowMap.type = v ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = !v;
    scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
    if (!v) { for (const k of kugeln) k.material = kugelMat; flecken.forEach((_, i) => versteck(i)); }
    haken.render = v ? () => composer.render() : null;
    haken.text = v ? ' · echt' : ' · normal';
    knopf.textContent = v ? 'ECHT an' : 'ECHT aus';
    knopf.style.background = v ? 'rgba(200,32,46,.85)' : 'rgba(10,14,22,.7)';
  }
  haken.jedesBild = jedesBild;
  haken.groesse = anpassen;
  schalte(true);
  blick(35);
  window.__ZT_ECHT = { schalte, blick, get an() { return an; }, get flaechen() { return flaechen; } };
}
