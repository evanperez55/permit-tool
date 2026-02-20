/**
 * Link Health Checker
 * Validates all paperwork URLs with HTTP HEAD requests.
 * Flags broken, redirected, or slow-responding links.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const {
    getAvailableJurisdictions,
    getAllFormsForJurisdiction
} = require('./permit-paperwork-database');

const TIMEOUT_MS = 10000;

/**
 * Check a single URL's health
 * @param {string} url - URL to check
 * @returns {Promise<Object>} Health result
 */
function checkUrl(url) {
    return new Promise((resolve) => {
        const start = Date.now();

        try {
            const parsed = new URL(url);
            const client = parsed.protocol === 'https:' ? https : http;

            const req = client.request(parsed, {
                method: 'HEAD',
                timeout: TIMEOUT_MS,
                headers: {
                    'User-Agent': 'PermitAssistant-LinkChecker/1.0'
                }
            }, (res) => {
                const elapsed = Date.now() - start;
                const status = res.statusCode;

                let health = 'healthy';
                if (status >= 400) health = 'broken';
                else if (status >= 300 && status < 400) health = 'redirect';
                else if (elapsed > 5000) health = 'slow';

                resolve({
                    url,
                    status,
                    health,
                    responseTimeMs: elapsed,
                    redirectUrl: res.headers.location || null,
                    contentType: res.headers['content-type'] || null,
                    checkedAt: new Date().toISOString()
                });
            });

            req.on('error', (err) => {
                resolve({
                    url,
                    status: null,
                    health: 'error',
                    responseTimeMs: Date.now() - start,
                    error: err.message,
                    checkedAt: new Date().toISOString()
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url,
                    status: null,
                    health: 'timeout',
                    responseTimeMs: TIMEOUT_MS,
                    error: 'Request timed out',
                    checkedAt: new Date().toISOString()
                });
            });

            req.end();
        } catch (err) {
            resolve({
                url,
                status: null,
                health: 'invalid',
                responseTimeMs: 0,
                error: err.message,
                checkedAt: new Date().toISOString()
            });
        }
    });
}

/**
 * Check all paperwork links for a specific jurisdiction
 * @param {string} jurisdiction - e.g. "Los Angeles, CA"
 * @returns {Promise<Object>} Results for all forms in the jurisdiction
 */
async function checkJurisdiction(jurisdiction) {
    const allForms = getAllFormsForJurisdiction(jurisdiction);
    const results = [];

    for (const [trade, forms] of Object.entries(allForms)) {
        for (const form of forms) {
            const result = await checkUrl(form.url);
            results.push({
                jurisdiction,
                trade,
                formName: form.formName,
                formCode: form.formCode,
                ...result
            });
        }
    }

    const healthy = results.filter(r => r.health === 'healthy').length;
    const broken = results.filter(r => r.health === 'broken' || r.health === 'error').length;
    const redirected = results.filter(r => r.health === 'redirect').length;

    return {
        jurisdiction,
        totalLinks: results.length,
        healthy,
        broken,
        redirected,
        slow: results.filter(r => r.health === 'slow').length,
        timeout: results.filter(r => r.health === 'timeout').length,
        overallHealth: broken > 0 ? 'unhealthy' : redirected > 0 ? 'warning' : 'healthy',
        results
    };
}

/**
 * Check all paperwork links across all jurisdictions
 * @returns {Promise<Object>} Full health report
 */
async function checkAllLinks() {
    const jurisdictions = getAvailableJurisdictions();
    const allResults = [];
    const jurisdictionSummaries = [];

    for (const jurisdiction of jurisdictions) {
        const result = await checkJurisdiction(jurisdiction);
        jurisdictionSummaries.push({
            jurisdiction,
            totalLinks: result.totalLinks,
            healthy: result.healthy,
            broken: result.broken,
            redirected: result.redirected,
            overallHealth: result.overallHealth
        });
        allResults.push(...result.results);
    }

    const totalLinks = allResults.length;
    const healthy = allResults.filter(r => r.health === 'healthy').length;
    const broken = allResults.filter(r => r.health === 'broken' || r.health === 'error').length;

    return {
        checkedAt: new Date().toISOString(),
        summary: {
            totalLinks,
            healthy,
            broken,
            redirected: allResults.filter(r => r.health === 'redirect').length,
            slow: allResults.filter(r => r.health === 'slow').length,
            timeout: allResults.filter(r => r.health === 'timeout').length,
            healthPercent: totalLinks > 0 ? Math.round((healthy / totalLinks) * 100) : 0
        },
        jurisdictions: jurisdictionSummaries,
        brokenLinks: allResults.filter(r => r.health === 'broken' || r.health === 'error'),
        allResults
    };
}

/**
 * Quick check - only test links flagged as potentially broken
 * (faster than full check, good for scheduled runs)
 */
async function quickCheck() {
    const jurisdictions = getAvailableJurisdictions();
    const uniqueUrls = new Set();
    const urlToForm = {};

    for (const jurisdiction of jurisdictions) {
        const allForms = getAllFormsForJurisdiction(jurisdiction);
        for (const [trade, forms] of Object.entries(allForms)) {
            for (const form of forms) {
                if (!uniqueUrls.has(form.url)) {
                    uniqueUrls.add(form.url);
                    urlToForm[form.url] = { jurisdiction, trade, formName: form.formName, formCode: form.formCode };
                }
            }
        }
    }

    const results = [];
    for (const url of uniqueUrls) {
        const result = await checkUrl(url);
        results.push({
            ...urlToForm[url],
            ...result
        });
    }

    const broken = results.filter(r => r.health === 'broken' || r.health === 'error' || r.health === 'timeout');

    return {
        checkedAt: new Date().toISOString(),
        uniqueUrlsChecked: uniqueUrls.size,
        healthy: results.filter(r => r.health === 'healthy').length,
        broken: broken.length,
        brokenLinks: broken,
        allResults: results
    };
}

module.exports = {
    checkUrl,
    checkJurisdiction,
    checkAllLinks,
    quickCheck
};
