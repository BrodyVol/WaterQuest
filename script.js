// Reset only the current game (not high score)
function resetGameOnly() {
  if (gameActive) {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
  }
  currentCans = 0;
  timeLeft = 30;
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('gameover-modal').style.display = 'none';
  createGrid();
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
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
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
function spawnWaterCan() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  // Clear all cells before spawning a new item
  cells.forEach(cell => (cell.innerHTML = ''));

  // Decide which icon to spawn based on difficulty
  const rand = Math.random();
  let iconType = 'watercan';
  if (rand < biohazardChance) {
    iconType = 'biohazard';
  } else if (rand < biohazardChance + plusChance) {
    iconType = 'plus';
  }
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  if (iconType === 'biohazard') {
    // Insert biohazard SVG styled to match the game
    randomCell.innerHTML = `
      <div class="biohazard-wrapper">
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
      </div>
    `;
    const biohazard = randomCell.querySelector('.biohazard');
    if (biohazard) {
      biohazard.addEventListener('click', function handleBioClick(e) {
        if (!gameActive) return;
        timeLeft = Math.max(0, timeLeft - 3);
        document.getElementById('timer').textContent = timeLeft;
        biohazard.removeEventListener('click', handleBioClick);
        setTimeout(() => {
          if (biohazard.parentElement) biohazard.parentElement.remove();
        }, iconLinger);
      });
    }
  } else if (iconType === 'plus') {
    // Insert plus icon styled to match the game
    randomCell.innerHTML = `
      <div class="biohazard-wrapper" style="background:#eafff0;">
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
      </div>
    `;
    const plusIcon = randomCell.querySelector('.plus-icon');
    if (plusIcon) {
      plusIcon.addEventListener('click', function handlePlusClick(e) {
        if (!gameActive) return;
        timeLeft = Math.min(timeLeft + 2, 99); // Cap at 99s for sanity
        document.getElementById('timer').textContent = timeLeft;
        plusIcon.removeEventListener('click', handlePlusClick);
        setTimeout(() => {
          if (plusIcon.parentElement) plusIcon.parentElement.remove();
        }, iconLinger);
      });
    }
  } else {
    // Normal water can
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="water-can"></div>
      </div>
    `;
    const waterCan = randomCell.querySelector('.water-can');
    if (waterCan) {
      waterCan.addEventListener('click', function handleClick(e) {
        if (!gameActive) return;
        currentCans += 1;
        document.getElementById('current-cans').textContent = currentCans;
        waterCan.removeEventListener('click', handleClick);
        setTimeout(() => {
          if (waterCan.parentElement) waterCan.parentElement.remove();
        }, iconLinger);
      });
    }
  }
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
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('gameover-modal').style.display = 'none';
  document.getElementById('difficulty-modal').style.display = 'none';
  createGrid();
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
