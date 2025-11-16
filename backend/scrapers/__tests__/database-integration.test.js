/**
 * Database Integration Tests
 * Tests that scraped data can be properly stored and retrieved
 */

const MilwaukeeScraper = require('../cities/milwaukee');
const path = require('path');

// Mock database for testing (don't modify actual database in tests)
const mockDatabase = {
    cities: new Map()
};

jest.setTimeout(120000);

describe('Database Integration Tests', () => {

    describe('Scraper Output Format', () => {
        test('Milwaukee scraper output should match database schema', async () => {
            const scraper = new MilwaukeeScraper();

            try {
                const result = await scraper.scrape();

                // Validate required fields for database
                expect(result).toHaveProperty('source');
                expect(result).toHaveProperty('sourceUrl');
                expect(result).toHaveProperty('scrapedAt');
                expect(result).toHaveProperty('pdfHash');
                expect(result).toHaveProperty('pdfPath');

                // Validate fee structures
                if (result.electrical) {
                    expect(result.electrical).toHaveProperty('baseFee');
                    expect(result.electrical).toHaveProperty('valuationRate');
                    expect(result.electrical).toHaveProperty('raw');
                    expect(Array.isArray(result.electrical.raw)).toBe(true);
                }

                // Validate scraped timestamp
                const scrapedDate = new Date(result.scrapedAt);
                expect(scrapedDate).toBeInstanceOf(Date);
                expect(scrapedDate.getTime()).toBeLessThanOrEqual(Date.now());

                // Validate PDF hash format (SHA-256)
                expect(result.pdfHash).toMatch(/^[a-f0-9]{64}$/);

            } catch (error) {
                console.error('Milwaukee scraper failed:', error.message);
                throw error;
            }
        }, 120000);

        test('Scraper output should be JSON serializable', async () => {
            const scraper = new MilwaukeeScraper();

            try {
                const result = await scraper.scrape();

                // Should be able to JSON stringify/parse without loss
                const jsonString = JSON.stringify(result);
                const parsed = JSON.parse(jsonString);

                expect(parsed).toEqual(result);

            } catch (error) {
                console.error('Serialization test failed:', error.message);
                throw error;
            }
        }, 120000);
    });

    describe('PDF Hash - Change Detection', () => {
        test('Same PDF should produce same hash', async () => {
            const PDFParser = require('../pdf-parser');
            const pdfParser = new PDFParser();

            const buffer1 = Buffer.from('fake pdf content for testing');
            const buffer2 = Buffer.from('fake pdf content for testing');

            const hash1 = pdfParser.hashPDF(buffer1);
            const hash2 = pdfParser.hashPDF(buffer2);

            expect(hash1).toBe(hash2);
        });

        test('Different PDFs should produce different hashes', async () => {
            const PDFParser = require('../pdf-parser');
            const pdfParser = new PDFParser();

            const buffer1 = Buffer.from('fake pdf content v1');
            const buffer2 = Buffer.from('fake pdf content v2');

            const hash1 = pdfParser.hashPDF(buffer1);
            const hash2 = pdfParser.hashPDF(buffer2);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Fee Data Structure Validation', () => {
        test('Fee structures should have consistent format', () => {
            const sampleFees = {
                baseFee: 150,
                valuationRate: 0.016,
                minFee: 50,
                maxFee: 5000,
                raw: [150, 250, 350, 500]
            };

            // Validate types
            expect(typeof sampleFees.baseFee).toBe('number');
            expect(typeof sampleFees.valuationRate).toBe('number');
            expect(Array.isArray(sampleFees.raw)).toBe(true);

            // Validate all raw values are numbers
            sampleFees.raw.forEach(value => {
                expect(typeof value).toBe('number');
            });
        });

        test('Null fees should be handled gracefully', () => {
            const emptyFees = {
                baseFee: null,
                valuationRate: null,
                minFee: null,
                maxFee: null,
                raw: []
            };

            // Should not throw when serializing nulls
            expect(() => JSON.stringify(emptyFees)).not.toThrow();

            // Raw should always be an array
            expect(Array.isArray(emptyFees.raw)).toBe(true);
        });
    });

    describe('Metadata Validation', () => {
        test('Source URL should be valid HTTP/HTTPS', async () => {
            const scraper = new MilwaukeeScraper();

            try {
                const result = await scraper.scrape();

                expect(result.sourceUrl).toMatch(/^https?:\/\//);

                // Should be a valid URL
                const url = new URL(result.sourceUrl);
                expect(url.protocol).toMatch(/^https?:$/);

            } catch (error) {
                console.error('URL validation failed:', error.message);
                throw error;
            }
        }, 120000);

        test('Effective date should be parseable if present', async () => {
            const scraper = new MilwaukeeScraper();

            try {
                const result = await scraper.scrape();

                if (result.effectiveDate) {
                    // Should be a string
                    expect(typeof result.effectiveDate).toBe('string');

                    // Should contain date-like patterns
                    const hasDatePattern = /\d{4}|\d{1,2}\/\d{1,2}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(result.effectiveDate);
                    expect(hasDatePattern).toBe(true);
                }

            } catch (error) {
                console.error('Effective date validation failed:', error.message);
                throw error;
            }
        }, 120000);
    });
});

describe('Mock Database Operations', () => {

    beforeEach(() => {
        // Clear mock database before each test
        mockDatabase.cities.clear();
    });

    test('should store scraper result in mock database', () => {
        const mockResult = {
            jurisdiction: 'Milwaukee, WI',
            source: 'Test Source',
            sourceUrl: 'https://example.com/fees.pdf',
            scrapedAt: new Date().toISOString(),
            pdfHash: 'a'.repeat(64),
            pdfPath: '/path/to/pdf',
            electrical: {
                baseFee: 150,
                valuationRate: 0.016,
                minFee: 50,
                maxFee: null,
                raw: [150, 250, 350]
            }
        };

        // Store in mock database
        mockDatabase.cities.set('milwaukee', mockResult);

        // Retrieve and validate
        const stored = mockDatabase.cities.get('milwaukee');
        expect(stored).toEqual(mockResult);
        expect(stored.electrical.baseFee).toBe(150);
    });

    test('should detect fee schedule changes via PDF hash', () => {
        const originalResult = {
            jurisdiction: 'Milwaukee, WI',
            pdfHash: 'original_hash_12345',
            scrapedAt: '2025-01-01T00:00:00Z'
        };

        const updatedResult = {
            jurisdiction: 'Milwaukee, WI',
            pdfHash: 'updated_hash_67890',
            scrapedAt: '2025-01-15T00:00:00Z'
        };

        // Store original
        mockDatabase.cities.set('milwaukee', originalResult);

        // Check for changes
        const stored = mockDatabase.cities.get('milwaukee');
        const hasChanged = stored.pdfHash !== updatedResult.pdfHash;

        expect(hasChanged).toBe(true);

        // Update
        mockDatabase.cities.set('milwaukee', updatedResult);

        // Verify update
        const updated = mockDatabase.cities.get('milwaukee');
        expect(updated.pdfHash).toBe('updated_hash_67890');
    });
});
