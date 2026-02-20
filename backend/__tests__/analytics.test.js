jest.mock('fs');

let fs, analytics;

beforeEach(() => {
    jest.resetModules();
    fs = require('fs');
    // Default: no saved file
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('{}');
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});

    analytics = require('../analytics');
    analytics.reset();
});

describe('Analytics Tracker', () => {
    test('tracks queries and increments total count', () => {
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Plumbing' });

        const summary = analytics.getSummary();
        expect(summary.totalQueries).toBe(2);
    });

    test('counts cities correctly', () => {
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Plumbing' });
        analytics.track({ city: 'Chicago', state: 'IL', jobType: 'Electrical' });

        const summary = analytics.getSummary();
        expect(summary.topCities).toEqual([
            { name: 'Denver, CO', count: 2 },
            { name: 'Chicago, IL', count: 1 }
        ]);
    });

    test('counts job types correctly', () => {
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        analytics.track({ city: 'Chicago', state: 'IL', jobType: 'Electrical' });
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Plumbing' });

        const summary = analytics.getSummary();
        expect(summary.topJobTypes).toEqual([
            { name: 'Electrical', count: 2 },
            { name: 'Plumbing', count: 1 }
        ]);
    });

    test('sorts top-N by count descending', () => {
        for (let i = 0; i < 5; i++) analytics.track({ city: 'A', state: 'CA', jobType: 'Electrical' });
        for (let i = 0; i < 3; i++) analytics.track({ city: 'B', state: 'CA', jobType: 'Electrical' });
        for (let i = 0; i < 8; i++) analytics.track({ city: 'C', state: 'CA', jobType: 'Electrical' });

        const summary = analytics.getSummary();
        expect(summary.topCities[0].name).toBe('C, CA');
        expect(summary.topCities[1].name).toBe('A, CA');
        expect(summary.topCities[2].name).toBe('B, CA');
    });

    test('limits recent queries history', () => {
        for (let i = 0; i < 1050; i++) {
            analytics.track({ city: `City${i}`, state: 'XX', jobType: 'Test' });
        }

        const summary = analytics.getSummary();
        expect(summary.totalQueries).toBe(1050);
        expect(summary.recentQueries.length).toBe(50);
        expect(summary.recentQueries[0].location).toBe('City1049, XX');
    });

    test('tracks hourly buckets', () => {
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });

        const summary = analytics.getSummary();
        const hours = Object.keys(summary.hourlyVolume);
        expect(hours.length).toBe(1);
        expect(Object.values(summary.hourlyVolume)[0]).toBe(1);
    });

    test('reset clears all data', () => {
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        analytics.reset();

        const summary = analytics.getSummary();
        expect(summary.totalQueries).toBe(0);
        expect(summary.topCities).toEqual([]);
        expect(summary.topJobTypes).toEqual([]);
        expect(summary.recentQueries).toEqual([]);
    });
});

describe('Analytics Persistence', () => {
    test('save writes data to file', () => {
        analytics.track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        fs.existsSync.mockReturnValue(true);
        analytics.save();

        expect(fs.writeFileSync).toHaveBeenCalled();
        const written = fs.writeFileSync.mock.calls.find(c => c[0].includes('analytics-data.json'));
        expect(written).toBeTruthy();
        const data = JSON.parse(written[1]);
        expect(data.totalQueries).toBe(1);
    });

    test('load restores data from file', () => {
        jest.resetModules();
        const freshFs = require('fs');

        const savedData = {
            startedAt: '2025-01-01T00:00:00.000Z',
            totalQueries: 42,
            cityCounts: { 'Denver, CO': 10 },
            jobTypeCounts: { 'Electrical': 10 },
            hourlyBuckets: {},
            recentQueries: [{ location: 'Denver, CO', jobType: 'Electrical', timestamp: '2025-01-01T00:00:00.000Z' }]
        };

        freshFs.existsSync.mockReturnValue(true);
        freshFs.readFileSync.mockReturnValue(JSON.stringify(savedData));
        freshFs.writeFileSync.mockImplementation(() => {});
        freshFs.unlinkSync.mockImplementation(() => {});
        freshFs.mkdirSync.mockImplementation(() => {});

        const freshAnalytics = require('../analytics');
        const summary = freshAnalytics.getSummary();
        expect(summary.totalQueries).toBe(42);
        expect(summary.topCities[0]).toEqual({ name: 'Denver, CO', count: 10 });
    });

    test('gracefully handles missing file on load', () => {
        // Default setup has existsSync returning false
        const summary = analytics.getSummary();
        expect(summary.totalQueries).toBe(0);
    });

    test('gracefully handles corrupt file on load', () => {
        jest.resetModules();
        const freshFs = require('fs');

        freshFs.existsSync.mockReturnValue(true);
        freshFs.readFileSync.mockReturnValue('not valid json{{{');
        freshFs.writeFileSync.mockImplementation(() => {});
        freshFs.unlinkSync.mockImplementation(() => {});
        freshFs.mkdirSync.mockImplementation(() => {});

        const freshAnalytics = require('../analytics');
        const summary = freshAnalytics.getSummary();
        expect(summary.totalQueries).toBe(0);
    });

    test('reset clears the saved file', () => {
        fs.existsSync.mockReturnValue(true);
        analytics.reset();
        expect(fs.unlinkSync).toHaveBeenCalled();
        const call = fs.unlinkSync.mock.calls.find(c => c[0].includes('analytics-data.json'));
        expect(call).toBeTruthy();
    });
});
