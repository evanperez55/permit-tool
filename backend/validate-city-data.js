/**
 * City Data Validation Script
 *
 * Validates that all verified city data has:
 * 1. Proper source attribution
 * 2. Working URLs
 * 3. Recent verification dates
 * 4. Complete data coverage
 */

const { permitFees, dataQuality } = require('./database-loader');
const https = require('https');
const http = require('http');

// List of all verified cities
const VERIFIED_CITIES = Object.entries(dataQuality)
    .filter(([city, quality]) => quality.quality === 'verified')
    .map(([city]) => city);

console.log('\n=== CITY DATA VALIDATION REPORT ===\n');
console.log(`Found ${VERIFIED_CITIES.length} verified cities:\n`);

// Display all verified cities with their metadata
VERIFIED_CITIES.forEach((city, index) => {
    const quality = dataQuality[city];
    console.log(`${index + 1}. ${city}`);
    console.log(`   Source: ${quality.source}`);
    console.log(`   URL: ${quality.url}`);
    console.log(`   Last Verified: ${quality.lastVerified}`);
    console.log(`   Confidence: ${quality.confidence}`);
    console.log(`   Notes: ${quality.notes}\n`);
});

console.log('\n=== VALIDATION CHECKS ===\n');

// Check 1: All verified cities have permit data
console.log('CHECK 1: Data Coverage');
console.log('------------------------');
let missingData = [];
VERIFIED_CITIES.forEach(city => {
    const hasFeeData = permitFees[city] !== undefined;
    if (!hasFeeData) {
        missingData.push(city);
        console.log(`❌ ${city} - Missing permit fee data`);
    } else {
        const cityData = permitFees[city];
        const categories = ['electrical', 'plumbing', 'hvac', 'mechanical', 'building'];
        const presentCategories = categories.filter(cat => cityData[cat]);
        console.log(`✅ ${city} - Has ${presentCategories.length}/${categories.length} categories`);
    }
});
console.log('');

// Check 2: Verification dates
console.log('CHECK 2: Verification Dates');
console.log('----------------------------');
const today = new Date();
const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
let outdatedCities = [];

VERIFIED_CITIES.forEach(city => {
    const quality = dataQuality[city];
    const verifiedDate = new Date(quality.lastVerified);
    const daysSince = Math.floor((today - verifiedDate) / (1000 * 60 * 60 * 24));

    if (verifiedDate < oneYearAgo) {
        outdatedCities.push({ city, daysSince });
        console.log(`⚠️  ${city} - Verified ${daysSince} days ago (${quality.lastVerified})`);
    } else {
        console.log(`✅ ${city} - Verified ${daysSince} days ago (${quality.lastVerified})`);
    }
});
console.log('');

// Check 3: Source URLs exist
console.log('CHECK 3: Source URLs');
console.log('--------------------');
let missingUrls = [];
VERIFIED_CITIES.forEach(city => {
    const quality = dataQuality[city];
    if (!quality.url || quality.url === null) {
        missingUrls.push(city);
        console.log(`❌ ${city} - No URL provided`);
    } else {
        console.log(`✅ ${city} - URL present: ${quality.url}`);
    }
});
console.log('');

// Check 4: URL accessibility (optional - can take time)
async function checkUrlAccessibility(city, url) {
    return new Promise((resolve) => {
        if (!url) {
            resolve({ city, url, status: 'No URL', accessible: false });
            return;
        }

        const client = url.startsWith('https') ? https : http;
        const request = client.get(url, { timeout: 5000 }, (res) => {
            resolve({
                city,
                url,
                status: res.statusCode,
                accessible: res.statusCode >= 200 && res.statusCode < 400
            });
            res.resume(); // Consume response
        });

        request.on('error', (err) => {
            resolve({
                city,
                url,
                status: err.message,
                accessible: false
            });
        });

        request.on('timeout', () => {
            request.destroy();
            resolve({
                city,
                url,
                status: 'Timeout',
                accessible: false
            });
        });
    });
}

async function validateUrls() {
    console.log('CHECK 4: URL Accessibility (Testing...)');
    console.log('----------------------------------------');

    const urlChecks = VERIFIED_CITIES.map(city => {
        const quality = dataQuality[city];
        return checkUrlAccessibility(city, quality.url);
    });

    const results = await Promise.all(urlChecks);

    let inaccessibleUrls = [];
    results.forEach(result => {
        if (result.accessible) {
            console.log(`✅ ${result.city} - Accessible (${result.status})`);
        } else {
            inaccessibleUrls.push(result);
            console.log(`❌ ${result.city} - Not accessible (${result.status})`);
        }
    });

    console.log('');

    // Summary
    console.log('\n=== VALIDATION SUMMARY ===\n');

    console.log(`Total Verified Cities: ${VERIFIED_CITIES.length}`);
    console.log(`Missing Permit Data: ${missingData.length} ${missingData.length > 0 ? `(${missingData.join(', ')})` : ''}`);
    console.log(`Outdated Verifications: ${outdatedCities.length} ${outdatedCities.length > 0 ? `(> 1 year old)` : ''}`);
    console.log(`Missing URLs: ${missingUrls.length} ${missingUrls.length > 0 ? `(${missingUrls.join(', ')})` : ''}`);
    console.log(`Inaccessible URLs: ${inaccessibleUrls.length}`);

    if (inaccessibleUrls.length > 0) {
        console.log('\nInaccessible URLs Details:');
        inaccessibleUrls.forEach(({ city, url, status }) => {
            console.log(`  - ${city}: ${url} (${status})`);
        });
    }

    console.log('');

    const allChecksPass = missingData.length === 0 &&
                          outdatedCities.length === 0 &&
                          missingUrls.length === 0 &&
                          inaccessibleUrls.length === 0;

    if (allChecksPass) {
        console.log('✅ ALL VALIDATIONS PASSED!');
    } else {
        console.log('⚠️  SOME VALIDATIONS FAILED - Review above');
    }

    console.log('\n');
}

// Run URL validation
validateUrls().catch(err => {
    console.error('Error during validation:', err);
    process.exit(1);
});
