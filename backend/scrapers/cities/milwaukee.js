/**
 * Milwaukee Fee Scraper
 * Milwaukee Department of Neighborhood Services
 */

const BaseScraper = require('../base-scraper');
const PDFParser = require('../pdf-parser');

class MilwaukeeScraper extends BaseScraper {
    constructor() {
        super({
            city: 'Milwaukee',
            state: 'WI',
            jurisdiction: 'Milwaukee, WI',
            browserType: 'firefox' // Firefox bypasses Milwaukee's WAF blocking
        });
        this.pdfParser = new PDFParser();
    }

    async scrape() {
        console.log('🏗️ Starting Milwaukee scraper...');

        try {
            await this.init();
            const page = await this.newPage();

            // Use direct PDF link for Milwaukee plan review and permit fees
            const pdfLink = 'https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/DevCenterFeeCombo.pdf';

            console.log(`📥 Downloading Milwaukee plan review and permit fees...`);

            // Download PDF
            const pdfBuffer = await this.downloadFile(page, pdfLink);
            console.log(`✅ Downloaded ${pdfBuffer.length} bytes`);

            // Save PDF
            const pdfPath = await this.savePDF(pdfBuffer, 'milwaukee-fee-schedule-2025.pdf');

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
                source: 'Milwaukee DNS Fee Schedule',
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

            console.log('✅ Milwaukee scraping complete');
            return result;

        } catch (error) {
            console.error(`❌ Milwaukee scraper failed: ${error.message}`);
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
        const scraper = new MilwaukeeScraper();
        try {
            const fees = await scraper.scrape();
            console.log('\n📊 Results:', JSON.stringify(fees, null, 2));
        } catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = MilwaukeeScraper;
