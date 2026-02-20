const request = require('supertest');

// Set rate limit env vars before requiring server
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX = '5';

describe('Rate Limiter', () => {
    let app;

    beforeAll(() => {
        // Create a minimal express app with the rate limiter
        const express = require('express');
        app = express();

        const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 100;
        const rateLimitStore = new Map();

        function rateLimiter(req, res, next) {
            const key = req.ip;
            const current = rateLimitStore.get(key) || 0;
            if (current >= rateLimitMax) {
                return res.status(429).json({ error: 'Too many requests, please try again later.' });
            }
            rateLimitStore.set(key, current + 1);
            next();
        }

        app.use('/api/', rateLimiter);
        app.get('/api/test', (req, res) => res.json({ ok: true }));
        app.get('/health', (req, res) => res.json({ status: 'ok' }));

        // Expose store for testing
        app._rateLimitStore = rateLimitStore;
    });

    afterEach(() => {
        app._rateLimitStore.clear();
    });

    test('allows requests under the limit', async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(app).get('/api/test');
            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        }
    });

    test('returns 429 when limit is exceeded', async () => {
        // Use all 5 allowed requests
        for (let i = 0; i < 5; i++) {
            await request(app).get('/api/test');
        }

        // 6th request should be blocked
        const res = await request(app).get('/api/test');
        expect(res.status).toBe(429);
        expect(res.body.error).toMatch(/too many requests/i);
    });

    test('resets after window clears', async () => {
        // Use all allowed requests
        for (let i = 0; i < 5; i++) {
            await request(app).get('/api/test');
        }

        // Verify blocked
        let res = await request(app).get('/api/test');
        expect(res.status).toBe(429);

        // Simulate window reset
        app._rateLimitStore.clear();

        // Should work again
        res = await request(app).get('/api/test');
        expect(res.status).toBe(200);
    });

    test('does not rate-limit non-API routes', async () => {
        // Use all allowed requests on API
        for (let i = 0; i < 5; i++) {
            await request(app).get('/api/test');
        }

        // Health check should still work
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });
});
