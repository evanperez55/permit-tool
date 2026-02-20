/**
 * OCR PDF Processor
 * Uses Tesseract.js to extract text from image-based PDFs
 */

const Tesseract = require('tesseract.js');
const fs = require('fs').promises;

async function ocrPDF(pdfPath) {
    console.log(`🔍 Starting OCR on: ${pdfPath}`);

    try {
        // Tesseract can work directly with PDF files
        console.log('📄 Initializing Tesseract worker...');
        const worker = await Tesseract.createWorker('eng');

        console.log('🔍 Running OCR on PDF...');
        const { data: { text } } = await worker.recognize(pdfPath);

        console.log(`✅ OCR complete: ${text.length} characters extracted`);
        console.log('\n📄 First 500 characters:');
        console.log(text.substring(0, 500));
        console.log('\n...\n');

        await worker.terminate();

        return text;
    } catch (error) {
        console.error(`❌ OCR failed: ${error.message}`);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    const pdfPath = process.argv[2] || 'C:\\Users\\evanp\\projects\\permits-app\\backend\\fee-schedule-pdfs\\san-diego-bulletin-103.pdf';

    (async () => {
        try {
            const text = await ocrPDF(pdfPath);

            // Extract fee information
            console.log('\n💰 Searching for fee information...');

            const feeMatches = text.match(/\$\s*([\d,]+\.?\d*)/g);
            if (feeMatches) {
                console.log(`\n✅ Found ${feeMatches.length} fee values:`);
                console.log(feeMatches.slice(0, 20).join(', '));
            }

            // Look for electrical fees
            const electricalSection = text.match(/electrical[^\n]*\n([^\n]*\n){0,5}/gi);
            if (electricalSection) {
                console.log('\n⚡ Electrical section:');
                console.log(electricalSection[0]);
            }

        } catch (error) {
            console.error('❌ Failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = { ocrPDF };
