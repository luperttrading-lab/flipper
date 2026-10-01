# Auftrag: Kopfteil-Bild (Hinterglas) für „Zero Time“

Ziel: Bild für den großen Kopfteil des 3D-Tisches (`kopf.jpg`, wird in `drei.js` geladen; fehlt es, zeigt der Tisch einen
gezeichneten Platzhalter). Seite ist öffentlich → **keine** echten Personen, Schauspieler, Filmfiguren, Logos oder Text.

- Format: **4:3 quer** (z. B. 1376 × 1032 oder 1024 × 768), JPG/PNG. Bildfläche im Spiel ≈ 420 × 330 Einheiten
  (wird auf diese Fläche gestreckt – 4:3 passt fast genau, 1,27:1).
- Stil: wie ein Flipper-Hinterglas der frühen 90er (Airbrush), kräftige Kontraste, Stahlblau + Orange-Rot.

Prompt (englisch, für Gemini / Nano Banana / Abacus `gemini-3.1-flash-image`):

```
Pinball machine backglass artwork in landscape format. An original, invented sci-fi action scene from a fictional movie.
Center foreground: a menacing robot head built from riveted brushed-steel plates with two glowing orange eyes (clearly
mechanical, no human face, no red eyes). Behind it: a ruined futuristic city at night, searchlight beams crossing the sky,
a giant cracked clock face hanging in the sky with its hands almost at twelve. Left: a hovering armored drone firing a red
laser. Right: a silhouetted resistance fighter in a long coat holding a heavy energy cannon, seen from behind. Dramatic
airbrushed 1990s pinball backglass painting style, high contrast, deep steel blue and orange-red palette, lens flares,
sparks. Absolutely no text, no letters, no numbers, no logos, no watermark, no real people, no recognizable actors or
movie characters.
```

Prüfliste: kein Text · kein menschliches Gesicht im Vordergrund · keine roten Augen · Uhr auf fast zwölf sichtbar.
Abgabe: Datei als `bilder/eingang/kopf_v1.png` (Bilder-Sitzung) oder direkt an die Code-Sitzung; Einbau = als `kopf.jpg`
ins Wurzelverzeichnis (max. ~400 KB, 1024 × 768) und in die Cache-Liste von `sw.js` aufnehmen.
