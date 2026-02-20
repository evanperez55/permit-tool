/**
 * Diagnostic: Compare static database vs merged (scraper-overlaid) database
 * Shows exactly where scraper data is changing our curated values
 */
const staticDB = require('./permit-fee-database');
const { clearCache } = require('./database-loader');
clearCache();
const { permitFees: mergedFees } = require('./database-loader');

const trades = ['electrical', 'plumbing', 'hvac'];
const cities = [
    'Los Angeles, CA', 'San Diego, CA', 'San Francisco, CA',
    'Austin, TX', 'Houston, TX', 'Miami, FL',
    'Chicago, IL', 'Milwaukee, WI', 'Phoenix, AZ', 'New York, NY'
];

console.log('STATIC DB vs MERGED (after scraper overlay) comparison:');
console.log('='.repeat(95));
console.log('Only showing fields WHERE THE SCRAPER CHANGED THE VALUE');
console.log('='.repeat(95));

let issueCount = 0;
for (const city of cities) {
    for (const trade of trades) {
        const s = staticDB.permitFees[city][trade];
        const m = mergedFees[city] && mergedFees[city][trade];
        if (!m) {
            console.log(city + ' / ' + trade + ': MISSING from merged DB');
            issueCount++;
            continue;
        }
        const diffs = [];
        if (s.baseFee !== m.baseFee) diffs.push('baseFee: ' + s.baseFee + ' -> ' + m.baseFee);
        if (s.valuationRate !== m.valuationRate) diffs.push('valRate: ' + s.valuationRate + ' -> ' + m.valuationRate);
        if (s.minFee !== m.minFee) diffs.push('minFee: ' + s.minFee + ' -> ' + m.minFee);
        if (s.maxFee !== m.maxFee) diffs.push('maxFee: ' + s.maxFee + ' -> ' + m.maxFee);
        if (diffs.length > 0) {
            console.log(city.padEnd(22) + trade.padEnd(12) + diffs.join(' | '));
            issueCount++;
        }
    }
}
console.log('='.repeat(95));
console.log('Total trade/field combos changed by scraper: ' + issueCount);
if (issueCount === 0) {
    console.log('Scraper is not changing any values from the static database.');
} else {
    console.log('Review above changes - any that look wrong should be investigated.');
}
