"use strict";

/* ============================================================
   AKATSUKI PH.D QUEST – AVATAR RENDERER
   Modular SVG layering based on avatar-layers.json + AK.state.avatar
============================================================ */

window.AK_AvatarRenderer = {
  init(AK) {
    this.AK = AK;
    this.svgRoot = AK.els.avatarSvg;
    if (!this.svgRoot) {
      console.warn("[AvatarRenderer] No [data-ak-avatar-svg] element found.");
      return;
    }
    this.render();
  },

  render() {
    if (!this.AK || !this.svgRoot) return;

    const layersData = this.AK.data.avatarLayers;
    const avatarState = this.AK.state.avatar;

    if (!layersData || !Array.isArray(layersData.layers)) {
      console.warn("[AvatarRenderer] No avatar layers loaded.");
      return;
    }

    // Clear existing content
    this.svgRoot.innerHTML = "";

    // Determine which layers to show:
    // - Base body (always one)
    // - Equipped items from avatar.equipped (ids)
    const equippedIds = new Set(avatarState.equipped || []);

    const baseLayers = layersData.layers.filter((l) => l.category === "Base");
    const otherLayers = layersData.layers.filter((l) => l.category !== "Base");

    // Sort by zIndex
    const sortedBase = baseLayers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const sortedOthers = otherLayers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    const finalLayers = [];

    // 1) Always include first base layer (or all base layers if you prefer)
    if (sortedBase.length > 0) {
      finalLayers.push(sortedBase[0]);
    }

    // 2) Include any layer whose id is in equippedIds
    sortedOthers.forEach((layer) => {
      if (equippedIds.has(layer.id)) {
        finalLayers.push(layer);
      }
    });

    // 3) Render each as <image> referencing its svgPath
    finalLayers.forEach((layer) => {
      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      img.setAttributeNS(null, "href", layer.svgPath);
      img.setAttributeNS(null, "width", "100%");
      img.setAttributeNS(null, "height", "100%");
      img.setAttributeNS(null, "data-ak-layer-id", layer.id);
      this.svgRoot.appendChild(img);
    });
  }
};
