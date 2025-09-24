// Cipher Courier - Complete Game Engine
// Browser-first endless runner with cryptography theme

class CipherCourier {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameover, safehouse
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game world
        this.speed = 300; // pixels per second
        this.baseSpeed = 300;
        this.distance = 0;
        this.groundY = this.height - 50;
        
        // Player
        this.player = {
            x: 100,
            y: this.groundY - 45,
            width: 35,
            height: 45,
            velocityY: 0,
            jumpForce: -15,
            gravity: 0.8,
            isGrounded: true,
            isSliding: false,
            slideTimer: 0,
            slideHeight: 20,
            normalHeight: 45,
            coyoteTime: 0,
            hasDoubleJump: false
        };
        
        // Game objects
        this.obstacles = [];
        this.shards = [];
        this.relayNodes = [];
        this.particles = [];
        
        // Timers
        this.obstacleTimer = 0;
        this.shardTimer = 0;
        this.relayTimer = 8000; // First relay after 8 seconds
        
        // Game data
        this.score = 0;
        this.runShards = 0;
        this.currentDistrict = 0;
        
        // Persistent data (loaded from localStorage)
        this.bankShards = parseInt(localStorage.getItem('cc-bank-shards') || '0');
        this.highScore = parseInt(localStorage.getItem('cc-high-score') || '0');
        this.unlockedUpgrades = JSON.parse(localStorage.getItem('cc-upgrades') || '[]');
        this.districtProgress = JSON.parse(localStorage.getItem('cc-districts') || '[0,0,0]');
        this.settings = JSON.parse(localStorage.getItem('cc-settings') || '{"highContrast":false}');
        
        // Upgrades system
        this.upgrades = {
            doubleJump: { 
                name: 'Double Jump', 
                cost: 50, 
                description: 'Execute a second jump while airborne for advanced navigation',
                owned: this.unlockedUpgrades.includes('doubleJump')
            },
            coyoteTime: { 
                name: 'Coyote Protocol', 
                cost: 75, 
                description: 'Brief grace period allows jumping shortly after leaving platforms',
                owned: this.unlockedUpgrades.includes('coyoteTime')
            },
            slideCancel: { 
                name: 'Slide Optimization', 
                cost: 80, 
                description: 'Reduces slide recovery time for faster movement sequences',
                owned: this.unlockedUpgrades.includes('slideCancel')
            },
            encryptionTier1: { 
                name: 'Encryption Tier I', 
                cost: 120, 
                description: 'Minor security hazards cause data degradation instead of termination',
                owned: this.unlockedUpgrades.includes('encryptionTier1')
            }
        };
        
        // Initialize
        this.initializeControls();
        this.updateUI();
        this.applySettings();
        this.gameLoop();
        
        console.log('Cipher Courier initialized successfully');
    }
    
    // === CONTROL SYSTEM ===
    initializeControls() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        // Mouse/touch events
        this.canvas.addEventListener('click', () => {
            this.handleJump();
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });
    }
    
    handleKeyDown(e) {
        const key = e.code;
        
        switch(key) {
            case 'Space':
            case 'ArrowUp':
                e.preventDefault();
                this.handleJump();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.handleSlide();
                break;
                
            case 'KeyR':
                if (this.gameState === 'gameover') {
                    this.restartGame();
                }
                break;
                
            case 'KeyS':
                if (this.gameState === 'menu') {
                    this.showSafehouse();
                }
                break;
                
            case 'Escape':
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'safehouse') {
                    this.closeSafehouse();
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        // Handle key releases if needed for future features
    }
    
    handleJump() {
        if (this.gameState === 'playing') {
            this.jump();
        } else if (this.gameState === 'menu') {
            this.startGame();
        } else if (this.gameState === 'gameover') {
            this.restartGame();
        }
    }
    
    handleSlide() {
        if (this.gameState === 'playing') {
            this.slide();
        }
    }
    
    // === PLAYER ACTIONS ===
    jump() {
        if (this.player.isGrounded || this.player.coyoteTime > 0) {
            // Regular jump
            this.player.velocityY = this.player.jumpForce;
            this.player.isGrounded = false;
            this.player.coyoteTime = 0;
            this.player.hasDoubleJump = this.upgrades.doubleJump.owned;
            this.createJumpParticles();
        } else if (this.player.hasDoubleJump && this.player.velocityY > this.player.jumpForce * 0.5) {
            // Double jump
            this.player.velocityY = this.player.jumpForce * 0.75;
            this.player.hasDoubleJump = false;
            this.createDoubleJumpParticles();
        }
    }
    
    slide() {
        if (this.player.isGrounded && !this.player.isSliding) {
            this.player.isSliding = true;
            this.player.slideTimer = this.upgrades.slideCancel.owned ? 400 : 600; // ms
            this.player.height = this.player.slideHeight;
            this.player.y = this.groundY - this.player.slideHeight;
            this.createSlideParticles();
        }
    }
    
    // === GAME STATE MANAGEMENT ===
    startGame() {
        this.resetGameState();
        this.gameState = 'playing';
        this.hideMenu();
        console.log('Game started');
    }
    
    restartGame() {
        this.bankShards += this.runShards;
        this.saveProgress();
        this.startGame();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.showMenu('PAUSED', 'Press ESC to continue');
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        
        // Bank collected shards
        this.bankShards += this.runShards;
        
        // Update district progress
        this.updateDistrictProgress();
        
        // Save all progress
        this.saveProgress();
        
        // Show game over screen
        this.showMenu('MISSION FAILED', 
                     `Score: ${this.score} • Shards: ${this.runShards}`,
                     'Press R to restart or click START MISSION');
                     
        console.log(`Game over. Score: ${this.score}, Shards: ${this.runShards}`);
    }
    
    resetGameState() {
        // Reset player
        this.player.x = 100;
        this.player.y = this.groundY - this.player.normalHeight;
        this.player.height = this.player.normalHeight;
        this.player.velocityY = 0;
        this.player.isGrounded = true;
        this.player.isSliding = false;
        this.player.slideTimer = 0;
        this.player.coyoteTime = 0;
        this.player.hasDoubleJump = false;
        
        // Reset game world
        this.speed = this.baseSpeed;
        this.distance = 0;
        this.score = 0;
        this.runShards = 0;
        
        // Clear objects
        this.obstacles = [];
        this.shards = [];
        this.relayNodes = [];
        this.particles = [];
        
        // Reset timers
        this.obstacleTimer = 0;
        this.shardTimer = 0;
        this.relayTimer = 8000;
        
        this.updateUI();
    }
    
    // === MAIN GAME LOOP ===
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game logic
        if (this.gameState === 'playing') {
            this.update(this.deltaTime);
        }
        
        // Render everything
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Update player
        this.updatePlayer(dt);
        
        // Update spawning
        this.updateSpawning(deltaTime);
        
        // Update objects
        this.updateObjects(dt);
        
        // Check collisions
        this.checkCollisions();
        
        // Update game progression
        this.updateProgression(dt);
        
        // Update particles
        this.updateParticles(dt);
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer(dt) {
        // Handle sliding
        if (this.player.isSliding) {
            this.player.slideTimer -= dt * 1000;
            if (this.player.slideTimer <= 0) {
                this.player.isSliding = false;
                this.player.height = this.player.normalHeight;
                this.player.y = this.groundY - this.player.normalHeight;
            }
        }
        
        // Handle coyote time
        if (!this.player.isGrounded && this.player.coyoteTime > 0) {
            this.player.coyoteTime -= dt;
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
            
            if (!this.player.isGrounded && this.upgrades.coyoteTime.owned) {
                this.player.coyoteTime = 0.15; // 150ms grace period
            }
            
            this.player.isGrounded = true;
            this.player.hasDoubleJump = this.upgrades.doubleJump.owned;
        }
    }
    
    updateSpawning(deltaTime) {
        this.obstacleTimer -= deltaTime;
        this.shardTimer -= deltaTime;
        this.relayTimer -= deltaTime;
        
        // Spawn obstacles
        if (this.obstacleTimer <= 0) {
            this.spawnObstacle();
            // Decrease interval over time for difficulty
            const interval = Math.max(1200, 2500 - this.distance * 2);
            this.obstacleTimer = interval + (Math.random() - 0.5) * 500;
        }
        
        // Spawn shard clusters
        if (this.shardTimer <= 0) {
            this.spawnShardCluster();
            this.shardTimer = 2000 + Math.random() * 3000; // 2-5 seconds
        }
        
        // Spawn relay nodes
        if (this.relayTimer <= 0) {
            this.spawnRelayNode();
            this.relayTimer = 15000 + Math.random() * 10000; // 15-25 seconds
        }
    }
    
    updateObjects(dt) {
        const moveDistance = this.speed * dt;
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= moveDistance;
            
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update shards
        for (let i = this.shards.length - 1; i >= 0; i--) {
            const shard = this.shards[i];
            shard.x -= moveDistance;
            shard.rotation += dt * 3; // Rotate shards
            
            if (shard.x + shard.size < 0) {
                this.shards.splice(i, 1);
            }
        }
        
        // Update relay nodes
        for (let i = this.relayNodes.length - 1; i >= 0; i--) {
            const relay = this.relayNodes[i];
            relay.x -= moveDistance;
            relay.pulse += dt * 4; // Pulsing animation
            
            if (relay.x + relay.width < 0) {
                this.relayNodes.splice(i, 1);
            }
        }
        
        // Gradually increase speed
        this.speed += dt * 8; // Speed increase over time
    }
    
    updateProgression(dt) {
        this.distance += this.speed * dt * 0.01; // Convert to "meters"
        this.score = Math.floor(this.distance * 10) + (this.runShards * 20);
    }
    
    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 400 * dt; // Gravity
            particle.life -= dt;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // === COLLISION SYSTEM ===
    checkCollisions() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };
        
        // Check obstacle collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            if (this.checkRectCollision(playerRect, obstacle)) {
                if (obstacle.type === 'minor' && this.upgrades.encryptionTier1.owned) {
                    // Degradation instead of termination
                    this.runShards = Math.floor(this.runShards * 0.7);
                    this.obstacles.splice(i, 1);
                    this.createHitParticles(obstacle.x, obstacle.y, '#ff4444');
                    console.log('Minor hazard caused data degradation');
                } else {
                    // Game over
                    this.createHitParticles(this.player.x, this.player.y, '#ff4444');
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Check shard collisions
        for (let i = this.shards.length - 1; i >= 0; i--) {
            const shard = this.shards[i];
            const shardRect = {
                x: shard.x - shard.size,
                y: shard.y - shard.size,
                width: shard.size * 2,
                height: shard.size * 2
            };
            
            if (this.checkRectCollision(playerRect, shardRect)) {
                this.runShards++;
                this.score += 20; // Bonus points for collection
                this.createCollectParticles(shard.x, shard.y, '#ff8800');
                this.shards.splice(i, 1);
            }
        }
        
        // Check relay node collisions
        for (let i = this.relayNodes.length - 1; i >= 0; i--) {
            const relay = this.relayNodes[i];
            
            if (this.checkRectCollision(playerRect, relay)) {
                // Bank shards at relay
                this.bankShards += this.runShards;
                this.createRelayParticles(relay.x + relay.width/2, relay.y + relay.height/2);
                this.relayNodes.splice(i, 1);
                this.saveProgress();
                console.log(`Banked ${this.runShards} shards at relay. Total: ${this.bankShards}`);
                this.runShards = 0; // Reset run shards after banking
            }
        }
    }
    
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // === SPAWNING SYSTEM ===
    spawnObstacle() {
        const types = [
            { name: 'firewall', width: 25, height: 70, type: 'major', color: '#ff4444' },
            { name: 'drone', width: 30, height: 18, type: 'minor', color: '#ff8800' },
            { name: 'barrier', width: 35, height: 45, type: 'major', color: '#ff4444' }
        ];
        
        const template = types[Math.floor(Math.random() * types.length)];
        const obstacle = { ...template };
        
        obstacle.x = this.width + 20;
        
        if (template.name === 'drone') {
            // Drones fly at various heights
            obstacle.y = this.groundY - 80 - Math.random() * 60;
        } else {
            // Ground obstacles
            obstacle.y = this.groundY - obstacle.height;
        }
        
        this.obstacles.push(obstacle);
    }
    
    spawnShardCluster() {
        const clusterSize = 3 + Math.floor(Math.random() * 4); // 3-6 shards
        const startX = this.width + 50;
        const pattern = Math.random() > 0.5 ? 'arc' : 'line';
        
        for (let i = 0; i < clusterSize; i++) {
            const shard = {
                x: startX + i * 40,
                y: 0,
                size: 12,
                color: '#ff8800',
                rotation: Math.random() * Math.PI * 2
            };
            
            if (pattern === 'arc') {
                // Arc pattern
                const progress = i / (clusterSize - 1);
                const height = 100 * Math.sin(progress * Math.PI);
                shard.y = this.groundY - 60 - height;
            } else {
                // Line pattern
                shard.y = this.groundY - 60 - Math.random() * 80;
            }
            
            this.shards.push(shard);
        }
    }
    
    spawnRelayNode() {
        const relay = {
            x: this.width + 20,
            y: this.groundY - 60,
            width: 50,
            height: 60,
            color: '#00ffff',
            pulse: 0
        };
        
        this.relayNodes.push(relay);
    }
    
    // === PARTICLE EFFECTS ===
    createJumpParticles() {
        this.createParticles(
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height, 
            '#00ffff', 
            8
        );
    }
    
    createDoubleJumpParticles() {
        this.createParticles(
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height/2, 
            '#00ff88', 
            12
        );
    }
    
    createSlideParticles() {
        this.createParticles(
            this.player.x + this.player.width, 
            this.player.y + this.player.height, 
            '#ffffff', 
            6
        );
    }
    
    createCollectParticles(x, y, color) {
        this.createParticles(x, y, color, 10);
    }
    
    createHitParticles(x, y, color) {
        this.createParticles(x, y, color, 15);
    }
    
    createRelayParticles(x, y) {
        this.createParticles(x, y, '#00ffff', 20);
    }
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200 - 50,
                color: color,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
                alpha: 1,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    // === RENDERING SYSTEM ===
    render() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(0, 17, 34, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing') {
            this.renderBackground();
            this.renderObjects();
            this.renderPlayer();
            this.renderParticles();
        }
    }
    
    renderBackground() {
        // Draw ground
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
        
        // Draw moving grid lines
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        const offset = (this.distance * 20) % 50;
        for (let x = -offset; x < this.width + 50; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // Ground line
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.width, this.groundY);
        this.ctx.stroke();
    }
    
    renderPlayer() {
        const { x, y, width, height } = this.player;
        
        // Player body
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillRect(x, y, width, height);
        
        // Add glow effect
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.shadowBlur = 0;
        
        // Player details (simple face)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x + 8, y + 10, 5, 5); // Left eye
        this.ctx.fillRect(x + 22, y + 10, 5, 5); // Right eye
        
        // Slide indicator
        if (this.player.isSliding) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fillRect(x + width, y + height - 5, 15, 3);
        }
    }
    
    renderObjects() {
        // Render obstacles
        for (const obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add glow effect
            this.ctx.shadowColor = obstacle.color;
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            this.ctx.shadowBlur = 0;
        }
        
        // Render shards
        for (const shard of this.shards) {
            this.ctx.save();
            this.ctx.translate(shard.x, shard.y);
            this.ctx.rotate(shard.rotation);
            
            this.ctx.fillStyle = shard.color;
            this.ctx.fillRect(-shard.size, -shard.size, shard.size * 2, shard.size * 2);
            
            // Glow effect
            this.ctx.shadowColor = shard.color;
            this.ctx.shadowBlur = 6;
            this.ctx.fillRect(-shard.size, -shard.size, shard.size * 2, shard.size * 2);
            this.ctx.shadowBlur = 0;
            
            this.ctx.restore();
        }
        
        // Render relay nodes
        for (const relay of this.relayNodes) {
            const scale = 1 + Math.sin(relay.pulse) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(relay.x + relay.width/2, relay.y + relay.height/2);
            this.ctx.scale(scale, scale);
            
            this.ctx.fillStyle = relay.color;
            this.ctx.fillRect(-relay.width/2, -relay.height/2, relay.width, relay.height);
            
            // Glow effect
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
            this.ctx.fillRect(
                particle.x - particle.size/2, 
                particle.y - particle.size/2, 
                particle.size, 
                particle.size
            );
        }
        this.ctx.globalAlpha = 1;
    }
    
    // === UI MANAGEMENT ===
    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('shards').textContent = this.runShards;
        document.getElementById('bankShards').textContent = this.bankShards;
        
        const districts = ['East Grid', 'Central Hub', 'West Sector'];
        document.getElementById('district').textContent = districts[this.currentDistrict] || 'Unknown';
        
        const liberation = Math.floor(this.districtProgress[this.currentDistrict] || 0);
        document.getElementById('liberation').textContent = `${liberation}%`;
    }
    
    showMenu(title, subtitle, info = '') {
        const menu = document.getElementById('gameMenu');
        menu.style.display = 'flex';
        
        menu.querySelector('h1').textContent = title;
        const paragraphs = menu.querySelectorAll('p');
        if (paragraphs[0]) paragraphs[0].textContent = subtitle;
        if (paragraphs[1]) paragraphs[1].textContent = info;
    }
    
    hideMenu() {
        document.getElementById('gameMenu').style.display = 'none';
    }
    
    // === PERSISTENCE SYSTEM ===
    saveProgress() {
        try {
            localStorage.setItem('cc-bank-shards', this.bankShards.toString());
            localStorage.setItem('cc-high-score', this.highScore.toString());
            localStorage.setItem('cc-upgrades', JSON.stringify(this.unlockedUpgrades));
            localStorage.setItem('cc-districts', JSON.stringify(this.districtProgress));
            localStorage.setItem('cc-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Could not save progress:', error);
        }
    }
    
    updateDistrictProgress() {
        const progressGain = Math.floor(this.score / 1000);
        const currentProgress = this.districtProgress[this.currentDistrict] || 0;
        this.districtProgress[this.currentDistrict] = Math.min(100, currentProgress + progressGain);
        
        // Advance to next district if current is complete
        if (this.districtProgress[this.currentDistrict] >= 100 && this.currentDistrict < 2) {
            this.currentDistrict++;
            console.log(`Advanced to district ${this.currentDistrict + 1}`);
        }
    }
    
    // === UPGRADE SYSTEM ===
    purchaseUpgrade(upgradeKey) {
        const upgrade = this.upgrades[upgradeKey];
        if (!upgrade || upgrade.owned) return false;
        
        if (this.bankShards >= upgrade.cost) {
            this.bankShards -= upgrade.cost;
            upgrade.owned = true;
            this.unlockedUpgrades.push(upgradeKey);
            this.saveProgress();
            this.renderUpgradeGrid();
            this.updateUI();
            console.log(`Purchased upgrade: ${upgrade.name}`);
            return true;
        }
        
        console.log(`Insufficient shards for ${upgrade.name}. Need: ${upgrade.cost}, Have: ${this.bankShards}`);
        return false;
    }
    
    renderUpgradeGrid() {
        const grid = document.getElementById('upgradeGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            const card = document.createElement('div');
            card.className = 'upgrade-card' + (upgrade.owned ? ' owned' : '');
            
            const canAfford = this.bankShards >= upgrade.cost;
            const buttonDisabled = upgrade.owned || !canAfford;
            
            card.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
                <p><strong>Cost: ${upgrade.cost} shards</strong></p>
                ${upgrade.owned ? 
                    '<p style="color: var(--accent-cyan); font-weight: bold;">OWNED</p>' : 
                    `<button class="menu-button" onclick="game.purchaseUpgrade('${key}')" 
                     ${buttonDisabled ? 'disabled' : ''}>
                     ${canAfford ? 'PURCHASE' : 'INSUFFICIENT SHARDS'}
                     </button>`}
            `;
            
            grid.appendChild(card);
        }
    }
    
    // === SETTINGS ===
    applySettings() {
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        }
    }
    
    toggleHighContrast() {
        this.settings.highContrast = !this.settings.highContrast;
        document.body.classList.toggle('high-contrast', this.settings.highContrast);
        this.saveProgress();
        console.log('High contrast toggled:', this.settings.highContrast);
    }
    
    // === SAFEHOUSE INTERFACE ===
    showSafehouse() {
        this.gameState = 'safehouse';
        document.getElementById('gameMenu').style.display = 'none';
        document.getElementById('safehouse').style.display = 'block';
        this.renderUpgradeGrid();
    }
    
    closeSafehouse() {
        this.gameState = 'menu';
        document.getElementById('safehouse').style.display = 'none';
        document.getElementById('gameMenu').style.display = 'flex';
    }
    
    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}Tab`).classList.add('active');
        document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
        
        if (tabName === 'upgrades') {
            this.renderUpgradeGrid();
        }
    }
}

// Initialize game when page loads
let game;

window.addEventListener('load', () => {
    game = new CipherCourier();
    console.log('Cipher Courier loaded successfully');
});

// Global functions for HTML onclick handlers
function startGame() {
    if (game) game.startGame();
}

function showSafehouse() {
    if (game) game.showSafehouse();
}

function closeSafehouse() {
    if (game) game.closeSafehouse();
}

function toggleHighContrast() {
    if (game) game.toggleHighContrast();
}

function showTab(tabName) {
    if (game) game.showTab(tabName);
}

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CipherCourier;
}
