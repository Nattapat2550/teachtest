import { test, expect } from '@playwright/test';

test.describe('Student Learning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_student_token');
      window.localStorage.setItem('role', 'student');
      window.localStorage.setItem('owner', JSON.stringify({ id: 3, role: 'student' }));
    });

    await page.route('**/api/health', route => route.fulfill({ json: { status: 'ok' } }));
    await page.route('**/api/news', route => route.fulfill({ json: [] }));
    await page.route('**/api/auth/status', route => {
      route.fulfill({ json: { authenticated: true, role: 'student', id: 3 } });
    });
  });

  test('แสดงยอดเงินในกระเป๋า (Wallet) ถูกต้อง', async ({ page }) => {
    await page.route('**/api/users/me/wallet', route => {
      route.fulfill({ json: { user_id: "U123", balance: 5000 } });
    });
    await page.route('**/api/student/learning', route => route.fulfill({ json: [] }));
    await page.route('**/api/courses', route => route.fulfill({ json: [] }));
    await page.route('**/api/packages', route => route.fulfill({ json: [] }));

    await page.goto('/courses');
    await expect(page.locator('text=ยอดเงินคงเหลือของคุณ')).toBeVisible();
    await expect(page.locator('text=฿ 5,000.00')).toBeVisible();
  });

  test('สามารถเข้าหน้าห้องเรียน (Learning Room) ได้', async ({ page }) => {
    await page.route('**/api/student/learning', route => {
      route.fulfill({
        json: [{
          id: "enroll_1",
          course: {
            title: "Physics 101",
            playlists: [{
              id: "pl_1", title: "Chapter 1",
              items: [{ id: "it_1", title: "Intro Video", item_type: "video", content_url: "http://vid.mp4" }]
            }]
          }
        }]
      });
    });

    await page.goto('/learn/enroll_1');
    await expect(page.locator('h1:has-text("Physics 101")').or(page.locator('h2:has-text("Physics 101")'))).toBeVisible();
    await expect(page.locator('text=Chapter 1').first()).toBeVisible();
    await expect(page.locator('text=Intro Video').first()).toBeVisible();
  });
});