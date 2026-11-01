/**
 * ORBIT SNAP - Procedural Web Audio Engine
 * Pure procedural audio synthesis - 0 external audio dependencies!
 * Dynamic tempo and filter response to player combo and hyperdrive.
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = localStorage.getItem('orbit_muted') === 'true';
    this.sfxVolume = parseFloat(localStorage.getItem('orbit_sfx_vol') || '0.8');
    this.musicVolume = parseFloat(localStorage.getItem('orbit_music_vol') || '0.6');

    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    // Music scheduler state
    this.isPlayingMusic = false;
    this.bpm = 124;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.timerId = null;
    this.comboLevel = 1;

    // Scale notes in Hz (D minor pentatonic / synthwave vibe)
    this.bassNotes = [73.42, 73.42, 87.31, 73.42, 98.00, 73.42, 110.0, 73.42]; // D2, F2, G2, A2
    this.leadScale = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99]; // D4, F4, G4, A4, C5, D5, F5, G5
    this.chordProgression = [
      [293.66, 349.23, 440.00], // Dm
      [261.63, 329.63, 392.00], // C
      [233.08, 293.66, 349.23], // Bb
      [261.63, 329.63, 392.00]  // C
    ];

    // Haptic support
    this.hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;

      // Start music loop
      this.startMusic();
    } catch (e) {
      console.warn('Web Audio could not initialize:', e);
    }
  }

  resumeContext() {
    if (!this.initialized) {
      this.init();
    } else if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('orbit_muted', muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('orbit_sfx_vol', this.sfxVolume);
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('orbit_music_vol', this.musicVolume);
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  vibrate(pattern = 15) {
    if (this.hasVibration && !this.muted) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignored if disallowed
      }
    }
  }

  // =================== SFX GENERATORS ===================

  playTether() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.09);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
    this.vibrate(10);
  }

  playSnap(perfect = false) {
    this.resumeContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;

    // Laser whip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);

    // If perfect snap, play rewarding crystal shimmer chord
    if (perfect) {
      const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const chordOsc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        chordOsc.type = 'sine';
        chordOsc.frequency.setValueAtTime(freq, t + idx * 0.02);

        chordGain.gain.setValueAtTime(0.18, t + idx * 0.02);
        chordGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        chordOsc.connect(chordGain);
        chordGain.connect(this.sfxGain);

        chordOsc.start(t + idx * 0.02);
        chordOsc.stop(t + 0.35);
      });
      this.vibrate([20, 30, 20]);
    } else {
      this.vibrate(15);
    }
  }

  playNearMiss() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;

    // Deep sub-bass drop + high whoosh
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(40, t + 0.35);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.35);

    // Swept high frequency resonant ping
    const hiOsc = this.ctx.createOscillator();
    const hiGain = this.ctx.createGain();
    hiOsc.type = 'triangle';
    hiOsc.frequency.setValueAtTime(1200, t);
    hiOsc.frequency.exponentialRampToValueAtTime(600, t + 0.25);

    hiGain.gain.setValueAtTime(0.2, t);
    hiGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    hiOsc.connect(hiGain);
    hiGain.connect(this.sfxGain);
    hiOsc.start(t);
    hiOsc.stop(t + 0.25);

    this.vibrate([40, 20, 50]);
  }

  playGem(combo = 1) {
    this.resumeContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66];
    const index = Math.min(combo - 1, baseFreqs.length - 1);
    const freq = baseFreqs[Math.max(0, index)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
    this.vibrate(10);
  }

  playCrash() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;

    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(90, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.6);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.6);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.45);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.45);

    this.vibrate([100, 50, 150]);
  }

  playUiClick() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
    this.vibrate(8);
  }

  playAchievement() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A Major fanfare: A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
    this.vibrate([30, 40, 30, 40, 60]);
  }

  // =================== PROCEDURAL MUSIC SYNTHESIS ===================

  setComboLevel(combo) {
    this.comboLevel = Math.max(1, Math.min(10, combo));
    // Scale BPM slightly with combo for intense excitement!
    this.bpm = 124 + Math.min(24, (this.comboLevel - 1) * 3);
  }

  startMusic() {
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduleMusic();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  scheduleMusic() {
    if (!this.isPlayingMusic || !this.ctx) return;

    // Look ahead 150ms and schedule events
    const lookAhead = 0.15;
    while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
      this.playStep(this.currentStep, this.nextNoteTime);
      const secondsPerBeat = 60.0 / this.bpm;
      const stepDuration = secondsPerBeat / 4; // 16th notes
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
    }

    this.timerId = setTimeout(() => this.scheduleMusic(), 40);
  }

  playStep(step, time) {
    if (this.muted) return;

    // 1. Kick on 0, 4, 8, 12 (Four-on-the-floor synthwave pulse)
    if (step % 4 === 0) {
      this.playKick(time);
    }

    // 2. Snare / Clap on 4 and 12
    if (step === 4 || step === 12) {
      this.playSnare(time);
    }

    // 3. Hi-Hat on offbeats (2, 6, 10, 14) and 16ths when combo > 2
    if (step % 2 === 0 || this.comboLevel >= 3) {
      this.playHiHat(time, step % 4 === 2 ? 0.08 : 0.04);
    }

    // 4. Rolling Bass on 16th notes
    if (step % 2 === 0 || step % 4 === 1) {
      const bassIndex = Math.floor(step / 2) % this.bassNotes.length;
      const freq = this.bassNotes[bassIndex];
      this.playBassNote(freq, time);
    }

    // 5. Arpeggiated synth lead when combo >= 2
    if (this.comboLevel >= 2 && (step % 2 === 1 || this.comboLevel >= 4)) {
      const bar = Math.floor(this.currentStep / 4);
      const chord = this.chordProgression[bar % this.chordProgression.length];
      const leadNote = chord[step % chord.length] * (this.comboLevel >= 5 ? 2 : 1);
      this.playLeadNote(leadNote, time);
    }
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  playSnare(time) {
    // Noise snap
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.12);
  }

  playHiHat(time, vol = 0.05) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  playBassNote(freq, time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Open filter wider when combo is high
    const cutoff = 400 + Math.min(1200, this.comboLevel * 180);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + 0.1);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  playLeadNote(freq, time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }
}

// Global audio singleton
window.audioManager = new AudioManager();
