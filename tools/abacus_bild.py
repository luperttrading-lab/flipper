#!/usr/bin/env python3
"""Bild per Abacus.AI (RouteLLM, OpenAI-Format) erzeugen.
Aufruf: python3 tools/abacus_bild.py <modell> <name> "<prompt>" [vorlage.png]
Schlüssel: Umgebungsvariable ROUTELLM_API_KEY. Kosten stehen in usage.compute_points_used."""
import json, os, sys, base64, re, urllib.request
model, name, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
content = prompt
if len(sys.argv) > 4:
    b64 = base64.b64encode(open(sys.argv[4], "rb").read()).decode()
    content = [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": "data:image/png;base64," + b64}}]
body = {"model": model, "messages": [{"role": "user", "content": content}], "modalities": ["image", "text"]}
req = urllib.request.Request("https://routellm.abacus.ai/v1/chat/completions", json.dumps(body).encode(),
    {"Authorization": "Bearer " + os.environ["ROUTELLM_API_KEY"], "Content-Type": "application/json"})
r = json.load(urllib.request.urlopen(req, timeout=300))
json.dump(r, open(name + ".json", "w"))
msg = r["choices"][0]["message"]
s = json.dumps(msg)
m = re.search(r"data:image/(\w+);base64,([A-Za-z0-9+/=]+)", s)
if m:
    open(name + "." + m.group(1), "wb").write(base64.b64decode(m.group(2))); print("Bild:", name + "." + m.group(1))
else:
    print("kein Bild", s[:600])
print("usage", r.get("usage"))
