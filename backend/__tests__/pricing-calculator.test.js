/**
 * Comprehensive Test Suite: Pricing Calculator
 * Tests all pricing calculation functions with edge cases
 */

const { calculateFullPricing, generateClientExplanation, normalizeJobType } = require('../pricing-calculator');

describe('Pricing Calculator', () => {
    describe('normalizeJobType()', () => {
        test('should normalize "Electrical Work" to "Electrical"', () => {
            expect(normalizeJobType('Electrical Work')).toBe('Electrical');
        });

        test('should normalize "Remodeling/Renovation" to "Remodeling"', () => {
            expect(normalizeJobType('Remodeling/Renovation')).toBe('Remodeling');
        });

        test('should handle unknown job types', () => {
            expect(normalizeJobType('Unknown Job')).toBe('General Construction');
        });
    });

    describe('calculateFullPricing()', () => {
        test('should calculate pricing for Los Angeles electrical work', () => {
            const result = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);

            expect(result).toHaveProperty('permitFee');
            expect(result).toHaveProperty('labor');
            expect(result).toHaveProperty('clientCharge');
            expect(result).toHaveProperty('summary');

            expect(result.permitFee.permitFee).toBeGreaterThan(0);
            expect(result.labor.laborCost).toBeGreaterThan(0);
            expect(result.summary.recommendedCharge).toBeGreaterThan(0);
        });

        test('should calculate higher fees for New York at higher project values', () => {
            // NY uses a 2.49% valuation rate (no base fee), so it exceeds LA at higher values
            const la = calculateFullPricing('Los Angeles, CA', 'Electrical', 25000);
            const ny = calculateFullPricing('New York, NY', 'Electrical', 25000);

            expect(ny.permitFee.permitFee).toBeGreaterThan(la.permitFee.permitFee);
        });

        test('should calculate different fees for different trades', () => {
            const electrical = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);
            const hvac = calculateFullPricing('Los Angeles, CA', 'HVAC', 5000);

            expect(electrical.permitFee.permitFee).not.toBe(hvac.permitFee.permitFee);
        });

        test('should include processing time information', () => {
            const result = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);

            expect(result.summary.processingTime).toBeDefined();
            expect(typeof result.summary.processingTime).toBe('string');
        });

        test('should calculate profit margin correctly', () => {
            const result = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);

            expect(result.summary.profitMargin).toBeGreaterThan(0);
            expect(result.summary.profitMargin).toBeLessThan(100);
        });

        test('should respect minimum charges', () => {
            const fence = calculateFullPricing('Los Angeles, CA', 'Fence', 1000);

            expect(fence.summary.recommendedCharge).toBeGreaterThanOrEqual(200);
        });

        test('should include labor breakdown', () => {
            const result = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);

            expect(result.labor.breakdown).toHaveProperty('documentPrep');
            expect(result.labor.breakdown).toHaveProperty('planDrawing');
            expect(result.labor.breakdown).toHaveProperty('submission');
            expect(result.labor.breakdown).toHaveProperty('inspection');
            expect(result.labor.breakdown).toHaveProperty('corrections');
        });

        test('should use default jurisdiction for unknown locations', () => {
            const result = calculateFullPricing('Unknown City, XX', 'Electrical', 5000);

            expect(result.permitFee.permitFee).toBeGreaterThan(0);
        });

        test('should calculate competitive intelligence', () => {
            const result = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);

            expect(result.competitive).toHaveProperty('unlicensedContractorPrice');
            expect(result.competitive).toHaveProperty('expediterServicePrice');
            expect(result.competitive.unlicensedContractorPrice).toBeLessThan(result.summary.recommendedCharge);
            expect(result.competitive.expediterServicePrice).toBeGreaterThan(result.summary.recommendedCharge);
        });
    });

    describe('generateClientExplanation()', () => {
        test('should generate breakdown with all required fields', () => {
            const pricing = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);
            const explanation = generateClientExplanation(pricing);

            expect(explanation).toHaveProperty('breakdown');
            expect(explanation).toHaveProperty('total');
            expect(explanation).toHaveProperty('timeline');
            expect(explanation).toHaveProperty('valueProposition');
        });

        test('should include 6 line items in breakdown', () => {
            const pricing = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);
            const explanation = generateClientExplanation(pricing);

            expect(explanation.breakdown).toHaveLength(6);
        });

        test('should sum breakdown to total (within rounding tolerance)', () => {
            const pricing = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);
            const explanation = generateClientExplanation(pricing);

            const sum = explanation.breakdown.reduce((total, item) => total + item.cost, 0);
            // Allow $2 tolerance for rounding differences
            expect(Math.abs(sum - explanation.total)).toBeLessThanOrEqual(2);
        });

        test('should include value propositions', () => {
            const pricing = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);
            const explanation = generateClientExplanation(pricing);

            expect(explanation.valueProposition).toHaveLength(5);
            expect(explanation.valueProposition[0]).toContain('Licensed and insured');
        });
    });

    describe('Edge Cases', () => {
        test('should handle very high project values', () => {
            const result = calculateFullPricing('Los Angeles, CA', 'Electrical', 50000);

            expect(result.permitFee.permitFee).toBeLessThanOrEqual(result.permitFee.maxFee);
        });

        test('should handle very low project values', () => {
            const result = calculateFullPricing('Los Angeles, CA', 'Electrical', 100);

            expect(result.permitFee.permitFee).toBeGreaterThanOrEqual(result.permitFee.minFee);
        });

        test('should handle all supported job types', () => {
            const jobTypes = ['Electrical', 'Plumbing', 'HVAC', 'General Construction',
                            'Remodeling', 'Solar', 'Roofing', 'Pool', 'Fence', 'Demolition'];

            jobTypes.forEach(jobType => {
                const result = calculateFullPricing('Los Angeles, CA', jobType, 5000);
                expect(result.summary.recommendedCharge).toBeGreaterThan(0);
            });
        });
    });
});
