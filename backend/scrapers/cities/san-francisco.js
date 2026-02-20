/**
 * San Francisco Fee Scraper
 * SF Department of Building Inspection (DBI)
 */

const BaseScraper = require('../base-scraper');
const PDFParser = require('../pdf-parser');

class SanFranciscoScraper extends BaseScraper {
    constructor() {
        super({
            city: 'San Francisco',
            state: 'CA',
            jurisdiction: 'San Francisco, CA'
        });

        this.pdfParser = new PDFParser();
    }

    async scrape() {
        console.log('🏗️ Starting San Francisco scraper...');

        try {
            await this.init();
            const page = await this.newPage();

            // Use direct PDF link from SF API media server for 2025 electrical permit fees
            const pdfLink = 'https://media.api.sf.gov/documents/Table_1A-E_-_Electrical_Permit_Issuance_and_Inspection_2025.pdf';

            console.log(`📥 Downloading SF electrical permit fee schedule...`);

            // Download PDF
            const pdfBuffer = await this.downloadFile(page, pdfLink);
            console.log(`✅ Downloaded ${pdfBuffer.length} bytes`);

            // Save PDF
            const pdfPath = await this.savePDF(pdfBuffer, 'san-francisco-fee-schedule-2025.pdf');

            // Parse PDF
            const pdfData = await this.pdfParser.parsePDF(pdfBuffer);
            const text = pdfData.text;

            // Extract fees
            const electricalFees = this.pdfParser.extractFees(text, 'electrical');
            const plumbingFees = this.pdfParser.extractFees(text, 'plumbing');
            const hvacFees = this.pdfParser.extractFees(text, 'mechanical');

            // Extract effective date
            const effectiveDate = this.pdfParser.extractEffectiveDate(text);

            // Generate PDF hash
            const pdfHash = this.pdfParser.hashPDF(pdfBuffer);

            const result = {
                jurisdiction: this.jurisdiction,
                source: 'SF Department of Building Inspection Fee Schedule',
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

            console.log('✅ San Francisco scraping complete');
            return result;

        } catch (error) {
            console.error(`❌ San Francisco scraper failed: ${error.message}`);
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
        const scraper = new SanFranciscoScraper();
        try {
            const fees = await scraper.scrape();
            console.log('\n📊 Results:', JSON.stringify(fees, null, 2));
        } catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = SanFranciscoScraper;
