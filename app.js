// Populated from the start screen's range/exclude inputs in startQuiz().
let factorAValues = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
let factorBValues = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
let fractionDenoms = [5, 6, 8];

// Gamification: personal bests and per-category benchmarks persist across
// sessions in localStorage. Benchmark = the "Platinum" target; rank tiers
// scale off it so every category can have a difficulty-appropriate goal.
const BENCHMARKS_KEY = "mathFacts.benchmarks";
const BESTS_KEY = "mathFacts.bests";
const DEFAULT_BENCHMARKS = {
  multiplication: 30,
  division: 25,
  fractionToDecimal: 15,
  decimalToFraction: 15,
  mixed: 20,
};

function loadBenchmarks() {
  try {
    const raw = JSON.parse(localStorage.getItem(BENCHMARKS_KEY));
    return { ...DEFAULT_BENCHMARKS, ...raw };
  } catch {
    return { ...DEFAULT_BENCHMARKS };
  }
}

function saveBenchmark(cat, value) {
  const benchmarks = loadBenchmarks();
  benchmarks[cat] = value;
  localStorage.setItem(BENCHMARKS_KEY, JSON.stringify(benchmarks));
}

function loadBests() {
  try {
    return JSON.parse(localStorage.getItem(BESTS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBest(key, value) {
  const bests = loadBests();
  bests[key] = value;
  localStorage.setItem(BESTS_KEY, JSON.stringify(bests));
}

function bestKey(cat, minutes) {
  return `${cat}:${minutes}`;
}

const RANK_TIERS = [
  { tier: "platinum", label: "Platinum", emoji: "🏆", ratio: 1.3 },
  { tier: "gold", label: "Gold", emoji: "🥇", ratio: 1.0 },
  { tier: "silver", label: "Silver", emoji: "🥈", ratio: 0.75 },
  { tier: "bronze", label: "Bronze", emoji: "🥉", ratio: 0.5 },
];

function getRank(correct, benchmark) {
  const ratio = benchmark > 0 ? correct / benchmark : 0;
  for (const rank of RANK_TIERS) {
    if (ratio >= rank.ratio) return rank;
  }
  return null;
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomFrom(values) {
  return values[randInt(0, values.length - 1)];
}

function randomFraction() {
  const denom = randomFrom(fractionDenoms);
  const numer = randInt(1, denom - 1);
  return { numer, denom };
}

// Parses a comma/space separated list of numbers, e.g. "7, 9" -> Set{7,9}.
function parseExcludeList(text) {
  return new Set(
    text
      .split(/[\s,]+/)
      .map((part) => Number(part))
      .filter((n) => !Number.isNaN(n))
  );
}

function buildRange(min, max, exclude) {
  const values = [];
  for (let n = min; n <= max; n++) {
    if (!exclude.has(n)) values.push(n);
  }
  return values;
}

function fractionToDecimalString(numer, denom) {
  const rounded = Math.round((numer / denom) * 1000) / 1000;
  return String(rounded);
}

// Each generator returns { prompt, answer, hint }. `answer` is always the
// exact string the user must type; comparison is plain string equality.
const problemTypes = {
  multiplication() {
    const a = randomFrom(factorAValues);
    const b = randomFrom(factorBValues);
    return { prompt: `${a} × ${b}`, answer: String(a * b), hint: "" };
  },
  division() {
    // "First number" plays the multiplier in multiplication and the divisor
    // here, so limiting it the same way (e.g. to 1) practices the matching
    // fact family in both categories.
    const divisor = randomFrom(factorAValues);
    const quotient = randomFrom(factorBValues);
    const dividend = divisor * quotient;
    return {
      prompt: `${dividend} ÷ ${divisor}`,
      answer: String(quotient),
      hint: "",
    };
  },
  fractionToDecimal() {
    const { numer, denom } = randomFraction();
    return {
      prompt: `${numer}/${denom}`,
      answer: fractionToDecimalString(numer, denom),
      hint: "as a decimal",
    };
  },
  decimalToFraction() {
    const { numer, denom } = randomFraction();
    return {
      prompt: fractionToDecimalString(numer, denom),
      answer: `${numer}/${denom}`,
      hint: "as a fraction, e.g. 3/5",
    };
  },
};

const categoryTypes = {
  multiplication: ["multiplication"],
  division: ["division"],
  fractionToDecimal: ["fractionToDecimal"],
  decimalToFraction: ["decimalToFraction"],
  mixed: ["multiplication", "division", "fractionToDecimal", "decimalToFraction"],
};

function generateProblem(category) {
  const types = categoryTypes[category];
  const type = types[randInt(0, types.length - 1)];
  return problemTypes[type]();
}

const CONFETTI_COLORS = ["#5b8cff", "#3ddc84", "#f0b429", "#ff5c5c", "#c084fc"];

function launchConfetti(count) {
  const layer = document.getElementById("confetti-layer");
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = randomFrom(CONFETTI_COLORS);
    piece.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.addEventListener("animationend", () => piece.remove());
    layer.appendChild(piece);
  }
}

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");

const categorySelect = document.getElementById("category");
const timeLimitSelect = document.getElementById("time-limit");
const multRangeField = document.getElementById("mult-range-field");
const factorAMinInput = document.getElementById("factor-a-min");
const factorAMaxInput = document.getElementById("factor-a-max");
const factorBMinInput = document.getElementById("factor-b-min");
const factorBMaxInput = document.getElementById("factor-b-max");
const fractionRangeField = document.getElementById("fraction-range-field");
const denomMinInput = document.getElementById("denom-min");
const denomMaxInput = document.getElementById("denom-max");
const denomExcludeInput = document.getElementById("denom-exclude");
const benchmarkInput = document.getElementById("benchmark-input");
const bestLineEl = document.getElementById("best-line");
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");

const timerEl = document.getElementById("timer");
const correctCountEl = document.getElementById("correct-count");
const streakBadgeEl = document.getElementById("streak-badge");
const paceEl = document.getElementById("pace-indicator");
const problemEl = document.getElementById("problem");
const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answer-input");

const helpBtn = document.getElementById("help-btn");

const resultCorrectEl = document.getElementById("result-correct");
const resultMissedEl = document.getElementById("result-missed");
const resultHelpedEl = document.getElementById("result-helped");
const resultBestEl = document.getElementById("result-best");
const rankBadgeEl = document.getElementById("rank-badge");
const newBestBannerEl = document.getElementById("new-best-banner");

let category = "multiplication";
let currentProblem = null;
let correctCount = 0;
let missedCount = 0;
let streak = 0;
let totalDurationMs = 0;
let helpedCount = 0;
let quizActive = false;
let inputLocked = false;
let deadline = 0;
let timerHandle = null;

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function showScreen(screen) {
  for (const s of [startScreen, quizScreen, resultsScreen]) {
    s.classList.toggle("hidden", s !== screen);
  }
}

function updateRangeFieldVisibility() {
  const selected = categorySelect.value;
  multRangeField.classList.toggle(
    "hidden",
    selected !== "multiplication" && selected !== "division" && selected !== "mixed"
  );
  fractionRangeField.classList.toggle(
    "hidden",
    selected !== "fractionToDecimal" && selected !== "decimalToFraction" && selected !== "mixed"
  );
}

function updateStartScreenStats() {
  const cat = categorySelect.value;
  const minutes = Number(timeLimitSelect.value);

  benchmarkInput.value = loadBenchmarks()[cat];

  const best = loadBests()[bestKey(cat, minutes)];
  bestLineEl.textContent = best
    ? `Personal best: ${best} correct`
    : "No runs yet — set the pace!";
}

function updateStreakDisplay() {
  if (streak < 3) {
    streakBadgeEl.className = "streak-badge hidden";
    streakBadgeEl.textContent = "";
    return;
  }
  const tier = streak >= 15 ? "streak-blaze" : streak >= 8 ? "streak-hot" : "streak-warm";
  streakBadgeEl.className = `streak-badge ${tier}`;
  streakBadgeEl.textContent = `🔥 ${streak}`;
}

function startQuiz() {
  const newFactorAMin = Number(factorAMinInput.value);
  const newFactorAMax = Number(factorAMaxInput.value);
  const newFactorBMin = Number(factorBMinInput.value);
  const newFactorBMax = Number(factorBMaxInput.value);
  const newDenomMin = Number(denomMinInput.value);
  const newDenomMax = Number(denomMaxInput.value);
  const exclude = parseExcludeList(denomExcludeInput.value);
  const newFractionDenoms = buildRange(newDenomMin, newDenomMax, exclude);

  if (!newFactorAMin || !newFactorAMax || newFactorAMin > newFactorAMax) {
    alert("Enter a valid range for the first number (min at or below max).");
    return;
  }
  if (!newFactorBMin || !newFactorBMax || newFactorBMin > newFactorBMax) {
    alert("Enter a valid range for the second number (min at or below max).");
    return;
  }
  if (!newDenomMin || !newDenomMax || newDenomMin > newDenomMax) {
    alert("Enter a valid denominator range (min at or below max).");
    return;
  }
  if (newFractionDenoms.length === 0) {
    alert("The denominator range excludes every value in it — widen the range or the exclude list.");
    return;
  }

  factorAValues = buildRange(newFactorAMin, newFactorAMax, new Set());
  factorBValues = buildRange(newFactorBMin, newFactorBMax, new Set());
  fractionDenoms = newFractionDenoms;

  category = categorySelect.value;
  const minutes = Number(timeLimitSelect.value);
  const newBenchmark = Math.max(1, Number(benchmarkInput.value) || DEFAULT_BENCHMARKS[category]);
  saveBenchmark(category, newBenchmark);

  correctCount = 0;
  missedCount = 0;
  helpedCount = 0;
  streak = 0;
  quizActive = true;
  inputLocked = false;

  correctCountEl.textContent = "0";
  updateStreakDisplay();
  paceEl.textContent = "";
  showScreen(quizScreen);
  nextProblem();

  totalDurationMs = minutes * 60000;
  deadline = performance.now() + totalDurationMs;
  timerEl.textContent = formatCountdown(totalDurationMs);
  timerHandle = setInterval(tick, 100);
}

function tick() {
  const remaining = deadline - performance.now();
  const elapsed = totalDurationMs - remaining;
  if (elapsed > 4000 && correctCount > 0) {
    const projected = Math.round((correctCount / elapsed) * totalDurationMs);
    paceEl.textContent = `On pace for ${projected}`;
  }
  if (remaining <= 0) {
    timerEl.textContent = "0:00";
    finishQuiz();
    return;
  }
  timerEl.textContent = formatCountdown(remaining);
}

// Fraction answers ("3/5") must match exactly. Numeric answers (ints and
// decimals) compare by value, so a leading zero can be omitted (".333"
// is accepted for "0.333").
function isCorrectAnswer(trimmed, answer) {
  if (answer.includes("/")) return trimmed === answer;
  if (trimmed === "") return false;
  const n = Number(trimmed);
  return !Number.isNaN(n) && n === Number(answer);
}

// Minimum characters expected before we're willing to flag an answer as
// wrong, accounting for a possibly-omitted leading zero on decimals.
function minAnswerLength(answer) {
  return answer.startsWith("0.") ? answer.length - 1 : answer.length;
}

function nextProblem() {
  currentProblem = generateProblem(category);
  currentProblem.missed = false;
  problemEl.textContent = currentProblem.prompt;
  hintEl.textContent = currentProblem.hint;
  answerInput.value = "";
  answerInput.className = "";
  answerInput.disabled = false;
  helpBtn.disabled = false;
  answerInput.focus();
}

function useHelp() {
  if (!quizActive || inputLocked) return;
  inputLocked = true;
  helpedCount += 1;
  streak = 0;
  updateStreakDisplay();
  answerInput.value = currentProblem.answer;
  answerInput.className = "helped";
  answerInput.disabled = true;
  helpBtn.disabled = true;
  setTimeout(() => {
    inputLocked = false;
    if (quizActive) nextProblem();
  }, 1000);
}

function handleInput() {
  if (!quizActive || inputLocked) return;
  const trimmed = answerInput.value.trim();

  if (isCorrectAnswer(trimmed, currentProblem.answer)) {
    correctCount += 1;
    correctCountEl.textContent = String(correctCount);
    streak = currentProblem.missed ? 0 : streak + 1;
    updateStreakDisplay();
    answerInput.classList.remove("incorrect");
    answerInput.classList.add("correct");
    setTimeout(() => {
      if (quizActive) nextProblem();
    }, 120);
    return;
  }

  if (trimmed !== "" && trimmed.length >= minAnswerLength(currentProblem.answer)) {
    if (!currentProblem.missed) {
      currentProblem.missed = true;
      missedCount += 1;
      streak = 0;
      updateStreakDisplay();
    }
    answerInput.classList.add("incorrect");
  } else {
    answerInput.classList.remove("incorrect");
  }
}

function finishQuiz() {
  quizActive = false;
  clearInterval(timerHandle);
  answerInput.blur();
  resultCorrectEl.textContent = String(correctCount);
  resultMissedEl.textContent = String(missedCount);
  resultHelpedEl.textContent = String(helpedCount);

  const minutes = Number(timeLimitSelect.value);
  const key = bestKey(category, minutes);
  const previousBest = loadBests()[key] || 0;
  const isNewBest = correctCount > previousBest;
  if (isNewBest) saveBest(key, correctCount);
  resultBestEl.textContent = String(Math.max(correctCount, previousBest));

  const benchmark = loadBenchmarks()[category] || DEFAULT_BENCHMARKS[category];
  const rank = getRank(correctCount, benchmark);
  if (rank) {
    rankBadgeEl.textContent = `${rank.emoji} ${rank.label}`;
    rankBadgeEl.className = `rank-badge ${rank.tier}`;
  } else {
    rankBadgeEl.className = "rank-badge hidden";
  }

  newBestBannerEl.classList.toggle("hidden", !isNewBest);

  if (isNewBest || rank?.tier === "gold" || rank?.tier === "platinum") {
    launchConfetti(rank?.tier === "platinum" ? 90 : 60);
  }

  showScreen(resultsScreen);
}

startBtn.addEventListener("click", startQuiz);
retryBtn.addEventListener("click", () => showScreen(startScreen));
answerInput.addEventListener("input", handleInput);
helpBtn.addEventListener("click", useHelp);
categorySelect.addEventListener("change", () => {
  updateRangeFieldVisibility();
  updateStartScreenStats();
});
timeLimitSelect.addEventListener("change", updateStartScreenStats);
benchmarkInput.addEventListener("change", () => {
  const value = Math.max(1, Number(benchmarkInput.value) || DEFAULT_BENCHMARKS[categorySelect.value]);
  benchmarkInput.value = value;
  saveBenchmark(categorySelect.value, value);
});
updateRangeFieldVisibility();
updateStartScreenStats();
