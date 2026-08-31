import { loadManifest } from "./manifest.js";
import { loadImage, drawSlot, setupCanvas, randomRange } from "./utils.js";
import { LipSyncAnalyzer } from "./audio.js";

const MANIFEST_PATH = "../examples/demo-character/manifest.json";
const ASSET_BASE = "../examples/demo-character/";

async function start() {
  const statusEl = document.getElementById("status");
  const canvas = document.getElementById("characterCanvas");
  const testBtn = document.getElementById("testAudioBtn");

  try {
    statusEl.textContent = "Loading assets...";
    const manifest = await loadManifest(MANIFEST_PATH);

    const [base, eyesOpen, eyesBlink, mouthClosed, mouthSmall, mouthMed, mouthWide] = await Promise.all([
      loadImage(ASSET_BASE + manifest.base),
      loadImage(ASSET_BASE + manifest.sprites.eyes.open),
      loadImage(ASSET_BASE + manifest.sprites.eyes.blink),
      loadImage(ASSET_BASE + manifest.sprites.mouth.closed),
      loadImage(ASSET_BASE + manifest.sprites.mouth.small),
      loadImage(ASSET_BASE + manifest.sprites.mouth.medium),
      loadImage(ASSET_BASE + manifest.sprites.mouth.wide),
    ]);

    const sprites = {
      base,
      eyes: { open: eyesOpen, blink: eyesBlink },
      mouth: {
        closed: mouthClosed,
        small: mouthSmall,
        medium: mouthMed,
        wide: mouthWide,
      },
    };

    const ctx = setupCanvas(canvas, manifest.canvas.width, manifest.canvas.height);
    const audio = new LipSyncAnalyzer();

    testBtn.addEventListener("click", () => {
      audio.playSyntheticPuffSequence();
    });

    statusEl.textContent = `Rig active: ${manifest.rig_id}`;

    // Config defaults
    const idle = manifest.idle || {};
    const swayPeriod = idle.sway_period_s ?? 3.0;
    const swayAmp = idle.sway_amplitude_px ?? 4.0;
    const minBlink = idle.blink_interval_min_s ?? 3.0;
    const maxBlink = idle.blink_interval_max_s ?? 5.0;
    const blinkDuration = idle.blink_duration_s ?? 0.15;

    let lastTime = performance.now();
    let elapsed = 0;
    let isBlinking = false;
    let blinkTimer = 0;
    let nextBlink = randomRange(minBlink, maxBlink);

    function loop(currentTime) {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      elapsed += dt;

      // Procedural blink state
      blinkTimer += dt;
      if (!isBlinking && blinkTimer >= nextBlink) {
        isBlinking = true;
        blinkTimer = 0;
      } else if (isBlinking && blinkTimer >= blinkDuration) {
        isBlinking = false;
        blinkTimer = 0;
        nextBlink = randomRange(minBlink, maxBlink);
      }

      // Vertical floating sway
      const swayY = Math.sin((elapsed * 2 * Math.PI) / swayPeriod) * swayAmp;

      // Audio-driven mouth state
      const mouthState = audio.updateMouthState(currentTime);

      ctx.clearRect(0, 0, manifest.canvas.width, manifest.canvas.height);
      ctx.save();
      ctx.translate(0, swayY);

      // Layer 1: Base Head
      ctx.drawImage(sprites.base, 0, 0);

      // Layer 2: Eyes (Open / Blink)
      drawSlot(ctx, manifest.slots.eyes, isBlinking ? sprites.eyes.blink : sprites.eyes.open);

      // Layer 3: Mouth (Closed / Small / Medium / Wide via Audio)
      drawSlot(ctx, manifest.slots.mouth, sprites.mouth[mouthState]);

      ctx.restore();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  } catch (err) {
    console.error("Renderer error:", err);
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.style.color = "#ff6b6b";
  }
}

window.addEventListener("DOMContentLoaded", start);