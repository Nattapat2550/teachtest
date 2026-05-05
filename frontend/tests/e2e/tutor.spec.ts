import { test, expect } from '@playwright/test';

test.describe('Tutor Dashboard & Course Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock_tutor_token');
      window.localStorage.setItem('role', 'tutor');
    });

    await page.route('**/api/health', route => route.fulfill({ json: { status: 'ok' } }));
    await page.route('**/api/news', route => route.fulfill({ json: [] }));
    await page.route('**/api/auth/status', route => {
      route.fulfill({ json: { authenticated: true, role: 'tutor', id: 2 } });
    });
    await page.route('**/api/tutor/courses', route => route.fulfill({ json: [] }));
    await page.route('**/api/tutor/analytics', route => route.fulfill({ json: { summary: {}, course_stats: [], recent_sales: [], promo_usages: [] } }));
  });

  test('สามารถเข้าถึงหน้า Workspace และกดเปลี่ยน Tab ได้', async ({ page }) => {
    await page.goto('/tutor');
    await expect(page.locator('text=Workspace: จัดการระบบการเรียนการสอน')).toBeVisible();
    
    await page.click('button:has-text("จัดการเนื้อหา & โปรโมโค้ด")');
    await expect(page.locator('text=จัดการเนื้อหาและโปรโมโค้ด')).toBeVisible();

    await page.click('button:has-text("จัดแพ็กเกจรวมคอร์ส")');
    await expect(page.locator('h2:has-text("จัดแพ็กเกจใหม่")')).toBeVisible();
  });

  test('สามารถกรอกฟอร์มสร้างคอร์สเรียนใหม่ได้', async ({ page }) => {
    await page.goto('/tutor');
    
    await page.fill('input[placeholder="ชื่อคอร์ส"]', 'คอร์สเรียนคณิตศาสตร์ ม.ปลาย');
    await page.fill('input[placeholder="ราคา (บาท)"]', '2500');
    await page.fill('textarea[placeholder="รายละเอียดคอร์ส"]', 'สอนตั้งแต่พื้นฐานจนถึงตะลุยโจทย์');
    
    const createBtn = page.locator('button:has-text("สร้างคอร์ส")');
    await expect(createBtn).toBeVisible();
  });
});