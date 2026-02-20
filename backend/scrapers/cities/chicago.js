/**
 * Chicago Fee Scraper
 * Chicago Department of Buildings
 */

const BaseScraper = require('../base-scraper');
const PDFParser = require('../pdf-parser');

class ChicagoScraper extends BaseScraper {
    constructor() {
        super({
            city: 'Chicago',
            state: 'IL',
            jurisdiction: 'Chicago, IL'
        });
        this.pdfParser = new PDFParser();
    }

    async scrape() {
        console.log('🏗️ Starting Chicago scraper...');

        try {
            await this.init();
            const page = await this.newPage();

            // Use direct PDF link for Chicago 2025 permit fees
            const pdfLink = 'https://www.chicago.gov/content/dam/city/depts/bldgs/general/Permitfees/2025%20Bldg%20Permit%20Fee%20Tables.pdf';

            console.log(`📥 Downloading Chicago 2025 permit fee tables...`);

            // Download PDF
            const pdfBuffer = await this.downloadFile(page, pdfLink);
            console.log(`✅ Downloaded ${pdfBuffer.length} bytes`);

            // Save PDF
            const pdfPath = await this.savePDF(pdfBuffer, 'chicago-fee-schedule-2025.pdf');

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
                source: 'Chicago Department of Buildings Fee Schedule',
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

            console.log('✅ Chicago scraping complete');
            return result;

        } catch (error) {
            console.error(`❌ Chicago scraper failed: ${error.message}`);
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
        const scraper = new ChicagoScraper();
        try {
            const fees = await scraper.scrape();
            console.log('\n📊 Results:', JSON.stringify(fees, null, 2));
        } catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = ChicagoScraper;
