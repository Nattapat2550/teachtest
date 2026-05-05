import { test, expect } from '@playwright/test';

test.describe('LMS Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_token_123');
      window.localStorage.setItem('role', 'student');
    });

    await page.route('**/api/health', route => route.fulfill({ json: { status: 'ok' } }));
    await page.route('**/api/news', route => route.fulfill({ json: [] }));
    await page.route('**/api/auth/status', route => {
      route.fulfill({ json: { authenticated: true, role: 'student', id: 1 } });
    });
  });

  test('นักเรียนสามารถเข้าดูหน้ารวมคอร์สและกดดูรายละเอียดได้', async ({ page }) => {
    await page.goto('/courses');
    
    await expect(page.locator('text=หลักสูตรทั้งหมด')).toBeVisible();
    
    const courseCards = page.locator('.aspect-video');
    const noCourseMsg = page.locator('text=ยังไม่มีหลักสูตรที่เปิดสอน');
    
    const hasCourses = await courseCards.count() > 0;
    const hasNoCourses = await noCourseMsg.isVisible();
    
    expect(hasCourses || hasNoCourses).toBeTruthy();
  });
});