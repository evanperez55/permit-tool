/**
 * Houston Permit Fee Scraper
 * Source: 2025 Building Code Enforcement Fee Schedule
 * URL: https://www.houstonpermittingcenter.org/media/2636/download
 */

const BaseScraper = require('../base-scraper');
const PDFParser = require('../pdf-parser');
const fs = require('fs').promises;
const path = require('path');

class HoustonScraper extends BaseScraper {
    constructor() {
        super({
            city: 'Houston',
            state: 'TX',
            jurisdiction: 'Houston, TX'
        });

        this.pdfParser = new PDFParser();
        this.urls = {
            base: 'https://www.houstonpermittingcenter.org',
            fees: 'https://www.houstonpermittingcenter.org/help/fee-schedules',
            feeSchedulePDF: 'https://www.houstonpermittingcenter.org/media/2636/download'
        };
    }

    /**
     * Main scraping method
     */
    async scrape() {
        console.log('🏗️ Starting Houston scraper...');

        try {
            await this.init();

            const page = await this.newPage();

            // Download the 2025 fee schedule PDF
            console.log(`📥 Downloading Houston 2025 fee schedule PDF...`);
            const pdfBuffer = await this.downloadFile(page, this.urls.feeSchedulePDF);

            // Save PDF
            await this.savePDF(pdfBuffer, 'houston-fee-schedule-2025.pdf');

            // Parse PDF
            const pdfData = await this.pdfParser.parsePDF(pdfBuffer);

            // Extract fees
            const fees = this.extractHoustonFees(pdfData.text);

            // Calculate hash for change detection
            fees.pdfHash = this.pdfParser.hashPDF(pdfBuffer);

            await page.close();
            await this.close();

            console.log('✅ Houston scraping complete');
            return fees;

        } catch (error) {
            console.error(`❌ Houston scraper failed: ${error.message}`);
            await this.close();
            throw error;
        }
    }

    /**
     * Extract Houston-specific fee structure
     */
    extractHoustonFees(text) {
        console.log('🔍 Extracting Houston fees from PDF...');

        const fees = {
            jurisdiction: 'Houston, TX',
            source: '2025 Building Code Enforcement Fee Schedule',
            sourceUrl: this.urls.feeSchedulePDF,
            scrapedAt: new Date().toISOString(),
            electrical: null,
            plumbing: null,
            hvac: null,
            mechanical: null,
            effectiveDate: null,
            notes: []
        };

        // Extract effective date
        fees.effectiveDate = this.pdfParser.extractEffectiveDate(text) || '2025';

        // Houston typically has lower fees than other major cities
        // Try to find electrical permit fees
        const electricalSection = this.pdfParser.findSection(text, 'electrical');
        if (electricalSection) {
            const electricalFees = this.pdfParser.extractFees(electricalSection);
            fees.electrical = {
                baseFee: electricalFees.baseFee || electricalFees.minFee || 70,
                valuationRate: 0.005,
                raw: electricalFees.raw
            };
        }

        // Try to find plumbing permit fees
        const plumbingSection = this.pdfParser.findSection(text, 'plumbing');
        if (plumbingSection) {
            const plumbingFees = this.pdfParser.extractFees(plumbingSection);
            fees.plumbing = {
                baseFee: plumbingFees.baseFee || plumbingFees.minFee || 60,
                valuationRate: 0.005,
                raw: plumbingFees.raw
            };
        }

        // Try to find mechanical/HVAC fees
        const mechanicalSection = this.pdfParser.findSection(text, 'mechanical');
        if (mechanicalSection) {
            const mechanicalFees = this.pdfParser.extractFees(mechanicalSection);
            fees.mechanical = {
                baseFee: mechanicalFees.baseFee || mechanicalFees.minFee || 85,
                valuationRate: 0.005,
                raw: mechanicalFees.raw
            };
        }

        fees.hvac = fees.mechanical; // Houston combines these

        // Houston allows online permits for licensed contractors
        fees.notes.push('Licensed contractors can apply for permits online');

        console.log('✅ Houston fees extracted:', JSON.stringify(fees, null, 2));
        return fees;
    }

    /**
     * Save PDF for reference
     */
    async savePDF(buffer, filename) {
        const dir = path.join(__dirname, '../..', 'fee-schedule-pdfs');

        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }

        const filepath = path.join(dir, filename);
        await fs.writeFile(filepath, buffer);

        console.log(`💾 PDF saved: ${filepath}`);
        return filepath;
    }

    /**
     * Convert scraped fees to database format
     */
    convertToDBFormat(scrapedFees) {
        const dbFormat = {
            'Houston, TX': {
                electrical: {
                    baseFee: scrapedFees.electrical?.baseFee || 70,
                    valuationRate: 0.005,
                    minFee: scrapedFees.electrical?.baseFee || 70,
                    maxFee: 1500
                },
                plumbing: {
                    baseFee: scrapedFees.plumbing?.baseFee || 60,
                    valuationRate: 0.005,
                    minFee: scrapedFees.plumbing?.baseFee || 60,
                    maxFee: 1500
                },
                hvac: {
                    baseFee: scrapedFees.hvac?.baseFee || 85,
                    valuationRate: 0.005,
                    minFee: scrapedFees.hvac?.baseFee || 85,
                    maxFee: 1500
                },
                processingTime: '1-2 weeks',
                expediteFee: 100,
                expediteTime: '1-3 days'
            }
        };

        return dbFormat;
    }
}

module.exports = HoustonScraper;

// CLI usage
if (require.main === module) {
    (async () => {
        const scraper = new HoustonScraper();

        try {
            const fees = await scraper.scrape();
            console.log('\n📊 Scraped Fees:');
            console.log(JSON.stringify(fees, null, 2));

            const dbFormat = scraper.convertToDBFormat(fees);
            console.log('\n💾 Database Format:');
            console.log(JSON.stringify(dbFormat, null, 2));

        } catch (error) {
            console.error('❌ Scraping failed:', error);
            process.exit(1);
        }
    })();
}
