// Main Application Controller for Plant Science Arcade

import { STAGE_DATA } from './js/questions.js';
import { ArcadeGame } from './js/minigames.js';
import { sound } from './js/audio.js';
import { 
  fetchTop10Leaderboard, 
  updateLeaderboardRecord 
} from './js/leaderboard.js';
import { 
  SHOP_ITEMS, 
  getInventory, 
  buyItem 
} from './js/shop.js';
import { 
  loginWithGoogle, 
  loginAnonymously, 
  logoutUser, 
  subscribeAuthState 
} from './js/firebase.js';

class App {
  constructor() {
    this.playerState = this.loadPlayerState();
    this.currentUser = null;
    this.activeGame = null;

    this.initElements();
    this.initAuth();
    this.attachGlobalEvents();
    this.renderUI();
  }

  loadPlayerState() {
    const defaultState = {
      gold: 50, // Initial bonus gold for starting play!
      unlockedStages: [1], // Stage 1 is unlocked by default
      stageStars: {},
      clearedCount: 0,
      totalStars: 0
    };

    try {
      const saved = localStorage.getItem('plant_arcade_player_state');
      if (saved) {
        return { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Error loading player state:", e);
    }
    return defaultState;
  }

  savePlayerState() {
    try {
      localStorage.setItem('plant_arcade_player_state', JSON.stringify(this.playerState));
    } catch (e) {
      console.warn("Error saving player state:", e);
    }
    this.updateHeaderStats();
    this.syncLeaderboard();
  }

  initElements() {
    // Top Bar Elements
    this.goldDisplay = document.getElementById('nav-gold-display');
    this.clearedDisplay = document.getElementById('cleared-count-display');
    this.starsDisplay = document.getElementById('total-stars-display');
    this.stageCardsGrid = document.getElementById('stage-cards-grid');

    // Modals & Buttons
    this.gameModal = document.getElementById('game-modal');
    this.closeGameBtn = document.getElementById('close-game-modal-btn');

    this.hallModal = document.getElementById('hall-modal');
    this.hallBtn = document.getElementById('hall-of-fame-btn');
    this.closeHallBtn = document.getElementById('close-hall-modal-btn');

    this.shopModal = document.getElementById('shop-modal');
    this.shopBtn = document.getElementById('shop-btn');
    this.closeShopBtn = document.getElementById('close-shop-modal-btn');

    this.authModal = document.getElementById('auth-modal');
    this.authBtn = document.getElementById('auth-btn');
    this.closeAuthBtn = document.getElementById('close-auth-modal-btn');

    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
  }

  initAuth() {
    subscribeAuthState((user) => {
      this.currentUser = user;
      this.renderAuthWidget();
      if (user) {
        this.syncLeaderboard();
      }
    });
  }

  renderAuthWidget() {
    const widget = document.getElementById('user-profile-widget');
    if (!widget) return;

    if (this.currentUser) {
      const name = this.currentUser.displayName || '탐구자님';
      widget.innerHTML = `
        <div class="user-pill glass-panel" style="display:flex;align-items:center;gap:8px;padding:4px 12px;border-radius:20px;">
          <span>👤 <b>${name}</b></span>
          <button id="logout-btn" class="nav-btn" style="padding:2px 8px;font-size:0.75rem;">로그아웃</button>
        </div>
      `;
      const logoutBtn = widget.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await logoutUser();
          this.currentUser = null;
          this.renderAuthWidget();
        });
      }
    } else {
      widget.innerHTML = `
        <button id="auth-btn" class="auth-btn">
          👤 로그인
        </button>
      `;
      const authBtn = widget.querySelector('#auth-btn');
      if (authBtn) {
        authBtn.addEventListener('click', () => this.openAuthModal());
      }
    }
  }

  attachGlobalEvents() {
    // Sound toggle
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        const muted = sound.toggleMute();
        this.soundToggleBtn.textContent = muted ? '🔇' : '🔊';
      });
    }

    // Modal Triggers
    if (this.hallBtn) this.hallBtn.addEventListener('click', () => this.openHallModal());
    if (this.closeHallBtn) this.closeHallBtn.addEventListener('click', () => this.closeHallModal());

    if (this.shopBtn) this.shopBtn.addEventListener('click', () => this.openShopModal());
    if (this.closeShopBtn) this.closeShopBtn.addEventListener('click', () => this.closeShopModal());

    if (this.closeGameBtn) this.closeGameBtn.addEventListener('click', () => this.closeGameModal());
    if (this.closeAuthBtn) this.closeAuthBtn.addEventListener('click', () => this.closeAuthModal());
  }

  renderUI() {
    this.updateHeaderStats();
    this.renderStageCards();
  }

  updateHeaderStats() {
    if (this.goldDisplay) this.goldDisplay.textContent = this.playerState.gold;

    const clearedCount = this.playerState.unlockedStages.length > 1 
      ? Math.min(4, Object.keys(this.playerState.stageStars).length) 
      : (this.playerState.stageStars[1] ? 1 : 0);

    let totalStars = 0;
    Object.values(this.playerState.stageStars).forEach(s => totalStars += s);

    this.playerState.clearedCount = clearedCount;
    this.playerState.totalStars = totalStars;

    if (this.clearedDisplay) this.clearedDisplay.textContent = `${clearedCount} / 4`;
    if (this.starsDisplay) this.starsDisplay.textContent = `${totalStars} ★`;
  }

  renderStageCards() {
    if (!this.stageCardsGrid) return;

    this.stageCardsGrid.innerHTML = STAGE_DATA.map(stage => {
      const isUnlocked = this.playerState.unlockedStages.includes(stage.id);
      const stars = this.playerState.stageStars[stage.id] || 0;

      return `
        <div class="stage-card glass-panel ${isUnlocked ? '' : 'locked'}" style="background: ${stage.bgGradient}">
          <div class="stage-card-header">
            <span class="stage-organ-tag">${stage.organ}</span>
            <span class="stage-number">STAGE 0${stage.id}</span>
          </div>

          <div class="stage-card-body">
            <h4 class="stage-card-title">${stage.title}</h4>
            <p class="stage-card-desc">${stage.description}</p>
          </div>

          <div class="stage-card-footer">
            ${isUnlocked ? `
              <div class="stage-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
              <button class="play-stage-btn glow-btn" data-stage-id="${stage.id}">
                도전하기 ➔
              </button>
            ` : `
              <button class="play-stage-btn unlock-btn" data-unlock-id="${stage.id}" data-cost="${stage.unlockCost}">
                🔒 ${stage.unlockCost} Gold로 해금!
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach Play & Unlock listeners
    const playBtns = this.stageCardsGrid.querySelectorAll('[data-stage-id]');
    playBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const stageId = parseInt(btn.getAttribute('data-stage-id'), 10);
        this.launchStageGame(stageId);
      });
    });

    const unlockBtns = this.stageCardsGrid.querySelectorAll('[data-unlock-id]');
    unlockBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const stageId = parseInt(btn.getAttribute('data-unlock-id'), 10);
        const cost = parseInt(btn.getAttribute('data-cost'), 10);
        this.unlockStage(stageId, cost);
      });
    });
  }

  unlockStage(stageId, cost) {
    if (this.playerState.gold < cost) {
      sound.playWrong();
      alert(`골드가 부족합니다! (${cost} Gold 필요, 현재: ${this.playerState.gold} Gold)\n이전 스테이지를 다시 재도전하여 골드를 모아보세요!`);
      return;
    }

    sound.playCorrect();
    this.playerState.gold -= cost;
    this.playerState.unlockedStages.push(stageId);
    this.savePlayerState();
    this.renderUI();
    alert(`🎉 STAGE 0${stageId}가 해금되었습니다! 지금 바로 도전하세요!`);
  }

  launchStageGame(stageId) {
    sound.playClick();
    const stage = STAGE_DATA.find(s => s.id === stageId);
    if (!stage) return;

    this.gameModal.classList.remove('hidden');

    this.activeGame = new ArcadeGame(stage, this.playerState, (results) => {
      this.handleGameComplete(results);
    });
    this.activeGame.start();
  }

  handleGameComplete(results) {
    this.playerState.gold += results.goldEarned;
    const currentStars = this.playerState.stageStars[results.stageId] || 0;
    this.playerState.stageStars[results.stageId] = Math.max(currentStars, results.stars);

    this.savePlayerState();
    this.closeGameModal();
    this.renderUI();

    // Auto open Hall of Fame on clear
    setTimeout(() => {
      this.openHallModal();
    }, 500);
  }

  closeGameModal() {
    if (this.activeGame) {
      this.activeGame.clearInterval();
    }
    this.gameModal.classList.add('hidden');
  }

  // MODAL: Hall of Fame (Top 10 Leaderboard)
  async openHallModal() {
    sound.playClick();
    this.hallModal.classList.remove('hidden');
    await this.renderLeaderboardTab('gold');

    const tabGold = document.getElementById('tab-gold-rank');
    const tabCleared = document.getElementById('tab-cleared-rank');

    if (tabGold) {
      tabGold.addEventListener('click', async () => {
        sound.playClick();
        tabGold.classList.add('active');
        tabCleared.classList.remove('active');
        await this.renderLeaderboardTab('gold');
      });
    }

    if (tabCleared) {
      tabCleared.addEventListener('click', async () => {
        sound.playClick();
        tabCleared.classList.add('active');
        tabGold.classList.remove('active');
        await this.renderLeaderboardTab('cleared');
      });
    }
  }

  closeHallModal() {
    this.hallModal.classList.add('hidden');
  }

  async renderLeaderboardTab(type = 'gold') {
    const listEl = document.getElementById('hall-rankings-list');
    if (!listEl) return;

    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;">🏆 랭킹 데이터를 불러오는 중...</div>';

    const top10 = await fetchTop10Leaderboard(type);

    listEl.innerHTML = top10.map((item, idx) => `
      <div class="rank-item ${idx === 0 ? 'top-1' : ''}">
        <span class="rank-badge">${idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}위`))}</span>
        <span class="rank-user">${item.displayName || '익명 탐구자'}</span>
        <span class="rank-score">
          ${type === 'gold' ? `💰 ${item.gold} G` : `⭐ ${item.clearedCount || 0}개 클리어 (${item.totalStars || 0}★)`}
        </span>
      </div>
    `).join('');
  }

  syncLeaderboard() {
    updateLeaderboardRecord(this.currentUser, {
      gold: this.playerState.gold,
      clearedCount: this.playerState.clearedCount,
      totalStars: this.playerState.totalStars
    });
  }

  // MODAL: Shop
  openShopModal() {
    sound.playClick();
    this.shopModal.classList.remove('hidden');
    this.renderShopContent();
  }

  closeShopModal() {
    this.shopModal.classList.add('hidden');
  }

  renderShopContent() {
    const goldEl = document.getElementById('shop-user-gold');
    const itemsGrid = document.getElementById('shop-items-grid');
    if (goldEl) goldEl.textContent = this.playerState.gold;

    const inventory = getInventory();

    if (itemsGrid) {
      itemsGrid.innerHTML = SHOP_ITEMS.map(item => `
        <div class="shop-item-card">
          <div>
            <div style="font-weight:800;font-size:1.05rem;">${item.name}</div>
            <div style="font-size:0.8rem;color:#9ca3af;">${item.description}</div>
            <div style="font-size:0.8rem;color:#4ade80;margin-top:4px;">보유 수량: <b>${inventory[item.id] || 0}개</b></div>
          </div>
          <button class="buy-item-btn" data-buy-id="${item.id}">
            💰 ${item.cost} G 구매
          </button>
        </div>
      `).join('');

      const buyBtns = itemsGrid.querySelectorAll('[data-buy-id]');
      buyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const itemId = btn.getAttribute('data-buy-id');
          const result = buyItem(itemId, this.playerState.gold, (newGold) => {
            this.playerState.gold = newGold;
            this.savePlayerState();
          });

          if (result.success) {
            sound.playCorrect();
            alert(result.message);
            this.renderShopContent();
            this.updateHeaderStats();
          } else {
            sound.playWrong();
            alert(result.message);
          }
        });
      });
    }
  }

  // MODAL: Auth
  openAuthModal() {
    sound.playClick();
    this.authModal.classList.remove('hidden');
    const box = document.getElementById('auth-state-box');
    if (box) {
      box.innerHTML = `
        <h4 style="font-size:1.2rem;margin-bottom:16px;">Firebase 로그인 방식을 선택하세요</h4>
        <button id="google-login-btn" class="primary-btn glow-btn" style="margin-bottom:12px;background:linear-gradient(135deg, #4285F4, #34A853)">
          🌐 Google 계정으로 로그인 (실시간 랭킹 연동)
        </button>
        <button id="anon-login-btn" class="nav-btn" style="width:100%;padding:12px;font-size:0.95rem;">
          👤 익명 게스트로 시작하기
        </button>
      `;

      box.querySelector('#google-login-btn').addEventListener('click', async () => {
        try {
          const user = await loginWithGoogle();
          this.currentUser = user;
          sound.playCorrect();
          alert(`환영합니다, ${user.displayName || '탐구자'}님! Google 계정 랭킹 연동 완료!`);
          this.closeAuthModal();
          this.renderAuthWidget();
          this.syncLeaderboard();
        } catch (e) {
          alert('Google 로그인 안내: Firebase 콘솔 API key 세팅 시 정상 작동하며, 현재 게스트 모드로 지속 가능합니다.');
        }
      });

      box.querySelector('#anon-login-btn').addEventListener('click', async () => {
        const user = await loginAnonymously();
        this.currentUser = user;
        sound.playCorrect();
        alert('익명 게스트로 로그인되었습니다.');
        this.closeAuthModal();
        this.renderAuthWidget();
        this.syncLeaderboard();
      });
    }
  }

  closeAuthModal() {
    this.authModal.classList.add('hidden');
  }
}

// Launch application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
