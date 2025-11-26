let quizTable;
let questions = [];
let scaleFactor = 1; // 用於縮放文字和元件的全域變數
let currentQuestionIndex = 0;
let score = 0;
let gameState = 'start'; // 'start', 'quiz', 'result'
let selectedOption = -1;
let answerChecked = false;
let feedbackMessage = '';

let particles = [];
let selectionParticles = [];

function preload() {
  // 改回最原始、最穩定的檔案讀取方式
  quizTable = loadTable('quiz.csv', 'csv', 'header');
}

function setup() {
  // 1. 讓畫布尺寸為視窗的百分比
  let cnv = createCanvas(windowWidth * 0.7, windowHeight * 0.9);
  // 透過 CSS 將畫布置中 (建議在 HTML 的 <style> 標籤中加入 body { display: flex; justify-content: center; align-items: center; })
  // 這裡我們用 p5.js 的 parent 和 style 來達成類似效果
  cnv.parent(document.body);
  cnv.style('display', 'block');
  cnv.style('margin', 'auto');
  textAlign(CENTER, CENTER);
  noStroke();

  // 解析 CSV 檔案
  for (let i = 0; i < quizTable.getRowCount(); i++) {
    let row = quizTable.getRow(i);
    let question = {
      question: row.getString('question'),
      options: [
        row.getString('option1'),
        row.getString('option2'),
        row.getString('option3'),
        row.getString('option4')
      ],
      // 使用 .trim() 移除前後可能存在的空格，再用 Number() 進行轉換，比 parseInt 更穩健
      // 這樣可以確保即使 CSV 中有格式問題，也能正確讀取數字索引
      correctAnswer: Number(row.getString('correct_answer_index').trim())
    };
    questions.push(question);
  }
  updateScale(); // 初始化縮放比例
}

function windowResized() {
  resizeCanvas(windowWidth * 0.7, windowHeight * 0.9);
  updateScale(); // 當視窗大小改變時，重新計算縮放比例
}

function draw() {
  background('#81b29a'); // 2. 更新背景顏色

  // 繪製並更新游標粒子效果
  drawCursorParticles();

  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'quiz') {
    drawQuizScreen();
  } else if (gameState === 'result') {
    drawResultScreen();
  }

  // 繪製並更新選項選取粒子效果
  drawSelectionParticles();
}

function drawStartScreen() {
  fill('#3d405b'); // 1. 更新文字顏色
  textSize(40 * scaleFactor);
  text('歡迎來到 p5.js 測驗！', width / 2, height / 2 - 50);

  // 開始按鈕
  let buttonX = width / 2 - 100;
  let buttonY = height / 2 + 20;
  let buttonW = 200;
  let buttonH = 60;

  if (mouseX > buttonX && mouseX < buttonX + buttonW && mouseY > buttonY && mouseY < buttonY + buttonH) {
    fill(100, 150, 255);
  } else {
    fill(120, 180, 255);
  }
  rect(buttonX, buttonY, buttonW, buttonH, 15);

  fill('#3d405b');
  textSize(28 * scaleFactor);
  text('開始測驗', width / 2, height / 2 + 50);
}

function drawQuizScreen() {
  if (currentQuestionIndex < questions.length) {
    let q = questions[currentQuestionIndex];

    // 顯示問題
    fill('#3d405b');
    textSize(32 * scaleFactor);
    text(q.question, width / 2, height * 0.15);

    // 顯示選項
    for (let i = 0; i < q.options.length; i++) {
      let optionW = 420; // 3. 答案外框寬度縮小 30% (600 * 0.7)
      let optionH = 42;  // 3. 答案外框高度縮小 30% (60 * 0.7)
      let optionX = width / 2 - optionW / 2;
      let optionY = height * 0.35 + i * (optionH + 18); // 調整垂直位置和間距

      // 檢查滑鼠是否懸停在選項上
      if (mouseX > optionX && mouseX < optionX + optionW && mouseY > optionY && mouseY < optionY + optionH) {
        fill(200, 220, 255);
      } else {
        fill(255);
      }

      // 如果是已選擇的選項，改變顏色
      if (selectedOption === i) {
        fill(150, 255, 150);
      }

      stroke(100, 150, 255);
      strokeWeight(2);
      rect(optionX, optionY, optionW, optionH, 10);
      noStroke();

      fill('#3d405b');
      textSize(22 * scaleFactor);
      text(q.options[i], width / 2, optionY + optionH / 2);
    }

    // 顯示回饋訊息
    if (answerChecked) {
      textSize(28 * scaleFactor);
      if (feedbackMessage === '正確！') {
        fill(0, 180, 0);
      } else {
        fill(220, 0, 0);
      }
      text(feedbackMessage, width / 2, height - 50);
    }
  }
}

function drawResultScreen() {
  let percentage = score / questions.length;
  if (percentage >= 0.8) {
    drawPraiseAnimation();
    fill('#3d405b');
    textSize(48 * scaleFactor);
    text('太棒了！你真是個天才！', width / 2, height / 2 - 60);
  } else {
    drawEncouragementAnimation();
    fill('#3d405b');
    textSize(48 * scaleFactor);
    text('別灰心，繼續努力！', width / 2, height / 2 - 60);
  }

  fill('#3d405b');
  textSize(32 * scaleFactor);
  text(`你的分數是: ${score} / ${questions.length}`, width / 2, height / 2 + 20);
}

function mousePressed() {
  if (gameState === 'start') {
    let buttonX = width / 2 - 100;
    let buttonY = height / 2 + 20;
    let buttonW = 200;
    let buttonH = 60;
    if (mouseX > buttonX && mouseX < buttonX + buttonW && mouseY > buttonY && mouseY < buttonY + buttonH) {
      gameState = 'quiz';
    }
  } else if (gameState === 'quiz' && !answerChecked) {
    let q = questions[currentQuestionIndex];
    for (let i = 0; i < q.options.length; i++) {
      let optionW = 420;
      let optionH = 42;
      let optionX = width / 2 - optionW / 2;
      let optionY = height * 0.35 + i * (optionH + 18);

      if (mouseX > optionX && mouseX < optionX + optionW && mouseY > optionY && mouseY < optionY + optionH) {
        selectedOption = i;
        createSelectionParticles(optionX + optionW / 2, optionY + optionH / 2);
        checkAnswer(i);
        break;
      }
    }
  }
}

function checkAnswer(selectedIndex) {
  answerChecked = true;
  let q = questions[currentQuestionIndex];
  if (selectedIndex === q.correctAnswer) {
    score++;
    feedbackMessage = '正確！';
  } else {
    feedbackMessage = `答錯了，正確答案是: ${q.options[q.correctAnswer]}`;
  }

  // 延遲一段時間後進入下一題或結果畫面
  setTimeout(() => {
    currentQuestionIndex++;
    selectedOption = -1;
    answerChecked = false;
    feedbackMessage = '';
    if (currentQuestionIndex >= questions.length) {
      gameState = 'result';
    }
  }, 2000);
}

function updateScale() {
  // 以畫布寬度 800px 為基準計算縮放比例
  scaleFactor = width / 800;
}

// --- 特效和動畫 ---

function drawCursorParticles() {
  // 新增粒子
  particles.push(new Particle(mouseX, mouseY));

  // 更新和繪製粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }
}

function createSelectionParticles(x, y) {
  for (let i = 0; i < 50; i++) {
    selectionParticles.push(new Particle(x, y, true));
  }
}

function drawSelectionParticles() {
  for (let i = selectionParticles.length - 1; i >= 0; i--) {
    selectionParticles[i].update();
    selectionParticles[i].show();
    if (selectionParticles[i].isFinished()) {
      selectionParticles.splice(i, 1);
    }
  }
}

class Particle {
  constructor(x, y, isSelection = false) {
    this.x = x;
    this.y = y;
    this.isSelection = isSelection;
    if (this.isSelection) {
      this.vx = random(-5, 5);
      this.vy = random(-5, 5);
      this.alpha = 255;
      this.color = color(random(100, 255), random(100, 255), 255, this.alpha);
    } else {
      this.vx = random(-1, 1);
      this.vy = random(-1, 1);
      this.alpha = 255;
      this.color = color(random(150, 200), random(150, 255), 255, this.alpha);
    }
  }

  isFinished() {
    return this.alpha < 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.isSelection ? 5 : 3;
    this.color.setAlpha(this.alpha);
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.isSelection ? 8 : 12);
  }
}

function drawPraiseAnimation() {
  // 煙火/彩帶效果
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(random(width), random(height), true));
  }
}

function drawEncouragementAnimation() {
  // 溫和的雨滴效果
  for (let i = 0; i < 2; i++) {
    let p = new Particle(random(width), 0);
    p.vy = random(2, 5);
    p.vx = 0;
    p.color = color(150, 180, 255, 150);
    particles.push(p);
  }
}
