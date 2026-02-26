# Project: Permits App

AI-powered permit requirement checker for contractors. Scrapes city fee schedules with OCR, provides pricing calculators, serves a PWA frontend.

## Commands
- Backend: `cd backend && npm install && npm run dev` (nodemon, port 5001)
- Backend tests: `cd backend && npm test` (Jest)
- E2E tests: `cd e2e && npm install && npx playwright test`
- Docker: `docker-compose up` (port 5001)
- Deploy: `fly deploy` (Fly.io)

## Architecture
- backend/server.js -- Express entry point
- backend/scrapers/ -- Per-city scraper implementations + OCR pipeline
- backend/scrapers/cities/ -- Individual city scrapers
- backend/pricing-calculator.js -- Fee calculation logic
- backend/permit-fee-database.js -- Fee data storage
- backend/swagger.js -- API documentation
- frontend/ -- Static HTML PWA (no build step)
- e2e/ -- Playwright E2E tests (separate package.json)

## Tech Stack
- Backend: Node.js + Express 4, Playwright (scraping), Tesseract.js 6 (OCR), pdfjs-dist, Swagger
- Frontend: Vanilla HTML + Tailwind (CDN) + Marked.js + DOMPurify (PWA)
- Deploy: Fly.io (shared-cpu-1x, 256mb)

## Standards
- Frontend has no build step -- vendored JS libs in frontend/vendor/
- Backend serves frontend as static files
- Health check at `/health` (used by Fly.io)
- Use GSD (`/gsd:new-project`) for multi-phase features

## Gotchas
- Port is 5001 (not 5000)
- OCR requires `eng.traineddata` file in backend/
- Scraper uses Playwright headless browser -- run `npx playwright install` first
- Frontend is a PWA with service worker (sw.js) and manifest.json
