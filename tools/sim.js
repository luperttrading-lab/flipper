#!/usr/bin/env node
// Physik-Test ohne Browser: lädt index.html in eine Attrappe und steuert das Spiel über window.__TEST__.
// Aufruf: node tools/sim.js [minuten]   (Standard 10 min Autoplay)
// Prüft: 1. Abschuss erreicht das Spielfeld  2. jedes der 5 Rundziele ist mit der Kanone treffbar
//        3. Autoplay: keine Kugel verlässt den Tisch, keine bleibt hängen
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

function lade() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const nop = () => {};
  const ctx2d = new Proxy({}, {
    get: (t, k) => k in t ? t[k] : (k === 'createLinearGradient' || k === 'createRadialGradient')
      ? () => ({ addColorStop: nop }) : k === 'measureText' ? () => ({ width: 10 }) : nop,
    set: (t, k, v) => { t[k] = v; return true; },
  });
  const el = () => ({
    getContext: () => ctx2d, style: {}, classList: { add: nop, remove: nop, toggle: nop, contains: () => false },
    addEventListener: nop, getBoundingClientRect: () => ({ width: 400, height: 780 }),
    clientWidth: 400, hidden: true, textContent: '', width: 0, height: 0, setAttribute: nop,
  });
  const els = {};
  const document = {
    getElementById: id => (els[id] = els[id] || el()), createElement: () => el(),
    addEventListener: nop, visibilityState: 'visible',
  };
  const window = { __TEST__: {}, addEventListener: nop, devicePixelRatio: 1 };
  const sandbox = {
    window, document, navigator: {}, location: { protocol: 'file:' }, localStorage: { getItem: () => null, setItem: nop },
    Audio: function () { return { play: nop, pause: nop, setAttribute: nop }; }, btoa: s => Buffer.from(s, 'binary').toString('base64'),
    requestAnimationFrame: nop, performance: { now: () => 0 }, setTimeout: nop, clearTimeout: nop, fetch: nop, console, Math,
  };
  vm.createContext(sandbox);
  for (const s of scripts) vm.runInContext(s, sandbox);
  return window.__TEST__.api;
}

const DT = 1 / 60 / 12;
const lauf = (api, sek, jede) => { for (let i = 0; i < sek / DT; i++) { api.step(DT); if (jede && jede()) return true; } return false; };
let fehler = 0;
const pruefe = (ok, text) => { console.log((ok ? 'OK    ' : 'FEHLER') + ' ' + text); if (!ok) fehler++; };

// 1. Abschuss
{
  const api = lade();
  api.abzug();
  const b = api.balls[0];
  const drin = lauf(api, 1.5, () => b.x < 360);
  pruefe(drin, 'Abschuss: Kugel verlässt die Abschussrinne');
}

// 2. Kanone: für jede Schwenklage schießen und notieren, welches Rundziel getroffen wird
{
  const treffer = {};
  const api0 = lade();
  const { K_MITTE, K_AMP } = api0;
  for (let l = 0; l <= 1.0001; l += 0.01) {
    const api = lade();
    api.abzug(); lauf(api, 0.3);              // eine Kugel ins Spiel bringen
    const b = api.balls[0];
    b.rampe = null; b.halt = 0;
    api.ladeKanone(b);
    api.kanone.a = K_MITTE + K_AMP - l * 2 * K_AMP;     // feste Schwenklage, sofort feuern
    api.feuer();
    const zielVorher = api.kanone.ziel;
    lauf(api, 0.6, () => api.rundTreffer);
    const t = api.rundTreffer;
    if (t && t.kanone) {
      (treffer[t.i] = treffer[t.i] || []).push(+l.toFixed(2));
      if (t.i === zielVorher && !api.multiball) console.log('  (beleuchtetes Ziel getroffen, aber kein Multiball bei Lage ' + l.toFixed(2) + ')');
    }
  }
  for (let k = 0; k < 5; k++) {
    const ls = treffer[k] || [];
    pruefe(ls.length > 0, `Rundziel ${k + 1} mit der Kanone treffbar` + (ls.length ? ` (Lage ${ls[0]}…${ls[ls.length - 1]}, Mitte ${ls[Math.floor(ls.length / 2)]})` : ''));
  }
  // Multiball: beleuchtetes Ziel mit der Kanone treffen
  {
    const api = lade();
    api.abzug(); lauf(api, 0.3);
    const b = api.balls[0]; b.rampe = null; b.halt = 0;
    api.ladeKanone(b);
    const k = 2, l = (treffer[k] || [0.5])[Math.floor((treffer[k] || [0.5]).length / 2)];
    api.kanone.a = K_MITTE + K_AMP - l * 2 * K_AMP;
    api.kanone.ziel = k; api.kanone.wechsel = 1e9;
    api.feuer();
    lauf(api, 0.6, () => api.rundTreffer);
    pruefe(api.multiball, 'Kanonentreffer auf das beleuchtete Ziel startet den Multiball');
  }
}

// 2b. Klappziel vor dem Schädel → LOAD GUN → Schädel lädt die Kanone; Targetlicht steht bis zum Multiball
{
  const api = lade();
  api.abzug(); lauf(api, 0.3);
  const b = api.balls[0];
  pruefe(!api.sdrop.unten, 'Schädel-Klappziel steht zu Spielbeginn');
  b.x = 94; b.y = 340; b.vx = 0; b.vy = -700;
  lauf(api, 0.25, () => api.sdrop.unten);
  pruefe(api.sdrop.unten && api.gunLit, 'Treffer aufs Schädel-Klappziel beleuchtet LOAD GUN');
  b.x = 94; b.y = 330; b.vx = 0; b.vy = -700;
  const geladen = lauf(api, 2.5, () => api.kanone.kugel);
  pruefe(geladen && !api.sdrop.unten, 'Schädel-Treffer lädt die Kanone, Klappziel steht wieder');
  const z = api.kanone.ziel;
  let fest = true;
  for (let i = 0; i < 5 / DT && api.kanone.kugel; i++) { api.step(DT); if (api.kanone.ziel !== z) fest = false; }
  pruefe(fest, 'Targetlicht steht fest, solange kein Multiball läuft');
  const api2 = lade();
  api2.abzug(); lauf(api2, 0.3);
  api2.starteWahl(); api2.wahlFertig();            // Wahl 0 = Multiball
  const z2 = api2.kanone.ziel; let wandert = false;
  lauf(api2, 3, () => { if (api2.kanone.ziel !== z2) wandert = true; return wandert; });
  pruefe(api2.multiball && wandert, 'Im Multiball wandert das Targetlicht');
  // Ohne umgeworfenes Klappziel kommt keine Kugel in den Schädel
  const api3 = lade();
  api3.abzug(); lauf(api3, 0.3);
  const c = api3.balls[0]; c.x = 94; c.y = 340; c.vx = 0; c.vy = -700;
  const drin = lauf(api3, 0.4, () => c.halt > 0);
  pruefe(!drin, 'Stehendes Klappziel sperrt den Schädel');
}

// 3. Autoplay
{
  const min = +(process.argv[2] || 10);
  const api = lade();
  let still = new Map(), max = 0, spiele = 0, schuesse = 0, rundT = 0, mb = 0, letzterT = null, warMb = false;
  const W = 400, H = 760;
  let ok = true;
  for (let i = 0; i < min * 60 / DT; i++) {
    if (api.gameOver) { api.restart(); spiele++; }
    if (api.wahl) api.wahlFertig();
    if (api.loaded) api.abzug();
    if (api.kanone.kugel && Math.random() < 0.002) { api.feuer(); schuesse++; }
    // Flipper: kurz schlagen, wenn eine Kugel darüber ist, dann loslassen (kein Festhalten)
    api.flippers.forEach((f, k) => {
      const x0 = k ? 186 : 100, x1 = k ? 276 : 190;
      const da = api.balls.some(b => !b.kanone && !b.rampe && b.y > 640 && b.y < 700 && b.x > x0 && b.x < x1);
      if (f.bot > 0) { f.bot -= DT; if (f.bot < 0.25) f.on = false; }
      else if (da && Math.random() < 0.05) { f.on = true; f.bot = 0.4; }
    });
    api.step(DT);
    if (api.multiball && !warMb) mb++;
    warMb = api.multiball;
    if (api.rundTreffer && api.rundTreffer !== letzterT) { rundT++; letzterT = api.rundTreffer; }
    for (const b of api.balls) {
      if (b.rampe || b.kanone || b.ruht || b.halt > 0) { still.delete(b); continue; }
      if (b.x < 0 || b.x > W || b.y < -20 || b.y > H + 30) { ok = false; console.log('  Kugel außerhalb', b.x.toFixed(1), b.y.toFixed(1)); }
      const s = still.get(b);
      if (!s || Math.hypot(b.x - s.x, b.y - s.y) > 30) still.set(b, { x: b.x, y: b.y, t: 0 });
      else { s.t += DT; max = Math.max(max, s.t); if (s.t > 8) { ok = false; console.log('  Kugel hängt bei', b.x.toFixed(1), b.y.toFixed(1)); s.t = -1e9; } }
    }
  }
  console.log(`  ${min} min: ${spiele} Spiele beendet, Kanonenschüsse ${schuesse}, Rundziel-Treffer ${rundT}, Multibälle ${mb}, längster Stillstand ${max.toFixed(1)} s`);
  pruefe(ok, `Autoplay ${min} min: keine Kugel verloren oder hängend`);
}
process.exit(fehler ? 1 : 0);
