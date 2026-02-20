/**
 * Scraper Orchestrator
 * Manages scraping across multiple cities with change detection and alerting
 */

const fs = require('fs').promises;
const path = require('path');

// Import city scrapers
const SanDiegoScraper = require('./cities/san-diego');
const AustinScraper = require('./cities/austin');
const HoustonScraper = require('./cities/houston');
const LosAngelesScraper = require('./cities/los-angeles');
const SanFranciscoScraper = require('./cities/san-francisco');
const MiamiScraper = require('./cities/miami');
const ChicagoScraper = require('./cities/chicago');
const MilwaukeeScraper = require('./cities/milwaukee');
const PhoenixScraper = require('./cities/phoenix');
const NewYorkScraper = require('./cities/new-york');

class ScraperOrchestrator {
    constructor() {
        this.scrapers = {
            'Los Angeles, CA': LosAngelesScraper,
            'San Diego, CA': SanDiegoScraper,
            'San Francisco, CA': SanFranciscoScraper,
            'Austin, TX': AustinScraper,
            'Houston, TX': HoustonScraper,
            'Miami, FL': MiamiScraper,
            'Chicago, IL': ChicagoScraper,
            'Milwaukee, WI': MilwaukeeScraper,
            'Phoenix, AZ': PhoenixScraper,
            'New York, NY': NewYorkScraper
        };

        this.resultsDir = path.join(__dirname, '..', 'scraper-results');
        this.historyFile = path.join(this.resultsDir, 'scrape-history.json');
    }

    /**
     * Run all scrapers
     */
    async scrapeAll() {
        console.log('🚀 Starting scraper orchestrator...\n');

        const results = {
            timestamp: new Date().toISOString(),
            cities: {},
            summary: {
                total: 0,
                successful: 0,
                failed: 0,
                changes: []
            }
        };

        for (const [city, ScraperClass] of Object.entries(this.scrapers)) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🏙️  Scraping: ${city}`);
            console.log(`${'='.repeat(60)}\n`);

            results.summary.total++;

            try {
                const scraper = new ScraperClass();
                const fees = await scraper.scrape();

                results.cities[city] = {
                    status: 'success',
                    data: fees,
                    error: null
                };

                results.summary.successful++;

                // Check for changes
                const changes = await this.detectChanges(city, fees);
                if (changes.length > 0) {
                    results.summary.changes.push({
                        city,
                        changes
                    });
                }

            } catch (error) {
                console.error(`❌ Failed to scrape ${city}: ${error.message}\n`);

                results.cities[city] = {
                    status: 'failed',
                    data: null,
                    error: error.message
                };

                results.summary.failed++;
            }

            // Delay between cities to be respectful
            await this.delay(3000);
        }

        // Save results
        await this.saveResults(results);

        // Print summary
        this.printSummary(results);

        return results;
    }

    /**
     * Scrape a single city
     */
    async scrapeCity(cityName) {
        const ScraperClass = this.scrapers[cityName];

        if (!ScraperClass) {
            throw new Error(`No scraper available for ${cityName}`);
        }

        console.log(`🏙️  Scraping: ${cityName}\n`);

        const scraper = new ScraperClass();
        const fees = await scraper.scrape();

        // Check for changes
        const changes = await this.detectChanges(cityName, fees);

        return {
            city: cityName,
            fees,
            changes
        };
    }

    /**
     * Detect changes from previous scrape
     */
    async detectChanges(city, newFees) {
        const changes = [];

        try {
            // Load previous results
            const historyExists = await this.fileExists(this.historyFile);
            if (!historyExists) {
                console.log('ℹ️  No previous scrape history found');
                return changes;
            }

            const historyData = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(historyData);

            if (!history[city]) {
                console.log('ℹ️  No previous data for this city');
                return changes;
            }

            const oldFees = history[city];

            // Compare electrical fees
            if (this.feesChanged(oldFees.electrical, newFees.electrical)) {
                changes.push({
                    type: 'electrical',
                    old: oldFees.electrical,
                    new: newFees.electrical
                });
            }

            // Compare plumbing fees
            if (this.feesChanged(oldFees.plumbing, newFees.plumbing)) {
                changes.push({
                    type: 'plumbing',
                    old: oldFees.plumbing,
                    new: newFees.plumbing
                });
            }

            // Compare HVAC fees
            if (this.feesChanged(oldFees.hvac, newFees.hvac)) {
                changes.push({
                    type: 'hvac',
                    old: oldFees.hvac,
                    new: newFees.hvac
                });
            }

            // Check for PDF hash changes (content updated)
            if (oldFees.pdfHash && newFees.pdfHash) {
                if (oldFees.pdfHash !== newFees.pdfHash) {
                    changes.push({
                        type: 'pdf_updated',
                        message: 'PDF content has changed'
                    });
                }
            }

            if (changes.length > 0) {
                console.log(`\n⚠️  CHANGES DETECTED: ${changes.length} changes found\n`);
                changes.forEach(change => {
                    console.log(`   - ${change.type}: ${JSON.stringify(change.old)} → ${JSON.stringify(change.new)}`);
                });
            } else {
                console.log('✅ No changes detected');
            }

        } catch (error) {
            console.error(`⚠️  Error checking for changes: ${error.message}`);
        }

        return changes;
    }

    /**
     * Compare fee objects
     */
    feesChanged(oldFee, newFee) {
        if (!oldFee || !newFee) return false;

        // Compare base fees
        if (oldFee.baseFee !== newFee.baseFee) return true;

        // Compare valuation rates
        if (oldFee.valuationRate !== newFee.valuationRate) return true;

        // Compare min/max if they exist
        if (oldFee.minFee !== newFee.minFee) return true;
        if (oldFee.maxFee !== newFee.maxFee) return true;

        return false;
    }

    /**
     * Save scraping results
     */
    async saveResults(results) {
        try {
            // Create results directory
            await fs.mkdir(this.resultsDir, { recursive: true });

            // Save timestamped results
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const resultsFile = path.join(this.resultsDir, `scrape-${timestamp}.json`);
            await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));

            console.log(`\n💾 Results saved: ${resultsFile}`);

            // Update history (latest successful scrapes)
            const history = {};
            for (const [city, result] of Object.entries(results.cities)) {
                if (result.status === 'success') {
                    history[city] = result.data;
                }
            }

            await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
            console.log(`💾 History updated: ${this.historyFile}`);

        } catch (error) {
            console.error(`❌ Failed to save results: ${error.message}`);
        }
    }

    /**
     * Print summary
     */
    printSummary(results) {
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 SCRAPING SUMMARY');
        console.log(`${'='.repeat(60)}\n`);

        console.log(`Total cities:     ${results.summary.total}`);
        console.log(`✅ Successful:    ${results.summary.successful}`);
        console.log(`❌ Failed:        ${results.summary.failed}`);
        console.log(`⚠️  Changes found: ${results.summary.changes.length}`);

        if (results.summary.changes.length > 0) {
            console.log(`\n🔔 CHANGES DETECTED:\n`);
            results.summary.changes.forEach(({ city, changes }) => {
                console.log(`   ${city}:`);
                changes.forEach(change => {
                    console.log(`      - ${change.type}`);
                });
            });
        }

        console.log(`\n${'='.repeat(60)}\n`);
    }

    /**
     * Generate email alert for changes
     */
    generateAlert(results) {
        if (results.summary.changes.length === 0) {
            return null;
        }

        let alert = `🔔 Permit Fee Changes Detected\n\n`;
        alert += `Scrape Date: ${results.timestamp}\n\n`;

        results.summary.changes.forEach(({ city, changes }) => {
            alert += `${city}:\n`;
            changes.forEach(change => {
                alert += `  - ${change.type}: `;
                if (change.old && change.new) {
                    alert += `$${change.old.baseFee} → $${change.new.baseFee}\n`;
                } else {
                    alert += `${change.message}\n`;
                }
            });
            alert += `\n`;
        });

        alert += `\nAction Required: Review changes and update database.\n`;

        return alert;
    }

    /**
     * Utility: Delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Utility: Check if file exists
     */
    async fileExists(filepath) {
        try {
            await fs.access(filepath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = ScraperOrchestrator;

// CLI usage
if (require.main === module) {
    (async () => {
        const orchestrator = new ScraperOrchestrator();

        const args = process.argv.slice(2);
        const city = args[0];

        try {
            let results;

            if (city) {
                // Scrape single city
                results = await orchestrator.scrapeCity(city);
                console.log('\n📊 Scraping complete');
                console.log(JSON.stringify(results, null, 2));
            } else {
                // Scrape all cities
                results = await orchestrator.scrapeAll();

                // Generate alert if changes found
                const alert = orchestrator.generateAlert(results);
                if (alert) {
                    console.log('\n' + alert);
                }
            }

            process.exit(0);

        } catch (error) {
            console.error('❌ Scraping failed:', error);
            process.exit(1);
        }
    })();
}
