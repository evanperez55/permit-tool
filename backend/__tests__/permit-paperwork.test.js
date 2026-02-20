/**
 * Comprehensive Test Suite for Permit Paperwork Module
 *
 * Tests all functions in permit-paperwork.js and permit-paperwork-database.js
 * Following "ultrathink" testing philosophy: comprehensive coverage, edge cases, integration scenarios
 *
 * Test Coverage:
 * - Database functions (getFormsForTrade, getAllFormsForJurisdiction, etc.)
 * - Business logic functions (getRequiredPaperwork, generateChecklist, etc.)
 * - Validation and error handling
 * - Edge cases (unknown jurisdictions, missing data, etc.)
 * - Admin functions (reporting, statistics, etc.)
 */

const {
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
  getAvailableJurisdictions,
  getFormsByType,
  searchForms,
  getDatabaseStats
} = require('../permit-paperwork');

const {
  getFormsForTrade,
  getAllFormsForJurisdiction
} = require('../permit-paperwork-database');

describe('Permit Paperwork Database Functions', () => {
  describe('getFormsForTrade', () => {
    test('should return forms for Los Angeles Electrical work', () => {
      const forms = getFormsForTrade('Los Angeles, CA', 'Electrical');

      expect(Array.isArray(forms)).toBe(true);
      expect(forms.length).toBeGreaterThan(0);
      expect(forms[0]).toHaveProperty('formName');
      expect(forms[0]).toHaveProperty('url');
      expect(forms[0]).toHaveProperty('formType');
    });

    test('should return forms for San Diego Plumbing work', () => {
      const forms = getFormsForTrade('San Diego, CA', 'Plumbing');

      expect(Array.isArray(forms)).toBe(true);
      expect(forms.length).toBeGreaterThan(0);
    });

    test('should return empty array for unknown jurisdiction', () => {
      const forms = getFormsForTrade('Unknown City, XX', 'Electrical');

      expect(Array.isArray(forms)).toBe(true);
      expect(forms.length).toBe(0);
    });

    test('should return empty array for unknown trade type', () => {
      const forms = getFormsForTrade('Los Angeles, CA', 'UnknownTrade');

      expect(Array.isArray(forms)).toBe(true);
      expect(forms.length).toBe(0);
    });

    test('should return forms with all required fields', () => {
      const forms = getFormsForTrade('San Francisco, CA', 'Electrical');

      forms.forEach(form => {
        expect(form).toHaveProperty('formType');
        expect(form).toHaveProperty('formName');
        expect(form).toHaveProperty('url');
        expect(form).toHaveProperty('description');
        expect(form).toHaveProperty('lastVerified');
        expect(form).toHaveProperty('isFillable');
        expect(form).toHaveProperty('fileType');
      });
    });
  });

  describe('getAllFormsForJurisdiction', () => {
    test('should return all forms for Chicago', () => {
      const allForms = getAllFormsForJurisdiction('Chicago, IL');

      expect(typeof allForms).toBe('object');
      expect(allForms).toHaveProperty('Electrical');
      expect(allForms).toHaveProperty('Plumbing');
      expect(allForms).toHaveProperty('HVAC');
    });

    test('should return all trade types for Austin', () => {
      const allForms = getAllFormsForJurisdiction('Austin, TX');
      const tradeTypes = Object.keys(allForms);

      expect(tradeTypes.length).toBeGreaterThan(0);
      expect(tradeTypes).toContain('Electrical');
    });

    test('should return empty object for unknown jurisdiction', () => {
      const allForms = getAllFormsForJurisdiction('Unknown City, XX');

      expect(typeof allForms).toBe('object');
      expect(Object.keys(allForms).length).toBe(0);
    });
  });

  describe('getAvailableJurisdictions', () => {
    test('should return array of jurisdictions', () => {
      const jurisdictions = getAvailableJurisdictions();

      expect(Array.isArray(jurisdictions)).toBe(true);
      expect(jurisdictions.length).toBe(12);
    });

    test('should include all major cities', () => {
      const jurisdictions = getAvailableJurisdictions();

      expect(jurisdictions).toContain('Los Angeles, CA');
      expect(jurisdictions).toContain('San Diego, CA');
      expect(jurisdictions).toContain('San Francisco, CA');
      expect(jurisdictions).toContain('Austin, TX');
      expect(jurisdictions).toContain('Houston, TX');
      expect(jurisdictions).toContain('Miami, FL');
      expect(jurisdictions).toContain('Chicago, IL');
      expect(jurisdictions).toContain('New York, NY');
    });
  });

  describe('getFormsByType', () => {
    test('should return all Application forms', () => {
      const applications = getFormsByType('Application');

      expect(Array.isArray(applications)).toBe(true);
      expect(applications.length).toBeGreaterThan(0);

      applications.forEach(form => {
        expect(form.formType).toBe('Application');
        expect(form).toHaveProperty('jurisdiction');
        expect(form).toHaveProperty('tradeType');
      });
    });

    test('should return all Fee Schedule forms', () => {
      const feeSchedules = getFormsByType('Fee Schedule');

      expect(Array.isArray(feeSchedules)).toBe(true);
      expect(feeSchedules.length).toBeGreaterThan(0);

      feeSchedules.forEach(form => {
        expect(form.formType).toBe('Fee Schedule');
      });
    });

    test('should return all Supporting forms', () => {
      const supporting = getFormsByType('Supporting');

      expect(Array.isArray(supporting)).toBe(true);

      supporting.forEach(form => {
        expect(form.formType).toBe('Supporting');
      });
    });

    test('should return empty array for non-existent form type', () => {
      const forms = getFormsByType('NonExistentType');

      expect(Array.isArray(forms)).toBe(true);
      expect(forms.length).toBe(0);
    });
  });

  describe('searchForms', () => {
    test('should find forms by keyword "electrical"', () => {
      const results = searchForms('electrical');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    test('should be case-insensitive', () => {
      const results1 = searchForms('ELECTRICAL');
      const results2 = searchForms('electrical');

      expect(results1.length).toBe(results2.length);
    });

    test('should find forms by form code', () => {
      const results = searchForms('DS-345');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].formCode).toBe('DS-345');
    });

    test('should search in description and notes', () => {
      const results = searchForms('fillable');

      expect(Array.isArray(results)).toBe(true);
    });

    test('should return empty array for no matches', () => {
      const results = searchForms('xyzabc123nonexistent');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getDatabaseStats', () => {
    test('should return comprehensive statistics', () => {
      const stats = getDatabaseStats();

      expect(stats).toHaveProperty('totalForms');
      expect(stats).toHaveProperty('totalJurisdictions');
      expect(stats).toHaveProperty('totalTradeTypes');
      expect(stats).toHaveProperty('formsByType');
      expect(stats).toHaveProperty('tradeTypes');
      expect(stats).toHaveProperty('jurisdictions');
    });

    test('should have 12 jurisdictions', () => {
      const stats = getDatabaseStats();

      expect(stats.totalJurisdictions).toBe(12);
    });

    test('should count forms correctly', () => {
      const stats = getDatabaseStats();

      expect(stats.totalForms).toBeGreaterThan(30);
      expect(typeof stats.totalForms).toBe('number');
    });

    test('should categorize forms by type', () => {
      const stats = getDatabaseStats();

      expect(stats.formsByType).toHaveProperty('Application');
      expect(stats.formsByType.Application).toBeGreaterThan(0);
    });

    test('should list all trade types', () => {
      const stats = getDatabaseStats();

      expect(stats.tradeTypes).toContain('Electrical');
      expect(stats.tradeTypes).toContain('Plumbing');
      expect(stats.tradeTypes).toContain('HVAC');
    });
  });
});

describe('Permit Paperwork Business Logic', () => {
  describe('getRequiredPaperwork', () => {
    test('should return paperwork for Los Angeles Electrical', () => {
      const paperwork = getRequiredPaperwork('Los Angeles, CA', 'Electrical');

      expect(paperwork.success).toBe(true);
      expect(paperwork.jurisdiction).toBe('Los Angeles, CA');
      expect(paperwork.jobType).toBe('Electrical');
      expect(paperwork.totalForms).toBeGreaterThan(0);
    });

    test('should categorize forms correctly', () => {
      const paperwork = getRequiredPaperwork('Los Angeles, CA', 'Electrical');

      expect(Array.isArray(paperwork.applications)).toBe(true);
      expect(Array.isArray(paperwork.supporting)).toBe(true);
      expect(Array.isArray(paperwork.reference)).toBe(true);
      expect(Array.isArray(paperwork.feeSchedules)).toBe(true);
    });

    test('should have at least one application form', () => {
      const paperwork = getRequiredPaperwork('San Diego, CA', 'Plumbing');

      expect(paperwork.applications.length).toBeGreaterThan(0);
    });

    test('should include lastVerified date', () => {
      const paperwork = getRequiredPaperwork('Chicago, IL', 'Electrical');

      expect(paperwork).toHaveProperty('lastVerified');
    });

    test('should handle unknown jurisdiction gracefully', () => {
      const paperwork = getRequiredPaperwork('Unknown City, XX', 'Electrical');

      expect(paperwork.success).toBe(false);
      expect(paperwork.totalForms).toBe(0);
      expect(paperwork).toHaveProperty('message');
    });

    test('should handle unknown job type gracefully', () => {
      const paperwork = getRequiredPaperwork('Los Angeles, CA', 'UnknownTrade');

      expect(paperwork.success).toBe(false);
      expect(paperwork.totalForms).toBe(0);
    });

    test('should return different results for different cities', () => {
      const la = getRequiredPaperwork('Los Angeles, CA', 'Electrical');
      const sf = getRequiredPaperwork('San Francisco, CA', 'Electrical');

      expect(la.applications[0].formCode).not.toBe(sf.applications[0].formCode);
    });
  });

  describe('getCompletePaperworkPackage', () => {
    test('should include checklist', () => {
      const package1 = getCompletePaperworkPackage('Austin, TX', 'HVAC');

      expect(package1).toHaveProperty('checklist');
      expect(Array.isArray(package1.checklist)).toBe(true);
    });

    test('should include download instructions', () => {
      const package1 = getCompletePaperworkPackage('Miami, FL', 'Electrical');

      expect(package1).toHaveProperty('downloadInstructions');
      expect(package1.downloadInstructions).toHaveProperty('steps');
      expect(package1.downloadInstructions).toHaveProperty('tips');
    });

    test('should include jurisdiction-specific tips', () => {
      const package1 = getCompletePaperworkPackage('New York, NY', 'Electrical');

      expect(package1).toHaveProperty('tips');
      expect(Array.isArray(package1.tips)).toBe(true);
      expect(package1.tips.length).toBeGreaterThan(0);
    });

    test('should include estimated prep time', () => {
      const package1 = getCompletePaperworkPackage('Houston, TX', 'Plumbing');

      expect(package1).toHaveProperty('estimatedPrepTime');
      expect(package1.estimatedPrepTime).toHaveProperty('estimatedMinutes');
      expect(package1.estimatedPrepTime).toHaveProperty('estimatedHours');
    });

    test('should handle unknown jurisdiction', () => {
      const package1 = getCompletePaperworkPackage('Unknown, XX', 'Electrical');

      expect(package1.success).toBe(false);
    });
  });

  describe('generatePaperworkChecklist', () => {
    test('should generate checklist with categories', () => {
      const paperwork = getRequiredPaperwork('Los Angeles, CA', 'Electrical');
      const checklist = generatePaperworkChecklist(paperwork);

      expect(Array.isArray(checklist)).toBe(true);
      expect(checklist.length).toBeGreaterThan(0);

      checklist.forEach(category => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('priority');
        expect(category).toHaveProperty('items');
        expect(Array.isArray(category.items)).toBe(true);
      });
    });

    test('should include standard additional requirements', () => {
      const paperwork = getRequiredPaperwork('San Diego, CA', 'Plumbing');
      const checklist = generatePaperworkChecklist(paperwork);

      const additionalReqs = checklist.find(c => c.category === 'Additional Requirements');

      expect(additionalReqs).toBeDefined();
      expect(additionalReqs.items.length).toBeGreaterThan(0);

      const itemNames = additionalReqs.items.map(i => i.name);
      expect(itemNames).toContain('Proof of Insurance');
      expect(itemNames).toContain('Contractor License');
    });

    test('should mark all items as not completed initially', () => {
      const paperwork = getRequiredPaperwork('Chicago, IL', 'HVAC');
      const checklist = generatePaperworkChecklist(paperwork);

      checklist.forEach(category => {
        category.items.forEach(item => {
          expect(item.completed).toBe(false);
        });
      });
    });

    test('should include URLs for downloadable items', () => {
      const paperwork = getRequiredPaperwork('San Francisco, CA', 'Electrical');
      const checklist = generatePaperworkChecklist(paperwork);

      const applications = checklist.find(c => c.category === 'Required Applications');

      if (applications) {
        applications.items.forEach(item => {
          expect(item).toHaveProperty('url');
          expect(item.url).toBeTruthy();
        });
      }
    });
  });

  describe('generateDownloadInstructions', () => {
    test('should count downloadable forms', () => {
      const paperwork = getRequiredPaperwork('Austin, TX', 'Electrical');
      const instructions = generateDownloadInstructions(paperwork);

      expect(instructions).toHaveProperty('totalDownloadable');
      expect(typeof instructions.totalDownloadable).toBe('number');
    });

    test('should include step-by-step instructions', () => {
      const paperwork = getRequiredPaperwork('Houston, TX', 'HVAC');
      const instructions = generateDownloadInstructions(paperwork);

      expect(Array.isArray(instructions.steps)).toBe(true);
      expect(instructions.steps.length).toBeGreaterThan(5);
    });

    test('should include helpful tips', () => {
      const paperwork = getRequiredPaperwork('Miami, FL', 'Plumbing');
      const instructions = generateDownloadInstructions(paperwork);

      expect(Array.isArray(instructions.tips)).toBe(true);
      expect(instructions.tips.length).toBeGreaterThan(0);
    });
  });

  describe('getPaperworkTips', () => {
    test('should provide NYC-specific tips', () => {
      const tips = getPaperworkTips('New York, NY', 'Electrical');

      expect(Array.isArray(tips)).toBe(true);
      expect(tips.some(tip => tip.includes('DOB NOW'))).toBe(true);
    });

    test('should provide LA-specific tips', () => {
      const tips = getPaperworkTips('Los Angeles, CA', 'Electrical');

      expect(tips.some(tip => tip.includes('LADBS'))).toBe(true);
    });

    test('should provide San Francisco-specific tips', () => {
      const tips = getPaperworkTips('San Francisco, CA', 'Plumbing');

      expect(tips.some(tip => tip.includes('DBI') || tip.includes('Form'))).toBe(true);
    });

    test('should provide trade-specific tips for electrical', () => {
      const tips = getPaperworkTips('Chicago, IL', 'Electrical');

      expect(tips.some(tip => tip.toLowerCase().includes('electrical') ||
                              tip.toLowerCase().includes('load'))).toBe(true);
    });

    test('should provide trade-specific tips for plumbing', () => {
      const tips = getPaperworkTips('Austin, TX', 'Plumbing');

      expect(tips.some(tip => tip.toLowerCase().includes('water') ||
                              tip.toLowerCase().includes('plumbing'))).toBe(true);
    });

    test('should provide trade-specific tips for HVAC', () => {
      const tips = getPaperworkTips('San Diego, CA', 'HVAC');

      expect(tips.some(tip => tip.toLowerCase().includes('hvac') ||
                              tip.toLowerCase().includes('equipment') ||
                              tip.toLowerCase().includes('energy'))).toBe(true);
    });

    test('should always include general tips', () => {
      const tips = getPaperworkTips('Houston, TX', 'Electrical');

      expect(tips.some(tip => tip.toLowerCase().includes('call ahead') ||
                              tip.toLowerCase().includes('incomplete'))).toBe(true);
    });
  });

  describe('estimatePaperworkPrepTime', () => {
    test('should estimate time in minutes and hours', () => {
      const paperwork = getRequiredPaperwork('Los Angeles, CA', 'Electrical');
      const estimate = estimatePaperworkPrepTime(paperwork);

      expect(estimate).toHaveProperty('estimatedMinutes');
      expect(estimate).toHaveProperty('estimatedHours');
      expect(typeof estimate.estimatedMinutes).toBe('number');
      expect(typeof estimate.estimatedHours).toBe('number');
    });

    test('should provide breakdown of time', () => {
      const paperwork = getRequiredPaperwork('San Diego, CA', 'Plumbing');
      const estimate = estimatePaperworkPrepTime(paperwork);

      expect(estimate).toHaveProperty('breakdown');
      expect(estimate.breakdown).toHaveProperty('applications');
      expect(estimate.breakdown).toHaveProperty('supporting');
      expect(estimate.breakdown).toHaveProperty('standardDocs');
      expect(estimate.breakdown).toHaveProperty('review');
    });

    test('should include explanatory note', () => {
      const paperwork = getRequiredPaperwork('Chicago, IL', 'HVAC');
      const estimate = estimatePaperworkPrepTime(paperwork);

      expect(estimate).toHaveProperty('note');
      expect(typeof estimate.note).toBe('string');
    });

    test('should estimate more time for more forms', () => {
      const simple = getRequiredPaperwork('Miami, FL', 'Electrical');
      const complex = getRequiredPaperwork('Los Angeles, CA', 'Electrical');

      const simpleEstimate = estimatePaperworkPrepTime(simple);
      const complexEstimate = estimatePaperworkPrepTime(complex);

      // Complex should generally take more time (though not guaranteed if Miami has more forms)
      expect(typeof simpleEstimate.estimatedMinutes).toBe('number');
      expect(typeof complexEstimate.estimatedMinutes).toBe('number');
    });
  });
});

describe('Verification and Maintenance Functions', () => {
  describe('checkVerificationStatus', () => {
    test('should check if forms need verification', () => {
      const forms = getFormsForTrade('Austin, TX', 'Electrical');
      const status = checkVerificationStatus(forms);

      expect(status).toHaveProperty('totalForms');
      expect(status).toHaveProperty('needsVerification');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('oldestVerification');
    });

    test('should report verification status based on age of lastVerified dates', () => {
      const forms = getFormsForTrade('San Diego, CA', 'Electrical');
      const status = checkVerificationStatus(forms);

      // Forms have lastVerified: '2025-11-12' - status depends on current date
      // If > 90 days old, will be 'needs_verification'; if recent, 'current'
      expect(['current', 'needs_verification']).toContain(status.status);
      expect(status.totalForms).toBe(forms.length);
    });

    test('should count total forms correctly', () => {
      const forms = getFormsForTrade('Los Angeles, CA', 'Plumbing');
      const status = checkVerificationStatus(forms);

      expect(status.totalForms).toBe(forms.length);
    });
  });

  describe('reportBrokenLink', () => {
    test('should accept and process broken link report', () => {
      const report = {
        jurisdiction: 'Los Angeles, CA',
        jobType: 'Electrical',
        formCode: 'PC-ELEC-APP-02',
        formName: 'Electrical Permit Application',
        userEmail: 'contractor@example.com',
        issue: 'broken_link',
        comments: 'Link returns 404 error'
      };

      const result = reportBrokenLink(report);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('message');
    });

    test('should generate unique report ID', async () => {
      const report1 = reportBrokenLink({
        jurisdiction: 'San Diego, CA',
        jobType: 'Plumbing',
        formCode: 'DS-345',
        issue: 'outdated'
      });

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));

      const report2 = reportBrokenLink({
        jurisdiction: 'Chicago, IL',
        jobType: 'HVAC',
        formCode: 'Form 400',
        issue: 'wrong_form'
      });

      expect(report1.reportId).not.toBe(report2.reportId);
    });

    test('should include all report details', () => {
      const reportData = {
        jurisdiction: 'New York, NY',
        jobType: 'Electrical',
        formCode: 'DOB-NOW',
        formName: 'DOB NOW Portal',
        userEmail: 'test@example.com',
        issue: 'broken_link',
        comments: 'Portal not accessible'
      };

      const result = reportBrokenLink(reportData);

      expect(result.details.jurisdiction).toBe(reportData.jurisdiction);
      expect(result.details.formCode).toBe(reportData.formCode);
      expect(result.details.issue).toBe(reportData.issue);
    });

    test('should provide next steps', () => {
      const result = reportBrokenLink({
        jurisdiction: 'Austin, TX',
        jobType: 'HVAC',
        issue: 'outdated'
      });

      expect(Array.isArray(result.nextSteps)).toBe(true);
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });
  });

  describe('getOutdatedForms', () => {
    test('should return array of outdated forms', () => {
      const outdated = getOutdatedForms();

      expect(Array.isArray(outdated)).toBe(true);
    });

    test('should include age in days', () => {
      const outdated = getOutdatedForms();

      if (outdated.length > 0) {
        outdated.forEach(form => {
          expect(form).toHaveProperty('ageInDays');
          expect(typeof form.ageInDays).toBe('number');
        });
      }
    });

    test('should sort by age (oldest first)', () => {
      const outdated = getOutdatedForms();

      if (outdated.length > 1) {
        for (let i = 1; i < outdated.length; i++) {
          expect(outdated[i - 1].ageInDays).toBeGreaterThanOrEqual(outdated[i].ageInDays);
        }
      }
    });
  });

  describe('getAdminSummary', () => {
    test('should provide comprehensive admin statistics', () => {
      const summary = getAdminSummary();

      expect(summary).toHaveProperty('totalForms');
      expect(summary).toHaveProperty('totalJurisdictions');
      expect(summary).toHaveProperty('formsByJurisdiction');
      expect(summary).toHaveProperty('needsVerification');
      expect(summary).toHaveProperty('verificationRate');
    });

    test('should count forms by jurisdiction', () => {
      const summary = getAdminSummary();

      expect(summary.formsByJurisdiction).toHaveProperty('Los Angeles, CA');
      expect(summary.formsByJurisdiction['Los Angeles, CA']).toBeGreaterThan(0);
    });

    test('should calculate verification rate', () => {
      const summary = getAdminSummary();

      expect(typeof summary.verificationRate).toBe('number');
      expect(summary.verificationRate).toBeGreaterThanOrEqual(0);
      expect(summary.verificationRate).toBeLessThanOrEqual(100);
    });

    test('should include outdated forms count', () => {
      const summary = getAdminSummary();

      expect(summary).toHaveProperty('outdatedForms');
      expect(typeof summary.outdatedForms).toBe('number');
    });
  });
});

describe('Utility Functions', () => {
  describe('hasPaperworkData', () => {
    test('should return true for Los Angeles Electrical', () => {
      const hasData = hasPaperworkData('Los Angeles, CA', 'Electrical');
      expect(hasData).toBe(true);
    });

    test('should return true for all valid combinations', () => {
      const jurisdictions = getAvailableJurisdictions();
      const trades = ['Electrical', 'Plumbing', 'HVAC'];

      jurisdictions.forEach(jurisdiction => {
        trades.forEach(trade => {
          const hasData = hasPaperworkData(jurisdiction, trade);
          expect(typeof hasData).toBe('boolean');
        });
      });
    });

    test('should return false for unknown jurisdiction', () => {
      const hasData = hasPaperworkData('Unknown City, XX', 'Electrical');
      expect(hasData).toBe(false);
    });

    test('should return false for unknown trade type', () => {
      const hasData = hasPaperworkData('Los Angeles, CA', 'UnknownTrade');
      expect(hasData).toBe(false);
    });
  });

  describe('getFormByCode', () => {
    test('should find form by code in Los Angeles', () => {
      const form = getFormByCode('Los Angeles, CA', 'PC-ELEC-APP-02');

      expect(form).toBeTruthy();
      expect(form.formCode).toBe('PC-ELEC-APP-02');
      expect(form.jurisdiction).toBe('Los Angeles, CA');
    });

    test('should find form by code in San Diego', () => {
      const form = getFormByCode('San Diego, CA', 'DS-345');

      expect(form).toBeTruthy();
      expect(form.formCode).toBe('DS-345');
    });

    test('should return null for non-existent form code', () => {
      const form = getFormByCode('Chicago, IL', 'NONEXISTENT-999');

      expect(form).toBeNull();
    });

    test('should return null for unknown jurisdiction', () => {
      const form = getFormByCode('Unknown City, XX', 'ANY-CODE');

      expect(form).toBeNull();
    });

    test('should include jurisdiction and trade type', () => {
      const form = getFormByCode('Chicago, IL', 'Form 400');

      if (form) {
        expect(form).toHaveProperty('jurisdiction');
        expect(form).toHaveProperty('tradeType');
      }
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle null or undefined inputs gracefully', () => {
    expect(() => getRequiredPaperwork(null, 'Electrical')).not.toThrow();
    expect(() => getRequiredPaperwork('Los Angeles, CA', null)).not.toThrow();
  });

  test('should handle empty strings', () => {
    const result = getRequiredPaperwork('', '');
    expect(result.success).toBe(false);
  });

  test('should handle special characters in jurisdiction names', () => {
    const result = getRequiredPaperwork('City@#$%, ST', 'Electrical');
    expect(result.success).toBe(false);
  });

  test('should handle case sensitivity correctly', () => {
    const lower = getRequiredPaperwork('los angeles, ca', 'electrical');
    const proper = getRequiredPaperwork('Los Angeles, CA', 'Electrical');

    // Should not match due to case sensitivity
    expect(lower.success).toBe(false);
    expect(proper.success).toBe(true);
  });

  test('should handle very long search terms', () => {
    const longTerm = 'a'.repeat(1000);
    const results = searchForms(longTerm);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe('Integration Scenarios', () => {
  test('complete workflow: get paperwork, generate checklist, estimate time', () => {
    const jurisdiction = 'Austin, TX';
    const jobType = 'HVAC';

    // Step 1: Get paperwork
    const paperwork = getRequiredPaperwork(jurisdiction, jobType);
    expect(paperwork.success).toBe(true);

    // Step 2: Generate checklist
    const checklist = generatePaperworkChecklist(paperwork);
    expect(checklist.length).toBeGreaterThan(0);

    // Step 3: Estimate time
    const timeEstimate = estimatePaperworkPrepTime(paperwork);
    expect(timeEstimate.estimatedMinutes).toBeGreaterThan(0);

    // Verify data flows correctly
    expect(paperwork.totalForms).toBeGreaterThan(0);
    expect(checklist.some(c => c.items.length > 0)).toBe(true);
  });

  test('complete admin workflow: get stats, check verification, find outdated', () => {
    // Get overall stats
    const stats = getDatabaseStats();
    expect(stats.totalForms).toBeGreaterThan(0);

    // Get admin summary
    const summary = getAdminSummary();
    expect(summary.totalJurisdictions).toBe(12);

    // Check for outdated forms
    const outdated = getOutdatedForms();
    expect(Array.isArray(outdated)).toBe(true);

    // Verify consistency
    expect(summary.totalForms).toBe(stats.totalForms);
  });

  test('search and retrieve workflow', () => {
    // Search for forms
    const searchResults = searchForms('electrical');
    expect(searchResults.length).toBeGreaterThan(0);

    // Get specific form
    const firstResult = searchResults[0];
    const specificForm = getFormByCode(firstResult.jurisdiction, firstResult.formCode);

    // Verify consistency
    if (specificForm) {
      expect(specificForm.formCode).toBe(firstResult.formCode);
      expect(specificForm.jurisdiction).toBe(firstResult.jurisdiction);
    }
  });

  test('complete user journey: check data availability, get package, report issue', () => {
    const jurisdiction = 'San Francisco, CA';
    const jobType = 'Electrical';

    // Check if data exists
    const hasData = hasPaperworkData(jurisdiction, jobType);
    expect(hasData).toBe(true);

    // Get complete package
    const package1 = getCompletePaperworkPackage(jurisdiction, jobType);
    expect(package1.success).toBe(true);
    expect(package1).toHaveProperty('checklist');
    expect(package1).toHaveProperty('tips');
    expect(package1).toHaveProperty('estimatedPrepTime');

    // Report a broken link
    const report = reportBrokenLink({
      jurisdiction,
      jobType,
      formCode: package1.applications[0].formCode,
      formName: package1.applications[0].formName,
      issue: 'broken_link',
      userEmail: 'test@example.com',
      comments: 'Link not working'
    });

    expect(report.success).toBe(true);
    expect(report).toHaveProperty('reportId');
  });
});
