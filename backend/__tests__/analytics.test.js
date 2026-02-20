const { track, getSummary, reset } = require('../analytics');

describe('Analytics Tracker', () => {
    beforeEach(() => {
        reset();
    });

    test('tracks queries and increments total count', () => {
        track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        track({ city: 'Denver', state: 'CO', jobType: 'Plumbing' });

        const summary = getSummary();
        expect(summary.totalQueries).toBe(2);
    });

    test('counts cities correctly', () => {
        track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        track({ city: 'Denver', state: 'CO', jobType: 'Plumbing' });
        track({ city: 'Chicago', state: 'IL', jobType: 'Electrical' });

        const summary = getSummary();
        expect(summary.topCities).toEqual([
            { name: 'Denver, CO', count: 2 },
            { name: 'Chicago, IL', count: 1 }
        ]);
    });

    test('counts job types correctly', () => {
        track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        track({ city: 'Chicago', state: 'IL', jobType: 'Electrical' });
        track({ city: 'Denver', state: 'CO', jobType: 'Plumbing' });

        const summary = getSummary();
        expect(summary.topJobTypes).toEqual([
            { name: 'Electrical', count: 2 },
            { name: 'Plumbing', count: 1 }
        ]);
    });

    test('sorts top-N by count descending', () => {
        for (let i = 0; i < 5; i++) track({ city: 'A', state: 'CA', jobType: 'Electrical' });
        for (let i = 0; i < 3; i++) track({ city: 'B', state: 'CA', jobType: 'Electrical' });
        for (let i = 0; i < 8; i++) track({ city: 'C', state: 'CA', jobType: 'Electrical' });

        const summary = getSummary();
        expect(summary.topCities[0].name).toBe('C, CA');
        expect(summary.topCities[1].name).toBe('A, CA');
        expect(summary.topCities[2].name).toBe('B, CA');
    });

    test('limits recent queries history', () => {
        for (let i = 0; i < 1050; i++) {
            track({ city: `City${i}`, state: 'XX', jobType: 'Test' });
        }

        const summary = getSummary();
        expect(summary.totalQueries).toBe(1050);
        // recentQueries in summary is capped at 50 for the response
        expect(summary.recentQueries.length).toBe(50);
        // Most recent should be last tracked
        expect(summary.recentQueries[0].location).toBe('City1049, XX');
    });

    test('tracks hourly buckets', () => {
        track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });

        const summary = getSummary();
        const hours = Object.keys(summary.hourlyVolume);
        expect(hours.length).toBe(1);
        expect(Object.values(summary.hourlyVolume)[0]).toBe(1);
    });

    test('reset clears all data', () => {
        track({ city: 'Denver', state: 'CO', jobType: 'Electrical' });
        reset();

        const summary = getSummary();
        expect(summary.totalQueries).toBe(0);
        expect(summary.topCities).toEqual([]);
        expect(summary.topJobTypes).toEqual([]);
        expect(summary.recentQueries).toEqual([]);
    });
});
