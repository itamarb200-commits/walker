"""Generate Walker's app icon: a white paw print on the brand coral (#E05137,
"Hearth" accent), rounded-square background. Run: python scripts/make-app-icon.py
Outputs 512/192/180(apple-touch)/32(favicon) into public/.
"""
from PIL import Image, ImageDraw
import os

ACCENT = (224, 81, 55, 255)   # --accent (Hearth coral)
WHITE = (255, 255, 255, 255)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

SIZES = {
    "icon-512.png": 512,
    "icon-192.png": 192,
    "apple-touch-icon.png": 180,
    "favicon-32.png": 32,
}


def rounded_square(size, radius_ratio=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=ACCENT)
    return img


def draw_paw(img, size):
    """A friendly paw print: one big pad + four toes, centered with generous
    margin (~18% each side) so a maskable circular crop never clips it."""
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size * 0.56

    # Main pad — a wide ellipse.
    pad_w, pad_h = size * 0.36, size * 0.29
    draw.ellipse(
        [cx - pad_w / 2, cy - pad_h / 2, cx + pad_w / 2, cy + pad_h / 2],
        fill=WHITE,
    )

    # Four toes in an arc above the pad.
    toe_r = size * 0.085
    toe_positions = [
        (cx - size * 0.21, cy - size * 0.26),
        (cx - size * 0.08, cy - size * 0.345),
        (cx + size * 0.08, cy - size * 0.345),
        (cx + size * 0.21, cy - size * 0.26),
    ]
    for tx, ty in toe_positions:
        draw.ellipse([tx - toe_r, ty - toe_r, tx + toe_r, ty + toe_r], fill=WHITE)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for filename, size in SIZES.items():
        img = rounded_square(size)
        draw_paw(img, size)
        img.save(os.path.join(OUT_DIR, filename))
        print(f"wrote {filename} ({size}x{size})")


if __name__ == "__main__":
    main()
