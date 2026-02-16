**Blob.io** is a high-performance WebGL game, built with Three.js. It features stunning visuals, dynamic gameplay, and multiple game modes.

## 🎮 Features

### Gameplay
- **Multiple Game Modes**:
  - **FFA (Free For All)**: Classic survival mode. Eat or be eaten.
  - **TDM (Team Deathmatch)**: Red vs Blue team battle.
  - **CTF (Capture The Flag)**: Steal the enemy flag and bring it back to your base.
  - **Survival**: Survive endless waves of increasingly difficult bots.
- **Power-ups**:
  - 🛡️ **Shield**: Temporary invincibility and bounce-back effect.
  - 👻 **Stealth**: Become nearly invisible to enemies.
  - 👁️ **Night Vision**: See in the dark with a tactical green filter.
  - 🧲 **Magnet**: Attract nearby food automatically.
- **Dynamic World**:
  - **Black Holes**: Dangerous gravity wells that can destroy you.
  - **Meteorites**: Fast-moving hazards to dodge.
  - **Mines**: Proximity traps you can deploy.
  - **Turrets**: Defensive structures in CTF mode.

### Visuals & Audio
- **AAA Graphics**: Custom shaders for blobs, grid, and post-processing effects (Bloom, Glitch, Night Vision).
- **Dynamic Background**: Parallax starfield and nebula.
- **Cinematic Intro**: An epic 20-second intro sequence with a hero blob animation.
- **Skins System**: Choose from Neon, Cyber, Matrix, or Magma skins.
- **Audio**: Procedural techno music, dynamic sound effects, and low-pass filter damage effects.

### Technical
- **Optimized**: Uses Object Pooling and Quadtree spatial partitioning for high performance.
- **Modular Architecture**: Clean ES6 module structure.
- **Mobile Ready**: Fully responsive with a virtual joystick for touch devices.

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari).
- A local web server (e.g., VS Code Live Server, Python `http.server`, Node `http-server`) to serve the ES modules.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blob.io.git
   ```
2. Navigate to the project directory:
   ```bash
   cd blob.io
   ```
3. Start a local server (example with Python):
   ```bash
   python -m http.server
   ```
4. Open your browser and go to `http://localhost:8000`.

## 🕹️ Controls
- **Mouse / Joystick**: Move your blob.
- **Space**: Split / Speed Boost (Costs mass).
- **E**: Deploy Mine (Costs mass).
- **Esc**: Pause / Menu.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Credits
- **Lead Developer**: Patrick JAILLET