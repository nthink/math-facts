// Problem generators, keyed by type. Multiplication for now;
// division / fraction-to-decimal can be added the same way later.
const generators = {
  multiplication() {
    const a = 1 + Math.floor(Math.random() * 12);
    const b = 1 + Math.floor(Math.random() * 12);
    return { text: `${a} × ${b}`, answer: a * b };
  },
};

function generateProblems(count, type = "multiplication") {
  const generate = generators[type];
  return Array.from({ length: count }, () => generate());
}

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");

const problemCountSelect = document.getElementById("problem-count");
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");

const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");
const problemEl = document.getElementById("problem");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");
const feedbackEl = document.getElementById("feedback");

const resultTimeEl = document.getElementById("result-time");
const resultMissedEl = document.getElementById("result-missed");

let problems = [];
let currentIndex = 0;
let missedProblems = new Set();
let startTime = 0;
let timerHandle = null;

function formatTime(ms) {
  const totalTenths = Math.floor(ms / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function showScreen(screen) {
  for (const s of [startScreen, quizScreen, resultsScreen]) {
    s.classList.toggle("hidden", s !== screen);
  }
}

function startTimer() {
  startTime = performance.now();
  timerHandle = setInterval(() => {
    timerEl.textContent = formatTime(performance.now() - startTime);
  }, 100);
}

function stopTimer() {
  clearInterval(timerHandle);
  timerHandle = null;
  return performance.now() - startTime;
}

function startQuiz() {
  const count = Number(problemCountSelect.value);
  problems = generateProblems(count);
  currentIndex = 0;
  missedProblems = new Set();

  timerEl.textContent = "0:00.0";
  showScreen(quizScreen);
  showProblem();
  startTimer();
}

function showProblem() {
  const problem = problems[currentIndex];
  problemEl.textContent = `${problem.text} =`;
  progressEl.textContent = `${currentIndex + 1} / ${problems.length}`;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  answerInput.value = "";
  answerInput.className = "";
  answerInput.focus();
}

function handleSubmit(event) {
  event.preventDefault();
  if (answerInput.value.trim() === "") return;

  const submitted = Number(answerInput.value);
  const problem = problems[currentIndex];

  if (submitted === problem.answer) {
    answerInput.classList.remove("incorrect");
    answerInput.classList.add("correct");
    feedbackEl.textContent = "Correct!";
    feedbackEl.className = "feedback correct";

    setTimeout(() => {
      currentIndex += 1;
      if (currentIndex < problems.length) {
        showProblem();
      } else {
        finishQuiz();
      }
    }, 300);
  } else {
    missedProblems.add(currentIndex);
    answerInput.classList.remove("correct");
    answerInput.classList.add("incorrect");
    feedbackEl.textContent = "Try again";
    feedbackEl.className = "feedback incorrect";
    answerInput.select();
  }
}

function finishQuiz() {
  const elapsed = stopTimer();
  resultTimeEl.textContent = formatTime(elapsed);
  resultMissedEl.textContent = `${missedProblems.size} / ${problems.length}`;
  showScreen(resultsScreen);
}

startBtn.addEventListener("click", startQuiz);
retryBtn.addEventListener("click", () => showScreen(startScreen));
answerForm.addEventListener("submit", handleSubmit);

// Clear the incorrect state as soon as the user starts typing a new guess.
answerInput.addEventListener("input", () => {
  if (answerInput.classList.contains("incorrect")) {
    answerInput.classList.remove("incorrect");
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
  }
});
