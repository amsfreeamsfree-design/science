// Item Shop and Inventory Manager

export const SHOP_ITEMS = [
  {
    id: 'extra_time',
    name: '⏱️ 시간 연장 (+10초)',
    cost: 50,
    icon: '⏱️',
    description: '타임어택 미니게임 진행 시간을 10초 늘려줍니다.',
    count: 0
  },
  {
    id: 'hint_remove',
    name: '💡 오답 힌트',
    cost: 40,
    icon: '💡',
    description: '문제에서 오답 보기 1개를 제거하거나 힌트를 보여줍니다.',
    count: 0
  },
  {
    id: 'shield_protect',
    name: '🛡️ 실기 방패',
    cost: 60,
    icon: '🛡️',
    description: '실수로 틀렸을 때 1회 골드 감점을 방지하고 재시도합니다.',
    count: 0
  }
];

export function getInventory() {
  try {
    const saved = localStorage.getItem('plant_arcade_inventory');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Inventory load error:", e);
  }
  return { extra_time: 1, hint_remove: 1, shield_protect: 0 };
}

export function saveInventory(inv) {
  try {
    localStorage.setItem('plant_arcade_inventory', JSON.stringify(inv));
  } catch (e) {
    console.warn("Inventory save error:", e);
  }
}

export function buyItem(itemId, playerGold, updateGoldCallback) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return { success: false, message: '존재하지 않는 아이템입니다.' };

  if (playerGold < item.cost) {
    return { success: false, message: '골드가 부족합니다! 미니게임을 더 클리어하세요.' };
  }

  const inv = getInventory();
  inv[itemId] = (inv[itemId] || 0) + 1;
  saveInventory(inv);

  const newGold = playerGold - item.cost;
  if (updateGoldCallback) updateGoldCallback(newGold);

  return { 
    success: true, 
    message: `${item.name}을(를) 구매했습니다!`, 
    newGold,
    inventory: inv 
  };
}

export function useItem(itemId) {
  const inv = getInventory();
  if (!inv[itemId] || inv[itemId] <= 0) {
    return false;
  }
  inv[itemId] -= 1;
  saveInventory(inv);
  return true;
}
