# Blob.io - To Do List

## 🚀 Gameplay Features
- [ ] **Multiplayer Support**: Implémenter un backend (Node.js + Socket.io) pour le multijoueur en temps réel.
- [x] **Mobile Controls**: Ajouter un joystick virtuel pour les écrans tactiles.
- [x] **Minimap**: Ajouter un radar/minimap dans un coin pour repérer les gros ennemis ou les trous noirs.
- [ ] **Game Modes**:
    - [x] Team Deathmatch (Rouge vs Bleu).
    - [x] Capture the Flag.
    - [x] Survival (Vagues d'ennemis).
- [ ] **Power-ups**:
    - [x] Bouclier (Invincibilité temporaire).
    - [x] Invisibilité (Furtivité).
    - [x] Aimant (Attire la nourriture).

## 🎨 Visuals & Audio
- [x] **Skins System**: Permettre aux joueurs de choisir des textures ou des motifs pour leur blob.
- [x] **Dynamic Background**: Effets de parallaxe ou nébuleuses en arrière-plan.
- [x] **Damage Effects**: Effets visuels quand on perd de la masse.
- [x] **Music**: Ajouter une musique de fond techno/ambiant.
- [x] **Settings Menu**: Options pour activer/désactiver le Bloom, les particules et le son.

## 🛠 Technical & Optimization
- [x] **Object Pooling**: Optimiser l'apparition des particules et de la nourriture pour réduire la charge mémoire.
- [x] **Spatial Partitioning**: Utiliser un Quadtree pour optimiser la détection de collision.
- [x] **Code Refactoring**: Séparer le fichier `index.html` en modules JS distincts (`Player.js`, `Bot.js`, `World.js`).

## 🐛 Known Issues / Bugs
- [x] La caméra peut parfois traverser les objets si le blob est très gros.
- [x] Les bots peuvent parfois rester coincés près des bordures de la carte.
- [x] L'équilibrage de la vitesse des météorites par rapport à la taille du joueur.