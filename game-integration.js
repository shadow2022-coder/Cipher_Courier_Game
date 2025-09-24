// Cipher Courier - Game + Puzzle Integration
// This extends the main game with puzzle system integration

// Add puzzle integration methods to the CipherCourier class
CipherCourier.prototype.initializePuzzleSystem = function() {
    this.puzzleSystem = new PuzzleSystem();
    this.selectedCell = null;
    this.currentTab = 'upgrades';
    
    // Register solve callback
    this.puzzleSystem.onSolved((rewardId) => {
        if (!this.unlockedUpgrades.includes(rewardId)) {
            this.unlockedUpgrades.push(rewardId);
            this.initializeUpgrades();
            this.saveGameData();
            this.updatePuzzleStatus(`🎉 Puzzle solved! ${rewardId} unlocked!`, 'var(--accent-green)');
            this.createParticles(400, 200, '#00ff88', 20);
        }
    });
};

// Tab switching in safehouse
CipherCourier.prototype.showTab = function(tabName) {
    this.currentTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`[onclick="Game.showTab('${tabName}')"]`).classList.add('active');
    
    if (tabName === 'puzzles') {
        this.renderPuzzleInterface();
    }
};

// Puzzle interface methods
CipherCourier.prototype.loadPuzzle = function(levelId) {
    const puzzle = this.puzzleSystem.create(4, levelId);
    if (!puzzle) return;
    
    document.getElementById('puzzleTitle').textContent = puzzle.level.name;
    document.getElementById('puzzleDescription').textContent = `Reward: ${puzzle.level.reward}`;
    
    this.renderPuzzleGrid();
    this.renderNumberPad();
    this.updatePuzzleStatus("Solve the puzzle to unlock the upgrade!");
};

CipherCourier.prototype.renderPuzzleGrid = function() {
    const puzzle = this.puzzleSystem.currentPuzzle;
    if (!puzzle) return;
    
    const grid = document.getElementById('puzzleGrid');
    grid.style.gridTemplateColumns = `repeat(${puzzle.size}, 1fr)`;
    grid.innerHTML = '';
    
    for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
            const cell = document.createElement('div');
            const value = puzzle.grid[r][c];
            const isPreset = this.puzzleSystem.isPresetCell(r, c);
            
            cell.className = 'puzzle-cell';
            if (isPreset) cell.classList.add('preset');
            if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                cell.classList.add('selected');
            }
            
            cell.textContent = value === 0 ? '' : value;
            cell.onclick = () => this.selectPuzzleCell(r, c);
            
            // Add region borders for visual clarity
            if (r === 1) cell.style.borderBottomWidth = '3px';
            if (c === 1) cell.style.borderRightWidth = '3px';
            
            grid.appendChild(cell);
        }
    }
};

CipherCourier.prototype.renderNumberPad = function() {
    const puzzle = this.puzzleSystem.currentPuzzle;
    if (!puzzle) return;
    
    const pad = document.getElementById('numberPad');
    pad.innerHTML = '';
    
    // Numbers 1-4
    for (let i = 1; i <= puzzle.size; i++) {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.textContent = i;
        button.onclick = () => this.setPuzzleNumber(i);
        pad.appendChild(button);
    }
    
    // Clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'menu-button';
    clearButton.textContent = 'Clear';
    clearButton.onclick = () => this.setPuzzleNumber(0);
    pad.appendChild(clearButton);
};

CipherCourier.prototype.selectPuzzleCell = function(row, col) {
    if (this.puzzleSystem.isPresetCell(row, col)) return;
    
    this.selectedCell = { r: row, c: col };
    this.renderPuzzleGrid();
};

CipherCourier.prototype.setPuzzleNumber = function(value) {
    if (!this.selectedCell) {
        this.updatePuzzleStatus("Select a cell first!");
        return;
    }
    
    if (this.puzzleSystem.setCell(this.selectedCell.r, this.selectedCell.c, value)) {
        this.renderPuzzleGrid();
        const displayValue = value === 0 ? 'empty' : value;
        this.updatePuzzleStatus(`Set cell (${this.selectedCell.r + 1},${this.selectedCell.c + 1}) = ${displayValue}`);
    }
};

CipherCourier.prototype.validatePuzzle = function() {
    const result = this.puzzleSystem.validate();
    
    if (result.valid) {
        this.updatePuzzleStatus("🎉 Puzzle solved! Upgrade unlocked!", 'var(--accent-green)');
    } else if (result.complete) {
        this.updatePuzzleStatus(`❌ Errors: ${result.errors.join(', ')}`, 'var(--danger-red)');
    } else {
        this.updatePuzzleStatus("⚠️ Puzzle incomplete", 'var(--accent-orange)');
    }
};

CipherCourier.prototype.resetPuzzle = function() {
    this.puzzleSystem.reset();
    this.selectedCell = null;
    this.renderPuzzleGrid();
    this.updatePuzzleStatus("Puzzle reset to initial state");
};

CipherCourier.prototype.getHint = function() {
    const hint = this.puzzleSystem.getHint();
    if (hint) {
        this.updatePuzzleStatus(`💡 Try ${hint.value} at row ${hint.row + 1}, column ${hint.col + 1}`, 'var(--accent-orange)');
        this.selectedCell = { r: hint.row, c: hint.col };
        this.renderPuzzleGrid();
    } else {
        this.updatePuzzleStatus("No hints available");
    }
};

CipherCourier.prototype.updatePuzzleStatus = function(message, color = 'var(--text-secondary)') {
    const status = document.getElementById('puzzleStatus');
    if (status) {
        status.textContent = message;
        status.style.color = color;
    }
};

CipherCourier.prototype.renderPuzzleInterface = function() {
    // Initialize puzzle interface if not already done
    if (!this.puzzleSystem.currentPuzzle) {
        this.updatePuzzleStatus("Select a puzzle to begin solving lock challenges");
    }
};

// Extend the original showSafehouse method
const originalShowSafehouse = CipherCourier.prototype.showSafehouse;
CipherCourier.prototype.showSafehouse = function() {
    originalShowSafehouse.call(this);
    this.currentTab = 'upgrades';
    
    // Ensure puzzle system is initialized
    if (!this.puzzleSystem) {
        this.initializePuzzleSystem();
    }
};

// Extend the original constructor to include puzzle system
const originalConstructor = CipherCourier;
CipherCourier = function() {
    originalConstructor.call(this);
    this.initializePuzzleSystem();
};

// Copy prototype
CipherCourier.prototype = originalConstructor.prototype;
CipherCourier.prototype.constructor = CipherCourier;

// Integration test function
CipherCourier.prototype.testIntegration = function() {
    console.log('Testing Cipher Courier integration...');
    
    // Test puzzle system
    if (this.puzzleSystem) {
        console.log('✅ Puzzle system initialized');
        const testPuzzle = this.puzzleSystem.create(4, 'basic_1');
        if (testPuzzle) {
            console.log('✅ Puzzle loading works');
        } else {
            console.log('❌ Puzzle loading failed');
        }
    } else {
        console.log('❌ Puzzle system not initialized');
    }
    
    // Test persistence
    const testKey = 'cipher-courier-test';
    localStorage.setItem(testKey, 'test');
    if (localStorage.getItem(testKey) === 'test') {
        localStorage.removeItem(testKey);
        console.log('✅ LocalStorage working');
    } else {
        console.log('❌ LocalStorage not working');
    }
    
    // Test canvas
    if (this.ctx && this.ctx.fillRect) {
        console.log('✅ Canvas context working');
    } else {
        console.log('❌ Canvas context not working');
    }
    
    console.log('Integration test complete');
};
