// Populated from the start screen's range/exclude inputs in startQuiz().
let factorAValues = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
let factorBValues = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
let fractionDenoms = [5, 6, 8];

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
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");

const timerEl = document.getElementById("timer");
const correctCountEl = document.getElementById("correct-count");
const problemEl = document.getElementById("problem");
const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answer-input");

const helpBtn = document.getElementById("help-btn");

const resultCorrectEl = document.getElementById("result-correct");
const resultMissedEl = document.getElementById("result-missed");
const resultHelpedEl = document.getElementById("result-helped");

let category = "multiplication";
let currentProblem = null;
let correctCount = 0;
let missedCount = 0;
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
  correctCount = 0;
  missedCount = 0;
  helpedCount = 0;
  quizActive = true;
  inputLocked = false;

  correctCountEl.textContent = "0";
  showScreen(quizScreen);
  nextProblem();

  deadline = performance.now() + minutes * 60000;
  timerEl.textContent = formatCountdown(minutes * 60000);
  timerHandle = setInterval(tick, 100);
}

function tick() {
  const remaining = deadline - performance.now();
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
  showScreen(resultsScreen);
}

startBtn.addEventListener("click", startQuiz);
retryBtn.addEventListener("click", () => showScreen(startScreen));
answerInput.addEventListener("input", handleInput);
helpBtn.addEventListener("click", useHelp);
categorySelect.addEventListener("change", updateRangeFieldVisibility);
updateRangeFieldVisibility();
