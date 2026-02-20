/**
 * Permit Paperwork Database
 *
 * Comprehensive database of required permit forms and documents across jurisdictions.
 * Curated and verified links to official building department forms.
 *
 * Data Structure:
 * - jurisdiction: City, State
 * - tradeType: Type of work (Electrical, Plumbing, etc.)
 * - formType: Category of form (Application, Supporting, Reference, Fee Schedule)
 * - formName: Official name of the form
 * - formCode: Official form number/code (if applicable)
 * - url: Direct link to current form
 * - description: What the form is for
 * - revisionDate: When the form was last updated (if known)
 * - lastVerified: When we last verified the link works
 * - isFillable: Whether it's a fillable PDF
 * - fileType: pdf, docx, html
 * - notes: Any additional information
 */

const permitPaperwork = {
  // Los Angeles, CA
  'Los Angeles, CA': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Electrical Permit Application',
        formCode: 'PC-ELEC-APP-02',
        url: 'https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/PC-ELEC-APP-02.pdf',
        description: 'Primary application for electrical work permits in Los Angeles',
        revisionDate: '2024-05-28',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Required for all electrical work requiring permits'
      },
      {
        formType: 'Supporting',
        formName: 'Notice to Property Owner',
        formCode: 'PC17-001',
        url: 'https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/notice-to-property-owner.pdf',
        description: 'Required notice to property owner about permit work',
        revisionDate: '2023-06-15',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Must be signed by property owner if contractor is applicant'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Electrical Permit Fee Schedule',
        formCode: 'FEE-ELEC-2025',
        url: 'https://dbs.lacity.gov/services/plan-review-permitting/fees',
        description: 'Current fee schedule for electrical permits',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated annually on January 1st'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Plumbing Permit Application',
        formCode: 'PC-PLUMB-APP-03',
        url: 'https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/PC-PLUMB-APP-03.pdf',
        description: 'Primary application for plumbing work permits in Los Angeles',
        revisionDate: '2024-03-15',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Required for all plumbing work requiring permits'
      },
      {
        formType: 'Supporting',
        formName: 'Notice to Property Owner',
        formCode: 'PC17-001',
        url: 'https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/notice-to-property-owner.pdf',
        description: 'Required notice to property owner about permit work',
        revisionDate: '2023-06-15',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Must be signed by property owner if contractor is applicant'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Mechanical Permit Application',
        formCode: 'PC-MECH-APP-04',
        url: 'https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/PC-MECH-APP-04.pdf',
        description: 'Primary application for HVAC/mechanical work permits',
        revisionDate: '2024-04-10',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Required for HVAC installations, replacements, and modifications'
      }
    ]
  },

  // San Diego, CA
  'San Diego, CA': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'DS-345',
        url: 'https://www.sandiego.gov/sites/default/files/ds345.pdf',
        description: 'Project contacts and application information',
        revisionDate: '2024-10-15',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'General permit application form for all trades'
      },
      {
        formType: 'Reference',
        formName: 'Information Bulletin 101 - Permit Requirements',
        formCode: 'IB-101',
        url: 'https://www.sandiego.gov/sites/default/files/ib101.pdf',
        description: 'Overview of when permits are required',
        revisionDate: '2024-08-20',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Helpful reference for determining permit requirements'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Development Services Fee Schedule',
        formCode: 'FEE-2025',
        url: 'https://www.sandiego.gov/development-services/news-programs/fees',
        description: 'Current fee schedule for all permits',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated annually on January 1st'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'DS-345',
        url: 'https://www.sandiego.gov/sites/default/files/ds345.pdf',
        description: 'Project contacts and application information',
        revisionDate: '2024-10-15',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'General permit application form for all trades'
      },
      {
        formType: 'Supporting',
        formName: 'Water Meter Data Card',
        formCode: 'DS-16',
        url: 'https://www.sandiego.gov/sites/default/files/ds16.pdf',
        description: 'Required for plumbing work affecting water service',
        revisionDate: '2023-12-01',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Required for new installations or modifications'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'DS-345',
        url: 'https://www.sandiego.gov/sites/default/files/ds345.pdf',
        description: 'Project contacts and application information',
        revisionDate: '2024-10-15',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'General permit application form for all trades'
      }
    ]
  },

  // San Francisco, CA
  'San Francisco, CA': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Building Permit Application Form 3/8',
        formCode: 'Form 3/8',
        url: 'https://media.api.sf.gov/documents/Form-3-8-Fillable-2020-04-07-FINAL_AxgX5Eg.pdf',
        description: 'Additions/Alterations permit application (includes electrical)',
        revisionDate: '2020-04-07',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'The "pink form" - most common for electrical work'
      },
      {
        formType: 'Supporting',
        formName: 'Licensed Contractor Statement',
        formCode: 'DBI-LCS',
        url: 'https://media.api.sf.gov/documents/DBI.LicensedContractorStatement.2.13.25.pdf',
        description: 'Required contractor license verification',
        revisionDate: '2025-02-13',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Must be completed by licensed contractor'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Building Permit Fees',
        formCode: 'FEE-2025',
        url: 'https://www.sf.gov/resource/2025/building-permit-fees',
        description: 'Current fee schedule for building permits',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated annually'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Plumbing Permit Application Worksheet',
        formCode: 'DBI-PLUMB',
        url: 'https://media.api.sf.gov/documents/PlumbingPermitWorksheet.pdf',
        description: 'Detailed plumbing work description form',
        revisionDate: '2024-06-01',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Required for all plumbing permits'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Mechanical Permit Application Worksheet',
        formCode: 'DBI-MECH',
        url: 'https://media.api.sf.gov/documents/MechanicalPermitWorksheet.pdf',
        description: 'Detailed mechanical/HVAC work description form',
        revisionDate: '2024-06-01',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Required for all HVAC permits'
      }
    ]
  },

  // Austin, TX
  'Austin, TX': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Stand-Alone Trade Permit Application',
        formCode: 'SC-TRADE',
        url: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/SC_StandAloneTradePermit.pdf',
        description: 'Application for electrical trade permits',
        revisionDate: '2024-09-11',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'For electrical work not requiring full building permit'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Development Services Fee Schedule',
        formCode: 'FEE-2025',
        url: 'https://www.austintexas.gov/department/development-services-fees',
        description: 'Current fee schedule for all permits',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated annually'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Stand-Alone Trade Permit Application',
        formCode: 'SC-TRADE',
        url: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/SC_StandAloneTradePermit.pdf',
        description: 'Application for plumbing trade permits',
        revisionDate: '2024-09-11',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'For plumbing work not requiring full building permit'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Mechanical Permit Request',
        formCode: 'SC-MECH',
        url: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/SC_MechanicalPermitRequest.pdf',
        description: 'Application for mechanical/HVAC permits',
        revisionDate: '2024-08-15',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Required for HVAC installations and modifications'
      },
      {
        formType: 'Application',
        formName: 'Residential Change-Out Permit Application',
        formCode: 'SC-CHANGEOUT',
        url: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/SC_ResidentialChange-OutPermitApplication.pdf',
        description: 'Simplified permit for HVAC/water heater replacements',
        revisionDate: '2024-07-20',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'For like-for-like replacements only'
      }
    ]
  },

  // Houston, TX
  'Houston, TX': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'HPD-APP',
        url: 'https://www.houstonpermittingcenter.org/resources',
        description: 'General building permit application (includes electrical)',
        revisionDate: '2025-01-15',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Access forms through resources page - dynamic download system'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Permit Fee Schedule',
        formCode: 'FEE-2025',
        url: 'https://www.houstonpermittingcenter.org/fee-schedule',
        description: 'Current fee schedule for all permits',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated annually'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Plumbing and Irrigation System Permit',
        formCode: 'CE1020',
        url: 'https://www.houstonpermittingcenter.org/resources',
        description: 'Permit application for plumbing work',
        revisionDate: '2025-01-20',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Access through resources page'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Mechanical Permit Application',
        formCode: 'HPD-MECH',
        url: 'https://www.houstonpermittingcenter.org/resources',
        description: 'Application for HVAC/mechanical permits',
        revisionDate: '2025-01-15',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Access through resources page'
      }
    ]
  },

  // Miami, FL
  'Miami, FL': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'MIA-BLD',
        url: 'https://www.miami.gov/Permits-Construction/Permitting-Resources/Permitting-Forms-Documents',
        description: 'General building permit application',
        revisionDate: '2024-12-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Moving to digital-only applications - check online portal'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Building Permit Fees',
        formCode: 'FEE-2025',
        url: 'https://www.miami.gov/Permits-Construction/Fee-Schedule',
        description: 'Current fee schedule',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated annually'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'MIA-BLD',
        url: 'https://www.miami.gov/Permits-Construction/Permitting-Resources/Permitting-Forms-Documents',
        description: 'General building permit application',
        revisionDate: '2024-12-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Moving to digital-only applications'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'MIA-BLD',
        url: 'https://www.miami.gov/Permits-Construction/Permitting-Resources/Permitting-Forms-Documents',
        description: 'General building permit application',
        revisionDate: '2024-12-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Moving to digital-only applications'
      }
    ]
  },

  // Chicago, IL
  'Chicago, IL': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'Form 400',
        url: 'https://www.chicago.gov/content/dam/city/depts/bldgs/general/forms/Form400_111323.pdf',
        description: 'General building permit application',
        revisionDate: '2023-11-13',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Primary permit application form'
      },
      {
        formType: 'Application',
        formName: 'Express Permit - Electrical',
        formCode: 'Form 401EX',
        url: 'https://www.chicago.gov/content/dam/city/depts/bldgs/general/forms/ExpressPermit401EX.pdf',
        description: 'Simplified electrical permit for qualifying work',
        revisionDate: '2024-03-01',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'For minor electrical work only'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Building Permit Fee Schedule',
        formCode: 'FEE-2025',
        url: 'https://www.chicago.gov/city/en/depts/bldgs/provdrs/permits/svcs/building-permit-fees.html',
        description: 'Current fee schedule',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated annually'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'Form 400',
        url: 'https://www.chicago.gov/content/dam/city/depts/bldgs/general/forms/Form400_111323.pdf',
        description: 'General building permit application',
        revisionDate: '2023-11-13',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Primary permit application form'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Building Permit Application',
        formCode: 'Form 400',
        url: 'https://www.chicago.gov/content/dam/city/depts/bldgs/general/forms/Form400_111323.pdf',
        description: 'General building permit application',
        revisionDate: '2023-11-13',
        lastVerified: '2025-11-12',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Primary permit application form'
      }
    ]
  },

  // New York, NY
  'New York, NY': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'DOB NOW Online Portal',
        formCode: 'DOB-NOW',
        url: 'https://a810-dobnow.nyc.gov/',
        description: 'NYC requires electronic permit applications through DOB NOW',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Portal registration required - no paper applications for most permits'
      },
      {
        formType: 'Reference',
        formName: 'DOB NOW User Guide',
        formCode: 'DOB-GUIDE',
        url: 'https://www.nyc.gov/site/buildings/dob/building-applications-permits.page',
        description: 'Guide to using DOB NOW portal',
        revisionDate: '2024-11-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Comprehensive guide to electronic filing'
      },
      {
        formType: 'Fee Schedule',
        formName: 'DOB Fee Schedule',
        formCode: 'FEE-2025',
        url: 'https://www.nyc.gov/site/buildings/business/dob-fees.page',
        description: 'Current fee schedule for all permits',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Updated periodically'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'DOB NOW Online Portal',
        formCode: 'DOB-NOW',
        url: 'https://a810-dobnow.nyc.gov/',
        description: 'NYC requires electronic permit applications through DOB NOW',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Portal registration required'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'DOB NOW Online Portal',
        formCode: 'DOB-NOW',
        url: 'https://a810-dobnow.nyc.gov/',
        description: 'NYC requires electronic permit applications through DOB NOW',
        revisionDate: '2025-01-01',
        lastVerified: '2025-11-12',
        isFillable: false,
        fileType: 'html',
        notes: 'Portal registration required'
      }
    ]
  },

  // Milwaukee, WI
  'Milwaukee, WI': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Electrical Permit Application',
        formCode: 'EAppElectric',
        url: 'https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/build/pdfs/EAppElectric.pdf',
        description: 'Primary application for electrical work permits in Milwaukee',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Must be licensed electrician to pull permits'
      },
      {
        formType: 'Reference',
        formName: 'Electrical Permit Info Sheet',
        formCode: 'DNS-Electrical',
        url: 'https://city.milwaukee.gov/DNS/permits/Electrical.pdf',
        description: 'DNS info sheet covering electrical permit requirements and process',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Reference document for electrical permit applicants'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Plan Review and Permit Fees',
        formCode: 'DevCenterFeeCombo',
        url: 'https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/DevCenterFeeCombo.pdf',
        description: 'Consolidated fee schedule for all DNS permits and plan reviews',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Summary of MCO Chapter 81 fees. Updated annually January 1st'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Plumbing Plan Examination Application',
        formCode: 'Plumbing-Plan-Exam-App',
        url: 'https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/Plumbing-Plan-Exam-Application-Form-2025-04-08.pdf',
        description: 'Primary application for plumbing plan examination and permits',
        revisionDate: '2025-04-08',
        lastVerified: '2026-02-19',
        isFillable: true,
        fileType: 'pdf',
        notes: 'All plumbing work requires a permit from the Development Center. Must be licensed plumber.'
      },
      {
        formType: 'Reference',
        formName: 'Plumbing & Gas Piping Plan Review Checklist',
        formCode: 'Info-Sheet-19',
        url: 'https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/19---Info-Sheet-Plumbing--Gas-Piping-Plan-Review-Checklist_2024.pdf',
        description: 'Checklist of required documents for plumbing/gas piping plan review submission',
        revisionDate: '2024-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Use this checklist to ensure complete submission'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Plan Review and Permit Fees',
        formCode: 'DevCenterFeeCombo',
        url: 'https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/DevCenterFeeCombo.pdf',
        description: 'Consolidated fee schedule for all DNS permits and plan reviews',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Plumbing plan review: 1.6% of project cost (min $200). Minor alteration: $110'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Plan Examination Application',
        formCode: 'EAppPlanExam',
        url: 'https://city.milwaukee.gov/DNS/planning/EAppPlanExam.PDF',
        description: 'General plan examination application - select HVAC Plan type for mechanical permits',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Multi-purpose form: check "HVAC Plan" box. Covers boiler, furnace, AC, refrigeration'
      },
      {
        formType: 'Reference',
        formName: 'HVAC Plan Review Requirements',
        formCode: 'DNS-HVAC-PlanReview',
        url: 'https://city.milwaukee.gov/DNS/planning/hvacplan.pdf',
        description: 'HVAC plan review submission requirements and process',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Requires 4 sets HVAC plans, 1 set architectural plans, 1 copy HVAC specifications'
      },
      {
        formType: 'Fee Schedule',
        formName: 'Plan Review and Permit Fees',
        formCode: 'DevCenterFeeCombo',
        url: 'https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/DevCenterFeeCombo.pdf',
        description: 'Consolidated fee schedule for all DNS permits and plan reviews',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Mechanical plan review: 1.6% of cost (min $200 for 1-2 family)'
      }
    ]
  },

  // Phoenix, AZ
  'Phoenix, AZ': {
    'Electrical': [
      {
        formType: 'Application',
        formName: 'Residential Construction Permit / Plan Review Application',
        formCode: 'TRT 00030',
        url: 'https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00030.pdf',
        description: 'Unified application for all residential permits including electrical',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Single form covers Electrical, Mechanical/Plumbing, and Structural via checkboxes'
      },
      {
        formType: 'Supporting',
        formName: 'Special Inspection Certificate, Electrical',
        formCode: 'TRT 00274',
        url: 'https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00274.pdf',
        description: 'Required special inspection certificate for electrical work',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Submit with permit application when special inspections are required'
      },
      {
        formType: 'Fee Schedule',
        formName: 'PDD Development Fee Schedule',
        formCode: 'PDD-FEE-2026',
        url: 'https://www.phoenix.gov/administration/departments/pdd/tools-resources/fees.html',
        description: 'Current fee schedule for all permits (updated January 20, 2026)',
        revisionDate: '2026-01-20',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'html',
        notes: 'Valuation-based fees: $150 minimum, plan review adds 80-100% of permit fee'
      }
    ],
    'Plumbing': [
      {
        formType: 'Application',
        formName: 'Residential Construction Permit / Plan Review Application',
        formCode: 'TRT 00030',
        url: 'https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00030.pdf',
        description: 'Unified application for all residential permits including plumbing',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Single form covers Electrical, Mechanical/Plumbing, and Structural via checkboxes'
      },
      {
        formType: 'Supporting',
        formName: 'Backflow Installation Application',
        formCode: 'TRT 00344',
        url: 'https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00344.pdf',
        description: 'Application for backflow prevention device installation',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Required when installing backflow prevention devices'
      },
      {
        formType: 'Fee Schedule',
        formName: 'PDD Development Fee Schedule',
        formCode: 'PDD-FEE-2026',
        url: 'https://www.phoenix.gov/administration/departments/pdd/tools-resources/fees.html',
        description: 'Current fee schedule for all permits (updated January 20, 2026)',
        revisionDate: '2026-01-20',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'html',
        notes: 'Valuation-based fees: $150 minimum, plan review adds 80-100% of permit fee'
      }
    ],
    'HVAC': [
      {
        formType: 'Application',
        formName: 'Residential Construction Permit / Plan Review Application',
        formCode: 'TRT 00030',
        url: 'https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00030.pdf',
        description: 'Unified application for all residential permits including mechanical/HVAC',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: true,
        fileType: 'pdf',
        notes: 'Single form covers Electrical, Mechanical/Plumbing, and Structural via checkboxes'
      },
      {
        formType: 'Supporting',
        formName: 'Energy Compliance Certificate (Residential)',
        formCode: 'TRT 00459',
        url: 'https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00459.pdf',
        description: 'Energy code compliance certificate for HVAC installations',
        revisionDate: '2025-01-01',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'pdf',
        notes: 'Required for HVAC installations to demonstrate energy code compliance'
      },
      {
        formType: 'Fee Schedule',
        formName: 'PDD Development Fee Schedule',
        formCode: 'PDD-FEE-2026',
        url: 'https://www.phoenix.gov/administration/departments/pdd/tools-resources/fees.html',
        description: 'Current fee schedule for all permits (updated January 20, 2026)',
        revisionDate: '2026-01-20',
        lastVerified: '2026-02-19',
        isFillable: false,
        fileType: 'html',
        notes: 'Valuation-based fees: $150 minimum, plan review adds 80-100% of permit fee'
      }
    ]
  }
};

/**
 * Get all forms for a specific jurisdiction and trade type
 * @param {string} jurisdiction - e.g., "Los Angeles, CA"
 * @param {string} tradeType - e.g., "Electrical"
 * @returns {Array} Array of form objects
 */
function getFormsForTrade(jurisdiction, tradeType) {
  if (!permitPaperwork[jurisdiction]) {
    return [];
  }

  return permitPaperwork[jurisdiction][tradeType] || [];
}

/**
 * Get all forms for a jurisdiction (all trade types)
 * @param {string} jurisdiction - e.g., "Los Angeles, CA"
 * @returns {Object} Object with trade types as keys
 */
function getAllFormsForJurisdiction(jurisdiction) {
  return permitPaperwork[jurisdiction] || {};
}

/**
 * Get all jurisdictions that have paperwork data
 * @returns {Array} Array of jurisdiction names
 */
function getAvailableJurisdictions() {
  return Object.keys(permitPaperwork);
}

/**
 * Get all forms of a specific type across all jurisdictions
 * @param {string} formType - e.g., "Application", "Fee Schedule"
 * @returns {Array} Array of forms matching the type
 */
function getFormsByType(formType) {
  const results = [];

  for (const jurisdiction in permitPaperwork) {
    for (const tradeType in permitPaperwork[jurisdiction]) {
      const forms = permitPaperwork[jurisdiction][tradeType];
      const matchingForms = forms.filter(form => form.formType === formType);

      matchingForms.forEach(form => {
        results.push({
          jurisdiction,
          tradeType,
          ...form
        });
      });
    }
  }

  return results;
}

/**
 * Search forms by keyword
 * @param {string} keyword - Search term
 * @returns {Array} Array of matching forms
 */
function searchForms(keyword) {
  const results = [];
  const searchTerm = keyword.toLowerCase();

  for (const jurisdiction in permitPaperwork) {
    for (const tradeType in permitPaperwork[jurisdiction]) {
      const forms = permitPaperwork[jurisdiction][tradeType];

      forms.forEach(form => {
        const searchableText = `${form.formName} ${form.formCode} ${form.description} ${form.notes}`.toLowerCase();

        if (searchableText.includes(searchTerm)) {
          results.push({
            jurisdiction,
            tradeType,
            ...form
          });
        }
      });
    }
  }

  return results;
}

/**
 * Get statistics about the paperwork database
 * @returns {Object} Statistics object
 */
function getDatabaseStats() {
  let totalForms = 0;
  let totalJurisdictions = 0;
  const formsByType = {};
  const tradeTypes = new Set();

  for (const jurisdiction in permitPaperwork) {
    totalJurisdictions++;

    for (const tradeType in permitPaperwork[jurisdiction]) {
      tradeTypes.add(tradeType);
      const forms = permitPaperwork[jurisdiction][tradeType];
      totalForms += forms.length;

      forms.forEach(form => {
        formsByType[form.formType] = (formsByType[form.formType] || 0) + 1;
      });
    }
  }

  return {
    totalForms,
    totalJurisdictions,
    totalTradeTypes: tradeTypes.size,
    formsByType,
    tradeTypes: Array.from(tradeTypes).sort(),
    jurisdictions: Object.keys(permitPaperwork).sort()
  };
}

module.exports = {
  permitPaperwork,
  getFormsForTrade,
  getAllFormsForJurisdiction,
  getAvailableJurisdictions,
  getFormsByType,
  searchForms,
  getDatabaseStats
};
