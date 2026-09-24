# Flipper

## Kostenanzeige

An jede Antwort genau eine Kostenzeile anhängen: erst `python3 tools/kosten.py` ausführen, dann die
Ausgabe **wörtlich** als letzte Zeile setzen (roh, kein Codeblock, nichts dahinter, nicht umformatieren,
nicht schätzen). Läuft das Skript nicht, das offen sagen statt eine Zahl zu erfinden.

## Auslieferung

GitHub Pages aus dem Repo-Wurzelverzeichnis. Bei **jeder** Änderung an der App `APP_VERSION` in
`index.html` hochzählen (nie zurück) – daran erkennt die Home-Bildschirm-App ein Update.
`sw.js` holt eigene Dateien „Netz zuerst“; `skipWaiting()`/`clients.claim()` nicht entfernen.

## Branches

GitHub Pages baut aus `main`. Der Nutzer hat erlaubt, Änderungen direkt nach `main` zu pushen
(zusätzlich zum Arbeits-Branch), damit sie sofort in der Home-Bildschirm-App ankommen.

## Projektziel: „Zero Hour“

Eigener Tisch mit den Funktionen von Williams „Terminator 2“ (1991), aber **ohne** dessen Namen,
Logos, Bilder oder Filmzitate (Seite ist öffentlich). Festgelegt:
- Name: **Zero Hour**
- Abschuss per **Abzug-Knopf** (unten zwischen den Flipper-Knöpfen), keine Wisch-Feder mehr
- **Kanone** wie im Original: schwenkt nach dem Laden automatisch hin und her, Abzug feuert,
  Treffer aufs beleuchtete Ziel startet Multiball; nach einigen Sekunden feuert sie selbst
- Reihenfolge: 1 Layout (Schleudern, Seitengassen, Klappziele, Schädel) · 2 Regelwerk/Anzeige ·
  3 Rampen (zweite Ebene) · 4 Kanone · 5 Multiball
- Layout nach Fotos des Nutzers vom Originaltisch (Draufsicht unbeleuchtet + 5 beleuchtete Fotos erhalten)
- Stand 0.10 (Stufe 1): Layout nach Draufsicht-Foto: Umläufe links/rechts, 3 obere Gassen, 3 Pop-Bumper,
  Schädel-Loch links oben, 3 Klappziele, 3 Stehziele rechts, Schleudern, Seiten-/Rückkehrgassen,
  Abzug-Knopf. Rampen vorerst als Tunnel (Kugel fährt die Bahn als Animation ab). Linke Ausgasse
  ist durch die Umlauf-Zuführung abgedeckt. Kanone und Multiball fehlen noch.
- Stand 0.11: Beleuchtung (Einsatzlampen mit Zuständen an/blinkt/Lauflicht, Lichtshow im Wartezustand,
  Blitzer, Grundlicht), Punktmatrix-Anzeige 128×32 oben, schräge Ansicht per CSS, Kugelrettung 8 s,
  Extra Ball bei Alarm 5, Hold Bonus ab Alarm 2. Kanone feuert beim Drücken des Abzugs (Vorschlag).
- Stand 0.12: Mehrere Kugeln (Array `balls`), Kanone links (Drehpunkt 44/440, schwenkt −47°…+24°, feuert beim
  Drücken des Abzugs oder nach 7 s selbst). Laden: jeder 2. Schädel-Treffer beleuchtet LOAD GUN, der nächste
  Schädel-Treffer schickt die Kugel in die Kanone. Treffer aufs blinkende Stehziel → Multiball (3 Kugeln,
  12 s Rettung), Rampen = Jackpot 1.000.000. Die 5 gelben Winkel-Lampen zeigen die Zielrichtung.
- Stand 0.13 (nach Video-Standbildern): runde rote Klappziele unter den Bumpern, Mittelsäule 3×4
  (Grün/Rot/Blau/Orange), Winkel-Lampen als gelb umrandete Trapeze, Anzeige rot-orange mit Fadenkreuz im
  Kanonen-Modus („FEUER FREI“), Payback-Modus (4 Klappziel-Reihen → 25 s doppelte Punkte), Kickback in der
  rechten Ausgasse (alle 3 Stehziele), Abzug-Knopf als Chromgriff.
- Stand 0.14: Sicherheits-Säulen wie im Original (CHECK · CODE · ALARM · KEY · CPU, Sonnenstrahl-Einsätze):
  linke Rampe füllt links, rechte rechts; beide voll → „PAYBACK ZEIT“ 25 s doppelte Punkte. Mittelsäule voll
  → 1.000.000. Anzeige zählt die letzten 5 s vor dem Selbstschuss der Kanone groß herunter.
- Stand 0.15: Leiter links mit 6 Stufen wie im Original (SEC. PASS … 10 MILLION; Stufe 4 beleuchtet die
  Kanone, 5 = Extra Ball, 6 = 10 Mio). Auswahlmenü „WAHLMÖGLICHKEITEN“ nach 5 Umläufen: Spiel steht,
  Flipper-Knöpfe wählen, Abzug bestätigt (Multiball / Bel. Extra Ball / 500.000 / Payback), nach 8 s automatisch.
- Stand 0.16: Schädel-Gasse mit 5 Einsätzen wie im Original (SUPER, LOAD GUN, EXTRA BALL, JACKPOT, TIMER),
  Schädel im Multiball = Jackpot. HURRY UP: jede abgeräumte Klappziel-Reihe startet 20 s Countdown
  (3 Mio → 500.000), die rechte Rampe kassiert.
- Physik-Test: Node-Simulation mit `window.__TEST__` (Abschuss-Pfad + 10 min Autoplay: Kugel
  verlässt nie den Tisch, bleibt nie hängen).
