/**
 * E2E Tests for Paperwork & Admin Endpoints
 *
 * Tests all paperwork-related and admin HTTP endpoints:
 * - POST /api/required-paperwork
 * - POST /api/complete-paperwork-package
 * - GET /api/paperwork-jurisdictions
 * - GET /api/search-forms/:keyword
 * - POST /api/report-broken-link
 * - GET /api/admin/paperwork-stats
 * - GET /api/admin/paperwork-summary
 * - GET /api/admin/scraper-health
 * - GET /api-docs (Swagger)
 */

const request = require('supertest');
const express = require('express');
const permitPaperwork = require('../permit-paperwork');
const scraperHealth = require('../scraper-health');

// Create test app (mirrors server.js paperwork/admin routes)
const app = express();
app.use(express.json());

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Paperwork endpoints
app.post('/api/required-paperwork', (req, res) => {
    try {
        const { jurisdiction, jobType } = req.body;
        if (!jurisdiction || !jobType) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Both jurisdiction and jobType are required',
                required: ['jurisdiction', 'jobType']
            });
        }
        const paperwork = permitPaperwork.getRequiredPaperwork(jurisdiction, jobType);
        res.json(paperwork);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve required paperwork', message: error.message });
    }
});

app.post('/api/complete-paperwork-package', (req, res) => {
    try {
        const { jurisdiction, jobType } = req.body;
        if (!jurisdiction || !jobType) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Both jurisdiction and jobType are required'
            });
        }
        const pkg = permitPaperwork.getCompletePaperworkPackage(jurisdiction, jobType);
        res.json(pkg);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve complete paperwork package', message: error.message });
    }
});

app.get('/api/paperwork-jurisdictions', (req, res) => {
    try {
        const jurisdictions = permitPaperwork.getAvailableJurisdictions();
        res.json({ success: true, count: jurisdictions.length, jurisdictions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve jurisdictions', message: error.message });
    }
});

app.get('/api/search-forms/:keyword', (req, res) => {
    try {
        const { keyword } = req.params;
        if (!keyword || keyword.length < 2) {
            return res.status(400).json({ error: 'Invalid search term', message: 'Search keyword must be at least 2 characters' });
        }
        const results = permitPaperwork.searchForms(decodeURIComponent(keyword));
        res.json({ keyword: decodeURIComponent(keyword), totalResults: results.length, results });
    } catch (error) {
        res.status(500).json({ error: 'Failed to search forms', message: error.message });
    }
});

app.post('/api/report-broken-link', (req, res) => {
    try {
        const { jurisdiction, jobType, formCode, formName, userEmail, issue, comments } = req.body;
        if (!jurisdiction || !formCode || !issue) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'jurisdiction, formCode, and issue are required',
                required: ['jurisdiction', 'formCode', 'issue']
            });
        }
        const validIssues = ['broken_link', 'outdated', 'wrong_form', 'other'];
        if (!validIssues.includes(issue)) {
            return res.status(400).json({ error: 'Invalid issue type', validIssues });
        }
        const report = permitPaperwork.reportBrokenLink({ jurisdiction, jobType, formCode, formName, userEmail, issue, comments });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Failed to report broken link', message: error.message });
    }
});

app.get('/api/admin/paperwork-stats', (req, res) => {
    try {
        const stats = permitPaperwork.getDatabaseStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve statistics', message: error.message });
    }
});

app.get('/api/admin/paperwork-summary', (req, res) => {
    try {
        const summary = permitPaperwork.getAdminSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve admin summary', message: error.message });
    }
});

app.get('/api/admin/scraper-health', (req, res) => {
    try {
        const health = scraperHealth.getScraperHealth();
        res.json({ success: true, ...health });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get scraper health', message: error.message });
    }
});

// ============================================================
// TESTS
// ============================================================

describe('POST /api/required-paperwork', () => {
    test('returns paperwork for Los Angeles Electrical', async () => {
        const res = await request(app)
            .post('/api/required-paperwork')
            .send({ jurisdiction: 'Los Angeles, CA', jobType: 'Electrical' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.jurisdiction).toBe('Los Angeles, CA');
        expect(Array.isArray(res.body.applications)).toBe(true);
        expect(res.body.totalForms).toBeGreaterThan(0);
    });

    test('each form has required fields', async () => {
        const res = await request(app)
            .post('/api/required-paperwork')
            .send({ jurisdiction: 'Los Angeles, CA', jobType: 'Electrical' });
        const allForms = [...res.body.applications, ...res.body.supporting, ...res.body.feeSchedules];
        for (const form of allForms) {
            expect(form.formName).toBeDefined();
            expect(form.formType).toBeDefined();
            expect(form.url).toBeDefined();
        }
    });

    test('returns 400 when jurisdiction missing', async () => {
        const res = await request(app)
            .post('/api/required-paperwork')
            .send({ jobType: 'Electrical' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when jobType missing', async () => {
        const res = await request(app)
            .post('/api/required-paperwork')
            .send({ jurisdiction: 'Los Angeles, CA' });
        expect(res.status).toBe(400);
    });

    test('returns success false for unsupported jurisdiction', async () => {
        const res = await request(app)
            .post('/api/required-paperwork')
            .send({ jurisdiction: 'Unknown, XX', jobType: 'Electrical' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });
});

describe('POST /api/complete-paperwork-package', () => {
    test('returns complete package for Los Angeles Electrical', async () => {
        const res = await request(app)
            .post('/api/complete-paperwork-package')
            .send({ jurisdiction: 'Los Angeles, CA', jobType: 'Electrical' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.jurisdiction).toBe('Los Angeles, CA');
        expect(Array.isArray(res.body.applications)).toBe(true);
        expect(Array.isArray(res.body.supporting)).toBe(true);
        expect(Array.isArray(res.body.feeSchedules)).toBe(true);
        expect(Array.isArray(res.body.tips)).toBe(true);
        expect(res.body.estimatedPrepTime).toBeDefined();
        expect(typeof res.body.totalForms).toBe('number');
    });

    test('returns tips with city-specific advice', async () => {
        const res = await request(app)
            .post('/api/complete-paperwork-package')
            .send({ jurisdiction: 'Denver, CO', jobType: 'Electrical' });
        expect(res.status).toBe(200);
        expect(res.body.tips.some(t => t.includes('Denver') || t.includes('ePermit'))).toBe(true);
    });

    test('returns tips for Seattle', async () => {
        const res = await request(app)
            .post('/api/complete-paperwork-package')
            .send({ jurisdiction: 'Seattle, WA', jobType: 'Plumbing' });
        expect(res.status).toBe(200);
        expect(res.body.tips.some(t => t.includes('Seattle') || t.includes('SDCI') || t.includes('Public Health'))).toBe(true);
    });

    test('works for all 12 paperwork jurisdictions', async () => {
        const jurisdictions = [
            'Los Angeles, CA', 'San Diego, CA', 'San Francisco, CA',
            'Austin, TX', 'Houston, TX', 'Miami, FL', 'Chicago, IL',
            'New York, NY', 'Milwaukee, WI', 'Phoenix, AZ',
            'Denver, CO', 'Seattle, WA'
        ];
        for (const jurisdiction of jurisdictions) {
            const res = await request(app)
                .post('/api/complete-paperwork-package')
                .send({ jurisdiction, jobType: 'Electrical' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.totalForms).toBeGreaterThan(0);
        }
    });

    test('returns 400 when jurisdiction missing', async () => {
        const res = await request(app)
            .post('/api/complete-paperwork-package')
            .send({ jobType: 'Electrical' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/paperwork-jurisdictions', () => {
    test('returns all available jurisdictions', async () => {
        const res = await request(app).get('/api/paperwork-jurisdictions');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBeGreaterThanOrEqual(12);
        expect(Array.isArray(res.body.jurisdictions)).toBe(true);
    });

    test('includes all expected cities', async () => {
        const res = await request(app).get('/api/paperwork-jurisdictions');
        const names = res.body.jurisdictions.map(j => j.jurisdiction || j);
        expect(names).toContain('Los Angeles, CA');
        expect(names).toContain('Denver, CO');
        expect(names).toContain('Seattle, WA');
    });
});

describe('GET /api/search-forms/:keyword', () => {
    test('finds forms by keyword', async () => {
        const res = await request(app).get('/api/search-forms/electrical');
        expect(res.status).toBe(200);
        expect(res.body.keyword).toBe('electrical');
        expect(res.body.totalResults).toBeGreaterThan(0);
        expect(Array.isArray(res.body.results)).toBe(true);
    });

    test('returns 400 for single-character keyword', async () => {
        const res = await request(app).get('/api/search-forms/a');
        expect(res.status).toBe(400);
    });

    test('returns empty results for nonsense keyword', async () => {
        const res = await request(app).get('/api/search-forms/xyzqwerty123');
        expect(res.status).toBe(200);
        expect(res.body.totalResults).toBe(0);
    });
});

describe('POST /api/report-broken-link', () => {
    test('accepts a valid report', async () => {
        const res = await request(app)
            .post('/api/report-broken-link')
            .send({
                jurisdiction: 'Los Angeles, CA',
                formCode: 'PC-ELEC-APP-02',
                issue: 'broken_link',
                comments: 'Test report'
            });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.reportId).toBeDefined();
    });

    test('returns 400 when formCode missing', async () => {
        const res = await request(app)
            .post('/api/report-broken-link')
            .send({ jurisdiction: 'Los Angeles, CA', issue: 'broken_link' });
        expect(res.status).toBe(400);
    });

    test('returns 400 for invalid issue type', async () => {
        const res = await request(app)
            .post('/api/report-broken-link')
            .send({
                jurisdiction: 'Los Angeles, CA',
                formCode: 'PC-ELEC-APP-02',
                issue: 'invalid_issue_type'
            });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/admin/paperwork-stats', () => {
    test('returns database statistics', async () => {
        const res = await request(app).get('/api/admin/paperwork-stats');
        expect(res.status).toBe(200);
        expect(typeof res.body.totalJurisdictions).toBe('number');
        expect(typeof res.body.totalForms).toBe('number');
        expect(res.body.totalJurisdictions).toBeGreaterThanOrEqual(12);
        expect(res.body.totalForms).toBeGreaterThan(50);
    });
});

describe('GET /api/admin/paperwork-summary', () => {
    test('returns admin summary', async () => {
        const res = await request(app).get('/api/admin/paperwork-summary');
        expect(res.status).toBe(200);
        expect(res.body.totalJurisdictions).toBeDefined();
        expect(res.body.jurisdictions).toBeDefined();
    });
});

describe('GET /api/admin/scraper-health', () => {
    test('returns scraper health dashboard', async () => {
        const res = await request(app).get('/api/admin/scraper-health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.cities).toBeDefined();
        expect(res.body.recommendations).toBeDefined();
    });
});

describe('GET /api-docs', () => {
    test('serves Swagger UI', async () => {
        const res = await request(app).get('/api-docs/');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/html');
    });
});

// ============================================================
// PAPERWORK E2E WORKFLOWS
// ============================================================

describe('Paperwork E2E Workflows', () => {
    test('full paperwork workflow: list jurisdictions → get package → search forms', async () => {
        // Step 1: List available jurisdictions
        const jurisdictionsRes = await request(app).get('/api/paperwork-jurisdictions');
        expect(jurisdictionsRes.status).toBe(200);
        expect(jurisdictionsRes.body.count).toBeGreaterThanOrEqual(12);

        // Step 2: Get complete paperwork package for first jurisdiction
        const packageRes = await request(app)
            .post('/api/complete-paperwork-package')
            .send({ jurisdiction: 'Los Angeles, CA', jobType: 'Electrical' });
        expect(packageRes.status).toBe(200);
        expect(packageRes.body.applications.length).toBeGreaterThan(0);

        // Step 3: Search for a form from the package
        const firstForm = packageRes.body.applications[0];
        const keyword = firstForm.formName.split(' ')[0];
        const searchRes = await request(app).get(`/api/search-forms/${encodeURIComponent(keyword)}`);
        expect(searchRes.status).toBe(200);
        expect(searchRes.body.totalResults).toBeGreaterThan(0);
    });

    test('multi-city paperwork comparison', async () => {
        const cities = ['Los Angeles, CA', 'Houston, TX', 'Chicago, IL'];
        const results = [];

        for (const city of cities) {
            const res = await request(app)
                .post('/api/complete-paperwork-package')
                .send({ jurisdiction: city, jobType: 'Electrical' });
            expect(res.status).toBe(200);
            results.push({ city, totalForms: res.body.totalForms, hasApplications: res.body.applications.length > 0 });
        }

        // All cities should have paperwork
        for (const r of results) {
            expect(r.totalForms).toBeGreaterThan(0);
            expect(r.hasApplications).toBe(true);
        }
    });

    test('admin monitoring workflow: stats → summary → scraper health', async () => {
        const [statsRes, summaryRes, healthRes] = await Promise.all([
            request(app).get('/api/admin/paperwork-stats'),
            request(app).get('/api/admin/paperwork-summary'),
            request(app).get('/api/admin/scraper-health')
        ]);

        expect(statsRes.status).toBe(200);
        expect(summaryRes.status).toBe(200);
        expect(healthRes.status).toBe(200);

        // Stats and summary should be consistent
        expect(statsRes.body.totalJurisdictions).toBe(summaryRes.body.totalJurisdictions);
    });
});
