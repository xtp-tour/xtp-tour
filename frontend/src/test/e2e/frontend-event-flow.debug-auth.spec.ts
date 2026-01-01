/**
 * Debug-auth E2E suite (CI-friendly)
 *
 * Runs without Clerk. Requires:
 * - Backend running with AUTH_TYPE=debug
 * - Frontend started with VITE_DEBUG_AUTH_ENABLED=true and VITE_API_BASE_URL pointing to the backend
 * - Playwright sets localStorage xtp_debug_auth_token per user context
 */

import { test, expect } from '@playwright/test';
import { DEBUG_AUTH_STORAGE_KEY } from '../../auth/debugAuth';
import { completeProfileIfNeeded, createEvent, getBaseUrl, gotoHome } from './helpers/eventFlow';

test.describe('E2E (debug auth, no Clerk)', () => {
  const baseUrl = getBaseUrl();

  test('Basic app loads correctly (no Clerk)', async ({ page }) => {
    await gotoHome(page, baseUrl);
    await expect(page.locator('h1, .h2').first()).toBeVisible();
    await expect(page.locator('.container').first()).toBeVisible();
  });

  test('Direct event link route loads (no Clerk)', async ({ page }) => {
    await page.goto(`${baseUrl}/event/test-invalid-event-id`);
    await page.waitForSelector('h3, .card, [data-testid="event-details"]', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Complete event flow using debug auth tokens', async ({ browser }) => {
    test.setTimeout(180000);
    const eventDescription = `E2E Debug event ${Date.now()}`;

    const user1Token = `e2e-user-1-${Date.now()}`;
    const user2Token = `e2e-user-2-${Date.now()}`;

    const user1Context = await browser.newContext();
    await user1Context.addInitScript(
      ({ key, token }) => localStorage.setItem(key, token),
      { key: DEBUG_AUTH_STORAGE_KEY, token: user1Token }
    );
    const user1 = await user1Context.newPage();

    const user2Context = await browser.newContext();
    await user2Context.addInitScript(
      ({ key, token }) => localStorage.setItem(key, token),
      { key: DEBUG_AUTH_STORAGE_KEY, token: user2Token }
    );
    const user2 = await user2Context.newPage();

    // User 1: open app, complete profile, create event
    await gotoHome(user1, baseUrl);
    await completeProfileIfNeeded(user1);
    await createEvent(user1, eventDescription);

    // User 2: open app, complete profile, join event
    await gotoHome(user2, baseUrl);
    await completeProfileIfNeeded(user2);

    const eventsToJoinTab = user2.locator('button:has-text("Events to Join")');
    await eventsToJoinTab.click();
    await user2.waitForTimeout(800);

    const targetEvent = user2.locator(`.card:has-text("${eventDescription}")`).first();
    await expect(targetEvent).toBeVisible({ timeout: 15000 });

    const joinButton = targetEvent.locator('button:has-text("Join Event")').first();
    await joinButton.click();

    await user2.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await user2.waitForTimeout(800);

    const locationBadge = user2.locator('.modal .badge[role="button"]').first();
    if (await locationBadge.isVisible().catch(() => false)) {
      await locationBadge.click();
    }

    const timeSlotBadge = user2.locator('.modal .time-slot-group .badge[role="button"]').first();
    if (await timeSlotBadge.isVisible().catch(() => false)) {
      await timeSlotBadge.click();
    } else {
      const clockBadge = user2.locator('.modal .badge:has(.bi-clock)').first();
      if (await clockBadge.isVisible().catch(() => false)) {
        await clockBadge.click();
      }
    }

    const submitJoin = user2.locator('.modal button:has-text("Join")').last();
    await submitJoin.click();
    await user2.waitForSelector('.modal', { state: 'hidden', timeout: 10000 });

    // User 1: confirm event
    await gotoHome(user1, baseUrl);
    await completeProfileIfNeeded(user1);

    const myEventsTab = user1.locator('button:has-text("My Events")');
    await myEventsTab.click();
    await user1.waitForTimeout(800);

    const myEvent = user1.locator(`.card:has-text("${eventDescription}")`).first();
    await expect(myEvent).toBeVisible({ timeout: 15000 });

    const confirmButton = myEvent.locator('button:has-text("Confirm")').first();
    await confirmButton.click();

    await user1.waitForSelector('[role="dialog"], .modal', { timeout: 10000 });
    await user1.waitForTimeout(1500);

    const playerCheckbox = user1.locator('.modal .list-group-item input[type="checkbox"]').first();
    if (await playerCheckbox.isVisible().catch(() => false)) {
      await playerCheckbox.check();
      await user1.waitForTimeout(500);
    }

    const locationToConfirm = user1.locator('.modal .badge:has(.bi-geo-alt)').first();
    if (await locationToConfirm.isVisible().catch(() => false)) {
      await locationToConfirm.click();
      await user1.waitForTimeout(500);
    }

    const timeToConfirm = user1.locator('.modal .badge:has(.bi-clock)').first();
    if (await timeToConfirm.isVisible().catch(() => false)) {
      await timeToConfirm.click();
      await user1.waitForTimeout(300);
    }

    const confirmEventButton = user1.locator('.modal button:has-text("Confirm Event")');
    await confirmEventButton.click();
    await user1.waitForSelector('.modal', { state: 'hidden', timeout: 15000 });

    // User 2: verify joined events has at least one card
    await gotoHome(user2, baseUrl);
    await completeProfileIfNeeded(user2);

    const joinedEventsTab = user2.locator('button:has-text("Joined Events")');
    await joinedEventsTab.click();
    await user2.waitForTimeout(800);

    const joinedCount = await user2.locator('.card').count();
    expect(joinedCount).toBeGreaterThan(0);

    await user1Context.close();
    await user2Context.close();
  });
});

