const request = require('supertest');
const express = require('express');
const adminAuth = require('../middleware/admin-auth');

function createApp(envOverrides = {}) {
    const originalEnv = { ...process.env };
    Object.assign(process.env, envOverrides);

    const app = express();
    app.use('/api/admin', adminAuth);
    app.get('/api/admin/test', (req, res) => res.json({ ok: true }));
    app.get('/api/public', (req, res) => res.json({ ok: true }));

    // Cleanup helper
    app._restoreEnv = () => {
        Object.keys(envOverrides).forEach(k => {
            if (originalEnv[k] === undefined) delete process.env[k];
            else process.env[k] = originalEnv[k];
        });
    };
    return app;
}

describe('Admin Auth Middleware', () => {
    afterEach(() => {
        delete process.env.ADMIN_API_KEY;
        delete process.env.NODE_ENV;
    });

    test('returns 401 when no key provided but key is configured', async () => {
        process.env.ADMIN_API_KEY = 'secret123';
        const app = createApp();
        const res = await request(app).get('/api/admin/test');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
    });

    test('returns 401 when wrong key provided', async () => {
        process.env.ADMIN_API_KEY = 'secret123';
        const app = createApp();
        const res = await request(app)
            .get('/api/admin/test')
            .set('X-API-Key', 'wrongkey');
        expect(res.status).toBe(401);
    });

    test('returns 200 when correct key provided', async () => {
        process.env.ADMIN_API_KEY = 'secret123';
        const app = createApp();
        const res = await request(app)
            .get('/api/admin/test')
            .set('X-API-Key', 'secret123');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    test('allows through in development when no key configured', async () => {
        delete process.env.ADMIN_API_KEY;
        process.env.NODE_ENV = 'development';
        const app = createApp();
        const res = await request(app).get('/api/admin/test');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    test('returns 503 in production when no key configured', async () => {
        delete process.env.ADMIN_API_KEY;
        process.env.NODE_ENV = 'production';
        const app = createApp();
        const res = await request(app).get('/api/admin/test');
        expect(res.status).toBe(503);
        expect(res.body.error).toMatch(/not configured/);
    });

    test('non-admin routes are unaffected', async () => {
        process.env.ADMIN_API_KEY = 'secret123';
        const app = createApp();
        const res = await request(app).get('/api/public');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });
});
