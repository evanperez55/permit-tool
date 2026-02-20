/**
 * Static Requirements Generator
 * Replaces GPT-4 by producing the same markdown format from existing database data.
 *
 * Data sources:
 * - permit-paperwork-database.js → forms, documents, URLs, form codes
 * - database-loader.js → permit fees, processing times, data quality
 * - pricing-calculator.js → calculated fees for the specific job
 * - permit-paperwork.js → checklists, tips, prep time
 */

const { getFormsForTrade } = require('./permit-paperwork-database');
const { getCompletePaperworkPackage, getPaperworkTips } = require('./permit-paperwork');
const { calculateFullPricing, normalizeJobType } = require('./pricing-calculator');
const { permitFees, dataQuality, detectRegion } = require('./database-loader');

/**
 * Multi-trade detection: jobs that commonly require additional permits
 */
const RELATED_TRADES = {
    'Remodeling': ['Electrical', 'Plumbing', 'HVAC', 'General Construction'],
    'General Construction': ['Electrical', 'Plumbing'],
    'HVAC': ['Electrical'],
    'Solar': ['Electrical'],
    'Pool': ['Electrical', 'Plumbing', 'Fence'],
    'Demolition': ['General Construction']
};

/**
 * Get related trades that may also need permits
 */
function getRelatedTrades(normalizedType, scope) {
    const related = RELATED_TRADES[normalizedType] || [];

    // Renovation/Addition scopes often need more trades
    if ((scope === 'Renovation' || scope === 'Addition') && !related.includes('General Construction')) {
        return [...new Set([...related, 'General Construction'])];
    }

    return related;
}

/**
 * Standard inspections by trade type
 */
const INSPECTIONS = {
    'Electrical': [
        'Rough-in inspection (before walls are closed)',
        'Underground/slab inspection (if applicable)',
        'Service/panel inspection',
        'Final electrical inspection'
    ],
    'Plumbing': [
        'Underground/slab plumbing inspection',
        'Rough-in inspection (before walls are closed)',
        'Water supply / top-out inspection',
        'Final plumbing inspection'
    ],
    'HVAC': [
        'Rough-in mechanical inspection',
        'Ductwork inspection (if applicable)',
        'Equipment set / line-set inspection',
        'Final mechanical inspection'
    ],
    'General Construction': [
        'Foundation inspection',
        'Framing inspection',
        'Insulation / energy inspection',
        'Final building inspection'
    ],
    'Remodeling': [
        'Demolition inspection (if applicable)',
        'Rough framing inspection',
        'MEP rough-in inspections (as applicable)',
        'Final inspection'
    ],
    'Solar': [
        'Roof attachment / structural inspection',
        'Electrical rough-in inspection',
        'Final solar / electrical inspection',
        'Utility interconnection verification'
    ],
    'Roofing': [
        'Tear-off / deck inspection',
        'Final roofing inspection'
    ],
    'Pool': [
        'Excavation / steel inspection',
        'Plumbing / electrical rough-in inspection',
        'Pre-plaster / pre-gunite inspection',
        'Final pool inspection',
        'Fence / barrier inspection'
    ],
    'Fence': [
        'Post-hole / footing inspection',
        'Final fence inspection'
    ],
    'Demolition': [
        'Pre-demolition inspection (asbestos/hazmat clearance)',
        'Final demolition / site clearance inspection'
    ]
};

/**
 * Common rejection reasons by trade type
 */
const REJECTION_REASONS = {
    'Electrical': [
        'Incomplete load calculations for service upgrades',
        'Missing panel schedule or circuit directory',
        'Incorrect wire sizing for the specified amperage',
        'Missing GFCI/AFCI protection where required by code',
        'Plans not stamped by a licensed engineer (if required)'
    ],
    'Plumbing': [
        'Missing fixture count or load calculations',
        'Incorrect pipe sizing for the number of fixture units',
        'Missing backflow prevention device details',
        'Insufficient cleanout access points',
        'Non-compliant water heater installation details'
    ],
    'HVAC': [
        'Missing Manual J load calculation',
        'Equipment specifications not included or undersized',
        'Non-compliant ductwork design or sizing',
        'Missing energy compliance forms (Title 24 in CA, IECC elsewhere)',
        'Inadequate combustion air provisions'
    ],
    'General Construction': [
        'Incomplete or incorrect site plan',
        'Missing structural engineering calculations',
        'Non-compliant setback or height violations',
        'Missing energy code compliance documentation',
        'Insufficient detail on construction methods'
    ],
    'Solar': [
        'Missing structural analysis for roof loading',
        'Incomplete single-line electrical diagram',
        'Non-compliant rapid shutdown system',
        'Missing fire setback compliance details',
        'Incorrect interconnection specifications'
    ]
};

/**
 * Step-by-step process by jurisdiction type
 */
function getStepByStepProcess(jurisdiction, jobType, hasPaperwork) {
    const steps = [];
    const isNYC = jurisdiction.includes('New York');
    const isOnline = isNYC; // NYC is fully online

    if (isOnline) {
        steps.push('Create an account on the online permit portal (e.g., DOB NOW for NYC)');
        steps.push('Gather required documents: contractor license, insurance certificate, and project plans');
        steps.push('Complete the online permit application with all project details');
        steps.push('Upload required supporting documents and plans');
        steps.push('Pay the permit fee online');
        steps.push('Wait for plan review (check portal for status updates)');
        steps.push('Address any review comments or corrections');
        steps.push('Receive permit approval and print permit card');
        steps.push('Post permit at the job site before starting work');
        steps.push('Schedule and pass all required inspections');
        steps.push('Obtain final sign-off and certificate of completion');
    } else {
        steps.push('Gather required documents: contractor license, insurance certificate (COI), and project plans');
        if (hasPaperwork) {
            steps.push('Download and complete all required application forms (see Forms & Documents below)');
        } else {
            steps.push('Obtain the permit application from the local building department website');
        }
        steps.push('Prepare detailed project plans and specifications');
        steps.push('Submit the completed application with all supporting documents to the building department');
        steps.push('Pay the permit fee at time of submission');
        steps.push('Wait for plan review by the building department');
        steps.push('Address any plan check corrections or requests for additional information');
        steps.push('Receive the approved permit');
        steps.push('Post the permit visibly at the job site before starting work');
        steps.push('Schedule and pass all required inspections during construction');
        steps.push('Obtain final inspection approval and close out the permit');
    }

    return steps;
}

/**
 * Generate permit requirements markdown from static data
 *
 * @param {Object} params
 * @param {string} params.jobType - e.g. "Electrical Work", "Plumbing"
 * @param {string} params.city - e.g. "Los Angeles"
 * @param {string} params.state - e.g. "CA"
 * @param {string} [params.projectType] - e.g. "Residential"
 * @param {string} [params.scope] - e.g. "New Installation"
 * @param {string} [params.description] - freeform description
 * @param {number} [params.projectValue] - estimated project value in dollars
 * @returns {string} Markdown-formatted requirements
 */
function generateRequirements({ jobType, city, state, projectType, scope, description, projectValue }) {
    const location = `${city}, ${state}`;
    const normalizedType = normalizeJobType(jobType);
    const resolvedLocation = detectRegion(location);
    const resolvedProjectValue = Number(projectValue) > 0 ? Number(projectValue) : 5000;

    // Get fee data
    const feeData = permitFees[resolvedLocation];
    const quality = dataQuality[location] || dataQuality[resolvedLocation] || dataQuality['default'];

    // Get pricing
    const pricing = calculateFullPricing(location, jobType, resolvedProjectValue);

    // Get paperwork
    const forms = getFormsForTrade(location, normalizedType);
    const hasPaperwork = forms.length > 0;
    let tips = [];
    try {
        tips = getPaperworkTips(location, normalizedType);
    } catch (e) {
        // No tips available
    }

    // Get inspections
    const inspections = INSPECTIONS[normalizedType] || INSPECTIONS['General Construction'];

    // Get rejection reasons
    const rejections = REJECTION_REASONS[normalizedType] || REJECTION_REASONS['General Construction'];

    // Build markdown
    const sections = [];

    // --- Required Permits ---
    sections.push('## Required Permits');
    sections.push(`- **${normalizedType} Permit** - Required for ${(scope || 'standard').toLowerCase()} ${normalizedType.toLowerCase()} work in ${location}`);
    if (normalizedType === 'Electrical' && (scope === 'New Installation' || scope === 'Renovation')) {
        sections.push('- **Plan Check** may be required for projects over a certain valuation threshold');
    }
    if (normalizedType === 'HVAC') {
        sections.push('- **Mechanical Permit** - Required for HVAC installation, replacement, or modification');
        sections.push('- **Energy Compliance Certificate** may be required (Title 24 in CA, IECC elsewhere)');
    }
    if (normalizedType === 'Solar') {
        sections.push('- **Electrical Permit** - Required in addition to the solar permit');
        sections.push('- **Structural review** may be required for roof-mounted systems');
    }
    if (projectType === 'Commercial') {
        sections.push('- **Commercial building permit** - Additional requirements apply beyond trade permits');
        sections.push('- **Fire department review** may be required for commercial spaces');
        sections.push('- **ADA compliance review** required for public-facing commercial work');
    } else if (projectType === 'Industrial') {
        sections.push('- **Industrial use permit** may be required depending on facility classification');
        sections.push('- **Environmental review** may be required for industrial projects');
    }

    // Multi-trade suggestions
    const relatedTrades = getRelatedTrades(normalizedType, scope);
    if (relatedTrades.length > 0) {
        sections.push('');
        sections.push('**You may also need permits for:**');
        for (const trade of relatedTrades) {
            sections.push(`- ${trade} permit (commonly required alongside ${normalizedType.toLowerCase()} work)`);
        }
    }
    sections.push('');

    // --- Forms & Documents ---
    sections.push('## Forms & Documents Needed');
    if (hasPaperwork) {
        const applications = forms.filter(f => f.formType === 'Application');
        const supporting = forms.filter(f => f.formType === 'Supporting');

        if (applications.length > 0) {
            sections.push('**Application Forms:**');
            for (const form of applications) {
                sections.push(`- ${form.formName} (${form.formCode}) - [Download](${form.url})`);
            }
        }
        if (supporting.length > 0) {
            sections.push('**Supporting Documents:**');
            for (const form of supporting) {
                sections.push(`- ${form.formName} (${form.formCode}) - [Download](${form.url})`);
            }
        }
    } else {
        sections.push('- Permit application form (obtain from local building department)');
    }
    sections.push('- Proof of contractor license (valid for your trade)');
    sections.push('- Certificate of insurance (general liability + workers comp)');
    sections.push('- Detailed project plans and specifications');
    if (normalizedType === 'Electrical') {
        sections.push('- Load calculations (for service upgrades or new circuits)');
        sections.push('- Panel schedule / circuit directory');
    }
    if (normalizedType === 'HVAC') {
        sections.push('- Manual J load calculation');
        sections.push('- Equipment specifications and cut sheets');
    }
    if (normalizedType === 'Plumbing') {
        sections.push('- Plumbing riser diagram (for new installations)');
        sections.push('- Fixture schedule');
    }
    sections.push('');

    // --- Step-by-Step Process ---
    sections.push('## Step-by-Step Process');
    const steps = getStepByStepProcess(location, normalizedType, hasPaperwork);
    steps.forEach((step, i) => {
        sections.push(`${i + 1}. ${step}`);
    });
    sections.push('');

    // --- Required Inspections ---
    sections.push('## Required Inspections');
    inspections.forEach(inspection => {
        sections.push(`- ${inspection}`);
    });
    sections.push('');

    // --- Timeline ---
    sections.push('## Timeline');
    const processingTime = feeData?.processingTime || pricing.permitFee.processingTime || '2-6 weeks';
    const expediteTime = feeData?.expediteTime || pricing.permitFee.expediteTime;
    const expediteFee = feeData?.expediteFee || pricing.permitFee.expediteFee;

    sections.push(`- **Standard processing time:** ${processingTime}`);
    if (expediteTime && expediteFee) {
        sections.push(`- **Expedited processing:** ${expediteTime} (additional $${expediteFee} fee)`);
    }
    sections.push(`- **Total timeline from submission to completion:** Plan for ${processingTime} for permit approval, plus construction time and inspection scheduling`);
    sections.push('');

    // --- Estimated Costs ---
    sections.push('## Estimated Costs');
    const permitFee = pricing.permitFee;
    sections.push(`- **Calculated permit fee for your $${resolvedProjectValue.toLocaleString()} project:** $${permitFee.permitFee}`);
    sections.push(`- **Fee range:** $${permitFee.minFee} - $${permitFee.maxFee}`);
    if (permitFee.baseFee) {
        sections.push(`- **Base fee:** $${permitFee.baseFee}`);
    }
    if (permitFee.valuationRate) {
        sections.push(`- **Valuation rate:** ${(permitFee.valuationRate * 100).toFixed(2)}% of project value`);
    }
    if (expediteFee) {
        sections.push(`- **Expedite fee (optional):** $${expediteFee}`);
    }
    sections.push(`- **Plan check fee:** Typically 65-85% of the permit fee (varies by jurisdiction)`);
    if (permitFee.notes) {
        sections.push(`- **Note:** ${permitFee.notes}`);
    }

    if (quality.quality === 'estimated') {
        sections.push(`\n> **Note:** These are regional estimates. ${quality.notes || 'Please verify with your local building department.'}`);
    }
    sections.push('');

    // --- Common Rejection Reasons ---
    sections.push('## Common Rejection Reasons');
    rejections.forEach(reason => {
        sections.push(`- ${reason}`);
    });
    sections.push('');

    // --- Important Notes ---
    sections.push('## Important Notes');
    if (tips.length > 0) {
        tips.forEach(tip => {
            sections.push(`- ${tip}`);
        });
    } else {
        sections.push(`- Contact the ${city} building department to confirm all requirements before submitting`);
        sections.push('- Requirements may vary based on the specific scope of your project');
    }
    sections.push(`- All ${normalizedType.toLowerCase()} work must comply with the currently adopted building codes`);
    sections.push('- Permit must be posted visibly at the job site during all work');
    sections.push('- All required inspections must be scheduled and passed before the permit is finalized');
    if (quality.url) {
        sections.push(`- [View official fee schedule / permit info](${quality.url})`);
    }
    sections.push('');

    // --- Disclaimer ---
    sections.push('## Disclaimer');
    sections.push('Always verify these requirements with your local Authority Having Jurisdiction (AHJ) as requirements can change and vary by specific location. This information is generated from our verified permit database and is intended as a starting point - not a substitute for confirmation with your local building department.');

    return sections.join('\n');
}

/**
 * Get the inspection list for a given job type
 */
function getInspections(jobType) {
    const normalizedType = normalizeJobType(jobType);
    return INSPECTIONS[normalizedType] || INSPECTIONS['General Construction'];
}

module.exports = { generateRequirements, getInspections };
