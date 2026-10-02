#!/usr/bin/env python3
"""Uhrzeiger fürs Hinterglas freistellen (braucht Pillow + NumPy).
Aufruf: python3 tools/zeiger_einbau.py  → zeiger_h.png, zeiger_m.png, zeiger_n.png und kopf.jpg im Wurzelverzeichnis.

Quelle bilder/eingang/zeiger_v1.png (schwarzer Grund): Stundenzeiger, Minutenzeiger, Nabe. Jede Datei ist ein Quadrat mit dem
Drehpunkt genau in der Mitte, Zeiger nach oben (12 Uhr). Durchsichtigkeit nach Helligkeit. Gemessene Drehpunkte (Mitte der
Scheibe, Quelle 1774×887): Stunde 473,5/733, Minute 889/757, Nabe 1306,5/747; Spitzen bei y 269 bzw. 16.
kopf.jpg = bilder/eingang/kopf_ohne_zeiger_v1.png (1768×890), Uhrmitte dort ≈ 886/316 (Mitte des Ziffernkranzes)."""
from PIL import Image
import numpy as np

src = Image.open('bilder/eingang/zeiger_v1.png').convert('RGB')
TEILE = {                                        # Name: (Drehpunkt x, y, halbe Kantenlänge in Quellpixeln, Ausgabegröße)
    'h': (473.5, 733, 480, 256),
    'm': (889, 757, 752, 512),
    'n': (1306.5, 747, 90, 128),
}
for name, (cx, cy, hk, aus) in TEILE.items():
    box = (int(round(cx - hk)), int(round(cy - hk)), int(round(cx + hk)), int(round(cy + hk)))
    teil = src.crop(box)                         # außerhalb des Bildes schwarz → durchsichtig
    a = np.asarray(teil).astype(float)
    hell = a.max(axis=2)
    # nur das eigene Teil behalten (die Quadrate überlappen die Nachbarzeiger): Spaltenfenster um den Zeiger, Nabe als Kreis
    xs = np.arange(a.shape[1]) + box[0]
    ys = np.arange(a.shape[0])[:, None] + box[1]
    if name == 'n': eigen = (xs[None, :] - cx) ** 2 + (ys - cy) ** 2 <= 86 ** 2
    else: eigen = np.broadcast_to(np.abs(xs - cx)[None, :] <= 90, hell.shape)
    hell = np.where(eigen, hell, 0)
    alpha = np.clip((hell - 18) / 70, 0, 1)
    farbe = np.clip(a / np.maximum(alpha[..., None], 1e-3), 0, 255) * (alpha[..., None] > 0)   # Grundfarbe ohne Schwarzanteil
    rgba = np.dstack([farbe, alpha * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').resize((aus, aus), Image.LANCZOS).save(f'zeiger_{name}.png', optimize=True)
    print(f'zeiger_{name}.png', aus, 'Spitze bei', round((cy - (269 if name == "h" else 16)) / hk, 3) if name != 'n' else '-', 'der halben Kante')

Image.open('bilder/eingang/kopf_ohne_zeiger_v1.png').convert('RGB').save('kopf.jpg', quality=86, optimize=True, progressive=True)
print('kopf.jpg')

# Strudel (0.80/0.81): runde Scheibe um das Auge des Strudels (885/389), Radius 100 Bildpixel (unterer blauer Ring bei ~495 bleibt fest) – innerhalb des blauen Innenrings.
# Wird in drei.js über dem Bild gedreht; Rand weich (ab 55 % des Radius ausgeblendet), damit keine Kante zu sehen ist.
SX, SY, SR = 885, 389, 100
bg = Image.open('bilder/eingang/kopf_ohne_zeiger_v1.png').convert('RGB').crop((SX - SR, SY - SR, SX + SR, SY + SR)).resize((256, 256), Image.LANCZOS)
yy, xx = np.mgrid[0:256, 0:256]
r = np.hypot(xx - 127.5, yy - 127.5) / 128
alpha = np.clip((1 - r) / 0.22, 0, 1)                  # 0.81: bis 78 % deckend (vorher ab 55 % ausgeblendet – Drehung kaum sichtbar)
Image.fromarray(np.dstack([np.asarray(bg), (alpha * 255).astype(np.uint8)]), 'RGBA').save('strudel.png', optimize=True)
print('strudel.png')
