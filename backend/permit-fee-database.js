/**
 * Permit Fee Database
 * Real-world permit fees by jurisdiction and trade type
 * Sources: Municipal building department websites (2024-2025)
 */

/**
 * Data Quality Tracking
 * Tracks which jurisdictions have verified vs estimated data
 */
const dataQuality = {
    'Los Angeles, CA': {
        quality: 'verified',
        source: 'LADBS Official Fee Schedule',
        lastVerified: '2024-10-15',
        url: 'https://www.ladbs.org/services/core-services/plan-check-inspection/permits-information',
        confidence: 'high',
        notes: 'Data verified from official LADBS fee schedule'
    },
    'San Diego, CA': {
        quality: 'verified',
        source: 'City of San Diego IB-103 MEP Fee Schedule (Jan 2026)',
        lastVerified: '2026-02-19',
        url: 'https://www.sandiego.gov/development-services/forms-publications/information-bulletins/103',
        confidence: 'high',
        notes: 'Per-circuit/per-item fee structure from City of San Diego IB-103. $164.63 base for first 5 circuits or panel upgrade.'
    },
    'San Francisco, CA': {
        quality: 'verified',
        source: 'SF Department of Building Inspection 2025 Electrical Permit Fee Schedule',
        lastVerified: '2025-11-16',
        url: 'https://media.api.sf.gov/documents/Table_1A-E_-_Electrical_Permit_Issuance_and_Inspection_2025.pdf',
        confidence: 'high',
        notes: 'Data automatically scraped from official 2025 fee schedule. PDF hash: af29f84096cc6d3e813881c8bfeee809. Hourly rate: $405/hr regular, $477/hr off-hours.'
    },
    'Austin, TX': {
        quality: 'verified',
        source: 'Residential Building Plan Review & Inspection Permit Fees (FY 2025-26)',
        lastVerified: '2025-11-16',
        url: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/Fees_Residential.pdf',
        confidence: 'high',
        notes: 'Data automatically scraped from official FY 2025-26 fee schedule. Effective October 1, 2025. Significant fee increases: +99% electrical, +125% plumbing, +78% HVAC from prior year.'
    },
    'Houston, TX': {
        quality: 'verified',
        source: '2025 Building Code Enforcement Fee Schedule',
        lastVerified: '2025-11-16',
        url: 'https://www.houstonpermittingcenter.org/media/2636/download',
        confidence: 'high',
        notes: 'Data automatically scraped from official 2025 fee schedule. Minor updates: -$5 electrical, -$10 plumbing from prior database values.'
    },
    'Miami, FL': {
        quality: 'verified',
        source: 'Miami-Dade County Electrical Fee Sheet',
        lastVerified: '2025-11-16',
        url: 'https://www.miamidade.gov/permits/library/fees/electrical-fee-sheet.pdf',
        confidence: 'high',
        notes: 'Data automatically scraped from official Miami-Dade electrical fee schedule. PDF hash: a461b8e63ed6c9259316cb19938afa5f'
    },
    'Chicago, IL': {
        quality: 'verified',
        source: 'Chicago Admin Code 14A-12-1204.2 Stand-Alone Permit Fees',
        lastVerified: '2026-02-19',
        url: 'https://www.chicago.gov/content/dam/city/depts/bldgs/general/Permitfees/2025%20Bldg%20Permit%20Fee%20Tables.pdf',
        confidence: 'high',
        notes: 'Flat/tiered fee structure per Chicago Admin Code 14A-12-1204.2. Verified against UpCodes and City of Chicago building permit guides.'
    },
    'Milwaukee, WI': {
        quality: 'verified',
        source: 'Milwaukee Code of Ordinances Chapter 200-33 & DNS Fee Schedule',
        lastVerified: '2025-01-13',
        url: 'https://city.milwaukee.gov/DNS/permits',
        confidence: 'high',
        notes: 'Data verified from official City of Milwaukee fee schedule (revised January 3, 2025)'
    },
    'Phoenix, AZ': {
        quality: 'verified',
        source: 'Phoenix Planning & Development Fee Schedule',
        lastVerified: '2025-11-16',
        url: 'https://www.phoenix.gov/pddsite/Documents/TRT/dsd_trt_pdf_00042.pdf',
        confidence: 'high',
        notes: 'Data automatically scraped from official fee schedule. PDF hash: 61797847dd530ea3da1fe4a80427df2c. 56-page comprehensive fee schedule.'
    },
    'New York, NY': {
        quality: 'verified',
        source: 'NYC Department of Buildings Permit Fee Structure',
        lastVerified: '2025-11-16',
        url: 'https://www.nyc.gov/assets/buildings/pdf/new_permit_fee_structure.pdf',
        confidence: 'medium',
        notes: 'Data automatically scraped from official fee schedule. WARNING: Fee schedule dated June 9, 2016 - may be outdated. Needs verification with current NYC DOB rates. PDF hash: 6829c03e141f9e31eef3736019f8b49c'
    },
    // Regional default quality markers
    'default-midwest': {
        quality: 'estimated',
        source: 'Average of Chicago and Milwaukee verified data',
        lastVerified: '2025-01-13',
        url: null,
        confidence: 'medium',
        notes: 'Regional estimate for Midwest cities based on Chicago and Milwaukee averages. Actual fees may vary by 20-40%. Please verify with your local building department.'
    },
    'default-texas': {
        quality: 'estimated',
        source: 'Average of Houston and Austin verified data',
        lastVerified: '2025-01-13',
        url: null,
        confidence: 'medium',
        notes: 'Regional estimate for Texas cities based on Houston and Austin averages. Actual fees may vary by 20-30%. Please verify with your local building department.'
    },
    'default-california': {
        quality: 'estimated',
        source: 'Average of Los Angeles, San Diego, and San Francisco verified data',
        lastVerified: '2025-01-13',
        url: null,
        confidence: 'medium',
        notes: 'Regional estimate for California cities based on LA, SD, and SF averages. Actual fees may vary by 20-40%. Please verify with your local building department.'
    },
    'default-mountain-west': {
        quality: 'estimated',
        source: 'Based on Phoenix verified data with regional adjustments',
        lastVerified: '2025-01-13',
        url: null,
        confidence: 'medium',
        notes: 'Regional estimate for Mountain West cities (CO, UT, NV, AZ). Actual fees may vary by 30-50%. Please verify with your local building department.'
    },
    'default-southeast': {
        quality: 'estimated',
        source: 'Based on Miami verified data with regional adjustments',
        lastVerified: '2025-01-13',
        url: null,
        confidence: 'medium',
        notes: 'Regional estimate for Southeast cities (GA, FL, AL, SC, NC). Actual fees may vary by 25-45%. Please verify with your local building department.'
    },
    'default-northeast': {
        quality: 'estimated',
        source: 'Based on NYC verified data with regional adjustments',
        lastVerified: '2025-01-13',
        url: null,
        confidence: 'medium',
        notes: 'Regional estimate for Northeast cities (PA, MA, CT, NJ). Actual fees may vary by 30-50%. Please verify with your local building department.'
    },
    'default': {
        quality: 'estimated',
        source: 'National average of all verified cities',
        lastVerified: '2025-01-13',
        url: null,
        confidence: 'low',
        notes: 'Generic estimate when region cannot be determined. Actual fees may vary significantly (40-100%). Please verify with your local building department before quoting.'
    }
};

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
            baseFee: 164.63,
            valuationRate: null,
            minFee: 164.63,
            maxFee: 2000,
            notes: 'City of San Diego IB-103 per-circuit pricing. $164.63 for first 5 circuits or panel upgrade. $48.85 per additional circuit (6-10).'
        },
        plumbing: {
            baseFee: 164.63,
            valuationRate: null,
            minFee: 164.63,
            maxFee: 2000,
            notes: 'City of San Diego IB-103 MEP fee schedule. $164.63 base for residential plumbing permits.'
        },
        hvac: {
            baseFee: 164.63,
            valuationRate: null,
            minFee: 164.63,
            maxFee: 2000,
            notes: 'City of San Diego IB-103 MEP fee schedule. $164.63 base for residential mechanical permits.'
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
            baseFee: 405,
            valuationRate: null,
            minFee: 405,
            maxFee: 3500,
            notes: 'Scraped from 2025 fee schedule - $405/hr hourly rate for permit issuance/inspection. Complex tiered structure based on outlets/devices.'
        },
        plumbing: {
            baseFee: 405,
            valuationRate: null,
            minFee: 405,
            maxFee: 3500,
            notes: 'Estimated based on electrical hourly rate structure'
        },
        hvac: {
            baseFee: 860,
            valuationRate: null,
            minFee: 860,
            maxFee: 3500,
            notes: 'Scraped from 2025 fee schedule - mechanical work base fee'
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
            baseFee: 169,
            valuationRate: 0.006,
            minFee: 169,
            maxFee: 1800
        },
        plumbing: {
            baseFee: 169,
            valuationRate: 0.006,
            minFee: 169,
            maxFee: 1800
        },
        hvac: {
            baseFee: 169,
            valuationRate: 0.006,
            minFee: 169,
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
            baseFee: 70,
            valuationRate: 0.005,
            minFee: 70,
            maxFee: 1600
        },
        plumbing: {
            baseFee: 60,
            valuationRate: 0.005,
            minFee: 60,
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
            baseFee: 166.63,
            valuationRate: null,
            minFee: 166.63,
            maxFee: 2200,
            notes: 'Scraped from Miami-Dade electrical fee sheet - base fee for standard permits'
        },
        plumbing: {
            baseFee: 166.63,
            valuationRate: null,
            minFee: 166.63,
            maxFee: 2200,
            notes: 'Estimated based on electrical fee structure'
        },
        hvac: {
            baseFee: 166.63,
            valuationRate: null,
            minFee: 166.63,
            maxFee: 2200,
            notes: 'Estimated based on electrical fee structure'
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
            baseFee: 150,
            valuationRate: null,
            minFee: 75,
            maxFee: 2250,
            notes: 'Flat/tiered per Chicago Admin Code 14A-12-1204.2. $150 for up to 10 circuits, $75 min for repairs/alterations, up to $2,250 for 81+ circuits.'
        },
        plumbing: {
            baseFee: 150,
            valuationRate: null,
            minFee: 75,
            maxFee: 400,
            notes: 'Flat/tiered per Chicago Admin Code 14A-12-1204.2. $75 for water heater replacement, $150 for piping, $400 for pool/hot tub.'
        },
        hvac: {
            baseFee: 150,
            valuationRate: null,
            minFee: 75,
            maxFee: 600,
            notes: 'Flat/tiered per Chicago Admin Code 14A-12-1204.2. $75 for duct/gas piping, $150 for new AC, $600 for chiller/cooling tower.'
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

    // Wisconsin
    'Milwaukee, WI': {
        electrical: {
            baseFee: 70,
            valuationRate: 0.014,  // 1.4% IT & Training surcharge per Milwaukee ordinance Ch. 200-33
            minFee: 70,
            maxFee: 2000,
            notes: 'Min $70 for 1-2 family homes, $80 for condos + 1.4% surcharge + $5 processing fee. Per Ch. 200-33.'
        },
        plumbing: {
            baseFee: 200,
            valuationRate: 0.016,  // 1.6% of project cost per Milwaukee Code
            minFee: 200,
            maxFee: 2200,
            notes: 'Commercial plumbing: 1.6% of project cost, min $200'
        },
        hvac: {
            baseFee: 200,
            valuationRate: 0.016,  // 1.6% of cost per Milwaukee ordinance
            minFee: 200,
            maxFee: 2200,
            notes: 'Min $200 for 1-2 family, $300+ for multi-family'
        },
        general: {
            baseFee: 200,
            valuationRate: 0.016,
            minFee: 200,
            maxFee: 4500,
            notes: 'Residential building permits include $20 processing fee per permit'
        },
        solar: {
            baseFee: 300,
            valuationRate: 0.014,
            minFee: 300,
            maxFee: 3000
        },
        processingTime: '4-8 weeks',
        expediteFee: 250,  // 50-100% increase for expedited review
        expediteTime: '1-3 weeks'
    },

    // Arizona
    'Phoenix, AZ': {
        electrical: {
            baseFee: 150,
            valuationRate: 0.003,  // 0.3% of valuation (scraped data)
            minFee: 300,
            maxFee: 2500,
            notes: 'Scraped from Phoenix fee schedule - $150 base + 0.3% valuation, $300 minimum for most permits'
        },
        plumbing: {
            baseFee: null,
            valuationRate: 0.003,  // 0.3% of valuation
            minFee: 300,
            maxFee: 2500,
            notes: 'Scraped from Phoenix fee schedule - 0.3% valuation rate, $300 minimum'
        },
        hvac: {
            baseFee: null,
            valuationRate: 0.003,  // 0.3% of valuation
            minFee: 300,
            maxFee: 2500,
            notes: 'Scraped from Phoenix fee schedule - 0.3% valuation rate, $300 minimum'
        },
        general: {
            baseFee: 150,
            valuationRate: 0.009,  // Rate decreases at higher valuations
            minFee: 150,
            maxFee: 7000,
            notes: 'Valuation-based system; rates decrease for higher value projects'
        },
        solar: {
            baseFee: 150,
            valuationRate: 0.009,
            minFee: 150,
            maxFee: 4000
        },
        processingTime: '2-4 weeks',
        expediteFee: 200,
        expediteTime: '3-5 days'
    },

    // New York
    'New York, NY': {
        electrical: {
            baseFee: null,
            valuationRate: 0.02490,  // 2.49% of valuation (scraped from 2016 fee schedule)
            minFee: 100,
            maxFee: 4500,
            notes: 'Scraped from NYC DOB fee structure (dated June 9, 2016) - may be outdated. 2.49% valuation rate, $100 minimum.'
        },
        plumbing: {
            baseFee: null,
            valuationRate: 0.02490,  // 2.49% of valuation
            minFee: 100,
            maxFee: 4500,
            notes: 'Scraped from NYC DOB fee structure (dated June 9, 2016) - may be outdated. Verify current rates.'
        },
        hvac: {
            baseFee: null,
            valuationRate: 0.02490,  // 2.49% of valuation
            minFee: 100,
            maxFee: 4500,
            notes: 'Scraped from NYC DOB fee structure (dated June 9, 2016) - may be outdated. Verify current rates.'
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

    // REGIONAL DEFAULTS (for cities not in database)
    // These are averages of verified cities in each region for better accuracy

    // Midwest Default (based on Chicago + Milwaukee average)
    'default-midwest': {
        electrical: {
            baseFee: 110,
            valuationRate: 0.011,
            minFee: 110,
            maxFee: 2200
        },
        plumbing: {
            baseFee: 165,
            valuationRate: 0.012,
            minFee: 165,
            maxFee: 2300
        },
        hvac: {
            baseFee: 178,
            valuationRate: 0.012,
            minFee: 178,
            maxFee: 2300
        },
        general: {
            baseFee: 195,
            valuationRate: 0.0145,
            minFee: 195,
            maxFee: 4650
        },
        solar: {
            baseFee: 313,
            valuationRate: 0.012,
            minFee: 313,
            maxFee: 3300
        },
        processingTime: '3-7 weeks',
        expediteFee: 238,
        expediteTime: '2-4 weeks'
    },

    // Texas Default (based on Houston + Austin average)
    'default-texas': {
        electrical: {
            baseFee: 80,
            valuationRate: 0.0055,
            minFee: 80,
            maxFee: 1700
        },
        plumbing: {
            baseFee: 73,
            valuationRate: 0.0055,
            minFee: 73,
            maxFee: 1700
        },
        hvac: {
            baseFee: 90,
            valuationRate: 0.0055,
            minFee: 90,
            maxFee: 1700
        },
        general: {
            baseFee: 115,
            valuationRate: 0.0095,
            minFee: 115,
            maxFee: 3350
        },
        solar: {
            baseFee: 238,
            valuationRate: 0.0075,
            minFee: 238,
            maxFee: 2650
        },
        processingTime: '1-3 weeks',
        expediteFee: 138,
        expediteTime: '1-3 days'
    },

    // California Default (based on LA + SD + SF average)
    'default-california': {
        electrical: {
            baseFee: 158,
            valuationRate: 0.0083,
            minFee: 158,
            maxFee: 2667
        },
        plumbing: {
            baseFee: 145,
            valuationRate: 0.0083,
            minFee: 145,
            maxFee: 2667
        },
        hvac: {
            baseFee: 173,
            valuationRate: 0.0083,
            minFee: 173,
            maxFee: 2667
        },
        general: {
            baseFee: 218,
            valuationRate: 0.015,
            minFee: 218,
            maxFee: 5167
        },
        solar: {
            baseFee: 367,
            valuationRate: 0.0103,
            minFee: 367,
            maxFee: 3667
        },
        processingTime: '4-8 weeks',
        expediteFee: 283,
        expediteTime: '5-7 days'
    },

    // Mountain West Default (based on Phoenix + regional estimates)
    'default-mountain-west': {
        electrical: {
            baseFee: 125,
            valuationRate: 0.008,
            minFee: 125,
            maxFee: 2200
        },
        plumbing: {
            baseFee: 120,
            valuationRate: 0.008,
            minFee: 120,
            maxFee: 2200
        },
        hvac: {
            baseFee: 135,
            valuationRate: 0.008,
            minFee: 135,
            maxFee: 2200
        },
        general: {
            baseFee: 165,
            valuationRate: 0.011,
            minFee: 165,
            maxFee: 4500
        },
        solar: {
            baseFee: 225,
            valuationRate: 0.009,
            minFee: 225,
            maxFee: 3200
        },
        processingTime: '2-4 weeks',
        expediteFee: 175,
        expediteTime: '3-5 days'
    },

    // Southeast Default (based on Miami + regional estimates)
    'default-southeast': {
        electrical: {
            baseFee: 105,
            valuationRate: 0.007,
            minFee: 105,
            maxFee: 2100
        },
        plumbing: {
            baseFee: 95,
            valuationRate: 0.007,
            minFee: 95,
            maxFee: 2100
        },
        hvac: {
            baseFee: 115,
            valuationRate: 0.007,
            minFee: 115,
            maxFee: 2100
        },
        general: {
            baseFee: 150,
            valuationRate: 0.011,
            minFee: 150,
            maxFee: 3800
        },
        solar: {
            baseFee: 265,
            valuationRate: 0.009,
            minFee: 265,
            maxFee: 3000
        },
        processingTime: '2-4 weeks',
        expediteFee: 165,
        expediteTime: '3-5 days'
    },

    // Northeast Default (based on NYC + regional adjustments)
    'default-northeast': {
        electrical: {
            baseFee: 200,
            valuationRate: 0.010,
            minFee: 200,
            maxFee: 3500
        },
        plumbing: {
            baseFee: 185,
            valuationRate: 0.010,
            minFee: 185,
            maxFee: 3500
        },
        hvac: {
            baseFee: 215,
            valuationRate: 0.010,
            minFee: 215,
            maxFee: 3500
        },
        general: {
            baseFee: 275,
            valuationRate: 0.016,
            minFee: 275,
            maxFee: 6500
        },
        solar: {
            baseFee: 425,
            valuationRate: 0.012,
            minFee: 425,
            maxFee: 5000
        },
        processingTime: '6-12 weeks',
        expediteFee: 400,
        expediteTime: '2-4 weeks'
    },

    // Generic Default (fallback if region cannot be determined)
    'default': {
        electrical: {
            baseFee: 120,
            valuationRate: 0.008,
            minFee: 120,
            maxFee: 2200
        },
        plumbing: {
            baseFee: 110,
            valuationRate: 0.008,
            minFee: 110,
            maxFee: 2200
        },
        hvac: {
            baseFee: 130,
            valuationRate: 0.008,
            minFee: 130,
            maxFee: 2200
        },
        general: {
            baseFee: 170,
            valuationRate: 0.012,
            minFee: 170,
            maxFee: 4200
        },
        solar: {
            baseFee: 290,
            valuationRate: 0.010,
            minFee: 290,
            maxFee: 3400
        },
        processingTime: '3-6 weeks',
        expediteFee: 200,
        expediteTime: '1-2 weeks'
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

/**
 * Intelligent region detection for better default estimates
 * Routes cities to appropriate regional defaults based on state
 */
function detectRegion(location) {
    // If exact match exists, no need for region detection
    if (permitFees[location]) {
        return location;
    }

    // Extract state from location string (assumes "City, ST" format)
    const stateMatch = location.match(/,\s*([A-Z]{2})\s*$/);
    if (!stateMatch) {
        return 'default'; // Can't determine state, use generic default
    }

    const state = stateMatch[1];

    // Midwest states
    const midwestStates = ['IL', 'WI', 'MI', 'IN', 'OH', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'];
    if (midwestStates.includes(state)) {
        return 'default-midwest';
    }

    // Texas (gets its own due to unique low-cost, business-friendly environment)
    if (state === 'TX') {
        return 'default-texas';
    }

    // California (gets its own due to high costs and complex regulations)
    if (state === 'CA') {
        return 'default-california';
    }

    // Mountain West states
    const mountainWestStates = ['AZ', 'CO', 'UT', 'NV', 'NM', 'WY', 'MT', 'ID'];
    if (mountainWestStates.includes(state)) {
        return 'default-mountain-west';
    }

    // Southeast states
    const southeastStates = ['FL', 'GA', 'AL', 'SC', 'NC', 'TN', 'MS', 'LA', 'AR', 'KY', 'WV', 'VA'];
    if (southeastStates.includes(state)) {
        return 'default-southeast';
    }

    // Northeast states
    const northeastStates = ['NY', 'PA', 'NJ', 'MA', 'CT', 'RI', 'VT', 'NH', 'ME', 'MD', 'DE', 'DC'];
    if (northeastStates.includes(state)) {
        return 'default-northeast';
    }

    // Pacific Northwest
    const pacificNWStates = ['WA', 'OR'];
    if (pacificNWStates.includes(state)) {
        return 'default-mountain-west'; // Most similar to mountain west in costs
    }

    // If we can't categorize, use generic default
    return 'default';
}

/**
 * Get permit fee data for a location (with intelligent regional fallback)
 */
function getPermitFeeData(location) {
    const resolvedLocation = detectRegion(location);
    return {
        data: permitFees[resolvedLocation],
        actualLocation: resolvedLocation,
        isEstimate: resolvedLocation !== location,
        originalLocation: location
    };
}

module.exports = {
    permitFees,
    laborTimes,
    markupRecommendations,
    dataQuality,
    detectRegion,
    getPermitFeeData
};
