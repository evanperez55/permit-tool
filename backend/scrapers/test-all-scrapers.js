/**
 * Test All City Scrapers
 * Runs all 10 city scrapers and reports results
 */

const cities = [
    { name: 'Austin', file: './cities/austin.js' },
    { name: 'Houston', file: './cities/houston.js' },
    { name: 'Miami', file: './cities/miami.js' },
    { name: 'Chicago', file: './cities/chicago.js' },
    { name: 'Phoenix', file: './cities/phoenix.js' },
    { name: 'New York', file: './cities/new-york.js' },
    { name: 'San Francisco', file: './cities/san-francisco.js' },
    { name: 'San Diego', file: './cities/san-diego.js' },
    { name: 'Milwaukee', file: './cities/milwaukee.js' },
    { name: 'Los Angeles', file: './cities/los-angeles.js' }
];

async function testAllScrapers() {
    console.log('🧪 Testing All City Scrapers\n');
    console.log('=' .repeat(80));

    const results = [];

    for (const city of cities) {
        console.log(`\n📍 Testing ${city.name}...`);
        console.log('-'.repeat(80));

        const startTime = Date.now();

        try {
            const ScraperClass = require(city.file);
            const scraper = new ScraperClass();

            const data = await scraper.scrape();
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            // Summarize results
            const electricalFee = data.electrical?.baseFee || data.electrical?.valuationRate || 'N/A';
            const source = data.source || 'Unknown';

            results.push({
                city: city.name,
                status: '✅ SUCCESS',
                elapsed: `${elapsed}s`,
                electricalFee: electricalFee,
                source: source,
                pdfHash: data.pdfHash?.substring(0, 8) || 'N/A'
            });

            console.log(`✅ ${city.name} complete in ${elapsed}s`);
            console.log(`   Electrical fee: ${typeof electricalFee === 'number' ? '$' + electricalFee : electricalFee}`);
            console.log(`   Source: ${source}`);

        } catch (error) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            results.push({
                city: city.name,
                status: '❌ FAILED',
                elapsed: `${elapsed}s`,
                error: error.message.substring(0, 60)
            });

            console.log(`❌ ${city.name} failed: ${error.message}`);
        }
    }

    // Print summary table
    console.log('\n');
    console.log('='.repeat(80));
    console.log('📊 SUMMARY - All City Scrapers');
    console.log('='.repeat(80));
    console.log('\n');

    const successCount = results.filter(r => r.status.includes('SUCCESS')).length;
    const failureCount = results.length - successCount;

    results.forEach(result => {
        console.log(`${result.status.padEnd(12)} ${result.city.padEnd(15)} (${result.elapsed.padEnd(6)})`);
        if (result.electricalFee) {
            const fee = typeof result.electricalFee === 'number' ? `$${result.electricalFee}` : result.electricalFee;
            console.log(`              Fee: ${fee}`);
        }
        if (result.error) {
            console.log(`              Error: ${result.error}`);
        }
    });

    console.log('\n');
    console.log(`✅ Successful: ${successCount}/${results.length}`);
    console.log(`❌ Failed: ${failureCount}/${results.length}`);
    console.log(`📈 Success rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
}

if (require.main === module) {
    testAllScrapers()
        .then(() => {
            console.log('\n✅ All tests complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { testAllScrapers };
