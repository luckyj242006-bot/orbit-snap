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

;
/**
 * ORBIT SNAP - Player Skins & Customization System
 * 12 unique skins with distinctive geometry, glowing aura, custom trails & unlock conditions.
 */

const SKINS = [
  {
    id: 'neon-comet',
    name: 'Neon Comet',
    description: 'The swift classic cyan kinetic pulse.',
    unlocked: true,
    condition: 'Unlocked by default',
    colors: { primary: '#00f2fe', secondary: '#4facfe', glow: '#00f2fe' },
    trailColor: 'rgba(0, 242, 254, 0.6)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Glowing core
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 18;
      ctx.fill();

      // Sharp arrowhead nose
      ctx.beginPath();
      ctx.moveTo(radius * 1.5, 0);
      ctx.lineTo(-radius * 0.9, -radius * 0.9);
      ctx.lineTo(-radius * 0.4, 0);
      ctx.lineTo(-radius * 0.9, radius * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#00f2fe';
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    description: 'Blazing star core radiating solar plasma.',
    unlocked: false,
    unlockType: 'score',
    unlockValue: 350,
    condition: 'Reach 350 points',
    colors: { primary: '#ff416c', secondary: '#ff4b2b', glow: '#ff416c' },
    trailColor: 'rgba(255, 65, 108, 0.7)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + time * 3);

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbdf';
      ctx.shadowColor = '#ff416c';
      ctx.shadowBlur = 22;
      ctx.fill();

      // Solar flare spikes
      for (let i = 0; i < 6; i++) {
        const spikeAngle = (i * Math.PI) / 3;
        const outer = radius * (1.2 + Math.sin(time * 8 + i) * 0.3);
        ctx.beginPath();
        ctx.moveTo(Math.cos(spikeAngle) * outer, Math.sin(spikeAngle) * outer);
        ctx.lineTo(Math.cos(spikeAngle + 0.3) * radius * 0.6, Math.sin(spikeAngle + 0.3) * radius * 0.6);
        ctx.lineTo(Math.cos(spikeAngle - 0.3) * radius * 0.6, Math.sin(spikeAngle - 0.3) * radius * 0.6);
        ctx.fillStyle = '#ff4b2b';
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'cyber-shuriken',
    name: 'Cyber Shuriken',
    description: 'Aerodynamic ninja star forged in cyberspace.',
    unlocked: false,
    unlockType: 'score',
    unlockValue: 700,
    condition: 'Reach 700 points',
    colors: { primary: '#00ff87', secondary: '#60efff', glow: '#00ff87' },
    trailColor: 'rgba(0, 255, 135, 0.6)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 12); // Rapid spin!

      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.lineTo(Math.cos(a) * radius * 1.5, Math.sin(a) * radius * 1.5);
        ctx.lineTo(Math.cos(a + Math.PI / 4) * radius * 0.4, Math.sin(a + Math.PI / 4) * radius * 0.4);
      }
      ctx.closePath();
      ctx.fillStyle = '#00ff87';
      ctx.shadowColor = '#00ff87';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Center ring
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a14';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#60efff';
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'golden-phoenix',
    name: 'Golden Phoenix',
    description: 'Royal wings of solid liquid cyber gold.',
    unlocked: false,
    unlockType: 'score',
    unlockValue: 1200,
    condition: 'Reach 1,200 points',
    colors: { primary: '#ffd200', secondary: '#f7971e', glow: '#ffd200' },
    trailColor: 'rgba(255, 210, 0, 0.7)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Wings
      ctx.beginPath();
      ctx.moveTo(radius * 1.4, 0);
      ctx.lineTo(-radius * 0.6, -radius * 1.4);
      ctx.lineTo(-radius * 0.2, 0);
      ctx.lineTo(-radius * 0.6, radius * 1.4);
      ctx.closePath();
      ctx.fillStyle = '#ffd200';
      ctx.shadowColor = '#f7971e';
      ctx.shadowBlur = 20;
      ctx.fill();

      // Phoenix eye
      ctx.beginPath();
      ctx.arc(radius * 0.5, 0, radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'prism-diamond',
    name: 'Prism Diamond',
    description: 'Refracts pure iridescent light waves.',
    unlocked: false,
    unlockType: 'nearMiss',
    unlockValue: 8,
    condition: 'Perform 8 Near Misses in one run',
    colors: { primary: '#b721ff', secondary: '#21d4fd', glow: '#b721ff' },
    trailColor: 'rgba(183, 33, 255, 0.7)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(radius * 1.5, 0);
      ctx.lineTo(0, -radius * 0.9);
      ctx.lineTo(-radius * 1.1, 0);
      ctx.lineTo(0, radius * 0.9);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
      grad.addColorStop(0, '#21d4fd');
      grad.addColorStop(1, '#b721ff');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#b721ff';
      ctx.shadowBlur = 18;
      ctx.fill();

      // Inner facet lines
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'combo-king',
    name: 'Hyper Nova',
    description: 'Forged under the explosive pressure of a 5x combo.',
    unlocked: false,
    unlockType: 'combo',
    unlockValue: 5,
    condition: 'Achieve a 5x Combo multiplier',
    colors: { primary: '#ff007f', secondary: '#7928ca', glow: '#ff007f' },
    trailColor: 'rgba(255, 0, 127, 0.75)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Multi-layer star
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 24;
      ctx.fill();

      // Rings
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.rotate(time * 4);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'retro-pixel',
    name: '8-Bit Glitch',
    description: 'An arcade hero reconstructed from vintage silicon.',
    unlocked: false,
    unlockType: 'gamesPlayed',
    unlockValue: 5,
    condition: 'Play 5 games',
    colors: { primary: '#39ff14', secondary: '#003300', glow: '#39ff14' },
    trailColor: 'rgba(57, 255, 20, 0.7)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const s = radius * 0.45;
      ctx.fillStyle = '#39ff14';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 12;

      // Pixelated spaceship
      ctx.fillRect(s * 1, -s * 0.5, s, s);
      ctx.fillRect(0, -s * 1.5, s, s * 3);
      ctx.fillRect(-s * 1, -s * 2, s, s * 4);
      ctx.fillRect(-s * 2, -s * 1, s, s * 2);

      // Cockpit
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, -s * 0.5, s, s);

      ctx.restore();
    }
  },
  {
    id: 'dark-matter',
    name: 'Dark Matter Void',
    description: 'An event horizon that bends light and cosmic rays.',
    unlocked: false,
    unlockType: 'score',
    unlockValue: 2000,
    condition: 'Reach 2,000 points',
    colors: { primary: '#9d4edd', secondary: '#000000', glow: '#9d4edd' },
    trailColor: 'rgba(157, 78, 221, 0.7)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);

      // Black hole center
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = '#05020c';
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 25;
      ctx.fill();

      // Accretion disk
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.5, radius * 0.5, angle + time * 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#c77dff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'stardust-collector',
    name: 'Cosmic Jelly',
    description: 'Bioluminescent dweller of deep star nebulas.',
    unlocked: false,
    unlockType: 'gems',
    unlockValue: 50,
    condition: 'Collect 50 Stardust Gems total',
    colors: { primary: '#ff66c4', secondary: '#5ce1e6', glow: '#ff66c4' },
    trailColor: 'rgba(255, 102, 196, 0.7)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Jelly dome
      ctx.beginPath();
      ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-radius * 0.6, radius * 0.6);
      ctx.lineTo(-radius * 0.2, 0);
      ctx.lineTo(-radius * 0.6, -radius * 0.6);
      ctx.closePath();
      ctx.fillStyle = '#ff66c4';
      ctx.shadowColor = '#5ce1e6';
      ctx.shadowBlur = 18;
      ctx.fill();

      // Tentacles wobble
      ctx.strokeStyle = '#5ce1e6';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.5, i * radius * 0.4);
        ctx.quadraticCurveTo(
          -radius * 1.2,
          i * radius * 0.4 + Math.sin(time * 10 + i) * 6,
          -radius * 1.8,
          i * radius * 0.4
        );
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'daily-master',
    name: 'Quantum Chronos',
    description: 'Master of daily temporal anomalies.',
    unlocked: false,
    unlockType: 'daily',
    unlockValue: 1,
    condition: 'Complete a Daily Challenge run',
    colors: { primary: '#00ffff', secondary: '#ff00aa', glow: '#00ffff' },
    trailColor: 'rgba(0, 255, 255, 0.7)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Chrono gear
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 18;
      ctx.fill();

      // Outer chrono ticks
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + time * 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius * 1.1, Math.sin(a) * radius * 1.1);
        ctx.lineTo(Math.cos(a) * radius * 1.5, Math.sin(a) * radius * 1.5);
        ctx.strokeStyle = '#ff00aa';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'cyber-skull',
    name: 'Cyberpunk Skull',
    description: 'The terrifying avatar of arcade perfection.',
    unlocked: false,
    unlockType: 'score',
    unlockValue: 3500,
    condition: 'Reach 3,500 points',
    colors: { primary: '#ff0055', secondary: '#00e5ff', glow: '#ff0055' },
    trailColor: 'rgba(255, 0, 85, 0.8)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Skull cranium
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 22;
      ctx.fill();

      // Glowing cyber eyes
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(radius * 0.35, -radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.arc(radius * 0.35, radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Cyber visor lines
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.8, 0);
      ctx.lineTo(radius * 0.8, 0);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'infinity-prism',
    name: 'Cosmic Singularity',
    description: 'The ultimate form that transcends time and space.',
    unlocked: false,
    unlockType: 'achievements',
    unlockValue: 8,
    condition: 'Unlock 8 Achievements',
    colors: { primary: '#ffffff', secondary: '#ff00ea', glow: '#00ffff' },
    trailColor: 'rgba(255, 255, 255, 0.85)',
    draw: (ctx, x, y, radius, angle, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Rainbow shifting aura
      const hue = (time * 120) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 26;

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Dual counter-rotating rings
      for (let r = 0; r < 2; r++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.6, radius * 0.6, (r === 0 ? 1 : -1) * time * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${(hue + r * 60) % 360}, 100%, 65%)`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.restore();
    }
  }
];

class SkinManager {
  constructor() {
    this.skins = SKINS;
    this.currentSkinId = localStorage.getItem('orbit_active_skin') || 'neon-comet';
    this.loadUnlockedState();
  }

  loadUnlockedState() {
    const unlockedMap = JSON.parse(localStorage.getItem('orbit_unlocked_skins') || '{}');
    this.skins.forEach(skin => {
      if (skin.id === 'neon-comet') {
        skin.unlocked = true;
      } else if (unlockedMap[skin.id]) {
        skin.unlocked = true;
      }
    });
  }

  saveUnlockedState() {
    const unlockedMap = {};
    this.skins.forEach(skin => {
      if (skin.unlocked) unlockedMap[skin.id] = true;
    });
    localStorage.setItem('orbit_unlocked_skins', JSON.stringify(unlockedMap));
  }

  getActiveSkin() {
    return this.skins.find(s => s.id === this.currentSkinId) || this.skins[0];
  }

  selectSkin(id) {
    const skin = this.skins.find(s => s.id === id);
    if (skin && skin.unlocked) {
      this.currentSkinId = id;
      localStorage.setItem('orbit_active_skin', id);
      return true;
    }
    return false;
  }

  checkUnlocks(stats) {
    let newlyUnlocked = [];
    this.skins.forEach(skin => {
      if (skin.unlocked) return;

      let unlock = false;
      switch (skin.unlockType) {
        case 'score':
          if (stats.highScore >= skin.unlockValue) unlock = true;
          break;
        case 'nearMiss':
          if (stats.bestNearMisses >= skin.unlockValue) unlock = true;
          break;
        case 'combo':
          if (stats.bestCombo >= skin.unlockValue) unlock = true;
          break;
        case 'gamesPlayed':
          if (stats.gamesPlayed >= skin.unlockValue) unlock = true;
          break;
        case 'gems':
          if (stats.totalGems >= skin.unlockValue) unlock = true;
          break;
        case 'daily':
          if (stats.dailyCompleted >= skin.unlockValue) unlock = true;
          break;
        case 'achievements':
          if (stats.achievementsCount >= skin.unlockValue) unlock = true;
          break;
      }

      if (unlock) {
        skin.unlocked = true;
        newlyUnlocked.push(skin);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveUnlockedState();
    }
    return newlyUnlocked;
  }
}

window.skinManager = new SkinManager();

;
/**
 * ORBIT SNAP - Achievements System
 * Interactive badges, real-time toast alerts, and persistent trophy shelf.
 */

const ACHIEVEMENTS_DATA = [
  {
    id: 'first_snap',
    title: 'First Flight',
    description: 'Execute your first successful tether snap.',
    icon: '🚀',
    category: 'basics'
  },
  {
    id: 'full_loop',
    title: 'Centrifugal Force',
    description: 'Complete 2 full 360° revolutions around one anchor.',
    icon: '🔄',
    category: 'skill'
  },
  {
    id: 'first_near_miss',
    title: 'Close Call',
    description: 'Skim dangerously close to a spike hazard without dying.',
    icon: '⚡',
    category: 'daredevil'
  },
  {
    id: 'daredevil',
    title: 'Adrenaline Junkie',
    description: 'Pull off 5 Near Misses in a single run.',
    icon: '🔥',
    category: 'daredevil'
  },
  {
    id: 'near_miss_god',
    title: 'Pixel Perfect',
    description: 'Pull off 10 Near Misses in a single run.',
    icon: '👑',
    category: 'daredevil'
  },
  {
    id: 'combo_3',
    title: 'Rhythm Builder',
    description: 'Chain together a 3x Combo multiplier.',
    icon: '🎵',
    category: 'combo'
  },
  {
    id: 'combo_5',
    title: 'Hyperdrive',
    description: 'Hit a 5x Combo and push the music into overdrive.',
    icon: '💥',
    category: 'combo'
  },
  {
    id: 'combo_8',
    title: 'Godlike Drift',
    description: 'Reach an insane 8x Combo multiplier.',
    icon: '🌟',
    category: 'combo'
  },
  {
    id: 'score_500',
    title: 'Centurion',
    description: 'Break 500 points in a single run.',
    icon: '🥉',
    category: 'score'
  },
  {
    id: 'score_1500',
    title: 'Supernova',
    description: 'Break 1,500 points in a single run.',
    icon: '🥈',
    category: 'score'
  },
  {
    id: 'score_3000',
    title: 'Cosmic Singularity',
    description: 'Break 3,000 points in a single run.',
    icon: '🥇',
    category: 'score'
  },
  {
    id: 'gems_20',
    title: 'Stardust Hoarder',
    description: 'Collect 20 Stardust Gems in a single run.',
    icon: '💎',
    category: 'gems'
  },
  {
    id: 'daily_run',
    title: 'Temporal Pioneer',
    description: 'Play and record a score in the Daily Challenge.',
    icon: '📅',
    category: 'daily'
  },
  {
    id: 'beat_friend',
    title: 'Friend Crusher',
    description: 'Beat a friend who sent you a challenge link!',
    icon: '⚔️',
    category: 'social'
  }
];

class AchievementManager {
  constructor() {
    this.achievements = ACHIEVEMENTS_DATA;
    this.unlocked = JSON.parse(localStorage.getItem('orbit_achievements') || '{}');
    this.toastContainer = null;
  }

  setToastContainer(element) {
    this.toastContainer = element;
  }

  isUnlocked(id) {
    return !!this.unlocked[id];
  }

  getUnlockedCount() {
    return Object.keys(this.unlocked).length;
  }

  unlock(id) {
    if (this.unlocked[id]) return false;

    const ach = this.achievements.find(a => a.id === id);
    if (!ach) return false;

    this.unlocked[id] = {
      timestamp: Date.now()
    };
    localStorage.setItem('orbit_achievements', JSON.stringify(this.unlocked));

    // Play fanfare
    if (window.audioManager) {
      window.audioManager.playAchievement();
    }

    // Show toast
    this.showToast(ach);
    return true;
  }

  showToast(ach) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast animate-slide-in';
    toast.innerHTML = `
      <div class="toast-icon">${ach.icon}</div>
      <div class="toast-body">
        <div class="toast-tag">ACHIEVEMENT UNLOCKED!</div>
        <div class="toast-title">${ach.title}</div>
        <div class="toast-desc">${ach.description}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 500);
    }, 3800);
  }

  checkInGame(gameStats) {
    if (gameStats.snaps >= 1) this.unlock('first_snap');
    if (gameStats.maxRotations >= 2) this.unlock('full_loop');
    if (gameStats.nearMisses >= 1) this.unlock('first_near_miss');
    if (gameStats.nearMisses >= 5) this.unlock('daredevil');
    if (gameStats.nearMisses >= 10) this.unlock('near_miss_god');
    if (gameStats.combo >= 3) this.unlock('combo_3');
    if (gameStats.combo >= 5) this.unlock('combo_5');
    if (gameStats.combo >= 8) this.unlock('combo_8');
    if (gameStats.score >= 500) this.unlock('score_500');
    if (gameStats.score >= 1500) this.unlock('score_1500');
    if (gameStats.score >= 3000) this.unlock('score_3000');
    if (gameStats.gemsCollected >= 20) this.unlock('gems_20');
    if (gameStats.isDaily) this.unlock('daily_run');
    if (gameStats.isChallenged && gameStats.score > gameStats.targetChallengeScore) {
      this.unlock('beat_friend');
    }
  }
}

window.achievementManager = new AchievementManager();

;
/**
 * ORBIT SNAP - Global Leaderboard System
 * Realistic simulated global competition with weekly cycles & player integration.
 */

const BASE_GLOBAL_LEADERBOARD = [
  { rank: 1, name: 'VortexPilot', score: 4890, country: '🇯🇵', skin: 'infinity-prism', title: 'Cosmic God' },
  { rank: 2, name: 'NovaDrifter', score: 4420, country: '🇺🇸', skin: 'cyber-skull', title: 'Reflex Demon' },
  { rank: 3, name: 'PixelSamurai', score: 4150, country: '🇰🇷', skin: 'cyber-shuriken', title: 'Near-Miss King' },
  { rank: 4, name: 'AstroZen', score: 3890, country: '🇩🇪', skin: 'prism-diamond', title: 'Hyper Sniper' },
  { rank: 5, name: 'QuantumByte', score: 3620, country: '🇬🇧', skin: 'dark-matter', title: 'Void Dancer' },
  { rank: 6, name: 'SolarChaser', score: 3340, country: '🇫🇷', skin: 'solar-flare', title: 'Speed Titan' },
  { rank: 7, name: 'ChronoSurfer', score: 3080, country: '🇧🇷', skin: 'daily-master', title: 'Orbit Ace' },
  { rank: 8, name: 'GlitchPhantom', score: 2850, country: '🇨🇦', skin: 'retro-pixel', title: 'Arcade Legend' },
  { rank: 9, name: 'StardustMaven', score: 2610, country: '🇦🇺', skin: 'stardust-collector', title: 'Gem Hunter' },
  { rank: 10, name: 'HyperKitten', score: 2420, country: '🇸🇬', skin: 'neon-comet', title: 'Daredevil' },
  { rank: 11, name: 'CipherZero', score: 2210, country: '🇳🇱', skin: 'golden-phoenix', title: 'Drifter' },
  { rank: 12, name: 'NeonPulse99', score: 1980, country: '🇸🇪', skin: 'combo-king', title: 'Cadet' },
  { rank: 13, name: 'EchoNomad', score: 1750, country: '🇮🇳', skin: 'neon-comet', title: 'Rookie' },
  { rank: 14, name: 'ShadowApex', score: 1490, country: '🇪🇸', skin: 'solar-flare', title: 'Rookie' },
  { rank: 15, name: 'ZeroGravita', score: 1200, country: '🇮🇹', skin: 'neon-comet', title: 'Novice' }
];

class LeaderboardManager {
  constructor() {
    this.playerName = localStorage.getItem('orbit_player_name') || this.generateDefaultName();
    this.playerCountry = localStorage.getItem('orbit_player_country') || '🌐';
    this.highScore = parseInt(localStorage.getItem('orbit_high_score') || '0', 10);
  }

  generateDefaultName() {
    const prefixes = ['Cosmic', 'Hyper', 'Neon', 'Astro', 'Quantum', 'Glitch', 'Turbo', 'Shadow'];
    const suffixes = ['Pilot', 'Drifter', 'Rider', 'Sniper', 'Nova', 'Pulse', 'Spark', 'Ace'];
    const num = Math.floor(Math.random() * 900) + 100;
    const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}${num}`;
    localStorage.setItem('orbit_player_name', name);
    return name;
  }

  setPlayerName(name) {
    if (!name || name.trim().length === 0) return;
    this.playerName = name.trim().slice(0, 15);
    localStorage.setItem('orbit_player_name', this.playerName);
  }

  updateHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('orbit_high_score', this.highScore);
      return true;
    }
    return false;
  }

  getLeaderboardData() {
    // Clone base data
    let list = [...BASE_GLOBAL_LEADERBOARD];

    const playerEntry = {
      name: this.playerName,
      score: this.highScore,
      country: this.playerCountry,
      skin: window.skinManager ? window.skinManager.currentSkinId : 'neon-comet',
      title: this.getPlayerTitle(this.highScore),
      isPlayer: true
    };

    // Insert player into the leaderboard
    list.push(playerEntry);
    list.sort((a, b) => b.score - a.score);

    // Re-rank
    return list.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  getPlayerTitle(score) {
    if (score >= 4500) return 'Transcendent God';
    if (score >= 3500) return 'Cosmic Demon';
    if (score >= 2500) return 'Near-Miss Master';
    if (score >= 1500) return 'Hyper Drifter';
    if (score >= 800) return 'Orbit Pilot';
    if (score >= 300) return 'Cadet';
    return 'Tether Trainee';
  }
}

window.leaderboardManager = new LeaderboardManager();

;
/**
 * ORBIT SNAP - Daily Challenge Engine
 * Seeded daily gameplay modifiers, daily leaderboards, and unique cosmic physics conditions.
 */

const DAILY_MODIFIERS = [
  {
    day: 0, // Sunday
    id: 'singularity_frenzy',
    name: 'Singularity Frenzy',
    description: 'Black hole gravity wells suck you in faster. 2x Combo multipliers!',
    badge: '🌀 SINGULARITY SUNDAY',
    speedMult: 1.15,
    nearMissBonus: 2.0,
    comboMultiplierBonus: 2,
    anchorSizeMult: 1.0,
    gemRateMult: 1.5
  },
  {
    day: 1, // Monday
    id: 'hyper_velocity',
    name: 'Hyper Velocity',
    description: 'Base ship speed +35%! High stakes, double score points.',
    badge: '⚡ HYPER VELOCITY',
    speedMult: 1.35,
    scoreMult: 2.0,
    nearMissBonus: 1.5,
    comboMultiplierBonus: 1,
    anchorSizeMult: 1.0,
    gemRateMult: 1.0
  },
  {
    day: 2, // Tuesday
    id: 'tiny_anchors',
    name: 'Micro Anchors',
    description: 'Gravity anchors are 35% smaller! Precision snapping required.',
    badge: '🎯 PRECISION TUESDAY',
    speedMult: 1.05,
    nearMissBonus: 2.0,
    comboMultiplierBonus: 2,
    anchorSizeMult: 0.65,
    gemRateMult: 1.2
  },
  {
    day: 3, // Wednesday
    id: 'hazard_storm',
    name: 'Hazard Storm',
    description: 'Spike minefields everywhere! Near misses award 3x points!',
    badge: '🔥 HAZARD STORM',
    speedMult: 1.1,
    nearMissBonus: 3.0,
    comboMultiplierBonus: 1,
    anchorSizeMult: 1.0,
    hazardDensityMult: 1.4,
    gemRateMult: 1.0
  },
  {
    day: 4, // Thursday
    id: 'low_friction',
    name: 'Zero-G Drift',
    description: 'Slingshots launch with extreme centrifugal surge. Massive distance gain.',
    badge: '🌌 ZERO-G DRIFT',
    speedMult: 1.25,
    launchForceMult: 1.4,
    nearMissBonus: 1.5,
    comboMultiplierBonus: 1,
    anchorSizeMult: 1.0,
    gemRateMult: 1.0
  },
  {
    day: 5, // Friday
    id: 'binary_twins',
    name: 'Binary Star Nexus',
    description: 'Frequent dual orbiting nodes! Rapid rhythm weaving.',
    badge: '♊ BINARY STARS',
    speedMult: 1.15,
    binaryNodeChance: 0.5,
    nearMissBonus: 1.8,
    comboMultiplierBonus: 2,
    anchorSizeMult: 0.9,
    gemRateMult: 1.5
  },
  {
    day: 6, // Saturday
    id: 'gold_rush',
    name: 'Stardust Gold Rush',
    description: 'Cosmic gem clusters everywhere! 3x Gem value and magnet pull.',
    badge: '💎 GOLD RUSH',
    speedMult: 1.05,
    gemRateMult: 3.0,
    gemScoreMult: 3.0,
    magnetRadiusMult: 2.0,
    nearMissBonus: 1.2,
    comboMultiplierBonus: 1,
    anchorSizeMult: 1.0
  }
];

class DailyManager {
  constructor() {
    this.todayStr = this.getTodayDateString();
    this.currentModifier = this.calculateTodayModifier();
    this.dailyHighScore = parseInt(localStorage.getItem(`orbit_daily_${this.todayStr}`) || '0', 10);
  }

  getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  calculateTodayModifier() {
    const d = new Date();
    const dayOfWeek = d.getDay();
    return DAILY_MODIFIERS.find(m => m.day === dayOfWeek) || DAILY_MODIFIERS[1];
  }

  getTodayModifier() {
    return this.currentModifier;
  }

  updateDailyScore(score) {
    if (score > this.dailyHighScore) {
      this.dailyHighScore = score;
      localStorage.setItem(`orbit_daily_${this.todayStr}`, this.dailyHighScore);
      return true;
    }
    return false;
  }
}

window.dailyManager = new DailyManager();

;
/**
 * ORBIT SNAP - Viral Social Sharing & Challenge Engine
 * Dynamic Canvas 1080x1350 score card generator, Web Share API, and URL challenge links.
 */

class ShareManager {
  constructor() {
    this.challengeData = this.parseChallengeParams();
  }

  parseChallengeParams() {
    // Check both search params and hash params for maximum compatibility (works on file:// and http://)
    let params = new URLSearchParams(window.location.search);
    if (!params.has('challenge') && window.location.hash.includes('challenge')) {
      const hashPart = window.location.hash.substring(1);
      params = new URLSearchParams(hashPart);
    }

    if (params.has('challenge')) {
      const score = parseInt(params.get('challenge'), 10) || 0;
      const challenger = params.get('challenger') || 'A Rival Drifter';
      return {
        active: true,
        targetScore: score,
        challengerName: challenger
      };
    }
    return { active: false, targetScore: 0, challengerName: '' };
  }

  generateChallengeUrl(score, playerName) {
    const base = window.location.origin + window.location.pathname;
    const name = encodeURIComponent(playerName || 'A Pilot');
    return `${base}#challenge=${score}&challenger=${name}`;
  }

  getViralTitle(stats) {
    if (stats.nearMisses >= 8) return '⚡ Spike Caresser';
    if (stats.nearMisses >= 4) return '🔥 Adrenaline Junkie';
    if (stats.bestCombo >= 6) return '🌀 Quantum Rhythm God';
    if (stats.score >= 3000) return '👑 Transcendent Pilot';
    if (stats.score >= 1500) return '🚀 Hyper Drift Ace';
    if (stats.score >= 600) return '🎯 Kinetic Sniper';
    if (stats.playTimeSec < 6 && stats.score < 200) return '🦥 Panic Sloth';
    if (stats.snaps === 0) return '☄️ Unguided Missile';
    return '🌟 Orbit Stargazer';
  }

  async shareScore(stats, activeSkin) {
    const challengeUrl = this.generateChallengeUrl(stats.score, stats.playerName);
    const title = this.getViralTitle(stats);
    const text = `I just scored ${stats.score} in ORBIT SNAP as "${title}"! Can you beat my cosmic drift? 🚀 Play here: ${challengeUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ORBIT SNAP: Beat My Score!',
          text: text,
          url: challengeUrl
        });
        return { success: true, method: 'native' };
      } catch (err) {
        if (err.name !== 'AbortError') {
          return this.copyToClipboard(challengeUrl);
        }
        return { success: false, method: 'cancelled' };
      }
    } else {
      return this.copyToClipboard(challengeUrl);
    }
  }

  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return { success: true, method: 'clipboard' };
      }
      // Fallback
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return { success: true, method: 'clipboard' };
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
      return { success: false, method: 'none' };
    }
  }

  generateScoreCardCanvas(stats, activeSkin) {
    const card = document.createElement('canvas');
    card.width = 1080;
    card.height = 1350;
    const ctx = card.getContext('2d');

    // 1. Cosmic Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#060216');
    bgGrad.addColorStop(0.5, '#0d092b');
    bgGrad.addColorStop(1, '#050212');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // 2. Neon Grid Lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1080; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1350);
      ctx.stroke();
    }
    for (let y = 0; y < 1350; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // 3. Glowing Nebula Dust
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * 1080;
      const ry = Math.random() * 1350;
      const rad = 40 + Math.random() * 160;
      const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, rad);
      g.addColorStop(0, i % 2 === 0 ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 0, 127, 0.1)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Header Badge & Logo
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◈ ORBIT SNAP ◈', 540, 140);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '24px "Space Grotesk", sans-serif';
    ctx.fillText('HYPER DRIFT ARCADE', 540, 185);

    // 5. Player Skin Feature Orb
    ctx.save();
    ctx.shadowColor = activeSkin.colors.glow || '#00f2fe';
    ctx.shadowBlur = 40;
    activeSkin.draw(ctx, 540, 360, 58, 0, 1.5);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Space Grotesk", sans-serif';
    ctx.fillText(activeSkin.name.toUpperCase(), 540, 470);

    // 6. Score Display Frame
    const title = this.getViralTitle(stats);
    ctx.fillStyle = '#ffd200';
    ctx.font = 'bold 34px "Space Grotesk", sans-serif';
    ctx.fillText(title, 540, 540);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '28px "Space Grotesk", sans-serif';
    ctx.fillText('FINAL SCORE', 540, 620);

    // Huge glowing score
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 45;
    ctx.font = 'bold 150px "Space Grotesk", sans-serif';
    ctx.fillText(stats.score.toLocaleString(), 540, 770);
    ctx.shadowBlur = 0;

    // 7. Stat Pillars (Combo, Near Misses, Distance)
    const statsY = 920;
    const drawStatPillar = (cx, label, val, color) => {
      // Card background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 130, statsY - 50, 260, 130, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 50px "Space Grotesk", sans-serif';
      ctx.fillText(val, cx, statsY + 20);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px "Space Grotesk", sans-serif';
      ctx.fillText(label, cx, statsY + 60);
    };

    drawStatPillar(230, 'MAX COMBO', `${stats.bestCombo}x`, '#ff007f');
    drawStatPillar(540, 'NEAR MISSES', `${stats.nearMisses}`, '#ffd200');
    drawStatPillar(850, 'DISTANCE', `${Math.floor(stats.distance)}m`, '#00ff87');

    // 8. Call To Action Footer
    ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(140, 1100, 800, 130, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillText('CAN YOU BEAT MY SCORE?', 540, 1160);

    ctx.fillStyle = '#00f2fe';
    ctx.font = '24px monospace';
    ctx.fillText('PLAY: bit.ly/orbit-snap', 540, 1202);

    return card;
  }

  downloadScoreCard(stats, activeSkin) {
    const canvas = this.generateScoreCardCanvas(stats, activeSkin);
    const link = document.createElement('a');
    link.download = `orbit-snap-${stats.score}-points.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

window.shareManager = new ShareManager();

;
/**
 * ORBIT SNAP - Particle & Visual FX Pool
 * High-performance zero-allocation particle system with screen shake, shockwaves & floating text.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 500;
    this.shockwaves = [];
    this.floatingTexts = [];

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.shakeX = 0;
    this.shakeY = 0;

    // Slow-mo bullet-time effect
    this.timeScale = 1.0;
    this.targetTimeScale = 1.0;
  }

  triggerShake(intensity = 10) {
    this.shakeIntensity = Math.min(30, this.shakeIntensity + intensity);
  }

  triggerSlowMo(factor = 0.35, durationMs = 250) {
    this.timeScale = factor;
    this.targetTimeScale = 1.0;
    setTimeout(() => {
      this.timeScale = 1.0;
    }, durationMs);
  }

  emitSpark(x, y, vx, vy, color, size = 3, life = 0.5) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      alpha: 1.0,
      life,
      maxLife: life
    });
  }

  emitBurst(x, y, color, count = 20, speed = 180) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.7 + 0.3) * speed;
      this.emitSpark(
        x,
        y,
        Math.cos(angle) * vel,
        Math.sin(angle) * vel,
        color,
        Math.random() * 3 + 2,
        Math.random() * 0.4 + 0.3
      );
    }
  }

  emitShockwave(x, y, maxRadius = 80, color = '#00f2fe', width = 3) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      width,
      alpha: 1.0,
      growRate: maxRadius / 0.35
    });
  }

  emitFloatingText(x, y, text, color = '#ffffff', fontSize = 20, subtext = '') {
    this.floatingTexts.push({
      x,
      y,
      text,
      subtext,
      color,
      fontSize,
      alpha: 1.0,
      vy: -70,
      life: 0.8,
      scale: 1.4
    });
  }

  update(dt) {
    const effectiveDt = dt * this.timeScale;

    // Update screen shake
    if (this.shakeIntensity > 0.05) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= effectiveDt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * effectiveDt;
      p.y += p.vy * effectiveDt;
      p.alpha = p.life / p.maxLife;
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.growRate * effectiveDt;
      sw.alpha = 1.0 - sw.radius / sw.maxRadius;
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= effectiveDt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * effectiveDt;
      ft.alpha = Math.min(1.0, ft.life / 0.3);
      if (ft.scale > 1.0) {
        ft.scale = Math.max(1.0, ft.scale - effectiveDt * 3.5);
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw shockwaves
    for (const sw of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.width;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.stroke();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.alpha * 0.7 + 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text glow
      ctx.font = `900 ${ft.fontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.fillText(ft.text, 0, 0);

      if (ft.subtext) {
        ctx.font = `bold ${Math.max(12, ft.fontSize * 0.6)}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ft.subtext, 0, ft.fontSize * 0.8);
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();

;
/**
 * ORBIT SNAP - Core Game Engine
 * Precision 60 FPS physics, rotational mechanics, sweet spot snaps, near misses & level generation.
 */

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // State machine
    this.state = 'READY'; // READY, PLAYING, GAMEOVER, PAUSED
    this.isDaily = false;
    this.challengeMode = false;
    this.targetChallengeScore = 0;
    this.challengerName = '';

    // Responsive sizing
    this.width = canvas.width;
    this.height = canvas.height;
    this.pixelRatio = window.devicePixelRatio || 1;

    // Camera
    this.camera = { x: 0, y: 0, targetY: 0 };

    // Player
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: -320,
      radius: 14,
      angle: -Math.PI / 2,
      baseSpeed: 380,
      maxSpeed: 750,
      trail: [],
      // Tether state
      isTethered: false,
      anchor: null,
      tetherLength: 0,
      orbitAngle: 0,
      orbitDirection: 1, // 1 = clockwise, -1 = counter-clockwise
      orbitSpeed: 0,
      revolutionsOnAnchor: 0,
      lastOrbitAngle: 0,
      tetherDuration: 0,
      snapCooldown: 0
    };

    // World Entities
    this.anchors = [];
    this.hazards = [];
    this.gems = [];
    this.stars = [];
    this.worldTopY = 0;

    // Gameplay Stats & Scoring
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('orbit_high_score') || '0', 10);
    this.combo = 1;
    this.bestCombo = 1;
    this.comboTimer = 0;
    this.comboMaxTimer = 3.6;
    this.nearMisses = 0;
    this.snaps = 0;
    this.perfectSnaps = 0;
    this.gemsCollected = 0;
    this.distance = 0;
    this.startY = 0;
    this.maxRotations = 0;
    this.gameStartTime = 0;
    this.playTimeSec = 0;

    // Active skin
    this.activeSkin = window.skinManager ? window.skinManager.getActiveSkin() : null;

    // Daily physics modifier
    this.modifier = null;

    // Time tracking
    this.lastTime = performance.now();
    this.gameTime = 0;

    // Input state
    this.isPressing = false;

    // Init background stars
    this.initStars();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 2,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w * this.pixelRatio;
    this.canvas.height = h * this.pixelRatio;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  start(isDaily = false) {
    this.isDaily = isDaily;
    this.state = 'READY';
    this.modifier = isDaily && window.dailyManager ? window.dailyManager.getTodayModifier() : null;

    // Check challenge
    if (window.shareManager && window.shareManager.challengeData.active) {
      this.challengeMode = true;
      this.targetChallengeScore = window.shareManager.challengeData.targetScore;
      this.challengerName = window.shareManager.challengeData.challengerName;
    } else {
      this.challengeMode = false;
    }

    // Refresh skin
    if (window.skinManager) {
      this.activeSkin = window.skinManager.getActiveSkin();
    }

    // Reset score & metrics
    this.score = 0;
    this.combo = 1;
    this.bestCombo = 1;
    this.comboTimer = 0;
    this.nearMisses = 0;
    this.snaps = 0;
    this.perfectSnaps = 0;
    this.gemsCollected = 0;
    this.maxRotations = 0;
    this.gameStartTime = performance.now();
    this.playTimeSec = 0;

    // Reset audio combo tempo
    if (window.audioManager) {
      window.audioManager.setComboLevel(1);
    }

    // Position player near bottom center
    const startX = this.width / 2;
    const startY = this.height * 0.75;
    this.startY = startY;

    let baseSpeed = 380;
    if (this.modifier && this.modifier.speedMult) {
      baseSpeed *= this.modifier.speedMult;
    }

    this.player = {
      x: startX,
      y: startY,
      vx: 0,
      vy: -baseSpeed * 0.6, // gentle drift before first tap
      radius: 14,
      angle: -Math.PI / 2,
      baseSpeed: baseSpeed,
      maxSpeed: baseSpeed * 1.9,
      trail: [],
      isTethered: false,
      anchor: null,
      tetherLength: 0,
      orbitAngle: 0,
      orbitDirection: 1,
      orbitSpeed: 0,
      revolutionsOnAnchor: 0,
      lastOrbitAngle: 0,
      tetherDuration: 0,
      snapCooldown: 0
    };

    this.camera = {
      x: 0,
      y: startY - this.height * 0.65,
      targetY: startY - this.height * 0.65
    };

    // Clear and build initial level
    this.anchors = [];
    this.hazards = [];
    this.gems = [];
    this.worldTopY = startY;

    // First tutorial anchor guaranteed straight ahead
    this.anchors.push({
      id: 'first_anchor',
      x: startX,
      y: startY - 260,
      radius: 24,
      type: 'standard',
      color: '#00f2fe',
      pulseTime: 0,
      health: 1.0,
      sweetSpotAngle: -Math.PI / 2,
      sweetSpotWidth: Math.PI * 0.5
    });

    // Populate world forward
    this.generateWorldAhead(startY - 2200);
  }

  generateWorldAhead(targetY) {
    let currentY = this.worldTopY;
    const minSpacing = 160;
    const maxSpacing = 240;

    while (currentY > targetY) {
      const step = Math.random() * (maxSpacing - minSpacing) + minSpacing;
      currentY -= step;

      // Determine anchor X position (clamped to screen boundaries)
      const padding = 70;
      const x = Math.random() * (this.width - padding * 2) + padding;

      // Anchor Type
      let type = 'standard';
      let color = '#00f2fe';
      let anchorRadius = 22;

      const roll = Math.random();
      if (roll < 0.2) {
        type = 'unstable'; // cracks if held too long
        color = '#ff007f';
      } else if (roll < 0.35) {
        type = 'hyper'; // extra velocity boost
        color = '#ffd200';
      } else if (roll < 0.48) {
        type = 'magnet'; // pulls gems
        color = '#00ff87';
      }

      if (this.modifier && this.modifier.anchorSizeMult) {
        anchorRadius *= this.modifier.anchorSizeMult;
      }

      const anchor = {
        id: `anchor_${Math.floor(Math.random() * 1000000)}`,
        x,
        y: currentY,
        radius: anchorRadius,
        type,
        color,
        pulseTime: Math.random() * 5,
        health: 1.0,
        sweetSpotAngle: -Math.PI / 2 + (Math.random() * 0.6 - 0.3),
        sweetSpotWidth: Math.PI * 0.55
      };
      this.anchors.push(anchor);

      // Spawn Gems along arcs near anchor
      const gemCount = Math.floor(Math.random() * 3) + 1;
      for (let g = 0; g < gemCount; g++) {
        const gemAngle = Math.random() * Math.PI * 2;
        const gemDist = anchorRadius + 45 + Math.random() * 35;
        this.gems.push({
          x: x + Math.cos(gemAngle) * gemDist,
          y: currentY + Math.sin(gemAngle) * gemDist,
          radius: 8,
          value: 25,
          collected: false
        });
      }

      // Spawn Hazards (after distance > 400 to ease onboarding)
      const distFromStart = this.startY - currentY;
      if (distFromStart > 400 && Math.random() < 0.6) {
        const hazardTypeRoll = Math.random();
        if (hazardTypeRoll < 0.5) {
          // Spike Mine
          const hx = Math.random() > 0.5 ? x + 90 + Math.random() * 50 : x - 90 - Math.random() * 50;
          this.hazards.push({
            type: 'mine',
            x: Math.max(40, Math.min(this.width - 40, hx)),
            y: currentY + (Math.random() * 60 - 30),
            radius: 16,
            angle: 0,
            rotSpeed: (Math.random() * 2 - 1) * 2,
            nearMissChecked: false
          });
        } else {
          // Rotating Laser Beam
          this.hazards.push({
            type: 'laser',
            x: x + (Math.random() * 60 - 30),
            y: currentY + (Math.random() * 80 - 40),
            length: 80 + Math.random() * 40,
            angle: Math.random() * Math.PI,
            rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.0),
            nearMissChecked: false
          });
        }
      }
    }

    this.worldTopY = currentY;
  }

  // =================== INPUT HANDLING ===================

  handlePress() {
    this.isPressing = true;

    if (this.state === 'READY') {
      this.state = 'PLAYING';
      this.player.vy = -this.player.baseSpeed;
    }

    if (this.state === 'PLAYING') {
      this.attachToNearestAnchor();
    }
  }

  handleRelease() {
    this.isPressing = false;

    if (this.state === 'PLAYING' && this.player.isTethered) {
      this.detachFromAnchor();
    }
  }

  attachToNearestAnchor() {
    if (this.player.snapCooldown > 0) return;

    // Find nearest anchor within reach (in front or nearby)
    let bestAnchor = null;
    let minDist = 380; // max tether range

    for (const a of this.anchors) {
      const dx = a.x - this.player.x;
      const dy = a.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      // Prefer anchors ahead of player (dy < 100)
      if (dist < minDist && dy < 120) {
        minDist = dist;
        bestAnchor = a;
      }
    }

    if (bestAnchor) {
      this.player.isTethered = true;
      this.player.anchor = bestAnchor;
      this.player.tetherLength = Math.max(bestAnchor.radius + 20, minDist);

      // Calculate current angle relative to anchor
      const currentAngle = Math.atan2(this.player.y - bestAnchor.y, this.player.x - bestAnchor.x);
      this.player.orbitAngle = currentAngle;
      this.player.lastOrbitAngle = currentAngle;
      this.player.revolutionsOnAnchor = 0;
      this.player.tetherDuration = 0;

      // Determine orbit direction based on velocity cross product
      const toAnchorX = bestAnchor.x - this.player.x;
      const toAnchorY = bestAnchor.y - this.player.y;
      const cross = this.player.vx * toAnchorY - this.player.vy * toAnchorX;
      this.player.orbitDirection = cross >= 0 ? 1 : -1;

      // Tangential orbital velocity
      const currentSpeed = Math.hypot(this.player.vx, this.player.vy);
      this.player.orbitSpeed = Math.max(currentSpeed, this.player.baseSpeed) / this.player.tetherLength;

      // Audio feedback
      if (window.audioManager) {
        window.audioManager.playTether();
      }

      // Emit tether sparks
      if (window.particleSystem) {
        window.particleSystem.emitShockwave(bestAnchor.x, bestAnchor.y, 40, bestAnchor.color, 2);
      }
    }
  }

  detachFromAnchor() {
    if (!this.player.isTethered || !this.player.anchor) return;

    const anchor = this.player.anchor;
    const angle = this.player.orbitAngle;
    const dir = this.player.orbitDirection;

    // Release vector is perpendicular to radial vector (tangential)
    const tangentAngle = angle + (dir === 1 ? Math.PI / 2 : -Math.PI / 2);

    // Calculate launch speed with centrifugal buildup
    let launchSpeed = this.player.orbitSpeed * this.player.tetherLength;

    // Bonus based on tether hold time (sweet spot timing: 0.2s - 0.7s)
    const duration = this.player.tetherDuration;
    let isSweetSpot = false;

    // Check angle alignment with forward direction (within sweet spot cone)
    const forwardDiff = Math.abs(this.normalizeAngle(tangentAngle - (-Math.PI / 2)));
    if (forwardDiff < anchor.sweetSpotWidth / 2 && duration > 0.15) {
      isSweetSpot = true;
    }

    if (anchor.type === 'hyper') {
      launchSpeed *= 1.35;
    }

    if (isSweetSpot) {
      launchSpeed *= 1.25;
      this.combo = Math.min(10, this.combo + 1);
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.comboTimer = this.comboMaxTimer;
      this.perfectSnaps++;

      const snapScore = 100 * this.combo;
      this.addScore(snapScore);

      if (window.audioManager) {
        window.audioManager.playSnap(true);
        window.audioManager.setComboLevel(this.combo);
      }
      if (window.particleSystem) {
        window.particleSystem.triggerSlowMo(0.4, 180);
        window.particleSystem.triggerShake(8);
        window.particleSystem.emitShockwave(this.player.x, this.player.y, 90, '#ffd200', 4);
        window.particleSystem.emitFloatingText(
          this.player.x,
          this.player.y - 30,
          'PERFECT SNAP!',
          '#ffd200',
          22,
          `+${snapScore} (x${this.combo})`
        );
      }
    } else {
      launchSpeed *= 1.05;
      const snapScore = 30 * this.combo;
      this.addScore(snapScore);

      if (window.audioManager) {
        window.audioManager.playSnap(false);
      }
      if (window.particleSystem) {
        window.particleSystem.emitShockwave(this.player.x, this.player.y, 60, '#00f2fe', 2);
      }
    }

    // Set new linear velocity
    this.player.vx = Math.cos(tangentAngle) * Math.min(this.player.maxSpeed, launchSpeed);
    this.player.vy = Math.sin(tangentAngle) * Math.min(this.player.maxSpeed, launchSpeed);

    // Apply snap
    this.snaps++;
    this.player.isTethered = false;
    this.player.anchor = null;
    this.player.snapCooldown = 0.08; // brief cooldown to prevent immediate re-grab
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  addScore(pts) {
    let finalPts = pts;
    if (this.modifier && this.modifier.scoreMult) {
      finalPts = Math.floor(finalPts * this.modifier.scoreMult);
    }
    this.score += finalPts;
  }

  // =================== MAIN UPDATE LOOP ===================

  update(dt) {
    this.gameTime += dt;

    if (this.state === 'READY') {
      // Gentle bobbing before starting
      this.player.y += this.player.vy * dt;
      if (this.player.y < this.startY - 40) {
        this.player.vy = Math.abs(this.player.vy);
      } else if (this.player.y > this.startY + 40) {
        this.player.vy = -Math.abs(this.player.vy);
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    this.playTimeSec += dt;

    // Cooldown
    if (this.player.snapCooldown > 0) {
      this.player.snapCooldown -= dt;
    }

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        if (window.audioManager) {
          window.audioManager.setComboLevel(1);
        }
      }
    }

    // Physics Update: Tethered vs Free flight
    if (this.player.isTethered && this.player.anchor) {
      const anchor = this.player.anchor;
      this.player.tetherDuration += dt;

      // Handle unstable anchor cracking
      if (anchor.type === 'unstable') {
        anchor.health -= dt / 1.35; // lasts 1.35s
        if (anchor.health <= 0) {
          // Anchor collapsed!
          if (window.particleSystem) {
            window.particleSystem.emitBurst(anchor.x, anchor.y, '#ff007f', 30);
            window.particleSystem.triggerShake(12);
          }
          this.detachFromAnchor();
        }
      }

      // Update orbital position
      const deltaAngle = this.player.orbitSpeed * this.player.orbitDirection * dt;
      this.player.orbitAngle += deltaAngle;

      // Track revolutions
      const angleDiff = Math.abs(deltaAngle);
      this.player.revolutionsOnAnchor += angleDiff / (Math.PI * 2);
      this.maxRotations = Math.max(this.maxRotations, Math.floor(this.player.revolutionsOnAnchor));

      // Elastic tether pull slightly inward to anchor
      this.player.tetherLength = Math.max(anchor.radius + 15, this.player.tetherLength - dt * 25);

      this.player.x = anchor.x + Math.cos(this.player.orbitAngle) * this.player.tetherLength;
      this.player.y = anchor.y + Math.sin(this.player.orbitAngle) * this.player.tetherLength;

      // Player facing angle tangent to orbit
      this.player.angle = this.player.orbitAngle + (this.player.orbitDirection === 1 ? Math.PI / 2 : -Math.PI / 2);

      // Emit tether sparks
      if (window.particleSystem && Math.random() < 0.4) {
        window.particleSystem.emitSpark(
          this.player.x,
          this.player.y,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          anchor.color,
          2.5,
          0.3
        );
      }
    } else {
      // Free flight
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;

      // Upward natural drag / guidance
      this.player.angle = Math.atan2(this.player.vy, this.player.vx);

      // Distance score increment
      const distTraveled = Math.max(0, this.startY - this.player.y);
      this.distance = distTraveled / 10;
      this.addScore(Math.floor(dt * 15 * this.combo));

      // Wall bounce with slight dampening
      const wallPadding = this.player.radius;
      if (this.player.x < wallPadding) {
        this.player.x = wallPadding;
        this.player.vx = Math.abs(this.player.vx) * 0.85;
        if (window.particleSystem) window.particleSystem.triggerShake(4);
      } else if (this.player.x > this.width - wallPadding) {
        this.player.x = this.width - wallPadding;
        this.player.vx = -Math.abs(this.player.vx) * 0.85;
        if (window.particleSystem) window.particleSystem.triggerShake(4);
      }
    }

    // Update Player Ribbon Trail
    this.player.trail.unshift({ x: this.player.x, y: this.player.y, alpha: 1.0 });
    if (this.player.trail.length > 20) {
      this.player.trail.pop();
    }
    for (let i = 0; i < this.player.trail.length; i++) {
      this.player.trail[i].alpha = 1 - i / this.player.trail.length;
    }

    // Smooth Camera Tracking (keep player at 65% height)
    const targetCameraY = this.player.y - this.height * 0.65;
    this.camera.y += (targetCameraY - this.camera.y) * Math.min(1.0, dt * 6);

    // Procedural generation trigger
    if (this.worldTopY > this.camera.y - 1000) {
      this.generateWorldAhead(this.camera.y - 2000);
    }

    // Entity Updates (Hazards & Gems)
    this.updateHazards(dt);
    this.updateGems(dt);

    // Check achievement triggers
    if (window.achievementManager) {
      window.achievementManager.checkInGame(this);
    }
  }

  updateHazards(dt) {
    for (const h of this.hazards) {
      if (h.type === 'mine') {
        h.angle += h.rotSpeed * dt;
      } else if (h.type === 'laser') {
        h.angle += h.rotSpeed * dt;
      }

      // Collision & Near-Miss Detection
      this.checkHazardCollision(h);
    }
  }

  checkHazardCollision(h) {
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.radius;

    let distToHazard = 9999;

    if (h.type === 'mine') {
      const dx = px - h.x;
      const dy = py - h.y;
      distToHazard = Math.hypot(dx, dy) - (h.radius + pr);
    } else if (h.type === 'laser') {
      // Line segment collision
      const x1 = h.x - (Math.cos(h.angle) * h.length) / 2;
      const y1 = h.y - (Math.sin(h.angle) * h.length) / 2;
      const x2 = h.x + (Math.cos(h.angle) * h.length) / 2;
      const y2 = h.y + (Math.sin(h.angle) * h.length) / 2;

      distToHazard = this.distanceToSegment(px, py, x1, y1, x2, y2) - pr;
    }

    // Direct collision
    if (distToHazard <= 0) {
      this.gameOver('CRASHED INTO HAZARD');
      return;
    }

    // Near-Miss Detection (close call: 1px to 28px)
    if (distToHazard < 28 && !h.nearMissChecked) {
      h.nearMissChecked = true;
      this.triggerNearMiss(h);
    }
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  triggerNearMiss(hazard) {
    this.nearMisses++;
    this.combo = Math.min(10, this.combo + 1);
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = this.comboMaxTimer;

    let pts = 150 * this.combo;
    if (this.modifier && this.modifier.nearMissBonus) {
      pts = Math.floor(pts * this.modifier.nearMissBonus);
    }
    this.addScore(pts);

    // Audio & slow-mo bullet-time & juicy screen shake
    if (window.audioManager) {
      window.audioManager.playNearMiss();
      window.audioManager.setComboLevel(this.combo);
    }
    if (window.particleSystem) {
      window.particleSystem.triggerSlowMo(0.3, 220);
      window.particleSystem.triggerShake(14);
      window.particleSystem.emitShockwave(this.player.x, this.player.y, 80, '#ff007f', 3);
      window.particleSystem.emitFloatingText(
        this.player.x,
        this.player.y - 35,
        '⚡ NEAR MISS!',
        '#ff007f',
        22,
        `+${pts} (x${this.combo})`
      );
    }
  }

  updateGems(dt) {
    const px = this.player.x;
    const py = this.player.y;
    const magnetRadius = (this.player.anchor && this.player.anchor.type === 'magnet') ? 220 : 75;

    for (const g of this.gems) {
      if (g.collected) continue;

      const dx = px - g.x;
      const dy = py - g.y;
      const dist = Math.hypot(dx, dy);

      // Magnetism
      if (dist < magnetRadius) {
        g.x += (dx / dist) * 320 * dt;
        g.y += (dy / dist) * 320 * dt;
      }

      // Collect
      if (dist < this.player.radius + g.radius) {
        g.collected = true;
        this.gemsCollected++;
        const gemPts = g.value * this.combo;
        this.addScore(gemPts);

        if (window.audioManager) {
          window.audioManager.playGem(this.combo);
        }
        if (window.particleSystem) {
          window.particleSystem.emitBurst(g.x, g.y, '#00ff87', 12, 120);
          window.particleSystem.emitFloatingText(g.x, g.y - 15, `+${gemPts}`, '#00ff87', 16);
        }
      }
    }
  }

  gameOver(reason) {
    if (this.state !== 'PLAYING') return;
    this.state = 'GAMEOVER';

    // Audio explosion
    if (window.audioManager) {
      window.audioManager.playCrash();
    }

    // Dramatic particle explosion of player
    if (window.particleSystem) {
      window.particleSystem.triggerShake(24);
      window.particleSystem.emitBurst(this.player.x, this.player.y, this.activeSkin.colors.primary, 45, 280);
      window.particleSystem.emitBurst(this.player.x, this.player.y, '#ffffff', 20, 160);
      window.particleSystem.emitShockwave(this.player.x, this.player.y, 140, '#ff0055', 5);
    }

    // High score check
    const isNewHigh = window.leaderboardManager
      ? window.leaderboardManager.updateHighScore(this.score)
      : false;

    // Daily score check
    if (this.isDaily && window.dailyManager) {
      window.dailyManager.updateDailyScore(this.score);
    }

    // Check unlocks
    const stats = {
      highScore: window.leaderboardManager ? window.leaderboardManager.highScore : this.score,
      bestNearMisses: this.nearMisses,
      bestCombo: this.bestCombo,
      gamesPlayed: parseInt(localStorage.getItem('orbit_games_count') || '0', 10) + 1,
      totalGems: parseInt(localStorage.getItem('orbit_total_gems') || '0', 10) + this.gemsCollected,
      dailyCompleted: this.isDaily ? 1 : 0,
      achievementsCount: window.achievementManager ? window.achievementManager.getUnlockedCount() : 0
    };

    localStorage.setItem('orbit_games_count', stats.gamesPlayed);
    localStorage.setItem('orbit_total_gems', stats.totalGems);

    let newSkins = [];
    if (window.skinManager) {
      newSkins = window.skinManager.checkUnlocks(stats);
    }

    // Notify UI
    if (window.onGameOverCallback) {
      window.onGameOverCallback({
        score: this.score,
        isNewHigh,
        highScore: stats.highScore,
        bestCombo: this.bestCombo,
        nearMisses: this.nearMisses,
        snaps: this.snaps,
        perfectSnaps: this.perfectSnaps,
        gems: this.gemsCollected,
        distance: this.distance,
        playTimeSec: this.playTimeSec,
        newSkins,
        playerName: window.leaderboardManager ? window.leaderboardManager.playerName : 'Pilot'
      });
    }
  }

  // =================== RENDERING PIPELINE ===================

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Apply screen shake
    const shakeX = window.particleSystem ? window.particleSystem.shakeX : 0;
    const shakeY = window.particleSystem ? window.particleSystem.shakeY : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Draw Starfield (Parallax layers)
    this.drawStars(ctx);

    // 2. Draw World Entities (offset by camera)
    ctx.save();
    ctx.translate(0, -this.camera.y);

    this.drawAnchors(ctx);
    this.drawHazards(ctx);
    this.drawGems(ctx);

    // 3. Draw Tether (if active)
    if (this.player.isTethered && this.player.anchor) {
      this.drawTether(ctx);
    }

    // 4. Draw Player Trail
    this.drawPlayerTrail(ctx);

    // 5. Draw Player Character (Skin)
    if (this.state !== 'GAMEOVER') {
      this.drawPlayer(ctx);
    }

    // 6. Draw Particles, Shockwaves & Floating Numbers
    if (window.particleSystem) {
      window.particleSystem.draw(ctx, 0, 0);
    }

    ctx.restore(); // camera restore

    // 7. On-screen HUD elements (combo bar, on-boarding prompt)
    this.drawHUD(ctx);

    ctx.restore(); // shake restore
  }

  drawStars(ctx) {
    ctx.fillStyle = '#ffffff';
    for (const s of this.stars) {
      const screenY = (s.y - this.camera.y * s.speed) % this.height;
      const actualY = screenY < 0 ? screenY + this.height : screenY;

      ctx.globalAlpha = s.alpha * (0.6 + Math.sin(this.gameTime * 2 + s.x) * 0.4);
      ctx.beginPath();
      ctx.arc(s.x, actualY, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  drawAnchors(ctx) {
    for (const a of this.anchors) {
      // Cull offscreen
      if (a.y > this.camera.y + this.height + 100 || a.y < this.camera.y - 100) continue;

      ctx.save();
      ctx.translate(a.x, a.y);

      // Sweet Spot Sector Arc
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        a.radius + 18,
        a.sweetSpotAngle - a.sweetSpotWidth / 2,
        a.sweetSpotAngle + a.sweetSpotWidth / 2
      );
      ctx.strokeStyle = 'rgba(255, 210, 0, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Outer pulsing ring
      const pulse = Math.sin(this.gameTime * 4 + a.pulseTime) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Core anchor body
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#09081a';
      ctx.fill();

      // Inner glowing nucleus
      ctx.beginPath();
      ctx.arc(0, 0, a.radius * 0.45 * (a.health || 1.0), 0, Math.PI * 2);
      ctx.fillStyle = a.color;
      ctx.fill();

      ctx.restore();
    }
  }

  drawHazards(ctx) {
    for (const h of this.hazards) {
      if (h.y > this.camera.y + this.height + 100 || h.y < this.camera.y - 100) continue;

      ctx.save();
      ctx.translate(h.x, h.y);

      if (h.type === 'mine') {
        ctx.rotate(h.angle);
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 16;

        // Spike star
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? h.radius * 1.3 : h.radius * 0.65;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();

        // Dark center
        ctx.beginPath();
        ctx.arc(0, 0, h.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else if (h.type === 'laser') {
        ctx.rotate(h.angle);

        // Danger laser beam
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.moveTo(-h.length / 2, 0);
        ctx.lineTo(h.length / 2, 0);
        ctx.stroke();

        // White hot beam center
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-h.length / 2, 0);
        ctx.lineTo(h.length / 2, 0);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawGems(ctx) {
    for (const g of this.gems) {
      if (g.collected) continue;
      if (g.y > this.camera.y + this.height + 100 || g.y < this.camera.y - 100) continue;

      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(this.gameTime * 3);

      ctx.fillStyle = '#00ff87';
      ctx.shadowColor = '#00ff87';
      ctx.shadowBlur = 14;

      // 4-point diamond
      ctx.beginPath();
      ctx.moveTo(0, -g.radius);
      ctx.lineTo(g.radius * 0.75, 0);
      ctx.lineTo(0, g.radius);
      ctx.lineTo(-g.radius * 0.75, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  drawTether(ctx) {
    const a = this.player.anchor;
    ctx.save();

    // Laser beam with electric jitter
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);

    // Subtle wave
    const midX = (a.x + this.player.x) / 2 + (Math.random() - 0.5) * 6;
    const midY = (a.y + this.player.y) / 2 + (Math.random() - 0.5) * 6;
    ctx.quadraticCurveTo(midX, midY, this.player.x, this.player.y);

    ctx.strokeStyle = a.color;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = a.color;
    ctx.shadowBlur = 18;
    ctx.stroke();

    // White core laser
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  drawPlayerTrail(ctx) {
    if (this.player.trail.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.player.trail[0].x, this.player.trail[0].y);

    for (let i = 1; i < this.player.trail.length; i++) {
      ctx.lineTo(this.player.trail[i].x, this.player.trail[i].y);
    }

    ctx.strokeStyle = this.activeSkin.trailColor || 'rgba(0, 242, 254, 0.6)';
    ctx.lineWidth = this.player.radius * 0.85;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer(ctx) {
    if (!this.activeSkin) return;
    this.activeSkin.draw(
      ctx,
      this.player.x,
      this.player.y,
      this.player.radius,
      this.player.angle,
      this.gameTime
    );
  }

  drawHUD(ctx) {
    // 1. Onboarding Prompt (only in READY state)
    if (this.state === 'READY') {
      ctx.save();
      ctx.textAlign = 'center';
      const promptY = this.height * 0.88;

      const alpha = 0.7 + Math.sin(this.gameTime * 5) * 0.3;
      ctx.globalAlpha = alpha;

      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 15;
      ctx.fillText('TAP & HOLD TO TETHER • RELEASE TO SNAP', this.width / 2, promptY);

      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Aim for the Sweet Spot & dodge the red spikes!', this.width / 2, promptY + 24);
      ctx.restore();
    }

    // 2. Combo Bar (when combo > 1)
    if (this.combo > 1 && this.state === 'PLAYING') {
      const barWidth = 140;
      const barHeight = 6;
      const barX = (this.width - barWidth) / 2;
      const barY = 95;

      const progress = Math.max(0, this.comboTimer / this.comboMaxTimer);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const comboColors = ['#00f2fe', '#00ff87', '#ffd200', '#ff007f', '#b721ff'];
      const color = comboColors[Math.min(this.combo - 1, comboColors.length - 1)];

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      ctx.shadowBlur = 0;
    }
  }
}

window.GameEngine = GameEngine;

;
/**
 * ORBIT SNAP - Main App Orchestrator & UI Controller
 * Touch/pointer bindings, dynamic HUD updates, modals, skins, and viral mechanics.
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const engine = new window.GameEngine(canvas);

  // HUD Elements
  const liveScoreEl = document.getElementById('liveScore');
  const liveComboEl = document.getElementById('liveCombo');
  const bestScoreEl = document.getElementById('bestScore');
  const challengeBannerEl = document.getElementById('challengeBanner');
  const challengeTextEl = document.getElementById('challengeText');
  const dailyBadgeEl = document.getElementById('dailyBadge');

  // Modals
  const gameOverModal = document.getElementById('gameOverModal');
  const skinsModal = document.getElementById('skinsModal');
  const leaderboardModal = document.getElementById('leaderboardModal');
  const achievementsModal = document.getElementById('achievementsModal');
  const shareCardModal = document.getElementById('shareCardModal');

  // Game Over Elements
  const finalScoreEl = document.getElementById('finalScore');
  const gameOverTitleEl = document.getElementById('gameOverTitle');
  const statComboEl = document.getElementById('statCombo');
  const statNearMissEl = document.getElementById('statNearMiss');
  const statDistanceEl = document.getElementById('statDistance');
  const statSnapsEl = document.getElementById('statSnaps');
  const newHighScoreBadge = document.getElementById('newHighScoreBadge');
  const newSkinAlertEl = document.getElementById('newSkinAlert');

  // Buttons
  const btnRestart = document.getElementById('btnRestart');
  const btnShareGameOver = document.getElementById('btnShareGameOver');
  const btnChallengeFriend = document.getElementById('btnChallengeFriend');
  const btnDownloadCard = document.getElementById('btnDownloadCard');
  const btnMute = document.getElementById('btnMute');
  const btnOpenSkins = document.getElementById('btnOpenSkins');
  const btnOpenLeaderboard = document.getElementById('btnOpenLeaderboard');
  const btnOpenAchievements = document.getElementById('btnOpenAchievements');
  const btnDailyMode = document.getElementById('btnDailyMode');

  // Register Toast container
  const toastContainer = document.getElementById('toastContainer');
  if (window.achievementManager) {
    window.achievementManager.setToastContainer(toastContainer);
  }

  // Handle Canvas Resizing
  function resizeGame() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    engine.resize(width, height);
  }
  window.addEventListener('resize', resizeGame);
  resizeGame();

  // Setup Challenger Banner if challenge URL present
  if (window.shareManager && window.shareManager.challengeData.active) {
    const cd = window.shareManager.challengeData;
    challengeBannerEl.classList.remove('hidden');
    challengeTextEl.innerHTML = `⚔️ <strong>${cd.challengerName}</strong> challenged you to beat <strong>${cd.targetScore.toLocaleString()} pts</strong>!`;
  }

  // Setup Daily Challenge Badge if daily mode
  function updateDailyUI() {
    if (window.dailyManager) {
      const mod = window.dailyManager.getTodayModifier();
      dailyBadgeEl.textContent = mod.badge;
      dailyBadgeEl.title = mod.description;
    }
  }
  updateDailyUI();

  // Audio Mute Button State
  function updateMuteButton() {
    if (window.audioManager) {
      btnMute.innerHTML = window.audioManager.muted ? '🔇' : '🔊';
      btnMute.setAttribute('aria-label', window.audioManager.muted ? 'Unmute' : 'Mute');
    }
  }
  updateMuteButton();

  btnMute.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) {
      window.audioManager.setMuted(!window.audioManager.muted);
      updateMuteButton();
    }
  });

  // =================== INPUT CONTROLS ===================

  let activeTouchId = null;

  function onPointerDown(e) {
    // Ignore clicks on UI buttons/modals
    if (e.target.closest('button, .modal, .interactive-ui')) return;

    // Initialize AudioContext on first user gesture
    if (window.audioManager && !window.audioManager.initialized) {
      window.audioManager.init();
    }

    // Instant restart from Game Over by tapping anywhere
    if (engine.state === 'GAMEOVER') {
      restartGame();
      return;
    }

    engine.handlePress();
  }

  function onPointerUp(e) {
    if (e.target.closest('button, .modal, .interactive-ui')) return;
    engine.handleRelease();
  }

  // Pointer & Touch Events
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // Keyboard Controls (Space / Enter / ArrowUp / R)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault();

      if (window.audioManager && !window.audioManager.initialized) {
        window.audioManager.init();
      }

      if (engine.state === 'GAMEOVER') {
        restartGame();
        return;
      }

      engine.handlePress();
    } else if (e.code === 'KeyR') {
      restartGame();
    } else if (e.code === 'KeyM') {
      if (window.audioManager) {
        window.audioManager.setMuted(!window.audioManager.muted);
        updateMuteButton();
      }
    } else if (e.code === 'Escape') {
      closeAllModals();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault();
      engine.handleRelease();
    }
  });

  // =================== GAME OVER HOOK ===================

  let lastStats = null;

  window.onGameOverCallback = (stats) => {
    lastStats = stats;

    finalScoreEl.textContent = stats.score.toLocaleString();
    gameOverTitleEl.textContent = window.shareManager
      ? window.shareManager.getViralTitle(stats)
      : 'Cosmic Drift';

    statComboEl.textContent = `${stats.bestCombo}x`;
    statNearMissEl.textContent = stats.nearMisses;
    statDistanceEl.textContent = `${Math.floor(stats.distance)}m`;
    statSnapsEl.textContent = stats.snaps;

    if (stats.isNewHigh) {
      newHighScoreBadge.classList.remove('hidden');
    } else {
      newHighScoreBadge.classList.add('hidden');
    }

    // New Skin Alert
    if (stats.newSkins && stats.newSkins.length > 0) {
      newSkinAlertEl.classList.remove('hidden');
      newSkinAlertEl.textContent = `🎉 Unlocked ${stats.newSkins[0].name}!`;
    } else {
      newSkinAlertEl.classList.add('hidden');
    }

    // Update High Score Display
    bestScoreEl.textContent = `BEST: ${stats.highScore.toLocaleString()}`;

    // Show Game Over Modal
    setTimeout(() => {
      gameOverModal.classList.remove('hidden');
    }, 400);
  };

  // =================== RESTART FUNCTIONALITY ===================

  function restartGame(isDaily = false) {
    closeAllModals();
    engine.start(isDaily);
  }

  btnRestart.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();
    restartGame(engine.isDaily);
  });

  // Daily Mode Toggle
  btnDailyMode.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();
    const isNowDaily = !engine.isDaily;
    btnDailyMode.classList.toggle('active', isNowDaily);
    restartGame(isNowDaily);
  });

  // =================== MODAL CONTROLLERS ===================

  function closeAllModals() {
    [gameOverModal, skinsModal, leaderboardModal, achievementsModal, shareCardModal].forEach(
      (m) => m.classList.add('hidden')
    );
  }

  document.querySelectorAll('.close-modal-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.audioManager) window.audioManager.playUiClick();
      closeAllModals();
    });
  });

  // 1. SKINS MODAL
  btnOpenSkins.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();
    renderSkinsList();
    skinsModal.classList.remove('hidden');
  });

  function renderSkinsList() {
    const listEl = document.getElementById('skinsList');
    listEl.innerHTML = '';

    window.skinManager.skins.forEach((skin) => {
      const card = document.createElement('div');
      card.className = `skin-card ${skin.id === window.skinManager.currentSkinId ? 'selected' : ''} ${!skin.unlocked ? 'locked' : ''}`;

      // Canvas preview
      const skinCanvas = document.createElement('canvas');
      skinCanvas.width = 90;
      skinCanvas.height = 90;
      const sCtx = skinCanvas.getContext('2d');
      skin.draw(sCtx, 45, 45, 20, 0, 1.2);

      card.appendChild(skinCanvas);

      const info = document.createElement('div');
      info.className = 'skin-info';
      info.innerHTML = `
        <div class="skin-name">${skin.name}</div>
        <div class="skin-desc">${skin.unlocked ? skin.description : '🔒 ' + skin.condition}</div>
      `;
      card.appendChild(info);

      if (skin.unlocked) {
        card.addEventListener('click', () => {
          window.skinManager.selectSkin(skin.id);
          engine.activeSkin = skin;
          if (window.audioManager) window.audioManager.playUiClick();
          renderSkinsList();
        });
      }

      listEl.appendChild(card);
    });
  }

  // 2. LEADERBOARD MODAL
  btnOpenLeaderboard.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();
    renderLeaderboard();
    leaderboardModal.classList.remove('hidden');
  });

  function renderLeaderboard() {
    const listEl = document.getElementById('leaderboardList');
    listEl.innerHTML = '';

    const data = window.leaderboardManager.getLeaderboardData();
    data.forEach((entry) => {
      const row = document.createElement('div');
      row.className = `leaderboard-row ${entry.isPlayer ? 'is-player' : ''}`;
      row.innerHTML = `
        <div class="lb-rank">#${entry.rank}</div>
        <div class="lb-pilot">
          <span class="lb-flag">${entry.country}</span>
          <span class="lb-name">${entry.name} ${entry.isPlayer ? '(You)' : ''}</span>
          <span class="lb-title">${entry.title}</span>
        </div>
        <div class="lb-score">${entry.score.toLocaleString()}</div>
      `;
      listEl.appendChild(row);
    });

    // Player tag input
    const nameInput = document.getElementById('playerTagInput');
    nameInput.value = window.leaderboardManager.playerName;
    nameInput.onchange = () => {
      window.leaderboardManager.setPlayerName(nameInput.value);
      renderLeaderboard();
    };
  }

  // 3. ACHIEVEMENTS MODAL
  btnOpenAchievements.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();
    renderAchievements();
    achievementsModal.classList.remove('hidden');
  });

  function renderAchievements() {
    const listEl = document.getElementById('achievementsList');
    listEl.innerHTML = '';

    window.achievementManager.achievements.forEach((ach) => {
      const unlocked = window.achievementManager.isUnlocked(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-icon">${unlocked ? ach.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.description}</div>
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  // 4. SOCIAL SHARING & SCORE CARD GENERATOR
  btnShareGameOver.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();

    if (lastStats) {
      const res = await window.shareManager.shareScore(lastStats, engine.activeSkin);
      if (res.method === 'clipboard' && res.success) {
        showCopyNotification('Challenge link copied to clipboard!');
      }
    }
  });

  btnChallengeFriend.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();

    if (lastStats) {
      const url = window.shareManager.generateChallengeUrl(lastStats.score, lastStats.playerName);
      window.shareManager.copyToClipboard(url).then(() => {
        showCopyNotification('Challenge link copied! Send it to your friend! ⚔️');
      });
    }
  });

  btnDownloadCard.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioManager) window.audioManager.playUiClick();
    if (lastStats) {
      window.shareManager.downloadScoreCard(lastStats, engine.activeSkin);
    }
  });

  function showCopyNotification(msg) {
    const note = document.createElement('div');
    note.className = 'copy-toast animate-slide-in';
    note.textContent = msg;
    document.body.appendChild(note);
    setTimeout(() => {
      note.classList.add('animate-fade-out');
      setTimeout(() => note.remove(), 400);
    }, 2800);
  }

  // =================== MAIN ANIMATION LOOP ===================

  let lastFrameTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    // Update & Render
    if (window.particleSystem) {
      window.particleSystem.update(dt);
    }
    engine.update(dt);
    engine.draw();

    // Update HUD
    liveScoreEl.textContent = engine.score.toLocaleString();
    if (engine.combo > 1) {
      liveComboEl.textContent = `${engine.combo}x`;
      liveComboEl.classList.remove('hidden');
    } else {
      liveComboEl.classList.add('hidden');
    }

    requestAnimationFrame(gameLoop);
  }

  // Initial Boot
  bestScoreEl.textContent = `BEST: ${engine.highScore.toLocaleString()}`;
  engine.start(false);
  requestAnimationFrame(gameLoop);
});
