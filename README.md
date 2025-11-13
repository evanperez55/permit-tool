# Permit Research Scraper

## Setup Instructions

### 1. Get Reddit API Credentials (5 minutes)

1. Go to: https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill out:
   - **Name**: PermitResearch
   - **App type**: Select "script"
   - **Description**: Research permit pain points
   - **About URL**: (leave blank)
   - **Redirect URI**: http://localhost:8080
4. Click "Create app"

5. You'll see:
   - **client_id**: The string under "personal use script" (looks like: `xxxxxxxxxxx`)
   - **client_secret**: The "secret" field (looks like: `xxxxxxxxxxxxxxxxxx`)

### 2. Add Credentials to .env

Edit the `.env` file in this folder and replace:
```
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
```

With your actual credentials.

### 3. Install Dependencies

```bash
pip install praw python-dotenv
```

### 4. Run the Scraper

```bash
python permit-research-scraper.py
```

---

## What It Does

**Scrapes these subreddits:**
- r/electricians
- r/HVAC
- r/HomeImprovement
- r/Construction
- r/Plumbing
- r/Contractor

**Searches for:**
- "permit"
- "permitting"
- "AHJ"
- "inspection"
- "building department"
- "permit rejected"

**Analyzes for:**
- 😤 Pain point signals (frustration, delays, confusion)
- 💰 Willingness to pay (mentions of hiring help, pricing)
- 🏢 Competitor mentions (ServiceTitan, PermitFlow, etc.)

**Outputs:**
- Terminal summary report
- `permit-research-results.json` with full data

---

## Runtime

- ~2-3 minutes for 300-500 posts

---

## Next Steps

After running, review:
1. `permit-research-results.json` for raw data
2. Terminal output for summary statistics
3. Look for strong pain signals + willingness to pay

If you see strong signals → Build MVP
If weak signals → Pick different vertical
