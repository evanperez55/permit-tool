/**
 * Comprehensive Test Suite: Client Templates
 * Tests all client template generation functions with various scenarios
 */

const {
    generateClientQuote,
    generatePermitValueEmail,
    generatePermitExplainer,
    generateComparisonSheet,
    generatePaymentOptions,
    generateAllClientTemplates
} = require('../client-templates');

// Mock pricing data that matches the structure from calculateFullPricing
const mockPricingData = {
    pricing: {
        permitFee: {
            permitFee: 190
        },
        labor: {
            laborCost: 510,
            breakdown: {
                documentPrep: { hours: 1.5, cost: 128 },
                planDrawing: { hours: 2.0, cost: 170 },
                submission: { hours: 0.5, cost: 43 },
                inspection: { hours: 1.0, cost: 85 },
                corrections: { hours: 1.0, cost: 85 }
            }
        },
        clientCharge: {
            permitFeeMarkup: 29
        },
        summary: {
            recommendedCharge: 850,
            timeInvestment: '6.0 hours',
            processingTime: '2-4 weeks',
            totalCost: 700,
            yourProfit: 150,
            profitMargin: 18
        },
        competitive: {
            unlicensedContractorPrice: 95,
            expediterServicePrice: 975
        }
    },
    metadata: {
        jobType: 'Electrical',
        projectType: 'Residential',
        scope: 'Install new 200A panel',
        location: 'Los Angeles, CA'
    }
};

describe('Client Templates', () => {
    describe('generateClientQuote()', () => {
        test('should generate quote with default contractor info', () => {
            const result = generateClientQuote(mockPricingData);

            expect(result).toHaveProperty('subject');
            expect(result).toHaveProperty('body');
            expect(result).toHaveProperty('plainText');
            expect(result.plainText).toBe(true);
        });

        test('should include correct subject line', () => {
            const result = generateClientQuote(mockPricingData);

            expect(result.subject).toBe('Permit Quote: Electrical - Los Angeles, CA');
        });

        test('should include custom contractor information', () => {
            const contractorInfo = {
                contractorName: 'Acme Electric',
                contractorLicense: 'CA-EL-12345',
                contractorPhone: '(555) 987-6543',
                contractorEmail: 'joe@acmeelectric.com',
                clientName: 'John Smith'
            };

            const result = generateClientQuote(mockPricingData, contractorInfo);

            expect(result.body).toContain('Acme Electric');
            expect(result.body).toContain('CA-EL-12345');
            expect(result.body).toContain('(555) 987-6543');
            expect(result.body).toContain('joe@acmeelectric.com');
            expect(result.body).toContain('Dear John Smith');
        });

        test('should include pricing breakdown', () => {
            const result = generateClientQuote(mockPricingData);

            expect(result.body).toContain('$190'); // Permit fee
            expect(result.body).toContain('$850'); // Total charge
            expect(result.body).toContain('6.0 hours'); // Time investment
            expect(result.body).toContain('2-4 weeks'); // Processing time
        });

        test('should include labor breakdown details', () => {
            const result = generateClientQuote(mockPricingData);

            expect(result.body).toContain('Document Preparation');
            expect(result.body).toContain('Plan Drawing');
            expect(result.body).toContain('Permit Submission');
            expect(result.body).toContain('Inspection Attendance');
        });

        test('should include value propositions', () => {
            const result = generateClientQuote(mockPricingData);

            expect(result.body).toContain('WHY PROPER PERMITS MATTER');
            expect(result.body).toContain('SAFETY');
            expect(result.body).toContain('LEGAL PROTECTION');
            expect(result.body).toContain('INSURANCE');
            expect(result.body).toContain('RESALE VALUE');
        });

        test('should warn about unlicensed work risks', () => {
            const result = generateClientQuote(mockPricingData);

            expect(result.body).toContain('RISK OF UNLICENSED WORK');
            expect(result.body).toContain('NO INSPECTIONS');
            expect(result.body).toContain('FINES');
            expect(result.body).toContain('$5,000 - $15,000'); // Average fix cost
        });
    });

    describe('generatePermitValueEmail()', () => {
        test('should generate value email with default info', () => {
            const result = generatePermitValueEmail(mockPricingData);

            expect(result).toHaveProperty('subject');
            expect(result).toHaveProperty('body');
            expect(result.plainText).toBe(true);
        });

        test('should include correct subject line with job type', () => {
            const result = generatePermitValueEmail(mockPricingData);

            expect(result.subject).toBe('About Your Electrical Permit - Important Information');
        });

        test('should include custom client name', () => {
            const contractorInfo = {
                clientName: 'Sarah Johnson',
                contractorName: 'Pro Contractors Inc'
            };

            const result = generatePermitValueEmail(mockPricingData, contractorInfo);

            expect(result.body).toContain('Hi Sarah Johnson');
            expect(result.body).toContain('Pro Contractors Inc');
        });

        test('should highlight real costs of skipping permits', () => {
            const result = generatePermitValueEmail(mockPricingData);

            expect(result.body).toContain('REAL COST OF SKIPPING PERMITS');
            expect(result.body).toContain('RESALE IMPACT');
            expect(result.body).toContain('INSURANCE PROBLEMS');
            expect(result.body).toContain('CITY FINES');
            expect(result.body).toContain('SAFETY RISKS');
        });

        test('should include specific cost ranges', () => {
            const result = generatePermitValueEmail(mockPricingData);

            expect(result.body).toContain('$40,000-80,000'); // Resale loss
            expect(result.body).toContain('$10,000-50,000'); // Insurance claim
            expect(result.body).toContain('$5,000-15,000'); // Fix cost
            expect(result.body).toContain('$500-5,000'); // City fines
        });

        test('should include current pricing in comparison', () => {
            const result = generatePermitValueEmail(mockPricingData);

            expect(result.body).toContain('$850'); // Recommended charge
            expect(result.body).toContain('Cost: $850');
        });

        test('should offer payment discussion', () => {
            const result = generatePermitValueEmail(mockPricingData);

            expect(result.body).toContain('payment options');
            expect(result.body).toContain('timeline that works better');
        });
    });

    describe('generatePermitExplainer()', () => {
        test('should generate explainer with required fields', () => {
            const result = generatePermitExplainer(mockPricingData);

            expect(result).toHaveProperty('subject');
            expect(result).toHaveProperty('body');
            expect(result.plainText).toBe(true);
        });

        test('should include job type in subject', () => {
            const result = generatePermitExplainer(mockPricingData);

            expect(result.subject).toBe('Quick Guide: Why Electrical Requires a Permit');
        });

        test('should explain why permits are required', () => {
            const result = generatePermitExplainer(mockPricingData);

            expect(result.body).toContain('WHY YOUR ELECTRICAL PROJECT NEEDS A PERMIT');
            expect(result.body).toContain("IT'S THE LAW");
            expect(result.body).toContain('SAFETY FIRST');
            expect(result.body).toContain('PROFESSIONAL INSPECTION');
        });

        test('should include location reference', () => {
            const result = generatePermitExplainer(mockPricingData);

            expect(result.body).toContain('Los Angeles, CA');
        });

        test('should warn about consequences of no permit', () => {
            const result = generatePermitExplainer(mockPricingData);

            expect(result.body).toContain('WHAT HAPPENS WITHOUT A PERMIT');
            expect(result.body).toContain('Insurance may deny claims');
            expect(result.body).toContain('City can fine you');
            expect(result.body).toContain('reduces sale price');
        });

        test('should include financial protection info', () => {
            const result = generatePermitExplainer(mockPricingData);

            expect(result.body).toContain('FINANCIAL PROTECTION');
            expect(result.body).toContain('reduce home value by 10-20%');
            expect(result.body).toContain('increase home value by 5-10%');
        });
    });

    describe('generateComparisonSheet()', () => {
        test('should generate comparison with required fields', () => {
            const result = generateComparisonSheet(mockPricingData);

            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('content');
            expect(result.plainText).toBe(true);
        });

        test('should include correct title', () => {
            const result = generateComparisonSheet(mockPricingData);

            expect(result.title).toBe('Licensed vs Unlicensed: What You Really Get');
        });

        test('should include pricing comparison', () => {
            const result = generateComparisonSheet(mockPricingData);

            expect(result.content).toContain('$850'); // Licensed price
            expect(result.content).toContain('$95'); // Unlicensed price
            expect(result.content).toContain('UPFRONT COST');
        });

        test('should include custom contractor name', () => {
            const contractorInfo = {
                contractorName: 'Elite Electrical Services'
            };

            const result = generateComparisonSheet(mockPricingData, contractorInfo);

            expect(result.content).toContain('Elite Electrical Services');
        });

        test('should compare features side-by-side', () => {
            const result = generateComparisonSheet(mockPricingData);

            expect(result.content).toContain('PERMITS PULLED');
            expect(result.content).toContain('INSPECTIONS');
            expect(result.content).toContain('CODE COMPLIANT');
            expect(result.content).toContain('LIABILITY INSURANCE');
            expect(result.content).toContain('WARRANTY');
        });

        test('should show real-world total cost comparison', () => {
            const result = generateComparisonSheet(mockPricingData);

            expect(result.content).toContain('TOTAL COST COMPARISON');
            expect(result.content).toContain('LICENSED CONTRACTOR');
            expect(result.content).toContain('UNLICENSED WORK');
        });

        test('should calculate unlicensed potential loss correctly', () => {
            const result = generateComparisonSheet(mockPricingData);

            // Should show the range of potential losses
            expect(result.content).toContain('$53,500-145,000 LOSS');
        });

        test('should calculate savings difference', () => {
            const result = generateComparisonSheet(mockPricingData);

            // $850 - $95 = $755
            expect(result.content).toContain('$755');
        });
    });

    describe('generatePaymentOptions()', () => {
        test('should generate payment options with required fields', () => {
            const result = generatePaymentOptions(mockPricingData);

            expect(result).toHaveProperty('subject');
            expect(result).toHaveProperty('body');
            expect(result.plainText).toBe(true);
        });

        test('should include correct subject line', () => {
            const result = generatePaymentOptions(mockPricingData);

            expect(result.subject).toBe('Payment Options for Your Permit Service');
        });

        test('should include custom client name', () => {
            const contractorInfo = {
                clientName: 'Mike Davis',
                contractorName: 'Davis Electric'
            };

            const result = generatePaymentOptions(mockPricingData, contractorInfo);

            expect(result.body).toContain('Hi Mike Davis');
            expect(result.body).toContain('Davis Electric');
        });

        test('should include 4 payment options', () => {
            const result = generatePaymentOptions(mockPricingData);

            expect(result.body).toContain('OPTION 1: PAY IN FULL');
            expect(result.body).toContain('OPTION 2: SPLIT PAYMENT');
            expect(result.body).toContain('OPTION 3: 3-MONTH PLAN');
            expect(result.body).toContain('OPTION 4: 6-MONTH PLAN');
        });

        test('should calculate deposit correctly (30%)', () => {
            const result = generatePaymentOptions(mockPricingData);

            // 30% of $850 = $255
            expect(result.body).toContain('$255');
        });

        test('should calculate remaining balance correctly', () => {
            const result = generatePaymentOptions(mockPricingData);

            // $850 - $255 = $595
            expect(result.body).toContain('$595');
        });

        test('should calculate 3-month payment correctly', () => {
            const result = generatePaymentOptions(mockPricingData);

            // $850 / 3 = $283 (rounded)
            expect(result.body).toContain('$283');
        });

        test('should calculate 6-month payment correctly', () => {
            const result = generatePaymentOptions(mockPricingData);

            // $850 / 6 = $142 (rounded)
            expect(result.body).toContain('$142');
        });

        test('should show total charge in all options', () => {
            const result = generatePaymentOptions(mockPricingData);

            // Total should appear multiple times
            const totalMatches = (result.body.match(/\$850/g) || []).length;
            expect(totalMatches).toBeGreaterThanOrEqual(3); // At least in 3 options
        });
    });

    describe('generateAllClientTemplates()', () => {
        test('should generate all 5 templates', () => {
            const result = generateAllClientTemplates(mockPricingData);

            expect(result).toHaveProperty('professionalQuote');
            expect(result).toHaveProperty('permitValue');
            expect(result).toHaveProperty('permitExplainer');
            expect(result).toHaveProperty('comparisonSheet');
            expect(result).toHaveProperty('paymentOptions');
        });

        test('should pass contractor info to all templates', () => {
            const contractorInfo = {
                contractorName: 'Test Electric Co',
                contractorLicense: 'CA-TEST-999',
                clientName: 'Test Client'
            };

            const result = generateAllClientTemplates(mockPricingData, contractorInfo);

            expect(result.professionalQuote.body).toContain('Test Electric Co');
            expect(result.permitValue.body).toContain('Test Client');
            expect(result.comparisonSheet.content).toContain('Test Electric Co');
            expect(result.paymentOptions.body).toContain('Test Client');
        });

        test('all templates should have subject or title', () => {
            const result = generateAllClientTemplates(mockPricingData);

            expect(result.professionalQuote.subject).toBeDefined();
            expect(result.permitValue.subject).toBeDefined();
            expect(result.permitExplainer.subject).toBeDefined();
            expect(result.comparisonSheet.title).toBeDefined();
            expect(result.paymentOptions.subject).toBeDefined();
        });

        test('all templates should have body or content', () => {
            const result = generateAllClientTemplates(mockPricingData);

            expect(result.professionalQuote.body).toBeDefined();
            expect(result.permitValue.body).toBeDefined();
            expect(result.permitExplainer.body).toBeDefined();
            expect(result.comparisonSheet.content).toBeDefined();
            expect(result.paymentOptions.body).toBeDefined();
        });

        test('all templates should be marked as plain text', () => {
            const result = generateAllClientTemplates(mockPricingData);

            expect(result.professionalQuote.plainText).toBe(true);
            expect(result.permitValue.plainText).toBe(true);
            expect(result.permitExplainer.plainText).toBe(true);
            expect(result.comparisonSheet.plainText).toBe(true);
            expect(result.paymentOptions.plainText).toBe(true);
        });
    });

    describe('Edge Cases and Different Pricing', () => {
        test('should handle high-value permits', () => {
            const highValueData = {
                ...mockPricingData,
                pricing: {
                    ...mockPricingData.pricing,
                    permitFee: {
                        permitFee: 2500
                    },
                    summary: {
                        ...mockPricingData.pricing.summary,
                        recommendedCharge: 4500
                    },
                    competitive: {
                        unlicensedContractorPrice: 1250,
                        expediterServicePrice: 6750
                    }
                }
            };

            const result = generateClientQuote(highValueData);
            expect(result.body).toContain('$2500');
            expect(result.body).toContain('$4500');
        });

        test('should handle different job types', () => {
            const plumbingData = {
                ...mockPricingData,
                metadata: {
                    ...mockPricingData.metadata,
                    jobType: 'Plumbing',
                    location: 'San Francisco, CA'
                }
            };

            const result = generatePermitExplainer(plumbingData);
            expect(result.subject).toContain('Plumbing');
            expect(result.body).toContain('PLUMBING');
            expect(result.body).toContain('San Francisco, CA');
        });

        test('should handle minimum charge permits', () => {
            const minChargeData = {
                ...mockPricingData,
                pricing: {
                    ...mockPricingData.pricing,
                    permitFee: {
                        permitFee: 100
                    },
                    summary: {
                        ...mockPricingData.pricing.summary,
                        recommendedCharge: 250
                    },
                    competitive: {
                        unlicensedContractorPrice: 50,
                        expediterServicePrice: 500
                    }
                }
            };

            const paymentOptions = generatePaymentOptions(minChargeData);

            // 30% of $250 = $75
            expect(paymentOptions.body).toContain('$75');
            // Remaining: $175
            expect(paymentOptions.body).toContain('$175');
        });

        test('should handle different locations', () => {
            const nyData = {
                ...mockPricingData,
                metadata: {
                    ...mockPricingData.metadata,
                    location: 'New York, NY'
                }
            };

            const quote = generateClientQuote(nyData);
            expect(quote.subject).toContain('New York, NY');
            expect(quote.body).toContain('New York, NY');
        });

        test('should handle long processing times', () => {
            const slowProcessingData = {
                ...mockPricingData,
                pricing: {
                    ...mockPricingData.pricing,
                    summary: {
                        ...mockPricingData.pricing.summary,
                        processingTime: '6-8 weeks',
                        timeInvestment: '8.5 hours'
                    }
                }
            };

            const quote = generateClientQuote(slowProcessingData);
            expect(quote.body).toContain('6-8 weeks');
            expect(quote.body).toContain('8.5 hours');
        });
    });
});
