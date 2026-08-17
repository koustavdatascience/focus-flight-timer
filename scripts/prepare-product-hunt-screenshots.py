from pathlib import Path
from PIL import Image

SOURCE_ROOT = Path("/home/ubuntu/screenshots")
OUTPUT_ROOT = Path("/home/ubuntu/webdev-static-assets/waypoint-product-hunt")


def export_png(source_name: str, output_name: str, crop=None):
    source = Image.open(SOURCE_ROOT / source_name).convert("RGB")
    if crop:
        source = source.crop(crop)
    destination = OUTPUT_ROOT / output_name
    destination.parent.mkdir(parents=True, exist_ok=True)
    source.save(destination, format="PNG", optimize=True)
    print(f"{destination} — {source.width}x{source.height}")


export_png(
    "webdev-preview-root-1787000718163499004-1853.png",
    "01-waypoint-route-selection.png",
)

# Square crop for Product Hunt's thumbnail slot; retains the central headline and route-selection controls.
export_png(
    "webdev-preview-root-1787000718163499004-1853.png",
    "00-waypoint-product-hunt-thumbnail.png",
    crop=(270, 0, 1170, 900),
)

# Preserve the active-flight UI while trimming only the non-product preview strip.
export_png(
    "focusflight-active.png",
    "02-waypoint-active-flight.png",
    crop=(0, 0, 1280, 676),
)

# The route-review screen proves that Waypoint calculates and presents a real route before focus begins.
export_png(
    "focusflight-selection.png",
    "03-waypoint-route-review.png",
    crop=(0, 0, 1280, 676),
)
