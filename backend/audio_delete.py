from generate_audio import AUDIO_FILES
from pathlib import Path
OUTPUT_DIR = Path('../frontend/public/assets/audio')
female = [k for k,v in AUDIO_FILES.items() if v['gender'] == 'female']
deleted = 0
for f in female:
    p = OUTPUT_DIR / f
    if p.exists():
        p.unlink()
        deleted += 1
        print(f'deleted: {f}')
print(f'Total supprimés: {deleted}')