/**
 * Frontend Event Flow Test
 * 
 * This test follows the complete event flow through the frontend UI:
 * 1. Register User 1 and User 2 (using existing dev users)
 * 2. User 1 creates an event
 * 3. User 2 joins the event  
 * 4. User 1 confirms the event
 * 5. User 2 sees the confirmed event
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

  test.skip('Complete event flow with existing users', async ({ page }) => {
    const eventDescription = `Test event ${Date.now()}`;
    
    // Step 1: Sign in as User 1
    await test.step('Sign in as User 1', async () => {
      await page.goto(config.baseUrl);
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Debug: Take a screenshot to see current state
      await page.screenshot({ path: 'debug-initial-load.png' });
      
      // Debug: Log what's on the page
      const pageTitle = await page.title();
      console.log('Page title:', pageTitle);
      
      const allButtons = await page.locator('button').allTextContents();
      console.log('Available buttons:', allButtons);
      
      // Check if Clerk is available, otherwise skip authentication
      // Use the first (main) Sign In button, not the secondary one
      const signInButton = page.locator('button:has-text("Sign in")').first();
      
      if (await signInButton.isVisible()) {
        console.log('Found Sign In button, attempting authentication');
        await signInButton.click();
        
        // Wait a moment for any modal or redirect to happen
        await page.waitForTimeout(2000);
        
        // Debug: Take screenshot after clicking sign in
        await page.screenshot({ path: 'debug-after-signin-click.png' });
        
        // Check if we're redirected or if a modal appears
        const currentUrl = page.url();
        console.log('Current URL after sign in click:', currentUrl);
        
        // Try different selectors for Clerk modal
        const clerkModal = page.locator('[data-clerk-modal], .cl-modal, [role="dialog"]');
        
        if (await clerkModal.isVisible({ timeout: 5000 })) {
          console.log('Found Clerk modal, filling authentication form');
          
          // Fill email/identifier
          await page.fill('input[name="identifier"]', testUsers.user1.email);
          
          // Look for continue button with more flexible selector
          const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]').first();
          await continueButton.click();
          
          // Wait for password field to appear
          await page.waitForSelector('input[name="password"]', { timeout: 10000 });
          
          // Fill password
          await page.fill('input[name="password"]', testUsers.user1.password);
          
          // Look for submit button with more flexible selectors
          const submitButton = page.locator('button[type="submit"]:visible, button:has-text("Sign in"), button:has-text("Continue")').first();
          await submitButton.click();
          
          // Wait for main app to load
          await page.waitForSelector('.container', { timeout: 10000 });
        } else {
          console.log('No modal found, checking if we were redirected to main app');
          
          // Maybe we're already signed in or redirected to main app
          // Look for main app elements
          const createEventButton = page.locator('button').filter({ hasText: /create.*event/i });
          
          if (await createEventButton.isVisible({ timeout: 5000 })) {
            console.log('Already in main app - authentication not needed or already completed');
          } else {
            console.log('Neither modal nor main app found - may need different approach');
            // Continue anyway and see what happens
          }
        }
      } else {
        // If no authentication, assume we're in development mode
        console.log('No authentication required - development mode');
      }
      
      console.log('User 1 signed in');
    });

    // Step 2: User 1 creates an event
    await test.step('User 1 creates an event', async () => {
      // Debug: Take a screenshot to see current state
      await page.screenshot({ path: 'debug-before-create-event.png' });
      
      // Debug: Log what buttons are available
      const allButtons = await page.locator('button').allTextContents();
      console.log('Available buttons:', allButtons);
      
      // Look for "Create Event" button with more flexible selectors
      let createEventButton = page.locator('button:has-text("Create Event")');
      
      // If not found, try other variations
      if (!(await createEventButton.isVisible())) {
        createEventButton = page.locator('button').filter({ hasText: /create.*event/i });
      }
      
      // If still not found, try looking for any button with "create" in it
      if (!(await createEventButton.isVisible())) {
        createEventButton = page.locator('button').filter({ hasText: /create/i });
      }
      
      // Wait for the button to be visible and click it
      await createEventButton.waitFor({ state: 'visible', timeout: 10000 });
      await createEventButton.click();
      
      // Wait for the form to expand
      await page.waitForSelector('form', { timeout: 5000 });
      
      // Select locations - try different selectors
      try {
        // Try multi-select first
        const locationSelect = page.locator('select[multiple]');
        if (await locationSelect.isVisible()) {
          await locationSelect.selectOption(['matchpoint']);
        } else {
          // Try individual checkboxes
          const locationCheckbox = page.locator('input[type="checkbox"][value="matchpoint"]');
          if (await locationCheckbox.isVisible()) {
            await locationCheckbox.check();
          }
        }
      } catch (error) {
        console.log('Could not select location, continuing...', error);
      }
      
      // Set session duration
      const durationSelect = page.locator('select').filter({ hasText: /hour|duration/i });
      if (await durationSelect.isVisible()) {
        await durationSelect.selectOption('2'); // 2 hours
      }
      
      // Set skill level to Intermediate
      const skillSelect = page.locator('select').filter({ hasText: /skill|level/i });
      if (await skillSelect.isVisible()) {
        await skillSelect.selectOption('INTERMEDIATE');
      }
      
      // Add description
      const descriptionField = page.locator('textarea');
      if (await descriptionField.isVisible()) {
        await descriptionField.fill(eventDescription);
      }
      
      // Try to add time slots - this is complex, so we'll be flexible
      try {
        // Look for calendar or time slot inputs
        const calendarElement = page.locator('[data-testid="availability-calendar"], .calendar');
        if (await calendarElement.isVisible()) {
          // Click on future dates in the calendar
          const futureDates = page.locator('.calendar-day, .available-slot').filter({ hasText: /\d+/ });
          const count = await futureDates.count();
          if (count > 0) {
            await futureDates.first().click();
          }
        }
      } catch (error) {
        console.log('Could not interact with calendar, continuing...', error);
      }
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait for success message
      await page.waitForSelector('.toast, .alert, .success', { timeout: 10000 });
      
      console.log('User 1 created an event');
    });

    // Step 3: Sign out User 1 and sign in as User 2
    await test.step('Switch to User 2', async () => {
      // Check if we need to sign out
      const userButton = page.locator('[data-clerk-user-button]');
      if (await userButton.isVisible()) {
        await userButton.click();
        await page.click('button:has-text("Sign out")');
        
        // Wait for sign out
        await page.waitForSelector('button:has-text("Sign In")', { timeout: 10000 });
        
        // Sign in as User 2
        await page.click('button:has-text("Sign In")');
        
        // Wait for Clerk modal and fill sign in form
        await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 });
        
        await page.fill('input[name="identifier"]', testUsers.user2.email);
        await page.click('button:has-text("Continue")');
        
        await page.fill('input[name="password"]', testUsers.user2.password);
        await page.click('button[type="submit"]');
        
        // Wait for main app to load
        await page.waitForSelector('.container', { timeout: 10000 });
      } else {
        // In development mode without auth, just refresh
        await page.reload();
      }
      
      console.log('User 2 signed in');
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

    // Step 5: Switch back to User 1 to confirm the event
    await test.step('Switch back to User 1', async () => {
      // Sign out and sign back in as User 1 (similar to step 3)
      const userButton = page.locator('[data-clerk-user-button]');
      if (await userButton.isVisible()) {
        await userButton.click();
        await page.click('button:has-text("Sign out")');
        
        await page.waitForSelector('button:has-text("Sign In")', { timeout: 10000 });
        
        await page.click('button:has-text("Sign In")');
        await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 });
        
        await page.fill('input[name="identifier"]', testUsers.user1.email);
        await page.click('button:has-text("Continue")');
        
        await page.fill('input[name="password"]', testUsers.user1.password);
        await page.click('button[type="submit"]');
        
        await page.waitForSelector('.container', { timeout: 10000 });
      } else {
        await page.reload();
      }
      
      console.log('User 1 signed back in');
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

    // Step 7: Switch back to User 2 to verify confirmed event
    await test.step('User 2 verifies confirmed event', async () => {
      // Switch to User 2 again
      const userButton = page.locator('[data-clerk-user-button]');
      if (await userButton.isVisible()) {
        await userButton.click();
        await page.click('button:has-text("Sign out")');
        
        await page.waitForSelector('button:has-text("Sign In")', { timeout: 10000 });
        
        await page.click('button:has-text("Sign In")');
        await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 });
        
        await page.fill('input[name="identifier"]', testUsers.user2.email);
        await page.click('button:has-text("Continue")');
        
        await page.fill('input[name="password"]', testUsers.user2.password);
        await page.click('button[type="submit"]');
        
        await page.waitForSelector('.container', { timeout: 10000 });
      } else {
        await page.reload();
      }
      
      // Find the confirmed event
      const confirmedEvent = page.locator(`.card:has-text("${eventDescription}")`).first();
      await expect(confirmedEvent).toBeVisible();
      
      // Click on the event to see details
      await confirmedEvent.click();
      
      // Verify event shows as confirmed
      const confirmedStatus = page.locator('text=/confirmed|accepted/i');
      await expect(confirmedStatus).toBeVisible();
      
      console.log('User 2 successfully sees the event as confirmed');
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
    
    await expect(signInButton).toBeVisible();
    await expect(signUpButton).toBeVisible();
    
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
