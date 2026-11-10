"""Kokoro narration: demo/narration.json -> public/audio/<id>.wav + public/audio/timings.json.

Word timings come from the PyTorch KPipeline result.tokens (start_ts / end_ts), English only.
"""
import json
import pathlib
import sys

import numpy as np
import soundfile as sf
from kokoro import KPipeline

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
SR = 24000
VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_heart"

pipeline = KPipeline(lang_code="a")
scenes = json.loads((ROOT / "narration.json").read_text(encoding="utf-8"))
timings = {}
for scene in scenes:
    chunks, words, offset = [], [], 0.0
    for result in pipeline(scene["text"], voice=VOICE, speed=1.0, split_pattern=None):
        audio = result.audio.cpu().numpy() if hasattr(result.audio, "cpu") else np.asarray(result.audio)
        for tok in result.tokens or []:
            if tok.start_ts is None or tok.end_ts is None or not tok.text.strip():
                continue
            words.append({"text": tok.text, "start": round(offset + tok.start_ts, 3), "end": round(offset + tok.end_ts, 3)})
        chunks.append(audio)
        offset += len(audio) / SR
    wav = np.concatenate(chunks)
    sf.write(OUT / f"{scene['id']}.wav", wav, SR)
    timings[scene["id"]] = {"duration": round(len(wav) / SR, 3), "text": scene["text"], "words": words}
    print(scene["id"], round(len(wav) / SR, 2), "s,", len(words), "word tokens")
(OUT / "timings.json").write_text(json.dumps({"voice": VOICE, "scenes": timings}, indent=2), encoding="utf-8")
