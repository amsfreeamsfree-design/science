// Hall of Fame Leaderboard Manager

import { syncScoreToFirestore, getTop10FromFirestore } from './firebase.js';

const STORAGE_KEY_LEADERBOARD = 'plant_arcade_hall_of_fame';

// Default mock Top 10 hall of fame records for exciting gameplay competition
const DEFAULT_LEADERBOARD = [
  { uid: 'bot1', displayName: '🌱 식물박사 민준', gold: 3850, clearedCount: 20, totalStars: 60, title: '식물학 명예교수' },
  { uid: 'bot2', displayName: '🌿 광합성 마스터 서연', gold: 3200, clearedCount: 19, totalStars: 55, title: '잎의 지배자' },
  { uid: 'bot3', displayName: '🌸 꽃가루 꿀벌 지우', gold: 2750, clearedCount: 17, totalStars: 48, title: '수분 비행사' },
  { uid: 'bot4', displayName: '🪵 물관 탐정 하은', gold: 2300, clearedCount: 15, totalStars: 42, title: '줄기 파이프왕' },
  { uid: 'bot5', displayName: '🥕 흙속 뿌리왕 도윤', gold: 1950, clearedCount: 14, totalStars: 39, title: '뿌리 굴착기' },
  { uid: 'bot6', displayName: '🍃 증산작용 예준', gold: 1600, clearedCount: 12, totalStars: 33, title: '기공 수호자' },
  { uid: 'bot7', displayName: '🌻 수염뿌리 지유', gold: 1350, clearedCount: 10, totalStars: 28, title: '단원 챔피언' },
  { uid: 'bot8', displayName: '🍁 저장줄기 시우', gold: 1100, clearedCount: 8, totalStars: 22, title: '과학 샛별' },
  { uid: 'bot9', displayName: '🍀 녹말검출 수아', gold: 850, clearedCount: 6, totalStars: 17, title: '실험 탐구원' },
  { uid: 'bot10', displayName: '🌷 꽃받침 유준', gold: 600, clearedCount: 4, totalStars: 11, title: '초보 식물가' }
];

export function getLocalLeaderboard() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("LocalStorage read error:", e);
  }
  return DEFAULT_LEADERBOARD;
}

export function saveLocalLeaderboard(list) {
  try {
    localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(list));
  } catch (e) {
    console.warn("LocalStorage write error:", e);
  }
}

export async function updateLeaderboardRecord(userProfile, playerStats) {
  if (!playerStats) return;

  const currentList = getLocalLeaderboard();
  const userId = userProfile?.uid || 'player_local';
  const userName = userProfile?.displayName || userProfile?.nickname || '나 (탐구자)';

  const existingIdx = currentList.findIndex(item => item.uid === userId);

  const updatedRecord = {
    uid: userId,
    displayName: userName,
    gold: playerStats.gold || 0,
    clearedCount: playerStats.clearedCount || 0,
    totalStars: playerStats.totalStars || 0,
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    // Keep max scores
    currentList[existingIdx].gold = Math.max(currentList[existingIdx].gold, updatedRecord.gold);
    currentList[existingIdx].clearedCount = Math.max(currentList[existingIdx].clearedCount, updatedRecord.clearedCount);
    currentList[existingIdx].totalStars = Math.max(currentList[existingIdx].totalStars, updatedRecord.totalStars);
    currentList[existingIdx].displayName = userName;
  } else {
    currentList.push(updatedRecord);
  }

  saveLocalLeaderboard(currentList);

  // Sync to Firestore if user is authenticated
  if (userProfile?.uid) {
    await syncScoreToFirestore({
      uid: userProfile.uid,
      displayName: userName,
      photoURL: userProfile.photoURL,
      gold: playerStats.gold,
      clearedCount: playerStats.clearedCount,
      totalStars: playerStats.totalStars
    });
  }
}

export async function fetchTop10Leaderboard(type = 'gold') {
  // Try remote Firestore first
  const firestoreData = await getTop10FromFirestore(type === 'gold' ? 'gold' : 'clearedCount');
  if (firestoreData && firestoreData.length > 0) {
    return firestoreData;
  }

  // Fallback to local
  const localList = getLocalLeaderboard();
  if (type === 'gold') {
    return [...localList].sort((a, b) => b.gold - a.gold).slice(0, 10);
  } else {
    return [...localList].sort((a, b) => {
      if (b.clearedCount !== a.clearedCount) return b.clearedCount - a.clearedCount;
      return b.totalStars - a.totalStars;
    }).slice(0, 10);
  }
}
