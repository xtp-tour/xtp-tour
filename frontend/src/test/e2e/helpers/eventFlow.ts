import { expect, type Page } from '@playwright/test';

export function getBaseUrl(): string {
  return process.env.TEST_BASE_URL || 'http://localhost:5173';
}

export async function gotoHome(page: Page, baseUrl = getBaseUrl()): Promise<void> {
  await page.goto(baseUrl);
  await page.waitForLoadState('networkidle');
}

export async function completeProfileIfNeeded(page: Page): Promise<void> {
  await page.waitForTimeout(1000);

  const createProfileHeading = page.locator('h2:has-text("Create Your Profile")');
  const needsProfile = await createProfileHeading.isVisible({ timeout: 3000 }).catch(() => false);
  if (!needsProfile) return;

  const firstNameField = page.locator('input[name="firstName"], input[placeholder*="first" i]').first();
  if (await firstNameField.isVisible().catch(() => false)) {
    await firstNameField.fill('Test');
  }

  const lastNameField = page.locator('input[name="lastName"], input[placeholder*="last" i]').first();
  if (await lastNameField.isVisible().catch(() => false)) {
    await lastNameField.fill('User');
  }

  const ntrpSelect = page.locator('select').first();
  if (await ntrpSelect.isVisible().catch(() => false)) {
    const options = await ntrpSelect.locator('option').allTextContents();
    const intermediateOption = options.find(opt => opt.toLowerCase().includes('intermediate'));
    if (intermediateOption) {
      await ntrpSelect.selectOption({ label: intermediateOption });
    } else {
      await ntrpSelect.selectOption({ index: 2 });
    }
  }

  const cityField = page.locator('input[placeholder*="city" i], input[name="city"]').first();
  if (await cityField.isVisible().catch(() => false)) {
    await cityField.fill('New York');
  }

  const createProfileButton = page.locator('button:has-text("Create Profile"), button:has-text("Update Profile")').first();
  await createProfileButton.click();

  await page.waitForSelector('button:has-text("Create Event")', { timeout: 15000 });
}

export async function createEvent(page: Page, eventDescription: string): Promise<void> {
  const createEventButton = page.locator('button:has-text("Create Event")');
  await createEventButton.waitFor({ state: 'visible', timeout: 10000 });
  await createEventButton.click();

  await page.waitForSelector('form', { timeout: 5000 });
  await page.waitForTimeout(1500);

  const locationDropdownButton = page.locator('.use-bootstrap-select button, button[data-bs-toggle="dropdown"]').first();
  if (await locationDropdownButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await locationDropdownButton.click();
    await page.waitForTimeout(300);
    const locationOption = page.locator('.dropdown-menu .dropdown-item, .use-bootstrap-select .dropdown-item').first();
    if (await locationOption.isVisible().catch(() => false)) {
      await locationOption.click();
    }
  } else {
    const locationSelect = page.locator('select[multiple]').first();
    if (await locationSelect.isVisible().catch(() => false)) {
      const firstOption = await locationSelect.locator('option').first().getAttribute('value');
      if (firstOption) {
        await locationSelect.selectOption([firstOption]);
      }
    }
  }

  await page.locator('textarea#description').fill(eventDescription);

  const timeSlotButtons = page.locator('button').filter({ hasText: /^\d{1,2}:\d{2}\s*(AM|PM)$/i });
  const timeSlotCount = await timeSlotButtons.count();
  if (timeSlotCount > 0) {
    await timeSlotButtons.nth(0).click();
    if (timeSlotCount > 1) {
      await timeSlotButtons.nth(1).click();
    }
  }

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1500);

  const myEventsTab = page.locator('button:has-text("My Events")');
  await myEventsTab.click();
  await page.waitForTimeout(800);

  const count = await page.locator('.card').count();
  expect(count).toBeGreaterThan(0);
}

