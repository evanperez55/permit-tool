/**
 * API Integration Tests
 *
 * Tests all HTTP endpoints:
 * - GET /health
 * - POST /api/check-requirements
 * - GET /api/jurisdictions
 * - GET /api/verified-cities
 * - GET /api/jurisdictions/nearby/:location
 * - POST /api/compare-jurisdictions
 * - POST /api/jurisdiction-strategy
 * - POST /api/quick-reference
 *
 * Also tests end-to-end workflows combining multiple endpoints.
 */

const request = require('supertest');
const express = require('express');
const { calculateFullPricing, generateClientExplanation } = require('../pricing-calculator');
const { generateAllClientTemplates } = require('../client-templates');
const { generateRequirements } = require('../requirements-generator');
const {
    getSupportedJurisdictions,
    compareJurisdictions,
    identifyKeyDifferences,
    generateQuickReference,
    suggestNearbyJurisdictions,
    calculateOptimalStrategy
} = require('../jurisdiction-comparison');

// Create test app (mirrors server.js routes)
const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Permit Assistant API',
        timestamp: new Date().toISOString()
    });
});

// Check requirements (static - no OpenAI needed)
app.post('/api/check-requirements', async (req, res) => {
    try {
        const { jobType, city, state, projectType, scope, description } = req.body;
        if (!jobType || !city || !state) {
            return res.status(400).json({
                error: 'Missing required fields: jobType, city, and state are required'
            });
        }
        const requirements = generateRequirements({ jobType, city, state, projectType, scope, description });
        const location = `${city}, ${state}`;
        const pricingData = calculateFullPricing(location, jobType, 5000);
        const clientExplanation = generateClientExplanation(pricingData);
        const fullPricingData = {
            pricing: pricingData,
            metadata: { jobType, location, projectType, scope, timestamp: new Date().toISOString() }
        };
        const clientTemplates = generateAllClientTemplates(fullPricingData);
        res.json({
            success: true,
            requirements,
            pricing: pricingData,
            clientExplanation,
            clientTemplates,
            metadata: { jobType, location, projectType, scope, timestamp: new Date().toISOString() }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze permit requirements', message: error.message });
    }
});

// Get all supported jurisdictions
app.get('/api/jurisdictions', (req, res) => {
    try {
        const jurisdictions = getSupportedJurisdictions();
        res.json({
            success: true,
            jurisdictions,
            count: jurisdictions.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve jurisdictions', message: error.message });
    }
});

// Get verified cities
app.get('/api/verified-cities', (req, res) => {
    try {
        const { dataQuality } = require('../database-loader');

        const verifiedCities = Object.entries(dataQuality)
            .filter(([city, quality]) => quality.quality === 'verified')
            .map(([city, quality]) => ({
                name: city,
                source: quality.source,
                lastVerified: quality.lastVerified,
                url: quality.url
            }));

        res.json({
            success: true,
            cities: verifiedCities,
            count: verifiedCities.length,
            message: `We currently have verified permit data for ${verifiedCities.length} major US cities.`
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve verified cities', message: error.message });
    }
});

// Get nearby jurisdiction suggestions
app.get('/api/jurisdictions/nearby/:location', (req, res) => {
    try {
        const location = decodeURIComponent(req.params.location);
        const nearby = suggestNearbyJurisdictions(location);
        res.json({
            success: true,
            baseLocation: location,
            nearbyJurisdictions: nearby,
            count: nearby.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get nearby jurisdictions', message: error.message });
    }
});

// Compare multiple jurisdictions
app.post('/api/compare-jurisdictions', (req, res) => {
    try {
        const { jurisdictions, jobType } = req.body;
        if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid jurisdictions array' });
        }
        if (!jobType) {
            return res.status(400).json({ error: 'Missing required field: jobType' });
        }
        const comparison = compareJurisdictions(jurisdictions, jobType);
        const differences = identifyKeyDifferences(comparison.comparisons);
        res.json({
            success: true,
            comparison,
            differences,
            metadata: {
                jobType,
                jurisdictionCount: jurisdictions.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to compare jurisdictions', message: error.message });
    }
});

// Calculate optimal pricing strategy
app.post('/api/jurisdiction-strategy', (req, res) => {
    try {
        const { jurisdictions, jobType } = req.body;
        if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid jurisdictions array' });
        }
        if (!jobType) {
            return res.status(400).json({ error: 'Missing required field: jobType' });
        }
        const strategy = calculateOptimalStrategy(jurisdictions, jobType);
        res.json({
            success: true,
            strategy,
            metadata: {
                jobType,
                jurisdictionCount: jurisdictions.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate strategy', message: error.message });
    }
});

// Generate quick reference guide
app.post('/api/quick-reference', (req, res) => {
    try {
        const { jurisdictions, jobTypes } = req.body;
        if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid jurisdictions array' });
        }
        if (!jobTypes || !Array.isArray(jobTypes) || jobTypes.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid jobTypes array' });
        }
        const quickReference = generateQuickReference(jurisdictions, jobTypes);
        res.json({
            success: true,
            quickReference,
            metadata: {
                jurisdictionCount: jurisdictions.length,
                jobTypeCount: jobTypes.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate quick reference', message: error.message });
    }
});

// ============================================================
// TESTS
// ============================================================

describe('GET /health', () => {
    test('returns status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('Permit Assistant API');
        expect(res.body.timestamp).toBeDefined();
    });
});

describe('POST /api/check-requirements', () => {
    test('returns requirements for a valid request', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ jobType: 'Electrical', city: 'Los Angeles', state: 'CA' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(typeof res.body.requirements).toBe('string');
        expect(res.body.requirements.length).toBeGreaterThan(200);
    });

    test('returns markdown with expected sections', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ jobType: 'Electrical', city: 'Los Angeles', state: 'CA' });
        const md = res.body.requirements;
        expect(md).toContain('## Required Permits');
        expect(md).toContain('## Forms & Documents');
        expect(md).toContain('## Step-by-Step Process');
        expect(md).toContain('## Required Inspections');
        expect(md).toContain('## Timeline');
        expect(md).toContain('## Estimated Costs');
        expect(md).toContain('## Common Rejection Reasons');
        expect(md).toContain('## Important Notes');
        expect(md).toContain('## Disclaimer');
    });

    test('includes pricing and templates in response', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ jobType: 'Plumbing', city: 'Houston', state: 'TX' });
        expect(res.body.pricing).toBeDefined();
        expect(res.body.pricing.summary.recommendedCharge).toBeGreaterThan(0);
        expect(res.body.clientExplanation).toBeDefined();
        expect(res.body.clientTemplates).toBeDefined();
        expect(Object.keys(res.body.clientTemplates).length).toBe(5);
        expect(res.body.metadata).toBeDefined();
        expect(res.body.metadata.location).toBe('Houston, TX');
    });

    test('returns 400 when jobType is missing', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ city: 'Los Angeles', state: 'CA' });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Missing required fields');
    });

    test('returns 400 when city is missing', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ jobType: 'Electrical', state: 'CA' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when state is missing', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ jobType: 'Electrical', city: 'Los Angeles' });
        expect(res.status).toBe(400);
    });

    test('works with all major job types', async () => {
        const jobTypes = ['Electrical Work', 'Plumbing', 'HVAC', 'General Construction', 'Solar Installation'];
        for (const jobType of jobTypes) {
            const res = await request(app)
                .post('/api/check-requirements')
                .send({ jobType, city: 'Austin', state: 'TX' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.requirements).toContain('## Required Permits');
        }
    });

    test('includes form links for cities with paperwork data', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ jobType: 'Electrical', city: 'Los Angeles', state: 'CA' });
        expect(res.body.requirements).toContain('Download');
        expect(res.body.requirements).toContain('PC-ELEC-APP-02');
    });

    test('works for cities without specific data (falls back to regional)', async () => {
        const res = await request(app)
            .post('/api/check-requirements')
            .send({ jobType: 'Electrical', city: 'Portland', state: 'OR' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.requirements).toContain('## Required Permits');
    });
});

describe('GET /api/jurisdictions', () => {
    test('returns list of jurisdictions', async () => {
        const res = await request(app).get('/api/jurisdictions');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.jurisdictions)).toBe(true);
        expect(res.body.count).toBe(res.body.jurisdictions.length);
        expect(res.body.count).toBeGreaterThanOrEqual(10); // 10 cities + regional defaults
    });

    test('includes all major cities', async () => {
        const res = await request(app).get('/api/jurisdictions');
        const locations = res.body.jurisdictions.map(j => j.location);
        expect(locations).toContain('Los Angeles, CA');
        expect(locations).toContain('New York, NY');
        expect(locations).toContain('Chicago, IL');
        expect(locations).toContain('Houston, TX');
    });

    test('each jurisdiction has required fields', async () => {
        const res = await request(app).get('/api/jurisdictions');
        for (const j of res.body.jurisdictions) {
            expect(j.location).toBeDefined();
            expect(j.displayName).toBeDefined();
        }
    });

    test('excludes bare "default" from jurisdictions', async () => {
        const res = await request(app).get('/api/jurisdictions');
        const locations = res.body.jurisdictions.map(j => j.location);
        expect(locations).not.toContain('default');
    });
});

describe('GET /api/verified-cities', () => {
    test('returns verified cities', async () => {
        const res = await request(app).get('/api/verified-cities');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.cities)).toBe(true);
        expect(res.body.count).toBeGreaterThanOrEqual(5); // Most cities are verified
    });

    test('each verified city has source info', async () => {
        const res = await request(app).get('/api/verified-cities');
        for (const city of res.body.cities) {
            expect(city.name).toBeDefined();
            expect(city.source).toBeDefined();
            expect(city.lastVerified).toBeDefined();
        }
    });

    test('does not include estimated regional defaults', async () => {
        const res = await request(app).get('/api/verified-cities');
        const names = res.body.cities.map(c => c.name);
        expect(names).not.toContain('default');
        expect(names).not.toContain('default-midwest');
        expect(names).not.toContain('default-texas');
    });
});

describe('GET /api/jurisdictions/nearby/:location', () => {
    test('returns nearby cities for Los Angeles', async () => {
        const res = await request(app).get('/api/jurisdictions/nearby/' + encodeURIComponent('Los Angeles, CA'));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.baseLocation).toBe('Los Angeles, CA');
        expect(Array.isArray(res.body.nearbyJurisdictions)).toBe(true);
        expect(res.body.nearbyJurisdictions.length).toBeGreaterThan(0);
    });

    test('returns nearby cities for Houston', async () => {
        const res = await request(app).get('/api/jurisdictions/nearby/' + encodeURIComponent('Houston, TX'));
        expect(res.status).toBe(200);
        expect(res.body.nearbyJurisdictions.length).toBeGreaterThan(0);
    });

    test('returns empty array for unknown location', async () => {
        const res = await request(app).get('/api/jurisdictions/nearby/' + encodeURIComponent('Unknown, XX'));
        expect(res.status).toBe(200);
        expect(res.body.nearbyJurisdictions).toEqual([]);
        expect(res.body.count).toBe(0);
    });
});

describe('POST /api/compare-jurisdictions', () => {
    test('compares two jurisdictions successfully', async () => {
        const res = await request(app)
            .post('/api/compare-jurisdictions')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Houston, TX'],
                jobType: 'Electrical'
            });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.comparison).toBeDefined();
        expect(res.body.comparison.comparisons).toBeDefined();
        expect(res.body.comparison.comparisons.length).toBe(2);
        expect(res.body.differences).toBeDefined();
        expect(res.body.metadata.jobType).toBe('Electrical');
    });

    test('compares 5 jurisdictions successfully', async () => {
        const res = await request(app)
            .post('/api/compare-jurisdictions')
            .send({
                jurisdictions: [
                    'Los Angeles, CA', 'Houston, TX', 'Chicago, IL',
                    'Miami, FL', 'New York, NY'
                ],
                jobType: 'Plumbing'
            });
        expect(res.status).toBe(200);
        expect(res.body.comparison.comparisons.length).toBe(5);
    });

    test('returns analysis metrics', async () => {
        const res = await request(app)
            .post('/api/compare-jurisdictions')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Houston, TX'],
                jobType: 'Electrical'
            });
        const analysis = res.body.comparison.analysis;
        expect(analysis).toBeDefined();
        expect(typeof analysis.lowestPermitFee).toBe('number');
        expect(typeof analysis.highestPermitFee).toBe('number');
        expect(analysis.lowestPermitFee).toBeLessThanOrEqual(analysis.highestPermitFee);
    });

    test('returns 400 when jurisdictions missing', async () => {
        const res = await request(app)
            .post('/api/compare-jurisdictions')
            .send({ jobType: 'Electrical' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when jobType missing', async () => {
        const res = await request(app)
            .post('/api/compare-jurisdictions')
            .send({ jurisdictions: ['Los Angeles, CA', 'Houston, TX'] });
        expect(res.status).toBe(400);
    });

    test('returns 400 for empty jurisdictions array', async () => {
        const res = await request(app)
            .post('/api/compare-jurisdictions')
            .send({ jurisdictions: [], jobType: 'Electrical' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/jurisdiction-strategy', () => {
    test('calculates strategy for multiple jurisdictions', async () => {
        const res = await request(app)
            .post('/api/jurisdiction-strategy')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Houston, TX', 'Miami, FL'],
                jobType: 'Electrical'
            });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.strategy).toBeDefined();
        expect(res.body.strategy.jurisdictions).toBeDefined();
        expect(res.body.strategy.jurisdictions.length).toBe(3);
        expect(res.body.strategy.summary).toBeDefined();
    });

    test('each jurisdiction has competitive position', async () => {
        const res = await request(app)
            .post('/api/jurisdiction-strategy')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Houston, TX'],
                jobType: 'HVAC'
            });
        for (const j of res.body.strategy.jurisdictions) {
            expect(j.competitivePosition).toBeDefined();
            expect(['budget-friendly', 'competitive', 'premium']).toContain(j.competitivePosition);
            expect(j.pricingAdvice).toBeDefined();
        }
    });

    test('summary has required metrics', async () => {
        const res = await request(app)
            .post('/api/jurisdiction-strategy')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Houston, TX'],
                jobType: 'Electrical'
            });
        const summary = res.body.strategy.summary;
        expect(typeof summary.averageCharge).toBe('number');
        expect(typeof summary.bestMargin).toBe('number');
        expect(typeof summary.worstMargin).toBe('number');
        expect(summary.bestMargin).toBeGreaterThanOrEqual(summary.worstMargin);
    });

    test('returns 400 when jurisdictions missing', async () => {
        const res = await request(app)
            .post('/api/jurisdiction-strategy')
            .send({ jobType: 'Electrical' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when jobType missing', async () => {
        const res = await request(app)
            .post('/api/jurisdiction-strategy')
            .send({ jurisdictions: ['Los Angeles, CA'] });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/quick-reference', () => {
    test('generates quick reference for multiple cities and job types', async () => {
        const res = await request(app)
            .post('/api/quick-reference')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Houston, TX'],
                jobTypes: ['Electrical', 'Plumbing']
            });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.quickReference).toBeDefined();
        expect(res.body.metadata.jurisdictionCount).toBe(2);
        expect(res.body.metadata.jobTypeCount).toBe(2);
    });

    test('quick reference has entries for each job type', async () => {
        const res = await request(app)
            .post('/api/quick-reference')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Miami, FL'],
                jobTypes: ['Electrical', 'HVAC', 'Solar']
            });
        const qr = res.body.quickReference;
        expect(Object.keys(qr).length).toBe(3);
        expect(qr['Electrical']).toBeDefined();
        expect(qr['HVAC']).toBeDefined();
        expect(qr['Solar']).toBeDefined();
    });

    test('returns 400 when jurisdictions missing', async () => {
        const res = await request(app)
            .post('/api/quick-reference')
            .send({ jobTypes: ['Electrical'] });
        expect(res.status).toBe(400);
    });

    test('returns 400 when jobTypes missing', async () => {
        const res = await request(app)
            .post('/api/quick-reference')
            .send({ jurisdictions: ['Los Angeles, CA'] });
        expect(res.status).toBe(400);
    });

    test('returns 400 for empty arrays', async () => {
        const res1 = await request(app)
            .post('/api/quick-reference')
            .send({ jurisdictions: [], jobTypes: ['Electrical'] });
        expect(res1.status).toBe(400);

        const res2 = await request(app)
            .post('/api/quick-reference')
            .send({ jurisdictions: ['Los Angeles, CA'], jobTypes: [] });
        expect(res2.status).toBe(400);
    });
});

// ============================================================
// END-TO-END WORKFLOW TESTS
// ============================================================

describe('End-to-End Workflows', () => {
    test('contractor workflow: get jurisdictions → compare → get strategy', async () => {
        // Step 1: Get jurisdictions
        const jurisdictionsRes = await request(app).get('/api/jurisdictions');
        expect(jurisdictionsRes.status).toBe(200);
        const cities = jurisdictionsRes.body.jurisdictions
            .filter(j => !j.location.startsWith('default'))
            .slice(0, 3)
            .map(j => j.location);
        expect(cities.length).toBe(3);

        // Step 2: Compare selected jurisdictions
        const compareRes = await request(app)
            .post('/api/compare-jurisdictions')
            .send({ jurisdictions: cities, jobType: 'Electrical' });
        expect(compareRes.status).toBe(200);
        expect(compareRes.body.comparison.comparisons.length).toBe(3);

        // Step 3: Get strategy for same jurisdictions
        const strategyRes = await request(app)
            .post('/api/jurisdiction-strategy')
            .send({ jurisdictions: cities, jobType: 'Electrical' });
        expect(strategyRes.status).toBe(200);
        expect(strategyRes.body.strategy.jurisdictions.length).toBe(3);
    });

    test('nearby exploration: find nearby → compare with nearby', async () => {
        // Step 1: Find cities near LA
        const nearbyRes = await request(app)
            .get('/api/jurisdictions/nearby/' + encodeURIComponent('Los Angeles, CA'));
        expect(nearbyRes.status).toBe(200);
        const nearbyCities = nearbyRes.body.nearbyJurisdictions;
        expect(nearbyCities.length).toBeGreaterThan(0);

        // Step 2: Compare LA with its nearby cities
        const allCities = ['Los Angeles, CA', ...nearbyCities.slice(0, 2)];
        const compareRes = await request(app)
            .post('/api/compare-jurisdictions')
            .send({ jurisdictions: allCities, jobType: 'Plumbing' });
        expect(compareRes.status).toBe(200);
        expect(compareRes.body.comparison.comparisons.length).toBe(allCities.length);
    });

    test('multi-trade analysis: quick reference for all trades', async () => {
        const res = await request(app)
            .post('/api/quick-reference')
            .send({
                jurisdictions: ['Los Angeles, CA', 'Houston, TX', 'New York, NY'],
                jobTypes: ['Electrical', 'Plumbing', 'HVAC', 'Solar', 'General Construction']
            });
        expect(res.status).toBe(200);
        const qr = res.body.quickReference;
        expect(Object.keys(qr).length).toBe(5);

        // Each job type should have data for all 3 cities
        for (const jobType of Object.keys(qr)) {
            expect(qr[jobType].length).toBe(3);
            for (const entry of qr[jobType]) {
                expect(entry.location).toBeDefined();
                expect(typeof entry.permitFee).toBe('number');
            }
        }
    });

    test('verified cities are all in jurisdictions list', async () => {
        const [jurisdictionsRes, verifiedRes] = await Promise.all([
            request(app).get('/api/jurisdictions'),
            request(app).get('/api/verified-cities')
        ]);
        expect(jurisdictionsRes.status).toBe(200);
        expect(verifiedRes.status).toBe(200);

        const allLocations = jurisdictionsRes.body.jurisdictions.map(j => j.location);
        for (const city of verifiedRes.body.cities) {
            expect(allLocations).toContain(city.name);
        }
    });
});

// ============================================================
// PRICING + TEMPLATES INTEGRATION
// ============================================================

describe('Pricing + Templates Integration (no API key needed)', () => {
    test('calculateFullPricing feeds correctly into generateAllClientTemplates', () => {
        const pricingData = calculateFullPricing('Los Angeles, CA', 'Electrical', 5000);
        const fullPricingData = {
            pricing: pricingData,
            metadata: {
                jobType: 'Electrical',
                location: 'Los Angeles, CA',
                projectType: 'Residential',
                scope: 'New installation',
                timestamp: new Date().toISOString()
            }
        };
        const templates = generateAllClientTemplates(fullPricingData);

        // All 5 templates should be generated
        expect(templates.professionalQuote).toBeDefined();
        expect(templates.permitValue).toBeDefined();
        expect(templates.permitExplainer).toBeDefined();
        expect(templates.comparisonSheet).toBeDefined();
        expect(templates.paymentOptions).toBeDefined();

        // Each template should have content
        for (const key of Object.keys(templates)) {
            const template = templates[key];
            expect(template.body || template.content).toBeDefined();
            expect((template.body || template.content).length).toBeGreaterThan(100);
        }
    });

    test.each([
        'Los Angeles, CA', 'Houston, TX', 'New York, NY',
        'Austin, TX', 'Miami, FL', 'San Francisco, CA'
    ])('%s - pricing + templates pipeline works end-to-end', (city) => {
        const pricing = calculateFullPricing(city, 'Electrical', 5000);
        const explanation = generateClientExplanation(pricing);
        const templates = generateAllClientTemplates({ pricing, metadata: { jobType: 'Electrical', location: city } });

        // Pricing is valid
        expect(pricing.summary.recommendedCharge).toBeGreaterThan(0);

        // Explanation has 6 line items
        expect(explanation.breakdown.length).toBe(6);

        // Templates generated
        expect(Object.keys(templates).length).toBe(5);
    });
});
