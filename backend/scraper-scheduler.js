/**
 * Scraper Scheduler
 * Lightweight cron-like scheduler for automated scraper runs.
 * Uses setInterval instead of node-cron to avoid adding a dependency.
 */

const ScraperOrchestrator = require('./scrapers/scraper-orchestrator');
const { quickCheck } = require('./link-health-checker');

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

class ScraperScheduler {
    constructor(options = {}) {
        this.scrapeIntervalMs = options.scrapeIntervalMs || 7 * ONE_DAY;  // Weekly
        this.linkCheckIntervalMs = options.linkCheckIntervalMs || ONE_DAY; // Daily
        this.enabled = false;
        this.scrapeTimer = null;
        this.linkCheckTimer = null;
        this.orchestrator = new ScraperOrchestrator();
        this.lastScrapeRun = null;
        this.lastLinkCheck = null;
        this.lastScrapeResult = null;
        this.lastLinkCheckResult = null;
        this.runHistory = [];
    }

    /**
     * Start the scheduler
     */
    start() {
        if (this.enabled) return;
        this.enabled = true;

        console.log(`📅 Scraper scheduler started`);
        console.log(`   Scrape interval: every ${Math.round(this.scrapeIntervalMs / ONE_HOUR)}h`);
        console.log(`   Link check interval: every ${Math.round(this.linkCheckIntervalMs / ONE_HOUR)}h`);

        this.scrapeTimer = setInterval(() => this.runScrape(), this.scrapeIntervalMs);
        this.linkCheckTimer = setInterval(() => this.runLinkCheck(), this.linkCheckIntervalMs);
    }

    /**
     * Stop the scheduler
     */
    stop() {
        this.enabled = false;
        if (this.scrapeTimer) clearInterval(this.scrapeTimer);
        if (this.linkCheckTimer) clearInterval(this.linkCheckTimer);
        this.scrapeTimer = null;
        this.linkCheckTimer = null;
        console.log('📅 Scraper scheduler stopped');
    }

    /**
     * Run a full scrape of all cities
     */
    async runScrape() {
        console.log('\n📅 [Scheduler] Starting scheduled scrape run...');
        this.lastScrapeRun = new Date().toISOString();

        try {
            const result = await this.orchestrator.scrapeAll();
            this.lastScrapeResult = {
                timestamp: this.lastScrapeRun,
                status: 'success',
                successful: result.summary.successful,
                failed: result.summary.failed,
                changes: result.summary.changes.length
            };
            this.runHistory.unshift(this.lastScrapeResult);
            if (this.runHistory.length > 50) this.runHistory.length = 50;

            console.log(`📅 [Scheduler] Scrape complete: ${result.summary.successful}/${result.summary.total} succeeded`);
            return result;
        } catch (error) {
            this.lastScrapeResult = {
                timestamp: this.lastScrapeRun,
                status: 'error',
                error: error.message
            };
            this.runHistory.unshift(this.lastScrapeResult);
            console.error(`📅 [Scheduler] Scrape failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Run a single city scrape
     */
    async runScrapeCity(cityName) {
        console.log(`\n📅 [Scheduler] Manual scrape for ${cityName}...`);
        try {
            const result = await this.orchestrator.scrapeCity(cityName);
            const record = {
                timestamp: new Date().toISOString(),
                status: 'success',
                type: 'single',
                city: cityName,
                changes: result.changes.length
            };
            this.runHistory.unshift(record);
            return result;
        } catch (error) {
            const record = {
                timestamp: new Date().toISOString(),
                status: 'error',
                type: 'single',
                city: cityName,
                error: error.message
            };
            this.runHistory.unshift(record);
            throw error;
        }
    }

    /**
     * Run a quick link health check
     */
    async runLinkCheck() {
        console.log('\n📅 [Scheduler] Starting link health check...');
        this.lastLinkCheck = new Date().toISOString();

        try {
            const result = await quickCheck();
            this.lastLinkCheckResult = {
                timestamp: this.lastLinkCheck,
                status: 'success',
                totalChecked: result.uniqueUrlsChecked,
                healthy: result.healthy,
                broken: result.broken
            };
            console.log(`📅 [Scheduler] Link check complete: ${result.healthy}/${result.uniqueUrlsChecked} healthy`);
            return result;
        } catch (error) {
            this.lastLinkCheckResult = {
                timestamp: this.lastLinkCheck,
                status: 'error',
                error: error.message
            };
            console.error(`📅 [Scheduler] Link check failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            scrapeInterval: `${Math.round(this.scrapeIntervalMs / ONE_HOUR)} hours`,
            linkCheckInterval: `${Math.round(this.linkCheckIntervalMs / ONE_HOUR)} hours`,
            lastScrapeRun: this.lastScrapeRun,
            lastScrapeResult: this.lastScrapeResult,
            lastLinkCheck: this.lastLinkCheck,
            lastLinkCheckResult: this.lastLinkCheckResult,
            recentRuns: this.runHistory.slice(0, 10)
        };
    }
}

// Singleton instance
let schedulerInstance = null;

function getScheduler(options) {
    if (!schedulerInstance) {
        schedulerInstance = new ScraperScheduler(options);
    }
    return schedulerInstance;
}

module.exports = { ScraperScheduler, getScheduler };
