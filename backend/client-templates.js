/**
 * Client Communication Templates
 * Professional templates to help contractors justify permit costs
 * and compete against unlicensed workers
 */

/**
 * Generate professional client quote email
 */
function generateClientQuote(pricingData, contractorInfo = {}) {
    const {
        contractorName = 'Your Company Name',
        contractorLicense = 'License #12345',
        contractorPhone = '(555) 123-4567',
        contractorEmail = 'contact@yourcompany.com',
        clientName = 'Valued Client'
    } = contractorInfo;

    const { pricing, metadata } = pricingData;

    return {
        subject: `Permit Quote: ${metadata.jobType} - ${metadata.location}`,
        body: `Dear ${clientName},

Thank you for considering ${contractorName} for your ${metadata.jobType.toLowerCase()} project in ${metadata.location}.

I'm pleased to provide you with a detailed quote for the permit work required for this project.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PROJECT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Work Type: ${metadata.jobType}
Project Type: ${metadata.projectType}
Scope: ${metadata.scope}
Location: ${metadata.location}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PERMIT SERVICE QUOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Permit Fee (${metadata.location})             $${pricing.permitFee.permitFee}
Document Preparation (${pricing.labor.breakdown.documentPrep.hours}h)        $${pricing.labor.breakdown.documentPrep.cost}
Plan Drawing & Diagrams (${pricing.labor.breakdown.planDrawing.hours}h)      $${pricing.labor.breakdown.planDrawing.cost}
Permit Submission (${pricing.labor.breakdown.submission.hours}h)             $${pricing.labor.breakdown.submission.cost}
Inspection Attendance (${pricing.labor.breakdown.inspection.hours}h)         $${pricing.labor.breakdown.inspection.cost}
Administrative & Follow-up                     $${pricing.labor.breakdown.corrections.cost + pricing.clientCharge.permitFeeMarkup}
                                               ──────────
TOTAL PERMIT SERVICE:                          $${pricing.summary.recommendedCharge}

Time Investment: ${pricing.summary.timeInvestment}
Expected Timeline: ${pricing.summary.processingTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ WHY PROPER PERMITS MATTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ SAFETY: Ensures work meets current electrical and building codes
✓ LEGAL PROTECTION: Protects you from liability and code violations
✓ INSURANCE: Required for homeowner's insurance claims
✓ RESALE VALUE: Proper permits increase home value by 5-10%
✓ WARRANTY: Work is guaranteed and inspected by city officials
✓ PEACE OF MIND: No worries about fines, re-work, or unsafe conditions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ THE RISK OF UNLICENSED WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Some contractors offer to skip permits to save money. Here's what that really means:

❌ NO INSPECTIONS: Work may be dangerous or non-compliant
❌ NO RECOURSE: If something goes wrong, you have no legal protection
❌ INSURANCE ISSUES: Your homeowner's insurance may not cover unpermitted work
❌ RESALE PROBLEMS: Must disclose unpermitted work, reducing home value
❌ FINES: City can fine you $500-5,000+ and require removal of all work
❌ NO WARRANTY: Unlicensed contractors often disappear when problems arise

The average cost to fix unpermitted work: $5,000 - $15,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 WHY CHOOSE ${contractorName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Licensed & Insured (${contractorLicense})
✓ Expert knowledge of ${metadata.location} permit requirements
✓ Handle all paperwork and city interactions
✓ Present during inspections
✓ Guarantee code-compliant work
✓ Professional service with proper documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This quote is valid for 30 days. The permit service is included in your total project estimate.

If you have any questions or would like to proceed, please don't hesitate to contact me.

Best regards,

${contractorName}
${contractorLicense}
Phone: ${contractorPhone}
Email: ${contractorEmail}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

P.S. Proper permits typically increase home value by 5-10% and are required for insurance claims. This small investment protects your larger investment in your home.`,

        // Plain text version for copy/paste
        plainText: true
    };
}

/**
 * Generate "Why skip permits is risky" template for pushback situations
 */
function generatePermitValueEmail(pricingData, contractorInfo = {}) {
    const {
        contractorName = 'Your Company Name',
        clientName = 'Valued Client'
    } = contractorInfo;

    const { pricing, metadata } = pricingData;

    return {
        subject: `About Your ${metadata.jobType} Permit - Important Information`,
        body: `Hi ${clientName},

I wanted to follow up on our conversation about permits for your ${metadata.jobType.toLowerCase()} project.

I understand that permits can seem like an unnecessary expense, but I want to make sure you have all the facts before making a decision.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE REAL COST OF SKIPPING PERMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

While skipping permits might save $${pricing.summary.recommendedCharge} today, here's what could happen:

💸 RESALE IMPACT:
When you sell your home, you must disclose unpermitted work.
• Potential buyers may walk away
• Buyers who stay will demand 10-20% price reduction
• On a $400K home, that's $40,000-80,000 lost

💸 INSURANCE PROBLEMS:
• Homeowner's insurance may deny claims related to unpermitted work
• You could lose coverage entirely if discovered
• Average insurance claim: $10,000-50,000

💸 CITY FINES & CORRECTIONS:
• Initial fine: $500-5,000
• Required to obtain permit retroactively
• May need to open walls for inspection
• May need to redo non-compliant work
• Total cost: $5,000-15,000+

💸 SAFETY RISKS:
• Work may not meet current electrical/building codes
• Could result in fire, injury, or property damage
• No recourse against contractor who did unpermitted work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE ACTUAL VALUE OF PERMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Peace of mind knowing work is code-compliant
✓ Protection from liability
✓ Increases home value by 5-10%
✓ Required for insurance claims
✓ Professional inspection by city officials
✓ Legal recourse if problems arise
✓ Proper documentation for future owners

Cost: $${pricing.summary.recommendedCharge}
Value: $10,000-80,000+ in protection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MY RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

As a licensed contractor, I can only perform permitted work. This protects both of us and ensures the job is done right.

I've been in business for years because I stand behind my work. Proper permits are part of providing professional service.

If cost is a concern, I'm happy to discuss payment options or a timeline that works better for your budget. But I cannot in good conscience perform unpermitted work that could cost you thousands down the road.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I'm here to help you make the best decision for your home and family. Let me know if you'd like to discuss further.

Best regards,
${contractorName}

P.S. Think of permits like car insurance - you hope you never need it, but you'll be grateful you have it if something goes wrong.`,
        plainText: true
    };
}

/**
 * Generate simple "Why I need a permit" explainer for clients
 */
function generatePermitExplainer(pricingData) {
    const { metadata } = pricingData;

    return {
        subject: `Quick Guide: Why ${metadata.jobType} Requires a Permit`,
        body: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHY YOUR ${metadata.jobType.toUpperCase()} PROJECT NEEDS A PERMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏛️ IT'S THE LAW
Most ${metadata.jobType.toLowerCase()} work requires a permit from ${metadata.location}.
This isn't optional - it's a legal requirement.

👷 SAFETY FIRST
Permits ensure your work meets current building and safety codes.
This protects you, your family, and future owners.

🔍 PROFESSIONAL INSPECTION
City inspectors review the work to ensure it's done correctly.
This catches problems before they become dangerous or expensive.

📜 DOCUMENTATION
Permits create a permanent record of what was done and when.
This is valuable for insurance, resale, and future renovations.

💰 FINANCIAL PROTECTION
• Insurance companies require permits for claims
• Unpermitted work can reduce home value by 10-20%
• City can fine you and require expensive corrections
• Proper permits can increase home value by 5-10%

⚖️ LEGAL PROTECTION
If something goes wrong, permits prove work was done properly.
Without permits, you have no legal recourse.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT HAPPENS WITHOUT A PERMIT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Insurance may deny claims ($10,000-50,000 loss)
❌ City can fine you $500-5,000 and require removal
❌ Must disclose to buyers (reduces sale price 10-20%)
❌ May need to redo all work to get retroactive permit
❌ Work may be unsafe and non-compliant
❌ No warranty or recourse if problems arise

Average cost to fix unpermitted work: $5,000-15,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE BOTTOM LINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Permits are a small investment that protects your much larger investment in your home.

Professional contractors always pull permits. If someone offers to skip permits, that's a red flag.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        plainText: true
    };
}

/**
 * Generate comparison sheet: Licensed vs Unlicensed work
 */
function generateComparisonSheet(pricingData, contractorInfo = {}) {
    const {
        contractorName = 'Licensed Professional'
    } = contractorInfo;

    // Handle both nested and flat pricing structures
    const pricing = pricingData.pricing || pricingData;

    return {
        title: 'Licensed vs Unlicensed: What You Really Get',
        content: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LICENSED VS UNLICENSED: WHAT YOU REALLY GET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                        LICENSED            UNLICENSED
                        CONTRACTOR          "HANDYMAN"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPFRONT COST            $${pricing.summary.recommendedCharge}                ~$${pricing.competitive.unlicensedContractorPrice}

PERMITS PULLED          ✓ Yes               ✗ No
INSPECTIONS             ✓ Yes               ✗ No
CODE COMPLIANT          ✓ Guaranteed        ✗ Unknown
LIABILITY INSURANCE     ✓ Covered           ✗ You're liable
WARRANTY                ✓ Yes               ✗ No
LEGAL RECOURSE          ✓ Yes               ✗ No

RESALE DISCLOSURE       ✓ Clean             ✗ Must disclose
RESALE VALUE            ↑ +5-10%            ↓ -10-20%
INSURANCE VALID         ✓ Yes               ✗ May be denied
FUTURE WORK             ✓ Easy              ✗ Complicated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL COST COMPARISON (REAL WORLD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LICENSED CONTRACTOR:
Upfront cost:           $${pricing.summary.recommendedCharge}
Peace of mind:          Included
Insurance protection:   Included
Resale impact:          +$20,000-40,000
TOTAL VALUE:            $${pricing.summary.recommendedCharge + 30000}+

UNLICENSED WORK:
Upfront cost:           $${pricing.competitive.unlicensedContractorPrice}
City fine (if caught):  +$500-5,000
Redo work cost:         +$3,000-10,000
Resale impact:          -$40,000-80,000
Insurance denial risk:  -$10,000-50,000
POTENTIAL TOTAL:        $53,500-145,000 LOSS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE MATH IS CLEAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Saving $${pricing.summary.recommendedCharge - pricing.competitive.unlicensedContractorPrice} today could cost you $50,000+ tomorrow.

Choose ${contractorName}. Choose professional. Choose peace of mind.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,
        plainText: true
    };
}

/**
 * Generate payment plan / financing options template
 */
function generatePaymentOptions(pricingData, contractorInfo = {}) {
    const {
        contractorName = 'Your Company Name',
        clientName = 'Valued Client'
    } = contractorInfo;

    const { pricing } = pricingData;
    const recommendedCharge = pricing.summary.recommendedCharge;
    const deposit = Math.round(recommendedCharge * 0.3);
    const remaining = recommendedCharge - deposit;
    const monthly3 = Math.round(recommendedCharge / 3);
    const monthly6 = Math.round(recommendedCharge / 6);

    return {
        subject: 'Payment Options for Your Permit Service',
        body: `Hi ${clientName},

I understand that budgeting for home improvements is important. I wanted to share some flexible payment options for the permit service.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT OPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTION 1: PAY IN FULL
Total: $${recommendedCharge}
✓ No additional fees
✓ Completed when permit is approved

OPTION 2: SPLIT PAYMENT (Most Popular)
Deposit: $${deposit} (30% at project start)
Balance: $${remaining} (upon permit approval)
✓ Manageable payments
✓ Secure both parties

OPTION 3: 3-MONTH PLAN
$${monthly3}/month for 3 months
Total: $${recommendedCharge}
✓ Work begins immediately
✓ Easy monthly payments

OPTION 4: 6-MONTH PLAN
$${monthly6}/month for 6 months
Total: $${recommendedCharge}
✓ Smallest monthly payment
✓ No interest

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All payment plans include:
✓ Full permit service
✓ All document preparation
✓ City submission and follow-up
✓ Inspection attendance
✓ Professional warranty

Let me know which option works best for your budget, and we'll get started right away.

Best regards,
${contractorName}`,
        plainText: true
    };
}

/**
 * Main function to generate all client templates
 */
function generateAllClientTemplates(pricingData, contractorInfo = {}) {
    return {
        professionalQuote: generateClientQuote(pricingData, contractorInfo),
        permitValue: generatePermitValueEmail(pricingData, contractorInfo),
        permitExplainer: generatePermitExplainer(pricingData),
        comparisonSheet: generateComparisonSheet(pricingData, contractorInfo),
        paymentOptions: generatePaymentOptions(pricingData, contractorInfo)
    };
}

module.exports = {
    generateClientQuote,
    generatePermitValueEmail,
    generatePermitExplainer,
    generateComparisonSheet,
    generatePaymentOptions,
    generateAllClientTemplates
};
