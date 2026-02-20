/**
 * Test OCR Pipeline
 * Tests the full OCR implementation on San Diego's image-based PDF
 */

const PDFParser = require('./pdf-parser');
const fs = require('fs').promises;

async function testOCR() {
    console.log('🧪 Testing OCR Pipeline on San Diego PDF\n');

    const pdfPath = 'C:\\Users\\evanp\\projects\\permits-app\\backend\\fee-schedule-pdfs\\san-diego-bulletin-103.pdf';

    try {
        // Load PDF
        console.log('📄 Loading PDF...');
        const pdfBuffer = await fs.readFile(pdfPath);
        console.log(`✅ Loaded PDF: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

        // Initialize parser
        const parser = new PDFParser();

        // Try regular parsing first
        console.log('📄 Attempting regular text extraction...');
        const regularParse = await parser.parsePDF(pdfBuffer);
        console.log(`  Text extracted: ${regularParse.text.length} characters\n`);

        // If minimal text, use OCR
        if (regularParse.text.length < 100) {
            console.log('⚠️  Minimal text extracted - this is an image-based PDF');
            console.log('🔍 Switching to OCR pipeline...\n');

            const ocrParse = await parser.parsePDFWithOCR(pdfBuffer);
            console.log(`\n✅ OCR extraction complete!`);
            console.log(`   Total text: ${ocrParse.text.length} characters`);
            console.log(`   Pages: ${ocrParse.numpages}`);
            console.log(`   Metadata: ${JSON.stringify(ocrParse.metadata, null, 2)}`);

            // Extract fees from OCR text
            console.log('\n💰 Extracting fee information...');
            const fees = parser.extractFees(ocrParse.text, 'electrical');
            console.log(`   Extracted fees:`, fees);

            // Search for electrical section
            console.log('\n⚡ Searching for electrical fees...');
            const electricalContext = parser.searchInContext(ocrParse.text, 'electrical', 3);
            if (electricalContext.length > 0) {
                console.log(`   Found ${electricalContext.length} references to "electrical":`);
                electricalContext.slice(0, 3).forEach((ctx, i) => {
                    console.log(`\n   Reference ${i + 1} (line ${ctx.lineNumber}):`);
                    console.log(ctx.context.split('\n').map(l => `     ${l}`).join('\n'));
                });
            }

            // Display first 500 characters
            console.log('\n📝 First 500 characters of extracted text:');
            console.log('─'.repeat(80));
            console.log(ocrParse.text.substring(0, 500));
            console.log('─'.repeat(80));

            // Validate against known fee ($373)
            console.log('\n✅ Validation:');
            console.log(`   Expected fee: $373 (from manual research)`);
            if (fees.baseFee) {
                console.log(`   Extracted fee: $${fees.baseFee}`);
                if (Math.abs(fees.baseFee - 373) < 10) {
                    console.log('   ✅ OCR extraction matches manual research!');
                } else {
                    console.log('   ⚠️  OCR extraction differs from manual research');
                }
            } else {
                console.log('   ⚠️  No base fee extracted - may need manual verification');
            }

        } else {
            console.log('✅ PDF has extractable text - OCR not needed');
            console.log(`   First 500 characters:`);
            console.log(regularParse.text.substring(0, 500));
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }

    console.log('\n✅ OCR pipeline test complete!');
}

// Run test
if (require.main === module) {
    testOCR();
}

module.exports = { testOCR };
