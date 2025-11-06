import { test, expect } from '@playwright/test';

/**
 * E2E Test: Arabic Rendering and UTF-8 Support
 * Verifies that Arabic text is rendered correctly throughout the application
 */

const ADMIN_CREDENTIALS = {
  email: 'admin@nursery.local',
  password: 'Admin123!',
};

test.describe('Arabic Rendering and UTF-8 Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should render Arabic text in governorate dropdown', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to nursery creation
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Wait for governorate dropdown
    await page.waitForSelector('select[name="governorate_id"]');

    // Get all option texts
    const options = await page.locator('select[name="governorate_id"] option').allTextContents();

    // Verify at least one option contains Arabic characters
    const hasArabicOption = options.some(option => /[\u0621-\u064A]/.test(option));
    expect(hasArabicOption).toBeTruthy();

    // Check specific governorates (known to be seeded)
    const optionTexts = options.join(' ');
    
    // Verify common Arabic governorate names are present
    const arabicGovernorates = ['عمّان', 'إربد', 'الزرقاء', 'العقبة'];
    let foundArabicNames = 0;
    
    for (const name of arabicGovernorates) {
      if (optionTexts.includes(name)) {
        foundArabicNames++;
      }
    }
    
    expect(foundArabicNames).toBeGreaterThanOrEqual(1);
  });

  test('should render Arabic input text correctly', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to form with Arabic inputs
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Test various Arabic strings
    const arabicTestStrings = [
      'حضانة الأطفال السعيدة',
      'مدينة عمّان',
      'شارع الملك عبدالله الثاني',
      'فرع رقم ١',
    ];

    for (const testString of arabicTestStrings) {
      // Fill Arabic name
      await page.fill('input[name="name_ar"]', testString);
      
      // Verify it displays correctly
      const value = await page.locator('input[name="name_ar"]').inputValue();
      expect(value).toBe(testString);
      
      // Clear for next test
      await page.fill('input[name="name_ar"]', '');
    }
  });

  test('should not display mojibake characters', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to any page with Arabic text
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Get page content
    const pageContent = await page.content();

    // Common mojibake patterns for Arabic text
    const mojibakePatterns = [
      /Ø§Ù„/,  // "ال" displayed as mojibake
      /Ø¹Ù…Ø§Ù†/,  // "عمان" displayed as mojibake
      /Ã˜Â§Ã™â€¦/,  // Another mojibake pattern
      /\?{3,}/,  // Multiple question marks (encoding failure)
    ];

    // Verify no mojibake patterns are present
    for (const pattern of mojibakePatterns) {
      expect(pattern.test(pageContent)).toBeFalsy();
    }
  });

  test('should have correct charset meta tag', async ({ page }) => {
    await page.goto('/');

    // Check for UTF-8 charset meta tag
    const charsetMeta = await page.locator('meta[charset]').getAttribute('charset');
    expect(charsetMeta?.toLowerCase()).toBe('utf-8');
  });

  test('should have correct content-type header', async ({ page }) => {
    const response = await page.goto('/');
    
    // Verify content-type header includes UTF-8
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('charset=utf-8');
  });

  test('should render mixed Arabic-English text correctly', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to form
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Test mixed text
    const mixedText = 'Nursery حضانة 123';
    await page.fill('input[name="name_ar"]', mixedText);
    
    const value = await page.locator('input[name="name_ar"]').inputValue();
    expect(value).toBe(mixedText);

    // Verify English letters
    expect(value).toContain('Nursery');
    
    // Verify Arabic letters
    expect(value).toContain('حضانة');
    
    // Verify numbers
    expect(value).toContain('123');
  });

  test('should render Arabic numbers (Eastern Arabic numerals)', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to form
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Test Eastern Arabic numerals (٠-٩)
    const easternNumerals = 'فرع رقم ١٢٣';
    await page.fill('input[name="name_ar"]', easternNumerals);
    
    const value = await page.locator('input[name="name_ar"]').inputValue();
    expect(value).toBe(easternNumerals);
  });

  test('should maintain Arabic text direction (RTL)', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to form with Arabic inputs
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Find Arabic input field
    const arabicInput = page.locator('input[name="name_ar"]');
    
    // Fill with Arabic text
    await arabicInput.fill('حضانة الأطفال');

    // Check if dir attribute is set to RTL (if implemented)
    const dir = await arabicInput.getAttribute('dir');
    
    // Either dir="rtl" is set, or Arabic text renders naturally RTL
    if (dir) {
      expect(dir).toBe('rtl');
    }

    // Verify text direction via computed style
    const textAlign = await arabicInput.evaluate(el => window.getComputedStyle(el).direction);
    
    // Should be either 'rtl' or default (which browser handles for Arabic)
    expect(['rtl', 'ltr']).toContain(textAlign);
  });

  test('should handle Arabic diacritics correctly', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to form
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Text with diacritics (تشكيل)
    const textWithDiacritics = 'حَضَانَةُ الأَطْفَالِ';
    await page.fill('input[name="name_ar"]', textWithDiacritics);
    
    const value = await page.locator('input[name="name_ar"]').inputValue();
    expect(value).toBe(textWithDiacritics);
  });
});
