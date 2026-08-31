"""Generate Android adaptive/legacy launcher icons from iconoapppalcos.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "imgs" / "iconoapppalcos.png"
RES = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "res"
WEB_APP = ROOT / "src" / "app" / "servicio-palcos"
GREEN = (10, 28, 22, 255)

FOREGROUND = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}
LEGACY = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}


def crop_content(im: Image.Image, pad_ratio: float = 0.04) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    left, top, right, bottom = bbox
    pad = int(max(right - left, bottom - top) * pad_ratio)
    return im.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(im.width, right + pad),
            min(im.height, bottom + pad),
        )
    )


def fit_transparent(im: Image.Image, canvas: int, fill_ratio: float) -> Image.Image:
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    content = crop_content(im)
    target = max(1, int(canvas * fill_ratio))
    content.thumbnail((target, target), Image.Resampling.LANCZOS)
    x = (canvas - content.width) // 2
    y = (canvas - content.height) // 2
    out.alpha_composite(content, (x, y))
    return out


def fit_on_green(im: Image.Image, canvas: int, fill_ratio: float, round_mask: bool) -> Image.Image:
    fg = fit_transparent(im, canvas, fill_ratio)
    bg = Image.new("RGBA", (canvas, canvas), GREEN)
    bg.alpha_composite(fg)
    if round_mask:
        mask = Image.new("L", (canvas, canvas), 0)
        from PIL import ImageDraw

        ImageDraw.Draw(mask).ellipse((0, 0, canvas - 1, canvas - 1), fill=255)
        bg.putalpha(mask)
    return bg


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)


def main() -> None:
    src = Image.open(SRC).convert("RGBA")

    xml_fg = RES / "drawable" / "ic_launcher_foreground.xml"
    if xml_fg.exists():
        xml_fg.unlink()

    for density, size in FOREGROUND.items():
        save(
            fit_transparent(src, size, 0.62),
            RES / f"drawable-{density}" / "ic_launcher_foreground.png",
        )

    for density, size in LEGACY.items():
        save(fit_on_green(src, size, 0.78, False), RES / f"mipmap-{density}" / "ic_launcher.png")
        save(fit_on_green(src, size, 0.78, True), RES / f"mipmap-{density}" / "ic_launcher_round.png")

    WEB_APP.mkdir(parents=True, exist_ok=True)
    save(fit_transparent(src, 192, 0.92), WEB_APP / "icon.png")
    save(fit_on_green(src, 180, 0.82, False), WEB_APP / "apple-icon.png")
    print("Launcher icons generated.")


if __name__ == "__main__":
    main()
