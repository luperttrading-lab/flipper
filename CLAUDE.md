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
