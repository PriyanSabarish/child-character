import json
from pathlib import Path
import jsonschema
import pytest

# Helper to dynamically find the project root directory
ROOT_DIR = Path(__file__).resolve().parent.parent


def test_manifest_matches_schema():
    """Validates that the demo manifest complies with manifest.schema.json."""
    schema_path = ROOT_DIR / "manifest.schema.json"
    manifest_path = ROOT_DIR / "examples" / "demo-character" / "manifest.json"

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # jsonschema.validate raises ValidationError if manifest breaks any schema rule
    jsonschema.validate(instance=manifest, schema=schema)


def test_all_referenced_assets_exist():
    """Ensures that every PNG path referenced in manifest.json actually exists on disk."""
    demo_dir = ROOT_DIR / "examples" / "demo-character"
    manifest_path = demo_dir / "manifest.json"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # 1. Verify base background sprite
    base_file = demo_dir / manifest["base"]
    assert base_file.is_file(), f"Base image not found at {base_file}"

    # 2. Verify all mouth variation PNGs
    for state, filename in manifest["sprites"]["mouth"].items():
        sprite_file = demo_dir / filename
        assert sprite_file.is_file(), f"Mouth sprite '{filename}' for state '{state}' does not exist"

    # 3. Verify all eye variation PNGs
    for state, filename in manifest["sprites"]["eyes"].items():
        sprite_file = demo_dir / filename
        assert sprite_file.is_file(), f"Eye sprite '{filename}' for state '{state}' does not exist"