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
