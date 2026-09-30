#!/usr/bin/env python3
"""Bilder aus bilder/eingang/ für das Spiel aufbereiten (braucht Pillow + NumPy).
Aufruf: python3 tools/bilder_einbau.py   → schreibt flipper.png und rampe.png ins Wurzelverzeichnis.

flipper.png: aus flipper_v1.png (Drehpunkt 262/384, Spitze 1114/384). Das Gummi liegt im Bild außerhalb der Vorlage,
  der Arm wäre 1:1 rund 2 Einheiten dicker als seine Kollisionsform. Deshalb Spalte für Spalte verzerrt, sodass der
  Außenrand genau auf der Hülle der Kreise r 9 (Drehpunkt) und r 5,5 (Spitze, FL 66) liegt. 10 px je Tischeinheit,
  Drehpunkt bei (9 + RAND) · 10 px, Mitte der Höhe.
rampe.png: aus rampe_v1.png ohne Pfeile – Median je Spalte, 288 × 64 px (16 px je Einheit, 18 Einheiten breit).
  Durchsichtigkeit nach Helligkeit: Schienen fast deckend, Kunststoff ≈ 30 %."""
from PIL import Image
import numpy as np

# ---------- Flipperarm ----------
FL, R0, R1, PX, RAND = 66, 9.0, 5.5, 10, 0.2
src = np.asarray(Image.open('bilder/eingang/flipper_v1.png').convert('RGB')).astype(float)
maske = src.max(axis=2) > 30
oben = np.array([np.argmax(maske[:, x]) if maske[:, x].any() else 384 for x in range(src.shape[1])])
unten = np.array([src.shape[0] - 1 - np.argmax(maske[::-1, x]) if maske[:, x].any() else 384 for x in range(src.shape[1])])
LI, DP, SP, RE = 117, 262, 1114, 1213            # linke Kante, Drehpunkt, Spitze, rechte Kante im Quellbild

def quelle_x(u):                                 # Tischeinheit entlang der Achse → Spalte im Quellbild (stückweise linear)
    if u < 0: return DP + (u / R0) * (DP - LI)
    if u > FL: return SP + (u - FL) / R1 * (RE - SP)
    return DP + u / FL * (SP - DP)

def halbhoehe(u):                                # Hülle zweier Kreise = Vereinigung der linear interpolierten Kreise
    t = np.clip(np.linspace(0, 1, 400), 0, 1)
    c, r = t * FL, R0 + (R1 - R0) * t
    d = r ** 2 - (u - c) ** 2
    return float(np.sqrt(d.max())) if d.max() > 0 else 0.0

w = int(round((R0 + FL + R1 + 2 * RAND) * PX)); h = int(round((2 * R0 + 2 * RAND) * PX))
out = np.zeros((h, w, 4))
SS = 4                                           # Überabtastung für glatte Kanten
for ox in range(w):
    acc = np.zeros((h, 4))
    for sx in range(SS):
        u = (ox + (sx + 0.5) / SS) / PX - RAND - R0
        ht = halbhoehe(u)
        if ht <= 0: continue
        xs = min(src.shape[1] - 1, max(0, int(round(quelle_x(u)))))
        mitte, hs = (oben[xs] + unten[xs]) / 2, max(1, (unten[xs] - oben[xs]) / 2)
        for sy in range(SS):
            v = (np.arange(h) + (sy + 0.5) / SS) / PX - RAND - R0
            innen = np.abs(v) <= ht
            ys = np.clip(np.round(mitte + v / ht * hs).astype(int), 0, src.shape[0] - 1)
            acc[:, :3] += src[ys, xs] * innen[:, None]
            acc[:, 3] += innen
    a = acc[:, 3]
    out[:, ox, :3] = np.where(a[:, None] > 0, acc[:, :3] / np.maximum(a, 1)[:, None], 0)
    out[:, ox, 3] = a / (SS * SS) * 255
Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA').save('flipper.png', optimize=True)
print('flipper.png', w, h)

# ---------- Rampenstreifen ----------
# Ohne Pfeile (Nutzerwunsch 0.52): je Spalte der Median über alle Zeilen ohne Pfeil-Bereiche → glatter Klarsicht-
# Kunststoff mit Chromschienen, entlang der Bahn gleichförmig (keine Naht, keine sich wiederholenden Flecken).
r = np.asarray(Image.open('bilder/eingang/rampe_v1.png').convert('RGB')).astype(float)
X0, X1 = 238, 530
PFEILE = [(40, 120), (280, 360), (520, 600), (760, 840), (1000, 1080), (1240, 1320)]   # Zeilen mit Pfeil samt Schein
frei = np.ones(r.shape[0], bool)
for a0, a1 in PFEILE: frei[a0:a1] = False
streifen = np.median(r[frei, X0:X1], axis=0)                     # eine Zeile, (Breite, 3)
hell = streifen.max(axis=1)
alpha = np.clip(0.3 + (hell - 110) / 140 * 0.7, 0.3, 1.0)
spalten = np.arange(X1 - X0) + X0
alpha[(spalten < 241) | (spalten > 526)] = 0                     # außerhalb der Schienen
zeile = np.concatenate([streifen, alpha[:, None] * 255], axis=1)
rgba = np.repeat(zeile[None], 64, axis=0).clip(0, 255).astype(np.uint8)
bild = Image.fromarray(rgba, 'RGBA').resize((288, 64), Image.LANCZOS)   # 16 px je Einheit, Kachel 4 Einheiten hoch
bild.save('rampe.png', optimize=True)
print('rampe.png', bild.size)
