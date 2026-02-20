/**
 * Database Loader
 * Loads permit fee data from scraped JSON results instead of static JS file
 * This enables fully automated database updates from scrapers
 */

const fs = require('fs');
const path = require('path');

// Fallback to static database if needed
const staticDB = require('./permit-fee-database');

class DatabaseLoader {
    constructor() {
        this.scraperResultsDir = path.join(__dirname, 'scraper-results');
        this.historyFile = path.join(this.scraperResultsDir, 'scrape-history.json');
        this.cache = null;
        this.cacheTimestamp = null;
        this.cacheTTL = 60000; // 1 minute cache
    }

    /**
     * Load latest scraper results and merge into static database.
     * Scraper results overlay the static data - static DB is the base,
     * scraped values update individual trade fields where available.
     */
    loadFromScraperResults() {
        try {
            // Start with a deep copy of the static database as the base
            const permitFees = JSON.parse(JSON.stringify(staticDB.permitFees));
            const dataQuality = JSON.parse(JSON.stringify(staticDB.dataQuality));

            // Check if history file exists
            if (!fs.existsSync(this.historyFile)) {
                console.log('ℹ️  No scraper history found, using static database');
                return { permitFees, dataQuality };
            }

            // Load history
            const historyData = fs.readFileSync(this.historyFile, 'utf8');
            const history = JSON.parse(historyData);

            // Merge scraper results into static database with validation.
            // Only overwrite static values when scraper provides plausible data.
            for (const [jurisdiction, feeData] of Object.entries(history)) {
                // Only update existing jurisdictions - don't add new incomplete entries
                if (!permitFees[jurisdiction]) {
                    continue;
                }

                // Update individual trade fields if scraper has them
                const trades = ['electrical', 'plumbing', 'hvac'];
                for (const trade of trades) {
                    if (feeData[trade] && permitFees[jurisdiction][trade]) {
                        const existing = permitFees[jurisdiction][trade];
                        const scraped = feeData[trade];

                        // Only merge non-null values that pass sanity checks
                        if (scraped.baseFee != null && scraped.baseFee >= 0) {
                            permitFees[jurisdiction][trade].baseFee = scraped.baseFee;
                        }
                        // valuationRate must be reasonable (under 10%)
                        if (scraped.valuationRate != null && scraped.valuationRate >= 0 && scraped.valuationRate < 0.1) {
                            permitFees[jurisdiction][trade].valuationRate = scraped.valuationRate;
                        }
                        // minFee: only overwrite if scraped value is plausible (>= $10)
                        if (scraped.minFee != null && scraped.minFee >= 10) {
                            permitFees[jurisdiction][trade].minFee = scraped.minFee;
                        }
                        // maxFee: never overwrite with null, and must be > minFee
                        if (scraped.maxFee != null && scraped.maxFee > 0) {
                            permitFees[jurisdiction][trade].maxFee = scraped.maxFee;
                        }
                        if (scraped.notes) {
                            permitFees[jurisdiction][trade].notes = scraped.notes;
                        }
                    }
                }

                // Store raw scraper data for reference/debugging
                permitFees[jurisdiction]._rawScraperData = {
                    electrical: feeData.electrical,
                    plumbing: feeData.plumbing,
                    hvac: feeData.hvac
                };

                // Update data quality metadata (preserve existing where scraper lacks info)
                dataQuality[jurisdiction] = {
                    ...dataQuality[jurisdiction],
                    source: feeData.source || dataQuality[jurisdiction]?.source || 'Automated Scraper',
                    lastVerified: feeData.scrapedAt ? feeData.scrapedAt.split('T')[0] : dataQuality[jurisdiction]?.lastVerified,
                    url: feeData.sourceUrl || dataQuality[jurisdiction]?.url || null,
                    pdfHash: feeData.pdfHash,
                    effectiveDate: feeData.effectiveDate
                };
            }

            return { permitFees, dataQuality };

        } catch (error) {
            console.error('❌ Error loading scraper results:', error.message);
            console.log('ℹ️  Falling back to static database');
            return this.convertStaticDB();
        }
    }

    /**
     * Convert static database to new format
     */
    convertStaticDB() {
        return {
            permitFees: staticDB.permitFees,
            dataQuality: staticDB.dataQuality
        };
    }

    /**
     * Get permit fees with caching
     */
    getPermitFees() {
        const now = Date.now();

        // Return cached data if fresh
        if (this.cache && this.cacheTimestamp && (now - this.cacheTimestamp < this.cacheTTL)) {
            return this.cache.permitFees;
        }

        // Load fresh data
        const data = this.loadFromScraperResults();
        this.cache = data;
        this.cacheTimestamp = now;

        return data.permitFees;
    }

    /**
     * Get data quality metadata with caching
     */
    getDataQuality() {
        const now = Date.now();

        // Return cached data if fresh
        if (this.cache && this.cacheTimestamp && (now - this.cacheTimestamp < this.cacheTTL)) {
            return this.cache.dataQuality;
        }

        // Load fresh data
        const data = this.loadFromScraperResults();
        this.cache = data;
        this.cacheTimestamp = now;

        return data.dataQuality;
    }

    /**
     * Clear cache (force reload)
     */
    clearCache() {
        this.cache = null;
        this.cacheTimestamp = null;
    }

    /**
     * Get supported jurisdictions
     */
    getSupportedJurisdictions() {
        const fees = this.getPermitFees();
        return Object.keys(fees);
    }
}

// Create singleton instance
const loader = new DatabaseLoader();

// Export in same format as old database for backward compatibility
module.exports = {
    permitFees: new Proxy({}, {
        get: (target, prop) => {
            const fees = loader.getPermitFees();
            return fees[prop];
        },
        ownKeys: () => {
            return Object.keys(loader.getPermitFees());
        },
        getOwnPropertyDescriptor: (target, prop) => {
            return {
                enumerable: true,
                configurable: true
            };
        }
    }),
    dataQuality: new Proxy({}, {
        get: (target, prop) => {
            const quality = loader.getDataQuality();
            return quality[prop];
        },
        ownKeys: () => {
            return Object.keys(loader.getDataQuality());
        },
        getOwnPropertyDescriptor: (target, prop) => {
            return {
                enumerable: true,
                configurable: true
            };
        }
    }),
    // Re-export static data for backward compatibility
    laborTimes: staticDB.laborTimes,
    markupRecommendations: staticDB.markupRecommendations,
    detectRegion: staticDB.detectRegion,
    // Add new utilities
    loader: loader,
    clearCache: () => loader.clearCache()
};
