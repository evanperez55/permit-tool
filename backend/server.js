const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { calculateFullPricing, generateClientExplanation } = require('./pricing-calculator');
const { generateAllClientTemplates } = require('./client-templates');
const { generateRequirements, getInspections } = require('./requirements-generator');
const {
    getSupportedJurisdictions,
    compareJurisdictions,
    identifyKeyDifferences,
    generateQuickReference,
    suggestNearbyJurisdictions,
    calculateOptimalStrategy
} = require('./jurisdiction-comparison');
const analytics = require('./analytics');
const adminAuth = require('./middleware/admin-auth');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOrigins = process.env.CORS_ORIGINS;
app.use(cors(corsOrigins ? {
    origin: corsOrigins.split(',').map(o => o.trim()),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-API-Key']
} : undefined));
app.use(express.json());

// Rate limiting
const rateLimitWindow = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 100;
const rateLimitStore = new Map();

setInterval(() => rateLimitStore.clear(), rateLimitWindow);

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

// In-memory response cache for GET endpoints
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheMiddleware(req, res, next) {
    if (req.method !== 'GET') return next();
    const cached = responseCache.get(req.originalUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        responseCache.set(req.originalUrl, { data, timestamp: Date.now() });
        return originalJson(data);
    };
    next();
}

const cachedPaths = ['/api/jurisdictions', '/api/verified-cities', '/api/paperwork-jurisdictions'];
cachedPaths.forEach(path => app.use(path, cacheMiddleware));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '..', 'frontend')));
}

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Permit Assistant API Docs'
}));

// Main API endpoint
app.post('/api/check-requirements', async (req, res) => {
    try {
        const {
            jobType,
            city,
            state,
            projectType,
            scope,
            description,
            projectValue
        } = req.body;

        // Validate inputs
        if (!jobType || !city || !state) {
            return res.status(400).json({
                error: 'Missing required fields: jobType, city, and state are required'
            });
        }

        const resolvedProjectValue = Number(projectValue) > 0 ? Number(projectValue) : 5000;

        analytics.track({ city, state, jobType });

        console.log(`\n📋 Analyzing permit requirements:`);
        console.log(`   Job: ${jobType}`);
        console.log(`   Location: ${city}, ${state}`);
        console.log(`   Type: ${projectType}`);
        console.log(`   Scope: ${scope}`);
        console.log(`   Project value: $${resolvedProjectValue}`);

        // Generate requirements from static data
        const requirements = generateRequirements({ jobType, city, state, projectType, scope, description, projectValue: resolvedProjectValue });

        console.log(`✅ Requirements generated (${requirements.length} chars)`);

        // Calculate comprehensive pricing
        const location = `${city}, ${state}`;
        const pricingData = calculateFullPricing(location, jobType, resolvedProjectValue);
        const clientExplanation = generateClientExplanation(pricingData);

        // Generate client communication templates
        const fullPricingData = {
            pricing: pricingData,
            metadata: {
                jobType,
                location: `${city}, ${state}`,
                projectType,
                scope,
                timestamp: new Date().toISOString()
            }
        };
        const clientTemplates = generateAllClientTemplates(fullPricingData);

        console.log(`💰 Pricing calculated: $${pricingData.summary.recommendedCharge} recommended charge`);
        console.log(`📊 Data quality: ${pricingData.dataQuality.quality} (confidence: ${pricingData.dataQuality.confidence})`);
        console.log(`📧 Client templates generated: 5 templates ready`);

        res.json({
            success: true,
            requirements,
            pricing: pricingData,
            clientExplanation: clientExplanation,
            clientTemplates: clientTemplates,
            inspections: getInspections(jobType),
            metadata: {
                jobType,
                location: `${city}, ${state}`,
                projectType,
                scope,
                projectValue: resolvedProjectValue,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            error: 'Failed to analyze permit requirements',
            message: error.message
        });
    }
});

// Jurisdiction comparison endpoints

// Get all supported jurisdictions
app.get('/api/jurisdictions', (req, res) => {
    try {
        const jurisdictions = getSupportedJurisdictions();
        console.log(`📍 Retrieved ${jurisdictions.length} supported jurisdictions`);

        res.json({
            success: true,
            jurisdictions,
            count: jurisdictions.length
        });
    } catch (error) {
        console.error('❌ Error getting jurisdictions:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve jurisdictions',
            message: error.message
        });
    }
});

// Get only verified cities (for limiting user selection)
app.get('/api/verified-cities', (req, res) => {
    try {
        const { dataQuality } = require('./database-loader');

        const verifiedCities = Object.entries(dataQuality)
            .filter(([city, quality]) => quality.quality === 'verified')
            .map(([city, quality]) => ({
                name: city,
                source: quality.source,
                lastVerified: quality.lastVerified,
                url: quality.url
            }));

        console.log(`✅ Retrieved ${verifiedCities.length} verified cities`);

        res.json({
            success: true,
            cities: verifiedCities,
            count: verifiedCities.length,
            message: `We currently have verified permit data for ${verifiedCities.length} major US cities.`
        });
    } catch (error) {
        console.error('❌ Error getting verified cities:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve verified cities',
            message: error.message
        });
    }
});

// Get nearby jurisdiction suggestions
app.get('/api/jurisdictions/nearby/:location', (req, res) => {
    try {
        const location = decodeURIComponent(req.params.location);
        const nearby = suggestNearbyJurisdictions(location);

        console.log(`📍 Found ${nearby.length} nearby jurisdictions for ${location}`);

        res.json({
            success: true,
            baseLocation: location,
            nearbyJurisdictions: nearby,
            count: nearby.length
        });
    } catch (error) {
        console.error('❌ Error getting nearby jurisdictions:', error.message);
        res.status(500).json({
            error: 'Failed to get nearby jurisdictions',
            message: error.message
        });
    }
});

// Compare multiple jurisdictions
app.post('/api/compare-jurisdictions', (req, res) => {
    try {
        const { jurisdictions, jobType } = req.body;

        // Validate inputs
        if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
            return res.status(400).json({
                error: 'Missing or invalid jurisdictions array'
            });
        }

        if (!jobType) {
            return res.status(400).json({
                error: 'Missing required field: jobType'
            });
        }

        console.log(`\n⚖️  Comparing ${jurisdictions.length} jurisdictions for ${jobType}`);
        console.log(`   Jurisdictions: ${jurisdictions.join(', ')}`);

        const comparison = compareJurisdictions(jurisdictions, jobType);
        const differences = identifyKeyDifferences(comparison.comparisons);

        console.log(`✅ Comparison complete`);
        console.log(`   Lowest charge: $${comparison.analysis.lowestRecommendedCharge}`);
        console.log(`   Highest charge: $${comparison.analysis.highestRecommendedCharge}`);
        console.log(`   Variance: $${comparison.analysis.variance}`);

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
        console.error('❌ Error comparing jurisdictions:', error.message);
        res.status(500).json({
            error: 'Failed to compare jurisdictions',
            message: error.message
        });
    }
});

// Calculate optimal pricing strategy
app.post('/api/jurisdiction-strategy', (req, res) => {
    try {
        const { jurisdictions, jobType } = req.body;

        // Validate inputs
        if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
            return res.status(400).json({
                error: 'Missing or invalid jurisdictions array'
            });
        }

        if (!jobType) {
            return res.status(400).json({
                error: 'Missing required field: jobType'
            });
        }

        console.log(`\n📊 Calculating optimal strategy for ${jobType}`);
        console.log(`   Analyzing ${jurisdictions.length} markets`);

        const strategy = calculateOptimalStrategy(jurisdictions, jobType);

        console.log(`✅ Strategy calculated`);
        console.log(`   Average charge: $${strategy.summary.averageCharge}`);
        console.log(`   Best margin: ${strategy.summary.bestMargin}%`);
        console.log(`   Fastest processing: ${strategy.summary.fastestProcessing}`);

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
        console.error('❌ Error calculating strategy:', error.message);
        res.status(500).json({
            error: 'Failed to calculate strategy',
            message: error.message
        });
    }
});

// Generate quick reference guide
app.post('/api/quick-reference', (req, res) => {
    try {
        const { jurisdictions, jobTypes } = req.body;

        // Validate inputs
        if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
            return res.status(400).json({
                error: 'Missing or invalid jurisdictions array'
            });
        }

        if (!jobTypes || !Array.isArray(jobTypes) || jobTypes.length === 0) {
            return res.status(400).json({
                error: 'Missing or invalid jobTypes array'
            });
        }

        console.log(`\n📖 Generating quick reference guide`);
        console.log(`   Jurisdictions: ${jurisdictions.length}`);
        console.log(`   Job types: ${jobTypes.length}`);

        const quickReference = generateQuickReference(jurisdictions, jobTypes);

        console.log(`✅ Quick reference generated`);

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
        console.error('❌ Error generating quick reference:', error.message);
        res.status(500).json({
            error: 'Failed to generate quick reference',
            message: error.message
        });
    }
});

// ===================================================================
// PERMIT PAPERWORK ENDPOINTS
// ===================================================================

const permitPaperwork = require('./permit-paperwork');

// Get required paperwork for a specific permit
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
        console.error('❌ Error getting required paperwork:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve required paperwork',
            message: error.message
        });
    }
});

// Get complete paperwork package with checklist and tips
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
        console.error('❌ Error getting complete paperwork package:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve complete paperwork package',
            message: error.message
        });
    }
});

// Check if paperwork data exists for a jurisdiction/job type
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
        console.error('❌ Error checking paperwork availability:', error.message);
        res.status(500).json({
            error: 'Failed to check paperwork availability',
            message: error.message
        });
    }
});

// Get a specific form by code
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
        console.error('❌ Error retrieving form:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve form',
            message: error.message
        });
    }
});

// Search for forms by keyword
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
        console.error('❌ Error searching forms:', error.message);
        res.status(500).json({
            error: 'Failed to search forms',
            message: error.message
        });
    }
});

// Get all forms of a specific type
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
        console.error('❌ Error getting forms by type:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve forms by type',
            message: error.message
        });
    }
});

// Report a broken or outdated link
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
        console.error('❌ Error reporting broken link:', error.message);
        res.status(500).json({
            error: 'Failed to report broken link',
            message: error.message
        });
    }
});

// Admin authentication - protect all /api/admin routes
app.use('/api/admin', adminAuth);

// Get database statistics (admin)
app.get('/api/admin/paperwork-stats', (req, res) => {
    try {
        const stats = permitPaperwork.getDatabaseStats();

        res.json(stats);
    } catch (error) {
        console.error('❌ Error getting paperwork stats:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});

// Get admin summary (admin)
app.get('/api/admin/paperwork-summary', (req, res) => {
    try {
        const summary = permitPaperwork.getAdminSummary();

        res.json(summary);
    } catch (error) {
        console.error('❌ Error getting admin summary:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve admin summary',
            message: error.message
        });
    }
});

// Get outdated forms (admin)
app.get('/api/admin/outdated-forms', (req, res) => {
    try {
        const outdatedForms = permitPaperwork.getOutdatedForms();

        res.json({
            totalOutdated: outdatedForms.length,
            forms: outdatedForms
        });
    } catch (error) {
        console.error('❌ Error getting outdated forms:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve outdated forms',
            message: error.message
        });
    }
});

// Get all available jurisdictions with paperwork data
app.get('/api/paperwork-jurisdictions', (req, res) => {
    try {
        const jurisdictions = permitPaperwork.getAvailableJurisdictions();

        res.json({
            success: true,
            count: jurisdictions.length,
            jurisdictions
        });
    } catch (error) {
        console.error('❌ Error getting paperwork jurisdictions:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve jurisdictions',
            message: error.message
        });
    }
});

// ===================================================================
// SCRAPER HEALTH & SCHEDULING ENDPOINTS
// ===================================================================

const scraperHealth = require('./scraper-health');
const { checkJurisdiction, checkAllLinks, quickCheck } = require('./link-health-checker');
const { getScheduler } = require('./scraper-scheduler');

// Get scraper health dashboard
app.get('/api/admin/scraper-health', (req, res) => {
    try {
        const health = scraperHealth.getScraperHealth();
        res.json({ success: true, ...health });
    } catch (error) {
        console.error('Error getting scraper health:', error.message);
        res.status(500).json({ error: 'Failed to get scraper health', message: error.message });
    }
});

// Get scraper run history
app.get('/api/admin/scraper-runs', (req, res) => {
    try {
        const runs = scraperHealth.getRunHistory();
        res.json({ success: true, runs, count: runs.length });
    } catch (error) {
        console.error('Error getting run history:', error.message);
        res.status(500).json({ error: 'Failed to get run history', message: error.message });
    }
});

// Get detail for a specific city's scraper data
app.get('/api/admin/scraper-detail/:city', (req, res) => {
    try {
        const city = decodeURIComponent(req.params.city);
        const detail = scraperHealth.getCityScraperDetail(city);
        res.json({ success: true, ...detail });
    } catch (error) {
        console.error('Error getting city detail:', error.message);
        res.status(500).json({ error: 'Failed to get city detail', message: error.message });
    }
});

// Link health check - quick (unique URLs only)
app.get('/api/admin/link-check', async (req, res) => {
    try {
        console.log('🔗 Starting quick link health check...');
        const result = await quickCheck();
        console.log(`🔗 Link check complete: ${result.healthy}/${result.uniqueUrlsChecked} healthy`);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error running link check:', error.message);
        res.status(500).json({ error: 'Failed to run link check', message: error.message });
    }
});

// Link health check - full (all forms, all jurisdictions)
app.get('/api/admin/link-check/full', async (req, res) => {
    try {
        console.log('🔗 Starting full link health check...');
        const result = await checkAllLinks();
        console.log(`🔗 Full link check complete: ${result.summary.healthy}/${result.summary.totalLinks} healthy`);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error running full link check:', error.message);
        res.status(500).json({ error: 'Failed to run full link check', message: error.message });
    }
});

// Link health check - single jurisdiction
app.get('/api/admin/link-check/:jurisdiction', async (req, res) => {
    try {
        const jurisdiction = decodeURIComponent(req.params.jurisdiction);
        console.log(`🔗 Checking links for ${jurisdiction}...`);
        const result = await checkJurisdiction(jurisdiction);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error checking jurisdiction links:', error.message);
        res.status(500).json({ error: 'Failed to check links', message: error.message });
    }
});

// Scheduler status
app.get('/api/admin/scheduler', (req, res) => {
    try {
        const scheduler = getScheduler();
        res.json({ success: true, ...scheduler.getStatus() });
    } catch (error) {
        console.error('Error getting scheduler status:', error.message);
        res.status(500).json({ error: 'Failed to get scheduler status', message: error.message });
    }
});

// Start scheduler
app.post('/api/admin/scheduler/start', (req, res) => {
    try {
        const scheduler = getScheduler();
        scheduler.start();
        res.json({ success: true, message: 'Scheduler started', ...scheduler.getStatus() });
    } catch (error) {
        console.error('Error starting scheduler:', error.message);
        res.status(500).json({ error: 'Failed to start scheduler', message: error.message });
    }
});

// Stop scheduler
app.post('/api/admin/scheduler/stop', (req, res) => {
    try {
        const scheduler = getScheduler();
        scheduler.stop();
        res.json({ success: true, message: 'Scheduler stopped', ...scheduler.getStatus() });
    } catch (error) {
        console.error('Error stopping scheduler:', error.message);
        res.status(500).json({ error: 'Failed to stop scheduler', message: error.message });
    }
});

// Trigger manual scrape (single city)
app.post('/api/admin/scrape/:city', async (req, res) => {
    try {
        const city = decodeURIComponent(req.params.city);
        console.log(`🏙️ Manual scrape triggered for ${city}`);
        const scheduler = getScheduler();
        const result = await scheduler.runScrapeCity(city);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error running manual scrape:', error.message);
        res.status(500).json({ error: 'Failed to run scrape', message: error.message });
    }
});

// Usage analytics
app.get('/api/admin/analytics', (req, res) => {
    try {
        res.json({ success: true, ...analytics.getSummary() });
    } catch (error) {
        console.error('Error getting analytics:', error.message);
        res.status(500).json({ error: 'Failed to get analytics', message: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Permit Assistant API',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Permit Assistant API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API docs: http://localhost:${PORT}/api-docs\n`);
});
