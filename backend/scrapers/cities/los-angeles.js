/**
 * Los Angeles Fee Scraper
 * LADBS (Los Angeles Department of Building and Safety)
 */

const BaseScraper = require('../base-scraper');
const PDFParser = require('../pdf-parser');

class LosAngelesScraper extends BaseScraper {
    constructor() {
        super({
            city: 'Los Angeles',
            state: 'CA',
            jurisdiction: 'Los Angeles, CA'
        });

        this.pdfParser = new PDFParser();
    }

    async scrape() {
        console.log('🏗️ Starting Los Angeles scraper...');

        try {
            await this.init();
            const page = await this.newPage();

            // Use direct PDF link for LA electrical permit fee schedule
            const pdfLink = 'https://ladbs.org/docs/default-source/forms/plan-check-2014/permit-fee-schedule-for-electrical-permits-pc-elec-feesched01.pdf';

            console.log(`📥 Downloading LA electrical permit fee schedule...`);

            // Download PDF
            const pdfBuffer = await this.downloadFile(page, pdfLink);
            console.log(`✅ Downloaded ${pdfBuffer.length} bytes`);

            // Save PDF
            const pdfPath = await this.savePDF(pdfBuffer, 'los-angeles-fee-schedule-2025.pdf');

            // Parse PDF
            const pdfData = await this.pdfParser.parsePDF(pdfBuffer);
            const text = pdfData.text;

            // Extract fees
            const electricalFees = this.pdfParser.extractFees(text, 'electrical');
            const plumbingFees = this.pdfParser.extractFees(text, 'plumbing');
            const hvacFees = this.pdfParser.extractFees(text, 'mechanical');

            // Extract effective date
            const effectiveDate = this.pdfParser.extractEffectiveDate(text);

            // Generate PDF hash for change detection
            const pdfHash = this.pdfParser.hashPDF(pdfBuffer);

            const result = {
                jurisdiction: this.jurisdiction,
                source: 'LADBS Official Fee Schedule',
                sourceUrl: pdfLink,
                scrapedAt: new Date().toISOString(),
                electrical: electricalFees,
                plumbing: plumbingFees,
                hvac: hvacFees,
                effectiveDate: effectiveDate,
                pdfHash: pdfHash,
                pdfPath: pdfPath
            };

            await this.close();

            console.log('✅ Los Angeles scraping complete');
            return result;

        } catch (error) {
            console.error(`❌ Los Angeles scraper failed: ${error.message}`);
            await this.close();
            throw error;
        }
    }

    /**
     * Save PDF for reference
     */
    async savePDF(buffer, filename) {
        const fs = require('fs').promises;
        const path = require('path');
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
}

if (require.main === module) {
    (async () => {
        const scraper = new LosAngelesScraper();
        try {
            const fees = await scraper.scrape();
            console.log('\n📊 Results:', JSON.stringify(fees, null, 2));
        } catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = LosAngelesScraper;
