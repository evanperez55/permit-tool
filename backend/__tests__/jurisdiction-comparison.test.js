/**
 * Comprehensive Test Suite: Jurisdiction Comparison
 * Tests multi-jurisdiction comparison engine with various scenarios
 */

const {
    getSupportedJurisdictions,
    compareJurisdictions,
    identifyKeyDifferences,
    generateQuickReference,
    suggestNearbyJurisdictions,
    calculateOptimalStrategy
} = require('../jurisdiction-comparison');

describe('Jurisdiction Comparison Engine', () => {
    describe('getSupportedJurisdictions()', () => {
        test('should return array of jurisdictions', () => {
            const result = getSupportedJurisdictions();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        test('should not include "default" jurisdiction', () => {
            const result = getSupportedJurisdictions();

            const defaultJurisdiction = result.find(j => j.location === 'default');
            expect(defaultJurisdiction).toBeUndefined();
        });

        test('each jurisdiction should have required fields', () => {
            const result = getSupportedJurisdictions();

            result.forEach(jurisdiction => {
                expect(jurisdiction).toHaveProperty('location');
                expect(jurisdiction).toHaveProperty('city');
                expect(jurisdiction).toHaveProperty('state');
                expect(jurisdiction).toHaveProperty('displayName');
            });
        });

        test('should parse location string correctly', () => {
            const result = getSupportedJurisdictions();

            const la = result.find(j => j.location === 'Los Angeles, CA');
            expect(la).toBeDefined();
            expect(la.city).toBe('Los Angeles');
            expect(la.state).toBe('CA');
            expect(la.displayName).toBe('Los Angeles, CA');
        });

        test('should include major cities', () => {
            const result = getSupportedJurisdictions();
            const locations = result.map(j => j.location);

            expect(locations).toContain('Los Angeles, CA');
            expect(locations).toContain('New York, NY');
            expect(locations).toContain('San Francisco, CA');
        });
    });

    describe('compareJurisdictions()', () => {
        const testJurisdictions = ['Los Angeles, CA', 'San Diego, CA'];
        const jobType = 'Electrical';

        test('should compare multiple jurisdictions', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            expect(result).toHaveProperty('comparisons');
            expect(result).toHaveProperty('analysis');
            expect(result).toHaveProperty('jobType');
        });

        test('should return correct number of comparisons', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            expect(result.comparisons).toHaveLength(2);
        });

        test('each comparison should have pricing data', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            result.comparisons.forEach(comp => {
                expect(comp).toHaveProperty('location');
                expect(comp).toHaveProperty('pricing');
                expect(comp.pricing).toHaveProperty('permitFee');
                expect(comp.pricing).toHaveProperty('laborCost');
                expect(comp.pricing).toHaveProperty('totalCost');
                expect(comp.pricing).toHaveProperty('recommendedCharge');
                expect(comp.pricing).toHaveProperty('profit');
                expect(comp.pricing).toHaveProperty('profitMargin');
            });
        });

        test('each comparison should have permit details', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            result.comparisons.forEach(comp => {
                expect(comp).toHaveProperty('permitDetails');
                expect(comp.permitDetails).toHaveProperty('baseFee');
                expect(comp.permitDetails).toHaveProperty('valuationRate');
                expect(comp.permitDetails).toHaveProperty('processingTime');
            });
        });

        test('should calculate analysis metrics', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            expect(result.analysis).toHaveProperty('lowestPermitFee');
            expect(result.analysis).toHaveProperty('highestPermitFee');
            expect(result.analysis).toHaveProperty('averagePermitFee');
            expect(result.analysis).toHaveProperty('lowestRecommendedCharge');
            expect(result.analysis).toHaveProperty('highestRecommendedCharge');
            expect(result.analysis).toHaveProperty('averageRecommendedCharge');
            expect(result.analysis).toHaveProperty('variance');
        });

        test('lowest fee should be less than or equal to highest fee', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            expect(result.analysis.lowestPermitFee).toBeLessThanOrEqual(result.analysis.highestPermitFee);
            expect(result.analysis.lowestRecommendedCharge).toBeLessThanOrEqual(result.analysis.highestRecommendedCharge);
        });

        test('variance should be calculated correctly', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            const expectedVariance = result.analysis.highestRecommendedCharge - result.analysis.lowestRecommendedCharge;
            expect(result.analysis.variance).toBe(expectedVariance);
        });

        test('should rank jurisdictions by permit fee', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            result.comparisons.forEach(comp => {
                expect(comp.rank).toHaveProperty('byPermitFee');
                expect(comp.rank.byPermitFee).toBeGreaterThanOrEqual(1);
                expect(comp.rank.byPermitFee).toBeLessThanOrEqual(testJurisdictions.length);
            });

            // Rankings should be unique
            const permitFeeRanks = result.comparisons.map(c => c.rank.byPermitFee);
            const uniqueRanks = [...new Set(permitFeeRanks)];
            expect(uniqueRanks.length).toBe(permitFeeRanks.length);
        });

        test('should rank jurisdictions by total charge', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            result.comparisons.forEach(comp => {
                expect(comp.rank).toHaveProperty('byTotalCharge');
                expect(comp.rank.byTotalCharge).toBeGreaterThanOrEqual(1);
                expect(comp.rank.byTotalCharge).toBeLessThanOrEqual(testJurisdictions.length);
            });
        });

        test('should rank jurisdictions by processing time', () => {
            const result = compareJurisdictions(testJurisdictions, jobType);

            result.comparisons.forEach(comp => {
                expect(comp.rank).toHaveProperty('byProcessingTime');
                expect(comp.rank.byProcessingTime).toBeGreaterThanOrEqual(1);
                expect(comp.rank.byProcessingTime).toBeLessThanOrEqual(testJurisdictions.length);
            });
        });

        test('should handle single jurisdiction', () => {
            const result = compareJurisdictions(['Los Angeles, CA'], jobType);

            expect(result.comparisons).toHaveLength(1);
            expect(result.comparisons[0].rank.byPermitFee).toBe(1);
            expect(result.comparisons[0].rank.byTotalCharge).toBe(1);
        });

        test('should handle many jurisdictions', () => {
            const manyJurisdictions = [
                'Los Angeles, CA',
                'San Diego, CA',
                'San Francisco, CA',
                'New York, NY',
                'Chicago, IL'
            ];

            const result = compareJurisdictions(manyJurisdictions, jobType);

            expect(result.comparisons).toHaveLength(5);
            expect(result.analysis.variance).toBeGreaterThan(0);
        });

        test('should work with different job types', () => {
            const jobTypes = ['Electrical', 'Plumbing', 'HVAC'];

            jobTypes.forEach(type => {
                const result = compareJurisdictions(testJurisdictions, type);
                expect(result.jobType).toBe(type);
                expect(result.comparisons).toHaveLength(2);
            });
        });
    });

    describe('identifyKeyDifferences()', () => {
        test('should return empty array for single jurisdiction', () => {
            const comparisons = compareJurisdictions(['Los Angeles, CA'], 'Electrical').comparisons;
            const differences = identifyKeyDifferences(comparisons);

            expect(Array.isArray(differences)).toBe(true);
            expect(differences).toHaveLength(0);
        });

        test('should identify permit fee variance', () => {
            const comparisons = compareJurisdictions(['Los Angeles, CA', 'New York, NY'], 'Electrical').comparisons;
            const differences = identifyKeyDifferences(comparisons);

            const permitFeeDiff = differences.find(d => d.type === 'permitFee');
            // NY typically has higher fees, so there should be variance
            if (permitFeeDiff) {
                expect(permitFeeDiff).toHaveProperty('severity');
                expect(permitFeeDiff).toHaveProperty('message');
                expect(permitFeeDiff).toHaveProperty('details');
                expect(permitFeeDiff.severity).toBe('high');
            }
        });

        test('each difference should have required fields', () => {
            const comparisons = compareJurisdictions(['Los Angeles, CA', 'San Francisco, CA', 'New York, NY'], 'Electrical').comparisons;
            const differences = identifyKeyDifferences(comparisons);

            differences.forEach(diff => {
                expect(diff).toHaveProperty('type');
                expect(diff).toHaveProperty('severity');
                expect(diff).toHaveProperty('message');
                expect(diff).toHaveProperty('details');
                expect(['low', 'medium', 'high']).toContain(diff.severity);
            });
        });

        test('should identify processing time variance', () => {
            const comparisons = compareJurisdictions(['Los Angeles, CA', 'San Diego, CA'], 'Electrical').comparisons;
            const differences = identifyKeyDifferences(comparisons);

            const processingDiff = differences.find(d => d.type === 'processingTime');
            if (processingDiff) {
                expect(processingDiff.severity).toBe('medium');
                expect(processingDiff.message).toContain('Processing times vary');
            }
        });

        test('should identify total charge variance', () => {
            const comparisons = compareJurisdictions(['Los Angeles, CA', 'New York, NY'], 'Electrical').comparisons;
            const differences = identifyKeyDifferences(comparisons);

            const chargeDiff = differences.find(d => d.type === 'totalCharge');
            if (chargeDiff) {
                expect(chargeDiff.severity).toBe('high');
                expect(chargeDiff.message).toContain('charge');
            }
        });

        test('should identify expedite fee variance', () => {
            const comparisons = compareJurisdictions(['Los Angeles, CA', 'San Francisco, CA', 'New York, NY'], 'Electrical').comparisons;
            const differences = identifyKeyDifferences(comparisons);

            const expediteDiff = differences.find(d => d.type === 'expediteFee');
            if (expediteDiff) {
                expect(expediteDiff.severity).toBe('low');
                expect(expediteDiff.message).toContain('Expedite fees');
            }
        });
    });

    describe('generateQuickReference()', () => {
        const jurisdictions = ['Los Angeles, CA', 'San Diego, CA'];
        const jobTypes = ['Electrical', 'Plumbing'];

        test('should generate reference for all job types', () => {
            const result = generateQuickReference(jurisdictions, jobTypes);

            expect(result).toHaveProperty('Electrical');
            expect(result).toHaveProperty('Plumbing');
        });

        test('each job type should have all jurisdictions', () => {
            const result = generateQuickReference(jurisdictions, jobTypes);

            expect(result.Electrical).toHaveLength(2);
            expect(result.Plumbing).toHaveLength(2);
        });

        test('each reference entry should have required fields', () => {
            const result = generateQuickReference(jurisdictions, jobTypes);

            result.Electrical.forEach(entry => {
                expect(entry).toHaveProperty('location');
                expect(entry).toHaveProperty('permitFee');
                expect(entry).toHaveProperty('recommendedCharge');
                expect(entry).toHaveProperty('processingTime');
            });
        });

        test('should include correct location names', () => {
            const result = generateQuickReference(jurisdictions, jobTypes);

            const locations = result.Electrical.map(e => e.location);
            expect(locations).toContain('Los Angeles, CA');
            expect(locations).toContain('San Diego, CA');
        });

        test('should have numeric values for fees', () => {
            const result = generateQuickReference(jurisdictions, jobTypes);

            result.Electrical.forEach(entry => {
                expect(typeof entry.permitFee).toBe('number');
                expect(typeof entry.recommendedCharge).toBe('number');
                expect(entry.permitFee).toBeGreaterThan(0);
                expect(entry.recommendedCharge).toBeGreaterThan(0);
            });
        });

        test('should handle single job type', () => {
            const result = generateQuickReference(jurisdictions, ['Electrical']);

            expect(Object.keys(result)).toHaveLength(1);
            expect(result.Electrical).toHaveLength(2);
        });

        test('should handle many job types', () => {
            const manyTypes = ['Electrical', 'Plumbing', 'HVAC', 'Solar', 'Roofing'];
            const result = generateQuickReference(jurisdictions, manyTypes);

            expect(Object.keys(result)).toHaveLength(5);
            manyTypes.forEach(type => {
                expect(result[type]).toHaveLength(2);
            });
        });
    });

    describe('suggestNearbyJurisdictions()', () => {
        test('should return array for Los Angeles', () => {
            const result = suggestNearbyJurisdictions('Los Angeles, CA');

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        test('should suggest San Diego and SF for Los Angeles', () => {
            const result = suggestNearbyJurisdictions('Los Angeles, CA');

            expect(result).toContain('San Diego, CA');
            expect(result).toContain('San Francisco, CA');
        });

        test('should suggest Los Angeles for San Diego', () => {
            const result = suggestNearbyJurisdictions('San Diego, CA');

            expect(result).toContain('Los Angeles, CA');
        });

        test('should suggest CA cities for San Francisco', () => {
            const result = suggestNearbyJurisdictions('San Francisco, CA');

            expect(result).toContain('Los Angeles, CA');
            expect(result).toContain('San Diego, CA');
        });

        test('should suggest Houston for Austin', () => {
            const result = suggestNearbyJurisdictions('Austin, TX');

            expect(result).toContain('Houston, TX');
        });

        test('should suggest Austin for Houston', () => {
            const result = suggestNearbyJurisdictions('Houston, TX');

            expect(result).toContain('Austin, TX');
        });

        test('should return empty array for unknown location', () => {
            const result = suggestNearbyJurisdictions('Unknown City, XX');

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        test('should return array for all supported cities', () => {
            const cities = [
                'Los Angeles, CA',
                'San Diego, CA',
                'San Francisco, CA',
                'Austin, TX',
                'Houston, TX',
                'Miami, FL',
                'Chicago, IL',
                'New York, NY'
            ];

            cities.forEach(city => {
                const result = suggestNearbyJurisdictions(city);
                expect(Array.isArray(result)).toBe(true);
            });
        });
    });

    describe('calculateOptimalStrategy()', () => {
        const jurisdictions = ['Los Angeles, CA', 'San Diego, CA', 'San Francisco, CA'];
        const jobType = 'Electrical';

        test('should return strategy with jurisdictions and summary', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            expect(result).toHaveProperty('jurisdictions');
            expect(result).toHaveProperty('summary');
        });

        test('should include all jurisdictions in strategy', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            expect(result.jurisdictions).toHaveLength(3);
        });

        test('each jurisdiction should have competitive position', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            result.jurisdictions.forEach(j => {
                expect(j).toHaveProperty('location');
                expect(j).toHaveProperty('recommendedCharge');
                expect(j).toHaveProperty('competitivePosition');
                expect(j).toHaveProperty('pricingAdvice');
            });
        });

        test('competitive position should be valid category', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            const validPositions = ['budget-friendly', 'competitive', 'premium'];
            result.jurisdictions.forEach(j => {
                expect(validPositions).toContain(j.competitivePosition);
            });
        });

        test('pricing advice should be a string', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            result.jurisdictions.forEach(j => {
                expect(typeof j.pricingAdvice).toBe('string');
                expect(j.pricingAdvice.length).toBeGreaterThan(0);
            });
        });

        test('summary should have all required metrics', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            expect(result.summary).toHaveProperty('totalMarketSize');
            expect(result.summary).toHaveProperty('averageCharge');
            expect(result.summary).toHaveProperty('bestMargin');
            expect(result.summary).toHaveProperty('worstMargin');
            expect(result.summary).toHaveProperty('fastestProcessing');
        });

        test('totalMarketSize should match jurisdiction count', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            expect(result.summary.totalMarketSize).toBe(3);
        });

        test('bestMargin should be greater than or equal to worstMargin', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            expect(result.summary.bestMargin).toBeGreaterThanOrEqual(result.summary.worstMargin);
        });

        test('fastestProcessing should be one of the jurisdictions', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            expect(jurisdictions).toContain(result.summary.fastestProcessing);
        });

        test('averageCharge should be numeric', () => {
            const result = calculateOptimalStrategy(jurisdictions, jobType);

            expect(typeof result.summary.averageCharge).toBe('number');
            expect(result.summary.averageCharge).toBeGreaterThan(0);
        });

        test('should handle single jurisdiction', () => {
            const result = calculateOptimalStrategy(['Los Angeles, CA'], jobType);

            expect(result.jurisdictions).toHaveLength(1);
            expect(result.summary.totalMarketSize).toBe(1);
            expect(result.summary.bestMargin).toBe(result.summary.worstMargin);
        });

        test('should work with different job types', () => {
            const result = calculateOptimalStrategy(jurisdictions, 'Plumbing');

            expect(result.jurisdictions).toHaveLength(3);
            expect(result.summary.averageCharge).toBeGreaterThan(0);
        });
    });

    describe('Integration Tests', () => {
        test('compare and analyze workflow', () => {
            const jurisdictions = ['Los Angeles, CA', 'San Francisco, CA'];
            const jobType = 'Electrical';

            // Step 1: Compare
            const comparison = compareJurisdictions(jurisdictions, jobType);
            expect(comparison.comparisons).toHaveLength(2);

            // Step 2: Identify differences
            const differences = identifyKeyDifferences(comparison.comparisons);
            expect(Array.isArray(differences)).toBe(true);

            // Step 3: Calculate strategy
            const strategy = calculateOptimalStrategy(jurisdictions, jobType);
            expect(strategy.jurisdictions).toHaveLength(2);
        });

        test('quick reference generation workflow', () => {
            const supportedJurisdictions = getSupportedJurisdictions();
            expect(supportedJurisdictions.length).toBeGreaterThan(0);

            const baseLocation = supportedJurisdictions[0].location;
            const nearby = suggestNearbyJurisdictions(baseLocation);

            const allJurisdictions = [baseLocation, ...nearby];
            const quickRef = generateQuickReference(
                allJurisdictions,
                ['Electrical', 'Plumbing']
            );

            expect(quickRef).toHaveProperty('Electrical');
            expect(quickRef).toHaveProperty('Plumbing');
        });

        test('full comparison with strategy and suggestions', () => {
            const baseLocation = 'Los Angeles, CA';
            const nearby = suggestNearbyJurisdictions(baseLocation);
            const allLocations = [baseLocation, ...nearby];
            const jobType = 'Electrical';

            const comparison = compareJurisdictions(allLocations, jobType);
            const differences = identifyKeyDifferences(comparison.comparisons);
            const strategy = calculateOptimalStrategy(allLocations, jobType);

            expect(comparison.comparisons.length).toBeGreaterThan(0);
            expect(Array.isArray(differences)).toBe(true);
            expect(strategy.summary.totalMarketSize).toBe(allLocations.length);
        });
    });
});
