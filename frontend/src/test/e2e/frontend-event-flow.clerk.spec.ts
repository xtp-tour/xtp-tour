/**
 * Clerk E2E suite (prod-like)
 *
 * Requires:
 * - Backend running with AUTH_TYPE=clerk
 * - Frontend built/served with VITE_CLERK_PUBLISHABLE_KEY
 */

import { test, expect } from '@playwright/test';
import { completeProfileIfNeeded, createEvent, getBaseUrl, gotoHome } from './helpers/eventFlow';

// Use existing development users (documented in frontend/AGENTS.md)
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

test.describe('E2E (Clerk / prod-like)', () => {
  const baseUrl = getBaseUrl();

  test('Complete event flow with existing users (Clerk)', async ({ page }) => {
    test.setTimeout(180000);
    const eventDescription = `E2E Clerk event ${Date.now()}`;

    async function signIn(email: string, password: string) {
      const signInButton = page.locator('button:has-text("Sign in")').first();
      if (await signInButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signInButton.click();

        const clerkModal = page.locator('[role="dialog"]');
        await clerkModal.waitFor({ state: 'visible', timeout: 10000 });

        const emailField = page.locator('input[placeholder*="email" i], input[name="identifier"]').first();
        await emailField.fill(email);

        const passwordField = page.locator('input[type="password"], input[placeholder*="password" i]').first();
        await passwordField.fill(password);

        const continueButton = page.locator('button:has-text("Continue")');
        await continueButton.click();

        await clerkModal.waitFor({ state: 'hidden', timeout: 15000 });
      }
    }

    // User 1: sign in + profile + create event
    await gotoHome(page, baseUrl);
    await signIn(testUsers.user1.email, testUsers.user1.password);
    await completeProfileIfNeeded(page);
    await createEvent(page, eventDescription);

    // Switch to user 2 via UI sign out/sign in
    await gotoHome(page, baseUrl);
    const userMenuButton = page.locator('button:has-text("@example.com")').first();
    if (await userMenuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userMenuButton.click();
      const signOutButton = page.locator('.dropdown-item:has-text("Sign Out"), a:has-text("Sign Out")');
      await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
      await signOutButton.click();
      await page.waitForSelector('button:has-text("Sign in")', { timeout: 10000 });
    }

    await signIn(testUsers.user2.email, testUsers.user2.password);
    await completeProfileIfNeeded(page);

    // Join the newly created event
    const eventsToJoinTab = page.locator('button:has-text("Events to Join")');
    await eventsToJoinTab.click();
    await page.waitForTimeout(800);

    const targetEvent = page.locator(`.card:has-text("${eventDescription}")`).first();
    await expect(targetEvent).toBeVisible({ timeout: 15000 });

    await targetEvent.locator('button:has-text("Join Event")').first().click();
    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await page.waitForTimeout(800);

    const locationBadge = page.locator('.modal .badge[role="button"]').first();
    if (await locationBadge.isVisible().catch(() => false)) {
      await locationBadge.click();
    }

    const timeSlotBadge = page.locator('.modal .time-slot-group .badge[role="button"]').first();
    if (await timeSlotBadge.isVisible().catch(() => false)) {
      await timeSlotBadge.click();
    } else {
      const clockBadge = page.locator('.modal .badge:has(.bi-clock)').first();
      if (await clockBadge.isVisible().catch(() => false)) {
        await clockBadge.click();
      }
    }

    await page.locator('.modal button:has-text("Join")').last().click();
    await page.waitForSelector('.modal', { state: 'hidden', timeout: 10000 });

    // Switch back to user 1 and confirm
    await gotoHome(page, baseUrl);
    if (await userMenuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userMenuButton.click();
      const signOutButton = page.locator('.dropdown-item:has-text("Sign Out"), a:has-text("Sign Out")');
      await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
      await signOutButton.click();
      await page.waitForSelector('button:has-text("Sign in")', { timeout: 10000 });
    }

    await signIn(testUsers.user1.email, testUsers.user1.password);
    await completeProfileIfNeeded(page);

    const myEventsTab = page.locator('button:has-text("My Events")');
    await myEventsTab.click();
    await page.waitForTimeout(800);

    const myEvent = page.locator(`.card:has-text("${eventDescription}")`).first();
    await expect(myEvent).toBeVisible({ timeout: 15000 });

    await myEvent.locator('button:has-text("Confirm")').first().click();
    await page.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await page.waitForTimeout(1500);

    const playerCheckbox = page.locator('.modal .list-group-item input[type="checkbox"]').first();
    if (await playerCheckbox.isVisible().catch(() => false)) {
      await playerCheckbox.check();
      await page.waitForTimeout(500);
    }

    const locationToConfirm = page.locator('.modal .badge:has(.bi-geo-alt)').first();
    if (await locationToConfirm.isVisible().catch(() => false)) {
      await locationToConfirm.click();
      await page.waitForTimeout(500);
    }

    const timeToConfirm = page.locator('.modal .badge:has(.bi-clock)').first();
    if (await timeToConfirm.isVisible().catch(() => false)) {
      await timeToConfirm.click();
      await page.waitForTimeout(300);
    }

    const confirmEventButton = page.locator('.modal button:has-text("Confirm Event")');
    await confirmEventButton.click();
    await page.waitForSelector('.modal', { state: 'hidden', timeout: 15000 });
  });
});

