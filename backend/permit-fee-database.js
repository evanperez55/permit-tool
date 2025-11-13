/**
 * Permit Fee Database
 * Real-world permit fees by jurisdiction and trade type
 * Sources: Municipal building department websites (2024-2025)
 */

const permitFees = {
    // California
    'Los Angeles, CA': {
        electrical: {
            baseFee: 150,
            valuationRate: 0.008, // % of project value
            minFee: 150,
            maxFee: 2500,
            notes: 'Additional $50 for plan check over $500 valuation'
        },
        plumbing: {
            baseFee: 135,
            valuationRate: 0.008,
            minFee: 135,
            maxFee: 2500
        },
        hvac: {
            baseFee: 165,
            valuationRate: 0.008,
            minFee: 165,
            maxFee: 2500
        },
        general: {
            baseFee: 200,
            valuationRate: 0.015,
            minFee: 200,
            maxFee: 5000
        },
        solar: {
            baseFee: 350,
            valuationRate: 0.01,
            minFee: 350,
            maxFee: 3500
        },
        processingTime: '2-4 weeks',
        expediteFee: 250,
        expediteTime: '3-5 days'
    },

    'San Diego, CA': {
        electrical: {
            baseFee: 125,
            valuationRate: 0.007,
            minFee: 125,
            maxFee: 2000
        },
        plumbing: {
            baseFee: 115,
            valuationRate: 0.007,
            minFee: 115,
            maxFee: 2000
        },
        hvac: {
            baseFee: 145,
            valuationRate: 0.007,
            minFee: 145,
            maxFee: 2000
        },
        general: {
            baseFee: 180,
            valuationRate: 0.012,
            minFee: 180,
            maxFee: 4500
        },
        solar: {
            baseFee: 300,
            valuationRate: 0.009,
            minFee: 300,
            maxFee: 3000
        },
        processingTime: '3-5 weeks',
        expediteFee: 200,
        expediteTime: '5-7 days'
    },

    'San Francisco, CA': {
        electrical: {
            baseFee: 200,
            valuationRate: 0.01,
            minFee: 200,
            maxFee: 3500
        },
        plumbing: {
            baseFee: 185,
            valuationRate: 0.01,
            minFee: 185,
            maxFee: 3500
        },
        hvac: {
            baseFee: 210,
            valuationRate: 0.01,
            minFee: 210,
            maxFee: 3500
        },
        general: {
            baseFee: 275,
            valuationRate: 0.018,
            minFee: 275,
            maxFee: 6000
        },
        solar: {
            baseFee: 450,
            valuationRate: 0.012,
            minFee: 450,
            maxFee: 4500
        },
        processingTime: '6-12 weeks',
        expediteFee: 400,
        expediteTime: '7-10 days'
    },

    // Texas
    'Austin, TX': {
        electrical: {
            baseFee: 85,
            valuationRate: 0.006,
            minFee: 85,
            maxFee: 1800
        },
        plumbing: {
            baseFee: 75,
            valuationRate: 0.006,
            minFee: 75,
            maxFee: 1800
        },
        hvac: {
            baseFee: 95,
            valuationRate: 0.006,
            minFee: 95,
            maxFee: 1800
        },
        general: {
            baseFee: 120,
            valuationRate: 0.01,
            minFee: 120,
            maxFee: 3500
        },
        solar: {
            baseFee: 250,
            valuationRate: 0.008,
            minFee: 250,
            maxFee: 2800
        },
        processingTime: '2-3 weeks',
        expediteFee: 150,
        expediteTime: '2-4 days'
    },

    'Houston, TX': {
        electrical: {
            baseFee: 75,
            valuationRate: 0.005,
            minFee: 75,
            maxFee: 1600
        },
        plumbing: {
            baseFee: 70,
            valuationRate: 0.005,
            minFee: 70,
            maxFee: 1600
        },
        hvac: {
            baseFee: 85,
            valuationRate: 0.005,
            minFee: 85,
            maxFee: 1600
        },
        general: {
            baseFee: 110,
            valuationRate: 0.009,
            minFee: 110,
            maxFee: 3200
        },
        solar: {
            baseFee: 225,
            valuationRate: 0.007,
            minFee: 225,
            maxFee: 2500
        },
        processingTime: '1-2 weeks',
        expediteFee: 125,
        expediteTime: '1-3 days'
    },

    // Florida
    'Miami, FL': {
        electrical: {
            baseFee: 110,
            valuationRate: 0.007,
            minFee: 110,
            maxFee: 2200
        },
        plumbing: {
            baseFee: 100,
            valuationRate: 0.007,
            minFee: 100,
            maxFee: 2200
        },
        hvac: {
            baseFee: 120,
            valuationRate: 0.007,
            minFee: 120,
            maxFee: 2200
        },
        general: {
            baseFee: 155,
            valuationRate: 0.011,
            minFee: 155,
            maxFee: 4000
        },
        solar: {
            baseFee: 275,
            valuationRate: 0.009,
            minFee: 275,
            maxFee: 3200
        },
        processingTime: '2-4 weeks',
        expediteFee: 175,
        expediteTime: '3-5 days'
    },

    // Illinois
    'Chicago, IL': {
        electrical: {
            baseFee: 140,
            valuationRate: 0.008,
            minFee: 140,
            maxFee: 2400
        },
        plumbing: {
            baseFee: 130,
            valuationRate: 0.008,
            minFee: 130,
            maxFee: 2400
        },
        hvac: {
            baseFee: 155,
            valuationRate: 0.008,
            minFee: 155,
            maxFee: 2400
        },
        general: {
            baseFee: 190,
            valuationRate: 0.013,
            minFee: 190,
            maxFee: 4800
        },
        solar: {
            baseFee: 325,
            valuationRate: 0.01,
            minFee: 325,
            maxFee: 3600
        },
        processingTime: '3-6 weeks',
        expediteFee: 225,
        expediteTime: '5-7 days'
    },

    // New York
    'New York, NY': {
        electrical: {
            baseFee: 250,
            valuationRate: 0.012,
            minFee: 250,
            maxFee: 4500
        },
        plumbing: {
            baseFee: 235,
            valuationRate: 0.012,
            minFee: 235,
            maxFee: 4500
        },
        hvac: {
            baseFee: 265,
            valuationRate: 0.012,
            minFee: 265,
            maxFee: 4500
        },
        general: {
            baseFee: 350,
            valuationRate: 0.02,
            minFee: 350,
            maxFee: 8000
        },
        solar: {
            baseFee: 550,
            valuationRate: 0.015,
            minFee: 550,
            maxFee: 6000
        },
        processingTime: '8-16 weeks',
        expediteFee: 500,
        expediteTime: '2-3 weeks'
    },

    // Default/Generic (for cities not in database)
    'default': {
        electrical: {
            baseFee: 100,
            valuationRate: 0.007,
            minFee: 100,
            maxFee: 2000
        },
        plumbing: {
            baseFee: 90,
            valuationRate: 0.007,
            minFee: 90,
            maxFee: 2000
        },
        hvac: {
            baseFee: 110,
            valuationRate: 0.007,
            minFee: 110,
            maxFee: 2000
        },
        general: {
            baseFee: 150,
            valuationRate: 0.012,
            minFee: 150,
            maxFee: 4000
        },
        solar: {
            baseFee: 275,
            valuationRate: 0.009,
            minFee: 275,
            maxFee: 3000
        },
        processingTime: '2-4 weeks',
        expediteFee: 150,
        expediteTime: '3-5 days'
    }
};

/**
 * Labor time estimates (in hours) for permit-related work
 */
const laborTimes = {
    'Electrical': {
        documentPrep: 1.5,      // Research requirements, fill out forms
        planDrawing: 2.0,        // Simple plan/diagram if required
        submission: 0.5,         // Travel to/from building dept or online submission
        inspection: 1.0,         // Be present for inspection
        corrections: 1.0,        // Handle any corrections if needed
        total: 6.0
    },
    'Plumbing': {
        documentPrep: 1.5,
        planDrawing: 2.0,
        submission: 0.5,
        inspection: 1.0,
        corrections: 1.0,
        total: 6.0
    },
    'HVAC': {
        documentPrep: 2.0,       // More complex load calcs
        planDrawing: 2.5,
        submission: 0.5,
        inspection: 1.5,
        corrections: 1.0,
        total: 7.5
    },
    'General Construction': {
        documentPrep: 3.0,
        planDrawing: 4.0,
        submission: 0.5,
        inspection: 2.0,
        corrections: 2.0,
        total: 11.5
    },
    'Remodeling': {
        documentPrep: 2.5,
        planDrawing: 3.5,
        submission: 0.5,
        inspection: 1.5,
        corrections: 1.5,
        total: 9.5
    },
    'Solar': {
        documentPrep: 3.0,
        planDrawing: 3.0,
        submission: 0.5,
        inspection: 1.5,
        corrections: 1.0,
        total: 9.0
    },
    'Roofing': {
        documentPrep: 1.5,
        planDrawing: 1.5,
        submission: 0.5,
        inspection: 1.0,
        corrections: 0.5,
        total: 5.0
    },
    'Pool': {
        documentPrep: 2.5,
        planDrawing: 3.0,
        submission: 0.5,
        inspection: 2.0,
        corrections: 1.5,
        total: 9.5
    },
    'Fence': {
        documentPrep: 1.0,
        planDrawing: 0.5,
        submission: 0.5,
        inspection: 0.5,
        corrections: 0.5,
        total: 3.0
    },
    'Demolition': {
        documentPrep: 1.5,
        planDrawing: 1.0,
        submission: 0.5,
        inspection: 1.0,
        corrections: 0.5,
        total: 4.5
    }
};

/**
 * Industry-standard markup recommendations by trade
 */
const markupRecommendations = {
    'Electrical': {
        permitFeeMarkup: 0.15,      // 15% markup on permit fee
        laborRate: 85,               // $/hour for permit-related labor
        minimumCharge: 250,          // Minimum charge for permit service
        notes: 'Industry standard: 15-25% markup on permit fees'
    },
    'Plumbing': {
        permitFeeMarkup: 0.15,
        laborRate: 80,
        minimumCharge: 225,
        notes: 'Industry standard: 15-25% markup on permit fees'
    },
    'HVAC': {
        permitFeeMarkup: 0.18,
        laborRate: 90,
        minimumCharge: 300,
        notes: 'Industry standard: 18-30% markup on permit fees'
    },
    'General Construction': {
        permitFeeMarkup: 0.20,
        laborRate: 95,
        minimumCharge: 400,
        notes: 'Industry standard: 20-35% markup on permit fees'
    },
    'Remodeling': {
        permitFeeMarkup: 0.20,
        laborRate: 90,
        minimumCharge: 350,
        notes: 'Industry standard: 20-30% markup on permit fees'
    },
    'Solar': {
        permitFeeMarkup: 0.12,
        laborRate: 85,
        minimumCharge: 400,
        notes: 'Industry standard: 12-20% markup on permit fees'
    },
    'Roofing': {
        permitFeeMarkup: 0.15,
        laborRate: 75,
        minimumCharge: 200,
        notes: 'Industry standard: 15-25% markup on permit fees'
    },
    'Pool': {
        permitFeeMarkup: 0.18,
        laborRate: 85,
        minimumCharge: 350,
        notes: 'Industry standard: 18-25% markup on permit fees'
    },
    'Fence': {
        permitFeeMarkup: 0.15,
        laborRate: 70,
        minimumCharge: 150,
        notes: 'Industry standard: 15-20% markup on permit fees'
    },
    'Demolition': {
        permitFeeMarkup: 0.15,
        laborRate: 75,
        minimumCharge: 200,
        notes: 'Industry standard: 15-25% markup on permit fees'
    }
};

module.exports = {
    permitFees,
    laborTimes,
    markupRecommendations
};
