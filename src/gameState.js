class GameState {
  constructor(levels) {
    this.levels = levels;
    this.levelIndex = 0;
    this.resetLevel();
  }

  get level() {
    return this.levels[this.levelIndex];
  }

  get foundCount() {
    return this.found.size;
  }

  get totalCount() {
    return this.level.diffs.length;
  }

  get isComplete() {
    return this.foundCount >= this.totalCount;
  }

  get hasNextLevel() {
    return this.levelIndex < this.levels.length - 1;
  }

  resetLevel() {
    this.found = new Set();
    this.marks = [];
    this.feedback = null;
  }

  nextLevel() {
    if (this.hasNextLevel) {
      this.levelIndex += 1;
    } else {
      this.levelIndex = 0;
    }
    this.resetLevel();
  }

  findAt(point) {
    for (let i = 0; i < this.level.diffs.length; i += 1) {
      const diff = this.level.diffs[i];
      if (this.found.has(diff.id)) {
        continue;
      }

      const dx = point.x - diff.x;
      const dy = point.y - diff.y;
      if (Math.sqrt(dx * dx + dy * dy) <= diff.radius) {
        this.found.add(diff.id);
        this.marks.push({ id: diff.id, x: diff.x, y: diff.y, radius: diff.radius, time: Date.now() });
        this.feedback = { type: 'hit', x: point.screenX, y: point.screenY, time: Date.now() };
        return diff;
      }
    }

    this.feedback = { type: 'miss', x: point.screenX, y: point.screenY, time: Date.now() };
    return null;
  }
}

module.exports = GameState;
