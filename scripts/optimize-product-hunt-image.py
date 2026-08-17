from pathlib import Path

from PIL import Image

image_path = Path("assets/product-hunt/01-waypoint-route-selection.png")
image = Image.open(image_path).convert("RGB")

# Keep the real product composition while reducing the binary below the managed
# checkpoint limit. The public GitHub path remains unchanged after replacement.
max_width = 960
if image.width > max_width:
    height = round(image.height * (max_width / image.width))
    image = image.resize((max_width, height), Image.Resampling.LANCZOS)

image.save(image_path, format="PNG", optimize=True, compress_level=9)
print(f"{image_path}: {image.width}x{image.height}, {image_path.stat().st_size} bytes")
