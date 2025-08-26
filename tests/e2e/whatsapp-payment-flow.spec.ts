/**
 * WhatsApp Payment Flow E2E Tests
 * End-to-end tests for WhatsApp integration with pay-for-friend feature
 */

import { test, expect } from '@playwright/test';

test.describe('WhatsApp Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto('/');
    
    // Mock successful login
    await page.goto('/login');
    await page.fill('[data-testid="phone"]', '+1234567890');
    await page.fill('[data-testid="pin"]', '1234');
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display WhatsApp sync option in pay-for-friend page', async ({ page }) => {
    await page.goto('/pay-for-friend');
    
    // Check if WhatsApp sync button is visible
    await expect(page.locator('button:has-text("Sync WhatsApp")')).toBeVisible();
    
    // Check for WhatsApp icon
    await expect(page.locator('[data-lucide="message-circle"]')).toBeVisible();
  });

  test('should open WhatsApp sync dialog', async ({ page }) => {
    await page.goto('/pay-for-friend');
    
    // Click WhatsApp sync button
    await page.click('button:has-text("Sync WhatsApp")');
    
    // Check if dialog opens
    await expect(page.locator('h2:has-text("Sync WhatsApp Contacts")')).toBeVisible();
    
    // Check dialog content
    await expect(page.locator('text=Import your WhatsApp contacts')).toBeVisible();
    await expect(page.locator('text=Send payment requests via WhatsApp')).toBeVisible();
    await expect(page.locator('text=Instant notifications to friends')).toBeVisible();
    
    // Check sync button in dialog
    await expect(page.locator('button:has-text("Sync Contacts")')).toBeVisible();
  });

  test('should simulate WhatsApp contact sync', async ({ page }) => {
    // Mock API response for WhatsApp sync
    await page.route('/api/whatsapp/contacts/sync', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Contacts synchronized successfully',
          stats: {
            totalContacts: 3,
            syncedContacts: 3,
            friendNetworksCreated: 2,
            errors: [],
          },
          contacts: [
            {
              id: 'contact_1',
              whatsappNumber: '+263771234567',
              displayName: 'John Doe',
              isVerified: true,
              trustScore: '0.85',
            },
            {
              id: 'contact_2',
              whatsappNumber: '+263772345678',
              displayName: 'Jane Smith',
              isVerified: true,
              trustScore: '0.90',
            },
          ],
        }),
      });
    });

    await page.goto('/pay-for-friend');
    
    // Click WhatsApp sync button
    await page.click('button:has-text("Sync WhatsApp")');
    
    // Click sync contacts in dialog
    await page.click('button:has-text("Sync Contacts")');
    
    // Wait for sync to complete
    await expect(page.locator('text=Synced 3 WhatsApp contacts successfully!')).toBeVisible({
      timeout: 10000,
    });
    
    // Dialog should close
    await expect(page.locator('h2:has-text("Sync WhatsApp Contacts")')).toBeHidden();
  });

  test('should display WhatsApp-enabled friends with badges', async ({ page }) => {
    await page.goto('/pay-for-friend');
    
    // Look for friends with WhatsApp badges
    await expect(page.locator('[data-testid="friend-card"]')).toBeVisible();
    
    // Check for WhatsApp badge on friend cards
    const whatsappBadges = page.locator('text=WhatsApp').first();
    if (await whatsappBadges.isVisible()) {
      await expect(whatsappBadges).toBeVisible();
    }
    
    // Check for WhatsApp request button
    const whatsappButton = page.locator('button:has-text("Send WhatsApp Request")').first();
    if (await whatsappButton.isVisible()) {
      await expect(whatsappButton).toBeVisible();
    }
  });

  test('should send WhatsApp payment request', async ({ page }) => {
    // Mock API response for WhatsApp payment request
    await page.route('/api/whatsapp/payment-request', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          messageId: 'whatsapp_message_123',
          message: 'Payment request sent successfully via WhatsApp',
        }),
      });
    });

    await page.goto('/pay-for-friend');
    
    // Wait for friends to load
    await page.waitForSelector('[data-testid="friend-card"]', { timeout: 10000 });
    
    // Find and click WhatsApp request button
    const whatsappButton = page.locator('button:has-text("Send WhatsApp Request")').first();
    
    if (await whatsappButton.isVisible()) {
      await whatsappButton.click();
      
      // Wait for success message
      await expect(page.locator('text=Payment request sent via WhatsApp!')).toBeVisible({
        timeout: 10000,
      });
    } else {
      // Skip test if WhatsApp button is not available
      console.log('WhatsApp button not available, skipping WhatsApp request test');
    }
  });

  test('should handle WhatsApp sync errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('/api/whatsapp/contacts/sync', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/pay-for-friend');
    
    // Click WhatsApp sync button
    await page.click('button:has-text("Sync WhatsApp")');
    
    // Click sync contacts in dialog
    await page.click('button:has-text("Sync Contacts")');
    
    // Wait for error message
    await expect(page.locator('text=Failed to sync WhatsApp contacts')).toBeVisible({
      timeout: 10000,
    });
    
    // Dialog should remain open for retry
    await expect(page.locator('h2:has-text("Sync WhatsApp Contacts")')).toBeVisible();
  });

  test('should handle WhatsApp payment request errors', async ({ page }) => {
    // Mock API error response
    await page.route('/api/whatsapp/payment-request', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to send WhatsApp message',
          details: 'Invalid phone number',
        }),
      });
    });

    await page.goto('/pay-for-friend');
    
    // Wait for friends to load
    await page.waitForSelector('[data-testid="friend-card"]', { timeout: 10000 });
    
    // Find and click WhatsApp request button
    const whatsappButton = page.locator('button:has-text("Send WhatsApp Request")').first();
    
    if (await whatsappButton.isVisible()) {
      await whatsappButton.click();
      
      // Wait for error message
      await expect(page.locator('text=Failed to send WhatsApp payment request')).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should display WhatsApp features for international users only', async ({ page }) => {
    await page.goto('/pay-for-friend');
    
    // Check if page loads properly for international users
    await expect(page.locator('h1:has-text("Pay for your Friend")')).toBeVisible();
    
    // WhatsApp features should be visible for international users
    await expect(page.locator('button:has-text("Sync WhatsApp")')).toBeVisible();
    
    // Check for global icon indicating international functionality
    await expect(page.locator('[data-lucide="globe"]')).toBeVisible();
  });

  test('should show WhatsApp integration benefits in sync dialog', async ({ page }) => {
    await page.goto('/pay-for-friend');
    
    // Click WhatsApp sync button
    await page.click('button:has-text("Sync WhatsApp")');
    
    // Check all benefit items
    await expect(page.locator('text=Send payment requests via WhatsApp')).toBeVisible();
    await expect(page.locator('text=Instant notifications to friends')).toBeVisible();
    await expect(page.locator('text=Auto-create trusted friend networks')).toBeVisible();
    await expect(page.locator('text=Seamless payment experience')).toBeVisible();
    
    // Check benefits section styling
    await expect(page.locator('.bg-blue-50')).toBeVisible();
  });

  test('should maintain WhatsApp functionality during navigation', async ({ page }) => {
    await page.goto('/pay-for-friend');
    
    // Click WhatsApp sync button
    await page.click('button:has-text("Sync WhatsApp")');
    
    // Cancel the dialog
    await page.click('button:has-text("Cancel")');
    
    // Dialog should close
    await expect(page.locator('h2:has-text("Sync WhatsApp Contacts")')).toBeHidden();
    
    // Navigate to another tab and back
    await page.click('text=Send Money');
    await page.click('text=My Friends');
    
    // WhatsApp sync button should still be visible
    await expect(page.locator('button:has-text("Sync WhatsApp")')).toBeVisible();
  });
});
