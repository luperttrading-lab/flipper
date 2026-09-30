# Auftrag: Bilder für den Flipper „Zero Time“ erzeugen

Repo: `luperttrading-lab/flipper` (öffentlich über GitHub Pages: https://luperttrading-lab.github.io/flipper/).
Es ist ein Flipper-Spiel im Browser (Canvas + three.js). Wir brauchen zwei neue Bilder, die ich (die andere
Sitzung, die den Code pflegt) danach exakt einbaue. **Du erzeugst nur Bilder, du änderst keinen Code.**

## Regeln (wichtig, die Seite ist öffentlich)
- Keine Namen, Logos, Figuren, Filmzitate, Marken oder erkennbaren Motive aus Filmen/Spielen. Kein Text im Bild.
- Format **9:16** (Hochformat), PNG, wenn möglich mindestens 1080 × 1920.
- **Schwarzer Hintergrund** außerhalb des Motivs (wird später per Helligkeit durchsichtig gemacht).
- Draufsicht, **orthografisch, ohne Perspektive**.
- Die Vorlagen unten sind **verbindlich**: Form, Lage und Anzahl der Pfosten dürfen nicht abweichen.
  Bevorzugt ein Verfahren mit Bild-Eingabe und Kantenführung (z. B. `flux-pro-canny`, `flux-pro-depth`,
  `flux-kontext-edit`, oder ein Bildbearbeitungsmodell wie Nano Banana / GPT Image mit angehängter Vorlage),
  nicht reines Text-zu-Bild.
- Keine API-Schlüssel oder Zugangsdaten irgendwo ins Repo schreiben.

## Vorlagen (im Repo, Ordner `bilder/vorlagen/`)
| Datei | Zweck | Direktlink |
|---|---|---|
| `schleuder_vorlage.png` | Umriss der Schleuder (Dreieck, drei Kreise = Pfosten) | https://luperttrading-lab.github.io/flipper/bilder/vorlagen/schleuder_vorlage.png |
| `schleuder_ist.png` | so sieht die Schleuder jetzt aus (nur Stilvergleich) | https://luperttrading-lab.github.io/flipper/bilder/vorlagen/schleuder_ist.png |
| `rampe_vorlage.png` | gerader Rampenstreifen, senkrecht, weiße Linien = Schienen | https://luperttrading-lab.github.io/flipper/bilder/vorlagen/rampe_vorlage.png |

## Bild A – Schleuder (Vorlage: `schleuder_vorlage.png`)
```
Use the attached silhouette as the EXACT shape and position: a narrow right triangle, top-down orthographic view, no perspective. Fill this triangle with a glossy pinball slingshot kicker made of translucent red plastic with a thick bevelled inner edge, subtle molded ridges, and a warm highlight from the top-left. Exactly three polished chrome posts, one at each corner circle of the template (no additional posts). A black rubber band is stretched between the two posts along the long slanted edge only. The plastic must not extend beyond the template outline. Pure black background outside the triangle. Sci-fi industrial style, dark steel accents. No text, no logos, no characters, no watermark. Keep the aspect ratio 9:16.
```
Prüfliste: genau 3 Pfosten · Dreieck deckt sich mit dem Umriss · Gummiband nur an der langen Schrägkante ·
roter, durchscheinender Kunststoff mit Glanz · kein Text.

## Bild B – Rampenstreifen (Vorlage: `rampe_vorlage.png`)
```
Use the attached template as EXACT layout: a perfectly straight pinball ramp running vertically through the full image height, centered, top-down orthographic view, no perspective. The ramp is a clear, slightly smoked-blue transparent plastic surface with soft light reflections, long glossy streaks and fine scratches. Along the left and right edge of the strip (the two white lines of the template) run polished chrome side rails with strong specular highlights. Glowing orange chevron arrows are printed on the plastic pointing UP, evenly spaced about every 180 px. Pure black background outside the ramp. Realistic 3D-rendered look, sharp, high contrast. No text, no logos, no characters, no watermark. Keep the aspect ratio 9:16.
```
Prüfliste: Streifen gerade und senkrecht, gleiche Breite über die ganze Höhe · Schienen genau auf den zwei Linien ·
Pfeile zeigen nach oben · kein Text.

## Abgabe
1. Pro Bild 3–4 Varianten erzeugen und die beste auswählen (Prüfliste!). Die anderen nicht abgeben.
2. Dateien benennen: `bilder/eingang/schleuder_v1.png`, `bilder/eingang/rampe_v1.png` (bei Überarbeitung `_v2` …).
3. **Nur auf einem eigenen Branch `bilder-eingang` einchecken und pushen, nicht auf `main`**, und nur Dateien unter
   `bilder/eingang/` anlegen. Keinen Code, keine Versionsnummer, kein `sw.js` anfassen. Keinen Pull Request öffnen.
4. Dem Nutzer melden, welche Datei welches Bild ist und welches Modell/welche Einstellung du benutzt hast.
   Der Nutzer sagt es dann der Code-Sitzung, die die Bilder einbaut.
