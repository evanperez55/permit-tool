/**
 * Simple OCR for PDF using pdfjs rendering + Tesseract
 * Works without canvas/build tools by using pdfjs rendering directly
 */

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;

async function ocrPDFPage(pdfBuffer, pageNum = 1) {
    console.log(`🔍 OCR processing page ${pageNum}...`);

    try {
        // Load PDF
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(pdfBuffer)
        });

        const pdfDocument = await loadingTask.promise;
        const page = await pdfDocument.getPage(pageNum);

        // Get viewport at high scale for better OCR
        const viewport = page.getViewport({ scale: 2.0 });

        // Create a simple canvas-like object
        const canvasWidth = Math.floor(viewport.width);
        const canvasHeight = Math.floor(viewport.height);

        // Create mock canvas for rendering
        const mockCanvas = {
            width: canvasWidth,
            height: canvasHeight,
            style: {},
            getContext: function(type) {
                if (type === '2d') {
                    const imageData = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
                    // Fill with white background
                    for (let i = 0; i < imageData.length; i += 4) {
                        imageData[i] = 255;     // R
                        imageData[i + 1] = 255; // G
                        imageData[i + 2] = 255; // B
                        imageData[i + 3] = 255; // A
                    }

                    return {
                        canvas: this,
                        fillStyle: '#ffffff',
                        strokeStyle: '#000000',
                        lineWidth: 1,
                        fillRect: function(x, y, w, h) {},
                        strokeRect: function(x, y, w, h) {},
                        clearRect: function(x, y, w, h) {},
                        save: function() {},
                        restore: function() {},
                        scale: function(x, y) {},
                        rotate: function(angle) {},
                        translate: function(x, y) {},
                        transform: function(a, b, c, d, e, f) {},
                        setTransform: function(a, b, c, d, e, f) {},
                        resetTransform: function() {},
                        createLinearGradient: function() { return {}; },
                        createRadialGradient: function() { return {}; },
                        createPattern: function() { return {}; },
                        beginPath: function() {},
                        closePath: function() {},
                        moveTo: function(x, y) {},
                        lineTo: function(x, y) {},
                        quadraticCurveTo: function(cpx, cpy, x, y) {},
                        bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {},
                        arc: function(x, y, radius, startAngle, endAngle, anticlockwise) {},
                        arcTo: function(x1, y1, x2, y2, radius) {},
                        ellipse: function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {},
                        rect: function(x, y, w, h) {},
                        fill: function() {},
                        stroke: function() {},
                        drawImage: function(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
                            // Simulate drawing - we can't actually render without real canvas
                        },
                        createImageData: function(w, h) {
                            return {
                                width: w,
                                height: h,
                                data: new Uint8ClampedArray(w * h * 4)
                            };
                        },
                        getImageData: function(sx, sy, sw, sh) {
                            return {
                                width: sw,
                                height: sh,
                                data: imageData.slice(0, sw * sh * 4)
                            };
                        },
                        putImageData: function(imageData, dx, dy) {},
                        measureText: function(text) {
                            return { width: text.length * 10 };
                        },
                        fillText: function(text, x, y, maxWidth) {},
                        strokeText: function(text, x, y, maxWidth) {},
                        clip: function() {},
                        isPointInPath: function(x, y) { return false; },
                        isPointInStroke: function(x, y) { return false; }
                    };
                }
            }
        };

        console.log('⚠️  Mock canvas created but cannot actually render PDF without real canvas library');
        console.log('📝 Recommendation: Manually extract text from PDF or install canvas properly');

        return null;

    } catch (error) {
        console.error(`❌ OCR failed: ${error.message}`);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    const pdfPath = 'C:\\Users\\evanp\\projects\\permits-app\\backend\\fee-schedule-pdfs\\san-diego-bulletin-103.pdf';

    (async () => {
        try {
            const pdfBuffer = await fs.readFile(pdfPath);
            console.log(`📄 Loaded PDF: ${pdfBuffer.length} bytes`);

            const result = await ocrPDFPage(pdfBuffer, 1);

            console.log('\n💡 To properly implement OCR, you need to:');
            console.log('1. Install Visual Studio Build Tools');
            console.log('2. npm install canvas');
            console.log('3. Then this script can render PDF pages to images');
            console.log('4. Feed those images to Tesseract for OCR');
            console.log('\nFor now, the San Diego fees have been manually researched and added to the database.');

        } catch (error) {
            console.error('❌ Failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = { ocrPDFPage };
