/**
 * Download the 3 missing permit fee schedule PDFs
 * Based on deep research findings
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOWNLOADS_DIR = path.join(__dirname, 'fee-schedule-pdfs');

// The 3 missing fee schedules with updated URLs
const MISSING_FEE_SCHEDULES = [
    {
        city: 'San Francisco, CA',
        type: 'Electrical (2025)',
        url: 'https://media.api.sf.gov/documents/Table_1A-E_-_Electrical_Permit_Issuance_and_Inspection_2025.pdf',
        filename: 'san-francisco-electrical-fees-2025.pdf',
        note: 'Found via deep research - new SF.gov API URL'
    },
    {
        city: 'Miami, FL (City)',
        type: 'Building Permit Fee Schedule',
        url: 'http://egov.ci.miami.fl.us/Legistarweb/Attachments/87201.pdf',
        filename: 'miami-city-building-fees.pdf',
        note: 'City of Miami official fee schedule from Legistar'
    },
    {
        city: 'Miami, FL (County)',
        type: 'Electrical Fee Sheet',
        url: 'https://www.miamidade.gov/permits/library/fees/electrical-fee-sheet.pdf',
        filename: 'miami-dade-electrical-fees.pdf',
        note: 'Miami-Dade County electrical fees (for reference/comparison)'
    },
    {
        city: 'New York, NY',
        type: 'Permit Fee Structure',
        url: 'https://www.nyc.gov/assets/buildings/pdf/new_permit_fee_structure.pdf',
        filename: 'nyc-permit-fee-structure.pdf',
        note: 'NYC DOB permit fee structure (Local Law 56 of 2016)'
    },
    {
        city: 'New York, NY',
        type: 'DOB Regulations 1 RCNY §101-03',
        url: 'https://www.nyc.gov/assets/buildings/rules/1_RCNY_101-03.pdf',
        filename: 'nyc-dob-regulations-fees.pdf',
        note: 'Official NYC DOB regulations including electrical fees'
    }
];

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(filepath);

        const request = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filepath);

                const redirectUrl = response.headers.location;
                console.log(`  ↳ Redirected to: ${redirectUrl}`);

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
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            reject(err);
        });
    });
}

async function downloadMissingFeeSchedules() {
    console.log('\n=== DOWNLOADING MISSING PERMIT FEE SCHEDULES ===\n');
    console.log('Based on deep research findings\n');

    const results = {
        success: [],
        failed: []
    };

    for (const schedule of MISSING_FEE_SCHEDULES) {
        const filepath = path.join(DOWNLOADS_DIR, schedule.filename);

        console.log(`📥 ${schedule.city} (${schedule.type})`);
        console.log(`   URL: ${schedule.url}`);
        console.log(`   Note: ${schedule.note}`);

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
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== DOWNLOAD SUMMARY ===\n');
    console.log(`✅ Successfully downloaded: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\nFailed downloads:');
        results.failed.forEach(item => {
            console.log(`  - ${item.city} (${item.type}): ${item.error}`);
        });
    }

    console.log('\n=== ALL FEE SCHEDULES STATUS ===\n');
    console.log('Total cities with verified data needed: 10');
    console.log('✅ PDFs downloaded: ' + (8 + results.success.length) + '/11+');
    console.log('\nNext: Extract fee data from all PDFs and update permit-fee-database.js\n');
}

if (require.main === module) {
    downloadMissingFeeSchedules().catch(err => {
        console.error('\n❌ Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { downloadMissingFeeSchedules };
