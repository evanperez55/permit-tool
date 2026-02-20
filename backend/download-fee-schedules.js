/**
 * Download Permit Fee Schedule PDFs
 *
 * This script downloads the official permit fee schedule PDFs from each city
 * so we can manually review and extract the current fee information.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create downloads directory if it doesn't exist
const DOWNLOADS_DIR = path.join(__dirname, 'fee-schedule-pdfs');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// List of PDF URLs to download
const FEE_SCHEDULE_PDFS = [
    {
        city: 'Los Angeles, CA',
        type: 'Electrical',
        url: 'https://ladbs.org/docs/default-source/forms/plan-check-2014/permit-fee-schedule-for-electrical-permits-pc-elec-feesched01.pdf',
        filename: 'los-angeles-electrical-fees.pdf'
    },
    {
        city: 'Los Angeles, CA',
        type: 'Plumbing',
        url: 'https://www.ladbs.org/docs/default-source/forms/plan-check-2014/plumbing-permit-fee-schedule.pdf',
        filename: 'los-angeles-plumbing-fees.pdf'
    },
    {
        city: 'San Diego, CA',
        type: 'MEP (Mechanical, Electrical, Plumbing)',
        url: 'https://www.sandiego.gov/sites/default/files/2024-12/ib-103-fee-schedule-for-mechanical-electrical-plumbing_gas-permits.pdf',
        filename: 'san-diego-mep-fees-ib103.pdf'
    },
    {
        city: 'San Francisco, CA',
        type: 'Electrical',
        url: 'https://sfdbi.org/sites/default/files/Documents/Fees/Table1AEElectricalPermitIssuanceandInspection.pdf',
        filename: 'san-francisco-electrical-fees.pdf'
    },
    {
        city: 'San Francisco, CA',
        type: 'Plumbing/Mechanical',
        url: 'https://sfdbi.org/sites/default/files/Documents/Fees/Table1ACPlumbingMechanicalPermitIssuanceandInspection.pdf',
        filename: 'san-francisco-plumbing-mechanical-fees.pdf'
    },
    {
        city: 'Austin, TX',
        type: 'Residential Fees',
        url: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/Fees_Residential.pdf',
        filename: 'austin-residential-fees.pdf'
    },
    {
        city: 'Austin, TX',
        type: 'Commercial Fees',
        url: 'https://www.austintexas.gov/sites/default/files/files/Development_Services/Fees_Commercial.pdf',
        filename: 'austin-commercial-fees.pdf'
    },
    {
        city: 'Houston, TX',
        type: 'All Permits',
        url: 'https://www.houstonpermittingcenter.org/media/2636/download',
        filename: 'houston-permit-fees-2025.pdf'
    },
    {
        city: 'Miami, FL',
        type: 'Building Permit Fees',
        url: 'https://www.miami.gov/files/sharedassets/public/v/1/building/buildingpermitfeeschedule.pdf',
        filename: 'miami-building-fees.pdf'
    },
    {
        city: 'Chicago, IL',
        type: 'Fee Calculator Info',
        url: 'https://www.chicago.gov/city/en/depts/bldgs/provdrs/permits/svcs/permit_fee_calculator.html',
        filename: 'chicago-fee-calculator-info.html',
        note: 'Chicago uses a calculator - may need to manually test different scenarios'
    },
    {
        city: 'New York, NY',
        type: 'DOB Fees',
        url: 'https://www.nyc.gov/site/buildings/industry/building-fees.page',
        filename: 'nyc-dob-fees-info.html',
        note: 'NYC may have fees embedded in online system - check DOB NOW'
    }
];

/**
 * Download a file from URL
 */
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(filepath);

        const request = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filepath);

                const redirectUrl = response.headers.location;
                console.log(`  ↳ Redirected to: ${redirectUrl}`);

                // Follow redirect
                downloadFile(redirectUrl, filepath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        });

        request.on('error', (err) => {
            file.close();
            fs.unlinkSync(filepath);
            reject(err);
        });
    });
}

/**
 * Main download function
 */
async function downloadAllFeeSchedules() {
    console.log('\n=== DOWNLOADING PERMIT FEE SCHEDULES ===\n');
    console.log(`Download directory: ${DOWNLOADS_DIR}\n`);

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    for (const schedule of FEE_SCHEDULE_PDFS) {
        const filepath = path.join(DOWNLOADS_DIR, schedule.filename);

        // Check if already downloaded
        if (fs.existsSync(filepath)) {
            console.log(`⏭️  ${schedule.city} (${schedule.type})`);
            console.log(`   Already exists: ${schedule.filename}`);
            if (schedule.note) console.log(`   Note: ${schedule.note}`);
            console.log('');
            results.skipped.push(schedule);
            continue;
        }

        console.log(`📥 ${schedule.city} (${schedule.type})`);
        console.log(`   URL: ${schedule.url}`);
        if (schedule.note) console.log(`   Note: ${schedule.note}`);

        try {
            await downloadFile(schedule.url, filepath);
            const stats = fs.statSync(filepath);
            console.log(`   ✅ Downloaded: ${schedule.filename} (${(stats.size / 1024).toFixed(2)} KB)`);
            results.success.push(schedule);
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            results.failed.push({ ...schedule, error: error.message });
        }

        console.log('');

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n=== DOWNLOAD SUMMARY ===\n');
    console.log(`✅ Successfully downloaded: ${results.success.length}`);
    console.log(`⏭️  Already existed: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\nFailed downloads:');
        results.failed.forEach(item => {
            console.log(`  - ${item.city} (${item.type}): ${item.error}`);
        });
    }

    console.log('\n=== NEXT STEPS ===\n');
    console.log('1. Review downloaded PDFs in: ' + DOWNLOADS_DIR);
    console.log('2. Extract fee information manually or use PDF parsing tools');
    console.log('3. Update permit-fee-database.js with verified data');
    console.log('4. Update lastVerified dates to current date');
    console.log('5. Re-run validate-city-data.js to confirm updates\n');

    // Create a tracking file
    const trackingFile = path.join(DOWNLOADS_DIR, 'README.md');
    const trackingContent = `# Permit Fee Schedule PDFs

Downloaded: ${new Date().toISOString().split('T')[0]}

## Files Downloaded

${FEE_SCHEDULE_PDFS.map(s => `### ${s.city} - ${s.type}
- **File:** ${s.filename}
- **Source:** ${s.url}
${s.note ? `- **Note:** ${s.note}` : ''}
`).join('\n')}

## How to Extract Fee Data

1. Open each PDF
2. Look for:
   - **Electrical permits:** Base fees, valuation rates, min/max fees
   - **Plumbing permits:** Base fees, valuation rates, min/max fees
   - **HVAC/Mechanical permits:** Base fees, valuation rates, min/max fees
3. Note the effective date of the fee schedule
4. Record any special notes or calculation methods
5. Update ../permit-fee-database.js with the verified data

## Fee Data Template

For each city, record:

\`\`\`javascript
'City Name, ST': {
    electrical: {
        baseFee: XXX,
        valuationRate: 0.XXX, // % of project value
        minFee: XXX,
        maxFee: XXX,
        notes: 'Any special calculation rules'
    },
    plumbing: {
        baseFee: XXX,
        valuationRate: 0.XXX,
        minFee: XXX,
        maxFee: XXX,
        notes: ''
    },
    hvac: {
        baseFee: XXX,
        valuationRate: 0.XXX,
        minFee: XXX,
        maxFee: XXX,
        notes: ''
    }
}
\`\`\`

## Update dataQuality

After extracting data, update:

\`\`\`javascript
'City Name, ST': {
    quality: 'verified',
    source: 'Official Source Name',
    lastVerified: '${new Date().toISOString().split('T')[0]}',
    url: 'source_url',
    confidence: 'high',
    notes: 'Data verified from official fee schedule'
}
\`\`\`
`;

    fs.writeFileSync(trackingFile, trackingContent);
    console.log(`📝 Created tracking file: ${trackingFile}\n`);
}

// Run the download
if (require.main === module) {
    downloadAllFeeSchedules().catch(err => {
        console.error('\n❌ Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { downloadAllFeeSchedules, FEE_SCHEDULE_PDFS };
