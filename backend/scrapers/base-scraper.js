/**
 * Base Scraper Framework with Stealth Configuration
 * Handles bot detection evasion and provides common scraping utilities
 */

const { chromium, firefox } = require('playwright');
const crypto = require('crypto');

class BaseScraper {
    constructor(config = {}) {
        this.config = {
            headless: true,
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            delayMin: 1000, // Min delay between requests (ms)
            delayMax: 3000, // Max delay between requests (ms)
            retries: 3,
            browserType: 'chromium', // 'chromium' or 'firefox'
            ...config
        };
        this.browser = null;
        this.context = null;
    }

    /**
     * Initialize browser with stealth configuration
     */
    async init() {
        const browserName = this.config.browserType === 'firefox' ? 'Firefox' : 'Chromium';
        console.log(`🚀 Initializing stealth browser (${browserName})...`);

        const browserEngine = this.config.browserType === 'firefox' ? firefox : chromium;

        this.browser = await browserEngine.launch({
            headless: this.config.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

        // Create context with stealth settings
        this.context = await this.browser.newContext({
            userAgent: this.config.userAgent,
            viewport: this.config.viewport,
            locale: 'en-US',
            timezoneId: 'America/Los_Angeles',
            permissions: [],
            acceptDownloads: this.config.browserType === 'firefox', // Firefox needs download handling
            // Bypass bot detection
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        // Override navigator.webdriver
        await this.context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            // Randomize chrome object
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };

            // Override permissions query
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        });

        console.log('✅ Stealth browser initialized');
    }

    /**
     * Create a new page with anti-detection measures
     */
    async newPage() {
        if (!this.context) {
            await this.init();
        }

        const page = await this.context.newPage();

        // Set realistic timeouts
        page.setDefaultTimeout(this.config.timeout);

        return page;
    }

    /**
     * Navigate to URL with human-like behavior
     */
    async goto(page, url, options = {}) {
        console.log(`📍 Navigating to: ${url}`);

        // Random delay before navigation (simulate human behavior)
        await this.randomDelay(500, 1500);

        try {
            const response = await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: this.config.timeout,
                ...options
            });

            // Check if blocked
            if (response.status() === 403) {
                console.warn('⚠️ 403 Forbidden - possible bot detection');
            }

            return response;
        } catch (error) {
            console.error(`❌ Navigation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Random delay to simulate human behavior
     */
    async randomDelay(min = null, max = null) {
        const delayMin = min !== null ? min : this.config.delayMin;
        const delayMax = max !== null ? max : this.config.delayMax;
        const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;

        console.log(`⏱️ Waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Scroll page like a human
     */
    async humanScroll(page) {
        await page.evaluate(() => {
            const scrollHeight = document.body.scrollHeight;
            const viewportHeight = window.innerHeight;
            const scrollSteps = 3;
            const stepDelay = 300;

            return new Promise((resolve) => {
                let currentScroll = 0;
                const interval = setInterval(() => {
                    if (currentScroll >= scrollSteps) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }

                    const scrollTo = (scrollHeight / scrollSteps) * (currentScroll + 1);
                    window.scrollTo({
                        top: scrollTo,
                        behavior: 'smooth'
                    });

                    currentScroll++;
                }, stepDelay);
            });
        });
    }

    /**
     * Download file (PDF, etc.) using context's fetch API
     * Firefox uses download event handling for better WAF bypass
     */
    async downloadFile(page, url) {
        console.log(`📥 Downloading: ${url}`);

        // Firefox: Use download event (bypasses some WAFs)
        if (this.config.browserType === 'firefox') {
            try {
                const fs = require('fs').promises;

                // Set up download event listener
                const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

                // Navigate to PDF URL (triggers download)
                const navPromise = page.goto(url, { timeout: 30000 }).catch(() => null);

                // Wait for download or navigation to complete
                const download = await Promise.race([
                    downloadPromise,
                    navPromise.then(() => null)
                ]);

                if (download) {
                    // Download triggered - read the file
                    const downloadPath = await download.path();
                    const buffer = await fs.readFile(downloadPath);

                    console.log(`✅ Downloaded ${buffer.length} bytes (Firefox download)`);
                    return buffer;
                } else {
                    // No download triggered - try to get response body
                    const response = await navPromise;
                    if (response) {
                        const buffer = await response.body();
                        console.log(`✅ Downloaded ${buffer.length} bytes (Firefox response)`);
                        return buffer;
                    }
                    throw new Error('No download or response received');
                }
            } catch (error) {
                console.error(`❌ Firefox download failed: ${error.message}`);
                throw error;
            }
        }

        // Chromium: Use standard request API
        try {
            // Use the page's context to make an authenticated request
            const response = await page.request.get(url);

            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }

            const buffer = await response.body();

            console.log(`✅ Downloaded ${buffer.length} bytes`);
            return buffer;
        } catch (error) {
            console.error(`❌ Download failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Extract text from page
     */
    async extractText(page, selector = 'body') {
        try {
            const text = await page.locator(selector).innerText();
            return text.trim();
        } catch (error) {
            console.error(`❌ Text extraction failed: ${error.message}`);
            return '';
        }
    }

    /**
     * Take screenshot for debugging
     */
    async screenshot(page, filename) {
        const timestamp = Date.now();
        const filepath = `./screenshots/${filename}-${timestamp}.png`;

        await page.screenshot({
            path: filepath,
            fullPage: true
        });

        console.log(`📸 Screenshot saved: ${filepath}`);
        return filepath;
    }

    /**
     * Hash content to detect changes
     */
    hashContent(content) {
        return crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
    }

    /**
     * Retry wrapper for flaky operations
     */
    async retry(fn, retries = null) {
        const maxRetries = retries !== null ? retries : this.config.retries;
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Attempt ${i + 1}/${maxRetries} failed: ${error.message}`);

                if (i < maxRetries - 1) {
                    // Exponential backoff
                    const backoff = Math.pow(2, i) * 1000;
                    await new Promise(resolve => setTimeout(resolve, backoff));
                }
            }
        }

        throw lastError;
    }

    /**
     * Clean up resources
     */
    async close() {
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
            console.log('🛑 Browser closed');
        }
    }

    /**
     * Extract links matching pattern
     */
    async extractLinks(page, pattern) {
        const links = await page.evaluate((pattern) => {
            const regex = new RegExp(pattern, 'i');
            const anchors = Array.from(document.querySelectorAll('a'));

            return anchors
                .filter(a => regex.test(a.href) || regex.test(a.textContent))
                .map(a => ({
                    href: a.href,
                    text: a.textContent.trim()
                }));
        }, pattern);

        return links;
    }

    /**
     * Check if robots.txt allows scraping
     */
    async checkRobotsTxt(baseUrl, path = '*') {
        try {
            const robotsUrl = new URL('/robots.txt', baseUrl).href;
            const page = await this.newPage();

            const response = await page.goto(robotsUrl, {
                waitUntil: 'networkidle',
                timeout: 10000
            });

            if (response.status() === 404) {
                console.log('ℹ️ No robots.txt found - proceeding');
                await page.close();
                return true;
            }

            const robotsTxt = await page.content();
            await page.close();

            // Simple robots.txt parsing (not comprehensive)
            const disallowPattern = /Disallow:\s*(.+)/gi;
            const matches = [...robotsTxt.matchAll(disallowPattern)];

            const disallowedPaths = matches.map(m => m[1].trim());
            const isAllowed = !disallowedPaths.some(p => {
                if (p === '/') return true; // Disallow all
                return path.startsWith(p);
            });

            if (isAllowed) {
                console.log('✅ robots.txt allows scraping');
            } else {
                console.warn('⚠️ robots.txt disallows this path');
            }

            return isAllowed;
        } catch (error) {
            console.warn(`⚠️ Could not check robots.txt: ${error.message}`);
            return true; // Default to allowing if can't check
        }
    }
}

module.exports = BaseScraper;
