// Action Arcade Mini-Game Engines (Water Cannon, Stem Frogger Pipe Crossing, Leaf Click-to-Shoot Sunbeam Cannon, Bee Shooter)

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
    this.animFrameId = null;
    this.combo = 0;

    this.container = document.getElementById('game-modal-body');
    this.stageTitleEl = document.getElementById('game-stage-title');
  }

  start() {
    this.currentQuestionIdx = 0;
    this.score = 0;
    this.earnedGold = 0;
    this.combo = 0;

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
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
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

        <!-- Question Mission Header -->
        <div class="quiz-mission-box">
          <span class="mission-badge">미션 🎯</span>
          <span class="q-text"><b>Q${q.round}.</b> ${q.question}</span>
        </div>

        <!-- Action Arcade Canvas View -->
        <div class="canvas-wrapper">
          <canvas id="arcade-canvas" width="700" height="340"></canvas>
          <div id="canvas-controls-overlay" class="canvas-controls-overlay"></div>
        </div>

        <!-- Helper Items Bar -->
        <div class="arcade-item-bar">
          <button id="use-time-btn" class="item-btn">⏱️ 시간 +10초 (1 사용)</button>
          <button id="use-hint-btn" class="item-btn">💡 힌트 (오답 1개 공개)</button>
        </div>
      </div>
    `;

    this.initCanvasArcade(q);
    this.attachItemEvents();
  }

  initCanvasArcade(q) {
    const canvas = document.getElementById('arcade-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const organ = this.stage.organEn;

    if (organ === 'roots') {
      this.runWaterCannonGame(canvas, ctx, q);
    } else if (organ === 'stems') {
      this.runStemFroggerGame(canvas, ctx, q);
    } else if (organ === 'leaves') {
      this.runBubbleShooterGame(canvas, ctx, q);
    } else if (organ === 'flowers') {
      this.runBeeShooterGame(canvas, ctx, q);
    }
  }

  // =========================================================================
  // 🎯 GAME 1 [뿌리]: 물대포 쏘기 아케이드 (Water Cannon Shooter)
  // =========================================================================
  runWaterCannonGame(canvas, ctx, q) {
    const W = canvas.width;
    const H = canvas.height;

    const cannon = { x: W / 2, y: H - 30, angle: -Math.PI / 2 };
    const bullets = [];

    const targets = q.options.map((opt, idx) => {
      const isAnswer = opt === q.answer;
      return {
        text: opt,
        isAnswer: isAnswer,
        x: 100 + idx * 150,
        y: 80 + (idx % 2) * 50,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 42,
        destroyed: false
      };
    });

    let mousePos = { x: W / 2, y: 50 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      cannon.angle = Math.atan2(mousePos.y - cannon.y, mousePos.x - cannon.x);
    };

    const handleShoot = () => {
      sound.playBubblePop();
      const speed = 10;
      bullets.push({
        x: cannon.x + Math.cos(cannon.angle) * 35,
        y: cannon.y + Math.sin(cannon.angle) * 35,
        vx: Math.cos(cannon.angle) * speed,
        vy: Math.sin(cannon.angle) * speed,
        radius: 8
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleShoot);
    canvas.addEventListener('touchstart', (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches.length > 0) {
        mousePos.x = e.touches[0].clientX - rect.left;
        mousePos.y = e.touches[0].clientY - rect.top;
        cannon.angle = Math.atan2(mousePos.y - cannon.y, mousePos.x - cannon.x);
        handleShoot();
      }
    });

    const loop = () => {
      ctx.fillStyle = '#231812';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#38281f';
      ctx.lineWidth = 2;
      for (let i = 0; i < H; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i + 10);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cannon.x, cannon.y);
      ctx.rotate(cannon.angle);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, -10, 40, 20);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(30, -12, 10, 24);
      ctx.restore();

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cannon.x, cannon.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px Pretendard';
      ctx.fillText('🌱 뿌리 물대포', cannon.x - 32, cannon.y + 25);

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.stroke();

        targets.forEach(t => {
          if (t.destroyed) return;
          const dist = Math.hypot(b.x - t.x, b.y - t.y);
          if (dist < b.radius + t.radius) {
            t.destroyed = true;
            bullets.splice(i, 1);
            this.handleTargetHit(t, q, canvas, handleMouseMove, handleShoot);
          }
        });

        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
          bullets.splice(i, 1);
        }
      }

      targets.forEach(t => {
        if (t.destroyed) return;
        t.x += t.vx;
        t.y += t.vy;

        if (t.x - t.radius < 10 || t.x + t.radius > W - 10) t.vx *= -1;
        if (t.y - t.radius < 20 || t.y + t.radius > H - 100) t.vy *= -1;

        ctx.fillStyle = 'rgba(14, 165, 233, 0.88)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Pretendard';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x, t.y);
      });

      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  // =========================================================================
  // 🐸 GAME 2 [줄기]: 줄기 파이프 길건너기 아케이드 (Frogger Stem Crossing with Speed Control)
  // =========================================================================
  runStemFroggerGame(canvas, ctx, q) {
    const W = canvas.width;
    const H = canvas.height;

    const frog = { x: W / 2, y: H - 35, stepX: 45, stepY: 55, radius: 18 };
    let speedMultiplier = 1.0;

    const lanes = [
      { y: H - 90, speed: 2, dir: 1, logs: [{ x: 50, w: 120 }, { x: 300, w: 130 }, { x: 550, w: 110 }] },
      { y: H - 145, speed: 2.8, dir: -1, logs: [{ x: 100, w: 140 }, { x: 380, w: 120 }, { x: 620, w: 130 }] },
      { y: H - 200, speed: 2.2, dir: 1, logs: [{ x: 80, w: 130 }, { x: 320, w: 140 }, { x: 580, w: 110 }] },
      { y: H - 255, speed: 3.2, dir: -1, logs: [{ x: 150, w: 120 }, { x: 420, w: 130 }, { x: 650, w: 100 }] }
    ];

    const targets = q.options.map((opt, idx) => {
      const optionWidth = (W - 50) / 4;
      return {
        text: opt,
        isAnswer: opt === q.answer,
        x: 25 + idx * optionWidth,
        y: 10,
        w: optionWidth - 10,
        h: 50,
        reached: false
      };
    });

    const hopUp = () => { sound.playPipeSwitch(); frog.y -= frog.stepY; };
    const hopDown = () => { sound.playPipeSwitch(); frog.y = Math.min(H - 35, frog.y + frog.stepY); };
    const hopLeft = () => { sound.playPipeSwitch(); frog.x = Math.max(30, frog.x - frog.stepX); };
    const hopRight = () => { sound.playPipeSwitch(); frog.x = Math.min(W - 30, frog.x + frog.stepX); };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') hopUp();
      if (e.key === 'ArrowDown' || e.key === 's') hopDown();
      if (e.key === 'ArrowLeft' || e.key === 'a') hopLeft();
      if (e.key === 'ArrowRight' || e.key === 'd') hopRight();
    };

    window.addEventListener('keydown', handleKeyDown);

    const overlay = document.getElementById('canvas-controls-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="frogger-controls-wrapper">
          <div class="speed-selector-bar">
            <span style="font-size:0.85rem;font-weight:700;color:#fde047;">⚡ 파이프 속도 조절:</span>
            <button id="speed-slow" class="speed-btn">🐢 느림</button>
            <button id="speed-normal" class="speed-btn active">🚗 보통</button>
            <button id="speed-fast" class="speed-btn">⚡ 빠름</button>
          </div>
          <div class="dpad-container">
            <button id="btn-frog-up" class="dpad-btn">▲</button>
            <div class="dpad-mid">
              <button id="btn-frog-left" class="dpad-btn">◀</button>
              <button id="btn-frog-right" class="dpad-btn">▶</button>
            </div>
            <button id="btn-frog-down" class="dpad-btn">▼</button>
          </div>
        </div>
      `;

      overlay.querySelector('#btn-frog-up').onclick = hopUp;
      overlay.querySelector('#btn-frog-down').onclick = hopDown;
      overlay.querySelector('#btn-frog-left').onclick = hopLeft;
      overlay.querySelector('#btn-frog-right').onclick = hopRight;

      const slowBtn = overlay.querySelector('#speed-slow');
      const normBtn = overlay.querySelector('#speed-normal');
      const fastBtn = overlay.querySelector('#speed-fast');

      slowBtn.onclick = () => {
        speedMultiplier = 0.4;
        slowBtn.classList.add('active'); normBtn.classList.remove('active'); fastBtn.classList.remove('active');
      };
      normBtn.onclick = () => {
        speedMultiplier = 1.0;
        normBtn.classList.add('active'); slowBtn.classList.remove('active'); fastBtn.classList.remove('active');
      };
      fastBtn.onclick = () => {
        speedMultiplier = 1.8;
        fastBtn.classList.add('active'); slowBtn.classList.remove('active'); normBtn.classList.remove('active');
      };
    }

    const resetFrog = () => {
      sound.playWrong();
      frog.x = W / 2;
      frog.y = H - 35;
    };

    const loop = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.fillRect(0, H - 60, W, 60);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px Pretendard';
      ctx.fillText('🐸 시작 지점 (화살표 키로 건너세요!)', 20, H - 20);

      let onLog = false;
      let logVelocity = 0;

      lanes.forEach(lane => {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
        ctx.fillRect(0, lane.y - 25, W, 50);

        lane.logs.forEach(log => {
          log.x += lane.speed * lane.dir * speedMultiplier;
          if (lane.dir === 1 && log.x > W) log.x = -log.w;
          if (lane.dir === -1 && log.x < -log.w) log.x = W;

          ctx.fillStyle = '#78350f';
          ctx.fillRect(log.x, lane.y - 20, log.w, 40);
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 3;
          ctx.strokeRect(log.x, lane.y - 20, log.w, 40);

          if (
            Math.abs(frog.y - lane.y) < 20 &&
            frog.x >= log.x && frog.x <= log.x + log.w
          ) {
            onLog = true;
            logVelocity = lane.speed * lane.dir * speedMultiplier;
          }
        });
      });

      const inWaterZone = frog.y < H - 65 && frog.y > 60;
      if (inWaterZone && !onLog) {
        resetFrog();
      } else if (onLog) {
        frog.x += logVelocity;
        if (frog.x < 10 || frog.x > W - 10) resetFrog();
      }

      targets.forEach(t => {
        if (t.reached) return;

        ctx.fillStyle = 'rgba(14, 165, 233, 0.9)';
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 3;
        ctx.strokeRect(t.x, t.y, t.w, t.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Pretendard';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x + t.w / 2, t.y + t.h / 2);

        if (
          frog.y <= t.y + t.h + 15 &&
          frog.x >= t.x && frog.x <= t.x + t.w
        ) {
          t.reached = true;
          window.removeEventListener('keydown', handleKeyDown);
          this.handleTargetHit(t, q, canvas);
        }
      });

      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐸', frog.x, frog.y);

      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  // =========================================================================
  // 🍃 GAME 3 [잎]: 버튼 클릭 발사 광합성 탄환 아케이드 (Click-to-Shoot Sunbeam Cannon)
  // =========================================================================
  runBubbleShooterGame(canvas, ctx, q) {
    const W = canvas.width;
    const H = canvas.height;

    // Cannon sitting at bottom
    const cannon = { x: W / 2, y: H - 30, angle: -Math.PI / 2 };
    const bullets = [];

    // Option Target Bricks placed at top
    const targets = q.options.map((opt, idx) => {
      const optionWidth = (W - 60) / 4;
      return {
        text: opt,
        isAnswer: opt === q.answer,
        x: 20 + idx * optionWidth + idx * 10,
        y: 60,
        width: optionWidth,
        height: 60,
        hit: false
      };
    });

    let mousePos = { x: W / 2, y: 50 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      cannon.angle = Math.atan2(mousePos.y - cannon.y, mousePos.x - cannon.x);
    };

    const handleShoot = () => {
      sound.playBubblePop();
      const speed = 9;
      bullets.push({
        x: cannon.x + Math.cos(cannon.angle) * 35,
        y: cannon.y + Math.sin(cannon.angle) * 35,
        vx: Math.cos(cannon.angle) * speed,
        vy: Math.sin(cannon.angle) * speed,
        radius: 12
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleShoot);
    canvas.addEventListener('touchstart', (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches.length > 0) {
        mousePos.x = e.touches[0].clientX - rect.left;
        mousePos.y = e.touches[0].clientY - rect.top;
        cannon.angle = Math.atan2(mousePos.y - cannon.y, mousePos.x - cannon.x);
        handleShoot();
      }
    });

    // Dedicated On-screen Shoot Button
    const overlay = document.getElementById('canvas-controls-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="display:flex;justify-content:center;width:100%;padding:10px;">
          <button id="btn-fire-sun" class="primary-btn glow-btn" style="width:240px;padding:14px;font-size:1.15rem;background:linear-gradient(135deg,#f59e0b,#d97706);">
            ☀️ 광합성 탄환 발사! (클릭)
          </button>
        </div>
      `;
      overlay.querySelector('#btn-fire-sun').onclick = handleShoot;
    }

    const loop = () => {
      // Leaf BG
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, W - 20, H - 20);

      // Draw Cannon Base & Barrel
      ctx.save();
      ctx.translate(cannon.x, cannon.y);
      ctx.rotate(cannon.angle);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, -10, 40, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(30, -12, 10, 24);
      ctx.restore();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cannon.x, cannon.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Pretendard';
      ctx.textAlign = 'center';
      ctx.fillText('🍃 잎 탄환 대포', cannon.x, cannon.y + 35);

      // Update & Draw Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Check Brick Collision
        targets.forEach(t => {
          if (t.hit) return;
          if (
            b.x + b.radius >= t.x && b.x - b.radius <= t.x + t.width &&
            b.y - b.radius <= t.y + t.height && b.y + b.radius >= t.y
          ) {
            t.hit = true;
            bullets.splice(i, 1);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleShoot);
            this.handleTargetHit(t, q, canvas);
          }
        });

        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
          bullets.splice(i, 1);
        }
      }

      // Draw Option Target Bricks (Uniform emerald color!)
      targets.forEach(t => {
        if (t.hit) return;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.fillRect(t.x, t.y, t.width, t.height);
        ctx.strokeStyle = '#d1fae5';
        ctx.lineWidth = 3;
        ctx.strokeRect(t.x, t.y, t.width, t.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Pretendard';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x + t.width / 2, t.y + t.height / 2);
      });

      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  // =========================================================================
  // 🌸 GAME 4 [꽃과 열매]: 꿀벌 비행 슈터 아케이드 (Bee Flying Shooter)
  // =========================================================================
  runBeeShooterGame(canvas, ctx, q) {
    const W = canvas.width;
    const H = canvas.height;

    const bee = { x: 80, y: H / 2, radius: 20 };
    const stamenPollen = [];

    const targets = q.options.map((opt, idx) => {
      return {
        text: opt,
        isAnswer: opt === q.answer,
        x: W - 140,
        y: 50 + idx * 70,
        width: 120,
        height: 50,
        hit: false
      };
    });

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      bee.y = e.clientY - rect.top;
    };

    const handleShoot = () => {
      sound.playBeeFly();
      stamenPollen.push({ x: bee.x + 20, y: bee.y, vx: 8, radius: 7 });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleShoot);

    const loop = () => {
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(0, 0, W, H);

      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐝', bee.x, bee.y);

      for (let i = stamenPollen.length - 1; i >= 0; i--) {
        const p = stamenPollen[i];
        p.x += p.vx;

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        targets.forEach(t => {
          if (t.hit) return;
          if (p.x > t.x && p.x < t.x + t.width && p.y > t.y && p.y < t.y + t.height) {
            t.hit = true;
            stamenPollen.splice(i, 1);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleShoot);
            this.handleTargetHit(t, q, canvas);
          }
        });

        if (p.x > W) stamenPollen.splice(i, 1);
      }

      targets.forEach(t => {
        if (t.hit) return;

        ctx.fillStyle = 'rgba(192, 38, 211, 0.9)';
        ctx.fillRect(t.x, t.y, t.width, t.height);
        ctx.strokeStyle = '#fae8ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(t.x, t.y, t.width, t.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Pretendard';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x + t.width / 2, t.y + t.height / 2);
      });

      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  handleTargetHit(target, q, canvas) {
    this.clearInterval();

    const isCorrect = target.isAnswer || target.text === q.answer;

    if (isCorrect) {
      sound.playCorrect();
      this.combo += 1;
      const basePoints = 60;
      const timeBonus = this.timeLeft * 2;
      const comboBonus = this.combo * 15;
      const roundGold = 40 + this.combo * 5 + Math.floor(this.timeLeft / 2);

      this.score += basePoints + timeBonus + comboBonus;
      this.earnedGold += roundGold;

      this.showFeedbackModal(true, q, roundGold);
    } else {
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
        <div class="feedback-icon">${isCorrect ? '🎯' : (isTimeout ? '⏱️' : '❌')}</div>
        <h3 class="feedback-title">${isCorrect ? '목적지 도달! 정답입니다!' : (isTimeout ? '시간 초과!' : '아쉽습니다! 오답입니다.')}</h3>

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

  attachItemEvents() {
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
          alert('💡 힌트: 정답은 [' + this.stage.questions[this.currentQuestionIdx].answer + '] 입니다!');
          useHintBtn.textContent = '💡 힌트 적용 완료!';
          useHintBtn.disabled = true;
        } else {
          alert('상점에서 [오답 힌트] 아이템을 먼저 구매해 주세요!');
        }
      });
    }
  }

  finishStage(success) {
    this.clearInterval();

    let stars = 1;
    if (this.score > 400) stars = 3;
    else if (this.score > 250) stars = 2;

    confetti({
      particleCount: 120,
      spread: 80,
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
            <span class="stat-label">아케이드 총 점수</span>
            <span class="stat-value">${this.score}점</span>
          </div>
          <div class="result-stat-box">
            <span class="stat-label">획득 골드</span>
            <span class="stat-value">+${this.earnedGold} Gold</span>
          </div>
          <div class="result-stat-box">
            <span class="stat-label">완료 라운드</span>
            <span class="stat-value">5 / 5 Complete</span>
          </div>
        </div>

        <p class="congrats-text">축하합니다! 액션 아케이드 미션을 성공하고 지식을 정복했습니다!</p>

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
