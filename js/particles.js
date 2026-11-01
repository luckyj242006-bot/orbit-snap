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
