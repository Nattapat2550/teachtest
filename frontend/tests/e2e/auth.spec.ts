import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 🛑 บล็อกไม่ให้ Modal ข่าวสารเด้งขึ้นมาบังปุ่ม
    await page.route('**/api/news', route => route.fulfill({ json: [] }));
    await page.route('**/api/health', route => route.fulfill({ json: { status: 'ok' } }));
  });

  test('หน้า Landing Page ต้องแสดงปุ่มเข้าสู่ระบบและสมัครสมาชิก', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Welcome to TeachTest')).toBeVisible();

    await expect(page.locator('a:has-text("เข้าสู่ระบบ")').first()).toBeVisible();
    await expect(page.locator('a:has-text("สมัครสมาชิกใหม่")').first()).toBeVisible();
  });

  test('สามารถกรอกฟอร์ม Login และแสดงข้อความ Error เมื่อรหัสผิด', async ({ page }) => {
    await page.goto('/login');
    
    // Mock API Login ให้ตอบกลับเป็น Error เสมอสำหรับเทสนี้
    await page.route('**/api/auth/login', route => {
      route.fulfill({ status: 401, json: { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' } });
    });

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible({ timeout: 5000 });
  });

  test('ลิงก์ลืมรหัสผ่านทำงานได้', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=ลืมรหัสผ่าน?');
    await expect(page).toHaveURL(/\/reset/);
    await expect(page.locator('h2:has-text("ลืมรหัสผ่าน")')).toBeVisible();
  });
});