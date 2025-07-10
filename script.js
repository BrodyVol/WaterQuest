// Reset only the current game (not high score)
function resetGameOnly() {
  if (gameActive) {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
  }
  currentCans = 0;
  timeLeft = 30;
  milestonesShown = [];
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('gameover-modal').style.display = 'none';
  createGrid(); // This will only clear icons/effects if grid already exists
}

// Reset everything including high score
function resetAll() {
  resetGameOnly();
  highScore = 0;
  localStorage.removeItem('waterquest-highscore');
  document.getElementById('high-score').textContent = highScore;
}
// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let highScore = 0;           // Highest score across all games
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let timerInterval;           // Holds the interval for the timer
let timeLeft = 30;           // Time left in seconds

// Difficulty settings
let currentDifficulty = 'normal';
let spawnRate = 1000; // ms
let iconLinger = 100; // ms, how long icons stay after click
let biohazardChance = 0.2;
let plusChance = 0.15;

function setDifficulty(diff) {
  currentDifficulty = diff;
  if (diff === 'easy') {
    timeLeft = 35;
    spawnRate = 1100; // Slower spawns (1.1s)
    iconLinger = 1500; // Icons stay even longer (1.5s)
    biohazardChance = 0.13;
    plusChance = 0.27;
  } else if (diff === 'hard') {
    timeLeft = 25;
    spawnRate = 600; // Icons spawn faster
    iconLinger = 30; // Icons disappear very quickly (0.03s)
    biohazardChance = 0.32;
    plusChance = 0.10;
  } else {
    // normal
    timeLeft = 30;
    spawnRate = 1000;
    iconLinger = 100;
    biohazardChance = 0.2;
    plusChance = 0.15;
  }
  document.getElementById('timer').textContent = timeLeft;
}

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  // Only create grid cells if they don't already exist
  if (grid.children.length !== 9) {
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell'; // Each cell represents a grid square
      grid.appendChild(cell);
    }
  } else {
    // If grid cells exist, just clear their icons/effects
    clearGridIcons();
  }
}

// Ensure the grid is created when the page loads
createGrid();
// Load high score from localStorage if available
if (localStorage.getItem('waterquest-highscore')) {
  highScore = parseInt(localStorage.getItem('waterquest-highscore'), 10) || 0;
}
document.getElementById('high-score').textContent = highScore;

// Spawns a new item in a random grid cell (can, biohazard, or plus)

// Utility to clear only icons and effects from grid cells, not the grid cells themselves
function clearGridIcons() {
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => {
    // Remove icon wrappers (but NOT grid cells)
    const iconWrappers = cell.querySelectorAll('.water-can-wrapper, .biohazard-wrapper, .plus-icon, .plus-wrapper');
    iconWrappers.forEach(wrapper => {
      if (wrapper.parentElement === cell) wrapper.remove();
    });
    // Remove burst/droplet effects
    const effects = cell.querySelectorAll('.burst, .droplet');
    effects.forEach(effect => {
      if (effect.parentElement === cell) effect.remove();
    });
  });
}

function spawnWaterCan() {
  if (!gameActive) return;
  // Only clear icons/effects, not grid cells
  clearGridIcons();
  const grid = document.querySelector('.game-grid');
  // Ensure grid always has 9 grid cells
  if (grid.children.length !== 9) {
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      grid.appendChild(cell);
    }
  }
  const cells = document.querySelectorAll('.grid-cell');

  // Decide which icon to spawn based on difficulty
  const rand = Math.random();
  let iconType = 'watercan';
  if (rand < biohazardChance) {
    iconType = 'biohazard';
  } else if (rand < biohazardChance + plusChance) {
    iconType = 'plus';
  }
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Remove any previous icon wrappers (should already be handled by clearGridIcons)

  if (iconType === 'biohazard') {
    // Create biohazard icon wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'biohazard-wrapper';
    wrapper.innerHTML = `
      <div class="biohazard" title="Biohazard -3s">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#FFC907" stroke="#003366" stroke-width="3"/>
          <g stroke="#003366" stroke-width="2" stroke-linecap="round">
            <path d="M32 32 m-10 0 a10 10 0 1 1 20 0 a10 10 0 1 1 -20 0" fill="none"/>
            <path d="M32 32 m-16 -8 a18 18 0 0 1 32 0" fill="none"/>
            <path d="M32 32 m-16 8 a18 18 0 0 0 32 0" fill="none"/>
            <circle cx="32" cy="32" r="4" fill="#003366"/>
          </g>
        </svg>
      </div>
    `;
    randomCell.appendChild(wrapper);
    const biohazard = wrapper.querySelector('.biohazard');
    if (biohazard) {
      biohazard.addEventListener('click', function handleBioClick(e) {
        if (!gameActive) return;
        timeLeft = Math.max(0, timeLeft - 3);
        document.getElementById('timer').textContent = timeLeft;
        biohazard.removeEventListener('click', handleBioClick);
        if (typeof playSound === 'function') playSound('biohazard');
        // Red burst effect (now lingers 1.5s longer)
        const burst = document.createElement('div');
        burst.style.position = 'absolute';
        burst.style.left = '50%';
        burst.style.top = '50%';
        burst.style.transform = 'translate(-50%, -50%)';
        burst.style.width = '60px';
        burst.style.height = '60px';
        burst.style.borderRadius = '50%';
        burst.style.background = 'rgba(245,64,44,0.35)';
        burst.style.pointerEvents = 'none';
        burst.style.zIndex = '10';
        burst.style.animation = 'burst-fade 2.35s linear forwards';
        randomCell.appendChild(burst);
        setTimeout(() => {
          if (wrapper.parentElement) wrapper.remove();
          if (burst.parentElement) burst.parentElement.remove();
        }, iconLinger + 1500);
      });
    }
  } else if (iconType === 'plus') {
    // Create plus icon wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'biohazard-wrapper';
    wrapper.style.background = '#eafff0';
    wrapper.innerHTML = `
      <div class="plus-icon" title="Bonus +2s" style="width:38px;height:38px;display:block;cursor:pointer;">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#4FCB53" stroke="#003366" stroke-width="3"/>
          <g>
            <rect x="28" y="16" width="8" height="32" rx="3" fill="#fff"/>
            <rect x="16" y="28" width="32" height="8" rx="3" fill="#fff"/>
            <rect x="28" y="16" width="8" height="32" rx="3" fill="#159A48" fill-opacity=".18"/>
            <rect x="16" y="28" width="32" height="8" rx="3" fill="#159A48" fill-opacity=".18"/>
          </g>
        </svg>
      </div>
    `;
    randomCell.appendChild(wrapper);
    const plusIcon = wrapper.querySelector('.plus-icon');
    if (plusIcon) {
      plusIcon.addEventListener('click', function handlePlusClick(e) {
        if (!gameActive) return;
        timeLeft = Math.min(timeLeft + 2, 99); // Cap at 99s for sanity
        document.getElementById('timer').textContent = timeLeft;
        plusIcon.removeEventListener('click', handlePlusClick);
        if (typeof playSound === 'function') playSound('plus');
        // Green burst effect (now lingers 1.5s longer)
        const burst = document.createElement('div');
        burst.style.position = 'absolute';
        burst.style.left = '50%';
        burst.style.top = '50%';
        burst.style.transform = 'translate(-50%, -50%)';
        burst.style.width = '60px';
        burst.style.height = '60px';
        burst.style.borderRadius = '50%';
        burst.style.background = 'rgba(79,203,83,0.35)';
        burst.style.pointerEvents = 'none';
        burst.style.zIndex = '10';
        burst.style.animation = 'burst-fade 2.35s linear forwards';
        randomCell.appendChild(burst);
        setTimeout(() => {
          if (wrapper.parentElement) wrapper.remove();
          if (burst.parentElement) burst.parentElement.remove();
        }, iconLinger + 1500);
      });
    }
  } else {
    // Normal water can
    const wrapper = document.createElement('div');
    wrapper.className = 'water-can-wrapper';
    wrapper.innerHTML = `<div class="water-can"></div>`;
    randomCell.appendChild(wrapper);
    const waterCan = wrapper.querySelector('.water-can');
    if (waterCan) {
      waterCan.addEventListener('click', function handleClick(e) {
        if (!gameActive) return;
        currentCans += 1;
        document.getElementById('current-cans').textContent = currentCans;
        // Milestone check
        milestones.forEach(m => {
          if (currentCans === m.score && !milestonesShown.includes(m.score)) {
            showMilestoneMessage(m.message);
            milestonesShown.push(m.score);
          }
        });
        waterCan.removeEventListener('click', handleClick);
        if (typeof playSound === 'function') playSound('can');
        // Blue burst effect (now lingers 1.5s longer)
        const burst = document.createElement('div');
        burst.style.position = 'absolute';
        burst.style.left = '50%';
        burst.style.top = '50%';
        burst.style.transform = 'translate(-50%, -50%)';
        burst.style.width = '60px';
        burst.style.height = '60px';
        burst.style.borderRadius = '50%';
        burst.style.background = 'rgba(46,157,247,0.35)';
        burst.style.pointerEvents = 'none';
        burst.style.zIndex = '10';
        burst.style.animation = 'burst-fade 2.35s linear forwards';
        randomCell.appendChild(burst);
        setTimeout(() => {
          if (wrapper.parentElement) wrapper.remove();
          if (burst.parentElement) burst.parentElement.remove();
        }, iconLinger + 1500);
      });
    }
  }
// Burst and droplet animations
// Add to style.css:
// @keyframes burst-fade { 0%{opacity:1;transform:translate(-50%,-50%) scale(0.7);} 80%{opacity:0.7;} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.7);} }
// @keyframes drop-burst { 0%{opacity:1;transform:translate(-50%,-50%) scale(0.7);} 80%{opacity:0.7;} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.7);} }
}

// Show difficulty modal and start game after selection
function startGame() {
  if (gameActive) return;
  document.getElementById('difficulty-modal').style.display = 'flex';
}

function beginGameWithDifficulty(diff) {
  setDifficulty(diff);
  gameActive = true;
  currentCans = 0;
  milestonesShown = [];
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('gameover-modal').style.display = 'none';
  document.getElementById('difficulty-modal').style.display = 'none';
  createGrid(); // This will only clear icons/effects if grid already exists
  spawnInterval = setInterval(spawnWaterCan, spawnRate);
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop the timer
  const modal = document.getElementById('gameover-modal');
  const msg = document.getElementById('final-score-msg');
  const highscoreMsg = document.getElementById('highscore-msg');
  const congratsMsg = document.getElementById('congrats-msg');
  let beatHighScore = false;
  // Update high score if needed
  if (currentCans > highScore) {
    highScore = currentCans;
    localStorage.setItem('waterquest-highscore', highScore);
    document.getElementById('high-score').textContent = highScore;
    beatHighScore = true;
  }
  msg.textContent = `Your final score: ${currentCans}`;
  if (beatHighScore) {
    highscoreMsg.textContent = `New High Score: ${highScore}!`;
    congratsMsg.textContent = 'Congratulations! You set a new record!';
    launchConfetti();
  } else {
    highscoreMsg.textContent = '';
    congratsMsg.textContent = '';
  }
  modal.style.display = 'flex';
}

// Confetti effect for new high score
function launchConfetti() {
  // Make confetti cover the whole screen and last longer
  let confettiContainer = document.getElementById('global-confetti');
  if (!confettiContainer) {
    confettiContainer = document.createElement('div');
    confettiContainer.id = 'global-confetti';
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100vw';
    confettiContainer.style.height = '100vh';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '2000';
    document.body.appendChild(confettiContainer);
  }
  confettiContainer.innerHTML = '';
  const confettiColors = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#FF902A', '#F5402C', '#159A48', '#F16061'];
  const numConfetti = 80;
  for (let i = 0; i < numConfetti; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    conf.style.left = Math.random() * 98 + 'vw';
    conf.style.top = (Math.random() * -20) + 'vh';
    conf.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiContainer.appendChild(conf);
    // Remove confetti after animation
    setTimeout(() => {
      if (conf.parentNode) conf.parentNode.removeChild(conf);
    }, 2600);
  }
  // Remove the container after all confetti is gone
  setTimeout(() => {
    if (confettiContainer.parentNode) confettiContainer.innerHTML = '';
  }, 2700);
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
// Set up click handler for try again button
document.getElementById('try-again').addEventListener('click', startGame);
// Set up click handler for reset game button
document.getElementById('reset-game').addEventListener('click', resetGameOnly);
// Set up click handler for reset all button
document.getElementById('reset-all').addEventListener('click', resetAll);

// Difficulty modal button handlers
document.getElementById('easy-mode').addEventListener('click', function() {
  beginGameWithDifficulty('easy');
});
document.getElementById('normal-mode').addEventListener('click', function() {
  beginGameWithDifficulty('normal');
});
document.getElementById('hard-mode').addEventListener('click', function() {
  beginGameWithDifficulty('hard');
});

// Milestone messages
const milestones = [
  { score: 5, message: "Nice start! 5 cans collected!" },
  { score: 10, message: "10 cans! You're getting the hang of it!" },
  { score: 15, message: "15 cans! Keep going!" },
  { score: 20, message: "20 cans! Amazing!" },
  { score: 25, message: "25 cans! Water Hero!" },
  { score: 30, message: "30 cans! Unstoppable!" },
  { score: 40, message: "40 cans! Water Legend!" },
  { score: 50, message: "50 cans! Hydration Master!" }
];
let milestonesShown = [];

function showMilestoneMessage(msg) {
  const ach = document.getElementById('achievements');
  ach.textContent = msg;
  ach.style.opacity = 1;
  ach.style.transition = 'opacity 0.5s';
  setTimeout(() => {
    ach.style.opacity = 0;
  }, 2500);
}
