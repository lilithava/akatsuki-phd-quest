// Akatsuki Data Loader
window.AK_DATA = {};

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
            window.AK_DATA[file.key] = null;
        }
    }
    
    console.log('🎯 All data loaded:', Object.keys(window.AK_DATA).filter(k => window.AK_DATA[k]));
}

// Start loading immediately
loadAllData();
