#!/usr/bin/env bash
# Wächter für die Abstimmung zwischen Code- und Bilder-Sitzung (siehe bilder/ABSPRACHE.md).
# Aufruf: tools/waechter.sh code|bilder   (als Hintergrundbefehl starten)
# Fragt alle 120 s nur die Commit-Kennungen ab (git ls-remote, 0 Token). Ändert sich etwas, liest es ABSPRACHE.md von
# main und bilder-eingang und endet mit Ausgabe, sobald eine NEUE Zeile an die eigene Rolle auftaucht:
#   code:   **Bilder → Code:** BITTE|BEREIT   (auch **Bilder:** BITTE|BEREIT)
#   bilder: **Code → Bilder:** BITTE|BEREIT   (auch **Code:** BITTE|BEREIT)
# Endet spätestens nach 115 min (Ausgabe „ZEIT“) – dann neu starten. Gesehene Zeilen merkt es sich in .git/ (nicht im Repo).
set -u
rolle=${1:?code oder bilder}
case "$rolle" in
  code)   muster='\*\*Bilder( → Code)?:\*\* (BITTE|BEREIT)' ;;
  bilder) muster='\*\*Code( → Bilder)?:\*\* (BITTE|BEREIT)' ;;
  *) echo "Rolle muss code oder bilder sein"; exit 1 ;;
esac
cd "$(git rev-parse --show-toplevel)" || exit 1
gesehen=".git/waechter_${rolle}.gesehen"
zeilen() {
  for b in main bilder-eingang; do git show "origin/$b:bilder/ABSPRACHE.md" 2>/dev/null; done | grep -E '^- ' | grep -E "$muster" | sort -u
}
git fetch -q origin main bilder-eingang 2>/dev/null
[ -f "$gesehen" ] || zeilen > "$gesehen"          # erster Start: Altes gilt als gesehen
letzte=""
ende=$(( $(date +%s) + 115 * 60 ))
while [ "$(date +%s)" -lt "$ende" ]; do
  jetzt=$(git ls-remote origin main bilder-eingang 2>/dev/null | cut -f1 | tr '\n' ' ')
  if [ -n "$jetzt" ] && [ "$jetzt" != "$letzte" ]; then
    letzte=$jetzt
    git fetch -q origin main bilder-eingang 2>/dev/null
    neu=$(zeilen | comm -13 "$gesehen" -)
    if [ -n "$neu" ]; then
      zeilen > "$gesehen"
      echo "NEU für $rolle:"; echo "$neu"; exit 0
    fi
  fi
  sleep 120
done
echo "ZEIT – Wächter ($rolle) nach 115 min beendet, bitte neu starten"; exit 2
