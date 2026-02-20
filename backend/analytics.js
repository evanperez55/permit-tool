/**
 * Usage analytics tracker with file-based persistence
 */

const fs = require('fs');
const path = require('path');

const MAX_HISTORY = 1000;
const DATA_FILE = path.join(__dirname, 'scraper-results', 'analytics-data.json');
const SAVE_DEBOUNCE_MS = 10000;

const analytics = {
    startedAt: new Date().toISOString(),
    totalQueries: 0,
    cityCounts: {},
    jobTypeCounts: {},
    hourlyBuckets: {},
    recentQueries: []
};

let saveTimer = null;

function load() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            const saved = JSON.parse(raw);
            if (saved && typeof saved.totalQueries === 'number') {
                analytics.totalQueries = saved.totalQueries;
                analytics.cityCounts = saved.cityCounts || {};
                analytics.jobTypeCounts = saved.jobTypeCounts || {};
                analytics.hourlyBuckets = saved.hourlyBuckets || {};
                analytics.recentQueries = saved.recentQueries || [];
                analytics.startedAt = saved.startedAt || analytics.startedAt;
            }
        }
    } catch (err) {
        // Graceful fallback - start fresh if file is corrupt/missing
        console.warn('Analytics: could not load saved data, starting fresh');
    }
}

function save() {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(analytics, null, 2));
    } catch (err) {
        console.warn('Analytics: could not save data:', err.message);
    }
}

function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, SAVE_DEBOUNCE_MS);
}

function track({ city, state, jobType }) {
    analytics.totalQueries++;

    const location = `${city}, ${state}`;
    analytics.cityCounts[location] = (analytics.cityCounts[location] || 0) + 1;
    analytics.jobTypeCounts[jobType] = (analytics.jobTypeCounts[jobType] || 0) + 1;

    const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    analytics.hourlyBuckets[hour] = (analytics.hourlyBuckets[hour] || 0) + 1;

    analytics.recentQueries.unshift({
        location,
        jobType,
        timestamp: new Date().toISOString()
    });

    if (analytics.recentQueries.length > MAX_HISTORY) {
        analytics.recentQueries.length = MAX_HISTORY;
    }

    scheduleSave();
}

function topN(counts, n = 10) {
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([name, count]) => ({ name, count }));
}

function getSummary() {
    return {
        totalQueries: analytics.totalQueries,
        uptime: analytics.startedAt,
        topCities: topN(analytics.cityCounts),
        topJobTypes: topN(analytics.jobTypeCounts),
        hourlyVolume: analytics.hourlyBuckets,
        recentQueries: analytics.recentQueries.slice(0, 50)
    };
}

function reset() {
    analytics.totalQueries = 0;
    analytics.cityCounts = {};
    analytics.jobTypeCounts = {};
    analytics.hourlyBuckets = {};
    analytics.recentQueries = [];
    analytics.startedAt = new Date().toISOString();
    // Clear saved file
    try {
        if (fs.existsSync(DATA_FILE)) {
            fs.unlinkSync(DATA_FILE);
        }
    } catch (err) {
        // ignore
    }
}

// Load persisted data on module init
load();

module.exports = { track, getSummary, reset, save, load, DATA_FILE };
