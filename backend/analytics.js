/**
 * In-memory usage analytics tracker
 */

const MAX_HISTORY = 1000;

const analytics = {
    startedAt: new Date().toISOString(),
    totalQueries: 0,
    cityCounts: {},
    jobTypeCounts: {},
    hourlyBuckets: {},
    recentQueries: []
};

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
}

module.exports = { track, getSummary, reset };
