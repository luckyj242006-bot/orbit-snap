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
