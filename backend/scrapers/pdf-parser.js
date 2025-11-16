/**
 * PDF Parser Module
 * Extracts permit fee information from government PDFs
 */

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const Tesseract = require('tesseract.js');
const { createCanvas } = require('canvas');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class PDFParser {
    constructor() {
        this.feePatterns = {
            // Common patterns for extracting fees
            baseFee: /base\s+fee[:\s]+\$?([\d,]+\.?\d*)/gi,
            electrical: /electrical[^$]*\$?([\d,]+\.?\d*)/gi,
            plumbing: /plumbing[^$]*\$?([\d,]+\.?\d*)/gi,
            mechanical: /mechanical|hvac[^$]*\$?([\d,]+\.?\d*)/gi,
            valuation: /(\d+\.?\d*)\s*%/g,
            minimum: /minimum[^$]*\$?([\d,]+\.?\d*)/gi,
            currency: /\$\s*([\d,]+\.?\d*)/g
        };
    }

    /**
     * Parse PDF buffer and extract text
     */
    async parsePDF(buffer) {
        try {
            console.log('📄 Parsing PDF...');

            // Load PDF document
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(buffer),
                useSystemFonts: true,
                disableFontFace: true
            });

            const pdfDocument = await loadingTask.promise;
            const numPages = pdfDocument.numPages;

            console.log(`📄 PDF loaded: ${numPages} pages`);

            // Extract text from all pages
            let fullText = '';

            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();

                // Combine text items with spaces
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                fullText += pageText + '\n\n';
            }

            console.log(`✅ PDF parsed: ${numPages} pages, ${fullText.length} characters`);

            return {
                text: fullText,
                numpages: numPages,
                info: {},
                metadata: {}
            };
        } catch (error) {
            console.error(`❌ PDF parsing failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Parse image-based PDF using OCR
     */
    async parsePDFWithOCR(buffer) {
        try {
            console.log('📄 Parsing image-based PDF with OCR...');

            // Load PDF document
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(buffer)
            });
            const pdfDocument = await loadingTask.promise;
            const numPages = pdfDocument.numPages;

            console.log(`📄 PDF loaded: ${numPages} pages`);
            console.log('🔍 Rendering PDF pages to canvas and running OCR...');

            let fullText = '';
            const worker = await Tesseract.createWorker('eng');

            // Process each page with OCR
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                console.log(`🔍 OCR processing page ${pageNum}/${numPages}...`);

                try {
                    // Get PDF page
                    const page = await pdfDocument.getPage(pageNum);

                    // Render at higher scale for better OCR accuracy
                    const scale = 2.0;
                    const viewport = page.getViewport({ scale });

                    // Create canvas and render PDF page to it
                    const canvas = createCanvas(viewport.width, viewport.height);
                    const context = canvas.getContext('2d');

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    console.log(`  📐 Rendering page to canvas (${Math.floor(viewport.width)}x${Math.floor(viewport.height)})...`);
                    await page.render(renderContext).promise;

                    // Convert canvas to image buffer (PNG format)
                    const imageBuffer = canvas.toBuffer('image/png');
                    console.log(`  ✅ Rendered to PNG: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

                    // Run OCR on the rendered image
                    const { data: { text, confidence } } = await worker.recognize(imageBuffer);

                    console.log(`  ✅ OCR complete: ${text.length} characters extracted (confidence: ${confidence.toFixed(1)}%)`);

                    // Add page text with separator
                    fullText += text + '\n\n';

                } catch (pageError) {
                    console.error(`  ❌ Failed to process page ${pageNum}: ${pageError.message}`);
                    // Continue with next page
                }
            }

            await worker.terminate();

            console.log(`✅ OCR complete: ${numPages} pages processed, ${fullText.length} total characters`);

            return {
                text: fullText,
                numpages: numPages,
                info: {},
                metadata: {
                    ocrUsed: true,
                    ocrEngine: 'tesseract.js',
                    renderScale: 2.0
                }
            };

        } catch (error) {
            console.error(`❌ OCR parsing failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Extract fee information from text
     */
    extractFees(text, tradeType = null) {
        console.log(`🔍 Extracting fees${tradeType ? ` for ${tradeType}` : ''}...`);

        const fees = {
            baseFee: null,
            valuationRate: null,
            minFee: null,
            maxFee: null,
            raw: []
        };

        // Extract all currency values
        const currencyMatches = [...text.matchAll(this.feePatterns.currency)];
        fees.raw = currencyMatches.map(m => parseFloat(m[1].replace(/,/g, '')));

        // Extract trade-specific fees
        if (tradeType) {
            const pattern = this.feePatterns[tradeType.toLowerCase()];
            if (pattern) {
                const matches = [...text.matchAll(pattern)];
                if (matches.length > 0 && matches[0][1]) {
                    fees.baseFee = parseFloat(matches[0][1].replace(/,/g, ''));
                }
            }
        }

        // Extract valuation percentages
        const valuationMatches = [...text.matchAll(this.feePatterns.valuation)];
        if (valuationMatches.length > 0 && valuationMatches[0][1]) {
            fees.valuationRate = parseFloat(valuationMatches[0][1]) / 100; // Convert to decimal
        }

        // Extract minimum fee
        const minMatches = [...text.matchAll(this.feePatterns.minimum)];
        if (minMatches.length > 0 && minMatches[0][1]) {
            fees.minFee = parseFloat(minMatches[0][1].replace(/,/g, ''));
        }

        console.log(`✅ Extracted fees:`, fees);
        return fees;
    }

    /**
     * Extract effective date from PDF
     */
    extractEffectiveDate(text) {
        const datePatterns = [
            /effective\s+(?:date\s*:?\s*)?(\w+\s+\d{1,2},?\s+\d{4})/gi,
            /revised\s+(\w+\s+\d{1,2},?\s+\d{4})/gi,
            /dated?\s+(\w+\s+\d{1,2},?\s+\d{4})/gi,
            /(\d{1,2}\/\d{1,2}\/\d{4})/g
        ];

        for (const pattern of datePatterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                console.log(`📅 Found effective date: ${matches[0][1]}`);
                return matches[0][1];
            }
        }

        console.warn('⚠️ No effective date found');
        return null;
    }

    /**
     * Find section in PDF text
     */
    findSection(text, sectionName) {
        const lines = text.split('\n');
        const sectionPattern = new RegExp(sectionName, 'i');

        let startIndex = -1;
        let endIndex = -1;

        // Find section start
        for (let i = 0; i < lines.length; i++) {
            if (sectionPattern.test(lines[i])) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) {
            console.warn(`⚠️ Section "${sectionName}" not found`);
            return '';
        }

        // Find section end (next major heading or end of document)
        const headingPattern = /^[A-Z][A-Z\s]{10,}$/; // All caps headings
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (headingPattern.test(lines[i].trim())) {
                endIndex = i;
                break;
            }
        }

        if (endIndex === -1) {
            endIndex = lines.length;
        }

        const section = lines.slice(startIndex, endIndex).join('\n');
        console.log(`✅ Found section: ${sectionName} (${endIndex - startIndex} lines)`);

        return section;
    }

    /**
     * Parse fee table from text
     */
    parseFeeTable(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const table = [];

        for (const line of lines) {
            // Look for lines with category and fee
            const match = line.match(/^(.+?)\s+\$\s*([\d,]+\.?\d*)/);
            if (match) {
                table.push({
                    category: match[1].trim(),
                    fee: parseFloat(match[2].replace(/,/g, ''))
                });
            }
        }

        return table;
    }

    /**
     * Extract permit types and their fees
     */
    extractPermitTypes(text) {
        const types = {
            electrical: null,
            plumbing: null,
            mechanical: null,
            hvac: null,
            general: null
        };

        for (const [type, pattern] of Object.entries(this.feePatterns)) {
            if (['baseFee', 'valuation', 'minimum', 'currency'].includes(type)) {
                continue; // Skip non-trade patterns
            }

            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                const fees = matches.map(m => parseFloat(m[1].replace(/,/g, '')));
                types[type] = {
                    fees: fees,
                    average: fees.reduce((a, b) => a + b, 0) / fees.length,
                    min: Math.min(...fees),
                    max: Math.max(...fees)
                };
            }
        }

        return types;
    }

    /**
     * Clean and normalize text for parsing
     */
    cleanText(text) {
        return text
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
            .trim();
    }

    /**
     * Search for keywords in context
     */
    searchInContext(text, keyword, contextLines = 2) {
        const lines = text.split('\n');
        const results = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
                const start = Math.max(0, i - contextLines);
                const end = Math.min(lines.length, i + contextLines + 1);
                const context = lines.slice(start, end).join('\n');

                results.push({
                    lineNumber: i + 1,
                    context: context,
                    line: lines[i]
                });
            }
        }

        return results;
    }

    /**
     * Generate hash of PDF content for change detection
     */
    hashPDF(buffer) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
}

module.exports = PDFParser;
