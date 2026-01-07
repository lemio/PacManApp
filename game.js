// Game constants
const TILE_SIZE = 20;
const GRID_WIDTH = 28;
const GRID_HEIGHT = 31;
const PACMAN_SPEED = 2;
const GHOST_SPEED = 1.5;
const SWIPE_THRESHOLD = 5; // Minimum 5px swipe detection

// Direction vectors
const DIRECTIONS = [
    { x: 1, y: 0 },   // Right
    { x: -1, y: 0 },  // Left
    { x: 0, y: 1 },   // Down
    { x: 0, y: -1 }   // Up
];

// Evolution stages
const EVOLUTION_STAGES = [
    { name: 'Basic', dotsNeeded: 0, color: '#ffff00', size: 1 },
    { name: 'Advanced', dotsNeeded: 10, color: '#ffd700', size: 1.1 },
    { name: 'Super', dotsNeeded: 30, color: '#ff8c00', size: 1.2 },
    { name: 'Mega', dotsNeeded: 60, color: '#ff4500', size: 1.3 },
    { name: 'Ultra', dotsNeeded: 100, color: '#ff0000', size: 1.4 }
];

// Music configuration for different levels (using Web Audio API)
const MUSIC_TRACKS = [
    { level: 1, frequency: 220, waveform: 'sine', name: 'Level 1' },
    { level: 2, frequency: 270, waveform: 'square', name: 'Level 2' },
    { level: 3, frequency: 320, waveform: 'sawtooth', name: 'Level 3' }
];

class PacManGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = GRID_WIDTH * TILE_SIZE;
        this.canvas.height = GRID_HEIGHT * TILE_SIZE;
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.dotsEaten = 0;
        this.evolutionStage = 0;
        this.gameRunning = true;
        
        // Initialize game entities
        this.initializeGrid();
        this.pacman = {
            x: 14,
            y: 23,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            mouthOpen: 0,
            mouthSpeed: 0.2
        };
        
        this.ghosts = this.createGhosts();
        
        // Audio setup
        this.musicEnabled = true;
        this.currentTrack = null;
        this.audioContext = null;
        this.setupAudio();
        
        // Input handling
        this.setupControls();
        
        // Start game loop
        this.lastTime = 0;
        this.gameLoop(0);
        
        // Update UI
        this.updateUI();
    }
    
    setupAudio() {
        // Create audio context for background music
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
        
        // Music toggle button
        const musicToggle = document.getElementById('music-toggle');
        musicToggle.addEventListener('click', () => {
            this.musicEnabled = !this.musicEnabled;
            musicToggle.textContent = this.musicEnabled ? '🔊 Music ON' : '🔇 Music OFF';
            if (this.musicEnabled) {
                this.playLevelMusic();
            } else {
                this.stopMusic();
            }
        });
    }
    
    playLevelMusic() {
        // Stop current music
        this.stopMusic();
        
        if (!this.musicEnabled || MUSIC_TRACKS.length === 0) return;
        
        // Calculate which track to play based on level depth
        const trackIndex = Math.max(0, Math.min(this.level - 1, MUSIC_TRACKS.length - 1));
        const track = MUSIC_TRACKS[trackIndex];
        
        // Create oscillator for simple background music
        if (this.audioContext) {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                // Use track configuration
                oscillator.frequency.value = track.frequency;
                oscillator.type = track.waveform;
                
                gainNode.gain.value = 0.1;
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start();
                this.currentTrack = oscillator;
            } catch (e) {
                console.log('Error playing music:', e);
            }
        }
    }
    
    stopMusic() {
        if (this.currentTrack) {
            try {
                this.currentTrack.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentTrack = null;
        }
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.pacman.nextDirection = { x: 0, y: -1 };
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.pacman.nextDirection = { x: 0, y: 1 };
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.pacman.nextDirection = { x: -1, y: 0 };
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.pacman.nextDirection = { x: 1, y: 0 };
                    e.preventDefault();
                    break;
            }
        });
        
        // Touch/swipe controls with 5px minimum threshold
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.changedTouches.length === 0) return;
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;
            
            // Calculate swipe distance
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Only process swipes >= 5px (SWIPE_THRESHOLD)
            if (distance >= SWIPE_THRESHOLD) {
                // Determine direction based on larger component
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (deltaX > 0) {
                        this.pacman.nextDirection = { x: 1, y: 0 }; // Right
                    } else {
                        this.pacman.nextDirection = { x: -1, y: 0 }; // Left
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0) {
                        this.pacman.nextDirection = { x: 0, y: 1 }; // Down
                    } else {
                        this.pacman.nextDirection = { x: 0, y: -1 }; // Up
                    }
                }
            }
        }, { passive: false });
        
        // Mouse controls for desktop
        let mouseDown = false;
        let mouseStartX = 0;
        let mouseStartY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;
            
            const deltaX = e.clientX - mouseStartX;
            const deltaY = e.clientY - mouseStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance >= SWIPE_THRESHOLD) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.pacman.nextDirection = deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
                } else {
                    this.pacman.nextDirection = deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
                }
            }
        });
    }
    
    initializeGrid() {
        // Create a simple maze layout
        // 0 = empty, 1 = wall, 2 = dot, 3 = power pellet
        this.grid = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                // Create walls around the border
                if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
                    this.grid[y][x] = 1;
                }
                // Create some internal walls
                else if ((x % 7 === 0 && y % 7 === 0) || 
                         (x % 5 === 0 && y % 10 === 0) ||
                         (y % 8 === 0 && x > 5 && x < GRID_WIDTH - 5)) {
                    this.grid[y][x] = 1;
                }
                // Power pellets in corners
                else if ((x === 1 && y === 1) || (x === GRID_WIDTH - 2 && y === 1) ||
                         (x === 1 && y === GRID_HEIGHT - 2) || (x === GRID_WIDTH - 2 && y === GRID_HEIGHT - 2)) {
                    this.grid[y][x] = 3;
                }
                // Regular dots
                else {
                    this.grid[y][x] = 2;
                }
            }
        }
    }
    
    createGhosts() {
        return [
            { x: 12, y: 14, color: '#ff0000', direction: { x: 1, y: 0 } },
            { x: 15, y: 14, color: '#00ffff', direction: { x: -1, y: 0 } },
            { x: 13, y: 15, color: '#ffb8ff', direction: { x: 0, y: 1 } },
            { x: 14, y: 15, color: '#ffb852', direction: { x: 0, y: -1 } }
        ];
    }
    
    updatePacman(deltaTime) {
        // Try to change direction if next direction is set
        if (this.pacman.nextDirection.x !== 0 || this.pacman.nextDirection.y !== 0) {
            const nextX = this.pacman.x + this.pacman.nextDirection.x;
            const nextY = this.pacman.y + this.pacman.nextDirection.y;
            
            if (this.isValidMove(nextX, nextY)) {
                this.pacman.direction = { ...this.pacman.nextDirection };
            }
        }
        
        // Move in current direction
        if (this.pacman.direction.x !== 0 || this.pacman.direction.y !== 0) {
            const newX = this.pacman.x + this.pacman.direction.x * deltaTime * PACMAN_SPEED;
            const newY = this.pacman.y + this.pacman.direction.y * deltaTime * PACMAN_SPEED;
            
            if (this.isValidMove(Math.round(newX), Math.round(newY))) {
                this.pacman.x = newX;
                this.pacman.y = newY;
                
                // Check for dots
                const gridX = Math.round(this.pacman.x);
                const gridY = Math.round(this.pacman.y);
                
                if (this.grid[gridY] && this.grid[gridY][gridX] === 2) {
                    this.grid[gridY][gridX] = 0;
                    this.score += 10;
                    this.dotsEaten++;
                    this.checkEvolution();
                    this.checkLevelComplete();
                } else if (this.grid[gridY] && this.grid[gridY][gridX] === 3) {
                    this.grid[gridY][gridX] = 0;
                    this.score += 50;
                    this.dotsEaten++;
                    this.checkEvolution();
                }
            }
        }
        
        // Animate mouth
        this.pacman.mouthOpen += this.pacman.mouthSpeed;
        if (this.pacman.mouthOpen > 1 || this.pacman.mouthOpen < 0) {
            this.pacman.mouthSpeed *= -1;
        }
        
        // Wrap around edges
        if (this.pacman.x < 0) this.pacman.x = GRID_WIDTH - 1;
        if (this.pacman.x >= GRID_WIDTH) this.pacman.x = 0;
    }
    
    checkEvolution() {
        // Check if Pac-Man should evolve
        for (let i = EVOLUTION_STAGES.length - 1; i >= 0; i--) {
            if (this.dotsEaten >= EVOLUTION_STAGES[i].dotsNeeded) {
                if (this.evolutionStage !== i) {
                    this.evolutionStage = i;
                    this.updateUI();
                    // Visual feedback for evolution
                    this.showEvolutionEffect();
                }
                break;
            }
        }
    }
    
    showEvolutionEffect() {
        // Create a brief flash effect
        const evolutionElement = document.getElementById('evolution');
        evolutionElement.style.animation = 'none';
        setTimeout(() => {
            evolutionElement.style.animation = 'pulse 2s infinite';
        }, 10);
    }
    
    checkLevelComplete() {
        // Count remaining dots
        let dotsRemaining = 0;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x] === 2 || this.grid[y][x] === 3) {
                    dotsRemaining++;
                }
            }
        }
        
        if (dotsRemaining === 0) {
            this.level++;
            this.initializeGrid();
            this.pacman.x = 14;
            this.pacman.y = 23;
            this.pacman.direction = { x: 0, y: 0 };
            this.pacman.nextDirection = { x: 0, y: 0 };
            this.ghosts = this.createGhosts();
            
            // Change music for new level
            this.playLevelMusic();
            this.updateUI();
        }
    }
    
    updateGhosts(deltaTime) {
        this.ghosts.forEach(ghost => {
            // Simple AI: occasionally change direction
            if (Math.random() < 0.02) {
                ghost.direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            }
            
            // Move ghost
            const newX = ghost.x + ghost.direction.x * deltaTime * GHOST_SPEED;
            const newY = ghost.y + ghost.direction.y * deltaTime * GHOST_SPEED;
            
            if (this.isValidMove(Math.round(newX), Math.round(newY))) {
                ghost.x = newX;
                ghost.y = newY;
            } else {
                // Change direction if hit wall
                ghost.direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            }
        });
    }
    
    isValidMove(x, y) {
        const gridX = Math.round(x);
        const gridY = Math.round(y);
        
        if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
            return false;
        }
        
        return this.grid[gridY][gridX] !== 1;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const cell = this.grid[y][x];
                
                if (cell === 1) {
                    // Wall
                    this.ctx.fillStyle = '#0000ff';
                    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (cell === 2) {
                    // Dot
                    this.ctx.fillStyle = '#ffb8ae';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2,
                        2,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                } else if (cell === 3) {
                    // Power pellet
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2,
                        5,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        }
        
        // Draw Pac-Man with evolution
        const evolutionData = EVOLUTION_STAGES[this.evolutionStage];
        const size = TILE_SIZE * 0.4 * evolutionData.size;
        const mouthAngle = this.pacman.mouthOpen * 0.3;
        
        this.ctx.fillStyle = evolutionData.color;
        this.ctx.beginPath();
        
        // Calculate rotation based on direction
        let rotation = 0;
        if (this.pacman.direction.x === 1) rotation = 0;
        else if (this.pacman.direction.x === -1) rotation = Math.PI;
        else if (this.pacman.direction.y === 1) rotation = Math.PI / 2;
        else if (this.pacman.direction.y === -1) rotation = -Math.PI / 2;
        
        const centerX = this.pacman.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = this.pacman.y * TILE_SIZE + TILE_SIZE / 2;
        
        this.ctx.arc(
            centerX,
            centerY,
            size,
            rotation + mouthAngle,
            rotation + Math.PI * 2 - mouthAngle
        );
        this.ctx.lineTo(centerX, centerY);
        this.ctx.fill();
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.ctx.fillStyle = ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(
                ghost.x * TILE_SIZE + TILE_SIZE / 2,
                ghost.y * TILE_SIZE + TILE_SIZE / 2,
                TILE_SIZE * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Ghost eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(
                ghost.x * TILE_SIZE + TILE_SIZE / 2 - 5,
                ghost.y * TILE_SIZE + TILE_SIZE / 2 - 3,
                3,
                3
            );
            this.ctx.fillRect(
                ghost.x * TILE_SIZE + TILE_SIZE / 2 + 2,
                ghost.y * TILE_SIZE + TILE_SIZE / 2 - 3,
                3,
                3
            );
        });
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('evolution').textContent = EVOLUTION_STAGES[this.evolutionStage].name;
    }
    
    gameLoop(timestamp) {
        if (!this.gameRunning) return;
        
        const deltaTime = (timestamp - this.lastTime) / 16.67; // Normalize to 60 FPS
        this.lastTime = timestamp;
        
        if (deltaTime > 0 && deltaTime < 5) { // Prevent huge jumps
            this.updatePacman(deltaTime);
            this.updateGhosts(deltaTime);
        }
        
        this.draw();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// Start game when page loads
window.addEventListener('load', () => {
    new PacManGame();
});
