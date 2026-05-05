const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const WIDTH = 640;
const HEIGHT = 400;
const OUT_DIR = path.join(__dirname, '..', 'assets');

function makeCanvas(color) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);
  const canvas = { pixels, width: WIDTH, height: HEIGHT };
  fillRect(canvas, 0, 0, WIDTH, HEIGHT, color);
  return canvas;
}

function blendPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return;
  }
  const rgba = parseColor(color);
  const offset = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
  const a = rgba[3] / 255;
  canvas.pixels[offset] = Math.round(rgba[0] * a + canvas.pixels[offset] * (1 - a));
  canvas.pixels[offset + 1] = Math.round(rgba[1] * a + canvas.pixels[offset + 1] * (1 - a));
  canvas.pixels[offset + 2] = Math.round(rgba[2] * a + canvas.pixels[offset + 2] * (1 - a));
  canvas.pixels[offset + 3] = 255;
}

function fillRect(canvas, x, y, width, height, color) {
  for (let py = Math.max(0, y); py < Math.min(canvas.height, y + height); py += 1) {
    for (let px = Math.max(0, x); px < Math.min(canvas.width, x + width); px += 1) {
      blendPixel(canvas, px, py, color);
    }
  }
}

function circle(canvas, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        blendPixel(canvas, x, y, color);
      }
    }
  }
}

function ellipse(canvas, cx, cy, rx, ry, color) {
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        blendPixel(canvas, x, y, color);
      }
    }
  }
}

function polygon(canvas, points, color) {
  const ys = points.map((p) => p[1]);
  const minY = Math.max(0, Math.floor(Math.min.apply(null, ys)));
  const maxY = Math.min(canvas.height - 1, Math.ceil(Math.max.apply(null, ys)));

  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const yi = points[i][1];
      const yj = points[j][1];
      if ((yi < y && yj >= y) || (yj < y && yi >= y)) {
        const xi = points[i][0];
        const xj = points[j][0];
        nodes.push(Math.floor(xi + ((y - yi) / (yj - yi)) * (xj - xi)));
      }
    }
    nodes.sort((a, b) => a - b);
    for (let k = 0; k < nodes.length; k += 2) {
      if (nodes[k + 1] === undefined) {
        continue;
      }
      for (let x = nodes[k]; x < nodes[k + 1]; x += 1) {
        blendPixel(canvas, x, y, color);
      }
    }
  }
}

function line(canvas, x1, y1, x2, y2, color, width) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    circle(canvas, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), width, color);
  }
}

function drawForest(rightSide) {
  const canvas = makeCanvas('#b8ecff');
  circle(canvas, 86, 72, 42, '#ffd75e');
  if (rightSide) {
    circle(canvas, 72, 66, 7, '#27313f');
    circle(canvas, 100, 66, 7, '#27313f');
    line(canvas, 76, 88, 96, 88, '#27313f', 2);
  } else {
    circle(canvas, 86, 72, 20, '#fff1a8');
  }

  ellipse(canvas, 220, 76, 54, 22, '#ffffff');
  ellipse(canvas, 260, 72, 44, 24, '#ffffff');
  ellipse(canvas, 186, 82, 36, 18, '#ffffff');

  polygon(canvas, [[0, 250], [130, 160], [250, 250]], '#8bd46e');
  polygon(canvas, [[150, 250], [310, 145], [480, 250]], '#72c35a');
  polygon(canvas, [[380, 250], [520, 170], [640, 250]], '#8bd46e');
  fillRect(canvas, 0, 250, WIDTH, 150, '#75c665');

  fillRect(canvas, 270, 190, 108, 86, '#ffe1a8');
  polygon(canvas, [[255, 192], [324, 132], [395, 192]], rightSide ? '#ff7f50' : '#ef5950');
  fillRect(canvas, 303, 222, 31, 54, '#a86b44');
  if (rightSide) {
    circle(canvas, 345, 224, 18, '#7cc6ff');
  } else {
    fillRect(canvas, 339, 207, 34, 34, '#7cc6ff');
  }
  fillRect(canvas, 345, 240, 6, 6, '#ffd75e');

  fillRect(canvas, 495, 190, 24, 92, '#87553b');
  circle(canvas, 506, 158, 48, '#44a95c');
  circle(canvas, 462, 185, 38, '#4fba68');
  circle(canvas, 548, 184, 36, '#3f9d54');
  if (rightSide) {
    circle(canvas, 505, 202, 11, '#ff4a4a');
  }

  polygon(canvas, [[232, 400], [318, 276], [372, 400]], '#dfb779');
  flower(canvas, 145, 315, rightSide ? '#7b61ff' : '#ff5fa2');
  flower(canvas, 98, 336, '#ffcf3d');
  flower(canvas, 555, 326, '#ffcf3d');
  return canvas;
}

function flower(canvas, x, y, petal) {
  line(canvas, x, y + 10, x, y + 30, '#3c9d57', 2);
  circle(canvas, x - 9, y, 8, petal);
  circle(canvas, x + 9, y, 8, petal);
  circle(canvas, x, y - 9, 8, petal);
  circle(canvas, x, y + 9, 8, petal);
  circle(canvas, x, y, 6, '#ffd75e');
}

function drawOcean(rightSide) {
  const canvas = makeCanvas('#6ed7ff');
  for (let y = 0; y < HEIGHT; y += 1) {
    const shade = Math.floor(215 - y * 0.18);
    fillRect(canvas, 0, y, WIDTH, 1, [80, shade, 255, 255]);
  }

  ellipse(canvas, 220, 190, 72, 42, '#ffca57');
  polygon(canvas, [[285, 190], [335, 154], [335, 226]], '#ff9f43');
  circle(canvas, 178, 180, 7, '#27313f');
  if (rightSide) {
    line(canvas, 214, 154, 236, 226, '#ffffff', 4);
  } else {
    line(canvas, 202, 154, 224, 226, '#ffffff', 4);
    line(canvas, 234, 154, 256, 226, '#ffffff', 4);
  }

  circle(canvas, 402, 98, 14, 'rgba(255,255,255,0.55)');
  circle(canvas, 436, 70, 10, 'rgba(255,255,255,0.55)');
  if (!rightSide) {
    circle(canvas, 426, 116, 8, 'rgba(255,255,255,0.55)');
  }

  fillRect(canvas, 0, 340, WIDTH, 60, '#edce8b');
  coral(canvas, 490, 310, rightSide ? '#ff6b3d' : '#b058ff');
  coral(canvas, 548, 323, '#ff75a1');
  shell(canvas, 124, 322, rightSide);

  ellipse(canvas, 520, 150, 45, 34, '#c084fc');
  for (let x = 486; x <= 552; x += 16) {
    line(canvas, x, 176, x - 8, 212, '#a855f7', 2);
  }
  circle(canvas, 505, 144, 5, '#27313f');
  circle(canvas, 536, 144, 5, '#27313f');
  if (rightSide) {
    line(canvas, 510, 164, 532, 164, '#27313f', 2);
  } else {
    line(canvas, 508, 160, 518, 168, '#27313f', 2);
    line(canvas, 518, 168, 534, 158, '#27313f', 2);
  }

  return canvas;
}

function coral(canvas, x, y, color) {
  line(canvas, x, y + 38, x, y - 36, color, 6);
  line(canvas, x, y - 6, x - 28, y - 34, color, 5);
  line(canvas, x, y - 2, x + 30, y - 30, color, 5);
  line(canvas, x - 12, y + 12, x - 36, y - 2, color, 5);
}

function shell(canvas, x, y, rightSide) {
  ellipse(canvas, x, y, 42, 24, '#ffd2a6');
  line(canvas, x - 28, y, x, y - 22, '#de8a5a', 2);
  line(canvas, x - 8, y + 2, x, y - 24, '#de8a5a', 2);
  line(canvas, x + 12, y + 2, x, y - 22, '#de8a5a', 2);
  if (rightSide) {
    star(canvas, x, y - 2, 16, '#ffef6e');
  }
}

function star(canvas, cx, cy, radius, color) {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  polygon(canvas, points, color);
}

function writePng(canvas, filename) {
  const raw = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    const rawOffset = y * (canvas.width * 4 + 1);
    raw[rawOffset] = 0;
    canvas.pixels.copy(raw, rawOffset + 1, y * canvas.width * 4, (y + 1) * canvas.width * 4);
  }

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', makeIhdr(canvas.width, canvas.height)),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(path.join(OUT_DIR, filename), png);
}

function makeIhdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function parseColor(color) {
  if (Array.isArray(color)) {
    return color;
  }
  if (color.startsWith('rgba')) {
    return color.match(/\d+(\.\d+)?/g).map(Number).map((value, index) => index === 3 ? Math.round(value * 255) : value);
  }
  const hex = color.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
    255
  ];
}

fs.mkdirSync(OUT_DIR, { recursive: true });
writePng(drawForest(false), 'level1-left.png');
writePng(drawForest(true), 'level1-right.png');
writePng(drawOcean(false), 'level2-left.png');
writePng(drawOcean(true), 'level2-right.png');

console.log('Generated placeholder level assets in assets/.');
