/**
 * End-to-End tests for "Pay for your Friend" feature
 * Tests the complete user journey from login to payment completion
 */

import { test, expect, type Page } from '@playwright/test';

// Test data
const testUsers = {
  diasporaUser: {
    fullName: 'John Diaspora',
    phone: '+1234567890',
    email: 'john.diaspora@test.com',
    pin: '1234',
    country: 'United States',
  },
  localFriend: {
    fullName: 'Mary Local',
    phone: '+263771234567',
    email: 'mary.local@test.com',
    pin: '1234',
    country: 'Zimbabwe',
  },
};

class PayForFriendPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/pay-for-friend');
  }

  async addFriend(phone: string, nickname: string, relationship: string, monthlyLimit: string) {
    await this.page.click('[data-testid="add-friend-button"]');
    await this.page.fill('[data-testid="friend-phone-input"]', phone);
    await this.page.fill('[data-testid="friend-nickname-input"]', nickname);
    await this.page.selectOption('[data-testid="relationship-select"]', relationship);
    await this.page.fill('[data-testid="monthly-limit-input"]', monthlyLimit);
    await this.page.click('[data-testid="confirm-add-friend"]');
  }

  async sendPayment(recipientName: string, amount: string, currency: string, purpose: string) {
    // Find and click on the specific friend card
    await this.page.click(`[data-testid="friend-card-${recipientName}"] [data-testid="send-money-button"]`);
    
    // Fill payment form
    await this.page.fill('[data-testid="payment-amount-input"]', amount);
    await this.page.selectOption('[data-testid="sender-currency-select"]', currency);
    await this.page.fill('[data-testid="payment-purpose-textarea"]', purpose);
    
    // Submit payment
    await this.page.click('[data-testid="submit-payment-button"]');
  }

  async getNotification() {
    await this.page.waitForSelector('[data-testid="notification-toast"]', { timeout: 10000 });
    return await this.page.textContent('[data-testid="notification-toast"]');
  }

  async getFriendsList() {
    await this.page.waitForSelector('[data-testid="friends-list"]');
    return await this.page.$$('[data-testid^="friend-card-"]');
  }

  async getPaymentHistory() {
    await this.page.click('[data-testid="payment-history-tab"]');
    await this.page.waitForSelector('[data-testid="payment-history-list"]');
    return await this.page.$$('[data-testid^="payment-item-"]');
  }
}

test.describe('Pay for your Friend - Complete User Journey', () => {
  let page: Page;
  let payForFriendPage: PayForFriendPage;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    payForFriendPage = new PayForFriendPage(page);

    // Setup test users (would be done via API in real tests)
    await page.evaluate(async () => {
      // Mock user authentication
      localStorage.setItem('user', JSON.stringify({
        id: 'user-123',
        fullName: 'John Diaspora',
        isInternational: true,
        kycStatus: 'verified',
        countryCode: 'US',
      }));
    });
  });

  test('should display pay for friend page for international users', async () => {
    await payForFriendPage.goto();

    // Check page elements
    await expect(page.locator('h1')).toContainText('Pay for your Friend');
    await expect(page.locator('[data-testid="add-friend-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="friends-summary-cards"]')).toBeVisible();
  });

  test('should prevent access for non-international users', async () => {
    // Change user to local user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'user-456',
        fullName: 'Local User',
        isInternational: false,
        kycStatus: 'verified',
        countryCode: 'ZW',
      }));
    });

    await payForFriendPage.goto();

    // Should show access denied message
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-denied-message"]')).toContainText('only available for international users');
  });

  test('should add a friend successfully', async () => {
    await payForFriendPage.goto();

    // Add a friend
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Mom',
      'family',
      '2000'
    );

    // Verify friend was added
    const notification = await payForFriendPage.getNotification();
    expect(notification).toContain('Friend added successfully');

    // Check friend appears in list
    const friends = await payForFriendPage.getFriendsList();
    expect(friends.length).toBeGreaterThan(0);
    
    await expect(page.locator('[data-testid="friend-card-Mom"]')).toBeVisible();
    await expect(page.locator('[data-testid="friend-card-Mom"]')).toContainText('Mom');
    await expect(page.locator('[data-testid="friend-card-Mom"]')).toContainText(testUsers.localFriend.phone);
  });

  test('should prevent duplicate friend additions', async () => {
    await payForFriendPage.goto();

    // Add friend first time
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Mom',
      'family',
      '2000'
    );

    // Wait for success notification
    await payForFriendPage.getNotification();

    // Try to add same friend again
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Mother',
      'family',
      '1500'
    );

    // Should show error notification
    const errorNotification = await payForFriendPage.getNotification();
    expect(errorNotification).toContain('already exists');
  });

  test('should send cross-border payment successfully', async () => {
    await payForFriendPage.goto();

    // First add a friend
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Mom',
      'family',
      '2000'
    );
    await payForFriendPage.getNotification(); // Wait for add to complete

    // Send payment
    await payForFriendPage.sendPayment('Mom', '100', 'USD', 'Monthly support');

    // Wait for payment confirmation
    await page.waitForSelector('[data-testid="payment-success-modal"]', { timeout: 15000 });
    
    // Check payment details in success modal
    await expect(page.locator('[data-testid="payment-success-modal"]')).toContainText('Payment Sent Successfully');
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText('$100.00');
    await expect(page.locator('[data-testid="recipient-name"]')).toContainText('Mom');
    
    // Check exchange rate conversion is displayed
    await expect(page.locator('[data-testid="converted-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="exchange-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="fees-breakdown"]')).toBeVisible();
  });

  test('should enforce monthly limits', async () => {
    await payForFriendPage.goto();

    // Add friend with low limit
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Friend',
      'friend',
      '50' // Low limit
    );
    await payForFriendPage.getNotification();

    // Try to send payment exceeding limit
    await payForFriendPage.sendPayment('Friend', '100', 'USD', 'Large payment');

    // Should show limit exceeded error
    await page.waitForSelector('[data-testid="error-modal"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="error-modal"]')).toContainText('exceeds the monthly limit');
  });

  test('should require KYC verification for large payments', async () => {
    // Change user to unverified
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'user-unverified',
        fullName: 'Unverified User',
        isInternational: true,
        kycStatus: 'pending',
        countryCode: 'US',
      }));
    });

    await payForFriendPage.goto();

    // Should show KYC warning
    await expect(page.locator('[data-testid="kyc-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="kyc-warning"]')).toContainText('Identity Verification Required');

    // Add friend
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Friend',
      'friend',
      '5000'
    );
    await payForFriendPage.getNotification();

    // Try large payment
    await payForFriendPage.sendPayment('Friend', '1500', 'USD', 'Large payment');

    // Should show KYC required error
    await page.waitForSelector('[data-testid="error-modal"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="error-modal"]')).toContainText('KYC verification required');
  });

  test('should display real-time exchange rates', async () => {
    await payForFriendPage.goto();

    // Add friend
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Mom',
      'family',
      '2000'
    );
    await payForFriendPage.getNotification();

    // Click send money to open form
    await page.click('[data-testid="friend-card-Mom"] [data-testid="send-money-button"]');

    // Enter amount and check exchange rate display
    await page.fill('[data-testid="payment-amount-input"]', '100');
    
    // Wait for exchange rate to load
    await page.waitForSelector('[data-testid="exchange-rate-display"]');
    
    // Check exchange rate components
    await expect(page.locator('[data-testid="exchange-rate-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="exchange-rate-value"]')).toContainText('USD');
    await expect(page.locator('[data-testid="recipient-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="fee-breakdown"]')).toBeVisible();
    
    // Check that fees are calculated
    await expect(page.locator('[data-testid="exchange-fee"]')).toContainText('$');
    await expect(page.locator('[data-testid="transfer-fee"]')).toContainText('$');
    await expect(page.locator('[data-testid="total-fees"]')).toContainText('$');
  });

  test('should handle network errors gracefully', async () => {
    await payForFriendPage.goto();

    // Simulate network failure
    await page.route('**/api/friend-network/add', route => route.abort());

    // Try to add friend
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Friend',
      'friend',
      '1000'
    );

    // Should show network error
    const errorNotification = await payForFriendPage.getNotification();
    expect(errorNotification).toContain('network error');
  });

  test('should show payment history', async () => {
    await payForFriendPage.goto();

    // Add friend and make payment first
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Mom',
      'family',
      '2000'
    );
    await payForFriendPage.getNotification();

    await payForFriendPage.sendPayment('Mom', '50', 'USD', 'Test payment');
    await page.waitForSelector('[data-testid="payment-success-modal"]');
    await page.click('[data-testid="close-success-modal"]');

    // Check payment history
    const paymentHistory = await payForFriendPage.getPaymentHistory();
    expect(paymentHistory.length).toBeGreaterThan(0);

    // Check payment details in history
    await expect(page.locator('[data-testid="payment-history-list"]')).toContainText('$50.00');
    await expect(page.locator('[data-testid="payment-history-list"]')).toContainText('Mom');
    await expect(page.locator('[data-testid="payment-history-list"]')).toContainText('Test payment');
  });

  test('should be responsive on mobile devices', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await payForFriendPage.goto();

    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="friends-grid"]')).toHaveCSS('grid-template-columns', /^1fr$/);
    
    // Add friend on mobile
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Mom',
      'family',
      '2000'
    );

    // Check mobile-optimized friend card
    await expect(page.locator('[data-testid="friend-card-Mom"]')).toBeVisible();
    
    // Test mobile payment flow
    await payForFriendPage.sendPayment('Mom', '25', 'USD', 'Mobile payment');
    
    // Check mobile payment modal
    await page.waitForSelector('[data-testid="payment-success-modal"]');
    await expect(page.locator('[data-testid="payment-success-modal"]')).toBeVisible();
  });

  test('should handle offline mode gracefully', async () => {
    await payForFriendPage.goto();

    // Go offline
    await page.context().setOffline(true);

    // Try to add friend while offline
    await payForFriendPage.addFriend(
      testUsers.localFriend.phone,
      'Friend',
      'friend',
      '1000'
    );

    // Should show offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('offline');

    // Go back online
    await page.context().setOffline(false);

    // Should retry and succeed
    await page.click('[data-testid="retry-button"]');
    const notification = await payForFriendPage.getNotification();
    expect(notification).toContain('Friend added successfully');
  });

  test('should validate form inputs', async () => {
    await payForFriendPage.goto();

    // Try to add friend with invalid data
    await page.click('[data-testid="add-friend-button"]');
    
    // Empty form submission
    await page.click('[data-testid="confirm-add-friend"]');
    
    // Check validation errors
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('required');
    await expect(page.locator('[data-testid="nickname-error"]')).toContainText('required');
    
    // Invalid phone number
    await page.fill('[data-testid="friend-phone-input"]', '123');
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('Invalid phone');
    
    // Invalid monthly limit
    await page.fill('[data-testid="monthly-limit-input"]', '-100');
    await expect(page.locator('[data-testid="limit-error"]')).toContainText('must be positive');
  });

  test('should provide accessibility features', async () => {
    await payForFriendPage.goto();

    // Check ARIA labels
    await expect(page.locator('[data-testid="add-friend-button"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="friends-grid"]')).toHaveAttribute('role', 'grid');
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="add-friend-button"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
    
    // Check screen reader support
    await expect(page.locator('[data-testid="page-title"]')).toHaveAttribute('role', 'heading');
    await expect(page.locator('[data-testid="friends-summary"]')).toHaveAttribute('aria-live', 'polite');
  });
});