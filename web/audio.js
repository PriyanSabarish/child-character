export class LipSyncAnalyzer {
  constructor(options = {}) {
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.timeDomainBuffer = null;

    // Dual thresholds for hysteresis
    this.thresholdsUp = options.thresholdsUp ?? [0.02, 0.06, 0.13];
    this.thresholdsDown = options.thresholdsDown ?? [0.015, 0.05, 0.11];
    this.minHoldMs = options.minHoldMs ?? 60;

    this.states = ["closed", "small", "medium", "wide"];
    this.currentState = "closed";
    this.lastStateChangeTime = 0;
    this.isPlaying = false;
  }

  /**
   * Initializes or resumes the AudioContext on user interaction.
   */
  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      this.timeDomainBuffer = new Float32Array(this.analyser.fftSize);
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Computes current Root Mean Square (RMS) volume from time-domain PCM data.
   */
  getRMS() {
    if (!this.analyser || !this.timeDomainBuffer || !this.isPlaying) return 0;

    this.analyser.getFloatTimeDomainData(this.timeDomainBuffer);
    let sumSquares = 0;
    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      sumSquares += this.timeDomainBuffer[i] * this.timeDomainBuffer[i];
    }
    return Math.sqrt(sumSquares / this.timeDomainBuffer.length);
  }

  /**
   * Updates and returns current mouth state based on RMS and hysteresis.
   * @param {number} nowMs - performance.now() timestamp
   */
  updateMouthState(nowMs) {
    if (!this.isPlaying) {
      this.currentState = "closed";
      return this.currentState;
    }

    const rms = this.getRMS();
    const currIdx = this.states.indexOf(this.currentState);
    let targetIdx = currIdx;

    // Hysteresis logic
    if (currIdx === 0) { // closed
      if (rms >= this.thresholdsUp[2]) targetIdx = 3;
      else if (rms >= this.thresholdsUp[1]) targetIdx = 2;
      else if (rms >= this.thresholdsUp[0]) targetIdx = 1;
    } else if (currIdx === 1) { // small
      if (rms >= this.thresholdsUp[2]) targetIdx = 3;
      else if (rms >= this.thresholdsUp[1]) targetIdx = 2;
      else if (rms < this.thresholdsDown[0]) targetIdx = 0;
    } else if (currIdx === 2) { // medium
      if (rms >= this.thresholdsUp[2]) targetIdx = 3;
      else if (rms < this.thresholdsDown[0]) targetIdx = 0;
      else if (rms < this.thresholdsDown[1]) targetIdx = 1;
    } else if (currIdx === 3) { // wide
      if (rms < this.thresholdsDown[0]) targetIdx = 0;
      else if (rms < this.thresholdsDown[1]) targetIdx = 1;
      else if (rms < this.thresholdsDown[2]) targetIdx = 2;
    }

    // Upward opening changes immediately; downward closing requires minimum hold time
    if (targetIdx !== currIdx) {
      const isOpening = targetIdx > currIdx;
      const holdElapsed = nowMs - this.lastStateChangeTime >= this.minHoldMs;

      if (isOpening || holdElapsed) {
        this.currentState = this.states[targetIdx];
        this.lastStateChangeTime = nowMs;
      }
    }

    return this.currentState;
  }

  /**
   * Plays an audio buffer (or URL) and pipes it through the analyser node.
   */
  async playAudio(url) {
    this.initContext();
    if (this.source) {
      try { this.source.stop(); } catch (_) {}
    }

    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf);

    this.source = this.ctx.createBufferSource();
    this.source.buffer = audioBuf;

    this.source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isPlaying = true;
    this.source.onended = () => {
      this.isPlaying = false;
      this.currentState = "closed";
    };

    this.source.start(0);
  }

  /**
   * Generates a procedural speech syllable burst for local testing without audio files.
   */
  playSyntheticPuffSequence() {
    this.initContext();
    const sampleRate = this.ctx.sampleRate;
    const duration = 1.4;
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Formant-like pulse bursts mimicking syllables: "da-ba-doo"
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const syllableEnv = 
        Math.exp(-Math.pow((t - 0.25) / 0.12, 2)) * 0.7 +
        Math.exp(-Math.pow((t - 0.65) / 0.15, 2)) * 0.9 +
        Math.exp(-Math.pow((t - 1.10) / 0.18, 2)) * 1.0;

      // Harmonic tones
      const carrier = Math.sin(2 * Math.PI * 180 * t) * 0.6 + Math.sin(2 * Math.PI * 360 * t) * 0.4;
      data[i] = carrier * syllableEnv;
    }

    if (this.source) {
      try { this.source.stop(); } catch (_) {}
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isPlaying = true;
    this.source.onended = () => {
      this.isPlaying = false;
      this.currentState = "closed";
    };

    this.source.start(0);
  }
}