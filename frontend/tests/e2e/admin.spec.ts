import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // 🛑 Mock สถานะให้ระบบคิดว่า Login เป็น Admin แล้ว
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_admin_token');
      window.localStorage.setItem('role', 'admin');
    });

    await page.route('**/api/health', route => route.fulfill({ json: { status: 'ok' } }));
    await page.route('**/api/news', route => route.fulfill({ json: [] }));
    await page.route('**/api/auth/status', route => {
      route.fulfill({ json: { authenticated: true, role: 'admin', id: 1 } });
    });
  });

  test('Admin สามารถเข้าถึง Dashboard และเห็น Tab ต่างๆ ได้', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('button:has-text("ผู้ใช้งาน")')).toBeVisible();
    await expect(page.locator('button:has-text("ข่าวสาร")')).toBeVisible();
  });
});