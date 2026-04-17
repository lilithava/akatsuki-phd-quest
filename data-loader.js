// Simple data loader for Akatsuki Quest
window.AK_DATA = {};

async function loadAllData() {
    const files = {
        rules: 'game-data.json',
        templates: 'mission-templates.json',
        phd: 'task-bank-phd.json',
        skool: 'task-bank-skool.json',
        curriculum: 'task-bank-curriculum.json',
        ra: 'task-bank-ra.json',
        docs: 'task-bank-docs.json',
        rituals: 'task-bank-rituals.json'
    };
    
    for (const [key, path] of Object.entries(files)) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                window.AK_DATA[key] = await response.json();
                console.log(`Loaded: ${key}`);
            } else {
                console.warn(`Failed to load ${path}`);
                window.AK_DATA[key] = null;
            }
        } catch (e) {
            console.warn(`Error loading ${path}:`, e);
            window.AK_DATA[key] = null;
        }
    }
    
    // Set a default rules object if none loaded
    if (!window.AK_DATA.rules) {
        window.AK_DATA.rules = { xpRules: { xpPerLevel: 500 } };
    }
    
    console.log('All data loaded', Object.keys(window.AK_DATA));
}

// Start loading
loadAllData();
