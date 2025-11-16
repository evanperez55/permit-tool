const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { calculateFullPricing, generateClientExplanation } = require('./pricing-calculator');
const { generateAllClientTemplates } = require('./client-templates');
const {
    getSupportedJurisdictions,
    compareJurisdictions,
    identifyKeyDifferences,
    generateQuickReference,
    suggestNearbyJurisdictions,
    calculateOptimalStrategy
} = require('./jurisdiction-comparison');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// System prompt for permit expert AI
const PERMIT_EXPERT_PROMPT = `You are an expert permit consultant with 20+ years of experience helping contractors navigate building permits across the United States.

Your job is to provide SPECIFIC, ACTIONABLE permit requirements based on the job details provided.

IMPORTANT GUIDELINES:
1. Be jurisdiction-specific - requirements vary by city/county/state
2. List EXACT form names and numbers when possible
3. Provide step-by-step process in chronological order
4. Include realistic timelines (processing times)
5. Warn about common rejection reasons for this type of work
6. Mention required inspections
7. Estimate costs (permit fees + potential expediter costs)
8. Always include a disclaimer to verify with local AHJ

OUTPUT FORMAT (use markdown):

## Required Permits
- List specific permits needed
- Include permit type codes if applicable

## Forms & Documents Needed
- Exact form names/numbers
- Supporting documents (plans, certifications, etc.)

## Step-by-Step Process
1. First step
2. Second step
(etc.)

## Required Inspections
- List inspections in order
- When they're needed

## Timeline
- Estimated processing time
- Total timeline from submission to approval

## Estimated Costs
- Permit fees (ranges)
- Other potential costs

## Common Rejection Reasons
- Specific issues for this type of work
- How to avoid them

## Important Notes
- Jurisdiction-specific requirements
- Code references
- Professional certifications needed

## ⚠️ Disclaimer
Always verify these requirements with your local Authority Having Jurisdiction (AHJ) as requirements can change and vary by specific location.

Be thorough but concise. Contractors need actionable information, not theory.`;

// Main API endpoint
app.post('/api/check-requirements', async (req, res) => {
    try {
        const {
            jobType,
            city,
            state,
            projectType,
            scope,
            description
        } = req.body;

        // Validate inputs
        if (!jobType || !city || !state) {
            return res.status(400).json({
                error: 'Missing required fields: jobType, city, and state are required'
            });
        }

        console.log(`\n📋 Analyzing permit requirements:`);
        console.log(`   Job: ${jobType}`);
        console.log(`   Location: ${city}, ${state}`);
        console.log(`   Type: ${projectType}`);
        console.log(`   Scope: ${scope}`);

        // Construct user message with job details
        const userMessage = `
Job Details:
- Type of Work: ${jobType}
- Location: ${city}, ${state}
- Project Type: ${projectType || 'Not specified'}
- Scope: ${scope || 'Not specified'}
- Description: ${description || 'Standard installation/work'}

Please provide specific permit requirements for this job in ${city}, ${state}.
`;

        // Call OpenAI GPT-4
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: PERMIT_EXPERT_PROMPT },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.3, // Lower temperature for more consistent, factual responses
            max_tokens: 2000
        });

        const requirements = completion.choices[0].message.content;

        console.log(`✅ Requirements generated (${requirements.length} chars)`);

        // Calculate comprehensive pricing
        const location = `${city}, ${state}`;
        const pricingData = calculateFullPricing(location, jobType, 5000); // Default $5k project
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
            metadata: {
                jobType,
                location: `${city}, ${state}`,
                projectType,
                scope,
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
    console.log(`📍 Health check: http://localhost:${PORT}/health\n`);
});
