/**
 * San Diego Fee Scraper
 * San Diego Development Services
 * Information Bulletin 103 - MEP Permits
 */

const BaseScraper = require('../base-scraper');
const PDFParser = require('../pdf-parser');

class SanDiegoScraper extends BaseScraper {
    constructor() {
        super({
            city: 'San Diego',
            state: 'CA',
            jurisdiction: 'San Diego, CA'
        });

        this.pdfParser = new PDFParser();
    }

    async scrape() {
        console.log('🏗️ Starting San Diego scraper...');

        try {
            await this.init();
            const page = await this.newPage();

            // Use direct PDF link for San Diego Information Bulletin 103
            const pdfLink = 'https://www.sandiego.gov/sites/default/files/2025-04/ib-103-fee-schedule-for-mechanical-electrical-plumbing_gas-permits-cit-www.sandiego.gov_.pdf';

            console.log(`📥 Downloading San Diego Information Bulletin 103...`);

            // Download PDF
            const pdfBuffer = await this.downloadFile(page, pdfLink);
            console.log(`✅ Downloaded ${pdfBuffer.length} bytes`);

            // Save PDF
            const pdfPath = await this.savePDF(pdfBuffer, 'san-diego-bulletin-103.pdf');

            // Parse PDF - try regular parsing first
            console.log('📄 Attempting regular text extraction...');
            let pdfData = await this.pdfParser.parsePDF(pdfBuffer);
            let text = pdfData.text;

            // If we got minimal text (image-based PDF), use OCR
            if (text.length < 100) {
                console.log('⚠️  Minimal text extracted - this is an image-based PDF');
                console.log('🔍 Switching to OCR pipeline...');
                pdfData = await this.pdfParser.parsePDFWithOCR(pdfBuffer);
                text = pdfData.text;
                console.log(`✅ OCR complete: ${text.length} characters extracted`);
            }

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
                source: 'Information Bulletin 103 - MEP Permits',
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

            console.log('✅ San Diego scraping complete');
            return result;

        } catch (error) {
            console.error(`❌ San Diego scraper failed: ${error.message}`);
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
        const scraper = new SanDiegoScraper();
        try {
            const fees = await scraper.scrape();
            console.log('\n📊 Results:', JSON.stringify(fees, null, 2));
        } catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = SanDiegoScraper;
