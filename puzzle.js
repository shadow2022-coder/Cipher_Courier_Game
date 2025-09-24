// Cipher Courier - Puzzle System
// Sudoku-inspired lock puzzles for upgrade unlocks

class PuzzleSystem {
    constructor() {
        this.currentPuzzle = null;
        this.selectedCell = null;
        this.onSolveCallback = null;
        this.puzzleData = this.initializePuzzleData();
        
        console.log('Puzzle system initialized');
    }
    
    initializePuzzleData() {
        return {
            "4x4": [
                {
                    "id": "basic_1",
                    "name": "Basic Encryption",
                    "difficulty": "easy",
                    "description": "Entry-level cipher lock for basic network access",
                    "reward": "doubleJump",
                    "grid": [
                        [1, 0, 0, 4],
                        [0, 0, 3, 0],
                        [0, 4, 0, 0],
                        [3, 0, 0, 2]
                    ],
                    "solution": [
                        [1, 2, 4, 3],
                        [4, 3, 2, 1],
                        [2, 4, 1, 3],
                        [3, 1, 4, 2]
                    ]
                },
                {
                    "id": "cipher_2",
                    "name": "Advanced Cipher",
                    "difficulty": "medium",
                    "description": "Intermediate security protocol with enhanced validation",
                    "reward": "coyoteTime",
                    "grid": [
                        [0, 2, 0, 0],
                        [0, 0, 0, 3],
                        [4, 0, 0, 0],
                        [0, 0, 1, 0]
                    ],
                    "solution": [
                        [1, 2, 3, 4],
                        [2, 4, 1, 3],
                        [4, 3, 2, 1],
                        [3, 1, 4, 2]
                    ]
                },
                {
                    "id": "matrix_3",
                    "name": "Matrix Lock",
                    "difficulty": "hard",
                    "description": "High-security matrix requiring expert-level decryption",
                    "reward": "encryptionTier1",
                    "grid": [
                        [0, 0, 3, 0],
                        [0, 1, 0, 4],
                        [2, 0, 0, 0],
                        [0, 0, 0, 1]
                    ],
                    "solution": [
                        [4, 2, 3, 1],
                        [3, 1, 2, 4],
                        [2, 4, 1, 3],
                        [1, 3, 4, 2]
                    ]
                }
            ]
        };
    }
    
    // Create a new puzzle instance
    createPuzzle(size = 4, levelId = null) {
        const puzzleLevel = levelId ? 
            this.puzzleData[`${size}x${size}`].find(p => p.id === levelId) :
            this.puzzleData[`${size}x${size}`][0];
            
        if (!puzzleLevel) {
            console.error(`Puzzle not found: ${size}x${size}, level: ${levelId}`);
            return null;
        }
        
        this.currentPuzzle = {
            size: size,
            level: puzzleLevel,
            grid: puzzleLevel.grid.map(row => [...row]), // Deep copy
            originalGrid: puzzleLevel.grid.map(row => [...row]),
            isComplete: false,
            errors: []
        };
        
        this.selectedCell = null;
        
        console.log(`Created puzzle: ${puzzleLevel.name}`);
        return this.currentPuzzle;
    }
    
    // Set value in a cell
    setCell(row, col, value) {
        if (!this.currentPuzzle) return false;
        if (this.currentPuzzle.originalGrid[row][col] !== 0) return false; // Can't modify preset cells
        if (value < 0 || value > this.currentPuzzle.size) return false;
        
        this.currentPuzzle.grid[row][col] = value;
        return true;
    }
    
    // Get value from a cell
    getCell(row, col) {
        if (!this.currentPuzzle) return 0;
        return this.currentPuzzle.grid[row][col];
    }
    
    // Check if cell is preset (not editable)
    isPresetCell(row, col) {
        if (!this.currentPuzzle) return false;
        return this.currentPuzzle.originalGrid[row][col] !== 0;
    }
    
    // Validate current puzzle state
    validate() {
        if (!this.currentPuzzle) {
            return { valid: false, complete: false, errors: ["No puzzle loaded"] };
        }
        
        const size = this.currentPuzzle.size;
        const grid = this.currentPuzzle.grid;
        const errors = [];
        
        // Check if grid is complete (no zeros)
        let isComplete = true;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (!isComplete) break;
        }
        
        if (!isComplete) {
            return { valid: false, complete: false, errors: ["Puzzle incomplete"] };
        }
        
        // Validate rows
        for (let r = 0; r < size; r++) {
            const seen = new Set();
            for (let c = 0; c < size; c++) {
                const val = grid[r][c];
                if (val !== 0) {
                    if (seen.has(val)) {
                        errors.push(`Duplicate ${val} in row ${r + 1}`);
                    }
                    seen.add(val);
                }
            }
        }
        
        // Validate columns
        for (let c = 0; c < size; c++) {
            const seen = new Set();
            for (let r = 0; r < size; r++) {
                const val = grid[r][c];
                if (val !== 0) {
                    if (seen.has(val)) {
                        errors.push(`Duplicate ${val} in column ${c + 1}`);
                    }
                    seen.add(val);
                }
            }
        }
        
        // Validate 2x2 regions for 4x4 puzzles
        if (size === 4) {
            for (let regionR = 0; regionR < 2; regionR++) {
                for (let regionC = 0; regionC < 2; regionC++) {
                    const seen = new Set();
                    for (let r = regionR * 2; r < (regionR + 1) * 2; r++) {
                        for (let c = regionC * 2; c < (regionC + 1) * 2; c++) {
                            const val = grid[r][c];
                            if (val !== 0) {
                                if (seen.has(val)) {
                                    errors.push(`Duplicate ${val} in region ${regionR * 2 + regionC + 1}`);
                                }
                                seen.add(val);
                            }
                        }
                    }
                }
            }
        }
        
        const valid = errors.length === 0;
        this.currentPuzzle.isComplete = valid;
        this.currentPuzzle.errors = errors;
        
        if (valid && this.onSolveCallback) {
            console.log(`Puzzle solved! Reward: ${this.currentPuzzle.level.reward}`);
            this.onSolveCallback(this.currentPuzzle.level.reward);
        }
        
        return { valid, complete: isComplete, errors };
    }
    
    // Register callback for successful puzzle completion
    onSolved(callback) {
        this.onSolveCallback = callback;
    }
    
    // Get hint for next move
    getHint() {
        if (!this.currentPuzzle) return null;
        
        const solution = this.currentPuzzle.level.solution;
        const grid = this.currentPuzzle.grid;
        const size = this.currentPuzzle.size;
        
        // Find first empty cell that has a known solution
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0 && this.currentPuzzle.originalGrid[r][c] === 0) {
                    return {
                        row: r,
                        col: c,
                        value: solution[r][c],
                        reason: "Next logical step based on constraints"
                    };
                }
            }
        }
        
        return null;
    }
    
    // Reset puzzle to initial state
    reset() {
        if (!this.currentPuzzle) return;
        
        this.currentPuzzle.grid = this.currentPuzzle.originalGrid.map(row => [...row]);
        this.currentPuzzle.isComplete = false;
        this.currentPuzzle.errors = [];
        this.selectedCell = null;
        
        console.log('Puzzle reset');
    }
    
    // Get available puzzles
    getAvailablePuzzles(size = 4) {
        return this.puzzleData[`${size}x${size}`] || [];
    }
    
    // Auto-solve for testing/demonstration
    solve() {
        if (!this.currentPuzzle) return false;
        
        this.currentPuzzle.grid = this.currentPuzzle.level.solution.map(row => [...row]);
        const result = this.validate();
        
        console.log('Puzzle auto-solved');
        return result.valid;
    }
}

// Global puzzle system instance
let puzzleSystem;

// Puzzle UI management functions
function initializePuzzleSystem() {
    if (!puzzleSystem) {
        puzzleSystem = new PuzzleSystem();
        
        // Connect to main game
        if (typeof game !== 'undefined' && game) {
            puzzleSystem.onSolved((rewardId) => {
                if (!game.unlockedUpgrades.includes(rewardId)) {
                    game.unlockedUpgrades.push(rewardId);
                    
                    // Update the specific upgrade
                    if (game.upgrades[rewardId]) {
                        game.upgrades[rewardId].owned = true;
                    }
                    
                    game.saveProgress();
                    updatePuzzleStatus(`🎉 Puzzle solved! ${rewardId} upgrade unlocked!`, 'var(--accent-green)');
                    
                    // Visual feedback
                    if (game.createParticles) {
                        game.createParticles(400, 200, '#00ff88', 20);
                    }
                    
                    console.log(`Unlocked upgrade: ${rewardId}`);
                } else {
                    updatePuzzleStatus(`Puzzle solved, but ${rewardId} was already unlocked`, 'var(--accent-cyan)');
                }
            });
        }
    }
    
    return puzzleSystem;
}

function loadPuzzle(levelId) {
    const system = initializePuzzleSystem();
    const puzzle = system.createPuzzle(4, levelId);
    
    if (!puzzle) {
        updatePuzzleStatus('Failed to load puzzle', 'var(--danger-red)');
        return;
    }
    
    // Update UI
    document.getElementById('puzzleTitle').textContent = puzzle.level.name;
    document.getElementById('puzzleDescription').textContent = 
        `${puzzle.level.description} • Reward: ${puzzle.level.reward}`;
    
    renderPuzzleGrid();
    renderNumberPad();
    updatePuzzleStatus('Solve the puzzle to unlock the upgrade!');
    
    console.log(`Loaded puzzle: ${puzzle.level.name}`);
}

function renderPuzzleGrid() {
    const system = initializePuzzleSystem();
    const puzzle = system.currentPuzzle;
    if (!puzzle) return;
    
    const grid = document.getElementById('puzzleGrid');
    grid.style.gridTemplateColumns = `repeat(${puzzle.size}, 1fr)`;
    grid.innerHTML = '';
    
    for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
            const cell = document.createElement('div');
            const value = puzzle.grid[r][c];
            const isPreset = system.isPresetCell(r, c);
            const isSelected = system.selectedCell && 
                              system.selectedCell.r === r && 
                              system.selectedCell.c === c;
            
            cell.className = 'puzzle-cell';
            if (isPreset) cell.classList.add('preset');
            if (isSelected) cell.classList.add('selected');
            
            cell.textContent = value === 0 ? '' : value;
            
            if (!isPreset) {
                cell.onclick = () => selectPuzzleCell(r, c);
            }
            
            // Add region borders for visual clarity (4x4 with 2x2 regions)
            if (r === 1) cell.style.borderBottomWidth = '4px';
            if (c === 1) cell.style.borderRightWidth = '4px';
            
            grid.appendChild(cell);
        }
    }
}

function renderNumberPad() {
    const system = initializePuzzleSystem();
    const puzzle = system.currentPuzzle;
    if (!puzzle) return;
    
    const pad = document.getElementById('numberPad');
    pad.innerHTML = '';
    
    // Numbers 1-4
    for (let i = 1; i <= puzzle.size; i++) {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.textContent = i;
        button.onclick = () => setPuzzleNumber(i);
        pad.appendChild(button);
    }
    
    // Clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'menu-button';
    clearButton.textContent = 'CLEAR';
    clearButton.onclick = () => setPuzzleNumber(0);
    pad.appendChild(clearButton);
}

function selectPuzzleCell(row, col) {
    const system = initializePuzzleSystem();
    
    if (system.isPresetCell(row, col)) {
        updatePuzzleStatus('Cannot modify preset cells', 'var(--accent-orange)');
        return;
    }
    
    system.selectedCell = { r: row, c: col };
    renderPuzzleGrid();
    updatePuzzleStatus(`Selected cell (${row + 1}, ${col + 1})`);
}

function setPuzzleNumber(value) {
    const system = initializePuzzleSystem();
    
    if (!system.selectedCell) {
        updatePuzzleStatus('Please select a cell first', 'var(--accent-orange)');
        return;
    }
    
    const { r, c } = system.selectedCell;
    
    if (system.setCell(r, c, value)) {
        renderPuzzleGrid();
        const displayValue = value === 0 ? 'cleared' : value;
        updatePuzzleStatus(`Cell (${r + 1}, ${c + 1}) set to ${displayValue}`);
        
        // Auto-validate if puzzle looks complete
        let hasEmpty = false;
        const puzzle = system.currentPuzzle;
        for (let row = 0; row < puzzle.size; row++) {
            for (let col = 0; col < puzzle.size; col++) {
                if (puzzle.grid[row][col] === 0) {
                    hasEmpty = true;
                    break;
                }
            }
            if (hasEmpty) break;
        }
        
        if (!hasEmpty) {
            setTimeout(() => validatePuzzle(), 500); // Auto-validate after brief delay
        }
    } else {
        updatePuzzleStatus('Cannot modify this cell', 'var(--danger-red)');
    }
}

function validatePuzzle() {
    const system = initializePuzzleSystem();
    const result = system.validate();
    
    if (result.valid) {
        updatePuzzleStatus('🎉 Puzzle solved! Upgrade unlocked!', 'var(--accent-green)');
        
        // Disable the grid to show completion
        const cells = document.querySelectorAll('.puzzle-cell');
        cells.forEach(cell => {
            cell.style.pointerEvents = 'none';
            cell.style.opacity = '0.8';
        });
        
    } else if (result.complete) {
        updatePuzzleStatus(`❌ Errors found: ${result.errors.join(', ')}`, 'var(--danger-red)');
    } else {
        updatePuzzleStatus('⚠️ Puzzle is not yet complete', 'var(--accent-orange)');
    }
}

function resetPuzzle() {
    const system = initializePuzzleSystem();
    system.reset();
    renderPuzzleGrid();
    updatePuzzleStatus('Puzzle reset to initial state');
    
    // Re-enable the grid
    const cells = document.querySelectorAll('.puzzle-cell');
    cells.forEach(cell => {
        cell.style.pointerEvents = 'auto';
        cell.style.opacity = '1';
    });
}

function getHint() {
    const system = initializePuzzleSystem();
    const hint = system.getHint();
    
    if (hint) {
        updatePuzzleStatus(
            `💡 Hint: Try placing ${hint.value} at row ${hint.row + 1}, column ${hint.col + 1}`, 
            'var(--accent-orange)'
        );
        
        // Auto-select the hint cell
        system.selectedCell = { r: hint.row, c: hint.col };
        renderPuzzleGrid();
    } else {
        updatePuzzleStatus('No hints available - puzzle may be complete or invalid', 'var(--text-secondary)');
    }
}

function updatePuzzleStatus(message, color = 'var(--text-secondary)') {
    const status = document.getElementById('puzzleStatus');
    if (status) {
        status.textContent = message;
        status.style.color = color;
        console.log('Puzzle status:', message);
    }
}

// Initialize puzzle system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the main game to initialize
    setTimeout(() => {
        initializePuzzleSystem();
    }, 100);
});

// Also initialize if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        initializePuzzleSystem();
    }, 100);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuzzleSystem, initializePuzzleSystem };
}
