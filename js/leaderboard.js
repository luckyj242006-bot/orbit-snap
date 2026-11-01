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
