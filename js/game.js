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
