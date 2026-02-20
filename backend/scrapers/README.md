# Permit Fee Scraper System

**Automated permit fee scraping with stealth mode and change detection**

---

## 🎯 Overview

This system automatically scrapes permit fee schedules from government websites, detects changes, and generates alerts. Built with Playwright + stealth mode to bypass bot detection.

### Features

✅ **Stealth Mode** - Bypasses bot detection on government sites
✅ **Change Detection** - Compares fees against previous scrapes
✅ **PDF Parsing** - Extracts fees from PDF documents
✅ **Multi-City Support** - Modular architecture for easy expansion
✅ **Error Handling** - Retries, timeouts, and graceful failures
✅ **Alerting** - Notifies when fees change
✅ **History Tracking** - Stores scrape history for comparison

### Cities Supported (3)

1. **San Diego, CA** - Information Bulletin 103 (MEP Permits)
2. **Austin, TX** - Residential Fee Schedule (FY 2025-26)
3. **Houston, TX** - 2025 Building Code Enforcement Fee Schedule

---

## 📦 Installation

### 1. Dependencies Already Installed

```bash
# These were installed during setup:
# - playwright
# - pdf-parse
# - node-fetch
```

### 2. Install Playwright Browsers (if not done)

```bash
npx playwright install chromium
```

---

## 🚀 Usage

### Run All Scrapers

```bash
cd backend/scrapers
node scraper-orchestrator.js
```

**Output:**
- Scrapes all 3 cities
- Detects changes from previous runs
- Saves results to `backend/scraper-results/`
- Generates alert if changes found

### Run Single City

```bash
node scraper-orchestrator.js "San Diego, CA"
node scraper-orchestrator.js "Austin, TX"
node scraper-orchestrator.js "Houston, TX"
```

### Run Individual Scraper (for testing)

```bash
node cities/san-diego.js
node cities/austin.js
node cities/houston.js
```

---

## 📁 File Structure

```
backend/scrapers/
├── base-scraper.js              # Base class with stealth config
├── pdf-parser.js                # PDF parsing utilities
├── scraper-orchestrator.js      # Main runner with change detection
├── cities/
│   ├── san-diego.js             # San Diego scraper
│   ├── austin.js                # Austin scraper
│   └── houston.js               # Houston scraper
├── README.md                    # This file
└── (generated files)
    ├── fee-schedule-pdfs/       # Downloaded PDFs
    ├── scraper-results/         # Scrape results (JSON)
    ├── screenshots/             # Debug screenshots
    └── scrape-history.json      # Latest fees for change detection
```

---

## 🔍 How It Works

### 1. Stealth Browser

The `BaseScraper` class configures Playwright to evade bot detection:

```javascript
- Removes navigator.webdriver flag
- Mimics real browser user-agent
- Random delays between requests (1-3 seconds)
- Human-like scrolling behavior
- Realistic viewport/timezone settings
```

### 2. Scraping Process

For each city:

1. **Navigate** to fee schedule page
2. **Find** PDF link or extract HTML content
3. **Download** PDF (if applicable)
4. **Parse** PDF to extract fees
5. **Hash** content for change detection
6. **Save** results and PDF for reference

### 3. Change Detection

Compares new fees against `scrape-history.json`:

- Base fees
- Valuation rates
- Min/max fees
- PDF content hash

If changes detected → Generate alert

### 4. Results

Saves two types of files:

**Timestamped Results:**
```
scraper-results/scrape-2025-11-16T14-30-00.json
```

**Latest History (for comparison):**
```
scraper-results/scrape-history.json
```

---

## 📊 Example Output

```json
{
  "timestamp": "2025-11-16T14:30:00.000Z",
  "cities": {
    "San Diego, CA": {
      "status": "success",
      "data": {
        "jurisdiction": "San Diego, CA",
        "electrical": {
          "baseFee": 125,
          "valuationRate": 0.007
        },
        "effectiveDate": "May 2025"
      }
    }
  },
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "changes": []
  }
}
```

---

## ⚙️ Configuration

### Adding a New City

1. **Create scraper file:**
   ```bash
   cp cities/san-diego.js cities/your-city.js
   ```

2. **Update scraper class:**
   ```javascript
   class YourCityScraper extends BaseScraper {
       constructor() {
           super({
               city: 'YourCity',
               state: 'XX',
               jurisdiction: 'YourCity, XX'
           });
       }
   }
   ```

3. **Implement scraping logic:**
   - Set URLs for fee schedules
   - Customize PDF parsing
   - Extract city-specific fees

4. **Register in orchestrator:**
   ```javascript
   // scraper-orchestrator.js
   const YourCityScraper = require('./cities/your-city');

   this.scrapers = {
       'YourCity, XX': YourCityScraper,
       // ... other cities
   };
   ```

### Customizing Delays

Edit `base-scraper.js`:

```javascript
this.config = {
    delayMin: 2000,  // Min 2 seconds
    delayMax: 5000,  // Max 5 seconds
    timeout: 60000,  // 60 second timeout
    retries: 3       // Retry 3 times
};
```

---

## 🛡️ Legal & Ethical Considerations

### ✅ Legal (Why This Is OK)

1. **Public Records** - Permit fees are public information
2. **No Authentication** - Not bypassing logins/paywalls
3. **Factual Data** - Collecting facts (not copyrighted content)
4. **Low Impact** - Rate-limited, respectful scraping
5. **hiQ v. LinkedIn** - Scraping public data is legal (precedent)

### 🤝 Best Practices

1. **Rate Limiting** - 1-3 second delays between requests
2. **Identify Yourself** - User-agent includes contact info
3. **Check robots.txt** - Respects (but not legally required)
4. **Cache Aggressively** - Only scrape weekly, not daily
5. **Human Review** - You approve changes before updating DB

### ⚠️ Disclaimer

```
Permit fee data is automatically collected from official government
sources and verified by our team. While we strive for accuracy, fees
may change without notice. Always verify current fees with your local
building department before submitting applications.
```

---

## 🔧 Maintenance

### Weekly Scraping (Recommended)

Set up a cron job or scheduled task:

**Linux/Mac (crontab):**
```bash
# Run every Sunday at 2 AM
0 2 * * 0 cd /path/to/backend/scrapers && node scraper-orchestrator.js
```

**Windows (Task Scheduler):**
```
Action: Run program
Program: node
Arguments: C:\path\to\backend\scrapers\scraper-orchestrator.js
Trigger: Weekly on Sunday at 2:00 AM
```

### Monitoring

Check results:

```bash
# View latest scrape
cat backend/scraper-results/scrape-history.json

# View all scrapes
ls -lt backend/scraper-results/
```

### When Scrapers Break

Government websites change → Scrapers break. Here's how to fix:

1. **Check error logs** in orchestrator output
2. **Take screenshot** for debugging:
   ```javascript
   await scraper.screenshot(page, 'city-name-debug');
   ```
3. **Update selectors** in city scraper file
4. **Test** individual scraper:
   ```bash
   node cities/san-diego.js
   ```

---

## 📈 Performance

**Typical Scrape Times:**
- Single city: 10-30 seconds
- All 3 cities: 45-90 seconds (with delays)

**Resource Usage:**
- Memory: ~200-400 MB (Chromium browser)
- Disk: ~50 KB per PDF
- Bandwidth: ~1-5 MB per scrape

---

## 🐛 Troubleshooting

### Error: "403 Forbidden"

**Cause:** Bot detection triggered

**Solutions:**
1. Increase delays between requests
2. Change user-agent
3. Try headless: false (visible browser)
4. Manual verification as fallback

### Error: "Cannot find PDF link"

**Cause:** Website structure changed

**Solutions:**
1. Update selector in city scraper
2. Check if URL changed
3. Screenshot page for debugging
4. Manual fallback

### Error: "PDF parsing failed"

**Cause:** PDF is image-based (no text)

**Solutions:**
1. Implement OCR (tesseract.js)
2. Manual extraction
3. Contact city for text-based PDF

---

## 🚀 Future Enhancements

### Phase 2 (Next 3 Months)
- [ ] Add remaining 7 cities (LA, SF, NYC, Miami, Chicago, Milwaukee, Phoenix)
- [ ] Email alerts when changes detected
- [ ] Slack/Discord webhook integration
- [ ] Automated database updates (with approval)

### Phase 3 (Next 6 Months)
- [ ] Web dashboard for scraper management
- [ ] OCR support for image-based PDFs
- [ ] AI-powered fee extraction (GPT-4 Vision)
- [ ] Automated testing of scrapers

### Phase 4 (Next 12 Months)
- [ ] Scale to 50+ cities
- [ ] Professional scraping service integration (ScrapingBee)
- [ ] API for real-time fee lookups
- [ ] Confidence scores for accuracy

---

## 💡 Tips

1. **Run weekly** - Fees don't change daily, weekly is sufficient
2. **Review changes** - Always human-verify before updating database
3. **Keep PDFs** - Saved PDFs prove data provenance
4. **Monitor alerts** - Set up email notifications for changes
5. **Test individually** - Test each scraper before running orchestrator

---

## 📞 Support

**Issues?**
- Check logs in `backend/scraper-results/`
- Review screenshots in `backend/screenshots/`
- Test individual scrapers
- Manual verification as fallback

**Questions?**
- Read through city scraper code
- Check base-scraper.js for configuration options
- Review PDF-parser.js for parsing utilities

---

## 📝 Changelog

**v1.0.0 (2025-11-16)**
- ✅ Initial release
- ✅ 3 cities supported (San Diego, Austin, Houston)
- ✅ Stealth mode with Playwright
- ✅ PDF parsing
- ✅ Change detection
- ✅ Automated alerting

---

**Built with ❤️ for contractors who need accurate permit fees**
