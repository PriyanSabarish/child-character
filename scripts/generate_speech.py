import argparse
import urllib.request
import wave
from functools import lru_cache
from pathlib import Path
from piper import PiperVoice

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DEFAULT_OUTPUT_DIR = BASE_DIR / "web" / "audio"

VOICE_NAME = "en_US-lessac-medium"
ONNX_URL = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{VOICE_NAME}.onnx"
JSON_URL = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/{VOICE_NAME}.onnx.json"

ONNX_PATH = MODELS_DIR / f"{VOICE_NAME}.onnx"
JSON_PATH = MODELS_DIR / f"{VOICE_NAME}.onnx.json"


def download_file(url: str, target_path: Path) -> None:
    """Downloads a file atomically using a .part suffix to prevent corrupt cache hits."""
    if target_path.exists():
        return

    target_path.parent.mkdir(parents=True, exist_ok=True)
    part_path = target_path.with_suffix(target_path.suffix + ".part")

    print(f"Downloading {target_path.name}...")
    urllib.request.urlretrieve(url, part_path)
    part_path.rename(target_path)
    print(f"Saved: {target_path.name}")


@lru_cache(maxsize=1)
def get_voice() -> PiperVoice:
    """Loads and caches the Piper ONNX model in memory."""
    download_file(ONNX_URL, ONNX_PATH)
    download_file(JSON_URL, JSON_PATH)

    print(f"Loading Piper voice model ({VOICE_NAME})...")
    return PiperVoice.load(str(ONNX_PATH), config_path=str(JSON_PATH))


def synthesize_speech(text: str, output_path: Path) -> Path:
    """Synthesizes text to a mono WAV file, deriving audio specs directly from chunk metadata."""
    voice = get_voice()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f'Synthesizing: "{text}"')
    with wave.open(str(output_path), "wb") as wav_file:
        first_chunk = True

        for chunk in voice.synthesize(text):
            if first_chunk:
                wav_file.setnchannels(chunk.sample_channels)
                wav_file.setsampwidth(chunk.sample_width)
                wav_file.setframerate(chunk.sample_rate)
                first_chunk = False

            wav_file.writeframes(chunk.audio_int16_bytes)

    print(f"Generated -> {output_path}")
    return output_path


def parse_args():
    parser = argparse.ArgumentParser(description="Generate speech audio using Piper TTS.")
    parser.add_argument(
        "text",
        nargs="?",
        default="Hello there! I am your animated companion. My mouth shapes are synchronized to my voice.",
        help="Text to synthesize.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR / "speech.wav",
        help="Target WAV output path (default: web/audio/speech.wav).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    synthesize_speech(args.text, args.output)