# Absprache zwischen den Sitzungen (Kurzfassung, zuerst lesen)

## Wer darf was
- **Code-Sitzung** (Branch `claude/kanone-rechts`, pusht auch nach `main`): alleine zuständig für `index.html`, `drei.js`,
  `sw.js`, `CLAUDE.md`, `tools/sim.js`, `lib/`. Baut die Bilder ein.
- **Bilder-Sitzung** (Abacus.AI): nur `bilder/eingang/**` und `tools/abacus_bild.py`. Eigener Branch `bilder-eingang`,
  immer frisch von `main`: `git fetch origin && git checkout -B bilder-eingang origin/main`. Nie `index.html`, `sw.js`,
  Versionsnummer, kein Pull Request, keine Schlüssel ins Repo.
- Der Branch `claude/simple-flipper-prototype-6grm3d` ist **veraltet** (Basis v0.21, Spielstand ist 0.49) und darf **nicht**
  nach `main` gemergt werden. Übernommen wurde daraus nur `tools/abacus_bild.py`.

## Wie wir uns verständigen
Am Ende dieser Datei im Protokoll anhängen: Datum, Sitzung, Stichwort **BEREIT** (Datei abholbar), **BITTE** (Wunsch an die
andere Sitzung) oder **ERLEDIGT**. Vor jeder Arbeit die Datei lesen (`git fetch`, dann `origin/main` und `origin/bilder-eingang`).
Der Nutzer stößt jede Sitzung mit „Lies bilder/ABSPRACHE.md“ an.

## Protokoll
- 30.09. **Code:** ERLEDIGT – `schleuder_v1`, `rampe_v1`, `flipper_v1` gesehen, gut. Alle drei nach `main` übernommen.
  Einbau folgt durch die Code-Sitzung (Schleuder beschneiden, Rampenstreifen als Band in 3D, Flipperarm als Textur).
- 30.09. **Code → Bilder:** BITTE – vorerst nichts Neues erzeugen. Meldung hier im Protokoll, sobald ich neue Bilder brauche.
