const MULT_MIN = 3;
const MULT_MAX = 12;
const FRACTION_DENOMS = [5, 6, 8];

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomFraction() {
  const denom = FRACTION_DENOMS[randInt(0, FRACTION_DENOMS.length - 1)];
  const numer = randInt(1, denom - 1);
  return { numer, denom };
}

function fractionToDecimalString(numer, denom) {
  const rounded = Math.round((numer / denom) * 1000) / 1000;
  return String(rounded);
}

// Each generator returns { prompt, answer, hint }. `answer` is always the
// exact string the user must type; comparison is plain string equality.
const problemTypes = {
  multiplication() {
    const a = randInt(MULT_MIN, MULT_MAX);
    const b = randInt(MULT_MIN, MULT_MAX);
    return { prompt: `${a} × ${b}`, answer: String(a * b), hint: "" };
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
  fractionToDecimal: ["fractionToDecimal"],
  decimalToFraction: ["decimalToFraction"],
  mixed: ["multiplication", "fractionToDecimal", "decimalToFraction"],
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
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");

const timerEl = document.getElementById("timer");
const correctCountEl = document.getElementById("correct-count");
const problemEl = document.getElementById("problem");
const hintEl = document.getElementById("hint");
const answerInput = document.getElementById("answer-input");

const resultCorrectEl = document.getElementById("result-correct");
const resultMissedEl = document.getElementById("result-missed");

let category = "multiplication";
let currentProblem = null;
let correctCount = 0;
let missedCount = 0;
let quizActive = false;
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

function startQuiz() {
  category = categorySelect.value;
  const minutes = Number(timeLimitSelect.value);
  correctCount = 0;
  missedCount = 0;
  quizActive = true;

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
  answerInput.focus();
}

function handleInput() {
  if (!quizActive) return;
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
  showScreen(resultsScreen);
}

startBtn.addEventListener("click", startQuiz);
retryBtn.addEventListener("click", () => showScreen(startScreen));
answerInput.addEventListener("input", handleInput);
