/**
 * Permit Pricing Calculator
 * Calculates comprehensive permit pricing for contractors
 */

const { permitFees, laborTimes, markupRecommendations } = require('./permit-fee-database');

/**
 * Map job types to database keys
 */
function normalizeJobType(jobType) {
    const mapping = {
        'Electrical Work': 'Electrical',
        'Electrical': 'Electrical',
        'Plumbing': 'Plumbing',
        'HVAC': 'HVAC',
        'General Construction': 'General Construction',
        'Remodeling': 'Remodeling',
        'Remodeling/Renovation': 'Remodeling',
        'Solar Installation': 'Solar',
        'Solar': 'Solar',
        'Roofing': 'Roofing',
        'Pool/Spa': 'Pool',
        'Pool': 'Pool',
        'Fence/Deck': 'Fence',
        'Fence': 'Fence',
        'Demolition': 'Demolition'
    };
    return mapping[jobType] || 'General Construction';
}

/**
 * Map job types to permit fee categories
 */
function getPermitFeeCategory(jobType) {
    const mapping = {
        'Electrical': 'electrical',
        'Plumbing': 'plumbing',
        'HVAC': 'hvac',
        'General Construction': 'general',
        'Remodeling': 'general',
        'Solar': 'solar',
        'Roofing': 'general',
        'Pool': 'general',
        'Fence': 'general',
        'Demolition': 'general'
    };
    return mapping[jobType] || 'general';
}

/**
 * Calculate permit fee based on jurisdiction and job details
 */
function calculatePermitFee(location, jobType, projectValue = 5000) {
    // Get jurisdiction data or default
    const jurisdictionData = permitFees[location] || permitFees['default'];

    // Get permit category
    const feeCategory = getPermitFeeCategory(jobType);
    const feeData = jurisdictionData[feeCategory];

    // Calculate fee: base fee + (project value * valuation rate)
    let calculatedFee = feeData.baseFee + (projectValue * feeData.valuationRate);

    // Apply min/max constraints
    calculatedFee = Math.max(feeData.minFee, Math.min(calculatedFee, feeData.maxFee));

    return {
        permitFee: Math.round(calculatedFee),
        baseFee: feeData.baseFee,
        valuationRate: feeData.valuationRate,
        minFee: feeData.minFee,
        maxFee: feeData.maxFee,
        processingTime: jurisdictionData.processingTime,
        expediteFee: jurisdictionData.expediteFee,
        expediteTime: jurisdictionData.expediteTime,
        notes: feeData.notes || ''
    };
}

/**
 * Calculate labor costs for permit work
 */
function calculateLaborCosts(jobType) {
    const normalizedType = normalizeJobType(jobType);
    const times = laborTimes[normalizedType] || laborTimes['General Construction'];
    const markup = markupRecommendations[normalizedType] || markupRecommendations['General Construction'];

    const laborCost = times.total * markup.laborRate;

    return {
        hours: times.total,
        hourlyRate: markup.laborRate,
        laborCost: Math.round(laborCost),
        breakdown: {
            documentPrep: {
                hours: times.documentPrep,
                cost: Math.round(times.documentPrep * markup.laborRate)
            },
            planDrawing: {
                hours: times.planDrawing,
                cost: Math.round(times.planDrawing * markup.laborRate)
            },
            submission: {
                hours: times.submission,
                cost: Math.round(times.submission * markup.laborRate)
            },
            inspection: {
                hours: times.inspection,
                cost: Math.round(times.inspection * markup.laborRate)
            },
            corrections: {
                hours: times.corrections,
                cost: Math.round(times.corrections * markup.laborRate)
            }
        }
    };
}

/**
 * Calculate what to charge the client
 */
function calculateClientCharge(permitFee, laborCost, jobType) {
    const normalizedType = normalizeJobType(jobType);
    const markup = markupRecommendations[normalizedType] || markupRecommendations['General Construction'];

    // Markup on permit fee
    const permitFeeMarkup = Math.round(permitFee * markup.permitFeeMarkup);

    // Total suggested charge
    let totalCharge = permitFee + permitFeeMarkup + laborCost;

    // Apply minimum charge if applicable
    totalCharge = Math.max(totalCharge, markup.minimumCharge);

    return {
        permitFee: permitFee,
        permitFeeMarkup: permitFeeMarkup,
        permitFeeMarkupPercent: markup.permitFeeMarkup * 100,
        laborCost: laborCost,
        subtotal: permitFee + permitFeeMarkup + laborCost,
        recommendedCharge: Math.round(totalCharge),
        minimumCharge: markup.minimumCharge,
        notes: markup.notes
    };
}

/**
 * Main pricing calculator function
 */
function calculateFullPricing(location, jobType, projectValue = 5000) {
    const normalizedType = normalizeJobType(jobType);

    // Calculate each component
    const permitFeeData = calculatePermitFee(location, normalizedType, projectValue);
    const laborData = calculateLaborCosts(normalizedType);
    const clientChargeData = calculateClientCharge(
        permitFeeData.permitFee,
        laborData.laborCost,
        normalizedType
    );

    return {
        jurisdiction: location,
        jobType: normalizedType,
        projectValue: projectValue,

        // Permit fees
        permitFee: permitFeeData,

        // Labor costs
        labor: laborData,

        // What to charge client
        clientCharge: clientChargeData,

        // Quick summary for display
        summary: {
            totalCost: permitFeeData.permitFee + laborData.laborCost,
            recommendedCharge: clientChargeData.recommendedCharge,
            yourProfit: clientChargeData.recommendedCharge - (permitFeeData.permitFee + laborData.laborCost),
            profitMargin: Math.round(((clientChargeData.recommendedCharge - (permitFeeData.permitFee + laborData.laborCost)) / clientChargeData.recommendedCharge) * 100),
            timeInvestment: `${laborData.hours} hours`,
            processingTime: permitFeeData.processingTime
        },

        // Competitive intelligence
        competitive: {
            unlicensedContractorPrice: Math.round(permitFeeData.permitFee * 0.5), // They often skip or undercharge
            expediterServicePrice: Math.round(permitFeeData.permitFee * 2.5 + 500), // What expediters charge
            yourAdvantage: 'Licensed, insured, and properly permitted work'
        }
    };
}

/**
 * Generate pricing explanation for client communication
 */
function generateClientExplanation(pricingData) {
    const { permitFee, labor, clientCharge, summary } = pricingData;

    return {
        breakdown: [
            {
                item: 'Permit Fee',
                description: `${pricingData.jurisdiction} building department fee`,
                cost: permitFee.permitFee
            },
            {
                item: 'Document Preparation',
                description: `${labor.breakdown.documentPrep.hours} hrs @ $${labor.hourlyRate}/hr`,
                cost: labor.breakdown.documentPrep.cost
            },
            {
                item: 'Plan Drawing',
                description: `${labor.breakdown.planDrawing.hours} hrs @ $${labor.hourlyRate}/hr`,
                cost: labor.breakdown.planDrawing.cost
            },
            {
                item: 'Permit Submission',
                description: `${labor.breakdown.submission.hours} hrs @ $${labor.hourlyRate}/hr`,
                cost: labor.breakdown.submission.cost
            },
            {
                item: 'Inspection Attendance',
                description: `${labor.breakdown.inspection.hours} hrs @ $${labor.hourlyRate}/hr`,
                cost: labor.breakdown.inspection.cost
            },
            {
                item: 'Administrative Costs',
                description: 'Processing, follow-up, corrections',
                cost: labor.breakdown.corrections.cost + clientCharge.permitFeeMarkup
            }
        ],
        total: clientCharge.recommendedCharge,
        timeline: permitFee.processingTime,
        valueProposition: [
            'Licensed and insured contractor',
            'Proper permit pulled and passed inspection',
            'Increased home value and insurability',
            'Legal protection for homeowner',
            'Code-compliant work guaranteed'
        ]
    };
}

module.exports = {
    calculateFullPricing,
    generateClientExplanation,
    normalizeJobType
};
