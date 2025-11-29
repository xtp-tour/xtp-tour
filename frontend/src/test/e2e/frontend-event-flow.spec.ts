/**
 * Frontend Event Flow Test
 *
 * This test follows the complete event flow through the frontend UI:
 * 1. Sign in as User 1 (requires Clerk authentication)
 * 2. User 1 creates an event
 * 3. Switch to User 2 (sign out and sign back in)
 * 4. User 2 joins the event
 * 5. Switch back to User 1
 * 6. User 1 confirms the event
 * 7. Switch to User 2 and verify the confirmed event
 *
 * Requirements:
 * - Clerk authentication must be configured (VITE_CLERK_PUBLISHABLE_KEY environment variable)
 * - If Clerk is not configured, this test will be skipped
 * - Backend API must be running on localhost:8080 or set TEST_API_BASE_URL
 *
 * Usage:
 * TEST_BASE_URL=http://localhost:5173 pnpm run test:e2e
 */

import { test, expect } from '@playwright/test';

// Test configuration
interface TestConfig {
  baseUrl: string;
}

// Use existing development users (from cursor rules)
const testUsers = {
  user1: {
    email: 'user2@example.com',
    password: 'biAShy=8&Q,%g~T'
  },
  user2: {
    email: 'test3@example.com',
    password: 'aZKymXAlzB1Cp8'
  }
};


test.describe('Frontend Event Flow Test', () => {
  let config: TestConfig;

  test.beforeAll(async () => {
    config = {
      baseUrl: (globalThis as { process?: { env?: { TEST_BASE_URL?: string } } }).process?.env?.TEST_BASE_URL || 'http://localhost:5173',
    };
  });

  test('Complete event flow with existing users', async ({ page }) => {
    await page.goto(config.baseUrl);
    await page.waitForLoadState('networkidle');
    
    const eventDescription = `Test event ${Date.now()}`;
    
    // Check if Clerk is configured
    const signInButton = page.locator('button:has-text("Sign in")').first();
    const isDisabled = await signInButton.getAttribute('disabled').catch(() => null);
    const isClerkConfigured = isDisabled === null;

    // Step 1: Sign in as User 1
    await test.step('Sign in as User 1', async () => {
      if (isClerkConfigured) {
        console.log('Clerk is configured - signing in as User 1');
        await signInButton.click();

        // Wait for Clerk modal to appear
        await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 });
        console.log('Clerk modal appeared');

        // Fill email/identifier
        const identifierInput = page.locator('input[name="identifier"]');
        await identifierInput.waitFor({ state: 'visible', timeout: 5000 });
        await identifierInput.fill(testUsers.user1.email);

        // Click Continue button - look for visible button only
        const continueButton = page.locator('button[type="submit"]:visible, button:has-text("Continue"):visible').first();
        await continueButton.waitFor({ state: 'visible', timeout: 5000 });
        await continueButton.click();

        // Wait for password field to appear
        const passwordInput = page.locator('input[name="password"]');
        await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

        // Fill password
        await passwordInput.fill(testUsers.user1.password);

        // Click sign in button - look for visible submit button
        const submitButton = page.locator('button[type="submit"]:visible').first();
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.click();

        // Wait for main app to load
        await page.waitForSelector('.container', { timeout: 10000 });

        console.log('User 1 signed in successfully');
      } else {
        console.log('Clerk not configured - running in demo mode');
        // In demo mode, main app should be already visible
        await page.waitForSelector('.container', { timeout: 10000 });
        console.log('Demo mode - no authentication required');
      }
    });

    // Step 2: User 1 creates an event
    await test.step('User 1 creates an event', async () => {
      // Look for "Create Event" button
      const createEventButton = page.locator('button:has-text("Create Event")');
      await createEventButton.waitFor({ state: 'visible', timeout: 10000 });
      await createEventButton.click();

      // Wait for the form to expand
      await page.waitForSelector('form', { timeout: 5000 });

      // Select a location - look for checkboxes
      const locationCheckbox = page.locator('input[type="checkbox"]').first();
      if (await locationCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await locationCheckbox.check();
      }

      // Set session duration (if available)
      const durationSelect = page.locator('select#sessionDuration');
      if (await durationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await durationSelect.selectOption('2'); // 2 hours
      }

      // Set skill level (if available)
      const skillSelect = page.locator('select#skillLevel');
      if (await skillSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skillSelect.selectOption('INTERMEDIATE');
      }

      // Add description
      const descriptionField = page.locator('textarea');
      if (await descriptionField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionField.fill(eventDescription);
      }

      // Try to select availability - click on a calendar date if available
      const calendarDays = page.locator('.calendar-day:not(.past)');
      const dayCount = await calendarDays.count().catch(() => 0);
      if (dayCount > 0) {
        // Click the first available future date
        await calendarDays.first().click();
        
        // Select the first time slot checkbox that appears
        await page.waitForTimeout(500);
        const timeSlotCheckbox = page.locator('input[type="checkbox"]').first();
        if (await timeSlotCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          await timeSlotCheckbox.check();
        }
      }

      // Submit the form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for success message or redirect
      await page.waitForSelector('.toast, .alert', { timeout: 10000 }).catch(() => {});

      console.log('User 1 created an event');
    });

    // Step 3: Switch to User 2
    await test.step('Switch to User 2', async () => {
      if (isClerkConfigured) {
        console.log('Signing out User 1 and signing in as User 2');
        
        // Find and click the user menu button
        const userButton = page.locator('[data-clerk-user-button]');
        await userButton.click();

        // Click Sign out
        const signOutButton = page.locator('button:has-text("Sign out")');
        await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
        await signOutButton.click();

        // Wait for sign out to complete
        await page.waitForSelector('button:has-text("Sign in")', { timeout: 10000 });

        // Click Sign in
        const signInButton2 = page.locator('button:has-text("Sign in")').first();
        await signInButton2.click();

        // Wait for Clerk modal
        await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 });

        // Fill User 2 credentials
        const identifierInput = page.locator('input[name="identifier"]');
        await identifierInput.waitFor({ state: 'visible', timeout: 5000 });
        await identifierInput.fill(testUsers.user2.email);

        // Click Continue button - look for visible button only
        const continueButton = page.locator('button[type="submit"]:visible, button:has-text("Continue"):visible').first();
        await continueButton.waitFor({ state: 'visible', timeout: 5000 });
        await continueButton.click();

        // Wait for password field
        const passwordInput = page.locator('input[name="password"]');
        await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
        await passwordInput.fill(testUsers.user2.password);

        // Click sign in button
        const submitButton = page.locator('button[type="submit"]:visible').first();
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.click();

        // Wait for main app to load
        await page.waitForSelector('.container', { timeout: 10000 });

        console.log('User 2 signed in successfully');
      } else {
        console.log('Demo mode - no user switching, continuing as same user');
        // In demo mode with mock API, we can't switch users
        // The mock API will handle multi-user scenarios automatically
      }
    });

    // Step 4: User 2 finds and joins the event
    await test.step('User 2 joins the event', async () => {
      // Wait for events to load
      await page.waitForSelector('.card', { timeout: 10000 });

      // Find the event created by User 1
      const eventCard = page.locator(`.card:has-text("${eventDescription}")`).first();

      // If event is not immediately visible, it might be in public events
      if (!(await eventCard.isVisible())) {
        // Try to navigate to public events
        const publicEventsLink = page.locator('a:has-text("Public Events"), button:has-text("Public Events")');
        if (await publicEventsLink.isVisible()) {
          await publicEventsLink.click();
          await page.waitForSelector('.card', { timeout: 5000 });
        }
      }

      // Click on the event
      await eventCard.click();

      // Look for and click Join button
      const joinButton = page.locator('button:has-text("Join")');
      await joinButton.click();

      // Fill out join modal
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

      // Select location if available
      const locationCheckbox = page.locator('input[type="checkbox"]').first();
      if (await locationCheckbox.isVisible()) {
        await locationCheckbox.check();
      }

      // Select time slots if available
      const timeSlotCheckboxes = page.locator('input[type="checkbox"]').filter({ hasText: /time|slot/i });
      const count = await timeSlotCheckboxes.count();
      if (count > 0) {
        await timeSlotCheckboxes.first().check();
      } else {
        // Try any checkbox that's not already checked
        const allCheckboxes = page.locator('input[type="checkbox"]:not(:checked)');
        const checkboxCount = await allCheckboxes.count();
        if (checkboxCount > 0) {
          await allCheckboxes.first().check();
        }
      }

      // Submit join request
      const submitButton = page.locator('button:has-text("Join"):not(:disabled)');
      await submitButton.click();

      // Wait for success
      await page.waitForSelector('.toast, .alert', { timeout: 10000 });

      console.log('User 2 joined the event');
    });

    // Step 5: Switch back to User 1
    await test.step('Switch back to User 1', async () => {
      if (isClerkConfigured) {
        console.log('Signing out User 2 and signing back in as User 1');
        
        // Find and click the user menu button
        const userButton = page.locator('[data-clerk-user-button]');
        await userButton.click();

        // Click Sign out
        const signOutButton = page.locator('button:has-text("Sign out")');
        await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
        await signOutButton.click();

        // Wait for sign out to complete
        await page.waitForSelector('button:has-text("Sign in")', { timeout: 10000 });

        // Click Sign in
        const signInBtn = page.locator('button:has-text("Sign in")').first();
        await signInBtn.click();

        // Wait for Clerk modal
        await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 });

        // Fill User 1 credentials
        const identifierInput = page.locator('input[name="identifier"]');
        await identifierInput.waitFor({ state: 'visible', timeout: 5000 });
        await identifierInput.fill(testUsers.user1.email);

        // Click Continue button - look for visible button only
        const continueButton = page.locator('button[type="submit"]:visible, button:has-text("Continue"):visible').first();
        await continueButton.waitFor({ state: 'visible', timeout: 5000 });
        await continueButton.click();

        // Wait for password field
        const passwordInput = page.locator('input[name="password"]');
        await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
        await passwordInput.fill(testUsers.user1.password);

        // Click sign in button
        const submitButton = page.locator('button[type="submit"]:visible').first();
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.click();

        // Wait for main app to load
        await page.waitForSelector('.container', { timeout: 10000 });

        console.log('User 1 signed back in successfully');
      } else {
        console.log('Demo mode - no user switching, continuing as same user');
      }
    });

    // Step 6: User 1 confirms the event
    await test.step('User 1 confirms the event', async () => {
      // Find the event with join requests
      const eventCard = page.locator(`.card:has-text("${eventDescription}")`).first();
      await eventCard.click();

      // Look for confirm button
      const confirmButton = page.locator('button:has-text("Confirm")');
      await confirmButton.click();

      // Fill out confirmation modal
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });

      // Select location and time for confirmation
      const selects = page.locator('select');
      const selectCount = await selects.count();

      if (selectCount > 0) {
        await selects.first().selectOption({ index: 0 });
      }
      if (selectCount > 1) {
        await selects.nth(1).selectOption({ index: 0 });
      }

      // Submit confirmation
      const confirmSubmitButton = page.locator('button:has-text("Confirm Event")');
      await confirmSubmitButton.click();

      // Wait for success
      await page.waitForSelector('.toast, .alert', { timeout: 10000 });

      console.log('User 1 confirmed the event');
    });

    // Step 7: Verify confirmed event
    await test.step('Verify confirmed event', async () => {
      if (isClerkConfigured) {
        console.log('Switching back to User 2 to verify confirmation');
        
        // Find and click the user menu button
        const userButton = page.locator('[data-clerk-user-button]');
        await userButton.click();

        // Click Sign out
        const signOutButton = page.locator('button:has-text("Sign out")');
        await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
        await signOutButton.click();

        // Wait for sign out to complete
        await page.waitForSelector('button:has-text("Sign in")', { timeout: 10000 });

        // Click Sign in
        const signInBtn = page.locator('button:has-text("Sign in")').first();
        await signInBtn.click();

        // Wait for Clerk modal
        await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 });

        // Fill User 2 credentials
        const identifierInput = page.locator('input[name="identifier"]');
        await identifierInput.waitFor({ state: 'visible', timeout: 5000 });
        await identifierInput.fill(testUsers.user2.email);

        // Click Continue button - look for visible button only
        const continueButton = page.locator('button[type="submit"]:visible, button:has-text("Continue"):visible').first();
        await continueButton.waitFor({ state: 'visible', timeout: 5000 });
        await continueButton.click();

        // Wait for password field
        const passwordInput = page.locator('input[name="password"]');
        await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
        await passwordInput.fill(testUsers.user2.password);

        // Click sign in button
        const submitButton = page.locator('button[type="submit"]:visible').first();
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.click();

        // Wait for main app to load
        await page.waitForSelector('.container', { timeout: 10000 });
      } else {
        console.log('Demo mode - refreshing to see updated state');
        await page.reload();
        await page.waitForLoadState('networkidle');
      }

      // Find the confirmed event
      const confirmedEvent = page.locator(`.card:has-text("${eventDescription}")`).first();
      await expect(confirmedEvent).toBeVisible({ timeout: 10000 });

      // Click on the event to see details
      await confirmedEvent.click();

      // Verify event shows as confirmed
      const confirmedStatus = page.locator('text=/confirmed|accepted/i');
      await expect(confirmedStatus).toBeVisible({ timeout: 10000 });

      console.log('Successfully verified the confirmed event');
    });
  });

  test('Basic app loads correctly', async ({ page }) => {
    await page.goto(config.baseUrl);

    // Verify the app loads
    await expect(page.locator('h1, .h2').first()).toBeVisible();

    // Verify main elements are present
    const mainContent = page.locator('.container').first();
    await expect(mainContent).toBeVisible();

    console.log('App loaded successfully');
  });

  test('Frontend UI elements are accessible', async ({ page }) => {
    await page.goto(config.baseUrl);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify landing page elements
    await expect(page.locator('h1, .h2').first()).toBeVisible();

    // Check for sign in/up buttons
    const signInButton = page.locator('button:has-text("Sign in")').first();
    const signUpButton = page.locator('button:has-text("Sign up")').first();

    await expect(signInButton).toBeVisible({ timeout: 10000 });
    await expect(signUpButton).toBeVisible({ timeout: 10000 });

    // Check for main action buttons
    const createLinkButton = page.locator('button:has-text("Create Your Tennis Link")');
    const findPartnersButton = page.locator('button:has-text("Find Tennis Partners")');

    if (await createLinkButton.isVisible()) {
      console.log('Found "Create Your Tennis Link" button');
    }

    if (await findPartnersButton.isVisible()) {
      console.log('Found "Find Tennis Partners" button');
    }

    console.log('Frontend UI elements verified');
  });
});
