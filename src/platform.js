function getPlatform() {
  if (typeof tt !== 'undefined') {
    return tt;
  }
  if (typeof wx !== 'undefined') {
    return wx;
  }
  return null;
}

function createStage() {
  const platform = getPlatform();
  const systemInfo = platform && platform.getSystemInfoSync ? platform.getSystemInfoSync() : {};
  const pixelRatio = systemInfo.pixelRatio || 1;
  const logicalWidth = systemInfo.windowWidth || 375;
  const logicalHeight = systemInfo.windowHeight || 667;
  const canvas = platform && platform.createCanvas ? platform.createCanvas() : createBrowserCanvas(logicalWidth, logicalHeight);
  const ctx = canvas.getContext('2d');

  canvas.width = Math.floor(logicalWidth * pixelRatio);
  canvas.height = Math.floor(logicalHeight * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);

  return {
    canvas,
    ctx,
    platform,
    width: logicalWidth,
    height: logicalHeight,
    pixelRatio
  };
}

function createBrowserCanvas(width, height) {
  if (typeof document === 'undefined') {
    throw new Error('No mini-game platform found. Please run in Douyin Developer Tools.');
  }

  const canvas = document.createElement('canvas');
  document.body.style.margin = '0';
  document.body.appendChild(canvas);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return canvas;
}

function createImage(src) {
  const platform = getPlatform();
  const image = platform && platform.createImage ? platform.createImage() : new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function onTap(canvas, handler) {
  const platform = getPlatform();

  if (platform && platform.onTouchStart) {
    platform.onTouchStart((event) => {
      const touch = event.touches && event.touches[0];
      if (touch) {
        handler(touch.clientX, touch.clientY);
      }
    });
    return;
  }

  if (canvas && canvas.addEventListener) {
    canvas.addEventListener('pointerdown', (event) => {
      handler(event.clientX, event.clientY);
    });
  }
}

function nextFrame(callback) {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16);
}

module.exports = {
  createImage,
  createStage,
  nextFrame,
  onTap
};
