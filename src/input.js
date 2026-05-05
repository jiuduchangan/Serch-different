function contains(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function screenToImagePoint(layout, level, screenX, screenY) {
  const panels = [layout.leftPanel, layout.rightPanel];

  for (let i = 0; i < panels.length; i += 1) {
    const panel = panels[i];
    if (!contains(panel.imageRect, screenX, screenY)) {
      continue;
    }

    const x = ((screenX - panel.imageRect.x) / panel.imageRect.width) * level.width;
    const y = ((screenY - panel.imageRect.y) / panel.imageRect.height) * level.height;
    return { x, y, screenX, screenY, side: panel.side };
  }

  return null;
}

module.exports = {
  contains,
  screenToImagePoint
};
