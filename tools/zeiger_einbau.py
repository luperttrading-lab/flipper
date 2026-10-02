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

# Strudel (0.82): der ganze Strudel innerhalb des blauen Innenrings (Ringlinie bei r ≈ 173–182 um die Uhrmitte 886/316), Scheibe r 168.
# Das Auge des Strudels sitzt im Bild nicht in der Mitte (885/389). Damit er beim Drehen nicht eiert, wird das Bild verzerrt: für jede
# Richtung θ wird die Strecke vom Auge bis zum Kreisrand auf die Strecke Mitte → Rand abgebildet. Am Rand stimmt die Scheibe exakt mit dem
# Bild überein, das Auge liegt danach genau in der Mitte. Rand ab 90 % weich ausgeblendet.
CX, CY, CR, EX, EY, N = 886, 319, 174, 885, 389, 512   # 0.83: Innenring genauer vermessen (oben 143, unten 494 → Mitte 319, r 175)
quelle = np.asarray(Image.open('bilder/eingang/kopf_ohne_zeiger_v1.png').convert('RGB')).astype(float)
yy, xx = np.mgrid[0:N, 0:N]
dx, dy = (xx + 0.5) / N * 2 - 1, (yy + 0.5) / N * 2 - 1
r = np.hypot(dx, dy); r_ = np.maximum(r, 1e-9)
ux, uy = dx / r_, dy / r_
bx = (EX - CX) * ux + (EY - CY) * uy; c = (EX - CX) ** 2 + (EY - CY) ** 2 - CR ** 2
t = -bx + np.sqrt(bx ** 2 - c)                     # Abstand Auge → Kreisrand in Richtung θ
qx, qy = EX + ux * r * t, EY + uy * r * t
x0, y0 = np.floor(qx).astype(int), np.floor(qy).astype(int); fx, fy = (qx - x0)[..., None], (qy - y0)[..., None]
def px(x, y): return quelle[np.clip(y, 0, quelle.shape[0] - 1), np.clip(x, 0, quelle.shape[1] - 1)]
farbe = (px(x0, y0) * (1 - fx) * (1 - fy) + px(x0 + 1, y0) * fx * (1 - fy) + px(x0, y0 + 1) * (1 - fx) * fy + px(x0 + 1, y0 + 1) * fx * fy)
alpha = np.clip((1 - r) / 0.05, 0, 1)
Image.fromarray(np.dstack([farbe.clip(0, 255), alpha * 255]).astype(np.uint8), 'RGBA').save('strudel.png', optimize=True)
print('strudel.png')
