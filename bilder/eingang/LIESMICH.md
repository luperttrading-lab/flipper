# Eingang: Bilder nach `bilder/AUFTRAG.md`

Erzeugt per Abacus.AI (RouteLLM-API, OpenAI-Format), Modell `gemini-3.1-flash-image` (Nano Banana 2),
Vorlage als Bild angehängt, `image_config.aspect_ratio` gesetzt. 2K wurde von der API ignoriert → 768 × 1376 (9:16)
bzw. 1376 × 768 (16:9). Schwarzer Hintergrund, kein Text.

| Datei | Motiv | Prompt | Auswahl |
|---|---|---|---|
| `schleuder_v1.png` | Bild A, Schleuder, 768 × 1376 | wörtlich aus AUFTRAG.md | beste von 3: alle 3 Pfosten auf den Kreisen der Vorlage, schwarzes Gummi nur an der Schrägkante. Der Kunststoffrand ragt etwas über den Umriss → beim Einbau auf das Dreieck beschneiden. |
| `rampe_v1.png` | Bild B, Rampenstreifen, 768 × 1376 | wörtlich aus AUFTRAG.md | beste von 4: Schienen am nächsten an den zwei Linien (linke minimal außen), 6 Pfeile nach oben, gleichmäßig |
| `flipper_v1.png` | Zusatz (Nutzerwunsch): Flipperarm, 1376 × 768 | siehe unten | beste von 3 (Deckung mit Vorlage IoU 0,75) |
| `flipper_vorlage.png` | Vorlage zum Flipperarm, 1280 × 720 | – | – |

Flipper-Vorlage (Maße von 0.37): waagerecht, 12 px je Tischeinheit, Drehpunkt (244 / 360), Spitze (1036 / 360)
= FL 66, Kopf r 9 (108 px), Spitze r 5,5 (66 px). Im Bild (1376 × 768) liegt alles im Verhältnis 1376/1280 = 1,075 größer:
Drehpunkt ≈ (262 / 384), Spitze ≈ (1114 / 384). Der Gummiring sitzt teils etwas außerhalb des grauen Umrisses.

Flipper-Prompt: „Use the attached grey silhouette as the EXACT shape, size and position: a pinball flipper bat lying
horizontally, top-down orthographic view, no perspective. Render it as a photorealistic 3D pinball flipper: glossy
ivory-white plastic body with a rounded, domed top surface and a long specular highlight from the top-left, a thick red
rubber ring running all around the outer edge of the bat, and a small polished chrome pivot cap exactly inside the white
circle of the template (the white circle itself must not be visible). The bat must not extend beyond the template
outline. Pure black background everywhere else, no shadow on the background. No text, no logos, no characters, no
watermark. Keep the aspect ratio 16:9."
