const { test, expect } = require('@playwright/test');

// Helper to select a verified city via the autocomplete dropdown
async function selectCity(page, query) {
    const cityInput = page.locator('#cityInput');
    await cityInput.click();
    await cityInput.fill('');
    // Type character-by-character to trigger input events for autocomplete
    await cityInput.pressSequentially(query, { delay: 50 });
    // Wait for dropdown options to appear
    await expect(page.locator('#cityDropdown .autocomplete-option').first()).toBeVisible({ timeout: 5000 });
}

// Helper to fill and submit the form with a verified city
async function submitForm(page) {
    await page.locator('#jobType').selectOption('Electrical Work');

    await selectCity(page, 'Austin');
    // Click the first matching option
    await page.locator('#cityDropdown .autocomplete-option').first().click();

    // Verify hidden fields were populated
    await expect(page.locator('#city')).toHaveValue('Austin');
    await expect(page.locator('#state')).toHaveValue('TX');

    // Submit
    await page.locator('#permitForm button[type="submit"]').click();

    // Wait for results
    await expect(page.locator('#results')).not.toHaveClass(/hidden/, { timeout: 15000 });
}

test.describe('Permit Assistant E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
    });

    test('page loads with form visible', async ({ page }) => {
        await expect(page.locator('#permitForm')).toBeVisible();
        await expect(page.locator('#jobType')).toBeVisible();
        await expect(page.locator('#cityInput')).toBeVisible();
        await expect(page.locator('h1')).toContainText('Permit Assistant');
    });

    test('city autocomplete keyboard navigation', async ({ page }) => {
        await selectCity(page, 'Austin');

        // Arrow down to first option and Enter to select
        await page.locator('#cityInput').press('ArrowDown');
        await page.locator('#cityInput').press('Enter');

        // City input should now contain Austin
        const cityValue = await page.locator('#cityInput').inputValue();
        expect(cityValue).toContain('Austin');

        // Hidden city/state fields should be populated
        await expect(page.locator('#city')).toHaveValue('Austin');
        await expect(page.locator('#state')).toHaveValue('TX');
    });

    test('full form submission displays results', async ({ page }) => {
        await submitForm(page);

        await expect(page.locator('#recommendedCharge')).toBeVisible();

        // Recommended charge should show a dollar amount
        const chargeText = await page.locator('#recommendedCharge').textContent();
        expect(chargeText).toMatch(/\$[\d,]+/);
    });

    test('template modal opens and closes', async ({ page }) => {
        await submitForm(page);

        // Click first template button
        const templateBtn = page.locator('#clientTemplates button').first();
        await expect(templateBtn).toBeVisible();
        await templateBtn.click();

        // Modal should appear
        await expect(page.locator('#templateModal')).toBeVisible();

        // Press Escape to close
        await page.keyboard.press('Escape');
        await expect(page.locator('#templateModal')).toBeHidden();
    });

    test('focus trap in template modal', async ({ page }) => {
        await submitForm(page);

        // Open template modal
        const templateBtn = page.locator('#clientTemplates button').first();
        await templateBtn.click();
        await expect(page.locator('#templateModal')).toBeVisible();

        // Tab several times and verify focus stays in modal
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
        }

        const insideModal = await page.evaluate(() => {
            const el = document.activeElement;
            const modal = document.getElementById('templateModal');
            return modal && modal.contains(el);
        });
        expect(insideModal).toBe(true);

        await page.keyboard.press('Escape');
    });

    test('dark mode toggle works', async ({ page }) => {
        const initialHasDark = await page.evaluate(() =>
            document.documentElement.classList.contains('dark')
        );

        await page.locator('#themeToggle').click();

        const afterToggle = await page.evaluate(() =>
            document.documentElement.classList.contains('dark')
        );
        expect(afterToggle).toBe(!initialHasDark);

        await page.locator('#themeToggle').click();
        const afterSecondToggle = await page.evaluate(() =>
            document.documentElement.classList.contains('dark')
        );
        expect(afterSecondToggle).toBe(initialHasDark);
    });

    test('paperwork section displays for verified city', async ({ page }) => {
        await submitForm(page);

        // Paperwork badge should show forms count or "Coming soon"
        const badge = page.locator('#paperworkBadge');
        await expect(badge).toBeVisible();
        const badgeText = await badge.textContent();
        expect(badgeText.length).toBeGreaterThan(0);
    });

    test('reset button returns to form', async ({ page }) => {
        await submitForm(page);

        // Form should be hidden
        await expect(page.locator('#formCard')).toBeHidden();

        // Click reset button
        await page.locator('button:has-text("Check Another Permit")').click();

        // Form should reappear, results should be hidden
        await expect(page.locator('#formCard')).toBeVisible();
        await expect(page.locator('#results')).toHaveClass(/hidden/);
    });

    test('error toast on failed submission', async ({ page }) => {
        // Intercept the API call and force it to fail
        await page.route('**/api/check-requirements', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Test error' })
            });
        });

        // Fill form using autocomplete
        await page.locator('#jobType').selectOption('Electrical Work');
        await selectCity(page, 'Austin');
        await page.locator('#cityDropdown .autocomplete-option').first().click();

        // Submit
        await page.locator('#permitForm button[type="submit"]').click();

        // Should show the error toast
        await expect(page.locator('#errorToast')).toHaveClass(/visible/, { timeout: 10000 });
    });
});
