// ---------- deck data ----------
// แก้ไข/เพิ่มคำถามของคุณเองได้ตรงนี้เลย
const DECK = [
  { q: "Game Loop คืออะไร", a: "วงรอบหลักของเกมที่ทำงานซ้ำต่อเนื่อง (update → render) เพื่อให้เกมขยับและตอบสนองผู้เล่นตลอดเวลา" },
  { q: "Sprite คืออะไร", a: "ภาพ 2D ที่ใช้แทนตัวละครหรือวัตถุในเกม มักเป็นส่วนหนึ่งของ Sprite Sheet" },
  { q: "Hitbox กับ Hurtbox ต่างกันอย่างไร", a: "Hitbox คือพื้นที่ที่สร้างความเสียหาย ส่วน Hurtbox คือพื้นที่ที่รับความเสียหาย" },
  { q: "Low-Poly คืออะไร", a: "รูปแบบโมเดล 3D ที่ใช้จำนวนพอลิกอนน้อย ทำให้ไฟล์เบาและเรนเดอร์เร็ว" },
  { q: "Game Engine ที่นิยมมีอะไรบ้าง", a: "เช่น Unity, Unreal Engine, Godot แต่ละตัวมีจุดเด่นและภาษาสคริปต์ต่างกัน" },
  { q: "Tilemap ใช้ทำอะไรในเกม 2D", a: "ใช้สร้างฉาก/แมพจากชิ้นส่วนภาพเล็กๆ (tile) มาต่อกันเป็นด่านหรือพื้นที่เดิน" },
  { q: "State Machine ในเกมใช้ทำอะไร", a: "ใช้จัดการพฤติกรรมตัวละครหรือระบบตามสถานะ เช่น idle, walk, attack, dead" },
  { q: "Frame Rate (FPS) คืออะไร", a: "จำนวนเฟรมภาพที่แสดงผลต่อวินาที ยิ่งสูงยิ่งลื่น มาตรฐานทั่วไปคือ 60 FPS" },
  { q: "Procedural Generation คืออะไร", a: "การสร้างเนื้อหาเกม (ด่าน แมพ ไอเทม) ด้วยอัลกอริทึมแบบสุ่ม แทนการออกแบบมือทั้งหมด" },
  { q: "Rigging ในงาน 3D คืออะไร", a: "การสร้างโครงกระดูก (skeleton) ให้โมเดล 3D เพื่อให้เคลื่อนไหวหรือทำแอนิเมชันได้" },
  { q: "Shader คืออะไร", a: "โปรแกรมขนาดเล็กที่คำนวณการแสดงผลของพื้นผิว แสง และสีบน GPU" },
  { q: "GDScript คือภาษาของเอนจินไหน", a: "เป็นภาษาสคริปต์หลักของ Godot Engine" },
];

// ---------- shared state ----------
let currentMode = 'review'; // 'review' | 'quiz'
let round = 1;

// ---------- review mode state ----------
let reviewQueue = [];
let reviewTotal = 0;
let reviewKnownCount = 0;
let isFlipped = false;

// ---------- quiz mode state ----------
let quizOrder = [];      // ลำดับ index คำถามทั้งชุดของรอบนี้ (สุ่มแล้ว)
let quizPos = 0;         // ตำแหน่งปัจจุบันในชุด
let quizCorrectCount = 0;
let quizAnswered = false;

// ---------- elements: shared ----------
const modeReviewBtn = document.getElementById('modeReviewBtn');
const modeQuizBtn = document.getElementById('modeQuizBtn');
const deckView = document.getElementById('deckView');
const quizView = document.getElementById('quizView');
const doneView = document.getElementById('doneView');
const doneStat = document.getElementById('doneStat');
const doneEyebrow = document.getElementById('doneEyebrow');
const btnRestart = document.getElementById('btnRestart');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const roundNum = document.getElementById('roundNum');

// ---------- elements: review mode ----------
const card = document.getElementById('card');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const answerControls = document.getElementById('answerControls');
const btnUnsure = document.getElementById('btnUnsure');
const btnKnow = document.getElementById('btnKnow');

// ---------- elements: quiz mode ----------
const quizIndex = document.getElementById('quizIndex');
const quizTotalLabel = document.getElementById('quizTotalLabel');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const btnNext = document.getElementById('btnNext');

// ---------- helpers ----------
function shuffle(arr){
  const copy = [...arr];
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------- mode switching ----------
function setMode(mode){
  currentMode = mode;
  modeReviewBtn.classList.toggle('active', mode === 'review');
  modeReviewBtn.setAttribute('aria-selected', mode === 'review');
  modeQuizBtn.classList.toggle('active', mode === 'quiz');
  modeQuizBtn.setAttribute('aria-selected', mode === 'quiz');

  doneView.classList.add('hidden');
  if(mode === 'review'){
    quizView.classList.add('hidden');
    deckView.classList.remove('hidden');
    startReview();
  } else {
    deckView.classList.add('hidden');
    quizView.classList.remove('hidden');
    startQuiz();
  }
}

modeReviewBtn.addEventListener('click', () => setMode('review'));
modeQuizBtn.addEventListener('click', () => setMode('quiz'));

// =========================================================
// โหมดทบทวน (flip card, self-report แบบเดียวกับ SM-2)
// =========================================================

function startReview(){
  reviewQueue = shuffle(DECK.map((_, i) => i));
  reviewTotal = reviewQueue.length;
  reviewKnownCount = 0;
  isFlipped = false;
  roundNum.textContent = round;
  updateReviewProgress();
  renderReviewCard();
}

function updateReviewProgress(){
  const done = reviewTotal - reviewQueue.length;
  const pct = reviewTotal === 0 ? 0 : Math.round((done / reviewTotal) * 100);
  progressFill.style.width = pct + '%';
  progressLabel.textContent = `${done} / ${reviewTotal} ผ่านแล้ว`;
}

function renderReviewCard(){
  if(reviewQueue.length === 0){
    finishReview();
    return;
  }
  const idx = reviewQueue[0];
  questionText.textContent = DECK[idx].q;
  answerText.textContent = DECK[idx].a;
  isFlipped = false;
  card.classList.remove('flipped');
  answerControls.classList.remove('visible');
}

function flipCard(){
  if(reviewQueue.length === 0) return;
  isFlipped = !isFlipped;
  card.classList.toggle('flipped', isFlipped);
  answerControls.classList.toggle('visible', isFlipped);
}

function answerReviewCard(knewIt){
  if(!isFlipped || reviewQueue.length === 0) return;
  const idx = reviewQueue.shift();
  if(knewIt){
    reviewKnownCount++;
  } else {
    const insertAt = Math.min(3, reviewQueue.length);
    reviewQueue.splice(insertAt, 0, idx);
    reviewTotal++;
  }
  updateReviewProgress();
  renderReviewCard();
}

function finishReview(){
  deckView.classList.add('hidden');
  doneView.classList.remove('hidden');
  doneEyebrow.textContent = 'เคลียร์เด็คแล้ว';
  doneStat.textContent = `ตอบถูกทันที ${reviewKnownCount} จาก ${DECK.length} ข้อ ในรอบที่ ${round}`;
}

card.addEventListener('click', flipCard);
card.addEventListener('keydown', (e) => {
  if(e.code === 'Space' || e.code === 'Enter'){
    e.preventDefault();
    flipCard();
  }
});
btnUnsure.addEventListener('click', () => answerReviewCard(false));
btnKnow.addEventListener('click', () => answerReviewCard(true));

document.addEventListener('keydown', (e) => {
  if(currentMode !== 'review' || !isFlipped) return;
  if(e.key === '1') answerReviewCard(false);
  if(e.key === '2') answerReviewCard(true);
});

// =========================================================
// โหมดทดสอบ (multiple choice)
// =========================================================

function startQuiz(){
  quizOrder = shuffle(DECK.map((_, i) => i));
  quizPos = 0;
  quizCorrectCount = 0;
  quizTotalLabel.textContent = quizOrder.length;
  updateQuizProgress();
  renderQuizQuestion();
}

function updateQuizProgress(){
  const pct = quizOrder.length === 0 ? 0 : Math.round((quizPos / quizOrder.length) * 100);
  progressFill.style.width = pct + '%';
  progressLabel.textContent = `${quizPos} / ${quizOrder.length} ผ่านแล้ว`;
}

function buildOptions(correctIdx){
  // สุ่มตัวลวง 3 ข้อจากคำตอบอื่นในเด็ค แล้วผสมกับคำตอบที่ถูก
  const otherIdxs = shuffle(
    DECK.map((_, i) => i).filter(i => i !== correctIdx)
  ).slice(0, 3);
  const allIdxs = shuffle([correctIdx, ...otherIdxs]);
  return allIdxs;
}

function renderQuizQuestion(){
  if(quizPos >= quizOrder.length){
    finishQuiz();
    return;
  }
  quizAnswered = false;
  quizIndex.textContent = quizPos + 1;
  const correctIdx = quizOrder[quizPos];
  quizQuestion.textContent = DECK[correctIdx].q;

  const optionIdxs = buildOptions(correctIdx);
  quizOptions.innerHTML = '';
  btnNext.classList.add('hidden');

  optionIdxs.forEach(idx => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = DECK[idx].a;
    btn.addEventListener('click', () => selectOption(btn, idx, correctIdx));
    quizOptions.appendChild(btn);
  });
}

function selectOption(btn, chosenIdx, correctIdx){
  if(quizAnswered) return;
  quizAnswered = true;

  const allBtns = quizOptions.querySelectorAll('.quiz-option');
  allBtns.forEach(b => b.disabled = true);

  if(chosenIdx === correctIdx){
    btn.classList.add('correct');
    quizCorrectCount++;
  } else {
    btn.classList.add('wrong');
    // โชว์เฉลยที่ถูกด้วย เผื่อผู้ใช้เลือกผิด
    allBtns.forEach(b => {
      if(b.textContent === DECK[correctIdx].a){
        b.classList.add('correct');
      }
    });
  }

  quizPos++;
  updateQuizProgress();
  btnNext.classList.remove('hidden');
}

btnNext.addEventListener('click', renderQuizQuestion);

function finishQuiz(){
  quizView.classList.add('hidden');
  doneView.classList.remove('hidden');
  doneEyebrow.textContent = 'ทำแบบทดสอบจบแล้ว';
  doneStat.textContent = `ตอบถูก ${quizCorrectCount} จาก ${DECK.length} ข้อ ในรอบที่ ${round}`;
}

// =========================================================
// restart (ใช้ร่วมกันทั้งสองโหมด)
// =========================================================

btnRestart.addEventListener('click', () => {
  round++;
  setMode(currentMode);
});

// ---------- init ----------
setMode('review');
