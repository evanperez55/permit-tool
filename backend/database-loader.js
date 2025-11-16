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
     * Load latest scraper results and convert to database format
     */
    loadFromScraperResults() {
        try {
            // Check if history file exists
            if (!fs.existsSync(this.historyFile)) {
                console.log('ℹ️  No scraper history found, using static database');
                return this.convertStaticDB();
            }

            // Load history
            const historyData = fs.readFileSync(this.historyFile, 'utf8');
            const history = JSON.parse(historyData);

            // Convert to database format
            const permitFees = {};
            const dataQuality = {};

            for (const [jurisdiction, feeData] of Object.entries(history)) {
                // Convert fees to old format
                permitFees[jurisdiction] = {
                    electrical: feeData.electrical?.baseFee || null,
                    plumbing: feeData.plumbing?.baseFee || null,
                    hvac: feeData.hvac?.baseFee || null,
                    // Store raw data for advanced calculations
                    _rawData: {
                        electrical: feeData.electrical,
                        plumbing: feeData.plumbing,
                        hvac: feeData.hvac
                    }
                };

                // Generate data quality metadata
                dataQuality[jurisdiction] = {
                    quality: 'verified',
                    source: feeData.source || 'Automated Scraper',
                    lastVerified: feeData.scrapedAt ? feeData.scrapedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                    url: feeData.sourceUrl || null,
                    confidence: 'high',
                    notes: `Data automatically scraped. PDF hash: ${feeData.pdfHash?.substring(0, 16)}...`,
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
