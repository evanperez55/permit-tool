/**
 * Comprehensive Integration Test Suite for Permit Paperwork API Endpoints
 *
 * Tests all HTTP endpoints in server.js related to permit paperwork
 * Following "ultrathink" testing philosophy: comprehensive coverage, edge cases, error handling
 *
 * Test Coverage:
 * - POST /api/required-paperwork
 * - POST /api/complete-paperwork-package
 * - GET /api/paperwork-available/:jurisdiction/:jobType
 * - GET /api/form/:jurisdiction/:formCode
 * - GET /api/search-forms/:keyword
 * - GET /api/forms-by-type/:formType
 * - POST /api/report-broken-link
 * - GET /api/admin/paperwork-stats
 * - GET /api/admin/paperwork-summary
 * - GET /api/admin/outdated-forms
 * - GET /api/paperwork-jurisdictions
 */

const request = require('supertest');
const express = require('express');
const permitPaperwork = require('../permit-paperwork');

// Create test app
const app = express();
app.use(express.json());

// Add paperwork endpoints (same as server.js)
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
        res.status(500).json({
            error: 'Failed to retrieve required paperwork',
            message: error.message
        });
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

        const package1 = permitPaperwork.getCompletePaperworkPackage(jurisdiction, jobType);

        res.json(package1);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve complete paperwork package',
            message: error.message
        });
    }
});

app.get('/api/paperwork-available/:jurisdiction/:jobType', (req, res) => {
    try {
        const { jurisdiction, jobType } = req.params;

        const hasData = permitPaperwork.hasPaperworkData(
            decodeURIComponent(jurisdiction),
            decodeURIComponent(jobType)
        );

        res.json({
            jurisdiction: decodeURIComponent(jurisdiction),
            jobType: decodeURIComponent(jobType),
            available: hasData
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to check paperwork availability',
            message: error.message
        });
    }
});

app.get('/api/form/:jurisdiction/:formCode', (req, res) => {
    try {
        const { jurisdiction, formCode } = req.params;

        const form = permitPaperwork.getFormByCode(
            decodeURIComponent(jurisdiction),
            decodeURIComponent(formCode)
        );

        if (!form) {
            return res.status(404).json({
                error: 'Form not found',
                message: `No form with code ${formCode} found in ${jurisdiction}`
            });
        }

        res.json(form);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve form',
            message: error.message
        });
    }
});

app.get('/api/search-forms/:keyword', (req, res) => {
    try {
        const { keyword } = req.params;

        if (!keyword || keyword.length < 2) {
            return res.status(400).json({
                error: 'Invalid search term',
                message: 'Search keyword must be at least 2 characters'
            });
        }

        const results = permitPaperwork.searchForms(decodeURIComponent(keyword));

        res.json({
            keyword: decodeURIComponent(keyword),
            totalResults: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to search forms',
            message: error.message
        });
    }
});

app.get('/api/forms-by-type/:formType', (req, res) => {
    try {
        const { formType } = req.params;

        const forms = permitPaperwork.getFormsByType(decodeURIComponent(formType));

        res.json({
            formType: decodeURIComponent(formType),
            totalForms: forms.length,
            forms
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve forms by type',
            message: error.message
        });
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
            return res.status(400).json({
                error: 'Invalid issue type',
                message: 'issue must be one of: broken_link, outdated, wrong_form, other',
                validIssues
            });
        }

        const report = permitPaperwork.reportBrokenLink({
            jurisdiction,
            jobType,
            formCode,
            formName,
            userEmail,
            issue,
            comments
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to report broken link',
            message: error.message
        });
    }
});

app.get('/api/admin/paperwork-stats', (req, res) => {
    try {
        const stats = permitPaperwork.getDatabaseStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});

app.get('/api/admin/paperwork-summary', (req, res) => {
    try {
        const summary = permitPaperwork.getAdminSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve admin summary',
            message: error.message
        });
    }
});

app.get('/api/admin/outdated-forms', (req, res) => {
    try {
        const outdatedForms = permitPaperwork.getOutdatedForms();
        res.json({
            totalOutdated: outdatedForms.length,
            forms: outdatedForms
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve outdated forms',
            message: error.message
        });
    }
});

app.get('/api/paperwork-jurisdictions', (req, res) => {
    try {
        const jurisdictions = permitPaperwork.getAvailableJurisdictions();
        res.json({
            success: true,
            count: jurisdictions.length,
            jurisdictions
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve jurisdictions',
            message: error.message
        });
    }
});

describe('Permit Paperwork API Integration Tests', () => {
    describe('POST /api/required-paperwork', () => {
        test('should return paperwork for valid request', async () => {
            const response = await request(app)
                .post('/api/required-paperwork')
                .send({
                    jurisdiction: 'Los Angeles, CA',
                    jobType: 'Electrical'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('totalForms');
            expect(response.body).toHaveProperty('applications');
        });

        test('should return 400 for missing jurisdiction', async () => {
            const response = await request(app)
                .post('/api/required-paperwork')
                .send({
                    jobType: 'Electrical'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 400 for missing jobType', async () => {
            const response = await request(app)
                .post('/api/required-paperwork')
                .send({
                    jurisdiction: 'Los Angeles, CA'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should handle unknown jurisdiction gracefully', async () => {
            const response = await request(app)
                .post('/api/required-paperwork')
                .send({
                    jurisdiction: 'Unknown City, XX',
                    jobType: 'Electrical'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/complete-paperwork-package', () => {
        test('should return complete package for valid request', async () => {
            const response = await request(app)
                .post('/api/complete-paperwork-package')
                .send({
                    jurisdiction: 'San Diego, CA',
                    jobType: 'Plumbing'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('checklist');
            expect(response.body).toHaveProperty('downloadInstructions');
            expect(response.body).toHaveProperty('tips');
            expect(response.body).toHaveProperty('estimatedPrepTime');
        });

        test('should return 400 for missing parameters', async () => {
            const response = await request(app)
                .post('/api/complete-paperwork-package')
                .send({});

            expect(response.status).toBe(400);
        });

        test('should include all package components', async () => {
            const response = await request(app)
                .post('/api/complete-paperwork-package')
                .send({
                    jurisdiction: 'Austin, TX',
                    jobType: 'HVAC'
                });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.checklist)).toBe(true);
            expect(response.body.downloadInstructions).toHaveProperty('steps');
            expect(Array.isArray(response.body.tips)).toBe(true);
        });
    });

    describe('GET /api/paperwork-available/:jurisdiction/:jobType', () => {
        test('should confirm data availability for Los Angeles Electrical', async () => {
            const response = await request(app)
                .get('/api/paperwork-available/Los Angeles, CA/Electrical');

            expect(response.status).toBe(200);
            expect(response.body.available).toBe(true);
            expect(response.body.jurisdiction).toBe('Los Angeles, CA');
            expect(response.body.jobType).toBe('Electrical');
        });

        test('should return false for unknown jurisdiction', async () => {
            const response = await request(app)
                .get('/api/paperwork-available/Unknown City, XX/Electrical');

            expect(response.status).toBe(200);
            expect(response.body.available).toBe(false);
        });

        test('should handle URL-encoded parameters', async () => {
            const response = await request(app)
                .get('/api/paperwork-available/San%20Francisco%2C%20CA/Electrical');

            expect(response.status).toBe(200);
            expect(response.body.jurisdiction).toBe('San Francisco, CA');
        });
    });

    describe('GET /api/form/:jurisdiction/:formCode', () => {
        test('should retrieve specific form by code', async () => {
            const response = await request(app)
                .get('/api/form/Los Angeles, CA/PC-ELEC-APP-02');

            expect(response.status).toBe(200);
            expect(response.body.formCode).toBe('PC-ELEC-APP-02');
            expect(response.body).toHaveProperty('formName');
            expect(response.body).toHaveProperty('url');
        });

        test('should return 404 for non-existent form', async () => {
            const response = await request(app)
                .get('/api/form/Chicago, IL/NONEXISTENT-999');

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });

        test('should handle URL-encoded form codes', async () => {
            const response = await request(app)
                .get('/api/form/San Diego, CA/DS-345');

            expect(response.status).toBe(200);
            expect(response.body.formCode).toBe('DS-345');
        });
    });

    describe('GET /api/search-forms/:keyword', () => {
        test('should search for forms by keyword', async () => {
            const response = await request(app)
                .get('/api/search-forms/electrical');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('keyword');
            expect(response.body).toHaveProperty('totalResults');
            expect(Array.isArray(response.body.results)).toBe(true);
            expect(response.body.totalResults).toBeGreaterThan(0);
        });

        test('should return 400 for too-short keyword', async () => {
            const response = await request(app)
                .get('/api/search-forms/a');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should handle URL-encoded keywords', async () => {
            const response = await request(app)
                .get('/api/search-forms/form%203%2F8');

            expect(response.status).toBe(200);
            expect(response.body.keyword).toBe('form 3/8');
        });

        test('should return empty results for no matches', async () => {
            const response = await request(app)
                .get('/api/search-forms/xyzabc123nonexistent');

            expect(response.status).toBe(200);
            expect(response.body.totalResults).toBe(0);
            expect(response.body.results).toEqual([]);
        });
    });

    describe('GET /api/forms-by-type/:formType', () => {
        test('should retrieve all Application forms', async () => {
            const response = await request(app)
                .get('/api/forms-by-type/Application');

            expect(response.status).toBe(200);
            expect(response.body.formType).toBe('Application');
            expect(response.body.totalForms).toBeGreaterThan(0);
            expect(Array.isArray(response.body.forms)).toBe(true);
        });

        test('should retrieve all Fee Schedule forms', async () => {
            const response = await request(app)
                .get('/api/forms-by-type/Fee Schedule');

            expect(response.status).toBe(200);
            expect(response.body.formType).toBe('Fee Schedule');
        });

        test('should return empty array for non-existent type', async () => {
            const response = await request(app)
                .get('/api/forms-by-type/NonExistentType');

            expect(response.status).toBe(200);
            expect(response.body.totalForms).toBe(0);
        });

        test('should handle URL-encoded form types', async () => {
            const response = await request(app)
                .get('/api/forms-by-type/Fee%20Schedule');

            expect(response.status).toBe(200);
            expect(response.body.formType).toBe('Fee Schedule');
        });
    });

    describe('POST /api/report-broken-link', () => {
        test('should accept valid broken link report', async () => {
            const response = await request(app)
                .post('/api/report-broken-link')
                .send({
                    jurisdiction: 'Los Angeles, CA',
                    jobType: 'Electrical',
                    formCode: 'PC-ELEC-APP-02',
                    formName: 'Electrical Permit Application',
                    userEmail: 'test@example.com',
                    issue: 'broken_link',
                    comments: 'Link returns 404 error'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('reportId');
            expect(response.body).toHaveProperty('timestamp');
        });

        test('should return 400 for missing jurisdiction', async () => {
            const response = await request(app)
                .post('/api/report-broken-link')
                .send({
                    formCode: 'TEST',
                    issue: 'broken_link'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 400 for invalid issue type', async () => {
            const response = await request(app)
                .post('/api/report-broken-link')
                .send({
                    jurisdiction: 'Los Angeles, CA',
                    formCode: 'TEST',
                    issue: 'invalid_issue_type'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid issue type');
        });

        test('should accept all valid issue types', async () => {
            const validIssues = ['broken_link', 'outdated', 'wrong_form', 'other'];

            for (const issue of validIssues) {
                const response = await request(app)
                    .post('/api/report-broken-link')
                    .send({
                        jurisdiction: 'Chicago, IL',
                        formCode: 'Form 400',
                        issue
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            }
        });
    });

    describe('GET /api/admin/paperwork-stats', () => {
        test('should return database statistics', async () => {
            const response = await request(app)
                .get('/api/admin/paperwork-stats');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalForms');
            expect(response.body).toHaveProperty('totalJurisdictions');
            expect(response.body).toHaveProperty('formsByType');
            expect(response.body.totalJurisdictions).toBe(8);
        });

        test('should include form type breakdown', async () => {
            const response = await request(app)
                .get('/api/admin/paperwork-stats');

            expect(response.body.formsByType).toHaveProperty('Application');
            expect(typeof response.body.formsByType.Application).toBe('number');
        });
    });

    describe('GET /api/admin/paperwork-summary', () => {
        test('should return admin summary', async () => {
            const response = await request(app)
                .get('/api/admin/paperwork-summary');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalForms');
            expect(response.body).toHaveProperty('needsVerification');
            expect(response.body).toHaveProperty('verificationRate');
        });

        test('should include jurisdiction breakdown', async () => {
            const response = await request(app)
                .get('/api/admin/paperwork-summary');

            expect(response.body).toHaveProperty('formsByJurisdiction');
            expect(response.body.formsByJurisdiction).toHaveProperty('Los Angeles, CA');
        });
    });

    describe('GET /api/admin/outdated-forms', () => {
        test('should return list of outdated forms', async () => {
            const response = await request(app)
                .get('/api/admin/outdated-forms');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalOutdated');
            expect(Array.isArray(response.body.forms)).toBe(true);
        });

        test('should include age information for outdated forms', async () => {
            const response = await request(app)
                .get('/api/admin/outdated-forms');

            if (response.body.totalOutdated > 0) {
                expect(response.body.forms[0]).toHaveProperty('ageInDays');
            }
        });
    });

    describe('GET /api/paperwork-jurisdictions', () => {
        test('should return all available jurisdictions', async () => {
            const response = await request(app)
                .get('/api/paperwork-jurisdictions');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(8);
            expect(Array.isArray(response.body.jurisdictions)).toBe(true);
        });

        test('should include all major cities', async () => {
            const response = await request(app)
                .get('/api/paperwork-jurisdictions');

            const jurisdictions = response.body.jurisdictions;
            expect(jurisdictions).toContain('Los Angeles, CA');
            expect(jurisdictions).toContain('New York, NY');
            expect(jurisdictions).toContain('Chicago, IL');
        });
    });

    describe('End-to-end workflow tests', () => {
        test('complete user workflow: check availability, get package, report issue', async () => {
            // Step 1: Check if paperwork data is available
            const availCheck = await request(app)
                .get('/api/paperwork-available/San Francisco, CA/Electrical');

            expect(availCheck.status).toBe(200);
            expect(availCheck.body.available).toBe(true);

            // Step 2: Get complete package
            const package1 = await request(app)
                .post('/api/complete-paperwork-package')
                .send({
                    jurisdiction: 'San Francisco, CA',
                    jobType: 'Electrical'
                });

            expect(package1.status).toBe(200);
            expect(package1.body).toHaveProperty('checklist');

            // Step 3: Report a broken link
            const report = await request(app)
                .post('/api/report-broken-link')
                .send({
                    jurisdiction: 'San Francisco, CA',
                    jobType: 'Electrical',
                    formCode: package1.body.applications[0].formCode,
                    issue: 'broken_link'
                });

            expect(report.status).toBe(200);
            expect(report.body.success).toBe(true);
        });

        test('admin workflow: get stats, check summary, find outdated', async () => {
            // Get stats
            const stats = await request(app)
                .get('/api/admin/paperwork-stats');

            expect(stats.status).toBe(200);

            // Get summary
            const summary = await request(app)
                .get('/api/admin/paperwork-summary');

            expect(summary.status).toBe(200);

            // Get outdated forms
            const outdated = await request(app)
                .get('/api/admin/outdated-forms');

            expect(outdated.status).toBe(200);

            // Verify consistency
            expect(summary.body.totalForms).toBe(stats.body.totalForms);
        });
    });
});
