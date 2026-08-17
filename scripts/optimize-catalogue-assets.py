from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "public" / "catalog"
for source in sorted(root.glob("*.jpg")):
    with Image.open(source) as image:
        image = image.convert("RGB")
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        image.save(source, format="JPEG", quality=68, optimize=True, progressive=True)
        print(f"optimized {source.name}: {source.stat().st_size} bytes")
