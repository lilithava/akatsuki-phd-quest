// Akatsuki Data Loader - Loads all JSON files into window.AK_DATA
window.AK_DATA = {
    rules: null,
    phd: null,
    skool: null,
    curriculum: null,
    ra: null,
    docs: null,
    rituals: null,
    bosses: null,
    recovery: null,
    mini: null,
    achievements: null,
    shop: null,
    avatar: null,
    templates: null
};

async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (e) {
        console.warn(`Failed to load ${path}:`, e);
        return null;
    }
}

async function loadAllData() {
    const files = [
        { key: 'rules', path: 'game-data.json' },
        { key: 'phd', path: 'task-bank-phd.json' },
        { key: 'skool', path: 'task-bank-skool.json' },
        { key: 'curriculum', path: 'task-bank-curriculum.json' },
        { key: 'ra', path: 'task-bank-ra.json' },
        { key: 'docs', path: 'task-bank-docs.json' },
        { key: 'rituals', path: 'task-bank-rituals.json' },
        { key: 'bosses', path: 'boss-battles.json' },
        { key: 'recovery', path: 'recovery-missions.json' },
        { key: 'mini', path: 'mini-quests.json' },
        { key: 'achievements', path: 'achievements.json' },
        { key: 'shop', path: 'shop-items.json' },
        { key: 'avatar', path: 'avatar-layers.json' },
        { key: 'templates', path: 'mission-templates.json' }
    ];
    
    for (const file of files) {
        const data = await loadJSON(file.path);
        if (data) {
            window.AK_DATA[file.key] = data;
            console.log(`✅ Loaded: ${file.key}`);
        } else {
            console.warn(`⚠️ Failed to load: ${file.key}`);
        }
    }
    
    // Set default rules if missing
    if (!window.AK_DATA.rules) {
        window.AK_DATA.rules = {
            xpRules: { xpPerLevel: 500, coinRatio: 0.2 },
            difficulties: [
                { id: "Easy", defaultXp: 15 },
                { id: "Medium", defaultXp: 35 },
                { id: "Hard", defaultXp: 90 },
                { id: "Elite", defaultXp: 250 }
            ]
        };
    }
    
    console.log('🎯 All data loaded', Object.keys(window.AK_DATA).filter(k => window.AK_DATA[k]));
}

// Start loading immediately
loadAllData();
