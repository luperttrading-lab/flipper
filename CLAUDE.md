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

## Projektziel: „Zero Time“

Eigener Tisch mit den Funktionen von Williams „Terminator 2“ (1991), aber **ohne** dessen Namen,
Logos, Bilder oder Filmzitate (Seite ist öffentlich). Festgelegt:
- Name: **Zero Time** (bis 0.17 „Zero Hour“; vom Nutzer in 0.18 umbenannt. „Fighting Machine“ als Alternative
  verworfen – zu lang für die Anzeige in großer Schrift, max. 10 Zeichen)
- Abschuss per **Abzug** – kein Knopf: Tipp **genau auf die wartende Kugel** rechts unten (Ring pulsiert, „ABZUG“ in der
  Rinne); **Kanone feuert per Tipp auf die Kanone selbst** (roter Ring, „FEUER“); Wahl-Menü bestätigt per Tipp auf die Rinne.
  Jeder andere Tipp ist ein Flipper-Tipp (seit 0.29, gegen versehentliches Abschießen). Keine Wisch-Feder.
  **Flipper seit 0.26 per Tipp auf die linke/rechte Bildschirmhälfte** (keine Flipper-Knöpfe mehr, Mehrfinger möglich)
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
- Stand 0.17 (Kanonen-Korrektur): Kanone sitzt jetzt **rechts** (Kasten auf Drehsockel mit blauem Ring, Drehpunkt
  340/548), schwenkt geladen zwischen PI+0,28 und PI+0,72 rad, Abzug feuert nach links oben quer übers Feld, nach 7 s
  feuert sie selbst. Links unter dem gezeichneten Chrom-Flugobjekt (42/360) an der Fluchtweg-Gasse 5 weiße Rundziele
  (x 61, y 386…446); eins ist beleuchtet und wandert (alle 3 s, bei geladener Kanone alle 1,4 s, nach dem Schuss steht
  es). Kanonentreffer aufs beleuchtete Ziel → Multiball (im Multiball 1 Mio), aufs falsche → 25.000. Ohne Kanone:
  beleuchtet 50.000, sonst 10.000. Gelbe Winkel-Trapeze direkt vor den Zielen zeigen das Targetlicht. Die 3 orangen
  Stehziele rechts (jetzt y 460/485/510) sind nur noch für den Kickback. Der Kanonenschuss prallt oberhalb von Lage
  ≈0,27 am Rampenpfosten (172/405) ab – Ziele deshalb nicht höher setzen.
- Stand 0.18 (nach Recherche zum Original): **Klappziel vor dem Schädel** (Chromplatte quer über die Gasse, y 300) sperrt
  das Schädel-Loch; umgeworfen → LOAD GUN, der nächste Schädel-Treffer lädt die Kanone, danach steht es wieder.
  Die alte Regel „2 Schädel-Treffer“ ist entfallen. Alarmstufe 4 und Multiball legen es ebenfalls um. **Targetlicht steht
  fest**, bis die Kanone geschossen hat (ohne Treffer auf das beleuchtete Ziel → neues Ziel). Nur **im Multiball wandert es**
  (alle 1,6 s, bei geladener Kanone alle 0,9 s). Im Multiball lädt der Schädel die Kanone erneut: Treffer auf das
  beleuchtete Ziel = SUPER JACKPOT 5 Mio. Kollision des Klappziels nur von unten, damit die ausgeworfene Kugel durchkommt.
- Stand 0.19 – **Escape Route wie im Original** (Recherche: Die 6 Felder links unten SIND die Escape Route, kassiert wird
  über den linken Umlauf, der in die Mulde oben rechts läuft). Die Leiter links (SEC. PASS · HOLD BONUS · LITE LANES ·
  MULTIBALL · EXTRA BALL · 10 MILLION) hängt **nicht mehr an den Rampen**. Stattdessen: Zu Spielbeginn blinkt SEC. PASS,
  jede komplette rote Mittel-Bank schaltet das nächste Feld ein, der linke Umlauf (Kugel bekommt 3 s `fluchtBis`) → neue
  **Mulde oben rechts** (350/250, in der rechten Umlauf-Gasse, fängt nur abwärts laufende Kugeln) kassiert das unterste
  blinkende Feld, eins je Umlauf, nach allen sechs von vorn. Felder: SEC. PASS = beide Säulen +1 und 250.000, HOLD BONUS =
  Bonus und Multiplikator gehen auf die nächste Kugel über, LITE LANES = Rückkehrgassen 25.000 und **Hurry Up** (startet
  nicht mehr bei jeder Mittel-Bank), MULTIBALL = Kanone bereit (Klappziel fällt), EXTRA BALL, 10 MILLION. Rampen: 100.000
  und je eine Säulen-Stufe (Meldung CHECK/CODE/ALARM/KEY/CPU). Die Variable `stufe` ist entfallen: Uhrzeiger und Anzeige
  („FLUCHT n“) zeigen die kassierten Felder.
- Stand 0.20: neues App-Icon vom Nutzer (per Bildprogramm nach unserer Beschreibung: Chromkugel mit rotem Fadenkreuz,
  zwei Flipperarme, Uhr mit Zeiger auf 12, roter Ring). Quelle 1024 px, daraus icon-512, icon-192, apple-touch-icon (180).
- Stand 0.21: Schädel im Spiel ist jetzt ein Bild vom Nutzer (`schaedel.png`, Stahlplatten-Schädel mit Nieten und orangen
  Augen, bewusst **kein** Endoskelett-Look: keine roten Augen, keine Kolben/Kabel). Schwarzer Hintergrund per Helligkeit
  freigestellt, 144 px breit, im Spiel 48 px breit über dem Loch. Die Augen glühen per Leuchtschein (pulsierend, voll bei
  belegtem Loch). Die Datei steht in der Cache-Liste von `sw.js`.
- Stand 0.22: App-Icon ersetzt durch Nutzer-Entwurf mit Stahlplatten-Schädel (orange Augen), kleiner Chromkugel und zwei
  Flipperarmen, roter Ring; ohne Uhr. Quelle nur 512 px (reicht für alle drei Größen).
- Stand 0.23 (nach dem Handy-Video): **Jackpot-Show** – Grundbeleuchtung flackert 3× (5 Hz), 0,6 s dunkel (Overlay über
  dem Tisch, nur der Leuchtschein der Einsätze bleibt, Anzeige zeigt nur die Punktzahl), dann 0,3 s heller Rückschlag;
  dabei Lauflicht die Sicherheits-Säulen hinauf (abwechselnd L/R) und die Fächer um RESCUE leuchten. **Jackpot verdoppelt
  sich** im Multiball (1 → 2 → 4 … max. 16 Mio, `jpMult`, Anzeige „JP 2X“, danach Meldung „NÄCHSTER 2X JACKPOT“); gilt
  für Rampen, Schädel, Wahl-Menü und Super Jackpot (5 Mio × jpMult). **Kurzer Lichteinbruch** (0,1 s) bei Kanonenschuss
  und Kickback. **Ton:** Bumper jetzt mechanischer Schlag statt Dur-Akkord; **Sirene** (2,5 s steigend) bei
  Multiball-Start und nach jedem Jackpot; **eigene Multiball-Musik** (a-Moll, 132 BPM, Bass-Achtel A–A–F–G + Kick + Snare,
  Web-Audio-Sequenzer, läuft nur im Multiball und nicht im Pause-Schirm; nicht nach Gehör geprüft).
- Stand 0.24/0.25 (Bildschirm; 0.25 = Korrektur: Kopfzeile per id="kopf", da die Test-Attrappe kein querySelector kennt): „Ton an“ und Versionsnummer **nicht mehr oben**, sondern klein unten auf dem Start-/Pausenschirm
  (Tipp darauf startet das Spiel nicht). Startschirm beim ersten Öffnen als **Startbild** (`start.jpg`, fehlt es noch, zeigt
  er das App-Icon); der Pausenschirm bleibt halbtransparent. Knöpfe flacher (54 px, Abzug 60 px), Anzeige max. 320 px breit,
  Seitenrand 10 px, Neigung 10° statt 13°, Perspektive 1300 px, Tisch unten ausgerichtet; die Anzeige wird per `translateY`
  direkt über den perspektivisch verkürzten Tisch geschoben. Tisch dadurch 705 statt 663 px hoch (430×932), 530 statt 482 px
  (375×667). Hinweis: Auf großen iPhones begrenzt die **Breite** den Tisch, nicht die Höhe.
- Stand 0.26 (Steuerung, Idee des Nutzers): Knöpfe „Links“/„Rechts“ entfernt; Tipp irgendwo auf die linke/rechte
  Bildschirmhälfte = Flipper (Pointer-Events auf `window`, je Finger `pointerId` → Seite, mehrere Finger gleichzeitig;
  Abzug, Start- und Update-Schirm ausgenommen; im Wahl-Menü blättert die Hälfte; bei Game over startet ein Tipp neu).
  `touch-action: none` auf html/body. Abzug schwebt 52 px rund rechts unten über der Abschussrinne (erst mittig probiert:
  verdeckte Flipperspitzen und Ablauf – verworfen). Startschirm zeigt einen Hinweis zur Steuerung. Tisch 708 px (430×932),
  569 px (375×667, vorher 482). Skalierung `st.height / (H * 0.96)`: bei 0.9 schob sich der Tisch über die Anzeige.
- Stand 0.27: Screenshot des Nutzers vom iPhone zeigte: **Tisch verdeckte die untere Anzeigezeile**, unten blieb Luft.
  Ursachen: (1) auf dem Gerät begrenzt die **Höhe** (nicht die Breite, Annahme aus 0.24 war falsch), die feste Skalierung
  `H * 0.96` passte nicht zur Perspektive; (2) `body` hatte nie `margin: 0` (8 px Browser-Rand). Jetzt: `resize()` vergrößert
  den Tisch schrittweise, bis seine **sichtbare** Oberkante 6 px unter der Anzeige liegt (nie darüber, max. Breite); Abzug
  42 px in eigener Zeile unter dem Tisch (Nutzerwunsch). Gemessen mit simulierter Status-/Home-Leiste: 430×932 → Tisch
  694 px, 393×852 → 614 px, 375×667 → 502 px; Anzeige überall frei, Abzug unter dem Tisch.
- Stand 0.28 (Nutzerwunsch): Knopfzeile entfernt, **Abzug = Tipp auf die Abschussrinne** (`imAbzugFeld`: Tischkoordinaten
  x ≥ LANE_X−12, y ≥ 560, aus dem sichtbaren Rechteck des Canvas umgerechnet; unten ist die Perspektive fast unverzerrt).
  Senkrechte Beschriftung „ABZUG“ in der Rinne, pulsierender Ring um die ruhende Kugel. Tisch reicht bis zur Home-Leiste
  (`#stage` unten nur `safe-area-inset-bottom` frei – sonst schneiden die runden Bildschirmecken die Kugel ab). Anzeige-Texte
  „KUGEL ANTIPPEN“ / „ANTIPPEN FÜR NEUES SPIEL“. Gemessen (Status- und Home-Leiste simuliert): 430×932 → Tisch 729 px,
  393×852 → 663 px, 375×667 → 551 px; Anzeige frei; Tipp rechts auf den Tisch = Flipper, Tipp auf die Kugel = Abschuss.
- Stand 0.29 (versehentliches Abschießen verhindert): `tischPunkt(cx, cy)` rechnet Bildschirm → Tisch **exakt** für die
  schräge Ansicht um (rotateX 10° um die Unterkante, Perspektive 1300 px ab Bühnenmitte; `NEIGUNG`/`PERSP` im Skript müssen
  zu `#c`/`#stage` im CSS passen!). Eichung gegen `getBoundingClientRect`: oben Mitte → (200, 0), unten links → (0, 760) auf
  0,1 genau. `imAbzugFeld`: Kugel nur im Radius 26 um (SHOOT_X, SHOOT_Y) und nur wenn eine Kugel wartet; Kanone nur im
  Radius 32 um den Drehpunkt; Wahl-Menü Radius 30 in der Rinne; sonst Flipper (vorher schluckte die ganze Rinne jeden Tipp).
  Anzeige im Kanonen-Modus wechselt „FEUER FREI“ / „KANONE ANTIPPEN“. Seitenrand 4 px statt 10 → Tisch 419×743 (430×932).
  Platz gemessen: unten 0 px frei (bis Home-Leiste), seitlich je ~6 px, über der Anzeige 6–20 px → praktisch ausgereizt.
- Stand 0.30 (Nutzer: „Ball viel zu schnell“): **`TEMPO = 0.7`** – die Spielzeit läuft in `frame()` mit 0,7 × Echtzeit
  (Physik unverändert, nur die Uhr). Begründung: echter Tisch 107 cm, 6,5° → rollend g·sin(6,5°)·5/7 ≈ 0,79 m/s² ≈ 560
  Einheiten/s²; wir rechnen G = 1150 → Zeitskala √(1150/560) ≈ 1,43 zu schnell. Alle Spielzeiten (Hurry Up, Kanone 7 s,
  Payback …) dauern dadurch real ×1,43. **Einrollen:** neue Kugel startet oben in der Abschussrinne (y 330) und rollt in
  1,3 s Spielzeit (≈ 1,9 s real) beschleunigt hinunter, rastet mit Klick ein; erst dann Ring/„ABZUG“ und Abschuss möglich
  (`abschussBereit()`). Multiball-Nachschub und Kugelrettung schießen weiter sofort automatisch. `tools/sim.js` wartet in
  `lade()` das Einrollen ab und prüft es (23/23 OK, 3 × 10 min ohne Fehler).
- Stand 0.31: **Startbild** vom Nutzer (Gemini) als `start.jpg` (768×1376; der fehlerhafte Schriftzug „LOADIND…“ unten wurde
  mit der Hintergrundfarbe #0b131d übermalt). `.splash-bild` bildet „cover“ nach (`width: max(100vw, 100vh·768/1376)`,
  `aspect-ratio`), Texte in % der Bildfläche: „Antippen zum Starten“ bei 94,3 % (Stelle des alten Ladetextes) im 6-s-Wechsel
  mit der Kurzanleitung, rote Leuchtschrift (Bungee); **Versionsnummer** dezent rechts unter dem Anzeige-Rahmen des Bildes
  (Tipp = Update-Prüfung). **Ton-Schalter nicht mehr auf dem Startschirm**, nur noch auf dem Pausenschirm (Nutzerwunsch;
  ganz weglassen geht nicht, weil die App bewusst auch bei Stummschalter spielt). `start.jpg` in der Cache-Liste von `sw.js`.
- Stand 0.32 (Nutzer-Rückmeldung am Gerät): **Einrollen** 2,0 s Spielzeit (≈ 2,9 s real), Verlauf y ∝ e^2,6 (anfangs langsam,
  am Ende schnell). **„Kugel geht durch die Bumper“** war keine Physik (gemessen: 10 min Autoplay, 0 Schritte mit Kugel im
  Bumper), sondern die Rampen-Animation, deren Bahn über die Bumper führt und kaum zu sehen war → Rampen jetzt als
  erhöhte, durchscheinende Klarsichtbahn (Schatten, zwei helle Schienen, getönter Kunststoff), Kugel darauf 1,2× größer.
  **Obere Gassen schwer:** gemessen 0/60 Abschüsse laufen durch eine Gasse (Abschuss fliegt mit Mittelpunkt y≈21 über die
  Pfosten, die bei y=52 beginnen), im Autoplay nur ~1,6 Durchläufe/min → für alle drei per Zufall im Schnitt 5,5 Durchläufe
  ≈ 3,4 min. Neu: **Gassenwechsel (LANE CHANGE, wie am Original)** – jeder Flipperdruck schiebt die beleuchteten Gassen
  (links/rechts), so zählt jeder Durchlauf. Verworfen: Abweiser links an den Gassen (lenkte den Abschuss zurück, Kugel hing
  dann oben an der Abschussrinne bei x≈375, y≈270; ein schwacher Abschuss ~1300 landet dort ebenfalls – beim Rampenumbau
  im Blick behalten). Test 24/24 OK, 3 × 10 min ohne Fehler.
- Stand 0.33: Das gezeichnete **Chrom-Flugobjekt ist ersetzt** (war als Form unverständlich) durch eine **Zielmarkierung**:
  Eckklammern um die fünf Rundziele (x 50–93, y 371–447; 0.34: unten frei vor „10 MILLION“, LOAD GUN auf x 117 gerückt)
  und ein Fadenkreuz darüber (71/355). Ruhig gedämpft grau; bei
  geladener Kanone pulsieren beide rot, und ein Visier-Ring sitzt auf dem beleuchteten Ziel (`zeichneZielmarke()`).
- Stand 0.35: **Rampen leichter zu treffen:** Einlaufpfosten auseinander (links 134/178, rechts 256/300 statt 140/172 und
  262/294; Einlauf 34 statt 22 breit, bei Kugel-Ø 18 also ±8 statt ±2 Spiel), Einfahrtsbereiche angepasst. Gemessen 10 min
  Autoplay: 65 statt 22 Rampentreffer. Kanonen-Scan danach unverändert (Ziel 1–5 bei denselben Lagen). **Optik:** Rampen mit
  zwei kräftigen Schienen (Hilfsebene `schienen`, Mitte per `destination-out` ausgestanzt) und kaum getönter Fläche;
  Kanone größer (Sockel r 20, Kasten 28, Tipp-Radius 40), gestrichelte Ziellinie reicht jetzt bis zu den Rundzielen (300);
  Fadenkreuz/Klammern in Ruhe warm-orange statt blassgrau, dicker. Physik der Kanone unverändert (K_LAUF).
- Stand 0.36: Schädel größer (66 statt 48 Einheiten breit, Augen-Leuchtschein 24 statt 18), weiter über dem Loch (Unterkante y 248).
- Stand 0.37 (nach Foto des Originals): **Flipper länger** (FL 66 statt 58), Drehpunkte nach außen (112,1 / 263,9 statt 119 / 257),
  sodass die Spitzen bei 170 / 206 bleiben → Mittellücke unverändert (Kugel fällt weiter durch die Mitte, geprüft). **Form wie
  am Original/Startbild:** runder Kopf (r 9) am Drehpunkt, verjüngt zur Spitze (r 5,5), roter Gummiring, weißer Körper, Achse.
  Kollision unverändert als Kapsel R+7. **Rückkehrgassen ohne Knick:** schräge Führung liegt exakt auf der Verlängerung der
  Oberkante des ruhenden Flippers (Winkel 0,5 rad, um 7 zur Oberkante versetzt), von (40 / 640,6) bis (115,4 / 681,9) bzw.
  gespiegelt. Gemessen: Kugel aus der Rückkehrgasse springt am Übergang nicht mehr hoch (vorher 119 Einheiten/s aufwärts).
- Stand 0.38 (nach Foto des Originals): **Bumper** als rote Kunststoffkappe gezeichnet (Schatten, weißer Sockel,
  durchscheinender Rand, Innenring, erhöhter Deckel mit Glanzlicht, beim Treffer hell). **Rote Dreierreihe = Stehziele**
  statt Klappziele (bestätigt die Vermutung aus der Recherche): runde Scheiben mit Niete auf Halterung, bleiben stehen
  (Kugel prallt immer ab), getroffen leuchten sie (`drops[i].an`); Treffer zählt nur mit Aufprall > 40 und 0,25 s Abklingzeit;
  schon beleuchtet = 5.000; alle drei → wie bisher Reihe komplett (CORE, Schädel-Wert, Escape Route), nach 1,2 s aus.
  Variable heißt weiter `drops`. Test 25/25 (neu: Stehziel bleibt stehen), 3 × 10 min ohne Fehler.
- Stand 0.39: **Führungslinien als Metallbleche** (`zeichneWaende`): Schatten (versetzt 2,2/3), dunkle Kante, Stahlkörper,
  Glanzstreifen und Spitzlicht nach links oben; an **freien Enden** (einmal vorkommende Endpunkte, einmalig berechnet in
  `freieEnden`) kleine Chrom-Pfosten r 4,2 – dadurch auch an den Schleuder-Ecken. Schleudern selbst noch alt (rotes Dreieck):
  Bild-Auftrag an den Nutzer (Gemini), Einbau per Beschnitt auf die Dreiecksform geplant.
- Stand 0.40: **Schleudern mit Bild** (`schleuder.png`, 210×420, 5 px/Einheit, Ausschnitt ab 66/568, 42×84 Einheiten). Quelle:
  Gemini-Bild des Nutzers – Form/Pfosten/Gummi dort falsch (6 Pfosten, Gummischleife), daher nur das rote Kunststoffteil
  (Farbmaske) per **affiner Abbildung** Dreieck→Dreieck exakt auf unsere Schleuder gelegt (Ecken Quelle 92/164, 40/305,
  200/420 → 70/572, 70/628, 104/648) und auf das Dreieck beschnitten; rechte Schleuder gespiegelt an x = 188. Darunter
  dunkelrote Grundfläche (Lücken an den runden Ecken), beim Schlag hell überblendet. In `sw.js` gecacht.
  **Vorlagen-Methode für weitere Bilder:** flaches Tischbild über lokalen Server (`python3 -m http.server`, sonst ist die
  Zeichenfläche wegen file:// „tainted“) per `canvas.toDataURL`, Formvorlagen weiß auf schwarz je Element.
- Stand 0.41: **Schleuder-Bild ersetzt** durch das zweite Gemini-Bild des Nutzers (Form diesmal richtig: schmales Dreieck,
  3 Pfosten, Gummiring). Übernommen **samt Gummi und Pfosten**: Pfosten im Bild (47/77, 46/342, 209/431) per affiner
  Abbildung exakt auf die Schleuder-Ecken (70/572, 70/628, 104/648), Maßstab fast gleichmäßig (0,96/0,95); schwarzer
  Hintergrund per Helligkeit durchsichtig; `schleuder.png` 270×480 = 5 px/Einheit, Ausschnitt ab (60/562), 54×96.
  Die zwei Außenkanten der Schleuder sind als `schleuder: true` markiert → keine Metallbleche/Pfosten/weiße Kante mehr darüber,
  solange das Bild geladen ist (`schleuderBildOk()`); sonst Rückfall auf das alte rote Dreieck. 0.42: roter Lichtschein
  außerhalb des Gummis an der langen Seite weggeschnitten (alles > 14,5 px = 2,9 Einheiten außerhalb der Kante).
- Stand 0.43: **Chase Loop** (rechter Umlauf, wie am Original): Kugel läuft den rechten Umlauf hinauf (Schalter x 330…LANE_X−2,
  y 340, vy < −150; die Abschussrinne liegt rechts davon und zählt nicht) → 250.000; innerhalb von 5 s Spielzeit erneut =
  Kombo 1 / 2 / 3 Mio („CHASE LOOP 2X“ …). Zwei blaue Pfeile im Umlauf (Lauflicht, schnell blinkend im Kombo-Fenster).
  **Befund dabei:** Der rechte Umlauf war vom Spielfeld aus praktisch unerreichbar – Öffnung zwischen Führungsende (326/420)
  und Abweiser nur 19 Einheiten bei Kugel-Ø 18. Führung jetzt bis y 382 (Öffnung ≈ 43). Gemessen: Schuss vom linken Flipper
  (175/670, 1700) trifft bei 59–62° (4 von 16 Winkeln); Kugel läuft über den Bogen und den linken Umlauf zurück.
  Abweiser (364/402–330/446) bleibt, damit Kugeln von oben nicht in die rechte Ausgasse fallen. Test 26/26, 11 × 10 min
  Autoplay ohne Fehler (einmal 3,4 s Stillstand, nicht reproduzierbar, sonst ≤ 1,3 s).
- Stand 0.44 (Nutzerwunsch per Screenshot): **Tipp-Hinweis** links/rechts unter den Rückkehrgassen (66/714 und 310/714): dezenter
  Ring mit Punkt und kleinem Bogen darüber (Alpha 0,16), leuchtet beim Flipperschlag auf (0,55); seit 0.45 nur bei Kugel 1 (`ballNo === 1`). Obere Gassen: Nutzer vermutete
  zu hohe Pfosten – gemessen widerlegt (Pfostenhöhe fast egal; Kugel > ~500/s bleibt am Bogen, Abschuss ~1900/s läuft immer
  darüber). Vorschlag offen: Skill Shot (streuende Abschussstärke, nicht unter ~1350) und/oder breitere Gassen.
- Stand 0.46: **3D-Prototyp** (damals Testseite `index.html?3d`; seit 0.54 Standard). `drei.js` (ES-Modul) + `lib/three.module.min.js`
  (three.js r170, MIT, per npm geholt – jsDelivr ist in der Sandbox gesperrt; lokal im Repo, läuft offline). Physik/Regeln bleiben
  2D; die 2D-Zeichnung (fest 800×1520) ist die **Bodentextur** (auch als emissiveMap → Einsätze leuchten). Mit `DREI` lässt `draw()`
  Bleche, Pfosten, Bumper-Kappen, Flipper, Kugeln und Rampen weg; `drei.js` baut sie in 3D: Stahlbleche (InstancedMesh), Chrompfosten
  an freien Enden, Bumper (Sockel/Kappe, leuchten bei `flash`), extrudierte Flipper, Chromkugeln, **Drahtrampen** entlang der
  Tunnel-Bezierbahnen (Höhe 72 links / 46 rechts, 4 Drähte, Stützen), Gehäuse. Umgebung für Spiegelungen selbst gebaut (PMREM aus
  Leuchtflächen). Kamera 68° geneigt, passt Spielfeld auf Breite, unten bündig. `tischPunkt` per Raycast (`window.__ZT3D`),
  geprüft: Tisch→Bildschirm→Tisch exakt. Daten für drei.js in `window.__ZT`. Offen: Leistung auf dem iPhone (in der Sandbox nur
  Software-Rendering, nicht messbar), Schädel/Kanone/Ziele noch flach auf der Textur, Rampen-Physik weiter als Tunnel.
- Stand 0.47 (3D-Prototyp, Verbesserungen ohne Gerätemessung): **Schädel aufrecht** (Bild als Ebene, 32° nach hinten geneigt,
  Augen als additive Sprites, pulsieren wie in 2D) und **Kanone als 3D-Teil** (Sockel mit blauem Ring, Kasten, Lauf, rote Lampe,
  dreht mit `kanone.a`); beides wird im 3D-Modus nicht mehr auf die Textur gemalt (Ziellinie und Tipp-Ring bleiben 2D).
  **Leistung:** 2D-Zeichnung + Textur-Upload nur noch jedes 2. Bild (`gezeichnet`-Zähler, dt wird aufsummiert), Schatten
  PCF 1024 statt PCFSoft 2048, **automatische Auflösung** 2× → 1,5× → 1,25× → 1× wenn < 40 fps (nach 3 s Warmlauf, je 1,5 s
  Messfenster), zuletzt Schatten aus bei < 30 fps. **FPS-Anzeige** unten links im 3D-Modus („58 fps · 2×“) – für die Rückmeldung
  vom iPhone. Sandbox (Software-Rendering, 2 fps) fällt erwartungsgemäß auf 1×.
- Stand 0.48 (Nutzeridee: Fingerspitzengefühl beim Abschuss): **Feder dosieren.** Tipp auf die Kugel < 0,22 s = voller Schuss wie
  bisher (1880–1960); **Halten** spannt in 1,6 s (Echtzeit), Loslassen schießt: `federV(c)` c 0–0,2 → 960–1310 (schwach), 0,2–0,4 →
  1326–1350 (**Gassen-Zone**), ab 0,4 → 1385…1960 (voll ab 0,85), ±6 Streuung. **Gemessen** (Abschussgeschwindigkeit → Ergebnis):
  ≤1025 fällt die Kugel in die Rinne zurück (neu: liegt danach wieder an der Feder, `ruht`), 1050–1225 verlässt sie die Rinne durch
  das Einweg-Tor und fällt unten ins Feld, 1250–1300 kommt nicht um die Kurve (fällt seitlich), **1315–1358 fällt sie durch die
  oberen Gassen** (Fenster nur ±22 breit – deshalb Zone im Balken auf 20 % gestreckt), ≥1385 fliegt sie mit Mittelpunkt y≈19 über die
  Gassen und läuft den linken Umlauf hinunter. Anzeige: Balken mit drei Bereichen und Text „ZU SCHWACH / GASSEN / VOLLE KRAFT“,
  Ring um die Kugel wird rot / grün / weiß und wächst. Leertaste: Halten/Loslassen. Schädel-Loch von unten: 20/20 Testschüsse fangen
  (x 70–130, v 500–1200) – dort kein Befund. **3D-Kanone Entwurf 2** (`drei.js`): Drehkranz mit blauem Leuchtring, keilförmiges Gehäuse
  (Extrude), Glaskuppel, blaue Energiezellen, Lauf mit Kühlringen, Mündung glüht rot wenn geladen. Sim: 30/30 OK (neu: federV, Gassen-Zone,
  Rückkehr, Tipp/Halten), 10 min Autoplay mit gemischten Schussstärken ohne Fehler.
- Stand 0.49 (Nutzer: „Der rechte Flipper bleibt manchmal oben stecken“): **Ursache reproduziert** – geht ein `pointerup` verloren
  (iOS: Systemgesten, Randwischer), blieb die Finger-ID für immer in `finger`; jeder spätere Tipp hob den Flipper nicht mehr auf, weil
  `halte()` die alte ID noch zählte (Test mit synthetischen Ereignissen: alte Fassung hängt dauerhaft). Jetzt `abgleich` bei
  touchstart/touchend/touchcancel: Fingerliste gegen `e.touches` abgleichen (Seite ohne Berührung → loslassen), bei 0 Berührungen
  auch die Feder lösen; `blur`/`visibilitychange` lösen alles. **3D:** automatische Auflösung senkte auf 1× obwohl 60 fps (iPhone-
  Screenshot): Warmlauf 6 s, Senken erst nach zwei schlechten Messungen in Folge, **Hochschalten** bei ≥ 57 fps in drei Fenstern
  (Probe; hält sie nicht, wird die Stufe gesperrt).
- Stand 0.50 (3D, Wunsch aus der Bilder-Sitzung, siehe `bilder/ABSPRACHE.md`): **Schleudern als 3D-Körper** (`schleudern3d`: Kunststoff-
  dreieck 0,86 verkleinert + Wölbung, 3 Chrompfosten, schwarzer Gummiwulst an der Schlagseite, Aufleuchten über `s.flash`), Flipper
  mit gewölbter Oberseite (Gummi 13, Körper Spitze ~14; Kugel ist 18 hoch), Kamera 60° statt 68°. In `draw()` fällt das Schleuderbild im
  3D-Modus weg. **Zwei Sitzungen:** Bilder-Sitzung (Abacus) liefert nur Dateien nach `bilder/eingang/` (eigener Branch `bilder-eingang`);
  Branch `claude/simple-flipper-prototype-6grm3d` ist veraltet (Basis 0.21) und wird nicht gemergt. Bilder `schleuder_v1`, `rampe_v1`,
  `flipper_v1` liegen in `bilder/eingang/` (768×1376 / 1376×768, schwarzer Hintergrund), noch nicht eingebaut.
- Stand 0.51 (Einbau durch eine dritte Sitzung, vom Nutzer erlaubt): `tools/bilder_einbau.py` (Pillow + NumPy) macht aus
  `flipper_v1` → **`flipper.png`** (809×184, 10 px/Einheit, Rand 0,2, Drehpunkt bei x 9,2; Spalte für Spalte so verzerrt, dass der
  Gummirand genau auf der Kollisionshülle r 9 / r 5,5 liegt – im Rohbild lag das Gummi ~2 Einheiten außerhalb) und aus `rampe_v1` →
  **`rampe.png`** (288×476, nahtlose Kachel über 2 Pfeil-Abstände, 16 px/Einheit, 18 Einheiten breit, Kunststoff ≈ 35 % deckend).
  2D: Flipper als Bild (rechter gespiegelt, Schlagschatten wie vorher), Rampen als Scheiben entlang der Bézier-Bahn in eine
  vorgerechnete Ebene (`rampenEbene()`, neu nur bei geänderter Auflösung), Pfeile in Fahrtrichtung, Aufblitzen darüber.
  Ohne Bild Rückfall auf die gezeichnete Form. 3D: `rampenBand()` ersetzt die zwei unteren Laufdrähte durch ein Band mit
  `rampe.png` (v = Bogenlänge / 29,75), Seitendrähte bleiben. `schleuder_v1` nicht eingebaut (3D hat Körper, 2D hat schon ein Bild).
- Stand 0.52 (Nutzer nutzt die App als `…/flipper/?3d`; Wunsch „alles plastisch, Rampen ohne Pfeile“): **`rampe.png` ohne Pfeile**
  (Median je Spalte über die pfeilfreien Zeilen, 288×64, entlang der Bahn gleichförmig, Kunststoff ≈ 30 %; 2D-Scheiben jetzt 4 Einheiten
  lang, 3D-Band emissiv 0,15). **3D-Ziele als Körper** (`ziele3d` in `drei.js`, in `draw()` bei `DREI` nicht mehr flach gemalt):
  rote Dreierbank als stehende Scheiben mit Niete und Halterung (leuchten bei `an`/`blitz`), orange Stehziele als Platten (leuchten bei
  `an`), fünf weiße Rundziele als Scheiben auf Halter (beleuchtetes Ziel glüht gelb), Klappziel vor dem Schädel als Chromplatte mit
  Lampe (grün bei LOAD GUN, versinkt weich bei `sdrop.unten`), Chromring um die Mulde. `__ZT` liefert dafür `rund`, `sdrop`, `MULDE`, `gunLit`.
- Stand 0.53 (iPhone-Screenshot: 3D läuft mit 58 fps bei 1,5×): **Linker Rampenbogen weiter außen** – 2. Kontrollpunkt der Rampe
  „rechts“ (`ramps[1]`, endet links) von (10/190) auf (−40/200); Ein- und Ausgang unverändert (Ausgang 55/585). Der absteigende Ast
  liegt bei y 386–446 jetzt bei x 36–39 statt 52–58 und verdeckt die weißen Rundziele (x 61) nicht mehr. Rampen sind weiter Tunnel
  (nur Animation), Physik unverändert.
- Stand 0.54 (Nutzerwunsch „alles wie in der 3D-Version, leicht von vorn“): **3D ist Standard** – `DREI` gilt jetzt immer, außer mit
  `?2d`, ohne WebGL oder in den Node-Tests (`window.__TEST__`). Lädt `drei.js` nicht (onerror) oder fehlt nach 15 s `window.__ZT3D`,
  wechselt die Seite auf `?2d`. **Kamera 50° statt 60°** (mehr von vorn). Da die Breite begrenzt, rückt `einpassen()` die Anzeige
  (`#kopf`, position relative, z-index 3) per `translateY` direkt über die Rückwand; Szenen-Hintergrund = Seiten-Hintergrund.
- Stand 0.55 (Nutzerwunsch): **Pop-Bumper weiter auseinander** (178/142, 264/156, 220/214 statt 190/150, 252/162, 218/212; Lücken
  zwischen den Kappen 51/47/37 statt 27/32/25, bei Kugel-Ø 18). Gemessen (Autoplay, nur voller Abschuss, 6 × 10 min neu gegen
  3 × 10 min alt): Bumper-Treffer Ø 5,7/min statt 3,5/min, Serien ≥ 4 Treffer (Abstand < 0,7 s) 0,52/min statt 0,17/min, längste
  Serie bis 16. Noch weiter auseinander (172/140, 268/154, 220/212) war schlechter (4,5/min, Serien ≥ 4 0,27/min). Sim 30/30,
  10 min ohne Fehler. **3D-Schleudern mit weißem Gummiring** rund um alle drei Pfosten (Stränge + Ringe um die Pfosten, `gummiWeiss`)
  statt schwarzem Wulst nur an der Schlagseite (Nutzer: wie das Schleuder-Bild).
- Stand 0.56 (Nutzerwunsch „Schleudern dicker“, nur Optik in `drei.js`): Kunststoffkörper 9 statt 5 hoch (Wölbung 3,5 statt 3, gesamt
  ≈ 16), Chrompfosten 20 statt 15, weißer Gummiring 2,8 statt 1,9 dick auf Höhe 9 statt 7. Physik unverändert.
- Stand 0.57 (Nutzer: 0.56 „etwas zu dick“): Mitte gewählt – Körper 7 hoch (Wölbung 3,2), Pfosten 18, Gummiring 2,3 dick auf Höhe 8.
- Stand 0.58: Nutzer hat aus 5 gerenderten Dicken **Nr. 1 gewählt, „maximal“** – zurück auf die Maße von 0.55 (Körper 5, Wölbung 3, Pfosten 15, Gummi 1,9 auf Höhe 7). **Nicht dicker machen.**
- Stand 0.59 (Nutzer: „noch etwas dünner“; unterstes gelbes Kanonenziel-Trapez nicht ganz zu sehen): Schleudern Körper 3,5 (Wölbung 2,5),
  Pfosten 13, Gummi 1,5 auf Höhe 6. **Leiter links enger** (Abstand 18,5 statt 20, Höhe 14 statt 15; „10 MILLION“ jetzt bei y 463,5, Oberkante
  456,5), roter Rahmen ab y 453 statt 443 – vorher schnitt er das 5. Trapez (y 443–449) und die untere Zielklammer. Klammer unten y 449.
- Stand 0.60 (Nutzer: Kugel soll oben viel öfter zwischen den 3 Pop-Bumpern hin und her laufen): **Messung zuerst** – Gitter aus Abstand
  (Skalierung 0,8–1,2 um den Schwerpunkt) × Bumper-Schlag (280/380/480/600), je 60 min Autoplay: alles 4–6 Treffer/min, Unterschiede im
  Rauschen → Abstand/Schlag sind **nicht** der Hebel, sondern wie oft die Kugel überhaupt nach oben kommt. Umgesetzt: **Mulde oben rechts
  wirft nach oben aus** (vx −20 ±3, vy −680 ±5 statt nach unten 260) → Kugel läuft den rechten Umlauf hinauf, fällt durch die oberen Gassen
  in die Bumper. Einzelmessung (40 Würfe je Wert): 675–685 am besten, ~70 % mit ≥ 3 Bumper-Treffern, Ø 4 Treffer in 5 s; 695–705 schlecht
  (fliegt über die Gassen). Autoplay je 6 × 60 min: Bumper Ø 6,1/min statt 5,1/min (+20 %), begrenzt durch Mulde nur ~0,4/min.
  `tools/sim.js`: Mulden-Test prüft jetzt „verlässt die Mulde“ statt „fällt nach unten“. Hinweis: Test „Gassen-Zone“ ist unabhängig davon
  wacklig (je Schuss ~85 % → Test besteht nur ~84 %), gemessen vor 0.55 und danach gleich.
- Stand 0.61: Tipp auf die Versionsnummer (manuelle Update-Prüfung) lädt bei neuer Version nach **0,5 s** statt 1,5 s neu (Nutzerwunsch); automatisch im Ruhezustand weiter 3 s.
- Stand 0.62 (Recherche zum Original: Fluchtweg-Mulde liegt **oben rechts über den Bumpern**, wird über **starke Schüsse in den linken Orbit**
  erreicht und füttert die Bumper – laut Fachquellen der einzige verlässliche Weg in die Bumper; schwache rechte Orbit-Schüsse fallen auch
  hinein): **Mulde von 350/250 nach 318/64** (Scheitel des Bogens; linker Orbit ≥ 1300 läuft dort auf ≤ 2 Einheiten vorbei). Fängt jede Kugel,
  die im Uhrzeigersinn kommt (`vx > 100`, Abstand < 12; `fluchtBis` ist dafür nicht mehr nötig), Sperre nach Auswurf 0,4 s statt 1 s (sonst
  verpasst ein schneller zweiter Orbit-Schuss sie). **Auswurf Richtung 250/110 mit 300** (`MULDE_AUS`, ±3 % / ±0,04 rad) direkt in die Bumper –
  gemessen je 40 Würfe: Plateau 260–340 mit Ø ~4 Bumper-Treffern in 5 s, ~70 % ≥ 3; der Behelf aus 0.60 (nach oben auswerfen) ist entfallen.
  Grüner Fluchtweg-Pfeil jetzt im linken Orbit (35/448). Autoplay je 6 × 60 min gegen 0.61: Bumper 8,2 statt 6,3/min, Serien ≥ 4 0,65 statt
  0,44/min, Mulde 0,96 statt 0,39/min. **Durchlass rechter Orbit → Bumper geprüft und verworfen:** Innenführung ab 1,75π/1,82π/1,88π/1,93π,
  je 160 Schüsse 700–1400: alle 1,1–1,2 Bumper-Treffer/Schuss – schwache Schüsse fallen schon heute durch die Lücke zwischen Gassen und Führung.
- Stand 0.63 (Nutzerwahl aus gerenderten Varianten 14/18/22 und 25): **Schleudern 18 hoch** (Körper depth 13 + Wölbung 2 × 2,5), Pfosten 20,
  **weißer Gummiring 2,0 dick auf Höhe 9 = Kugelmitte** (Gummi in der Mitte der Schleuder statt am Boden). Ersetzt den Hinweis „nicht dicker“
  aus 0.58 – gemeint war dort die Gummidicke, nicht die Höhe.
- Stand 0.64 (Nutzer: Kugel läuft sichtbar durch das Schleuder-Gummi): Ursache – Kollision an der Linie durch die Pfostenmitten, das
  3D-Gummi liegt aber 5,6 weiter außen (Pfosten r 3,6 + Gummi 2,0). Jetzt `SCHLEUDER_DICK = 5.6` als `dick` an allen drei Schleuder-Wänden,
  Kollision mit `R + w.dick` (abgerundete Ecken = Gummi um die Pfosten). Bei Änderung von RP/RG in `drei.js` mitziehen! Geprüft: Sim grün,
  2 × 10 min ohne Hänger; Rückkehrgassen links/rechts je 20/20 zum Flipper (0,7 s statt 0,5 s, streift am Gummi). **Gummi wölbt sich beim
  Schlag** (wie am Original): Schlagseite in `drei.js` aus zwei Hälften, Mitte um 3,5 × `flash` nach außen (`bogen`).
- Stand 0.65 (Nutzer): **Sirene entfernt** – `sfx.sirene()` ist jetzt eine kurze, leise Fanfare (4 aufsteigende Dreieckstöne A–C#–E–A,
  ~0,5 s), nur noch 1,2 s nach Multiball-Start, **nicht mehr nach jedem Jackpot**. **Abschuss:** kurzer Tipp schießt jetzt **schwach**
  (so stark, wie die Feder gespannt ist; Tipp 0,08 s ≈ 1050, ganz kurz ≤ 1025 rollt zurück), Halten spannt wie bisher (voll nach ~1,4 s).
  `TIPP_T` nur noch für die Anzeige. **Kraftbalken in der Abschussrinne** (y 572–734, statt „ABZUG“, solange gehalten): füllt sich von
  unten, rot < 0,2 schwach, grün 0,2–0,4 Gassen, weiß ab 0,4. Texte: „Kugel halten = Abschuss“, Anzeige „KUGEL HALTEN“ / „LANG = STARK“.
  Sim-Test „Tipp schießt voll“ → „kurzer Tipp schießt schwach“. Autoplay (`api.abzug()`) schießt weiter voll.
- Stand 0.66 (Nutzer: Balken länger nach oben, Finger verdeckt unten; mehr Chance auf die Gassen): Kraftbalken y 320–700 statt 572–734.
  **Zonen `FZ = [0.15, 0.45, 0.6]`:** rot < 0,15 schwach (960–1310), **grün 0,15–0,45 Gassen** (1326–1350, vorher 0,2–0,4), **gelb 0,45–0,6
  „GASSE ODER BOGEN“**: mit Wahrscheinlichkeit `gassenChance` (60 % → 0 % linear) wird mit Gassen-Stärke geschossen, sonst 1390–1450 über den
  Bogen; weiß ab 0,6 (voll ab 0,9). `federV` bleibt monoton (Zufall nur in `federLoslassen`). Gemessen je 30 Schüsse, Anteil durch die Gassen:
  c 0,2 93 %, 0,3/0,4 63 %, 0,47 50 %, 0,52 33 %, 0,57 13 %, ab 0,65 0 %. Original (Recherche): T2 hat einen Auto-Plunger mit festem Schuss
  über den Bogen auf die weißen Ziele links (Skill Shot = Timing) – die dosierbare Feder mit Gassen ist unsere eigene Regel.
- Stand 0.67 (Nutzer): **Pause:** Tipp auf die Anzeige oben (`#kopf`) zeigt den Pause-Schirm (vorher nur beim Zurückholen aus dem
  Hintergrund); Hinweis in der Kurzanleitung. **Rampenpfosten** r 3,5 statt 5 (Physik + Optik), in 3D silberner Ring statt schwarzem Gummi.
  **Flipper-Effet** (`EFFET = 0.8`): beim Hochschlagen wird die Abflugrichtung einmal je Schlag (`frei('effet…', 0.1)`) um
  −side · EFFET · (u − 0,5) gedreht, u = Lage auf dem Flipper. Messung ruhende Kugel: Spreizung vorher ~28° (rechts 93–121°), jetzt ~50°.
  Raster mit fallenden Kugeln (u 0,1–0,95 × vy 250/450/650 × Flip-Verzögerung 0–0,16 s): **Seitenziele waren auch vorher direkt
  erreichbar** (rechter Flipper → Rundziele 13 %, linker → orange Stehziele 15 %). Rechter Flipper erste Hälfte → linke Rampe 15 % → 10 %,
  zweite Hälfte → Rundziele 13 % → 20 % (je 135 Schüsse, grob). Autoplay 3 × 30 min: Spielenden unverändert (Rauschen), Mulde Ø 50 statt 28.
- Stand 0.68 (Nutzer: Tisch zu weit unten, oben Platz; Anzeige perspektivisch/plastisch): In 3D ist die Anzeige ein **Rückkasten** hinten
  auf dem Tisch (`drei.js`: Kasten W+44 × 150 × 26, 12° nach hinten geneigt, Chromrand, Bildschirm 4:1 mit dem `#dmd`-Canvas als
  `CanvasTexture`, neu geladen nur wenn `window.__dmdStand` sich ändert; oranges Glimmlicht). Die HTML-Anzeige bleibt als unsichtbare
  Zeichenfläche (`body.drei #kopf` absolut, opacity 0). Kamera-Einpassung schließt die Oberkante des Rückkastens ein und setzt alles
  **senkrecht mittig** (vorher unten bündig). Canvas lässt Status- und Home-Leiste frei (Padding der Bühne). **Pause** in 3D: Tipp auf
  alles hinter der Rückwand (`tischPunkt().y < −30`). Tisch bleibt durch die **Breite** begrenzt – mehr Höhe nur mit steilerem Winkel
  (gerendert 50/55/60° zur Auswahl, Stand 50°).
- Stand 0.69 (Nutzer: Kopfteil wie am echten Automaten, viel größer, mit Bild, nach hinten dicker): **Kopfteil** in `drei.js` 444 × 470,
  70 tief, 8° geneigt, steht 40 hoch auf der Rückwand (`RK.sockel`). Oben **Hinterglas-Bild** `kopf.jpg` (fehlt es: gezeichneter Platzhalter
  mit Suchscheinwerfern, Uhr auf zwölf und „ZERO TIME“), darunter Leiste (120) mit der Punktmatrix (250 × 62,5) zwischen **zwei runden
  Lautsprechern** (roter Kegel, Chromring). Kamera passt Tisch + Kopfteil ein → Tisch etwas kleiner (jetzt höhenbegrenzt), Bildschirm
  gefüllt. Bild-Auftrag mit Prompt: `bilder/AUFTRAG_KOPF.md`. Abacus aus diesem Container gesperrt (Proxy 403 auf routellm.abacus.ai).
  Wenn `kopf.jpg` kommt: in `sw.js`-Cache-Liste aufnehmen (nicht vorher – `addAll` schlägt bei fehlender Datei fehl).
- Stand 0.70 (Nutzer: Anzeige maximal, Lautsprecher weg, Kopfteil nicht so hoch, Spielfeld maximal): Kopfteil = feste Leiste (122) mit der
  **Punktmatrix in voller Breite** (W+16 × /4) + Bildteil mit **variabler Höhe `RK.hb`**, gewählt in `einpassen()`: größte Höhe (≤ 340, in
  10er-Schritten), bei der der Tisch höchstens **2,5 %** kleiner wird als nur mit Anzeige-Leiste (gemessen 430×932: jede Bildhöhe kostet
  Tischgröße, volle 270 ≈ 5 %; Ergebnis ≈ 120). Bild wird mittig zugeschnitten (`bildZuschnitt`, Seitenverhältnis bleibt). Einpassen jetzt
  10 Runden (4 konvergierten nicht). `body.drei #dmd` bis 520 px breit → schärfere Textur. Lautsprecher entfernt.
- Stand 0.71 (Nutzer: unten zu viel Luft, Kopfteil oben geschlossen mit Platz fürs Bild): Einpassung **unten bündig** (`UNTEN_RAND`
  0,03 statt senkrecht mittig), Bildteil darf den Tisch bis **3,5 %** verkleinern (`TISCH_VERLUST`, vorher 2,5 %), `hbMax` 400. Gemessen
  430×932: Tisch-Unterkante 912, Kopfteil reicht bis an den oberen Rand; 393×852 → 834, 375×667 → 652.
- Stand 0.72 (iPhone-Screenshot 0.71: unten ~100 px leer, obwohl unten bündig eingepasst): Ursache [Wahrscheinlich] iOS-Fehler der
  Home-Bildschirm-App mit `black-translucent` – Seite/`height: 100%` ist um etwa die Statusleiste zu kurz (auch die feste FPS-Anzeige saß zu
  hoch). Jetzt setzt ein kleines Skript im Standalone-Modus (`navigator.standalone`) `html`/`body` auf die **Bildschirmhöhe** (`screen`,
  bei Drehung neu). Simuliert (Fenster 863, Schirm 932): Tisch-Unterkante 921 statt 853. `UNTEN_RAND` 0,01 statt 0,03. Im Safari-Tab unverändert.
- Stand 0.73: **Hinterglas-Bild `kopf.jpg`** vom Nutzer (Gemini, 1536×1024, 3:2; Stahlplatten-Schädel wie `schaedel.png` mit Zähnen, Uhr kurz vor
  zwölf, Strudel, Stadt, Schriftzug „ZERO TIME“ im unteren Drittel). Prompt-Hinweise: Schädel als Emblem ohne Kabel/Schläuche/Rumpf – Hals hat
  noch Panzerplatten, vom Nutzer so gewählt. Zuschnitt jetzt **unten betont** (`offset = (1 − r) · 0,35`), damit der Schriftzug ganz bleibt; bei
  932 px Höhe passt das Bild fast ganz (Fläche 420 × 286), bei 863 px wird oben ein Teil der Uhr abgeschnitten. In der `sw.js`-Cache-Liste.
- Stand 0.74: `kopf.jpg` ersetzt durch Nutzer-Fassung **1769×889 (≈ 2:1)**, damit bei kurzer Bildfläche (863 px, 1,94 : 1) die volle Höhe
  sichtbar ist. `bildZuschnitt` jetzt wie „cover“: Bild breiter als Fläche → seitlich mittig abschneiden, aber höchstens auf `KOPF_MIN_BREITE`
  0,82 (Schriftzug reicht von ~11 % bis ~89 % der Bildbreite), Rest durch leichte senkrechte Streckung (bei 932 px ≈ 10 %); Bild höher →
  wie 0.73 oben/unten (unten betont). Neues Bild mit anderem Schriftzug-Bereich → Konstante prüfen.
- Stand 0.75: `kopf.jpg` = Nutzer-Fassung mit **schmalerem Schriftzug** (1770×889, Schrift ~26–74 % der Breite). `KOPF_MIN_BREITE` 0,6 →
  bei 932 px Höhe nur seitlicher Zuschnitt (sichtbar ~74 % der Breite), **keine Streckung**; bei 863 px ganzes Bild.
- Stand 0.76: `kopf.jpg` = ruhigere Nutzer-Fassung (1768×889; Uhr mit römischen Ziffern kurz vor zwölf, friedliche Stadt am Wasser statt
  Explosion, wenige Kristalle statt Felsbrocken, Schrift ~21–81 % der Breite). Zuschnitt unverändert (`KOPF_MIN_BREITE` 0,6, keine Streckung).
- Stand 0.77 (Nutzer: „ZERO TIME“ nicht doppelt): Punktmatrix vor dem Abschuss zeigt **keinen Namen mehr** – vor Kugel 1 den **Rekord**
  (`flipper.rekord` in localStorage, gesetzt bei Game over) im Wechsel „REKORD“ / „KUGEL HALTEN“, sonst den Punktestand (bzw. „KUGEL n“).
  iPhone-Screenshot 0.76 bestätigt: Fix aus 0.72 wirkt (Tisch bis über die Home-Leiste, Bildfläche ≈ 1,47 : 1).
- Stand 0.78 – **Uhr im Hinterglas** (Nutzeridee: Bild ohne Zeiger + Zeiger separat). `kopf.jpg` = Bild ohne Zeiger (1768×890), Zeiger per
  `tools/zeiger_einbau.py` aus `bilder/eingang/zeiger_v1.png` freigestellt → `zeiger_h/m/n.png` (Quadrat, Drehpunkt mittig, je Teil maskiert).
  In `drei.js` als Flächen über dem Bild (`uhr`-Gruppe an der Bildfläche, `uhrLage()` rechnet Bildpixel → Fläche über den Zuschnitt), Ringmitte
  886/316 (Ziffernkranz; die Nabe im alten Bild saß mit 881/294 schief), Minutenzeiger 190, Stunde 125 Bildpixel. **Bedeutung:** Ruhezustand
  (Start/Game over/vor dem Abschuss) = echte Uhrzeit; im Spiel **Fortschritt** = 11:30 + 5 min je kassiertem Fluchtweg-Feld, das 6. Feld
  (10 MILLION) = 12:00 → Meldung **„ZERO TIME“** + Jackpot-Lichtshow (`jpShow`); bei Kanone (7 s), Hurry Up (20 s), Payback (25 s) läuft der
  Minutenzeiger als Stoppuhr eine Runde auf zwölf zu; bei jedem Jackpot wirbeln die Zeiger 1,2 s. **Schädel-Augen** im Bild glühen
  (additive Flächen, pulsierend, stärker im Multiball/Jackpot). `__ZT` liefert dafür `uhr` und `multiball`. Zeiger in der `sw.js`-Cache-Liste.
- Stand 0.79 (Nutzer zur Uhr): Zeiger stehen **normal auf fünf vor zwölf** (keine echte Uhrzeit, kein Fortschritt, keine Kugelanzeige,
  kein Wirbeln beim Jackpot). **Zeitmodi** (Kanone 7 s, Hurry Up 20 s, Payback 25 s): Minutenzeiger als Sekundenzeiger, startet so viele
  Sekunden vor zwölf, wie der Modus dauert, und **tickt sekundenweise** auf zwölf. **Multiball:** beide Zeiger drehen **gegenläufig**
  (Minute ½ Umdrehung/s rechts herum, Stunde 0,3 links herum). **Augen** glimmen und **flackern** zufällig (häufiger im Multiball/Jackpot).
  „ZERO TIME“-Meldung beim 6. Fluchtweg-Feld aus 0.78 bleibt (Spielregel in index.html).
- Stand 0.80: **Strudel dreht sich** – `strudel.png` (256², aus `kopf_ohne_zeiger_v1` um das Auge 885/389, Radius 112 Bildpixel, Rand ab
  55 % weich ausgeblendet; erzeugt in `tools/zeiger_einbau.py`) liegt unter den Zeigern und dreht links herum (0,25 rad/s, im Multiball 1,4).
  Kante im Test nicht sichtbar. **Fehler behoben (Nutzer):** Im Multiball sprangen die Zeiger beim Laden der Kanone auf den Countdown/fünf vor
  zwölf – Multiball hat jetzt Vorrang vor den Zeitmodi, die Zeiger drehen durchgehend, solange der Multiball läuft.
- Stand 0.81 (Nutzer: Drehung des Strudels nicht zu sehen): Scheibe bis 78 % des Radius deckend (vorher ab 55 % ausgeblendet – das feste
  Bild darunter überwog), Radius 100 statt 112 (unterer blauer Innenring bei y ~495 bleibt fest), Tempo 0,6 rad/s (≈ 10 s je Umdrehung),
  im Multiball 2,6 (≈ 2,4 s). Im Test nach Drehung keine Kante sichtbar.
- Stand 0.82 (Nutzer: nur die Mitte dreht, eiert, falsche Richtung): **ganzer Strudel** dreht sich – Scheibe r 168 um die Uhrmitte 886/316
  (blaue Ringlinie bei r ≈ 173–182). Das Auge des Strudels liegt im Bild bei 885/389, also nicht mittig; `tools/zeiger_einbau.py` verzerrt die
  Scheibe deshalb radial (je Richtung Strecke Auge → Kreisrand auf Mitte → Rand), sodass das Auge in der Mitte liegt und der Rand exakt zum Bild
  passt. Drehung jetzt **im Uhrzeigersinn** (Nutzer, physikalische Logik), Tempo wie 0.81.
- Stand 0.83 (Nutzer: unten bei 6 Uhr stand ein Rest des Strudels still; Augen sollen stärker aufleuchten): Innenring genauer vermessen
  (Kante oben y 143, unten 494 → Mitte 886/319, r 175) → Strudel-Scheibe r 174 um 886/319, Rand nur noch 5 % weich. **Augen:** Grundglühen
  0,55, gelegentlich **Aufblitzen** (×1,8–2,6) oder kurzes Abdunkeln; im Multiball 1,4 ± 0,5 schnell pulsierend, beim Jackpot 2,2. Werte > 1
  schalten einen zweiten, 2,2× größeren additiven **Hof** zu.
- Stand 0.84 (Nutzer: stehender blauer Rest bei 6 → 5 Uhr): Der Strudel lief im Bild über den hellblauen Innenring (r 175–190) und
  darunter bis an die Ziffern. Jetzt: Scheibe r 191 **inkl. Innenring** (dreht als Lünette mit), und in `kopf.jpg` werden bläuliche/violette
  Pixel im Ring r 189–220 um 886/319 auf Nachtblau (10/16/40) gezogen (95 %, orange Ziffern bleiben) – in `tools/zeiger_einbau.py`.
- Stand 0.85 (Nutzer: Kugel rollt nicht, macht Mikrosprünge): **Gemessen** (Hook in `collideSeg`, 5 min Autoplay): 240 kleine Abpraller/min
  (Aufprall 8–200), Median 62, 90 % 162 → Sprung bis ~3 Einheiten; **13,6 Hüpf-Serien/min** (≥ 3 Abpraller an derselben Führung in < 0,4 s).
  Jetzt **geschwindigkeitsabhängiger Rückprall** `weich(rest, vn)`: unter 40 kein Rückprall (rollt an der Führung), linear bis voll ab 300
  (`WEICH_AB`/`WEICH_VOLL`, gilt für Wände, Pfosten, Flipper). Danach: Serien ~1/min, Sprünge > 1 Einheit 158 → ~93/min; Sim 30/30, 3 min ohne
  Fehler. Offen: Ruckeln durch die Darstellung (variable Bildzeit) – dafür Bildschirmvideo vom iPhone auswerten.
- Stand 0.86 (Nutzer-Bildschirmvideo 0.85, 60 Hz, 11 s, ausgewertet per OpenCV-Vorlagenabgleich der Kugel in der Abschussrinne):
  Kugelweg je Videobild beim Einrollen **3, 9, 0, 14, 0, 5, 0, 13, 0, 17 …** Pixel – nur etwa jedes 1,5. Bild neu, Anzeige 41–47 fps bei 2×.
  Die Physik rechnet zeitrichtig (Schritt ∝ verstrichene Zeit), das Ruckeln kommt von **verpassten Bildern**. Verdacht: jedes 2. Bild
  zeichnet die 2D-Bodentextur neu und lädt sie hoch (Spitze). Jetzt: Bodentextur `BODEN_PX` 1,5 statt 2 (600 × 1140, −44 %), automatische
  Auflösung senkt schon **unter 55 fps** (vorher 40; bei 41–47 fps blieb sie auf 2×), Probe nach oben gilt erst ab 57 fps als gehalten.
  Prüfen: neues Video – Ziel ist Bewegung in jedem Bild (keine 0-Schritte).
- Stand 0.87 (Video 0.86, 55 fps bei 2×): beim Einrollen Kugelweg je Videobild **0, 12, 0, 3, 10, 3, 9, 12, 0, 3, 13 …** – weniger
  Aussetzer, aber ungleiche Schritte in Folge (3 ↔ 10): die Zeitstempel der Bilder schwanken stärker als die Anzeige. Jetzt **geglättete
  Spielzeit** in `frame()`: gleitender Mittelwert der Bildzeit (`dtGlatt`, Faktor 0,2) plus Ausgleich 0,15 × (Soll − Ist), damit keine Zeit
  verloren geht; Feder rechnet weiter mit Echtzeit. Auflösung senkt jetzt schon **unter 57 fps** (bei 55 blieb sie auf 2×).
- Stand 0.88 (Video 0.87: bei 1,5× / 57 fps läuft die Kugel fast in jedem Bild gleichmäßig – 6, 6, 7, 8, 7, 8 … Pixel; bei 2× vorher
  starr 0, 12, 0, 12 = 30 Bilder/s). Nutzer: Rechenlast senken. Gemessen (Chromium, CPU-Anteile je Bild): Physik 0,07 ms, Boden zeichnen
  0,6 ms, Anzeige 0,3 ms – CPU ist nicht der Engpass, sondern die Grafik (Füllrate/Uploads). Geändert: Bodentextur **ohne Mipmaps**
  (wurden bei jedem Hochladen alle 2 Bilder neu gerechnet), Anisotropie **4 statt 16**, **Glimm-Punktlicht der Anzeige entfernt** (jede
  Punktlichtquelle kostet in jedem Bildpunkt), Punktmatrix-Zeichenfläche höchstens **768 px** breit (vorher bis 1560 px, 1,6 MB je Änderung).
  Optik im Vergleichsbild unverändert.
- Physik-Test: `node tools/sim.js [minuten]` (Node-Simulation mit `window.__TEST__`): Abschuss-Pfad, jedes der 5
  Rundziele per Kanone treffbar (Winkel-Scan), Multiball per Treffer, dann Autoplay (Standard 10 min): Kugel
  verlässt nie den Tisch, bleibt nie hängen. Seit 0.18 auch Schädel-Klappziel → LOAD GUN → Laden, Targetlicht
  fest/wandernd, Sperre. Ergebnis 0.18: 14/14 OK, 3 × 10 min ohne Fehler. Ab 0.19 auch Escape Route (Umlauf → Mulde,
  Weiterschalten, Neustart der Leiter); Ergebnis 0.23: 21/21 OK (inkl. Jackpot-Verdopplung und Lichtverlauf), 3 × 10 min ohne Fehler. Ergebnis 0.19: 19/19 OK, 3 × 10 min ohne Fehler, Mulde im Autoplay 5–13× je 10 min. Ergebnis 0.17: Ziel 1–5 bei Lage 0,31/0,40/0,51/0,62/0,72
  (= `RUND_LAGE` für das Fadenkreuz), 3 × 10 min ohne Fehler.

## Offene Punkte aus den Video-Standbildern (für die nächste Sitzung)

- ~~Kanone auf der falschen Seite~~ – erledigt in 0.17 (siehe Stand 0.17).

- **Echte Rampen (Stufe 3):** große Klarsichtrampe oben rechts über den Bumpern; Drahtrampen laufen seitlich
  herunter in die Rückkehrgassen (rechte Rampe → linke Rückkehrgasse, linke → rechte). Derzeit Tunnel.
- **Einsätze ohne Regel bisher:** „MILLION WHEN FLASHING“ (links neben der Schädel-Gasse und rechts vor der
  rechten Rampe), „BILLIONS PLUS“ (rechts), LOCK + DATABASE (links), VIDEO MODE (links, Minispiel in der Anzeige).
- **Regelkarte (deutsch, nur teilweise lesbar):** „… Rampen schießen, um Security Level zu erreichen“ (passt),
  „… wechselndes Targetlicht treffen“, „… Drop Target wird Pistole geladen“, „… beleuchtetes Target zu
  schießen“, „… Schüsse zählt 5 Mio“. Folgerung [Vermutung]: Die Kanone wird über ein Klappziel geladen (bei
  uns weiterhin über den Schädel). Das wechselnde beleuchtete Ziel ist seit 0.17 umgesetzt.
- **Kickback:** Die 3 orangen Stehziele rechts mit 3 runden Lampen und „LITE KICKBACK“ bestätigen unsere Regel.
  Der Kickback selbst sitzt im Original aber in der **linken** Ausgasse (orange KICKBACK-Lampe links unten);
  bei uns rechts, weil links die Umlauf-Zuführung die Ausgasse abdeckt. Beim Rampen-Umbau prüfen.
- **Ton:** Rückmeldung des Nutzers zu 0.9–0.16 steht aus (iOS-Freischaltung über Start-/Pause-Schirm).

## Aus dem Video-Dossier des Nutzers (15 Folien, KI-Zusammenfassung des Videos, nicht im Repo – Seite ist öffentlich)

Die Texte stammen aus dem Video [Wahrscheinlich richtig]. Die Zeichnungen darin sind KI-generiert und taugen **nicht** als
Layout-Vorlage. Abweichungen zu unserem Stand 0.17:
- **Kanone laden:** Man muss das zentrale Klappziel unter dem Kopf versenken → grünes „LOAD CANNON“ leuchtet → die Kugel
  wird in die Kanone rechts geladen. Bei uns reichen 2 Schädel-Treffer. Umbauen: mittleres Klappziel versenken →
  LOAD GUN, dann lädt der nächste Schädel-Treffer.
- **Kanonen-Schwierigkeit in 3 Phasen:** 1. feststehendes Ziel, 2. wanderndes Ziel, 3. im Multiball schnell und mehrere
  Ziele. Bei uns wandert das Ziel immer. Umbauen: erster Kanonenschuss je Spiel mit festem Ziel.
- **Geklärt per Recherche (Regelblatt von Dean St. Antoine, Zusammenfassungen via Websuche; Direktabruf gesperrt):**
  - **Kickback:** sitzt in der **linken** Ausgasse. Ihn beleuchten die **3 orangen Stehziele rechts** direkt unter der
    Einmündung der Abschussrinne. Unsere Stehziele stimmen also, nur der Kickback gehört nach links.
  - **[erledigt 0.19] Escape Route:** Sie wird über eine **eigene rote 3er-Bank Stehziele in der Spielfeldmitte** vorgeschaltet, **nicht**
    über die orangen rechts. Jede komplette Bank schaltet die 6 Rechteck-Einsätze links unten weiter (blinken). Man kassiert
    in der **Mulde oben rechts**, dabei gibt es das unterste blinkende Feature. Die 3. Stufe beleuchtet Hurry Up. Das
    Dossier hat beide Bänke verwechselt. [Vermutung] Unsere „runden roten Klappziele unter den Bumpern“ sind in
    Wahrheit diese rote 3er-Bank.
  - **[erledigt 0.18] Kanone laden:** Das Klappziel steht **direkt vor dem Schädel**. Ist es umgeworfen, geht die Kugel in den Schädel,
    ein Auswerfer schießt sie über eine Drahtbahn in die Kanone (rechts, auf halber Höhe). Umbauen: Klappziel vor unser
    Schädel-Loch setzen, statt „2 Schädel-Treffer“.
  - **[erledigt 0.18] Kanonenziel:** Man feuert, wenn die Kanone am **beleuchteten weißen Stehziel** vorbeischwenkt. Treffer = Multiball.
    Im Multiball wandert das beleuchtete Ziel über die Fünferbank unter dem Flugobjekt (Super Jackpot). Das bestätigt
    die 3 Phasen aus dem Dossier: erst festes Ziel, im Multiball wanderndes.
- **CPU-Säulen:** Die Rampen zählen nur **abwechselnd** (L/R/L/R). Bei uns zählt jede Rampe für sich.
- **Payback Time:** 20 s Modus, 6 bestimmte Schüsse leuchten, jeder Treffer bringt Millionen. Bei uns sind es 25 s mit
  doppelten Punkten.
- **Chase Loop:** rechter äußerer Umlauf als Kombo = 1 Mio. Bei uns hat der rechte Umlauf keine Regel.
- **Database** (linke Mulde): Zufallsbelohnungen, z. B. 500.000. **Lock:** Im Multiball eine Kugel links einloggen →
  Jackpot vervielfacht.
- **Video-Modus:** Die Flipper-Knöpfe steuern ein Fadenkreuz nach links und rechts, 3 Ziele vor Ablauf der Zeit treffen.
- **Skill Shot:** Wert steigt von Kugel 1 zu Kugel 3. **Mittelpfosten** zwischen den Flippern (fehlt bei uns).

## Aus dem Handy-Video des Nutzers (13 s, echter Automat im Multiball, blaue LED-Grundbeleuchtung; Messung per ffmpeg)

- **Jackpot-Lichtshow** [Sicher, gemessen]: Die Grundbeleuchtung flackert 3× mit 5 Hz (je 0,1 s aus/an), dann
  **~0,6 s komplett dunkel** – nur die Einsätze glühen, die Anzeige zeigt die Punktzahl (11.700.000). Danach kommt sie
  heller zurück (Blitzer), und „JACKPOT“ blinkt in der Anzeige.
- **Kurzer Einbruch der Grundbeleuchtung** (~0,1 s) bei einem starken Treffer (8,25 s), dazu passt ein lauter Schlag im Ton.
- **Anzeige:** Vor dem Jackpot steht „SHOOT FOR 2X JACKPOT“ → der Jackpot verdoppelt sich im Multiball (bei uns fest 1 Mio).
- **V-Säulen** (unsere Sicherheits-Säulen): Beim Jackpot laufen Lauflichter die Ovale hinauf, abwechselnd links/rechts.
  Die farbigen Fächer-Einsätze um „AUTO-FIRE BALL RESCUE“ unten leuchten beim Jackpot mit.
- **Ton** [Wahrscheinlich, aus dem Spektrogramm]: Im Multiball läuft **durchgehend Musik** (Energie fast nur unter
  800 Hz, Bass-lastig). Wir haben keine Musik. Mechanische Schläge sind sehr kurze Breitband-Klicks (30–50 ms, bis
  über 5 kHz). Vor dem Jackpot kommt ein **ansteigender Sirenen-Sweep** (~2,5 s, Obertöne von 1.000 auf 2.400 Hz).
  Die Sprachausgabe lässt sich nicht trennen und wäre ohnehin geschützt.
