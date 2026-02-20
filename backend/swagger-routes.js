/**
 * Swagger route documentation (JSDoc annotations only, no executable code)
 */

// ============================================================
// PERMITS
// ============================================================

/**
 * @openapi
 * /api/check-requirements:
 *   post:
 *     tags: [Permits]
 *     summary: Get permit pricing and requirements
 *     description: Returns calculated pricing, requirements markdown, client templates, and inspection list for a given job type and location.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobType, city, state]
 *             properties:
 *               jobType:
 *                 type: string
 *                 example: Electrical Work
 *               city:
 *                 type: string
 *                 example: Los Angeles
 *               state:
 *                 type: string
 *                 example: CA
 *               projectType:
 *                 type: string
 *                 enum: [Residential, Commercial, Industrial]
 *                 default: Residential
 *               scope:
 *                 type: string
 *                 enum: [New Installation, Repair/Service, Replacement, Renovation, Addition]
 *               description:
 *                 type: string
 *               projectValue:
 *                 type: number
 *                 default: 5000
 *     responses:
 *       200:
 *         description: Pricing, requirements, templates, and inspections
 *       400:
 *         description: Missing required fields
 */

/**
 * @openapi
 * /api/verified-cities:
 *   get:
 *     tags: [Permits]
 *     summary: Get verified cities with permit data
 *     description: Returns all cities with verified (non-estimated) fee data.
 *     responses:
 *       200:
 *         description: List of verified cities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       source:
 *                         type: string
 *                       lastVerified:
 *                         type: string
 *                       url:
 *                         type: string
 *                 count:
 *                   type: integer
 */

// ============================================================
// COMPARISON
// ============================================================

/**
 * @openapi
 * /api/jurisdictions:
 *   get:
 *     tags: [Comparison]
 *     summary: Get all supported jurisdictions
 *     responses:
 *       200:
 *         description: List of jurisdictions with city/state/location
 */

/**
 * @openapi
 * /api/compare-jurisdictions:
 *   post:
 *     tags: [Comparison]
 *     summary: Compare pricing across jurisdictions
 *     description: Side-by-side comparison of permit fees, charges, and processing times.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jurisdictions, jobType]
 *             properties:
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Los Angeles, CA", "San Diego, CA"]
 *               jobType:
 *                 type: string
 *                 example: Electrical
 *     responses:
 *       200:
 *         description: Comparison results with analysis and differences
 *       400:
 *         description: Missing or invalid parameters
 */

/**
 * @openapi
 * /api/jurisdiction-strategy:
 *   post:
 *     tags: [Comparison]
 *     summary: Calculate optimal pricing strategy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jurisdictions, jobType]
 *             properties:
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Optimal strategy with average charge, best margin, fastest processing
 */

/**
 * @openapi
 * /api/quick-reference:
 *   post:
 *     tags: [Comparison]
 *     summary: Generate quick reference guide
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jurisdictions, jobTypes]
 *             properties:
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Quick reference grid
 */

// ============================================================
// PAPERWORK
// ============================================================

/**
 * @openapi
 * /api/required-paperwork:
 *   post:
 *     tags: [Paperwork]
 *     summary: Get required paperwork for a permit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jurisdiction, jobType]
 *             properties:
 *               jurisdiction:
 *                 type: string
 *                 example: "Los Angeles, CA"
 *               jobType:
 *                 type: string
 *                 example: Electrical
 *     responses:
 *       200:
 *         description: Categorized forms and documents
 */

/**
 * @openapi
 * /api/complete-paperwork-package:
 *   post:
 *     tags: [Paperwork]
 *     summary: Get complete paperwork package with checklist and tips
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jurisdiction, jobType]
 *             properties:
 *               jurisdiction:
 *                 type: string
 *               jobType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Full package with checklist, tips, prep time, download instructions
 */

/**
 * @openapi
 * /api/paperwork-jurisdictions:
 *   get:
 *     tags: [Paperwork]
 *     summary: Get all jurisdictions with paperwork data
 *     responses:
 *       200:
 *         description: List of jurisdictions
 */

/**
 * @openapi
 * /api/search-forms/{keyword}:
 *   get:
 *     tags: [Paperwork]
 *     summary: Search forms by keyword
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching forms
 */

/**
 * @openapi
 * /api/report-broken-link:
 *   post:
 *     tags: [Paperwork]
 *     summary: Report a broken or outdated form link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jurisdiction, formCode, issue]
 *             properties:
 *               jurisdiction:
 *                 type: string
 *               jobType:
 *                 type: string
 *               formCode:
 *                 type: string
 *               formName:
 *                 type: string
 *               userEmail:
 *                 type: string
 *               issue:
 *                 type: string
 *                 enum: [broken_link, outdated, wrong_form, other]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report confirmation with ID
 */

// ============================================================
// ADMIN
// ============================================================

/**
 * @openapi
 * /api/admin/scraper-health:
 *   get:
 *     tags: [Admin]
 *     summary: Get scraper health dashboard
 *     description: Status of all scrapers including freshness, recommendations, and last run info.
 *     responses:
 *       200:
 *         description: Health status for all scrapers
 */

/**
 * @openapi
 * /api/admin/link-check:
 *   get:
 *     tags: [Admin]
 *     summary: Quick link health check (unique URLs)
 *     description: Validates all unique paperwork URLs with HTTP HEAD requests.
 *     responses:
 *       200:
 *         description: Link health results
 */

/**
 * @openapi
 * /api/admin/link-check/full:
 *   get:
 *     tags: [Admin]
 *     summary: Full link health check (all forms)
 *     responses:
 *       200:
 *         description: Complete link health report
 */

/**
 * @openapi
 * /api/admin/scheduler:
 *   get:
 *     tags: [Admin]
 *     summary: Get scheduler status
 *     responses:
 *       200:
 *         description: Scheduler state and recent runs
 */

/**
 * @openapi
 * /api/admin/scheduler/start:
 *   post:
 *     tags: [Admin]
 *     summary: Start the scraper scheduler
 *     responses:
 *       200:
 *         description: Scheduler started
 */

/**
 * @openapi
 * /api/admin/scheduler/stop:
 *   post:
 *     tags: [Admin]
 *     summary: Stop the scraper scheduler
 *     responses:
 *       200:
 *         description: Scheduler stopped
 */

/**
 * @openapi
 * /api/admin/scrape/{city}:
 *   post:
 *     tags: [Admin]
 *     summary: Trigger manual scrape for a city
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         example: "Los Angeles, CA"
 *     responses:
 *       200:
 *         description: Scrape results
 */

/**
 * @openapi
 * /api/admin/paperwork-stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get paperwork database statistics
 *     responses:
 *       200:
 *         description: Form counts and type breakdown
 */

/**
 * @openapi
 * /api/admin/paperwork-summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin summary with verification rates
 *     responses:
 *       200:
 *         description: Summary statistics
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Admin]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service status
 */
