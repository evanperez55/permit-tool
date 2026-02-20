/**
 * Permit Paperwork Management Module
 *
 * Business logic for managing and retrieving required permit paperwork.
 * Provides curated, verified links to official permit forms and documents.
 *
 * Core Features:
 * - Get required forms for specific job types
 * - Filter forms by category (applications, supporting docs, fee schedules)
 * - Verify form freshness and link health
 * - Generate complete paperwork checklists
 * - Report broken links for maintenance
 */

const {
  getFormsForTrade,
  getAllFormsForJurisdiction,
  getAvailableJurisdictions,
  getFormsByType,
  searchForms,
  getDatabaseStats
} = require('./permit-paperwork-database');

/**
 * Get all required paperwork for a specific permit
 *
 * @param {string} jurisdiction - e.g., "Los Angeles, CA"
 * @param {string} jobType - e.g., "Electrical", "Plumbing"
 * @returns {Object} Categorized paperwork with metadata
 */
function getRequiredPaperwork(jurisdiction, jobType) {
  const forms = getFormsForTrade(jurisdiction, jobType);

  if (forms.length === 0) {
    return {
      success: false,
      message: `No paperwork data available for ${jobType} in ${jurisdiction}`,
      jurisdiction,
      jobType,
      totalForms: 0,
      applications: [],
      supporting: [],
      reference: [],
      feeSchedules: []
    };
  }

  // Categorize forms
  const applications = forms.filter(f => f.formType === 'Application');
  const supporting = forms.filter(f => f.formType === 'Supporting');
  const reference = forms.filter(f => f.formType === 'Reference');
  const feeSchedules = forms.filter(f => f.formType === 'Fee Schedule');

  return {
    success: true,
    jurisdiction,
    jobType,
    totalForms: forms.length,
    applications,
    supporting,
    reference,
    feeSchedules,
    lastVerified: getMostRecentVerificationDate(forms),
    message: `Found ${forms.length} required forms for ${jobType} in ${jurisdiction}`
  };
}

/**
 * Get complete paperwork package with all categories
 *
 * @param {string} jurisdiction - e.g., "Los Angeles, CA"
 * @param {string} jobType - e.g., "Electrical"
 * @returns {Object} Complete paperwork package
 */
function getCompletePaperworkPackage(jurisdiction, jobType) {
  const paperwork = getRequiredPaperwork(jurisdiction, jobType);

  if (!paperwork.success) {
    return paperwork;
  }

  // Add helpful categorization and instructions
  return {
    ...paperwork,
    checklist: generatePaperworkChecklist(paperwork),
    downloadInstructions: generateDownloadInstructions(paperwork),
    tips: getPaperworkTips(jurisdiction, jobType),
    estimatedPrepTime: estimatePaperworkPrepTime(paperwork)
  };
}

/**
 * Generate a checklist for contractors
 *
 * @param {Object} paperwork - Paperwork object from getRequiredPaperwork
 * @returns {Array} Array of checklist items
 */
function generatePaperworkChecklist(paperwork) {
  const checklist = [];

  // Required applications
  if (paperwork.applications.length > 0) {
    checklist.push({
      category: 'Required Applications',
      priority: 'high',
      items: paperwork.applications.map(form => ({
        name: form.formName,
        code: form.formCode,
        fillable: form.isFillable,
        url: form.url,
        description: form.description,
        completed: false
      }))
    });
  }

  // Supporting documents
  if (paperwork.supporting.length > 0) {
    checklist.push({
      category: 'Supporting Documents',
      priority: 'high',
      items: paperwork.supporting.map(form => ({
        name: form.formName,
        code: form.formCode,
        fillable: form.isFillable,
        url: form.url,
        description: form.description,
        completed: false
      }))
    });
  }

  // Always add these standard items
  checklist.push({
    category: 'Additional Requirements',
    priority: 'medium',
    items: [
      {
        name: 'Proof of Insurance',
        description: 'Certificate of Insurance (COI) from your insurance provider',
        completed: false,
        note: 'Must show general liability and workers compensation'
      },
      {
        name: 'Contractor License',
        description: 'Valid contractor license for your trade',
        completed: false,
        note: 'Verify license is current and matches trade type'
      },
      {
        name: 'Plan Drawings (if required)',
        description: 'Site plans, electrical diagrams, or technical drawings',
        completed: false,
        note: 'Check with permitting office if required for your project'
      }
    ]
  });

  // Reference documents (lower priority)
  if (paperwork.reference.length > 0) {
    checklist.push({
      category: 'Helpful References',
      priority: 'low',
      items: paperwork.reference.map(form => ({
        name: form.formName,
        code: form.formCode,
        url: form.url,
        description: form.description,
        completed: false
      }))
    });
  }

  return checklist;
}

/**
 * Generate download instructions
 *
 * @param {Object} paperwork - Paperwork object
 * @returns {Object} Download instructions
 */
function generateDownloadInstructions(paperwork) {
  const totalDownloadable = [
    ...paperwork.applications,
    ...paperwork.supporting,
    ...paperwork.reference
  ].filter(f => f.fileType === 'pdf' || f.fileType === 'docx').length;

  return {
    totalDownloadable,
    steps: [
      'Click each form link to download the PDF',
      'Save all forms to a dedicated project folder',
      'Complete fillable forms electronically (if available)',
      'Print completed forms or save as PDF',
      'Organize documents in the order shown above',
      'Review fee schedule to calculate total costs',
      'Bring all documents to the permit office or submit online'
    ],
    tips: [
      'Download all forms at once to avoid multiple trips',
      'Check "Last Verified" dates - if over 90 days old, verify with the permit office',
      'Keep digital copies as backup',
      'Some jurisdictions accept email or online submissions'
    ]
  };
}

/**
 * Get jurisdiction-specific tips
 *
 * @param {string} jurisdiction - Jurisdiction name
 * @param {string} jobType - Job type
 * @returns {Array} Array of helpful tips
 */
function getPaperworkTips(jurisdiction, jobType) {
  const tips = [];

  // Jurisdiction-specific tips
  if (jurisdiction === 'New York, NY') {
    tips.push('NYC requires electronic filing through DOB NOW - paper applications not accepted for most permits');
    tips.push('Create a DOB NOW account before starting your application');
  } else if (jurisdiction === 'Los Angeles, CA') {
    tips.push('LADBS accepts both in-person and online submissions');
    tips.push('Express permits available for simple electrical/plumbing work');
  } else if (jurisdiction === 'San Francisco, CA') {
    tips.push('SF DBI uses numbered forms (Form 1/2, 3/8, etc.) - make sure you have the right one');
    tips.push('Energy code compliance (Title 24) required for most projects');
  } else if (jurisdiction === 'Chicago, IL') {
    tips.push('Express permits available for qualifying minor work');
    tips.push('Energy code forms (408 series) required for many projects');
  } else if (jurisdiction === 'Milwaukee, WI') {
    tips.push('Submit permits at the Development Center (809 N. Broadway, 1st Floor)');
    tips.push('Online applications available through the Accela portal');
    tips.push('Plan review fees due at submission; permit fees due before issuance');
  } else if (jurisdiction === 'Phoenix, AZ') {
    tips.push('Phoenix uses a single unified application (TRT 00030) for all residential trades');
    tips.push('Residential permits now go through the SHAPE PHX portal');
    tips.push('Valuation-based fees with $150 minimum; plan review adds 80-100%');
  }

  // Trade-specific tips
  if (jobType === 'Electrical') {
    tips.push('Load calculations may be required for service upgrades');
    tips.push('Panel schedules and circuit diagrams often needed');
  } else if (jobType === 'Plumbing') {
    tips.push('Water meter information often required');
    tips.push('Backflow prevention devices may need separate approval');
  } else if (jobType === 'HVAC') {
    tips.push('Equipment specifications and load calculations typically required');
    tips.push('Energy compliance forms mandatory in most jurisdictions');
  }

  // General tips
  tips.push('Call ahead to verify all requirements before visiting the permit office');
  tips.push('Incomplete applications cause delays - double-check everything');

  return tips;
}

/**
 * Estimate preparation time for paperwork
 *
 * @param {Object} paperwork - Paperwork object
 * @returns {Object} Time estimate
 */
function estimatePaperworkPrepTime(paperwork) {
  let estimatedMinutes = 0;

  // Base time per application form
  estimatedMinutes += paperwork.applications.length * 15;

  // Time for supporting documents
  estimatedMinutes += paperwork.supporting.length * 10;

  // Time to gather standard documents (insurance, license, etc.)
  estimatedMinutes += 20;

  // Time to review fee schedules
  estimatedMinutes += 5;

  return {
    estimatedMinutes,
    estimatedHours: Math.ceil(estimatedMinutes / 60 * 10) / 10, // Round to 1 decimal
    breakdown: {
      applications: paperwork.applications.length * 15,
      supporting: paperwork.supporting.length * 10,
      standardDocs: 20,
      review: 5
    },
    note: 'Estimate includes time to download, complete, and organize all paperwork'
  };
}

/**
 * Get the most recent verification date from forms
 *
 * @param {Array} forms - Array of form objects
 * @returns {string} Most recent verification date
 */
function getMostRecentVerificationDate(forms) {
  if (forms.length === 0) return null;

  const dates = forms
    .map(f => f.lastVerified)
    .filter(d => d)
    .sort()
    .reverse();

  return dates[0] || null;
}

/**
 * Check if forms need verification (older than 90 days)
 *
 * @param {Array} forms - Array of form objects
 * @returns {Object} Verification status
 */
function checkVerificationStatus(forms) {
  const today = new Date();
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

  const needsVerification = forms.filter(form => {
    if (!form.lastVerified) return true;
    const verifiedDate = new Date(form.lastVerified);
    return verifiedDate < ninetyDaysAgo;
  });

  return {
    totalForms: forms.length,
    needsVerification: needsVerification.length,
    status: needsVerification.length === 0 ? 'current' : 'needs_verification',
    oldestVerification: forms.reduce((oldest, form) => {
      if (!form.lastVerified) return null;
      if (!oldest) return form.lastVerified;
      return form.lastVerified < oldest ? form.lastVerified : oldest;
    }, null)
  };
}

/**
 * Report a broken or outdated link
 *
 * @param {Object} report - Report details
 * @returns {Object} Report result
 */
function reportBrokenLink(report) {
  const { jurisdiction, jobType, formCode, formName, userEmail, issue, comments } = report;

  // In a production system, this would save to a database or send an email
  // For now, we'll return a structured response

  const timestamp = new Date().toISOString();

  return {
    success: true,
    reportId: `REPORT-${Date.now()}`,
    timestamp,
    details: {
      jurisdiction,
      jobType,
      formCode,
      formName,
      issue, // 'broken_link', 'outdated', 'wrong_form', 'other'
      userEmail,
      comments
    },
    message: 'Thank you for reporting this issue. We will verify and update the form within 48 hours.',
    nextSteps: [
      'Our team will verify the reported issue',
      'If confirmed, we will update the link or form information',
      'You will receive an email confirmation when the issue is resolved',
      'In the meantime, please check the official jurisdiction website directly'
    ]
  };
}

/**
 * Get forms that may be outdated (older than 1 year)
 *
 * @returns {Array} Array of potentially outdated forms
 */
function getOutdatedForms() {
  const allForms = [];
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const jurisdictions = getAvailableJurisdictions();

  jurisdictions.forEach(jurisdiction => {
    const allJurisdictionForms = getAllFormsForJurisdiction(jurisdiction);

    Object.keys(allJurisdictionForms).forEach(tradeType => {
      const forms = allJurisdictionForms[tradeType];

      forms.forEach(form => {
        const revisionDate = form.revisionDate ? new Date(form.revisionDate) : null;
        const lastVerified = form.lastVerified ? new Date(form.lastVerified) : null;

        if (revisionDate && revisionDate < oneYearAgo) {
          allForms.push({
            jurisdiction,
            tradeType,
            ...form,
            ageInDays: Math.floor((new Date() - revisionDate) / (1000 * 60 * 60 * 24))
          });
        }
      });
    });
  });

  return allForms.sort((a, b) => b.ageInDays - a.ageInDays);
}

/**
 * Get summary statistics for admin dashboard
 *
 * @returns {Object} Summary statistics
 */
function getAdminSummary() {
  const stats = getDatabaseStats();
  const allJurisdictions = getAvailableJurisdictions();

  let totalForms = 0;
  let formsByJurisdiction = {};
  let needsVerification = 0;

  allJurisdictions.forEach(jurisdiction => {
    const jurisdictionForms = getAllFormsForJurisdiction(jurisdiction);
    let jurisdictionTotal = 0;

    Object.values(jurisdictionForms).forEach(forms => {
      jurisdictionTotal += forms.length;
      totalForms += forms.length;

      const verificationStatus = checkVerificationStatus(forms);
      needsVerification += verificationStatus.needsVerification;
    });

    formsByJurisdiction[jurisdiction] = jurisdictionTotal;
  });

  return {
    ...stats,
    formsByJurisdiction,
    needsVerification,
    verificationRate: totalForms > 0
      ? Math.round(((totalForms - needsVerification) / totalForms) * 100)
      : 0,
    outdatedForms: getOutdatedForms().length
  };
}

/**
 * Validate that required paperwork data exists
 *
 * @param {string} jurisdiction - Jurisdiction name
 * @param {string} jobType - Job type
 * @returns {boolean} True if data exists
 */
function hasPaperworkData(jurisdiction, jobType) {
  const forms = getFormsForTrade(jurisdiction, jobType);
  return forms.length > 0;
}

/**
 * Get a single form by code
 *
 * @param {string} jurisdiction - Jurisdiction name
 * @param {string} formCode - Form code
 * @returns {Object|null} Form object or null
 */
function getFormByCode(jurisdiction, formCode) {
  const allJurisdictionForms = getAllFormsForJurisdiction(jurisdiction);

  for (const tradeType in allJurisdictionForms) {
    const forms = allJurisdictionForms[tradeType];
    const form = forms.find(f => f.formCode === formCode);
    if (form) {
      return {
        jurisdiction,
        tradeType,
        ...form
      };
    }
  }

  return null;
}

module.exports = {
  getRequiredPaperwork,
  getCompletePaperworkPackage,
  generatePaperworkChecklist,
  generateDownloadInstructions,
  getPaperworkTips,
  estimatePaperworkPrepTime,
  checkVerificationStatus,
  reportBrokenLink,
  getOutdatedForms,
  getAdminSummary,
  hasPaperworkData,
  getFormByCode,
  // Re-export database functions for convenience
  getAvailableJurisdictions,
  getFormsByType,
  searchForms,
  getDatabaseStats
};
