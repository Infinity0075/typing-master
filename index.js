// Word banks organized by difficulty
const wordBanks = {
  easy: [
    "the",
    "and",
    "you",
    "are",
    "for",
    "any",
    "can",
    "had",
    "her",
    "was",
    "one",
    "our",
    "out",
    "day",
    "get",
    "has",
    "him",
    "his",
    "how",
    "its",
    "may",
    "new",
    "now",
    "old",
    "see",
    "two",
    "way",
    "who",
    "boy",
    "did",
    "man",
    "car",
    "dog",
    "cat",
    "run",
    "big",
    "red",
    "hot",
    "top",
    "sun",
  ],
  medium: [
    "about",
    "after",
    "again",
    "before",
    "between",
    "could",
    "every",
    "first",
    "found",
    "great",
    "group",
    "hand",
    "help",
    "here",
    "house",
    "just",
    "know",
    "large",
    "last",
    "left",
    "life",
    "little",
    "long",
    "made",
    "make",
    "many",
    "most",
    "move",
    "much",
    "name",
    "need",
    "never",
    "night",
    "number",
    "often",
    "only",
    "other",
    "over",
    "own",
    "place",
  ],
  hard: [
    "although",
    "appear",
    "around",
    "because",
    "become",
    "business",
    "certain",
    "change",
    "children",
    "complete",
    "consider",
    "continue",
    "course",
    "create",
    "different",
    "during",
    "early",
    "education",
    "example",
    "experience",
    "family",
    "follow",
    "friends",
    "government",
    "health",
    "history",
    "important",
    "information",
    "interest",
    "language",
    "military",
    "minutes",
  ],
};

// Global state
let gameState = {
  currentText: "",
  currentPosition: 0,
  startTime: null,
  isActive: false,
  mode: "standard",
  difficulty: 1,
  timeRemaining: 60,
  correctChars: 0,
  totalChars: 0,
  errorPatterns: {},
  currentBadges: 0,
  testsCompleted: 0,
  bestWPM: 0,
  timer: null,
};

// DOM elements - Only the ones that exist in your HTML
const elements = {
  textDisplay: document.getElementById("text-display"),
  typingInput: document.getElementById("typing-input"),
  wpmValue: document.getElementById("wpm-value"),
  accuracyValue: document.getElementById("accuracy-value"),
  levelValue: document.getElementById("level-value"),
  badgeCount: document.getElementById("badge-count"),
  progressFill: document.getElementById("progress-fill"),
  progressLabel: document.getElementById("progress-label"),
  modeButtons: document.querySelectorAll(".mode-btn"),
  achievementPopup: document.getElementById("achievement-popup"),
  resultsModal: document.getElementById("results-modal"),
  difficultyDots: document.getElementById("difficulty-dots"),
  startBtn: document.getElementById("start-btn"),
  resetBtn: document.getElementById("reset-btn"),
};

// Generate text based on difficulty and mode
function generateText() {
  let words = [];
  const wordsCount = 30; // Reduced to fit better in the box

  // Select word bank based on difficulty
  let primaryBank = wordBanks.easy;
  if (gameState.difficulty >= 3) primaryBank = wordBanks.medium;
  if (gameState.difficulty >= 5) primaryBank = wordBanks.hard;

  // Add words based on error patterns for focus mode
  if (gameState.mode === "focus") {
    words = generateFocusWords();
  } else {
    // Standard word selection
    for (let i = 0; i < wordsCount; i++) {
      const randomWord =
        primaryBank[Math.floor(Math.random() * primaryBank.length)];
      words.push(randomWord);
    }
  }

  gameState.currentText = words.join(" ");
  displayText();
}

// Generate words for focus mode based on error patterns
function generateFocusWords() {
  const problemChars = Object.keys(gameState.errorPatterns);
  const focusWords = [];

  if (problemChars.length === 0) {
    // No error patterns yet, use medium difficulty words
    return Array(20)
      .fill(0)
      .map(
        () =>
          wordBanks.medium[Math.floor(Math.random() * wordBanks.medium.length)]
      );
  }

  // Find words containing problem characters
  const allWords = [...wordBanks.easy, ...wordBanks.medium, ...wordBanks.hard];

  for (let i = 0; i < 20; i++) {
    let selectedWord;
    if (i % 3 === 0 && problemChars.length > 0) {
      // Every 3rd word should contain a problem character
      const problemChar =
        problemChars[Math.floor(Math.random() * problemChars.length)];
      const wordsWithChar = allWords.filter((word) =>
        word.includes(problemChar)
      );
      selectedWord =
        wordsWithChar.length > 0
          ? wordsWithChar[Math.floor(Math.random() * wordsWithChar.length)]
          : allWords[Math.floor(Math.random() * allWords.length)];
    } else {
      selectedWord = allWords[Math.floor(Math.random() * allWords.length)];
    }
    focusWords.push(selectedWord);
  }

  return focusWords;
}

// Display text with character spans
function displayText() {
  const chars = gameState.currentText.split("");
  elements.textDisplay.innerHTML = chars
    .map(
      (char, index) =>
        `<span class="character ${
          index === 0 ? "current" : "pending"
        }" data-index="${index}">${char === " " ? "&nbsp;" : char}</span>`
    )
    .join("");
}

// Handle user input
function handleInput(event) {
  if (!gameState.isActive) return; // Only process if test is active

  const inputValue = event.target.value;
  const expectedChar = gameState.currentText[gameState.currentPosition];
  const typedChar = inputValue[inputValue.length - 1];

  if (!gameState.startTime) {
    gameState.startTime = Date.now();
    startTimer();
  }

  if (inputValue.length > gameState.currentPosition + 1) {
    // User typed too fast, reset input to current position + 1
    event.target.value = gameState.currentText.substring(
      0,
      gameState.currentPosition + 1
    );
    return;
  }

  if (typedChar === expectedChar) {
    handleCorrectChar();
  } else if (typedChar !== undefined) {
    handleIncorrectChar(expectedChar, typedChar);
  }

  updateDisplay();
  updateStats();
  checkForCompletion();
}

function handleCorrectChar() {
  const charElement = document.querySelector(
    `[data-index="${gameState.currentPosition}"]`
  );
  if (charElement) {
    charElement.className = "character correct";
  }

  gameState.correctChars++;
  gameState.currentPosition++;
  gameState.totalChars++;

  // Update current character
  const nextCharElement = document.querySelector(
    `[data-index="${gameState.currentPosition}"]`
  );
  if (nextCharElement) {
    nextCharElement.className = "character current";
  }
}

function handleIncorrectChar(expected, typed) {
  const charElement = document.querySelector(
    `[data-index="${gameState.currentPosition}"]`
  );
  if (charElement) {
    charElement.className = "character incorrect";
    // Reset to pending after a short delay
    setTimeout(() => {
      if (charElement) charElement.className = "character current";
    }, 300);
  }

  // Track error pattern
  const errorKey = `${expected}->${typed}`;
  gameState.errorPatterns[errorKey] =
    (gameState.errorPatterns[errorKey] || 0) + 1;

  gameState.totalChars++;

  // Don't advance position for incorrect chars - remove the wrong character
  elements.typingInput.value = elements.typingInput.value.slice(0, -1);
}

function startTimer() {
  // Start countdown timer
  gameState.timer = setInterval(() => {
    gameState.timeRemaining--;

    if (gameState.timeRemaining <= 0) {
      endTest();
    }
  }, 1000);
}

function endTest() {
  gameState.isActive = false;
  clearInterval(gameState.timer);

  const finalStats = calculateFinalStats();
  checkAchievements(finalStats);
  showResults(finalStats);

  gameState.testsCompleted++;
  adjustDifficulty(finalStats);
  saveUserData();
}

function calculateFinalStats() {
  const timeElapsed = gameState.startTime
    ? (Date.now() - gameState.startTime) / 1000 / 60
    : 1;

  const wordsTyped = gameState.correctChars / 5; // Standard: 5 chars = 1 word
  const wpm = Math.round(wordsTyped / timeElapsed);
  const accuracy =
    gameState.totalChars > 0
      ? Math.round((gameState.correctChars / gameState.totalChars) * 100)
      : 100;

  return { wpm, accuracy, timeElapsed };
}

function adjustDifficulty(stats) {
  const { wpm, accuracy } = stats;
  const combinedScore = wpm * (accuracy / 100);

  if (gameState.mode === "standard") {
    if (combinedScore > 40 && accuracy > 95 && gameState.difficulty < 5) {
      gameState.difficulty++;
      showAchievement(`Level Up! Now at Level ${gameState.difficulty}`);
    } else if (combinedScore < 20 && gameState.difficulty > 1) {
      gameState.difficulty = Math.max(1, gameState.difficulty - 1);
    }
  }

  updateDifficultyDisplay();
}

function updateDisplay() {
  // Update progress bar
  const progress =
    (gameState.currentPosition / gameState.currentText.length) * 100;
  elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
  elements.progressLabel.textContent = `${Math.round(progress)}% Complete`;
}

function updateStats() {
  if (gameState.startTime) {
    const timeElapsed = (Date.now() - gameState.startTime) / 1000 / 60;
    const wordsTyped = gameState.correctChars / 5;
    const wpm = Math.round(wordsTyped / timeElapsed) || 0;
    const accuracy =
      gameState.totalChars > 0
        ? Math.round((gameState.correctChars / gameState.totalChars) * 100)
        : 100;

    elements.wpmValue.textContent = wpm;
    elements.accuracyValue.textContent = accuracy + "%";
    elements.levelValue.textContent = gameState.difficulty;

    if (wpm > gameState.bestWPM) {
      gameState.bestWPM = wpm;
    }
  }
}

function updateDifficultyDisplay() {
  const dots = elements.difficultyDots.querySelectorAll(".dot");
  dots.forEach((dot, index) => {
    if (index < gameState.difficulty) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  });
}

function checkForCompletion() {
  if (gameState.currentPosition >= gameState.currentText.length) {
    endTest();
  }
}

function resetTest() {
  clearInterval(gameState.timer);
  gameState.currentPosition = 0;
  gameState.startTime = null;
  gameState.isActive = false;
  gameState.timeRemaining = 60;
  gameState.correctChars = 0;
  gameState.totalChars = 0;

  elements.typingInput.value = "";
  elements.progressFill.style.width = "0%";
  elements.progressLabel.textContent =
    "Ready to start - Click START TEST button";

  // Reset button states
  elements.startBtn.textContent = "START TEST";
  elements.startBtn.disabled = false;
  elements.typingInput.disabled = true;
  elements.typingInput.placeholder = "Click START TEST button first...";

  generateText();
  updateStats();
}

// Button Event Listeners
elements.startBtn.addEventListener("click", function () {
  gameState.isActive = true;
  elements.startBtn.textContent = "TEST ACTIVE";
  elements.startBtn.disabled = true;
  elements.typingInput.disabled = false;
  elements.typingInput.placeholder = "Start typing here...";
  elements.typingInput.focus();
  elements.progressLabel.textContent = "Test started! Type the words above.";

  if (!elements.textDisplay.innerHTML) {
    generateText();
  }
});

elements.resetBtn.addEventListener("click", function () {
  resetTest();
});

// Mode buttons
elements.modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    gameState.mode = btn.dataset.mode;

    // Update active button
    elements.modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    resetTest();
  });
});

// Typing input
elements.typingInput.addEventListener("input", handleInput);

// Achievement and Results functions (simplified)
function showAchievement(message) {
  if (elements.achievementPopup) {
    const textElement =
      elements.achievementPopup.querySelector(".achievement-text");
    if (textElement) {
      textElement.textContent = message;
      elements.achievementPopup.classList.add("show");

      setTimeout(() => {
        elements.achievementPopup.classList.remove("show");
      }, 3000);
    }
  }
}

function showResults(stats) {
  const finalWpm = document.getElementById("final-wpm");
  const finalAccuracy = document.getElementById("final-accuracy");
  const finalLevel = document.getElementById("final-level");

  if (finalWpm) finalWpm.textContent = stats.wpm;
  if (finalAccuracy) finalAccuracy.textContent = stats.accuracy + "%";
  if (finalLevel) finalLevel.textContent = gameState.difficulty;

  if (elements.resultsModal) {
    elements.resultsModal.classList.add("show");
  }
}

// Results modal buttons
const restartBtn = document.getElementById("restart-btn");
const closeResultsBtn = document.getElementById("close-results");

if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    elements.resultsModal.classList.remove("show");
    resetTest();
  });
}

if (closeResultsBtn) {
  closeResultsBtn.addEventListener("click", () => {
    elements.resultsModal.classList.remove("show");
    resetTest();
  });
}

// Achievement system (simplified)
function checkAchievements(stats) {
  const { wpm, accuracy } = stats;

  if (wpm >= 25 && !hasAchievement("speed_25")) {
    addAchievement("speed_25", "Speed Demon - 25+ WPM!");
  }
  if (wpm >= 40 && !hasAchievement("speed_40")) {
    addAchievement("speed_40", "Speed Master - 40+ WPM!");
  }
  if (accuracy >= 95 && !hasAchievement("accuracy_95")) {
    addAchievement("accuracy_95", "Precision Typist - 95%+ Accuracy!");
  }
}

function hasAchievement(achievementId) {
  const achievements = JSON.parse(
    localStorage.getItem("typingAchievements") || "[]"
  );
  return achievements.includes(achievementId);
}

function addAchievement(achievementId, message) {
  const achievements = JSON.parse(
    localStorage.getItem("typingAchievements") || "[]"
  );
  if (!achievements.includes(achievementId)) {
    achievements.push(achievementId);
    localStorage.setItem("typingAchievements", JSON.stringify(achievements));
    gameState.currentBadges++;
    elements.badgeCount.textContent = gameState.currentBadges;
    showAchievement(message);
  }
}

// Data persistence
function saveUserData() {
  const userData = {
    difficulty: gameState.difficulty,
    bestWPM: gameState.bestWPM,
    testsCompleted: gameState.testsCompleted,
    errorPatterns: gameState.errorPatterns,
    currentBadges: gameState.currentBadges,
  };
  localStorage.setItem("typingTestData", JSON.stringify(userData));
}

function loadUserData() {
  const savedData = localStorage.getItem("typingTestData");
  if (savedData) {
    const userData = JSON.parse(savedData);
    gameState.difficulty = userData.difficulty || 1;
    gameState.bestWPM = userData.bestWPM || 0;
    gameState.testsCompleted = userData.testsCompleted || 0;
    gameState.errorPatterns = userData.errorPatterns || {};
    gameState.currentBadges = userData.currentBadges || 0;
  }

  // Load achievements count
  const achievements = JSON.parse(
    localStorage.getItem("typingAchievements") || "[]"
  );
  gameState.currentBadges = achievements.length;
}

// Initialize
function init() {
  loadUserData();
  generateText();
  updateDifficultyDisplay();
  elements.badgeCount.textContent = gameState.currentBadges;
  elements.levelValue.textContent = gameState.difficulty;
}

// Start the app
document.addEventListener("DOMContentLoaded", init);
