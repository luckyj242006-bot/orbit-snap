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
