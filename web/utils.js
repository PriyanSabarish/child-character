
export function loadImage(src){
    return new Promise((resolve, reject) => {
        const  img = new Image();
        img.crossOrigin = "annonymus";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;


    })
}



export function drawSlot( ctx, slot, sprite){
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



export function setupCanvas(canvas, logicalWidth, logicalHeight) {
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


export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}