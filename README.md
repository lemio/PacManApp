# PacManApp

A Progressive Web App (PWA) featuring a Pac-Man game with touch swipe controls and evolutionary gameplay mechanics.

## Features

- 🎮 **Classic Pac-Man Gameplay** - Navigate through a maze, eat dots, and avoid ghosts
- 📱 **Mobile-Optimized Swipe Controls** - Short 5px swipes recognized for precise direction control
- 🎵 **Dynamic Background Music** - Music changes based on your level depth (Level 1-3+)
- 🌟 **Evolution System** - Pac-Man evolves and grows stronger with each dot eaten:
  - **Basic** (0 dots) - Yellow, normal size
  - **Advanced** (10 dots) - Gold, 10% larger
  - **Super** (30 dots) - Orange, 20% larger
  - **Mega** (60 dots) - Red-Orange, 30% larger
  - **Ultra** (100 dots) - Red, 40% larger
- 💾 **Progressive Web App** - Install on any device, works offline
- ⌨️ **Keyboard Support** - Arrow keys or WASD for desktop play

## How to Play

### Mobile/Touch Devices
- **Swipe** in any direction to control Pac-Man
- Minimum 5px swipe distance for precise control
- Eat all dots to advance to the next level

### Desktop
- Use **Arrow Keys** or **WASD** to move
- **Click** the Music button to toggle background music

## Installation

### Run Locally
1. Clone the repository
2. Serve the files with any HTTP server:
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser

### Install as PWA
1. Open the app in a mobile browser (Chrome, Safari, etc.)
2. Tap the browser menu
3. Select "Add to Home Screen" or "Install App"
4. Launch from your home screen!

## Game Mechanics

- **Dots**: Worth 10 points each
- **Power Pellets**: Large white dots worth 50 points
- **Evolution**: Automatically triggers when you eat enough dots
- **Levels**: Complete all dots to advance, music changes with each level
- **Score**: Accumulates across all levels

## Technology Stack

- Pure JavaScript (no frameworks)
- HTML5 Canvas for rendering
- Web Audio API for dynamic music
- Service Workers for offline functionality
- Touch Events API for swipe detection
- Progressive Web App standards

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS and macOS)
- Any modern browser with PWA support