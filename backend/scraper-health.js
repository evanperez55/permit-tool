/**
 * Scraper Health Dashboard
 * Monitors scraper status, data freshness, and provides admin insights.
 */

const fs = require('fs');
const path = require('path');
const { permitFees, dataQuality } = require('./database-loader');

const HISTORY_FILE = path.join(__dirname, 'scraper-results', 'scrape-history.json');
const RESULTS_DIR = path.join(__dirname, 'scraper-results');

// All cities that have scrapers
const SCRAPER_CITIES = [
    'Los Angeles, CA',
    'San Diego, CA',
    'San Francisco, CA',
    'Austin, TX',
    'Houston, TX',
    'Miami, FL',
    'Chicago, IL',
    'Milwaukee, WI',
    'Phoenix, AZ',
    'New York, NY'
];

/**
 * Get the health status for all scrapers
 */
function getScraperHealth() {
    const history = loadHistory();
    const now = new Date();

    const cities = SCRAPER_CITIES.map(city => {
        const scraped = history[city];
        const quality = dataQuality[city];
        const fees = permitFees[city];

        let status = 'unknown';
        let lastRun = null;
        let daysSinceRun = null;
        let source = null;
        let sourceUrl = null;
        let tradesCovered = [];

        if (scraped) {
            lastRun = scraped.scrapedAt;
            daysSinceRun = Math.floor((now - new Date(lastRun)) / (1000 * 60 * 60 * 24));
            source = scraped.source || null;
            sourceUrl = scraped.sourceUrl || null;

            if (scraped.electrical) tradesCovered.push('electrical');
            if (scraped.plumbing) tradesCovered.push('plumbing');
            if (scraped.hvac) tradesCovered.push('hvac');

            if (daysSinceRun <= 30) status = 'healthy';
            else if (daysSinceRun <= 90) status = 'stale';
            else status = 'outdated';
        } else {
            status = 'never_run';
        }

        return {
            city,
            status,
            lastRun,
            daysSinceRun,
            source,
            sourceUrl,
            tradesCovered,
            dataQuality: quality ? quality.quality : 'unknown',
            hasFeeData: !!fees
        };
    });

    const healthy = cities.filter(c => c.status === 'healthy').length;
    const stale = cities.filter(c => c.status === 'stale').length;
    const outdated = cities.filter(c => c.status === 'outdated').length;
    const neverRun = cities.filter(c => c.status === 'never_run').length;

    return {
        summary: {
            total: cities.length,
            healthy,
            stale,
            outdated,
            neverRun,
            overallStatus: neverRun > 0 || outdated > 2 ? 'warning' :
                           stale > 3 ? 'caution' : 'good'
        },
        cities,
        lastFullRun: getLastFullRunDate(history),
        recommendations: generateRecommendations(cities)
    };
}

/**
 * Get run history (list of past scrape runs)
 */
function getRunHistory() {
    try {
        const files = fs.readdirSync(RESULTS_DIR)
            .filter(f => f.startsWith('scrape-') && f.endsWith('.json') && f !== 'scrape-history.json')
            .sort()
            .reverse()
            .slice(0, 20); // Last 20 runs

        return files.map(f => {
            const filePath = path.join(RESULTS_DIR, f);
            const stat = fs.statSync(filePath);
            // Extract timestamp from filename
            const match = f.match(/scrape-(\d{4}-\d{2}-\d{2}T.+)\.json/);
            return {
                filename: f,
                timestamp: match ? match[1].replace(/-(?=\d{2}-\d{2}T)/, ':').replace(/-(?=\d{2}T)/, ':') : stat.mtime.toISOString(),
                sizeKB: Math.round(stat.size / 1024)
            };
        });
    } catch {
        return [];
    }
}

/**
 * Get details for a specific city's scraper data
 */
function getCityScraperDetail(city) {
    const history = loadHistory();
    const scraped = history[city];
    const quality = dataQuality[city];
    const fees = permitFees[city];

    if (!scraped) {
        return { city, found: false, message: `No scraper data for ${city}` };
    }

    return {
        city,
        found: true,
        scrapedAt: scraped.scrapedAt,
        source: scraped.source,
        sourceUrl: scraped.sourceUrl,
        dataQuality: quality,
        trades: {
            electrical: scraped.electrical ? summarizeFeeData(scraped.electrical) : null,
            plumbing: scraped.plumbing ? summarizeFeeData(scraped.plumbing) : null,
            hvac: scraped.hvac ? summarizeFeeData(scraped.hvac) : null
        },
        currentFees: fees ? {
            electrical: fees.electrical,
            plumbing: fees.plumbing,
            hvac: fees.hvac
        } : null
    };
}

function summarizeFeeData(data) {
    return {
        baseFee: data.baseFee,
        valuationRate: data.valuationRate,
        minFee: data.minFee,
        maxFee: data.maxFee,
        rawDataPoints: data.raw ? data.raw.length : 0
    };
}

function loadHistory() {
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function getLastFullRunDate(history) {
    const dates = Object.values(history)
        .map(h => h.scrapedAt)
        .filter(Boolean)
        .sort()
        .reverse();
    return dates[0] || null;
}

function generateRecommendations(cities) {
    const recs = [];
    const outdated = cities.filter(c => c.status === 'outdated' || c.status === 'never_run');
    const stale = cities.filter(c => c.status === 'stale');

    if (outdated.length > 0) {
        recs.push({
            severity: 'high',
            message: `${outdated.length} scrapers need immediate attention`,
            cities: outdated.map(c => c.city),
            action: 'Run scrapers for these cities to update fee data'
        });
    }

    if (stale.length > 0) {
        recs.push({
            severity: 'medium',
            message: `${stale.length} scrapers have stale data (30-90 days old)`,
            cities: stale.map(c => c.city),
            action: 'Schedule a scrape run within the next week'
        });
    }

    if (outdated.length === 0 && stale.length === 0) {
        recs.push({
            severity: 'low',
            message: 'All scrapers are healthy and up to date',
            action: 'No action needed'
        });
    }

    return recs;
}

module.exports = {
    getScraperHealth,
    getRunHistory,
    getCityScraperDetail,
    SCRAPER_CITIES
};
