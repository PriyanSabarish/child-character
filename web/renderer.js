import { loadManifest } from "./manifest.js";


function loadImage(src){
    return new Promise((resolve, reject) => {
        const  img = new Image();
        img.crossOrigin = "annonymus";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;


    })
}



function drawSlot( ctx, slot, sprite){
    if (!slot || ! sprite) return;
    let drawX = slot.x;
    let drawY = slot.y;
    
    if (slot.anchor == "center"){
        drawX -= sprite.width / 2;
        drawY -= sprite.height / 2;
    }else if (slot.anchor == "top-center"){
        drawX -= sprite.width / 2;
    // drawY stays pinned to slot.y so height changes expand downward
    }

    ctx.drawImage(sprite, drawX, drawY);
}



function setupCanvas(canvas, logicalWidth, logicalHeight) {
  const dpr = window.devicePixelRatio || 1;

  // Scale internal pixel buffer
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;

  // Keep display layout size fixed
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return ctx;
}


async function start() {
  const statusEl = document.getElementById("status");
  const canvas = document.getElementById("characterCanvas");

  const manifestPath = "../examples/demo-character/manifest.json";
  const assetBase = "../examples/demo-character/";

  try {
    statusEl.textContent = "Loading manifest and assets...";
    const manifest = await loadManifest(manifestPath);

    // Preload base and default static sprites
    const baseImg = await loadImage(assetBase + manifest.base);
    const eyesOpenImg = await loadImage(assetBase + manifest.sprites.eyes.open);
    const mouthMediumImg = await loadImage(assetBase + manifest.sprites.mouth.medium);

    // Initialize high-DPI canvas context
    const ctx = setupCanvas(canvas, manifest.canvas.width, manifest.canvas.height);

    // Layer 1: Base Face
    ctx.drawImage(baseImg, 0, 0);

    // Layer 2: Eyes Slot
    drawSlot(ctx, manifest.slots.eyes, eyesOpenImg);

    // Layer 3: Mouth Slot
    drawSlot(ctx, manifest.slots.mouth, mouthMediumImg);

    statusEl.textContent = `Rig loaded: ${manifest.rig_id}`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.style.color = "#ff6b6b";
  }
}

window.addEventListener("DOMContentLoaded", start);
