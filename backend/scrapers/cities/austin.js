/**
 * Austin Permit Fee Scraper
 * Source: Residential Building Plan Review & Inspection Permit Fees
 * URL: https://www.austintexas.gov/sites/default/files/files/Development_Services/Fees_Residential.pdf
 * Effective: October 1, 2025 (FY 2025-26)
 */

const BaseScraper = require('../base-scraper');
const PDFParser = require('../pdf-parser');
const fs = require('fs').promises;
const path = require('path');

class AustinScraper extends BaseScraper {
    constructor() {
        super({
            city: 'Austin',
            state: 'TX',
            jurisdiction: 'Austin, TX'
        });

        this.pdfParser = new PDFParser();
        this.urls = {
            base: 'https://www.austintexas.gov',
            fees: 'https://www.austintexas.gov/page/fees',
            residentialPDF: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/Fees_Residential.pdf'
        };
    }

    /**
     * Main scraping method
     */
    async scrape() {
        console.log('🏗️ Starting Austin scraper...');

        try {
            await this.init();

            const page = await this.newPage();

            // Download the residential fees PDF directly
            console.log(`📥 Downloading Austin residential fees PDF...`);
            const pdfBuffer = await this.downloadFile(page, this.urls.residentialPDF);

            // Save PDF
            await this.savePDF(pdfBuffer, 'austin-residential-fees-2025.pdf');

            // Parse PDF
            const pdfData = await this.pdfParser.parsePDF(pdfBuffer);

            // Extract fees
            const fees = this.extractAustinFees(pdfData.text);

            // Calculate hash for change detection
            fees.pdfHash = this.pdfParser.hashPDF(pdfBuffer);

            await page.close();
            await this.close();

            console.log('✅ Austin scraping complete');
            return fees;

        } catch (error) {
            console.error(`❌ Austin scraper failed: ${error.message}`);
            await this.close();
            throw error;
        }
    }

    /**
     * Extract Austin-specific fee structure
     */
    extractAustinFees(text) {
        console.log('🔍 Extracting Austin fees from PDF...');

        const fees = {
            jurisdiction: 'Austin, TX',
            source: 'Residential Building Plan Review & Inspection Permit Fees (FY 2025-26)',
            sourceUrl: this.urls.residentialPDF,
            scrapedAt: new Date().toISOString(),
            electrical: null,
            plumbing: null,
            hvac: null,
            mechanical: null,
            effectiveDate: 'October 1, 2025',
            notes: []
        };

        // Austin uses base charge + $0.18 per sq ft over 1,000 sq ft
        // Try to find base fees for trades

        // Search for electrical section
        const electricalSection = this.pdfParser.findSection(text, 'electrical');
        if (electricalSection) {
            const electricalFees = this.pdfParser.extractFees(electricalSection);
            fees.electrical = {
                baseFee: electricalFees.baseFee || electricalFees.minFee || 85,
                valuationRate: 0.006,
                raw: electricalFees.raw
            };
        }

        // Search for plumbing section
        const plumbingSection = this.pdfParser.findSection(text, 'plumbing');
        if (plumbingSection) {
            const plumbingFees = this.pdfParser.extractFees(plumbingSection);
            fees.plumbing = {
                baseFee: plumbingFees.baseFee || plumbingFees.minFee || 75,
                valuationRate: 0.006,
                raw: plumbingFees.raw
            };
        }

        // Search for mechanical/HVAC section
        const mechanicalSection = this.pdfParser.findSection(text, 'mechanical');
        if (mechanicalSection) {
            const mechanicalFees = this.pdfParser.extractFees(mechanicalSection);
            fees.mechanical = {
                baseFee: mechanicalFees.baseFee || mechanicalFees.minFee || 95,
                valuationRate: 0.006,
                raw: mechanicalFees.raw
            };
        }

        fees.hvac = fees.mechanical; // Austin combines these

        // Look for square footage pricing
        const sqftMatch = text.match(/\$\s*([\d.]+)\s*per\s*sq\.?\s*ft/i);
        if (sqftMatch) {
            fees.notes.push(`Square footage pricing: $${sqftMatch[1]} per sq. ft. over 1,000 sq. ft.`);
        }

        // Check for credit card fee
        if (text.toLowerCase().includes('2.35%') && text.toLowerCase().includes('credit card')) {
            fees.notes.push('Credit card payments incur 2.35% fee ($2.00 minimum)');
        }

        console.log('✅ Austin fees extracted:', JSON.stringify(fees, null, 2));
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
            'Austin, TX': {
                electrical: {
                    baseFee: scrapedFees.electrical?.baseFee || 85,
                    valuationRate: 0.006,
                    minFee: scrapedFees.electrical?.baseFee || 85,
                    maxFee: 1800
                },
                plumbing: {
                    baseFee: scrapedFees.plumbing?.baseFee || 75,
                    valuationRate: 0.006,
                    minFee: scrapedFees.plumbing?.baseFee || 75,
                    maxFee: 1800
                },
                hvac: {
                    baseFee: scrapedFees.hvac?.baseFee || 95,
                    valuationRate: 0.006,
                    minFee: scrapedFees.hvac?.baseFee || 95,
                    maxFee: 1800
                },
                processingTime: '2-3 weeks',
                expediteFee: 150,
                expediteTime: '2-4 days'
            }
        };

        return dbFormat;
    }
}

module.exports = AustinScraper;

// CLI usage
if (require.main === module) {
    (async () => {
        const scraper = new AustinScraper();

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
