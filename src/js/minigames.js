// Arcade Mini-Game Engine for 4 Plant Organs (Roots, Stems, Leaves, Flowers)

import { sound } from './audio.js';
import { useItem } from './shop.js';
import confetti from 'canvas-confetti';

export class ArcadeGame {
  constructor(stageData, playerState, onCompleteCallback) {
    this.stage = stageData;
    this.playerState = playerState;
    this.onComplete = onCompleteCallback;

    this.currentQuestionIdx = 0;
    this.score = 0;
    this.earnedGold = 0;
    this.timeLeft = 25;
    this.timerInterval = null;
    this.combo = 0;
    this.hearts = 3;

    this.container = document.getElementById('game-modal-body');
    this.stageTitleEl = document.getElementById('game-stage-title');
  }

  start() {
    this.currentQuestionIdx = 0;
    this.score = 0;
    this.earnedGold = 0;
    this.combo = 0;
    this.hearts = 3;

    if (this.stageTitleEl) {
      this.stageTitleEl.textContent = `${this.stage.title} (라운드 1/5)`;
    }

    this.renderQuestionRound();
  }

  startTimer() {
    this.clearInterval();
    this.timeLeft = 25;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        this.clearInterval();
        this.handleTimeOut();
      }
    }, 1000);
  }

  clearInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerBar = document.getElementById('timer-bar-fill');
    const timerText = document.getElementById('timer-text');
    if (timerBar) {
      const percentage = Math.max(0, (this.timeLeft / 25) * 100);
      timerBar.style.width = `${percentage}%`;
      if (percentage < 25) {
        timerBar.style.backgroundColor = '#ef4444';
      } else if (percentage < 50) {
        timerBar.style.backgroundColor = '#f59e0b';
      } else {
        timerBar.style.backgroundColor = this.stage.themeColor || '#4ade80';
      }
    }
    if (timerText) {
      timerText.textContent = `${this.timeLeft}초`;
    }
  }

  renderQuestionRound() {
    const q = this.stage.questions[this.currentQuestionIdx];
    if (!q) {
      this.finishStage(true);
      return;
    }

    if (this.stageTitleEl) {
      this.stageTitleEl.textContent = `${this.stage.title} (${q.round}/5 라운드)`;
    }

    this.startTimer();

    let arcadeHTML = '';

    // Render Stage-specific Arcade Mechanics Header
    if (this.stage.organEn === 'roots') {
      arcadeHTML = this.renderRootDiggingArcade(q);
    } else if (this.stage.organEn === 'stems') {
      arcadeHTML = this.renderStemPipeArcade(q);
    } else if (this.stage.organEn === 'leaves') {
      arcadeHTML = this.renderLeafBubbleArcade(q);
    } else if (this.stage.organEn === 'flowers') {
      arcadeHTML = this.renderFlowerBeeArcade(q);
    }

    this.container.innerHTML = `
      <div class="arcade-card glass-panel fade-in">
        <!-- Top Arcade Bar -->
        <div class="arcade-top-bar">
          <div class="timer-container">
            <span class="timer-label">⏱️ 남은 시간: <b id="timer-text">${this.timeLeft}초</b></span>
            <div class="timer-bar-bg">
              <div id="timer-bar-fill" class="timer-bar-fill" style="width: 100%; background-color: ${this.stage.themeColor}"></div>
            </div>
          </div>

          <div class="arcade-stats">
            <span class="stat-badge">🔥 콤보: <b id="combo-count">${this.combo}</b></span>
            <span class="stat-badge">💰 획득 골드: <b id="earned-gold">${this.earnedGold}</b>G</span>
          </div>
        </div>

        <!-- Arcade Canvas/Interactive Stage Area -->
        <div id="arcade-interactive-zone" class="arcade-interactive-zone" style="background: ${this.stage.bgGradient}">
          ${arcadeHTML}
        </div>

        <!-- Question Box -->
        <div class="quiz-question-box">
          <span class="q-tag">Q${q.round}.</span>
          <p class="q-text">${q.question}</p>
        </div>

        <!-- Options / Arcade Touch Buttons -->
        <div id="options-grid" class="options-grid">
          ${q.options.map((opt, idx) => `
            <button class="option-btn" data-option="${opt}">
              <span class="opt-num">${idx + 1}</span>
              <span class="opt-label">${opt}</span>
            </button>
          `).join('')}
        </div>

        <!-- Helper Items Bar -->
        <div class="arcade-item-bar">
          <button id="use-time-btn" class="item-btn">⏱️ 시간 +10초 (1 사용)</button>
          <button id="use-hint-btn" class="item-btn">💡 힌트 (오답 1개 제거)</button>
        </div>
      </div>
    `;

    this.attachEvents(q);
  }

  renderRootDiggingArcade(q) {
    return `
      <div class="arcade-soil-view">
        <div class="soil-header">🌱 흙 속 뿌리 탐험 (흡수할 버블을 클릭/터치하세요!)</div>
        <div class="bubbles-float-container">
          ${q.bubbles.map((b, idx) => `
            <div class="floating-bubble root-bubble" data-bubble-name="${b}" style="animation-delay: ${idx * 0.4}s">
              💧 <span>${b}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderStemPipeArcade(q) {
    return `
      <div class="arcade-pipe-view">
        <div class="pipe-header">🪵 줄기 물관(안쪽, 물) vs 체관(바깥쪽, 양분) 수송 파이프</div>
        <div class="pipe-tracks">
          <div class="pipe-line xylem">
            <span class="pipe-label">💧 물관 (안쪽)</span>
            <div class="flow-particles water-flow"></div>
          </div>
          <div class="pipe-line phloem">
            <span class="pipe-label">🌾 체관 (바깥쪽)</span>
            <div class="flow-particles food-flow"></div>
          </div>
        </div>
        <div class="pipe-controls">
          <button id="pump-water-btn" class="arcade-action-btn">⚡ 물과 양분 펌핑하기!</button>
        </div>
      </div>
    `;
  }

  renderLeafBubbleArcade(q) {
    return `
      <div class="arcade-leaf-view">
        <div class="leaf-header">🍃 잎 기공 퐁퐁 버블 아케이드</div>
        <div class="leaf-bubbles-container">
          ${q.bubbles.map((b, idx) => `
            <div class="floating-bubble leaf-bubble" data-bubble-name="${b}" style="animation-delay: ${idx * 0.3}s">
              🫧 <span>${b}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderFlowerBeeArcade(q) {
    return `
      <div class="arcade-bee-view">
        <div class="bee-header">🐝 꿀벌 비행 수분 작전! 꽃가루를 암술머리로!</div>
        <div class="flower-scene">
          <div class="flower-part stamen">🐝 수술 (꽃가루)</div>
          <div class="bee-character" id="bee-character">🐝</div>
          <div class="flower-part pistil">🌸 암술머리</div>
        </div>
      </div>
    `;
  }

  attachEvents(q) {
    // Option Click Handlers
    const optionBtns = this.container.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-option');
        this.submitAnswer(selected, q);
      });
    });

    // Bubble Click Handlers in Arcade View
    const bubbles = this.container.querySelectorAll('.floating-bubble');
    bubbles.forEach(b => {
      b.addEventListener('click', () => {
        sound.playBubblePop();
        b.classList.add('pop-anim');
        const bName = b.getAttribute('data-bubble-name');
        // If bubble name matches one of options, submit it!
        if (bName) {
          this.submitAnswer(bName, q);
        }
      });
    });

    // Stem Pump Button
    const pumpBtn = this.container.querySelector('#pump-water-btn');
    if (pumpBtn) {
      pumpBtn.addEventListener('click', () => {
        sound.playPipeSwitch();
        pumpBtn.classList.add('pulse-anim');
        setTimeout(() => pumpBtn.classList.remove('pulse-anim'), 300);
      });
    }

    // Bee Character interactive fly
    const bee = this.container.querySelector('#bee-character');
    if (bee) {
      bee.addEventListener('click', () => {
        sound.playBeeFly();
        bee.style.transform = 'translate(100px, -20px) scale(1.3)';
        setTimeout(() => {
          bee.style.transform = 'translate(0, 0) scale(1)';
        }, 600);
      });
    }

    // Item Buttons
    const useTimeBtn = this.container.querySelector('#use-time-btn');
    if (useTimeBtn) {
      useTimeBtn.addEventListener('click', () => {
        if (useItem('extra_time')) {
          sound.playCorrect();
          this.timeLeft += 10;
          this.updateTimerDisplay();
          useTimeBtn.textContent = '⏱️ 시간 +10초 적용 완료!';
          useTimeBtn.disabled = true;
        } else {
          alert('상점에서 [시간 +10초 연장] 아이템을 먼저 구매해 주세요!');
        }
      });
    }

    const useHintBtn = this.container.querySelector('#use-hint-btn');
    if (useHintBtn) {
      useHintBtn.addEventListener('click', () => {
        if (useItem('hint_remove')) {
          sound.playCorrect();
          // Remove 1 wrong option button
          const wrongBtns = Array.from(optionBtns).filter(b => b.getAttribute('data-option') !== q.answer);
          if (wrongBtns.length > 0) {
            wrongBtns[0].style.opacity = '0.2';
            wrongBtns[0].disabled = true;
          }
          useHintBtn.textContent = '💡 힌트 적용 완료!';
          useHintBtn.disabled = true;
        } else {
          alert('상점에서 [오답 힌트] 아이템을 먼저 구매해 주세요!');
        }
      });
    }
  }

  submitAnswer(selected, q) {
    this.clearInterval();

    if (selected === q.answer) {
      // Correct!
      sound.playCorrect();
      this.combo += 1;
      const basePoints = 50;
      const timeBonus = this.timeLeft * 2;
      const comboBonus = this.combo * 10;
      const roundGold = 30 + this.combo * 5 + Math.floor(this.timeLeft / 2);

      this.score += basePoints + timeBonus + comboBonus;
      this.earnedGold += roundGold;

      this.showFeedbackModal(true, q, roundGold);
    } else {
      // Wrong!
      sound.playWrong();
      this.combo = 0;
      this.showFeedbackModal(false, q, 0);
    }
  }

  handleTimeOut() {
    sound.playWrong();
    this.combo = 0;
    const q = this.stage.questions[this.currentQuestionIdx];
    this.showFeedbackModal(false, q, 0, true);
  }

  showFeedbackModal(isCorrect, q, goldEarned, isTimeout = false) {
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'feedback-overlay fade-in';

    feedbackEl.innerHTML = `
      <div class="feedback-card ${isCorrect ? 'correct-card' : 'wrong-card'} glass-panel">
        <div class="feedback-icon">${isCorrect ? '🎉' : (isTimeout ? '⏱️' : '❌')}</div>
        <h3 class="feedback-title">${isCorrect ? '정답입니다!' : (isTimeout ? '시간 초과!' : '아쉬워요!')}</h3>

        <div class="feedback-explanation">
          <p class="answer-highlight"><b>정답:</b> ${q.answer}</p>
          <p class="exp-text">${q.explanation}</p>
        </div>

        ${isCorrect ? `
          <div class="earned-reward">
            <span>➕ 획득 골드: <b>+${goldEarned}G</b></span>
          </div>
        ` : ''}

        <button id="next-round-btn" class="primary-btn glow-btn">
          ${this.currentQuestionIdx < 4 ? '다음 라운드 도전! ➔' : '스테이지 결과 확인! 🏆'}
        </button>
      </div>
    `;

    document.body.appendChild(feedbackEl);

    feedbackEl.querySelector('#next-round-btn').addEventListener('click', () => {
      sound.playClick();
      document.body.removeChild(feedbackEl);
      this.currentQuestionIdx += 1;
      if (this.currentQuestionIdx < 5) {
        this.renderQuestionRound();
      } else {
        this.finishStage(true);
      }
    });
  }

  finishStage(success) {
    this.clearInterval();

    // Calculate Stars
    let stars = 1;
    if (this.score > 350) stars = 3;
    else if (this.score > 200) stars = 2;

    // Confetti effect!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    sound.playFanfare();

    this.container.innerHTML = `
      <div class="stage-result-card glass-panel fade-in text-center">
        <h2 class="result-heading">🏆 STAGE CLEAR! 🏆</h2>
        <h3 class="stage-name">${this.stage.title}</h3>

        <div class="stars-display">
          ${'⭐'.repeat(stars)}
        </div>

        <div class="result-stats-grid">
          <div class="result-stat-box">
            <span class="stat-label">총 점수</span>
            <span class="stat-value">${this.score}점</span>
          </div>
          <div class="result-stat-box">
            <span class="stat-label">획득 골드</span>
            <span class="stat-value">+${this.earnedGold} Gold</span>
          </div>
          <div class="result-stat-box">
            <span class="stat-label">클리어 라운드</span>
            <span class="stat-value">5 / 5 Complete</span>
          </div>
        </div>

        <p class="congrats-text">축하합니다! 식물의 구조와 기능 지식을 완벽히 습득하셨습니다!</p>

        <button id="finish-game-btn" class="primary-btn glow-btn large-btn">
          메인 화면으로 돌아가기 🏠
        </button>
      </div>
    `;

    document.getElementById('finish-game-btn').addEventListener('click', () => {
      sound.playClick();
      if (this.onComplete) {
        this.onComplete({
          stageId: this.stage.id,
          goldEarned: this.earnedGold,
          score: this.score,
          stars: stars
        });
      }
    });
  }
}
