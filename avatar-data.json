{
  "meta": {
    "name": "Akatsuki Avatar System",
    "version": "2.0.0",
    "description": "Modular SVG-based avatar system with equipable slots, level requirements, and visual customization",
    "lastUpdated": "2026-04-18",
    "designPhilosophy": "Avatars represent player progression through visual customization"
  },

  "avatarDefaults": {
    "baseName": "Shadow Scholar",
    "defaultVariant": "bauhaus",
    "defaultColors": ["#d62828", "#2a2a2e", "#e6e6e6", "#1a1a2e", "#4a4a5a"],
    "size": 200,
    "square": false
  },

  "avatarSlots": [
    { "id": "body", "name": "Body Type", "icon": "👤", "required": true, "maxItems": 1 },
    { "id": "cloak", "name": "Cloak", "icon": "🧥", "required": false, "maxItems": 1, "unlockLevel": 1 },
    { "id": "mask", "name": "Mask", "icon": "🎭", "required": false, "maxItems": 1, "unlockLevel": 3 },
    { "id": "headwear", "name": "Headwear", "icon": "👒", "required": false, "maxItems": 1, "unlockLevel": 5 },
    { "id": "companion", "name": "Companion", "icon": "🐺", "required": false, "maxItems": 1, "unlockLevel": 7 },
    { "id": "aura", "name": "Aura", "icon": "✨", "required": false, "maxItems": 1, "unlockLevel": 10 },
    { "id": "accessory_left", "name": "Left Accessory", "icon": "💍", "required": false, "maxItems": 1 },
    { "id": "accessory_right", "name": "Right Accessory", "icon": "⚔️", "required": false, "maxItems": 1 }
  ],

  "bodyTypes": [
    {
      "id": "standard",
      "name": "Standard",
      "icon": "🧍",
      "svgPath": "assets/body_standard.svg",
      "blendshapes": { "height": 0, "width": 0, "shoulderWidth": 0 }
    },
    {
      "id": "tall",
      "name": "Tall",
      "icon": "⬆️",
      "svgPath": "assets/body_tall.svg",
      "blendshapes": { "height": 20, "width": 0, "shoulderWidth": 5 },
      "unlockCondition": { "level": 5 }
    },
    {
      "id": "athletic",
      "name": "Athletic",
      "icon": "💪",
      "svgPath": "assets/body_athletic.svg",
      "blendshapes": { "height": 5, "width": 10, "shoulderWidth": 15 },
      "unlockCondition": { "level": 8 }
    }
  ],

  "facialFeatures": {
    "eyes": [
      { "id": "default", "name": "Default Eyes", "svgPath": "assets/eyes_default.svg" },
      { "id": "sharingan", "name": "Sharingan Eyes", "svgPath": "assets/eyes_sharingan.svg", "unlockCondition": { "achievement": "shadow_scholar" } },
      { "id": "byakugan", "name": "Byakugan Eyes", "svgPath": "assets/eyes_byakugan.svg", "unlockCondition": { "level": 15 } },
      { "id": "tired", "name": "Tired Eyes", "svgPath": "assets/eyes_tired.svg", "unlockCondition": { "streak": 30 } }
    ],
    "mouth": [
      { "id": "neutral", "name": "Neutral", "svgPath": "assets/mouth_neutral.svg" },
      { "id": "smile", "name": "Smile", "svgPath": "assets/mouth_smile.svg" },
      { "id": "determined", "name": "Determined", "svgPath": "assets/mouth_determined.svg" }
    ],
    "eyebrows": [
      { "id": "default", "name": "Default", "svgPath": "assets/brows_default.svg" },
      { "id": "angry", "name": "Angry", "svgPath": "assets/brows_angry.svg" }
    ]
  },

  "colorCustomization": {
    "skin": {
      "default": "#e8c4a0",
      "options": [
        { "id": "fair", "name": "Fair", "value": "#f5d0a9" },
        { "id": "tan", "name": "Tan", "value": "#d4a574" },
        { "id": "dark", "name": "Dark", "value": "#8b5a2b" },
        { "id": "shadow", "name": "Shadow", "value": "#2a2a2e", "unlockCondition": { "level": 20 } }
      ]
    },
    "hair": {
      "default": "#1a1a1a",
      "options": [
        { "id": "black", "name": "Black", "value": "#1a1a1a" },
        { "id": "white", "name": "White", "value": "#e6e6e6" },
        { "id": "red", "name": "Crimson", "value": "#d62828", "unlockCondition": { "achievement": "crimson_streak" } },
        { "id": "blue", "name": "Midnight Blue", "value": "#1a2a4a", "unlockCondition": { "level": 12 } }
      ]
    },
    "outfit": {
      "default": "#1a1a2e",
      "options": [
        { "id": "akatsuki_red", "name": "Akatsuki Red", "value": "#d62828" },
        { "id": "shadow_black", "name": "Shadow Black", "value": "#0a0a0c" },
        { "id": "crimson_glow", "name": "Crimson Glow", "value": "#ff4444", "unlockCondition": { "item": "crimson_aura" } }
      ]
    }
  },

  "layerRendering": {
    "order": [
      "background",
      "body_base",
      "body_details",
      "outfit_under",
      "skin",
      "facial_features",
      "hair",
      "outfit_over",
      "cloak",
      "accessories",
      "mask",
      "headwear",
      "companion",
      "aura",
      "effects"
    ],
    "zIndexBase": 100
  },

  "animationPresets": [
    {
      "id": "idle",
      "name": "Idle",
      "duration": 3000,
      "properties": [
        { "target": "body", "attribute": "y", "from": 0, "to": 2, "easing": "ease-in-out" }
      ]
    },
    {
      "id": "level_up",
      "name": "Level Up Celebration",
      "duration": 1000,
      "properties": [
        { "target": "aura", "attribute": "opacity", "from": 0, "to": 1, "easing": "ease-out" },
        { "target": "aura", "attribute": "scale", "from": 0.8, "to": 1.2, "easing": "ease-out" }
      ]
    }
  ]
}
