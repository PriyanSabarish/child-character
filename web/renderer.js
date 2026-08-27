import { loadManifest } from "./manifest.js";
import { loadImage, drawSlot, setupCanvas, randomRange } from "./utils.js";

const MANIFEST_PATH = "../examples/demo-character/manifest.json";
const ASSET_BASE = "../examples/demo-character/";

async function start() {
  const statusEl = document.getElementById("status");
  const canvas = document.getElementById("characterCanvas");

  try {
    statusEl.textContent = "Loading...";
    const manifest = await loadManifest(MANIFEST_PATH);

    // Preload sprites in parallel
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
      mouth: { closed: mouthClosed, small: mouthSmall, medium: mouthMed, wide: mouthWide },
    };

    const ctx = setupCanvas(canvas, manifest.canvas.width, manifest.canvas.height);
    statusEl.textContent = `Rig: ${manifest.rig_id}`;

    // Config with fallbacks
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

      // Eye blink timer
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

      ctx.clearRect(0, 0, manifest.canvas.width, manifest.canvas.height);
      ctx.save();
      ctx.translate(0, swayY);

      // Base -> Eyes -> Mouth
      ctx.drawImage(sprites.base, 0, 0);
      drawSlot(ctx, manifest.slots.eyes, isBlinking ? sprites.eyes.blink : sprites.eyes.open);
      drawSlot(ctx, manifest.slots.mouth, sprites.mouth.closed);

      ctx.restore();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  } catch (err) {
    console.error("Rig failed to initialize:", err);
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.style.color = "#ff6b6b";
  }
}

window.addEventListener("DOMContentLoaded", start);