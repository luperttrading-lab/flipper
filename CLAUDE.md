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
- Abschuss per **Abzug-Knopf** (seit 0.27 klein, 42 px, mittig in einer schmalen Zeile **unter** dem Tisch), keine Wisch-Feder mehr.
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
