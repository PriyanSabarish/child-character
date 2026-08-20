import json
from pathlib import Path
from PIL import Image, ImageDraw

demo_dir = Path("examples/demo-character")
demo_dir.mkdir(parents=True, exist_ok=True)

# 1. Create base head (512x512 with face circle)
base = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(base)
draw.ellipse([56, 56, 456, 456], fill=(255, 220, 180, 255), outline=(50, 50, 50, 255), width=4)
base.save(demo_dir / "base.png")

# 2. Create eyes: open vs blink (120x60)
eyes_open = Image.new("RGBA", (120, 60), (0, 0, 0, 0))
draw_eye = ImageDraw.Draw(eyes_open)
draw_eye.ellipse([10, 10, 50, 50], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=2)
draw_eye.ellipse([25, 25, 40, 40], fill=(50, 50, 50, 255))
draw_eye.ellipse([70, 10, 110, 50], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=2)
draw_eye.ellipse([85, 25, 100, 40], fill=(50, 50, 50, 255))
eyes_open.save(demo_dir / "eyes_open.png")

eyes_blink = Image.new("RGBA", (120, 60), (0, 0, 0, 0))
draw_blink = ImageDraw.Draw(eyes_blink)
draw_blink.arc([10, 20, 50, 45], start=0, end=180, fill=(0, 0, 0, 255), width=3)
draw_blink.arc([70, 20, 110, 45], start=0, end=180, fill=(0, 0, 0, 255), width=3)
eyes_blink.save(demo_dir / "eyes_blink.png")

# 3. Create 4 mouth states (100x60)
mouth_configs = {
    "mouth_closed.png": lambda d: d.line([(20, 10), (80, 10)], fill=(80, 20, 20, 255), width=4),
    "mouth_small.png": lambda d: d.ellipse([30, 5, 70, 25], fill=(200, 50, 50, 255), outline=(80, 20, 20, 255), width=2),
    "mouth_medium.png": lambda d: d.ellipse([25, 5, 75, 40], fill=(200, 50, 50, 255), outline=(80, 20, 20, 255), width=2),
    "mouth_wide.png": lambda d: d.ellipse([15, 5, 85, 55], fill=(200, 50, 50, 255), outline=(80, 20, 20, 255), width=2)
}

for filename, draw_fn in mouth_configs.items():
    m_img = Image.new("RGBA", (100, 60), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(m_img))
    m_img.save(demo_dir / filename)

# 4. Create manifest.json
manifest = {
  "version": 1,
  "rig_id": "demo-character-001",
  "canvas": { "width": 512, "height": 512 },
  "base": "base.png",
  "slots": {
    "mouth": { "x": 256, "y": 340, "anchor": "top-center" },
    "eyes":  { "x": 256, "y": 230, "anchor": "center" }
  },
  "sprites": {
    "mouth": {
      "closed": "mouth_closed.png",
      "small":  "mouth_small.png",
      "medium": "mouth_medium.png",
      "wide":   "mouth_wide.png"
    },
    "eyes": {
      "open":  "eyes_open.png",
      "blink": "eyes_blink.png"
    }
  },
  "idle": {
    "sway_amplitude_px": 4,
    "sway_period_ms": 3500,
    "blink_interval_ms": [2500, 4500],
    "blink_duration_ms": 120
  }
}

with open(demo_dir / "manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)

print("Demo character generated in examples/demo-character/")