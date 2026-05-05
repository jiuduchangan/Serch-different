const GameState = require('./gameState');
const AudioManager = require('./audio');
const input = require('./input');
const levels = require('./levels');
const platform = require('./platform');
const renderer = require('./renderer');

class Game {
  constructor() {
    this.stage = platform.createStage();
    this.state = new GameState(levels);
    this.audio = new AudioManager(this.stage.platform);
    this.images = { left: null, right: null };
    this.loading = true;
    this.layout = renderer.computeLayout(this.stage.width, this.stage.height, this.state.level);
  }

  start() {
    this.audio.init();
    platform.onTap(this.stage.canvas, (x, y) => this.handleTap(x, y));
    this.loadLevel();
    this.loop();
  }

  loadLevel() {
    const level = this.state.level;
    this.loading = true;

    Promise.all([
      platform.createImage(level.leftImage),
      platform.createImage(level.rightImage)
    ]).then(([left, right]) => {
      this.images = { left, right };
      this.layout = renderer.computeLayout(this.stage.width, this.stage.height, this.state.level);
      this.loading = false;
    }).catch((error) => {
      this.loading = false;
      throw error;
    });
  }

  handleTap(x, y) {
    this.audio.unlock();

    if (this.loading) {
      return;
    }

    if (input.contains(this.layout.audioButton, x, y)) {
      this.audio.toggle();
      return;
    }

    if (this.state.isComplete && input.contains(this.layout.victoryButton, x, y)) {
      this.state.nextLevel();
      this.layout = renderer.computeLayout(this.stage.width, this.stage.height, this.state.level);
      this.loadLevel();
      this.audio.playRestart();
      return;
    }

    if (input.contains(this.layout.restartButton, x, y)) {
      this.state.resetLevel();
      this.audio.playRestart();
      return;
    }

    if (this.state.isComplete) {
      return;
    }

    const point = input.screenToImagePoint(this.layout, this.state.level, x, y);
    if (point) {
      const hit = this.state.findAt(point);
      if (hit) {
        if (this.state.isComplete) {
          this.audio.playComplete();
        } else {
          this.audio.playHit();
        }
      }
    }
  }

  loop() {
    renderer.render(this.stage.ctx, {
      state: this.state,
      images: this.images,
      layout: this.layout,
      loading: this.loading,
      audioEnabled: this.audio.enabled
    });

    platform.nextFrame(() => this.loop());
  }
}

module.exports = Game;
