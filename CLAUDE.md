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
- Physik-Test: `node tools/sim.js [minuten]` (Node-Simulation mit `window.__TEST__`): Abschuss-Pfad, jedes der 5
  Rundziele per Kanone treffbar (Winkel-Scan), Multiball per Treffer, dann Autoplay (Standard 10 min): Kugel
  verlässt nie den Tisch, bleibt nie hängen. Seit 0.18 auch Schädel-Klappziel → LOAD GUN → Laden, Targetlicht
  fest/wandernd, Sperre. Ergebnis 0.18: 14/14 OK, 3 × 10 min ohne Fehler. Ab 0.19 auch Escape Route (Umlauf → Mulde,
  Weiterschalten, Neustart der Leiter); Ergebnis 0.19: 19/19 OK, 3 × 10 min ohne Fehler, Mulde im Autoplay 5–13× je 10 min. Ergebnis 0.17: Ziel 1–5 bei Lage 0,31/0,40/0,51/0,62/0,72
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
