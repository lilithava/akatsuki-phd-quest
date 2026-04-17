// Loads all JSON files and stores them in window.AK_DATA
window.AK_DATA = {};

async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
}

async function loadAllData() {
    const files = {
        rules: 'game-data.json',
        templates: 'mission-templates.json',
        phd: 'task-bank-phd.json',
        skool: 'task-bank-skool.json',
        curriculum: 'task-bank-curriculum.json',
        ra: 'task-bank-ra.json',
        docs: 'task-bank-docs.json',
        rituals: 'task-bank-rituals.json',
        bosses: 'boss-battles.json',
        recovery: 'recovery-missions.json',
        mini: 'mini-quests.json',
        achievements: 'achievements.json',
        shop: 'shop-items.json',
        avatar: 'avatar-layers.json'
    };
    const entries = await Promise.all(Object.entries(files).map(async ([key, path]) => {
        try {
            const data = await loadJSON(path);
            return [key, data];
        } catch(e) {
            console.warn(`Could not load ${path}`, e);
            return [key, null];
        }
    }));
    for (let [key, data] of entries) {
        window.AK_DATA[key] = data;
    }
    console.log('All data loaded', window.AK_DATA);
}

// Start loading immediately
loadAllData();
