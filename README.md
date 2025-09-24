# Cipher Courier 🏃‍♂️💨

A fast-paced, lightweight endless runner set in the neon megacity of **Lattice-9**. Navigate corporate firewalls, collect encrypted data shards, and solve Sudoku-style lock puzzles to liberate the city's network from monopolistic control.

## 🎮 Play Now

**Live Game:** [https://YOUR-USERNAME.github.io/cipher-courier](https://YOUR-USERNAME.github.io/cipher-courier)

*(Replace `YOUR-USERNAME` with your actual GitHub username)*

## 🚀 Features

### Core Gameplay
- **Endless Runner**: Auto-scrolling cyberpunk cityscape with smooth 60fps gameplay
- **Jump & Slide**: Responsive controls with advanced movement upgrades
- **Obstacle Variety**: Dodge firewalls, drones, and security barriers
- **Shard Collection**: Gather key-shards for upgrades and progression
- **Relay Banking**: Save progress mid-run at network relay nodes

### Progression System
- **4 Upgrades**: Double Jump, Coyote Time, Slide Optimization, Encryption Tier I
- **3 Districts**: East Grid → Central Hub → West Sector
- **Persistent Progress**: All data saved locally in browser
- **High Score Tracking**: Beat your personal best

### Lock Puzzles
- **3 Sudoku-style Puzzles**: 4×4 grids with unique constraints
- **Upgrade Rewards**: Solve puzzles to unlock permanent abilities
- **Brain Break**: Optional cognitive challenges between action runs

## 🎯 Controls

| Action | Key/Input |
|--------|-----------|
| Jump | `Space`, `Up Arrow`, or `Click` |
| Slide | `Down Arrow` |
| Restart | `R` (when game over) |
| Safehouse | `S` (from menu) |
| Pause/Menu | `Escape` |

## 🏗️ GitHub Pages Setup

### Quick Deploy (5 minutes)

1. **Fork/Download** this repository to your GitHub account
2. **Go to Settings** → **Pages** in your repository
3. **Set Source** to "Deploy from a branch"
4. **Choose Branch**: `main` and **Folder**: `/ (root)`
5. **Save** and wait 2-3 minutes
6. **Visit**: `https://YOUR-USERNAME.github.io/REPOSITORY-NAME`

### Files Included

```
cipher-courier/
├── index.html       # Main game page (complete with CSS)
├── game.js          # Core game engine
├── puzzle.js        # Sudoku puzzle system
├── .nojekyll        # Ensures GitHub Pages works properly
└── README.md        # This file
```

### Troubleshooting

**Game not loading?**
- Check browser console (F12) for JavaScript errors
- Ensure all files are in repository root (not in subfolders)
- Wait 5-10 minutes after pushing changes
- Try hard refresh (Ctrl+F5)

**404 on JavaScript files?**
- Verify `.nojekyll` file exists in repository root
- Check that file names match exactly (case-sensitive)
- Ensure repository is public or Pages is enabled for private repos

## 🎨 Game Features

### Upgrades Available
1. **Double Jump** (50 shards) - Execute mid-air jump for advanced navigation
2. **Coyote Protocol** (75 shards) - Brief grace period for late jumps
3. **Slide Optimization** (80 shards) - Faster slide recovery time
4. **Encryption Tier I** (120 shards) - Survive minor hazards with data degradation

### Lock Puzzles
1. **Basic Encryption** → Unlocks Double Jump
2. **Advanced Cipher** → Unlocks Coyote Protocol
3. **Matrix Lock** → Unlocks Encryption Tier I

Each puzzle uses 4×4 Sudoku rules: place numbers 1-4 so each row, column, and 2×2 region contains each number exactly once.

## 💾 Technical Details

### Performance Optimized
- **Vanilla JavaScript** - No frameworks, fast loading
- **Canvas Rendering** - Smooth 60fps on modest hardware
- **LocalStorage** - Persistent progress without servers
- **Mobile Friendly** - Responsive design with touch controls

### Browser Support
- Chrome 60+ ✅
- Firefox 55+ ✅
- Safari 12+ ✅
- Edge 79+ ✅

### Accessibility
- High-contrast mode toggle
- Keyboard-only navigation
- Clear visual feedback
- Mobile-responsive design

## 🛠️ Development

### Local Testing
```bash
# Clone repository
git clone https://github.com/YOUR-USERNAME/cipher-courier.git
cd cipher-courier

# Serve locally (choose one)
python3 -m http.server 8000          # Python
npx http-server                       # Node.js
php -S localhost:8000                 # PHP

# Open http://localhost:8000
```

### File Structure
- **index.html**: Complete game with embedded CSS
- **game.js**: Main game loop, physics, collision detection, UI
- **puzzle.js**: Sudoku engine with validation and rewards
- **.nojekyll**: Prevents Jekyll processing on GitHub Pages

### Adding Content

**New Obstacles:**
Edit `spawnObstacle()` in `game.js` to add obstacle types.

**New Upgrades:**
Add entries to the `upgrades` object in the game constructor.

**New Puzzles:**
Add puzzle data to `initializePuzzleData()` in `puzzle.js`.

## 🎵 Story & Theme

Navigate **Lattice-9**, a neon megacity where corporate entities throttle public bandwidth through "walled gardens." As a **Cipher Courier**, you deliver encrypted data packets that gradually restore free information flow across districts.

### Districts
- **East Grid**: Starting area with basic infrastructure
- **Central Hub**: Commercial zone with advanced security
- **West Sector**: High-security corporate stronghold

Each successful run contributes to district liberation, unlocking new narrative elements and visual themes.

## 🐛 Known Issues

- Audio system not yet implemented
- Limited visual assets (CSS-based graphics)
- Puzzle UI optimized for desktop (mobile improvements planned)

## 📝 License

MIT License - Feel free to fork, modify, and share!

## 🤝 Contributing

1. Fork the repository
2. Make your changes
3. Test locally to ensure compatibility
4. Submit a pull request with clear description

This game was designed to run on low-end hardware and work offline, making it accessible to players with modest internet connections and older devices.

---

**Ready to liberate Lattice-9?** 🌆⚡

Deploy to GitHub Pages and start your first courier mission!

## 🔧 Quick Start Checklist

- [ ] Repository created with all files
- [ ] `.nojekyll` file present in root
- [ ] GitHub Pages enabled in Settings
- [ ] Source set to "main" branch, root folder
- [ ] Live URL accessible: `https://YOUR-USERNAME.github.io/REPO-NAME`
- [ ] Game loads and "START MISSION" button works
- [ ] Console shows no JavaScript errors (F12 to check)

🎮 **Game working?** You're ready to play! Share your high score! 🚀
