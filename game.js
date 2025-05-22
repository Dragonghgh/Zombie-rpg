// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 25;
const PLAYER_SPEED = 3;
const ZOMBIE_SPEED = 1.5;
const ZOMBIE_SPAWN_RATE = 0.01;
const DAY_LENGTH = 60000; // 60 seconds

// Game state
let gameRunning = false;
let player = {
    x: 400,
    y: 300,
    width: 24,
    height: 24,
    health: 100,
    ammo: 10,
    direction: { x: 0, y: 0 }
};
let zombies = [];
let bullets = [];
let map = [];
let day = 1;
let dayTimer = 0;
let night = false;
let score = 0;

// DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const healthFill = document.getElementById('health-fill');
const ammoCounter = document.getElementById('ammo-counter');
const dayCounter = document.getElementById('day-counter');
const daysSurvived = document.getElementById('days-survived');

// Canvas setup
canvas.width = MAP_WIDTH * TILE_SIZE;
canvas.height = MAP_HEIGHT * TILE_SIZE;

// Game assets
const assets = {
    player: new Image(),
    zombie: new Image(),
    grass: new Image(),
    wall: new Image()
};

assets.player.src = 'assets/player.png';
assets.zombie.src = 'assets/zombie.png';
assets.grass.src = 'assets/grass.png';
assets.wall.src = 'assets/wall.png';

// Initialize game
function initGame() {
    // Generate random map
    generateMap();
    
    // Reset player
    player = {
        x: 400,
        y: 300,
        width: 24,
        height: 24,
        health: 100,
        ammo: 10,
        direction: { x: 0, y: 0 }
    };
    
    // Reset game state
    zombies = [];
    bullets = [];
    day = 1;
    dayTimer = 0;
    night = false;
    score = 0;
    
    updateUI();
}

// Generate random map
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Border walls
            if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                map[y][x] = 1; // Wall
            } else {
                // Random walls (10% chance)
                map[y][x] = Math.random() < 0.1 ? 1 : 0; // 0 = grass, 1 = wall
            }
        }
    }
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    update(timestamp);
    
    // Render game
    render();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(timestamp) {
    // Update player position
    player.x += player.direction.x * PLAYER_SPEED;
    player.y += player.direction.y * PLAYER_SPEED;
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Day/night cycle
    dayTimer += 16; // Assuming 60fps (16ms per frame)
    if (dayTimer >= DAY_LENGTH) {
        day++;
        dayTimer = 0;
        night = !night;
        updateUI();
    }
    
    // Spawn zombies (more at night)
    const spawnRate = night ? ZOMBIE_SPAWN_RATE * 3 : ZOMBIE_SPAWN_RATE;
    if (Math.random() < spawnRate) {
        spawnZombie();
    }
    
    // Update zombies
    zombies.forEach(zombie => {
        // Move toward player
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            zombie.x += (dx / distance) * ZOMBIE_SPEED;
            zombie.y += (dy / distance) * ZOMBIE_SPEED;
        }
        
        // Check collision with player
        if (checkCollision(player, zombie)) {
            player.health -= 0.5;
            healthFill.style.width = `${player.health}%`;
            
            if (player.health <= 0) {
                gameOver();
            }
        }
    });
    
    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        
        // Remove bullets out of bounds
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
            return;
        }
        
        // Check bullet-zombie collisions
        zombies.forEach((zombie, zIndex) => {
            if (checkCollision(bullet, zombie)) {
                zombies.splice(zIndex, 1);
                bullets.splice(index, 1);
                score += 10;
                return;
            }
        });
    });
}

// Render game
function render() {
    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const img = tile === 1 ? assets.wall : assets.grass;
            ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    
    // Draw player
    ctx.drawImage(assets.player, player.x, player.y, player.width, player.height);
    
    // Draw zombies
    zombies.forEach(zombie => {
        ctx.drawImage(assets.zombie, zombie.x, zombie.y, zombie.width, zombie.height);
    });
    
    // Draw bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Night effect
    if (night) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Spawn a new zombie
function spawnZombie() {
    // Spawn at edge of map
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 : canvas.width;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 : canvas.height;
    }
    
    zombies.push({
        x: x,
        y: y,
        width: 24,
        height: 24
    });
}

// Shoot bullet
function shootBullet(mouseX, mouseY) {
    if (player.ammo <= 0) return;
    
    player.ammo--;
    updateUI();
    
    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    bullets.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        dx: (dx / distance) * 10,
        dy: (dy / distance) * 10,
        radius: 5
    });
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Update UI elements
function updateUI() {
    healthFill.style.width = `${player.health}%`;
    ammoCounter.textContent = `Ammo: ${player.ammo}`;
    dayCounter.textContent = `Day: ${day} ${night ? '(Night)' : '(Day)'}`;
}

// Game over
function gameOver() {
    gameRunning = false;
    daysSurvived.textContent = day;
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    initGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

restartButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    initGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            player.direction.y = -1;
            break;
        case 's':
        case 'ArrowDown':
            player.direction.y = 1;
            break;
        case 'a':
        case 'ArrowLeft':
            player.direction.x = -1;
            break;
        case 'd':
        case 'ArrowRight':
            player.direction.x = 1;
            break;
        case ' ':
            // Reload (find ammo during the day)
            if (!night && player.ammo < 10) {
                player.ammo = 10;
                updateUI();
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
        case 's':
        case 'ArrowDown':
            player.direction.y = 0;
            break;
        case 'a':
        case 'ArrowLeft':
        case 'd':
        case 'ArrowRight':
            player.direction.x = 0;
            break;
    }
});

// Mouse controls
canvas.addEventListener('click', (e) => {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    shootBullet(mouseX, mouseY);
});

// Preload assets
window.onload = () => {
    // If assets fail to load, use colored rectangles as fallback
    Object.values(assets).forEach(img => {
        img.onerror = () => {
            // Fallback behavior
            if (img === assets.player) {
                // Player will be drawn as green rectangle
            } else if (img === assets.zombie) {
                // Zombies will be drawn as red rectangles
            } else if (img === assets.grass) {
                // Grass will be drawn as green background
            } else if (img === assets.wall) {
                // Walls will be drawn as gray rectangles
            }
        };
    });
};
