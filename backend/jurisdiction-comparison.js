/**
 * Multi-Jurisdiction Comparison Engine
 * Allows contractors to compare permit requirements across multiple cities
 */

const { permitFees, laborTimes, markupRecommendations } = require('./permit-fee-database');
const { calculateFullPricing } = require('./pricing-calculator');

/**
 * Get list of all supported jurisdictions
 */
function getSupportedJurisdictions() {
    const jurisdictions = Object.keys(permitFees)
        .filter(key => key !== 'default')
        .map(location => {
            const [city, state] = location.split(', ');
            return {
                location,
                city,
                state,
                displayName: location
            };
        });

    return jurisdictions;
}

/**
 * Compare pricing across multiple jurisdictions
 */
function compareJurisdictions(jurisdictions, jobType) {
    const comparisons = jurisdictions.map(location => {
        const pricing = calculateFullPricing(location, jobType, 5000);

        return {
            location,
            pricing: {
                permitFee: pricing.permitFee.permitFee,
                laborCost: pricing.labor.laborCost,
                totalCost: pricing.summary.totalCost,
                recommendedCharge: pricing.summary.recommendedCharge,
                profit: pricing.summary.yourProfit,
                profitMargin: pricing.summary.profitMargin,
                processingTime: pricing.summary.processingTime,
                timeInvestment: pricing.summary.timeInvestment
            },
            permitDetails: {
                baseFee: pricing.permitFee.baseFee,
                valuationRate: pricing.permitFee.valuationRate,
                expediteFee: pricing.permitFee.expediteFee,
                expediteTime: pricing.permitFee.expediteTime,
                processingTime: pricing.permitFee.processingTime
            }
        };
    });

    // Calculate differences and rankings
    const permitFees = comparisons.map(c => c.pricing.permitFee);
    const recommendedCharges = comparisons.map(c => c.pricing.recommendedCharge);

    const analysis = {
        lowestPermitFee: Math.min(...permitFees),
        highestPermitFee: Math.max(...permitFees),
        averagePermitFee: Math.round(permitFees.reduce((a, b) => a + b, 0) / permitFees.length),
        lowestRecommendedCharge: Math.min(...recommendedCharges),
        highestRecommendedCharge: Math.max(...recommendedCharges),
        averageRecommendedCharge: Math.round(recommendedCharges.reduce((a, b) => a + b, 0) / recommendedCharges.length),
        variance: Math.max(...recommendedCharges) - Math.min(...recommendedCharges)
    };

    // Rank jurisdictions
    const ranked = comparisons
        .map((comp, index) => ({
            ...comp,
            rank: {
                byPermitFee: null,
                byTotalCharge: null,
                byProcessingTime: null
            }
        }))
        .sort((a, b) => a.pricing.permitFee - b.pricing.permitFee);

    ranked.forEach((item, index) => {
        item.rank.byPermitFee = index + 1;
    });

    ranked.sort((a, b) => a.pricing.recommendedCharge - b.pricing.recommendedCharge);
    ranked.forEach((item, index) => {
        item.rank.byTotalCharge = index + 1;
    });

    // Parse processing times for ranking (convert to weeks)
    const parseProcessingTime = (timeStr) => {
        if (timeStr.includes('week')) {
            const match = timeStr.match(/(\d+)-?(\d+)?/);
            return match ? parseInt(match[1]) : 999;
        } else if (timeStr.includes('month')) {
            const match = timeStr.match(/(\d+)-?(\d+)?/);
            return match ? parseInt(match[1]) * 4 : 999;
        }
        return 999;
    };

    ranked.sort((a, b) => {
        const aWeeks = parseProcessingTime(a.pricing.processingTime);
        const bWeeks = parseProcessingTime(b.pricing.processingTime);
        return aWeeks - bWeeks;
    });
    ranked.forEach((item, index) => {
        item.rank.byProcessingTime = index + 1;
    });

    return {
        comparisons: ranked,
        analysis,
        jobType
    };
}

/**
 * Highlight key differences between jurisdictions
 */
function identifyKeyDifferences(comparisons) {
    if (comparisons.length < 2) return [];

    const differences = [];
    const first = comparisons[0];

    // Check permit fee variance
    const permitFeeVariance = comparisons.reduce((max, curr) => {
        return Math.max(max, Math.abs(curr.pricing.permitFee - first.pricing.permitFee));
    }, 0);

    if (permitFeeVariance > 50) {
        differences.push({
            type: 'permitFee',
            severity: 'high',
            message: `Permit fees vary by $${permitFeeVariance} across jurisdictions`,
            details: `Lowest: $${Math.min(...comparisons.map(c => c.pricing.permitFee))} | Highest: $${Math.max(...comparisons.map(c => c.pricing.permitFee))}`
        });
    }

    // Check processing time variance
    const processingTimes = comparisons.map(c => c.pricing.processingTime);
    const uniqueTimes = [...new Set(processingTimes)];

    if (uniqueTimes.length > 1) {
        differences.push({
            type: 'processingTime',
            severity: 'medium',
            message: `Processing times vary significantly`,
            details: processingTimes.join(' vs ')
        });
    }

    // Check total charge variance
    const chargeVariance = Math.max(...comparisons.map(c => c.pricing.recommendedCharge)) -
                          Math.min(...comparisons.map(c => c.pricing.recommendedCharge));

    if (chargeVariance > 100) {
        differences.push({
            type: 'totalCharge',
            severity: 'high',
            message: `You should charge $${chargeVariance} more in some jurisdictions`,
            details: `This represents ${Math.round((chargeVariance / Math.min(...comparisons.map(c => c.pricing.recommendedCharge))) * 100)}% difference`
        });
    }

    // Check expedite fees
    const expediteFees = comparisons.map(c => c.permitDetails.expediteFee);
    const expediteVariance = Math.max(...expediteFees) - Math.min(...expediteFees);

    if (expediteVariance > 100) {
        differences.push({
            type: 'expediteFee',
            severity: 'low',
            message: `Expedite fees vary by $${expediteVariance}`,
            details: `Range: $${Math.min(...expediteFees)} - $${Math.max(...expediteFees)}`
        });
    }

    return differences;
}

/**
 * Generate quick reference guide for a contractor's common jurisdictions
 */
function generateQuickReference(jurisdictions, jobTypes) {
    const reference = {};

    jobTypes.forEach(jobType => {
        reference[jobType] = jurisdictions.map(location => {
            const pricing = calculateFullPricing(location, jobType, 5000);
            return {
                location,
                permitFee: pricing.permitFee.permitFee,
                recommendedCharge: pricing.summary.recommendedCharge,
                processingTime: pricing.permitFee.processingTime
            };
        });
    });

    return reference;
}

/**
 * Smart jurisdiction suggestions based on contractor location
 */
function suggestNearbyJurisdictions(baseLocation) {
    const suggestions = {
        'Los Angeles, CA': ['San Diego, CA', 'San Francisco, CA'],
        'San Diego, CA': ['Los Angeles, CA'],
        'San Francisco, CA': ['Los Angeles, CA', 'San Diego, CA'],
        'Austin, TX': ['Houston, TX'],
        'Houston, TX': ['Austin, TX'],
        'Miami, FL': [],
        'Chicago, IL': [],
        'New York, NY': []
    };

    return suggestions[baseLocation] || [];
}

/**
 * Calculate optimal pricing strategy across jurisdictions
 */
function calculateOptimalStrategy(jurisdictions, jobType) {
    const comparison = compareJurisdictions(jurisdictions, jobType);

    const strategy = {
        jurisdictions: comparison.comparisons.map(comp => ({
            location: comp.location,
            recommendedCharge: comp.pricing.recommendedCharge,
            competitivePosition: getCompetitivePosition(comp, comparison.analysis),
            pricingAdvice: getPricingAdvice(comp, comparison.analysis)
        })),
        summary: {
            totalMarketSize: comparison.comparisons.length,
            averageCharge: comparison.analysis.averageRecommendedCharge,
            bestMargin: Math.max(...comparison.comparisons.map(c => c.pricing.profitMargin)),
            worstMargin: Math.min(...comparison.comparisons.map(c => c.pricing.profitMargin)),
            fastestProcessing: comparison.comparisons.reduce((fastest, curr) => {
                const currWeeks = parseProcessingWeeks(curr.pricing.processingTime);
                const fastestWeeks = parseProcessingWeeks(fastest.pricing.processingTime);
                return currWeeks < fastestWeeks ? curr : fastest;
            }).location
        }
    };

    return strategy;
}

function getCompetitivePosition(comp, analysis) {
    const charge = comp.pricing.recommendedCharge;
    const avg = analysis.averageRecommendedCharge;

    if (charge < avg * 0.9) return 'budget-friendly';
    if (charge > avg * 1.1) return 'premium';
    return 'competitive';
}

function getPricingAdvice(comp, analysis) {
    const charge = comp.pricing.recommendedCharge;
    const avg = analysis.averageRecommendedCharge;
    const diff = charge - avg;

    if (Math.abs(diff) < 50) {
        return 'Pricing is aligned with market average';
    } else if (diff > 0) {
        return `${Math.round((diff / avg) * 100)}% above average - justify with faster service or premium quality`;
    } else {
        return `${Math.round((Math.abs(diff) / avg) * 100)}% below average - opportunity to increase margins`;
    }
}

function parseProcessingWeeks(timeStr) {
    if (timeStr.includes('week')) {
        const match = timeStr.match(/(\d+)-?(\d+)?/);
        return match ? parseInt(match[1]) : 999;
    } else if (timeStr.includes('month')) {
        const match = timeStr.match(/(\d+)-?(\d+)?/);
        return match ? parseInt(match[1]) * 4 : 999;
    }
    return 999;
}

module.exports = {
    getSupportedJurisdictions,
    compareJurisdictions,
    identifyKeyDifferences,
    generateQuickReference,
    suggestNearbyJurisdictions,
    calculateOptimalStrategy
};
