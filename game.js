// =============================================
// Game Constants and Configuration
// =============================================
const CONFIG = {
    TILE_SIZE: 32,
    MAP_WIDTH: 30,
    MAP_HEIGHT: 30,
    PLAYER_SPEED: 4,
    DAY_LENGTH: 60000, // 60 seconds
    ZOMBIE_BASE_SPEED: 1.2,
    ZOMBIE_SPAWN_RATES: {
        day: 0.005,
        night: 0.02
    },
    PLAYER: {
        WIDTH: 24,
        HEIGHT: 24,
        MAX_HEALTH: 100,
        START_AMMO: 20
    },
    WEAPONS: {
        pistol: {
            name: "Pistol",
            damage: 25,
            ammoCost: 1,
            cooldown: 500,
            range: 400,
            icon: "weapon.png"
        },
        shotgun: {
            name: "Shotgun",
            damage: 15,
            ammoCost: 2,
            cooldown: 800,
            range: 250,
            spread: 0.2,
            pellets: 5,
            icon: "weapon.png"
        },
        rifle: {
            name: "Rifle",
            damage: 40,
            ammoCost: 1,
            cooldown: 300,
            range: 500,
            icon: "weapon.png"
        }
    },
    ITEMS: {
        ammo: {
            name: "Ammo",
            type: "resource",
            stackable: true,
            icon: "ammo.png",
            description: "Used for crafting bullets"
        },
        medkit: {
            name: "Medkit",
            type: "consumable",
            health: 50,
            icon: "medkit.png",
            description: "Restores 50 health"
        },
        metal: {
            name: "Metal Scrap",
            type: "resource",
            stackable: true,
            icon: "wall.png",
            description: "Used for crafting"
        },
        cloth: {
            name: "Cloth",
            type: "resource",
            stackable: true,
            icon: "wall.png",
            description: "Used for crafting"
        }
    },
    CRAFTING_RECIPES: [
        {
            id: "pistol_ammo",
            name: "Pistol Ammo (10)",
            result: { type: "ammo", amount: 10 },
            requirements: [
                { type: "metal", amount: 2 }
            ],
            time: 3000
        },
        {
            id: "medkit",
            name: "Medkit",
            result: { type: "medkit", amount: 1 },
            requirements: [
                { type: "cloth", amount: 2 },
                { type: "ammo", amount: 1 } // represents alcohol/chemicals
            ],
            time: 5000
        },
        {
            id: "shotgun",
            name: "Shotgun",
            result: { type: "shotgun", amount: 1 },
            requirements: [
                { type: "metal", amount: 5 },
                { type: "ammo", amount: 2 }
            ],
            time: 10000
        }
    ],
    BUILDINGS: {
        safehouse: {
            name: "Safehouse",
            width: 64,
            height: 64,
            sprite: "building.png",
            health: 200,
            provides: "safety"
        }
    }
};

// =============================================
// Game State and Initialization
// =============================================
const GameState = {
    player: null,
    zombies: [],
    bullets: [],
    buildings: [],
    items: [],
    map: [],
    inventory: [],
    equippedWeapon: "pistol",
    lastShotTime: 0,
    gameTime: 0,
    day: 1,
    isNight: false,
    score: 0,
    zombiesKilled: 0,
    gameRunning: false,
    paused: false
};

// DOM Elements
const elements = {
    canvas: document.getElementById('game-canvas'),
    ctx: document.getElementById('game-canvas').getContext('2d'),
    healthBar: document.getElementById('health-bar'),
    healthText: document.getElementById('health-text'),
    ammoBar: document.getElementById('ammo-bar'),
    ammoText: document.getElementById('ammo-text'),
    dayText: document.getElementById('day-text'),
    timeIndicator: document.getElementById('time-indicator'),
    scoreDisplay: document.getElementById('score-display'),
    weaponDisplay: document.getElementById('weapon-display'),
    weaponIcon: document.getElementById('weapon-icon'),
    weaponName: document.getElementById('weapon-name'),
    inventoryButton: document.getElementById('inventory-button'),
    inventoryModal: document.getElementById('inventory-modal'),
    inventoryGrid: document.getElementById('inventory-grid'),
    craftingOptions: document.getElementById('crafting-options'),
    closeInventory: document.getElementById('close-inventory'),
    gameMenu: document.getElementById('game-menu'),
    startButton: document.getElementById('start-button'),
    loadButton: document.getElementById('load-button'),
    controlsButton: document.getElementById('controls-button'),
    aboutButton: document.getElementById('about-button'),
    controlsModal: document.getElementById('controls-modal'),
    closeControls: document.getElementById('close-controls'),
    gameOverScreen: document.getElementById('game-over-screen'),
    daysSurvived: document.getElementById('days-survived'),
    zombiesKilled: document.getElementById('zombies-killed'),
    finalScore: document.getElementById('final-score'),
    restartButton: document.getElementById('restart-button'),
    menuButton: document.getElementById('menu-button'),
    pauseMenu: document.getElementById('pause-menu'),
    resumeButton: document.getElementById('resume-button'),
    saveButton: document.getElementById('save-button'),
    quitButton: document.getElementById('quit-button'),
    gunshotSound: document.getElementById('gunshot-sound'),
    zombieSound: document.getElementById('zombie-sound'),
    pickupSound: document.getElementById('pickup-sound')
};

// Initialize canvas size
elements.canvas.width = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
elements.canvas.height = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;

// =============================================
// Utility Functions
// =============================================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function playSound(soundElement, volume = 1.0) {
    soundElement.volume = volume;
    soundElement.currentTime = 0;
    soundElement.play().catch(e => console.log("Audio play failed:", e));
}

// =============================================
// Game Initialization
// =============================================
function initGame() {
    // Reset game state
    GameState.player = {
        x: elements.canvas.width / 2 - CONFIG.PLAYER.WIDTH / 2,
        y: elements.canvas.height / 2 - CONFIG.PLAYER.HEIGHT / 2,
        width: CONFIG.PLAYER.WIDTH,
        height: CONFIG.PLAYER.HEIGHT,
        health: CONFIG.PLAYER.MAX_HEALTH,
        ammo: CONFIG.PLAYER.START_AMMO,
        direction: { x: 0, y: 0 },
        inventory: [],
        maxInventorySlots: 20
    };
    
    GameState.zombies = [];
    GameState.bullets = [];
    GameState.buildings = [];
    GameState.items = [];
    GameState.equippedWeapon = "pistol";
    GameState.lastShotTime = 0;
    GameState.gameTime = 0;
    GameState.day = 1;
    GameState.isNight = false;
    GameState.score = 0;
    GameState.zombiesKilled = 0;
    GameState.gameRunning = true;
    GameState.paused = false;
    
    // Generate map
    generateMap();
    
    // Create initial safehouse
    createBuilding(
        elements.canvas.width / 2 - CONFIG.BUILDINGS.safehouse.width / 2,
        elements.canvas.height / 2 - CONFIG.BUILDINGS.safehouse.height / 2,
        "safehouse"
    );
    
    // Add starting items to inventory
    addToInventory({ type: "ammo", amount: 10 });
    addToInventory({ type: "medkit", amount: 2 });
    addToInventory({ type: "metal", amount: 5 });
    addToInventory({ type: "cloth", amount: 3 });
    
    // Update UI
    updateUI();
    
    // Start game loop
    if (!GameState.gameLoop) {
        GameState.gameLoop = requestAnimationFrame(gameLoop);
    }
}

function generateMap() {
    GameState.map = [];
    for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
        GameState.map[y] = [];
        for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
            // Border walls
            if (x === 0 || y === 0 || x === CONFIG.MAP_WIDTH - 1 || y === CONFIG.MAP_HEIGHT - 1) {
                GameState.map[y][x] = 1; // Wall
            } else {
                // Random walls and empty space
                GameState.map[y][x] = Math.random() < 0.07 ? 1 : 0; // 0 = grass, 1 = wall
            }
        }
    }
}

// =============================================
// Game Entities
// =============================================
function createZombie(x, y, type = "normal") {
    let speed = CONFIG.ZOMBIE_BASE_SPEED;
    let health = 50;
    let width = 24;
    let height = 24;
    
    if (type === "fast") {
        speed *= 1.8;
        health = 30;
    } else if (type === "tank") {
        speed *= 0.7;
        health = 120;
        width = 32;
        height = 32;
    }
    
    const zombie = {
        x: x,
        y: y,
        width: width,
        height: height,
        speed: speed,
        health: health,
        type: type,
        lastSoundTime: 0
    };
    
    GameState.zombies.push(zombie);
    return zombie;
}

function createBullet(x, y, dx, dy, damage, range) {
    const bullet = {
        x: x,
        y: y,
        dx: dx,
        dy: dy,
        radius: 3,
        damage: damage,
        distance: 0,
        maxDistance: range
    };
    
    GameState.bullets.push(bullet);
    return bullet;
}

function createBuilding(x, y, type) {
    const buildingConfig = CONFIG.BUILDINGS[type];
    if (!buildingConfig) return null;
    
    const building = {
        x: x,
        y: y,
        width: buildingConfig.width,
        height: buildingConfig.height,
        type: type,
        health: buildingConfig.health,
        maxHealth: buildingConfig.health
    };
    
    GameState.buildings.push(building);
    return building;
}

function spawnRandomItem(x, y) {
    const itemTypes = Object.keys(CONFIG.ITEMS);
    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    const item = {
        x: x + Math.random() * 20 - 10,
        y: y + Math.random() * 20 - 10,
        width: 16,
        height: 16,
        type: randomType
    };
    
    GameState.items.push(item);
    return item;
}

// =============================================
// Inventory System
// =============================================
function addToInventory(item) {
    const existingItem = GameState.player.inventory.find(i => i.type === item.type);
    
    if (existingItem && CONFIG.ITEMS[item.type].stackable) {
        existingItem.amount += item.amount;
    } else if (GameState.player.inventory.length < GameState.player.maxInventorySlots) {
        GameState.player.inventory.push({ ...item });
    } else {
        return false; // Inventory full
    }
    
    updateInventoryUI();
    return true;
}

function removeFromInventory(itemType, amount = 1) {
    const itemIndex = GameState.player.inventory.findIndex(i => i.type === itemType);
    
    if (itemIndex !== -1) {
        const item = GameState.player.inventory[itemIndex];
        
        if (item.amount > amount) {
            item.amount -= amount;
        } else {
            GameState.player.inventory.splice(itemIndex, 1);
        }
        
        updateInventoryUI();
        return true;
    }
    
    return false;
}

function updateInventoryUI() {
    elements.inventoryGrid.innerHTML = '';
    
    // Fill inventory slots
    for (let i = 0; i < GameState.player.maxInventorySlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        if (i < GameState.player.inventory.length) {
            const item = GameState.player.inventory[i];
            const itemConfig = CONFIG.ITEMS[item.type];
            
            slot.innerHTML = `
                <img src="assets/${itemConfig.icon}" alt="${item.type}">
                ${item.amount > 1 ? `<div class="item-count">${item.amount}</div>` : ''}
            `;
            
            slot.title = `${itemConfig.name}\n${itemConfig.description}`;
        }
        
        elements.inventoryGrid.appendChild(slot);
    }
    
    // Update crafting options
    elements.craftingOptions.innerHTML = '';
    CONFIG.CRAFTING_RECIPES.forEach(recipe => {
        const canCraft = recipe.requirements.every(req => {
            const item = GameState.player.inventory.find(i => i.type === req.type);
            return item && item.amount >= req.amount;
        });
        
        const recipeElement = document.createElement('div');
        recipeElement.className = 'crafting-recipe';
        
        let requirementsHTML = '';
        recipe.requirements.forEach(req => {
            const hasEnough = GameState.player.inventory.some(i => i.type === req.type && i.amount >= req.amount);
            requirementsHTML += `<li style="color: ${hasEnough ? 'lightgreen' : 'salmon'}">${req.amount}x ${req.type}</li>`;
        });
        
        recipeElement.innerHTML = `
            <h4>${recipe.name}</h4>
            <ul>${requirementsHTML}</ul>
            <button ${!canCraft ? 'disabled' : ''}>Craft</button>
        `;
        
        recipeElement.querySelector('button').addEventListener('click', () => {
            craftItem(recipe.id);
        });
        
        elements.craftingOptions.appendChild(recipeElement);
    });
}

function craftItem(recipeId) {
    const recipe = CONFIG.CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Check requirements
    const canCraft = recipe.requirements.every(req => {
        const item = GameState.player.inventory.find(i => i.type === req.type);
        return item && item.amount >= req.amount;
    });
    
    if (!canCraft) return;
    
    // Remove required items
    recipe.requirements.forEach(req => {
        removeFromInventory(req.type, req.amount);
    });
    
    // Add crafted item
    addToInventory(recipe.result);
    
    // Play sound
    playSound(elements.pickupSound, 0.3);
}

// =============================================
// Game Mechanics
// =============================================
function shootBullet(mouseX, mouseY) {
    const weapon = CONFIG.WEAPONS[GameState.equippedWeapon];
    if (!weapon) return;
    
    // Check cooldown and ammo
    const now = Date.now();
    if (now - GameState.lastShotTime < weapon.cooldown) return;
    if (GameState.player.ammo < weapon.ammoCost) {
        // Play empty click sound or show message
        return;
    }
    
    // Use ammo
    GameState.player.ammo -= weapon.ammoCost;
    GameState.lastShotTime = now;
    
    // Play sound
    playSound(elements.gunshotSound);
    
    // Calculate direction
    const playerCenterX = GameState.player.x + GameState.player.width / 2;
    const playerCenterY = GameState.player.y + GameState.player.height / 2;
    
    const dx = mouseX - playerCenterX;
    const dy = mouseY - playerCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction
    const dirX = dx / dist;
    const dirY = dy / dist;
    
    // Handle different weapon types
    if (weapon.pellets) {
        // Shotgun with multiple pellets
        for (let i = 0; i < weapon.pellets; i++) {
            const spread = weapon.spread || 0.1;
            const pelletDirX = dirX + (Math.random() * spread * 2 - spread);
            const pelletDirY = dirY + (Math.random() * spread * 2 - spread);
            createBullet(
                playerCenterX,
                playerCenterY,
                pelletDirX * 8,
                pelletDirY * 8,
                weapon.damage,
                weapon.range
            );
        }
    } else {
        // Single bullet
        createBullet(
            playerCenterX,
            playerCenterY,
            dirX * 8,
            dirY * 8,
            weapon.damage,
            weapon.range
        );
    }
    
    updateUI();
}

function spawnZombie() {
    if (!GameState.gameRunning || GameState.paused) return;
    
    // Determine zombie type based on day
    let zombieType = "normal";
    const day = GameState.day;
    
    if (day > 3 && Math.random() < 0.2) {
        zombieType = "fast";
    }
    
    if (day > 5 && Math.random() < 0.15) {
        zombieType = "tank";
    }
    
    // Spawn at edge of map
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 : elements.canvas.width;
        y = Math.random() * elements.canvas.height;
    } else {
        x = Math.random() * elements.canvas.width;
        y = Math.random() < 0.5 ? 0 : elements.canvas.height;
    }
    
    createZombie(x, y, zombieType);
}

function useMedkit() {
    const medkit = GameState.player.inventory.find(item => item.type === "medkit");
    if (!medkit) return;
    
    GameState.player.health = Math.min(
        GameState.player.health + CONFIG.ITEMS.medkit.health,
        CONFIG.PLAYER.MAX_HEALTH
    );
    
    removeFromInventory("medkit", 1);
    playSound(elements.pickupSound, 0.5);
    updateUI();
}

function reloadWeapon() {
    if (GameState.isNight) return; // Can't reload at night
    
    const ammoItem = GameState.player.inventory.find(item => item.type === "ammo");
    if (!ammoItem) return;
    
    const ammoNeeded = CONFIG.PLAYER.START_AMMO - GameState.player.ammo;
    if (ammoNeeded <= 0) return;
    
    const ammoToUse = Math.min(ammoNeeded, ammoItem.amount);
    GameState.player.ammo += ammoToUse;
    removeFromInventory("ammo", ammoToUse);
    
    playSound(elements.pickupSound, 0.3);
    updateUI();
}

// =============================================
// Game Loop
// =============================================
function gameLoop(timestamp) {
    if (!GameState.gameRunning || GameState.paused) return;
    
    // Clear canvas
    elements.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // Update game state
    update(timestamp);
    
    // Render game
    render();
    
    // Continue loop
    GameState.gameLoop = requestAnimationFrame(gameLoop);
}

function update(timestamp) {
    // Update player position
    GameState.player.x += GameState.player.direction.x * CONFIG.PLAYER_SPEED;
    GameState.player.y += GameState.player.direction.y * CONFIG.PLAYER_SPEED;
    
    // Keep player in bounds
    GameState.player.x = Math.max(0, Math.min(elements.canvas.width - GameState.player.width, GameState.player.x));
    GameState.player.y = Math.max(0, Math.min(elements.canvas.height - GameState.player.height, GameState.player.y));
    
    // Update game time and day/night cycle
    GameState.gameTime += 16; // Assuming ~60fps
    
    if (GameState.gameTime >= CONFIG.DAY_LENGTH) {
        GameState.day++;
        GameState.gameTime = 0;
        GameState.isNight = !GameState.isNight;
        
        // Spawn more zombies at night start
        if (GameState.isNight) {
            const zombiesToSpawn = 3 + Math.floor(GameState.day / 2);
            for (let i = 0; i < zombiesToSpawn; i++) {
                spawnZombie();
            }
        }
        
        updateUI();
    }
    
    // Spawn zombies based on current rate
    const spawnRate = GameState.isNight 
        ? CONFIG.ZOMBIE_SPAWN_RATES.night 
        : CONFIG.ZOMBIE_SPAWN_RATES.day;
    
    if (Math.random() < spawnRate) {
        spawnZombie();
    }
    
    // Update zombies
    GameState.zombies.forEach((zombie, index) => {
        // Move toward player
        const dx = GameState.player.x - zombie.x;
        const dy = GameState.player.y - zombie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            zombie.x += (dx / dist) * zombie.speed;
            zombie.y += (dy / dist) * zombie.speed;
        }
        
        // Play zombie sounds randomly
        if (Math.random() < 0.005 && timestamp - zombie.lastSoundTime > 3000) {
            playSound(elements.zombieSound, 0.2);
            zombie.lastSoundTime = timestamp;
        }
        
        // Check collision with player
        if (checkCollision(GameState.player, zombie)) {
            GameState.player.health -= 0.5;
            updateUI();
            
            if (GameState.player.health <= 0) {
                gameOver();
            }
        }
    });
    
    // Update bullets
    GameState.bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        bullet.distance += Math.sqrt(bullet.dx * bullet.dx + bullet.dy * bullet.dy);
        
        // Remove bullets that exceed range
        if (bullet.distance > bullet.maxDistance) {
            GameState.bullets.splice(index, 1);
            return;
        }
        
        // Check bullet-zombie collisions
        GameState.zombies.forEach((zombie, zIndex) => {
            if (checkCollision(bullet, zombie)) {
                zombie.health -= bullet.damage;
                
                if (zombie.health <= 0) {
                    GameState.zombies.splice(zIndex, 1);
                    GameState.score += zombie.type === "normal" ? 10 : 
                                     zombie.type === "fast" ? 15 : 25;
                    GameState.zombiesKilled++;
                    
                    // Chance to drop item
                    if (Math.random() < 0.3) {
                        spawnRandomItem(zombie.x, zombie.y);
                    }
                }
                
                GameState.bullets.splice(index, 1);
                updateUI();
                return;
            }
        });
        
        // Check bullet-wall collisions
        const tileX = Math.floor(bullet.x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(bullet.y / CONFIG.TILE_SIZE);
        
        if (tileX >= 0 && tileY >= 0 && 
            tileX < CONFIG.MAP_WIDTH && tileY < CONFIG.MAP_HEIGHT &&
            GameState.map[tileY][tileX] === 1) {
            GameState.bullets.splice(index, 1);
            return;
        }
    });
    
    // Check player-item collisions
    GameState.items.forEach((item, index) => {
        if (checkCollision(GameState.player, item)) {
            if (addToInventory({ type: item.type, amount: 1 })) {
                GameState.items.splice(index, 1);
                playSound(elements.pickupSound, 0.3);
            }
        }
    });
}

function render() {
    // Draw map
    for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
        for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
            const tile = GameState.map[y][x];
            const img = tile === 1 ? assets.wall : assets.grass;
            
            // Draw grass background
            elements.ctx.drawImage(
                assets.grass,
                x * CONFIG.TILE_SIZE,
                y * CONFIG.TILE_SIZE,
                CONFIG.TILE_SIZE,
                CONFIG.TILE_SIZE
            );
            
            // Draw walls on top
            if (tile === 1) {
                elements.ctx.drawImage(
                    assets.wall,
                    x * CONFIG.TILE_SIZE,
                    y * CONFIG.TILE_SIZE,
                    CONFIG.TILE_SIZE,
                    CONFIG.TILE_SIZE
                );
            }
        }
    }
    
    // Draw buildings
    GameState.buildings.forEach(building => {
        const buildingConfig = CONFIG.BUILDINGS[building.type];
        elements.ctx.drawImage(
            assets[buildingConfig.sprite] || assets.wall,
            building.x,
            building.y,
            building.width,
            building.height
        );
        
        // Draw health bar for damaged buildings
        if (building.health < building.maxHealth) {
            const healthPercent = building.health / building.maxHealth;
            const barWidth = building.width * healthPercent;
            
            elements.ctx.fillStyle = 'red';
            elements.ctx.fillRect(building.x, building.y - 10, building.width, 5);
            
            elements.ctx.fillStyle = 'green';
            elements.ctx.fillRect(building.x, building.y - 10, barWidth, 5);
        }
    });
    
    // Draw items
    GameState.items.forEach(item => {
        const itemConfig = CONFIG.ITEMS[item.type];
        elements.ctx.drawImage(
            assets[itemConfig.icon] || assets.ammo,
            item.x,
            item.y,
            item.width,
            item.height
        );
    });
    
    // Draw bullets
    elements.ctx.fillStyle = '#ff0';
    GameState.bullets.forEach(bullet => {
        elements.ctx.beginPath();
        elements.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        elements.ctx.fill();
    });
    
    // Draw zombies
    GameState.zombies.forEach(zombie => {
        let zombieImg;
        
        switch (zombie.type) {
            case "fast":
                zombieImg = assets.fast_zombie || assets.zombie;
                break;
            case "tank":
                zombieImg = assets.tank_zombie || assets.zombie;
                break;
            default:
                zombieImg = assets.zombie;
        }
        
        elements.ctx.drawImage(
            zombieImg,
            zombie.x,
            zombie.y,
            zombie.width,
            zombie.height
        );
        
        // Draw health bar
        const healthPercent = zombie.health / (zombie.type === "normal" ? 50 : 
                            zombie.type === "fast" ? 30 : 120);
        const barWidth = zombie.width * healthPercent;
        
        elements.ctx.fillStyle = 'red';
        elements.ctx.fillRect(zombie.x, zombie.y - 8, zombie.width, 3);
        
        elements.ctx.fillStyle = 'green';
        elements.ctx.fillRect(zombie.x, zombie.y - 8, barWidth, 3);
    });
    
    // Draw player
    elements.ctx.drawImage(
        assets.player,
        GameState.player.x,
        GameState.player.y,
        GameState.player.width,
        GameState.player.height
    );
    
    // Night effect
    if (GameState.isNight) {
        elements.ctx.fillStyle = CONFIG.nightColor;
        elements.ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
    }
}

// =============================================
// UI Updates
// =============================================
function updateUI() {
    // Health
    const healthPercent = (GameState.player.health / CONFIG.PLAYER.MAX_HEALTH) * 100;
    elements.healthBar.style.width = `${healthPercent}%`;
    elements.healthText.textContent = `${Math.floor(GameState.player.health)}/${CONFIG.PLAYER.MAX_HEALTH}`;
    
    // Ammo
    const ammoPercent = (GameState.player.ammo / CONFIG.PLAYER.START_AMMO) * 100;
    elements.ammoBar.style.width = `${ammoPercent}%`;
    elements.ammoText.textContent = `${GameState.player.ammo}/${CONFIG.PLAYER.START_AMMO}`;
    
    // Day/night
    const timePercent = (GameState.gameTime / CONFIG.DAY_LENGTH) * 100;
    elements.timeIndicator.style.background = `conic-gradient(${
        GameState.isNight ? '#3498db' : '#f39c12'
    } ${timePercent}%, transparent ${timePercent}%)`;
    
    elements.dayText.textContent = `Day ${GameState.day} ${GameState.isNight ? '(Night)' : '(Day)'}`;
    
    // Score
    elements.scoreDisplay.textContent = `Score: ${GameState.score}`;
    
    // Weapon
    const weapon = CONFIG.WEAPONS[GameState.equippedWeapon];
    if (weapon) {
        elements.weaponName.textContent = weapon.name;
    }
}

// =============================================
// Game State Management
// =============================================
function gameOver() {
    GameState.gameRunning = false;
    cancelAnimationFrame(GameState.gameLoop);
    
    elements.daysSurvived.textContent = GameState.day;
    elements.zombiesKilled.textContent = GameState.zombiesKilled;
    elements.finalScore.textContent = GameState.score;
    
    elements.gameOverScreen.classList.remove('hidden');
}

function pauseGame() {
    GameState.paused = true;
    elements.pauseMenu.classList.remove('hidden');
}

function resumeGame() {
    GameState.paused = false;
    elements.pauseMenu.classList.add('hidden');
    GameState.gameLoop = requestAnimationFrame(gameLoop);
}

// =============================================
// Event Listeners
// =============================================
// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!GameState.gameRunning || GameState.paused) return;
    
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            GameState.player.direction.y = -1;
            break;
        case 's':
        case 'ArrowDown':
            GameState.player.direction.y = 1;
            break;
        case 'a':
        case 'ArrowLeft':
            GameState.player.direction.x = -1;
            break;
        case 'd':
        case 'ArrowRight':
            GameState.player.direction.x = 1;
            break;
        case ' ':
            reloadWeapon();
            break;
        case '1':
            GameState.equippedWeapon = "pistol";
            updateUI();
            break;
        case '2':
            GameState.equippedWeapon = "shotgun";
            updateUI();
            break;
        case '3':
            GameState.equippedWeapon = "rifle";
            updateUI();
            break;
        case 'm':
            useMedkit();
            break;
        case 'i':
            elements.inventoryModal.classList.toggle('hidden');
            break;
        case 'Escape':
            pauseGame();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
        case 's':
        case 'ArrowDown':
            GameState.player.direction.y = 0;
            break;
        case 'a':
        case 'ArrowLeft':
        case 'd':
        case 'ArrowRight':
            GameState.player.direction.x = 0;
            break;
    }
});

// Mouse controls
elements.canvas.addEventListener('click', (e) => {
    if (!GameState.gameRunning || GameState.paused) return;
    
    const rect = elements.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    shootBullet(mouseX, mouseY);
});

// UI event listeners
elements.inventoryButton.addEventListener('click', () => {
    elements.inventoryModal.classList.toggle('hidden');
});

elements.closeInventory.addEventListener('click', () => {
    elements.inventoryModal.classList.add('hidden');
});

elements.startButton.addEventListener('click', () => {
    elements.gameMenu.classList.add('hidden');
    initGame();
});

elements.controlsButton.addEventListener('click', () => {
    elements.controlsModal.classList.remove('hidden');
});

elements.closeControls.addEventListener('click', () => {
    elements.controlsModal.classList.add('hidden');
});

elements.restartButton.addEventListener('click', () => {
    elements.gameOverScreen.classList.add('hidden');
    initGame();
});

elements.menuButton.addEventListener('click', () => {
    elements.gameOverScreen.classList.add('hidden');
    elements.gameMenu.classList.remove('hidden');
});

elements.resumeButton.addEventListener('click', () => {
    resumeGame();
});

elements.quitButton.addEventListener('click', () => {
    elements.pauseMenu.classList.add('hidden');
    elements.gameMenu.classList.remove('hidden');
});

// =============================================
// Asset Loading
// =============================================
const assets = {};

function loadAssets() {
    const assetPromises = [];
    
    // Load all assets
    for (const [key, value] of Object.entries(CONFIG.ITEMS)) {
        assets[key] = new Image();
        assets[key].src = `assets/${value.icon}`;
        assetPromises.push(new Promise(resolve => {
            assets[key].onload = resolve;
        }));
    }
    
    for (const [key, value] of Object.entries(CONFIG.BUILDINGS)) {
        assets[key] = new Image();
        assets[key].src = `assets/${value.sprite}`;
        assetPromises.push(new Promise(resolve => {
            assets[key].onload = resolve;
        }));
    }
    
    // Player and zombies
    assets.player = new Image();
    assets.player.src = 'assets/player.png';
    assetPromises.push(new Promise(resolve => {
        assets.player.onload = resolve;
    }));
    
    assets.zombie = new Image();
    assets.zombie.src = 'assets/zombie.png';
    assetPromises.push(new Promise(resolve => {
        assets.zombie.onload = resolve;
    }));
    
    assets.fast_zombie = new Image();
    assets.fast_zombie.src = 'assets/fast_zombie.png';
    assetPromises.push(new Promise(resolve => {
        assets.fast_zombie.onload = resolve;
    }));
    
    assets.tank_zombie = new Image();
    assets.tank_zombie.src = 'assets/tank_zombie.png';
    assetPromises.push(new Promise(resolve => {
        assets.tank_zombie.onload = resolve;
    }));
    
    // Tiles
    assets.grass = new Image();
    assets.grass.src = 'assets/grass.png';
    assetPromises.push(new Promise(resolve => {
        assets.grass.onload = resolve;
    }));
    
    assets.wall = new Image();
    assets.wall.src = 'assets/wall.png';
    assetPromises.push(new Promise(resolve => {
        assets.wall.onload = resolve;
    }));
    
    return Promise.all(assetPromises);
}

// Initialize game when assets are loaded
loadAssets().then(() => {
    console.log('All assets loaded');
    elements.gameMenu.classList.remove('hidden');
});

// Fallback for missing assets
Object.values(assets).forEach(img => {
    img.onerror = () => {
        console.warn(`Failed to load asset: ${img.src}`);
        // Create a colored rectangle as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        if (img === assets.player) {
            ctx.fillStyle = 'green';
        } else if (img === assets.zombie || img === assets.fast_zombie || img === assets.tank_zombie) {
            ctx.fillStyle = 'red';
        } else if (img === assets.grass) {
            ctx.fillStyle = '#2ecc71';
        } else if (img === assets.wall) {
            ctx.fillStyle = '#7f8c8d';
        } else {
            ctx.fillStyle = 'purple';
        }
        
        ctx.fillRect(0, 0, 32, 32);
        img.src = canvas.toDataURL();
    };
});
