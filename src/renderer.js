const COLORS = {
  background: '#f7efe2',
  ink: '#27313f',
  muted: '#6f7b8a',
  panel: '#fffdf8',
  primary: '#ff6b3d',
  primaryDark: '#d94e24',
  accent: '#21b7a8',
  line: '#eadbc8',
  success: '#26b56f',
  danger: '#ef4444',
  shadow: 'rgba(39, 49, 63, 0.14)'
};

function computeLayout(width, height, level) {
  const margin = 16;
  const topHeight = 78;
  const bottomHeight = 70;
  const gap = 12;
  const labelHeight = 24;
  const imageRatio = level.width / level.height;
  const availableHeight = height - topHeight - bottomHeight - margin - gap - labelHeight * 2;
  const maxPanelWidth = width - margin * 2;
  const imageHeight = Math.min(maxPanelWidth / imageRatio, availableHeight / 2);
  const imageWidth = imageHeight * imageRatio;
  const panelX = (width - imageWidth) / 2;
  let y = topHeight;

  const leftPanel = makePanel('left', '原图', panelX, y, imageWidth, imageHeight, labelHeight);
  y += labelHeight + imageHeight + gap;
  const rightPanel = makePanel('right', '找不同', panelX, y, imageWidth, imageHeight, labelHeight);

  return {
    width,
    height,
    margin,
    topHeight,
    leftPanel,
    rightPanel,
    restartButton: {
      x: margin,
      y: height - 54,
      width: 120,
      height: 42
    },
    tipArea: {
      x: margin + 132,
      y: height - 52,
      width: width - margin * 2 - 132,
      height: 42
    },
    victoryButton: {
      x: width / 2 - 76,
      y: height / 2 + 82,
      width: 152,
      height: 46
    },
    audioButton: {
      x: width - margin - 42,
      y: 36,
      width: 34,
      height: 34
    }
  };
}

function makePanel(side, label, x, y, width, imageHeight, labelHeight) {
  return {
    side,
    label,
    labelRect: { x, y, width, height: labelHeight },
    imageRect: { x, y: y + labelHeight, width, height: imageHeight }
  };
}

function render(ctx, model) {
  const { state, images, layout, loading, audioEnabled } = model;
  clear(ctx, layout.width, layout.height);
  drawTopBar(ctx, layout, state, audioEnabled);

  if (loading) {
    drawLoading(ctx, layout);
    return;
  }

  drawPanel(ctx, layout.leftPanel, images.left);
  drawPanel(ctx, layout.rightPanel, images.right);
  drawMarks(ctx, layout, state);
  drawFeedback(ctx, state.feedback);
  drawBottomBar(ctx, layout, state);

  if (state.isComplete) {
    drawVictory(ctx, layout, state);
  }
}

function clear(ctx, width, height) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);
}

function drawTopBar(ctx, layout, state, audioEnabled) {
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 22px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('找不同', layout.margin, 18);

  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText(state.level.name, layout.margin, 47);

  const progressText = `${state.foundCount}/${state.totalCount}`;
  ctx.font = '700 22px sans-serif';
  const progressWidth = ctx.measureText(progressText).width;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(progressText, layout.audioButton.x - 12 - progressWidth, 26);
  drawAudioButton(ctx, layout.audioButton, audioEnabled);
}

function drawLoading(ctx, layout) {
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('图片加载中...', layout.width / 2, layout.height / 2);
  ctx.textAlign = 'left';
}

function drawPanel(ctx, panel, image) {
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(panel.label, panel.labelRect.x, panel.labelRect.y + 3);

  drawRoundRect(ctx, panel.imageRect.x - 4, panel.imageRect.y - 4, panel.imageRect.width + 8, panel.imageRect.height + 8, 8, COLORS.shadow);
  drawRoundRect(ctx, panel.imageRect.x - 2, panel.imageRect.y - 2, panel.imageRect.width + 4, panel.imageRect.height + 4, 8, COLORS.panel);

  ctx.save();
  roundedClip(ctx, panel.imageRect, 6);
  ctx.drawImage(image, panel.imageRect.x, panel.imageRect.y, panel.imageRect.width, panel.imageRect.height);
  ctx.restore();
}

function drawMarks(ctx, layout, state) {
  const panels = [layout.leftPanel, layout.rightPanel];

  state.marks.forEach((mark) => {
    panels.forEach((panel) => {
      const point = imageToScreen(panel.imageRect, state.level, mark);
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = COLORS.success;
      ctx.fillStyle = 'rgba(38, 181, 111, 0.14)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(12, ((mark.radius || 20) / state.level.width) * panel.imageRect.width), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  });
}

function drawFeedback(ctx, feedback) {
  if (!feedback) {
    return;
  }

  const age = Date.now() - feedback.time;
  if (age > 420) {
    return;
  }

  const alpha = 1 - age / 420;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3;
  ctx.strokeStyle = feedback.type === 'hit' ? COLORS.success : COLORS.danger;
  ctx.beginPath();
  ctx.arc(feedback.x, feedback.y, feedback.type === 'hit' ? 20 : 14, 0, Math.PI * 2);
  ctx.stroke();

  if (feedback.type === 'miss') {
    ctx.beginPath();
    ctx.moveTo(feedback.x - 8, feedback.y - 8);
    ctx.lineTo(feedback.x + 8, feedback.y + 8);
    ctx.moveTo(feedback.x + 8, feedback.y - 8);
    ctx.lineTo(feedback.x - 8, feedback.y + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBottomBar(ctx, layout, state) {
  drawButton(ctx, layout.restartButton, '重置本关', COLORS.primary);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'middle';
  const tip = state.isComplete ? '全部找到了！' : '点击任意一张图里的不同处';
  ctx.fillText(tip, layout.tipArea.x, layout.tipArea.y + layout.tipArea.height / 2);
}

function drawAudioButton(ctx, rect, audioEnabled) {
  const enabled = audioEnabled !== false;
  drawRoundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8, enabled ? '#fff7ed' : '#f3f4f6');
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  roundedPath(ctx, rect.x, rect.y, rect.width, rect.height, 8);
  ctx.stroke();

  ctx.fillStyle = enabled ? COLORS.primary : COLORS.muted;
  ctx.font = '700 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(enabled ? '♪' : '×', rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.textAlign = 'left';
}

function drawVictory(ctx, layout, state) {
  ctx.fillStyle = 'rgba(39, 49, 63, 0.48)';
  ctx.fillRect(0, 0, layout.width, layout.height);

  const card = {
    x: layout.margin,
    y: layout.height / 2 - 118,
    width: layout.width - layout.margin * 2,
    height: 246
  };
  drawRoundRect(ctx, card.x, card.y, card.width, card.height, 10, COLORS.panel);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 26px sans-serif';
  ctx.fillText('通关成功', layout.width / 2, card.y + 34);

  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px sans-serif';
  ctx.fillText(`你找出了 ${state.totalCount} 处不同`, layout.width / 2, card.y + 82);

  const label = state.hasNextLevel ? '下一关' : '再玩一次';
  drawButton(ctx, layout.victoryButton, label, COLORS.accent);
  ctx.textAlign = 'left';
}

function drawButton(ctx, rect, label, color) {
  drawRoundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8, color);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.textAlign = 'left';
}

function imageToScreen(rect, level, point) {
  return {
    x: rect.x + (point.x / level.width) * rect.width,
    y: rect.y + (point.y / level.height) * rect.height
  };
}

function drawRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

function roundedClip(ctx, rect, radius) {
  roundedPath(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.clip();
}

function roundedPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

module.exports = {
  computeLayout,
  render
};
