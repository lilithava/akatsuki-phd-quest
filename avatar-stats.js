// modules/avatar-stats.js
// Avatar Stats and Multiplier System

class AvatarStats {
  constructor(state, shopItems) {
    this.state = state;
    this.shopItems = shopItems;
  }

  // Calculate effective multipliers from equipped items
  calculateMultipliers() {
    let xpMult = 1.0;
    let coinMult = 1.0;
    
    if (this.state.avatar && this.state.avatar.equipped) {
      this.state.avatar.equipped.forEach(itemId => {
        const item = this.shopItems.find(i => i.id === itemId);
        if (item && item.effect) {
          // Parse effect string to get multipliers
          if (item.effect.includes('XP')) {
            const match = item.effect.match(/(\d+)%/);
            if (match) xpMult += parseInt(match[1]) / 100;
          }
          if (item.effect.includes('Coins')) {
            const match = item.effect.match(/(\d+)%/);
            if (match) coinMult += parseInt(match[1]) / 100;
          }
        }
      });
    }
    
    // Apply temporary buffs (consumables)
    if (this.state.temporaryBuffs) {
      if (this.state.temporaryBuffs.xpBoost) xpMult *= this.state.temporaryBuffs.xpBoost;
      if (this.state.temporaryBuffs.coinBoost) coinMult *= this.state.temporaryBuffs.coinBoost;
    }
    
    return { xpMult, coinMult };
  }

  // Calculate effective XP gain for a task
  calculateEffectiveXp(baseXp, taskContext = {}) {
    const { xpMult } = this.calculateMultipliers();
    let finalXp = Math.floor(baseXp * xpMult);
    
    // Domain-specific bonuses
    if (taskContext.domain && this.state.avatar.equipped) {
      this.state.avatar.equipped.forEach(itemId => {
        const item = this.shopItems.find(i => i.id === itemId);
        if (item && item.domainBonus === taskContext.domain) {
          finalXp = Math.floor(finalXp * 1.1); // 10% domain bonus
        }
      });
    }
    
    return finalXp;
  }

  // Apply item purchase
  purchaseItem(itemId, cost) {
    if (this.state.coins < cost) return { success: false, message: 'Not enough coins' };
    
    const item = this.shopItems.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found' };
    
    if (this.state.avatar.inventory.includes(itemId)) {
      return { success: false, message: 'Already owned' };
    }
    
    this.state.coins -= cost;
    this.state.avatar.inventory.push(itemId);
    
    return { success: true, message: `Purchased: ${item.name}`, item: item };
  }

  // Equip an item
  equipItem(itemId) {
    const item = this.shopItems.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found' };
    
    if (!this.state.avatar.inventory.includes(itemId)) {
      return { success: false, message: 'Item not owned' };
    }
    
    // Remove any item in same slot
    if (item.slot) {
      this.state.avatar.equipped = this.state.avatar.equipped.filter(id => {
        const equippedItem = this.shopItems.find(i => i.id === id);
        return equippedItem?.slot !== item.slot;
      });
    }
    
    this.state.avatar.equipped.push(itemId);
    return { success: true, message: `Equipped: ${item.name}` };
  }

  // Unequip an item
  unequipItem(itemId) {
    this.state.avatar.equipped = this.state.avatar.equipped.filter(id => id !== itemId);
    const item = this.shopItems.find(i => i.id === itemId);
    return { success: true, message: `Unequipped: ${item?.name || itemId}` };
  }

  // Apply consumable effect
  useConsumable(itemId) {
    const item = this.shopItems.find(i => i.id === itemId);
    if (!item || !item.consumable) return { success: false, message: 'Not a consumable' };
    
    const index = this.state.avatar.inventory.indexOf(itemId);
    if (index === -1) return { success: false, message: 'Not owned' };
    
    this.state.avatar.inventory.splice(index, 1);
    
    if (!this.state.temporaryBuffs) this.state.temporaryBuffs = {};
    
    if (item.effect?.type === 'temporary') {
      this.state.temporaryBuffs.xpBoost = (this.state.temporaryBuffs.xpBoost || 1) * item.effect.xpMultiplier;
      setTimeout(() => {
        this.state.temporaryBuffs.xpBoost = null;
        this.saveState?.();
      }, item.effect.duration === '1 mission' ? 3600000 : 86400000);
    }
    
    return { success: true, message: `Used: ${item.name}` };
  }

  // Get all owned items with details
  getOwnedItems() {
    return this.state.avatar.inventory.map(itemId => {
      return this.shopItems.find(i => i.id === itemId);
    }).filter(i => i);
  }

  // Get equipped items with details
  getEquippedItems() {
    return this.state.avatar.equipped.map(itemId => {
      return this.shopItems.find(i => i.id === itemId);
    }).filter(i => i);
  }
}

if (typeof window !== 'undefined') window.AvatarStats = AvatarStats;
