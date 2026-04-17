"use strict";

/* ============================================================
   AKATSUKI PH.D QUEST – DATA LOADER MODULE
   Loads all JSON files safely and exposes them to AK.data
============================================================ */

window.AK_DataLoader = {
  async loadAll(AK) {
    const files = AK.config.dataFiles;

    const load = (path) => this.fetchJson(path);

    const promises = [
      load(files.gameData),
      load(files.templates),
      ...files.banks.map((f) => load(f)),
      load(files.bossBattles),
      load(files.recoveryMissions),
      load(files.miniQuests),
      load(files.achievements),
      load(files.shopItems),
      load(files.avatarLayers)
    ];

    const results = await Promise.all(promises);

    // Assign results back into AK.data
    let index = 0;
    AK.data.rules = results[index++] || {};
    AK.data.templates = results[index++] || [];

    // Banks
    AK.data.banks = results.slice(index, index + files.banks.length).filter(Boolean);
    index += files.banks.length;

    // Remaining
    AK.data.bossBattles = results[index++] || [];
    AK.data.recoveryMissions = results[index++] || [];
    AK.data.miniQuests = results[index++] || [];
    AK.data.achievements = results[index++] || [];
    AK.data.shopItems = results[index++] || [];
    AK.data.avatarLayers = results[index++] || [];

    return true;
  },

  async fetchJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return await res.json();
    } catch (err) {
      console.warn("JSON load error:", path, err);
      return null;
    }
  }
};
