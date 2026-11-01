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
