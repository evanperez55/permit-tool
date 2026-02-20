/**
 * Admin API Key Authentication Middleware
 * Protects /api/admin routes with X-API-Key header validation.
 */

function adminAuth(req, res, next) {
    const configuredKey = process.env.ADMIN_API_KEY;
    const providedKey = req.headers['x-api-key'];

    // No key configured
    if (!configuredKey) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({
                error: 'Admin API key not configured',
                message: 'Set ADMIN_API_KEY environment variable to enable admin access'
            });
        }
        // Development: warn and allow through
        if (!req._adminAuthWarned) {
            console.warn('WARNING: ADMIN_API_KEY not set - admin routes are unprotected');
        }
        return next();
    }

    // Key configured but not provided or wrong
    if (!providedKey || providedKey !== configuredKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Valid X-API-Key header required'
        });
    }

    next();
}

module.exports = adminAuth;
