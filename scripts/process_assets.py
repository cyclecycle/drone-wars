import os
import shutil
from pathlib import Path
from rembg import remove
from PIL import Image

RAW_DIR = Path("raw_assets")
OUT_DIR = Path("public/assets/img")


def process_texture(file_path):
    print(f"Processing texture: {file_path.name}")
    # Ideally optimize/convert to webp or jpg
    # For now, just copy or convert to jpg/png if needed.
    # Let's verify it opens with PIL
    try:
        img = Image.open(file_path)
        out_path = OUT_DIR / "textures" / file_path.name
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Save as is or convert?
        # If jpg, keep jpg. If png, keep png.
        img.save(out_path)
    except Exception as e:
        print(f"Error processing {file_path}: {e}")


def process_sprite(file_path):
    print(f"Processing sprite: {file_path.name}")
    try:
        img = Image.open(file_path)
        output = remove(img)

        # Save as PNG to preserve transparency
        out_name = file_path.stem + ".png"
        out_path = OUT_DIR / "sprites" / out_name
        out_path.parent.mkdir(parents=True, exist_ok=True)

        output.save(out_path)
    except Exception as e:
        print(f"Error processing {file_path}: {e}")


def main():
    if not RAW_DIR.exists():
        print(f"{RAW_DIR} does not exist.")
        return

    # Process textures
    textures_dir = RAW_DIR / "textures"
    if textures_dir.exists():
        for file_path in textures_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in [
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
            ]:
                process_texture(file_path)

    # Process sprites
    sprites_dir = RAW_DIR / "sprites"
    if sprites_dir.exists():
        for file_path in sprites_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in [
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
            ]:
                process_sprite(file_path)


if __name__ == "__main__":
    main()
