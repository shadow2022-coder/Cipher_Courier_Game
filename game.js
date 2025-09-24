// Cipher Courier - Main Game Engine
// Implements core runner mechanics, progression, and persistence

class CipherCourier {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameWidth = this.canvas.width;
        this.gameHeight = this.canvas.height;
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover, safehouse
        this.lastTime = 0;
        this.gameSpeed = 200; // pixels per second
        this.groundY = this.gameHeight - 60;
        
        // Player
        this.player = {
            x: 80,
            y: this.groundY - 40,
            width: 32,
            height: 40,
            velocityY: 0,
            isGrounded: true,
            isSliding: false,
            slideTimer: 0,
            jumpForce: -12,
            gravity: 0.8,
            color: '#00ff88'
        };
        
        // Game objects
        this.obstacles = [];
        this.shards = [];
        this.relayNodes = [];
        this.particles = [];
        
        // Progression
        this.score = 0;
        this.distance = 0;
        this.runShards = 0;
        this.currentDistrict = 0;
        this.districtProgress = 0;
        
        // Spawning timers
        this.obstacleTimer = 0;
        this.shardTimer = 0;
        this.relayTimer = 0;
        
        // Load persistent data
        this.loadGameData();
        
        // Initialize upgrades
        this.initializeUpgrades();
        
        // Bind event listeners
        this.bindEvents();
        
        // Update HUD
        this.updateHUD();
        
        // Start render loop
        this.gameLoop();
    }
    
    // === PERSISTENT DATA ===
    loadGameData() {
        this.bankShards = parseInt(localStorage.getItem('cipher-courier-bank') || '0');
        this.highScore = parseInt(localStorage.getItem('cipher-courier-highscore') || '0');
        this.unlockedUpgrades = JSON.parse(localStorage.getItem('cipher-courier-upgrades') || '[]');
        this.districtLiberation = JSON.parse(localStorage.getItem('cipher-courier-districts') || '[0,0,0]');
        this.settings = JSON.parse(localStorage.getItem('cipher-courier-settings') || '{"highContrast":false}');
    }
    
    saveGameData() {
        localStorage.setItem('cipher-courier-bank', this.bankShards.toString());
        localStorage.setItem('cipher-courier-highscore', this.highScore.toString());
        localStorage.setItem('cipher-courier-upgrades', JSON.stringify(this.unlockedUpgrades));
        localStorage.setItem('cipher-courier-districts', JSON.stringify(this.districtLiberation));
        localStorage.setItem('cipher-courier-settings', JSON.stringify(this.settings));
    }
    
    // === UPGRADES SYSTEM ===
    initializeUpgrades() {
        this.upgrades = {
            doubleJump: {
                name: 'Double Jump',
                cost: 50,
                description: 'Grants one extra mid-air jump for better obstacle navigation',
                owned: this.unlockedUpgrades.includes('doubleJump')
            },
            coyoteTime: {
                name: 'Coyote Time',
                cost: 75,
                description: 'Allows late jump in a small grace window after leaving platform',
                owned: this.unlockedUpgrades.includes('coyoteTime')
            },
            slideCancel: {
                name: 'Slide Cancel',
                cost: 80,
                description: 'Shortens slide recovery time for faster movement combos',
                owned: this.unlockedUpgrades.includes('slideCancel')
            },
            encryptionTier1: {
                name: 'Encryption Tier 1',
                cost: 120,
                description: 'Minor hazards cause degradation instead of instant termination',
                owned: this.unlockedUpgrades.includes('encryptionTier1')
            }
        };
    }
    
    purchaseUpgrade(upgradeKey) {
        const upgrade = this.upgrades[upgradeKey];
        if (!upgrade.owned && this.bankShards >= upgrade.cost) {
            this.bankShards -= upgrade.cost;
            upgrade.owned = true;
            this.unlockedUpgrades.push(upgradeKey);
            this.saveGameData();
            this.renderSafehouse();
            this.updateHUD();
            this.createParticles(400, 200, '#00ff88', 15); // Success effect
        }
    }
    
    // === EVENT HANDLING ===
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.canvas.addEventListener('click', () => this.handleClick());
    }
    
    handleKeyDown(e) {
        if (e.repeat) return;
        
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
                e.preventDefault();
                if (this.state === 'playing') this.jump();
                else if (this.state === 'menu' || this.state === 'gameover') this.start();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (this.state === 'playing') this.slide();
                break;
            case 'KeyR':
                if (this.state === 'gameover') this.restart();
                break;
            case 'KeyS':
                if (this.state === 'menu' || this.state === 'paused') this.showSafehouse();
                break;
            case 'Escape':
                if (this.state === 'playing') this.pauseGame();
                else if (this.state === 'safehouse') this.closeSafehouse();
                break;
        }
    }
    
    handleKeyUp(e) {
        // Handle key releases if needed
    }
    
    handleClick() {
        if (this.state === 'playing') this.jump();
        else if (this.state === 'menu' || this.state === 'gameover') this.start();
    }
    
    // === PLAYER ACTIONS ===
    jump() {
        if (this.player.isGrounded) {
            this.player.velocityY = this.player.jumpForce;
            this.player.isGrounded = false;
            this.createParticles(this.player.x + 16, this.player.y + 35, '#00ffff', 5);
        } else if (this.upgrades.doubleJump.owned && this.player.velocityY > this.player.jumpForce * 0.5) {
            // Double jump (only if we haven't used it yet this jump)
            this.player.velocityY = this.player.jumpForce * 0.8;
            this.createParticles(this.player.x + 16, this.player.y + 20, '#ff8800', 8);
        }
    }
    
    slide() {
        if (this.player.isGrounded && !this.player.isSliding) {
            this.player.isSliding = true;
            this.player.slideTimer = this.upgrades.slideCancel.owned ? 300 : 500; // ms
            this.player.height = 20;
            this.player.y = this.groundY - 20;
        }
    }
    
    // === GAME STATE MANAGEMENT ===
    start() {
        this.resetRun();
        this.state = 'playing';
        document.getElementById('gameMenu').style.display = 'none';
    }
    
    restart() {
        this.bankShards += this.runShards;
        this.saveGameData();
        this.start();
    }
    
    pauseGame() {
        this.state = 'paused';
        document.getElementById('gameMenu').style.display = 'flex';
        document.querySelector('#gameMenu h1').textContent = 'PAUSED';
    }
    
    gameOver() {
        this.state = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        this.bankShards += this.runShards;
        this.updateDistrictProgress();
        this.saveGameData();
        document.getElementById('gameMenu').style.display = 'flex';
        document.querySelector('#gameMenu h1').textContent = 'MISSION FAILED';
        document.querySelector('#gameMenu p').textContent = `Score: ${this.score} • Shards Collected: ${this.runShards}`;
    }
    
    resetRun() {
        this.player.x = 80;
        this.player.y = this.groundY - 40;
        this.player.velocityY = 0;
        this.player.isGrounded = true;
        this.player.isSliding = false;
        this.player.height = 40;
        
        this.obstacles = [];
        this.shards = [];
        this.relayNodes = [];
        this.particles = [];
        
        this.score = 0;
        this.distance = 0;
        this.runShards = 0;
        this.gameSpeed = 200;
        
        this.obstacleTimer = 0;
        this.shardTimer = 0;
        this.relayTimer = 5000; // First relay after 5 seconds
        
        this.updateHUD();
    }
    
    showSafehouse() {
        this.state = 'safehouse';
        document.getElementById('gameMenu').style.display = 'none';
        document.getElementById('safehouse').style.display = 'flex';
        this.renderSafehouse();
    }
    
    closeSafehouse() {
        this.state = 'menu';
        document.getElementById('safehouse').style.display = 'none';
        document.getElementById('gameMenu').style.display = 'flex';
        document.querySelector('#gameMenu h1').textContent = 'CIPHER COURIER';
    }
    
    toggleHighContrast() {
        this.settings.highContrast = !this.settings.highContrast;
        document.body.classList.toggle('high-contrast', this.settings.highContrast);
        this.saveGameData();
    }
    
    // === GAME LOOP ===
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.state === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update timers and spawn objects
        this.updateSpawning(deltaTime);
        
        // Update game objects
        this.updateObjects(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update progression
        this.updateProgression(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update HUD
        this.updateHUD();
    }
    
    updatePlayer(deltaTime) {
        // Handle sliding
        if (this.player.isSliding) {
            this.player.slideTimer -= deltaTime;
            if (this.player.slideTimer <= 0) {
                this.player.isSliding = false;
                this.player.height = 40;
                this.player.y = this.groundY - 40;
            }
        }
        
        // Apply gravity
        if (!this.player.isGrounded) {
            this.player.velocityY += this.player.gravity;
        }
        
        // Update position
        this.player.y += this.player.velocityY;
        
        // Ground collision
        if (this.player.y >= this.groundY - this.player.height) {
            this.player.y = this.groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isGrounded = true;
        }
    }
    
    updateSpawning(deltaTime) {
        this.obstacleTimer -= deltaTime;
        this.shardTimer -= deltaTime;
        this.relayTimer -= deltaTime;
        
        // Spawn obstacles
        if (this.obstacleTimer <= 0) {
            this.spawnObstacle();
            this.obstacleTimer = Math.random() * 2000 + 1500; // 1.5-3.5 seconds
        }
        
        // Spawn shards
        if (this.shardTimer <= 0) {
            this.spawnShardCluster();
            this.shardTimer = Math.random() * 3000 + 2000; // 2-5 seconds
        }
        
        // Spawn relay nodes
        if (this.relayTimer <= 0) {
            this.spawnRelayNode();
            this.relayTimer = Math.random() * 8000 + 12000; // 12-20 seconds
        }
    }
    
    updateObjects(deltaTime) {
        const speed = this.gameSpeed * (deltaTime / 1000);
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= speed;
            
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update shards
        for (let i = this.shards.length - 1; i >= 0; i--) {
            const shard = this.shards[i];
            shard.x -= speed;
            shard.rotation += 0.1;
            
            if (shard.x + shard.size < 0) {
                this.shards.splice(i, 1);
            }
        }
        
        // Update relay nodes
        for (let i = this.relayNodes.length - 1; i >= 0; i--) {
            const relay = this.relayNodes[i];
            relay.x -= speed;
            relay.pulse += 0.1;
            
            if (relay.x + relay.width < 0) {
                this.relayNodes.splice(i, 1);
            }
        }
        
        // Increase game speed gradually
        this.gameSpeed += deltaTime * 0.01;
    }
    
    updateProgression(deltaTime) {
        this.distance += this.gameSpeed * (deltaTime / 1000);
        this.score = Math.floor(this.distance / 10) + (this.runShards * 25);
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // === COLLISION DETECTION ===
    checkCollisions() {
        // Player bounds
        const playerBounds = {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };
        
        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            if (this.checkRectCollision(playerBounds, obstacle)) {
                if (obstacle.type === 'minor' && this.upgrades.encryptionTier1.owned) {
                    // Degradation instead of death
                    this.runShards = Math.floor(this.runShards * 0.8);
                    obstacle.x = -100; // Remove obstacle
                    this.createParticles(obstacle.x, obstacle.y, '#ff4444', 10);
                } else {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Check shard collisions
        for (let i = this.shards.length - 1; i >= 0; i--) {
            const shard = this.shards[i];
            if (this.checkCircleRectCollision(shard, playerBounds)) {
                this.runShards++;
                this.createParticles(shard.x, shard.y, shard.color, 8);
                this.shards.splice(i, 1);
            }
        }
        
        // Check relay collisions
        for (let i = this.relayNodes.length - 1; i >= 0; i--) {
            const relay = this.relayNodes[i];
            if (this.checkRectCollision(playerBounds, relay)) {
                this.bankShards += this.runShards;
                this.createParticles(relay.x + 25, relay.y + 25, '#00ffff', 12);
                this.relayNodes.splice(i, 1);
                this.saveGameData();
            }
        }
    }
    
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkCircleRectCollision(circle, rect) {
        const distX = Math.abs(circle.x - rect.x - rect.width / 2);
        const distY = Math.abs(circle.y - rect.y - rect.height / 2);
        
        if (distX > (rect.width / 2 + circle.size)) return false;
        if (distY > (rect.height / 2 + circle.size)) return false;
        
        if (distX <= rect.width / 2) return true;
        if (distY <= rect.height / 2) return true;
        
        const dx = distX - rect.width / 2;
        const dy = distY - rect.height / 2;
        return (dx * dx + dy * dy <= circle.size * circle.size);
    }
    
    // === SPAWNING ===
    spawnObstacle() {
        const types = ['firewall', 'drone', 'barrier'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let obstacle = {
            x: this.gameWidth,
            type: type,
            color: type === 'drone' ? '#ff8800' : '#ff4444'
        };
        
        switch(type) {
            case 'firewall':
                obstacle.y = this.groundY - 60;
                obstacle.width = 20;
                obstacle.height = 60;
                obstacle.type = 'major';
                break;
            case 'drone':
                obstacle.y = this.groundY - 120 - Math.random() * 60;
                obstacle.width = 25;
                obstacle.height = 15;
                obstacle.type = 'minor';
                break;
            case 'barrier':
                obstacle.y = this.groundY - 40;
                obstacle.width = 30;
                obstacle.height = 40;
                obstacle.type = 'major';
                break;
        }
        
        this.obstacles.push(obstacle);
    }
    
    spawnShardCluster() {
        const clusterSize = Math.floor(Math.random() * 4) + 3; // 3-6 shards
        const startX = this.gameWidth + 50;
        const pattern = Math.random() > 0.5 ? 'arc' : 'line';
        
        for (let i = 0; i < clusterSize; i++) {
            let x = startX + i * 35;
            let y;
            
            if (pattern === 'arc') {
                const mid = clusterSize / 2;
                const height = 80 + Math.random() * 40;
                y = this.groundY - 80 - height * Math.sin((i / (clusterSize - 1)) * Math.PI);
            } else {
                y = this.groundY - 80 - Math.random() * 60;
            }
            
            this.shards.push({
                x: x,
                y: y,
                size: 8,
                color: '#ff8800',
                rotation: 0
            });
        }
    }
    
    spawnRelayNode() {
        this.relayNodes.push({
            x: this.gameWidth,
            y: this.groundY - 50,
            width: 50,
            height: 50,
            color: '#00ffff',
            pulse: 0
        });
    }
    
    // === PARTICLES ===
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                color: color,
                life: 1000,
                maxLife: 1000,
                alpha: 1,
                size: Math.random() * 3 + 2
            });
        }
    }
    
    // === RENDERING ===
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 17, 34, 0.1)';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        if (this.state === 'playing') {
            this.renderBackground();
            this.renderObstacles();
            this.renderShards();
            this.renderRelayNodes();
            this.renderPlayer();
            this.renderParticles();
        }
    }
    
    renderBackground() {
        // Draw ground
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, this.groundY, this.gameWidth, this.gameHeight - this.groundY);
        
        // Draw grid lines (moving)
        this.ctx.strokeStyle = '#16213e';
        this.ctx.lineWidth = 1;
        const gridOffset = (this.distance * 0.5) % 40;
        
        for (let x = -gridOffset; x < this.gameWidth; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.gameHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.gameHeight; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.gameWidth, y);
            this.ctx.stroke();
        }
    }
    
    renderPlayer() {
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Add glow effect
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.shadowBlur = 0;
        
        // Player details
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 8, 4, 4); // Eyes
        this.ctx.fillRect(this.player.x + 20, this.player.y + 8, 4, 4);
    }
    
    renderObstacles() {
        for (const obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add glow
            this.ctx.shadowColor = obstacle.color;
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            this.ctx.shadowBlur = 0;
        }
    }
    
    renderShards() {
        for (const shard of this.shards) {
            this.ctx.save();
            this.ctx.translate(shard.x, shard.y);
            this.ctx.rotate(shard.rotation);
            
            this.ctx.fillStyle = shard.color;
            this.ctx.fillRect(-shard.size, -shard.size, shard.size * 2, shard.size * 2);
            
            this.ctx.shadowColor = shard.color;
            this.ctx.shadowBlur = 6;
            this.ctx.fillRect(-shard.size, -shard.size, shard.size * 2, shard.size * 2);
            this.ctx.shadowBlur = 0;
            
            this.ctx.restore();
        }
    }
    
    renderRelayNodes() {
        for (const relay of this.relayNodes) {
            const pulseScale = 1 + Math.sin(relay.pulse) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(relay.x + relay.width/2, relay.y + relay.height/2);
            this.ctx.scale(pulseScale, pulseScale);
            
            this.ctx.fillStyle = relay.color;
            this.ctx.fillRect(-relay.width/2, -relay.height/2, relay.width, relay.height);
            
            this.ctx.shadowColor = relay.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(-relay.width/2, -relay.height/2, relay.width, relay.height);
            this.ctx.shadowBlur = 0;
            
            this.ctx.restore();
        }
    }
    
    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, 
                            particle.size, particle.size);
        }
        this.ctx.globalAlpha = 1;
    }
    
    // === UI ===
    updateHUD() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('shards').textContent = this.runShards;
        document.getElementById('bankShards').textContent = this.bankShards;
        
        const districts = ['East Grid', 'Central Hub', 'West Sector'];
        document.getElementById('district').textContent = districts[this.currentDistrict] || 'Unknown';
        
        const liberation = Math.floor(this.districtLiberation[this.currentDistrict] || 0);
        document.getElementById('liberation').textContent = `${liberation}%`;
    }
    
    renderSafehouse() {
        const grid = document.getElementById('upgradeGrid');
        grid.innerHTML = '';
        
        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            const card = document.createElement('div');
            card.className = 'upgrade-card' + (upgrade.owned ? ' owned' : '');
            
            card.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
                <p><strong>Cost: ${upgrade.cost} shards</strong></p>
                ${upgrade.owned ? '<p style="color: var(--accent-cyan)">OWNED</p>' : 
                  `<button class="menu-button" onclick="Game.purchaseUpgrade('${key}')" 
                   ${this.bankShards < upgrade.cost ? 'disabled' : ''}>
                   PURCHASE</button>`}
            `;
            
            grid.appendChild(card);
        }
    }
    
    updateDistrictProgress() {
        const progress = Math.min(100, this.districtLiberation[this.currentDistrict] + 
                                     Math.floor(this.score / 1000));
        this.districtLiberation[this.currentDistrict] = progress;
        
        if (progress >= 100 && this.currentDistrict < 2) {
            this.currentDistrict++;
        }
    }
}

// Initialize game when page loads
let Game;
window.addEventListener('load', () => {
    Game = new CipherCourier();
    
    // Expose methods for HTML onclick handlers
    Game.start = Game.start.bind(Game);
    Game.showSafehouse = Game.showSafehouse.bind(Game);
    Game.closeSafehouse = Game.closeSafehouse.bind(Game);
    Game.toggleHighContrast = Game.toggleHighContrast.bind(Game);
    Game.purchaseUpgrade = Game.purchaseUpgrade.bind(Game);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CipherCourier;
}
