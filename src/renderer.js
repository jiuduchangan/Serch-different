const COLORS = {
  backgroundTop: '#f8fbff',
  backgroundMid: '#fff6e7',
  backgroundBottom: '#e9f7ef',
  ink: '#172033',
  muted: '#687487',
  softText: '#8b7b68',
  panel: '#fffdfa',
  panelAlt: '#f7fbf8',
  primary: '#ff6b3d',
  primaryDark: '#d94e24',
  primarySoft: '#ffe0d2',
  accent: '#18b7a0',
  accentDark: '#087f73',
  accentSoft: '#d6f6ef',
  gold: '#ffd166',
  goldDark: '#d69a00',
  line: '#ead8c6',
  success: '#26b56f',
  danger: '#ef4444',
  shadow: 'rgba(24, 32, 51, 0.18)',
  softShadow: 'rgba(24, 32, 51, 0.08)'
};

function computeLayout(width, height, level) {
  const margin = 14;
  const topHeight = 112;
  const bottomHeight = 92;
  const gap = 12;
  const imageRatio = level.width / level.height;
  const maxPanelWidth = width - margin * 2 - 16;
  const availableHeight = height - topHeight - bottomHeight - gap - 26;
  const imageHeight = Math.min(maxPanelWidth / imageRatio, availableHeight / 2);
  const imageWidth = imageHeight * imageRatio;
  const panelX = (width - imageWidth) / 2;
  const boardX = panelX - 8;
  const boardY = topHeight - 2;
  const boardWidth = imageWidth + 16;
  const boardHeight = imageHeight * 2 + gap + 16;
  let y = boardY + 8;

  const leftPanel = makePanel('left', '原图', panelX, y, imageWidth, imageHeight);
  y += imageHeight + gap;
  const rightPanel = makePanel('right', '找不同', panelX, y, imageWidth, imageHeight);

  return {
    width,
    height,
    margin,
    topHeight,
    board: {
      x: boardX,
      y: boardY,
      width: boardWidth,
      height: boardHeight
    },
    leftPanel,
    rightPanel,
    restartButton: {
      x: margin + 6,
      y: height - 70,
      width: 112,
      height: 46
    },
    tipArea: {
      x: margin + 130,
      y: height - 68,
      width: width - margin * 2 - 142,
      height: 44
    },
    victoryButton: {
      x: width / 2 - 76,
      y: height / 2 + 82,
      width: 152,
      height: 46
    },
    audioButton: {
      x: width - margin - 42,
      y: 28,
      width: 34,
      height: 34
    },
    progressBar: {
      x: margin + 14,
      y: 78,
      width: width - margin * 2 - 28,
      height: 14
    }
  };
}

function makePanel(side, label, x, y, width, imageHeight) {
  return {
    side,
    label,
    labelRect: { x: x + 12, y: y + 10, width: side === 'left' ? 58 : 78, height: 26 },
    imageRect: { x, y, width, height: imageHeight }
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

  drawBoard(ctx, layout);
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
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.backgroundTop);
  gradient.addColorStop(0.42, COLORS.backgroundMid);
  gradient.addColorStop(1, COLORS.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawBackgroundPattern(ctx, width, height);
}

function drawTopBar(ctx, layout, state, audioEnabled) {
  drawRoundRect(ctx, layout.margin, 12, layout.width - layout.margin * 2, 88, 8, 'rgba(255, 255, 255, 0.72)');
  drawRoundRect(ctx, layout.margin + 4, 16, 5, 80, 3, COLORS.primary);

  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 28px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('找不同', layout.margin + 18, 20);

  drawLevelPill(ctx, layout.margin + 18, 56, state.level.name, state.levelIndex + 1);

  const progressText = `${state.foundCount}/${state.totalCount}`;
  ctx.font = '700 24px sans-serif';
  const progressWidth = ctx.measureText(progressText).width;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(progressText, layout.audioButton.x - 16 - progressWidth, 26);
  drawAudioButton(ctx, layout.audioButton, audioEnabled);
  drawProgressDots(ctx, layout.progressBar, state);
}

function drawLoading(ctx, layout) {
  drawRoundRect(ctx, layout.margin, layout.height / 2 - 38, layout.width - layout.margin * 2, 76, 8, COLORS.panel);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('图片加载中...', layout.width / 2, layout.height / 2);
  ctx.textAlign = 'left';
}

function drawPanel(ctx, panel, image) {
  ctx.save();
  roundedClip(ctx, panel.imageRect, 10);
  ctx.drawImage(image, panel.imageRect.x, panel.imageRect.y, panel.imageRect.width, panel.imageRect.height);
  drawImageGloss(ctx, panel.imageRect);
  ctx.restore();

  drawRoundStroke(ctx, panel.imageRect.x, panel.imageRect.y, panel.imageRect.width, panel.imageRect.height, 10, 'rgba(255, 255, 255, 0.76)', 3);
  drawRoundStroke(ctx, panel.imageRect.x, panel.imageRect.y, panel.imageRect.width, panel.imageRect.height, 10, panel.side === 'left' ? 'rgba(24, 183, 160, 0.34)' : 'rgba(255, 107, 61, 0.34)', 1);
  drawCornerBadge(ctx, panel);
}

function drawMarks(ctx, layout, state) {
  const panels = [layout.leftPanel, layout.rightPanel];

  state.marks.forEach((mark) => {
    panels.forEach((panel) => {
      const point = imageToScreen(panel.imageRect, state.level, mark);
      ctx.save();
      const radius = Math.max(12, ((mark.radius || 20) / state.level.width) * panel.imageRect.width);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.strokeStyle = COLORS.success;
      ctx.fillStyle = 'rgba(38, 181, 111, 0.14)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawCheck(ctx, point.x, point.y, Math.max(8, radius * 0.34));
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
  ctx.lineWidth = feedback.type === 'hit' ? 5 : 3;
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
  } else {
    drawBurst(ctx, feedback.x, feedback.y, 26);
  }
  ctx.restore();
}

function drawBottomBar(ctx, layout, state) {
  drawRoundRect(ctx, layout.margin, layout.height - 82, layout.width - layout.margin * 2, 66, 8, 'rgba(255, 255, 255, 0.82)');
  drawButton(ctx, layout.restartButton, '重置本关', COLORS.primary);
  ctx.fillStyle = state.isComplete ? COLORS.success : COLORS.ink;
  ctx.font = '700 14px sans-serif';
  ctx.textBaseline = 'middle';
  const title = state.isComplete ? '全部找到了' : '观察细节';
  ctx.fillText(title, layout.tipArea.x, layout.tipArea.y + 14);
  ctx.fillStyle = COLORS.softText;
  ctx.font = '12px sans-serif';
  ctx.fillText(state.isComplete ? '准备进入下一关' : '点击两张图里变化的位置', layout.tipArea.x, layout.tipArea.y + 33);
}

function drawAudioButton(ctx, rect, audioEnabled) {
  const enabled = audioEnabled !== false;
  drawRoundRect(ctx, rect.x, rect.y + 2, rect.width, rect.height, 10, enabled ? '#f3b391' : '#c8ced6');
  drawRoundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10, enabled ? '#fff4dc' : '#f3f4f6');
  drawRoundStroke(ctx, rect.x, rect.y, rect.width, rect.height, 10, enabled ? '#f1c184' : '#d4d8de', 1);

  ctx.fillStyle = enabled ? COLORS.primary : COLORS.muted;
  ctx.font = '700 16px sans-serif';
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
    y: layout.height / 2 - 122,
    width: layout.width - layout.margin * 2,
    height: 252
  };
  drawRoundRect(ctx, card.x, card.y + 4, card.width, card.height, 8, COLORS.shadow);
  drawRoundRect(ctx, card.x, card.y, card.width, card.height, 8, COLORS.panel);
  drawMedal(ctx, layout.width / 2, card.y + 42);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 25px sans-serif';
  ctx.fillText('通关成功', layout.width / 2, card.y + 78);

  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px sans-serif';
  ctx.fillText(`找出了 ${state.totalCount} 处不同`, layout.width / 2, card.y + 120);

  const label = state.hasNextLevel ? '下一关' : '再玩一次';
  drawButton(ctx, layout.victoryButton, label, COLORS.accent);
  ctx.textAlign = 'left';
}

function drawButton(ctx, rect, label, color) {
  drawRoundRect(ctx, rect.x, rect.y + 3, rect.width, rect.height, 8, color === COLORS.primary ? COLORS.primaryDark : '#158f84');
  drawRoundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8, color);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.textAlign = 'left';
}

function drawBoard(ctx, layout) {
  const board = layout.board;
  drawRoundRect(ctx, board.x, board.y + 8, board.width, board.height, 12, COLORS.shadow);
  drawRoundRect(ctx, board.x, board.y, board.width, board.height, 12, 'rgba(255, 253, 250, 0.92)');
  drawRoundStroke(ctx, board.x, board.y, board.width, board.height, 12, 'rgba(255, 255, 255, 0.78)', 2);

  const dividerY = layout.leftPanel.imageRect.y + layout.leftPanel.imageRect.height + 6;
  ctx.strokeStyle = 'rgba(234, 216, 198, 0.74)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(board.x + 16, dividerY);
  ctx.lineTo(board.x + board.width - 16, dividerY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCornerBadge(ctx, panel) {
  const fill = panel.side === 'left' ? COLORS.accent : COLORS.primary;
  const shadow = panel.side === 'left' ? COLORS.accentDark : COLORS.primaryDark;
  const rect = panel.labelRect;

  drawRoundRect(ctx, rect.x, rect.y + 2, rect.width, rect.height, 8, shadow);
  drawRoundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8, fill);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(panel.label, rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.textAlign = 'left';
}

function drawBackgroundPattern(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(width - 38, 118, 52, 0, Math.PI * 2);
  ctx.arc(22, 430, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  for (let x = -20; x < width; x += 74) {
    drawDiamondPath(ctx, x, 104, 12);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.14;
  ctx.fillStyle = COLORS.accent;
  for (let y = 178; y < height - 130; y += 126) {
    drawDiamondPath(ctx, width - 22, y, 8);
    ctx.fill();
    drawDiamondPath(ctx, 24, y + 46, 6);
    ctx.fill();
  }
  ctx.restore();
}

function drawLevelPill(ctx, x, y, label, levelNumber) {
  const width = Math.max(92, ctx.measureText(label).width + 34);
  drawRoundRect(ctx, x, y, width, 26, 8, COLORS.accentSoft);
  drawRoundRect(ctx, x, y, 24, 26, 8, COLORS.accent);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(levelNumber), x + 9, y + 13);
  ctx.fillStyle = COLORS.accentDark;
  ctx.font = '700 13px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 32, y + 13);
}

function drawProgressDots(ctx, rect, state) {
  const gap = 10;
  const dotSize = Math.min(17, (rect.width - gap * (state.totalCount - 1)) / state.totalCount);
  const totalWidth = dotSize * state.totalCount + gap * (state.totalCount - 1);
  let x = rect.x + (rect.width - totalWidth) / 2;
  const y = rect.y + rect.height / 2;

  for (let i = 0; i < state.totalCount; i += 1) {
    const found = i < state.foundCount;
    ctx.save();
    ctx.translate(x + dotSize / 2, y);
    ctx.rotate(Math.PI / 4);
    drawRoundRect(ctx, -dotSize / 2, -dotSize / 2, dotSize, dotSize, 4, found ? COLORS.gold : '#ffffff');
    ctx.strokeStyle = found ? COLORS.goldDark : COLORS.line;
    ctx.lineWidth = 1.5;
    roundedPath(ctx, -dotSize / 2, -dotSize / 2, dotSize, dotSize, 4);
    ctx.stroke();
    ctx.restore();

    if (found) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + dotSize / 2 - 2, y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    x += dotSize + gap;
  }
}

function drawImageGloss(ctx, rect) {
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height * 0.35);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height * 0.35);
}

function drawCheck(ctx, x, y, size) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - size * 0.28, y + size * 0.72);
  ctx.lineTo(x + size, y - size * 0.82);
  ctx.stroke();
}

function drawBurst(ctx, x, y, radius) {
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (radius - 8), y + Math.sin(angle) * (radius - 8));
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    ctx.stroke();
  }
}

function drawMedal(ctx, x, y) {
  ctx.fillStyle = COLORS.primarySoft;
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.primaryDark;
  ctx.font = '700 19px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', x, y + 1);
}

function drawRoundStroke(ctx, x, y, width, height, radius, strokeStyle, lineWidth) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  roundedPath(ctx, x, y, width, height, radius);
  ctx.stroke();
  ctx.restore();
}

function drawDiamondPath(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
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
