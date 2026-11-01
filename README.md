# 🚀 ORBIT SNAP: Hyper Drift Arcade

> An original, ridiculously addictive one-touch cosmic kinetic mini-game engineered for maximum engagement, near-miss adrenaline, and viral social sharing.

[![Pure Canvas 60 FPS](https://img.shields.io/badge/Performance-60_FPS_Canvas-00f2fe.svg)](#)
[![Procedural Web Audio](https://img.shields.io/badge/Audio-Procedural_Web_Audio_Synth-ff007f.svg)](#)
[![Mobile First](https://img.shields.io/badge/Platform-Mobile_&_Desktop_Responsive-00ff87.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-ffd200.svg)](#)

---

## 🌟 The Core Hook: Easy in 5 Seconds, Skill to Master

In **ORBIT SNAP**, you pilot a luminous kinetic spark surging through a dark cosmic nebula. Floating gravity anchors drift throughout space. 

- **PRESS & HOLD (Anywhere or Space)**: Cast an electric laser tether to the nearest gravity anchor and swing into high-speed centrifugal orbit!
- **RELEASE**: **SNAP!** Launch forward tangentially with hyper velocity.
- **THE SWEET SPOT**: Each anchor projects a golden forward trajectory cone. Snap inside the sweet spot to trigger a **"PERFECT SNAP!"**, earning combo multipliers, speed surges, and crystal audio chords.
- **⚡ NEAR-MISS ADRENALINE**: Skim within pixels of rotating laser beams or antimatter spike mines without crashing to trigger a dramatic **slow-motion bullet-time flash**, screen shake, sub-bass drop, and **+150 Near-Miss bonus points**!
- **DYNAMIC ANCHORS**:
  - 🔵 **Standard Anchor**: Clean, reliable orbit.
  - 🟣 **Unstable Anchor**: Cracks under stress—must be snapped within 1.35 seconds before it explodes!
  - 🟡 **Hyper Anchor**: Supercharges your slingshot velocity by 135%.
  - 🟢 **Magnet Anchor**: Creates a gravitational pull collecting all nearby Stardust Gems.

---

## 🎮 How to Play & Controls

| Control | Action |
| :--- | :--- |
| **Tap & Hold / Click & Hold / Space / ArrowUp / Enter** | Shoot tether & enter centrifugal orbit |
| **Release Tap / Key Up** | Slingshot forward (Snap) |
| **Tap Screen / Space on Game Over** | **Instant Restart** (Zero latency respawn) |
| **Key 'M'** | Toggle Audio Mute |
| **Key 'R'** | Instant Reset Run |
| **Escape** | Close open modals |

---

## ⚡ Key Features & Addiction Mechanics

### 1. ⏱️ 15–45 Second Adrenaline Loops
Designed specifically around rapid-fire micro-sessions. Rounds are fast, intense, and instantly restartable with a single tap or Spacebar press—keeping players locked in the "Just one more try!" loop.

### 2. 🎵 Dynamic Procedural Synthwave Soundtrack & SFX
- **Zero external audio files**: 100% synthesized in real time via the native HTML5 **Web Audio API**—zero loading lag, zero CORS errors, and offline ready.
- **Dynamic BPM & Filter Scaling**: As your combo climbs from `1x` to `5x+`, the synthesizer automatically accelerates tempo from 124 BPM to 144 BPM, opens low-pass filters, and layers energetic 16th-note arpeggios and punchy kicks!
- **Rich SFX**: Satisfying laser whip snaps, rising centrifugal hums, pentatonic gem chimes, near-miss sub-bass whooshes, and crash explosions.

### 3. 🚀 12 Unlockable Skins with Custom Geometry & Trails
Each skin features distinct procedural vector graphics, glowing particle aura, custom engine trail colors, and unique unlock milestones:
1. **Neon Comet** *(Default starter spark)*
2. **Solar Flare** *(Reach 350 pts)*
3. **Cyber Shuriken** *(Reach 700 pts - rapidly rotating ninja star)*
4. **Golden Phoenix** *(Reach 1,200 pts - royal golden wings)*
5. **Prism Diamond** *(8 Near Misses in one run)*
6. **Hyper Nova** *(Achieve a 5x Combo)*
7. **8-Bit Glitch** *(Play 5 games - retro arcade fighter)*
8. **Dark Matter Void** *(Reach 2,000 pts - event horizon black hole)*
9. **Cosmic Jelly** *(Collect 50 Stardust Gems total)*
10. **Quantum Chronos** *(Complete a Daily Challenge run)*
11. **Cyberpunk Skull** *(Reach 3,500 pts - cyber neon skull)*
12. **Cosmic Singularity** *(Unlock 8 Achievements - shifting rainbow aura)*

### 4. 📅 Daily Challenge Engine
Every day features a unique celestial modifier calculated from the calendar date:
- **Monday**: *Hyper Velocity* (Base speed +35%, 2x score)
- **Tuesday**: *Micro Anchors* (Anchors 35% smaller, 2x combo points)
- **Wednesday**: *Hazard Storm* (High hazard density, 3x Near-Miss bonus!)
- **Thursday**: *Zero-G Drift* (Centrifugal slingshot force +40%)
- **Friday**: *Binary Star Nexus* (Dual orbiting nodes spawn frequently)
- **Saturday**: *Stardust Gold Rush* (3x Gem spawn rate & magnet pull)
- **Sunday**: *Singularity Frenzy* (Black hole gravity wells & 2x combo multiplier)

### 5. 🏆 Simulated Global Leaderboard & Custom Callsign
- Live simulated global competition with realistic ranks, country flags (`🇯🇵`, `🇺🇸`, `🇰🇷`, `🇩🇪`, `🇫🇷`, etc.), and pilot titles.
- Seamlessly calculates and places the player's high score at their exact global rank.
- Players can edit their pilot callsign tag anytime with instant persistence.

### 6. 🎖️ 14 Interactive Achievements & Live Toast Alerts
Unlocks trigger real-time cyberpunk toast notifications and major-chord fanfares during active gameplay:
- *First Flight*, *Centrifugal Force*, *Close Call*, *Adrenaline Junkie*, *Pixel Perfect*, *Rhythm Builder*, *Hyperdrive*, *Godlike Drift*, *Centurion*, *Supernova*, *Cosmic Singularity*, *Stardust Hoarder*, *Temporal Pioneer*, and *Friend Crusher*!

### 7. 📤 Viral Social Mechanics & Challenge-a-Friend
- **Dynamic 1080x1350 Poster Generator**: Renders a social-media-ready story card directly to an off-screen HTML5 canvas with your score, skin avatar, stats, and a personalized gamer title (*"⚡ Spike Caresser"*, *"🔥 Adrenaline Junkie"*, *"🌀 Quantum Rhythm God"*, or *"🦥 Panic Sloth"*).
- **One-Click Native Web Share**: Shares directly to Instagram Stories, WhatsApp, X/Twitter, or TikTok via the mobile Web Share API.
- **Challenge-a-Friend Mode**: Generates challenge links (`#challenge=2450&challenger=Alex`). When a friend clicks the link, they see an in-game banner challenging them to beat your exact score, with a special victory celebration when they surpass it!

---

## 💻 Tech Stack & Performance Architecture

- **Rendering**: Pure HTML5 Canvas 2D with sub-pixel interpolation and automatic `devicePixelRatio` scaling for OLED/Retina crispness.
- **Zero External Assets**: All graphics, fonts, animations, and sound effects are generated 100% in-code.
- **Memory & Garbage Collection**: Object pooling for particles, stars, shockwaves, and floating numbers to prevent GC hiccups and guarantee a locked **60 FPS**.
- **Mobile First**: Touch-action prevention, responsive viewport bounds, and haptic feedback via `navigator.vibrate`.

---

## 🚀 How to Run the Game

### Option 1: Direct Browser Launch (Fastest)
Simply double-click `index.html` in your file explorer, or right-click and open with **Google Chrome**, **Microsoft Edge**, **Safari**, or **Firefox**.

### Option 2: Local HTTP Server
Run the included zero-dependency Node server:
```bash
node server.js
```
Then navigate to:
```
http://localhost:3000
```
