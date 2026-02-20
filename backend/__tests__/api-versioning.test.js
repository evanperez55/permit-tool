const request = require('supertest');
const express = require('express');

// Build a minimal test app mirroring the router structure in server.js
const adminAuth = require('../middleware/admin-auth');

function createTestApp() {
    const app = express();
    app.use(express.json());

    const apiRouter = express.Router();
    apiRouter.use('/admin', adminAuth);

    apiRouter.get('/jurisdictions', (req, res) => {
        res.json({ success: true, jurisdictions: ['test'], count: 1 });
    });

    apiRouter.post('/check-requirements', (req, res) => {
        res.json({ success: true, echo: req.body });
    });

    apiRouter.get('/admin/analytics', (req, res) => {
        res.json({ success: true, totalQueries: 0 });
    });

    app.use('/api/v1', apiRouter);
    app.use('/api', apiRouter);

    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    return app;
}

describe('API Versioning', () => {
    const app = createTestApp();

    test('/api/v1/jurisdictions returns same data as /api/jurisdictions', async () => {
        const [v1, legacy] = await Promise.all([
            request(app).get('/api/v1/jurisdictions'),
            request(app).get('/api/jurisdictions')
        ]);

        expect(v1.status).toBe(200);
        expect(legacy.status).toBe(200);
        expect(v1.body).toEqual(legacy.body);
    });

    test('POST endpoints work at both prefixes', async () => {
        const body = { jobType: 'Electrical', city: 'Denver', state: 'CO' };

        const [v1, legacy] = await Promise.all([
            request(app).post('/api/v1/check-requirements').send(body),
            request(app).post('/api/check-requirements').send(body)
        ]);

        expect(v1.status).toBe(200);
        expect(legacy.status).toBe(200);
        expect(v1.body.echo).toEqual(body);
        expect(legacy.body.echo).toEqual(body);
    });

    test('/health stays at root (not versioned)', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');

        // /api/v1/health should 404
        const v1Health = await request(app).get('/api/v1/health');
        expect(v1Health.status).toBe(404);
    });

    test('admin auth applies at both prefixes', async () => {
        process.env.ADMIN_API_KEY = 'test-key';
        const freshApp = createTestApp();

        const [v1NoKey, legacyNoKey] = await Promise.all([
            request(freshApp).get('/api/v1/admin/analytics'),
            request(freshApp).get('/api/admin/analytics')
        ]);

        expect(v1NoKey.status).toBe(401);
        expect(legacyNoKey.status).toBe(401);

        const [v1WithKey, legacyWithKey] = await Promise.all([
            request(freshApp).get('/api/v1/admin/analytics').set('X-API-Key', 'test-key'),
            request(freshApp).get('/api/admin/analytics').set('X-API-Key', 'test-key')
        ]);

        expect(v1WithKey.status).toBe(200);
        expect(legacyWithKey.status).toBe(200);

        delete process.env.ADMIN_API_KEY;
    });
});
