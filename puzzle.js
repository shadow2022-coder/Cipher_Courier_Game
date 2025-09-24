// Cipher Courier - Lock Puzzle System
// Sudoku-inspired 4x4 and 6x6 grid puzzles for upgrade unlocks

class PuzzleSystem {
    constructor() {
        this.currentPuzzle = null;
        this.selectedCell = null;
        this.onSolveCallback = null;
        this.puzzleData = this.loadPuzzleData();
    }
    
    loadPuzzleData() {
        // Default puzzle levels - can be loaded from JSON
        return {
            "4x4": [
                {
                    "id": "basic_1",
                    "name": "Basic Encryption",
                    "difficulty": "easy",
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
                    ],
                    "reward": "doubleJump"
                },
                {
                    "id": "cipher_2",
                    "name": "Advanced Cipher",
                    "difficulty": "medium",
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
                    ],
                    "reward": "coyoteTime"
                },
                {
                    "id": "matrix_3",
                    "name": "Matrix Lock",
                    "difficulty": "hard",
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
                    ],
                    "reward": "encryptionTier1"
                }
            ]
        };
    }
    
    // Create a new puzzle instance
    create(size = 4, levelId = null) {
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
        if (!this.currentPuzzle) return { valid: false, errors: ["No puzzle loaded"] };
        
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
            this.onSolveCallback(this.currentPuzzle.level.reward);
        }
        
        return { valid, complete: isComplete, errors };
    }
    
    // Register callback for successful puzzle completion
    onSolved(callback) {
        this.onSolveCallback = callback;
    }
    
    // Get hint for next move (optional helper)
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
                        reason: "Next logical step"
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
    }
    
    // Get available puzzles
    getAvailablePuzzles(size = 4) {
        return this.puzzleData[`${size}x${size}`] || [];
    }
    
    // Auto-solve (for testing)
    solve() {
        if (!this.currentPuzzle) return false;
        
        this.currentPuzzle.grid = this.currentPuzzle.level.solution.map(row => [...row]);
        return this.validate().valid;
    }
}

// UI Controller for puzzle interface
class PuzzleUI {
    constructor(containerId, puzzleSystem) {
        this.container = document.getElementById(containerId);
        this.puzzleSystem = puzzleSystem;
        this.selectedCell = null;
        
        if (!this.container) {
            console.error(`Puzzle container not found: ${containerId}`);
            return;
        }
        
        this.setupUI();
    }
    
    setupUI() {
        this.container.innerHTML = `
            <div id="puzzleHeader" style="text-align: center; margin-bottom: 20px;">
                <h3 id="puzzleTitle" style="color: var(--accent-cyan);">Select a Puzzle</h3>
                <p id="puzzleDescription" style="color: var(--text-secondary);"></p>
            </div>
            
            <div id="puzzleSelector" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
                <button class="menu-button" onclick="PuzzleUI.loadPuzzle('basic_1')">Basic</button>
                <button class="menu-button" onclick="PuzzleUI.loadPuzzle('cipher_2')">Cipher</button>
                <button class="menu-button" onclick="PuzzleUI.loadPuzzle('matrix_3')">Matrix</button>
            </div>
            
            <div id="puzzleGrid" style="display: grid; gap: 2px; justify-content: center; margin: 20px 0;">
            </div>
            
            <div id="puzzleControls" style="text-align: center; margin: 20px 0;">
                <div id="numberPad" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; max-width: 200px; margin: 0 auto 15px;">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="menu-button" onclick="PuzzleUI.validatePuzzle()">Validate</button>
                    <button class="menu-button" onclick="PuzzleUI.resetPuzzle()">Reset</button>
                    <button class="menu-button" onclick="PuzzleUI.getHint()">Hint</button>
                </div>
            </div>
            
            <div id="puzzleStatus" style="text-align: center; min-height: 20px; color: var(--text-secondary);">
            </div>
        `;
        
        // Store reference for global access
        window.PuzzleUI = this;
    }
    
    loadPuzzle(levelId) {
        const puzzle = this.puzzleSystem.create(4, levelId);
        if (!puzzle) return;
        
        document.getElementById('puzzleTitle').textContent = puzzle.level.name;
        document.getElementById('puzzleDescription').textContent = `Reward: ${puzzle.level.reward}`;
        
        this.renderGrid();
        this.renderNumberPad();
        this.updateStatus("Solve the puzzle to unlock the upgrade!");
    }
    
    renderGrid() {
        const puzzle = this.puzzleSystem.currentPuzzle;
        if (!puzzle) return;
        
        const grid = document.getElementById('puzzleGrid');
        grid.style.gridTemplateColumns = `repeat(${puzzle.size}, 1fr)`;
        grid.style.width = '280px';
        grid.style.height = '280px';
        
        grid.innerHTML = '';
        
        for (let r = 0; r < puzzle.size; r++) {
            for (let c = 0; c < puzzle.size; c++) {
                const cell = document.createElement('div');
                const value = puzzle.grid[r][c];
                const isPreset = this.puzzleSystem.isPresetCell(r, c);
                
                cell.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${isPreset ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.5)'};
                    border: 2px solid ${this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c ? 'var(--accent-green)' : 'var(--accent-cyan)'};
                    color: ${isPreset ? 'var(--accent-cyan)' : 'var(--text-primary)'};
                    font-size: 24px;
                    font-weight: bold;
                    cursor: ${isPreset ? 'default' : 'pointer'};
                    user-select: none;
                    transition: all 0.2s ease;
                `;
                
                cell.textContent = value === 0 ? '' : value;
                cell.onclick = () => this.selectCell(r, c);
                
                // Add region borders for visual clarity
                if (r === 1) cell.style.borderBottomWidth = '3px';
                if (c === 1) cell.style.borderRightWidth = '3px';
                
                grid.appendChild(cell);
            }
        }
    }
    
    renderNumberPad() {
        const puzzle = this.puzzleSystem.currentPuzzle;
        if (!puzzle) return;
        
        const pad = document.getElementById('numberPad');
        pad.innerHTML = '';
        
        // Numbers 1-4
        for (let i = 1; i <= puzzle.size; i++) {
            const button = document.createElement('button');
            button.className = 'menu-button';
            button.textContent = i;
            button.onclick = () => this.setNumber(i);
            pad.appendChild(button);
        }
        
        // Clear button
        const clearButton = document.createElement('button');
        clearButton.className = 'menu-button';
        clearButton.textContent = 'X';
        clearButton.style.gridColumn = 'span 2';
        clearButton.onclick = () => this.setNumber(0);
        pad.appendChild(clearButton);
    }
    
    selectCell(row, col) {
        if (this.puzzleSystem.isPresetCell(row, col)) return;
        
        this.selectedCell = { r: row, c: col };
        this.renderGrid();
    }
    
    setNumber(value) {
        if (!this.selectedCell) {
            this.updateStatus("Select a cell first!");
            return;
        }
        
        if (this.puzzleSystem.setCell(this.selectedCell.r, this.selectedCell.c, value)) {
            this.renderGrid();
            this.updateStatus(`Set ${this.selectedCell.r + 1},${this.selectedCell.c + 1} = ${value || 'empty'}`);
        }
    }
    
    validatePuzzle() {
        const result = this.puzzleSystem.validate();
        
        if (result.valid) {
            this.updateStatus("🎉 Puzzle solved! Upgrade unlocked!", 'var(--accent-green)');
        } else if (result.complete) {
            this.updateStatus(`❌ Errors: ${result.errors.join(', ')}`, 'var(--danger-red)');
        } else {
            this.updateStatus("⚠️ Puzzle incomplete", 'var(--accent-orange)');
        }
    }
    
    resetPuzzle() {
        this.puzzleSystem.reset();
        this.selectedCell = null;
        this.renderGrid();
        this.updateStatus("Puzzle reset to initial state");
    }
    
    getHint() {
        const hint = this.puzzleSystem.getHint();
        if (hint) {
            this.updateStatus(`💡 Try ${hint.value} at row ${hint.row + 1}, column ${hint.col + 1}`, 'var(--accent-orange)');
            this.selectedCell = { r: hint.row, c: hint.col };
            this.renderGrid();
        } else {
            this.updateStatus("No hints available");
        }
    }
    
    updateStatus(message, color = 'var(--text-secondary)') {
        const status = document.getElementById('puzzleStatus');
        status.textContent = message;
        status.style.color = color;
    }
}

// Initialize puzzle system
let puzzleSystem;
let puzzleUI;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePuzzles);
} else {
    initializePuzzles();
}

function initializePuzzles() {
    puzzleSystem = new PuzzleSystem();
    
    // Register solve callback to integrate with main game
    puzzleSystem.onSolved((rewardId) => {
        if (window.Game && Game.purchaseUpgrade) {
            // Automatically unlock the upgrade
            Game.unlockedUpgrades.push(rewardId);
            Game.initializeUpgrades();
            Game.saveGameData();
            console.log(`Puzzle reward unlocked: ${rewardId}`);
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuzzleSystem, PuzzleUI };
}
