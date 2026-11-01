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
