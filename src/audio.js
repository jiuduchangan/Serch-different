const AUDIO_FILES = {
  bgm: 'assets/audio/bgm-cheerful.wav',
  hit: 'assets/audio/hit-correct.wav',
  complete: 'assets/audio/level-complete.wav',
  restart: 'assets/audio/restart-soft.wav'
};

class AudioManager {
  constructor(platform) {
    this.platform = platform;
    this.enabled = true;
    this.bgmStarted = false;
    this.contexts = {};
  }

  init() {
    if (!this.platform || !this.platform.createInnerAudioContext) {
      return;
    }

    this.contexts.bgm = this.createInnerAudio(AUDIO_FILES.bgm, true, 0.22);
    this.contexts.hit = this.createInnerAudio(AUDIO_FILES.hit, false, 0.85);
    this.contexts.complete = this.createInnerAudio(AUDIO_FILES.complete, false, 0.9);
    this.contexts.restart = this.createInnerAudio(AUDIO_FILES.restart, false, 0.55);
  }

  createInnerAudio(src, loop, volume) {
    const audio = this.platform.createInnerAudioContext();
    audio.src = src;
    audio.loop = loop;
    audio.volume = volume;
    return audio;
  }

  unlock() {
    if (this.enabled) {
      this.playBgm();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playBgm();
    } else {
      this.stopBgm();
    }
    return this.enabled;
  }

  playBgm() {
    if (!this.enabled || this.bgmStarted || !this.contexts.bgm) {
      return;
    }

    this.bgmStarted = true;
    this.contexts.bgm.play();
  }

  stopBgm() {
    this.bgmStarted = false;
    if (this.contexts.bgm) {
      this.contexts.bgm.stop();
    }
  }

  playHit() {
    this.playEffect('hit');
  }

  playComplete() {
    this.playEffect('complete');
  }

  playRestart() {
    this.playEffect('restart');
  }

  playEffect(name) {
    if (!this.enabled || !this.contexts[name]) {
      return;
    }

    this.contexts[name].stop();
    this.contexts[name].play();
  }
}

module.exports = AudioManager;
