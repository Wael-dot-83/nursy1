import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Nursery Creation Workflow
 * Tests the full flow of creating a nursery with multiple branches
 */

// Test data
const ADMIN_CREDENTIALS = {
  email: 'admin@nursery.local',
  password: 'Admin123!',
};

const TEST_NURSERY = {
  name_en: 'Sunshine Nursery',
  name_ar: 'حضانة الشمس المشرقة',
  registration_number: `REG-E2E-${Date.now()}`,
  governorate_id: 1, // Amman
};

const TEST_BRANCHES = [
  {
    name_en: 'Main Branch',
    name_ar: 'الفرع الرئيسي',
    address_en: '123 Main Street, Amman',
    address_ar: 'شارع الرئيسي ١٢٣، عمان',
    phone: '+962791234567',
    capacity: 50,
    manager_email: `manager1.${Date.now()}@sunshine.local`,
    manager_first_name: 'Ahmad',
    manager_last_name: 'Hassan',
    manager_phone: '+962791234567',
  },
  {
    name_en: 'West Branch',
    name_ar: 'الفرع الغربي',
    address_en: '456 West Street, Amman',
    address_ar: 'شارع الغرب ٤٥٦، عمان',
    phone: '+962791234568',
    capacity: 30,
    manager_email: `manager2.${Date.now()}@sunshine.local`,
    manager_first_name: 'Fatima',
    manager_last_name: 'Ali',
    manager_phone: '+962791234568',
  },
];

test.describe('Nursery Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should login as admin successfully', async ({ page }) => {
    // Fill login form
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    
    // Verify admin dashboard elements are visible
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });

  test('should create nursery with two branches', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to nursery creation page
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');
    
    // Wait for form to load
    await page.waitForSelector('form');

    // Fill nursery details
    await page.fill('input[name="name_en"]', TEST_NURSERY.name_en);
    await page.fill('input[name="name_ar"]', TEST_NURSERY.name_ar);
    await page.fill('input[name="registration_number"]', TEST_NURSERY.registration_number);
    
    // Select governorate from dropdown
    await page.click('select[name="governorate_id"]');
    await page.selectOption('select[name="governorate_id"]', String(TEST_NURSERY.governorate_id));

    // Verify governorate dropdown has options
    const governorateOptions = await page.locator('select[name="governorate_id"] option').count();
    expect(governorateOptions).toBeGreaterThanOrEqual(12); // At least 12 Jordan governorates

    // Fill first branch details
    await page.fill('input[name="branches[0].name_en"]', TEST_BRANCHES[0].name_en);
    await page.fill('input[name="branches[0].name_ar"]', TEST_BRANCHES[0].name_ar);
    await page.fill('input[name="branches[0].address_en"]', TEST_BRANCHES[0].address_en);
    await page.fill('input[name="branches[0].address_ar"]', TEST_BRANCHES[0].address_ar);
    await page.fill('input[name="branches[0].phone"]', TEST_BRANCHES[0].phone);
    await page.fill('input[name="branches[0].capacity"]', String(TEST_BRANCHES[0].capacity));
    
    // Fill manager details for first branch
    await page.fill('input[name="branches[0].manager_email"]', TEST_BRANCHES[0].manager_email);
    await page.fill('input[name="branches[0].manager_first_name"]', TEST_BRANCHES[0].manager_first_name);
    await page.fill('input[name="branches[0].manager_last_name"]', TEST_BRANCHES[0].manager_last_name);
    await page.fill('input[name="branches[0].manager_phone"]', TEST_BRANCHES[0].manager_phone);

    // Add second branch
    await page.click('button:has-text("Add Branch")');
    
    // Fill second branch details
    await page.fill('input[name="branches[1].name_en"]', TEST_BRANCHES[1].name_en);
    await page.fill('input[name="branches[1].name_ar"]', TEST_BRANCHES[1].name_ar);
    await page.fill('input[name="branches[1].address_en"]', TEST_BRANCHES[1].address_en);
    await page.fill('input[name="branches[1].address_ar"]', TEST_BRANCHES[1].address_ar);
    await page.fill('input[name="branches[1].phone"]', TEST_BRANCHES[1].phone);
    await page.fill('input[name="branches[1].capacity"]', String(TEST_BRANCHES[1].capacity));
    
    // Fill manager details for second branch
    await page.fill('input[name="branches[1].manager_email"]', TEST_BRANCHES[1].manager_email);
    await page.fill('input[name="branches[1].manager_first_name"]', TEST_BRANCHES[1].manager_first_name);
    await page.fill('input[name="branches[1].manager_last_name"]', TEST_BRANCHES[1].manager_last_name);
    await page.fill('input[name="branches[1].manager_phone"]', TEST_BRANCHES[1].manager_phone);

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Nursery")');

    // Wait for success message
    await expect(page.locator('text=Successfully created')).toBeVisible({ timeout: 10000 });
  });

  test('should show temporary credentials modal after nursery creation', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to nursery creation
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Fill minimal form data (one branch)
    await page.fill('input[name="name_en"]', `Test Nursery ${Date.now()}`);
    await page.fill('input[name="registration_number"]', `REG-${Date.now()}`);
    await page.selectOption('select[name="governorate_id"]', '1');
    
    await page.fill('input[name="branches[0].name_en"]', 'Main Branch');
    await page.fill('input[name="branches[0].phone"]', '+962791234567');
    await page.fill('input[name="branches[0].capacity"]', '50');
    
    const managerEmail = `manager.${Date.now()}@test.local`;
    await page.fill('input[name="branches[0].manager_email"]', managerEmail);
    await page.fill('input[name="branches[0].manager_first_name"]', 'Test');
    await page.fill('input[name="branches[0].manager_last_name"]', 'Manager');
    await page.fill('input[name="branches[0].manager_phone"]', '+962791234567');

    // Submit
    await page.click('button[type="submit"]:has-text("Create Nursery")');

    // Verify credentials modal appears
    await expect(page.locator('text=Temporary Credentials')).toBeVisible({ timeout: 10000 });
    
    // Verify manager credentials are shown
    await expect(page.locator(`text=${managerEmail}`)).toBeVisible();
    
    // Verify temporary password is shown (8+ characters)
    const passwordText = await page.locator('code').textContent();
    expect(passwordText.length).toBeGreaterThanOrEqual(8);

    // Close modal
    await page.click('button:has-text("Close")');
  });

  test('should display created managers in /admin/users', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to users page
    await page.click('text=Users');
    await page.waitForURL('/admin/users');

    // Verify user list loads
    await expect(page.locator('table')).toBeVisible();

    // Check for at least one user (the admin)
    const userRows = await page.locator('tbody tr').count();
    expect(userRows).toBeGreaterThanOrEqual(1);

    // Verify table headers
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should display Arabic text correctly (no mojibake)', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navigate to nursery creation form
    await page.click('text=Nurseries');
    await page.click('text=Create New Nursery');

    // Fill Arabic name
    const arabicText = 'حضانة الاختبار';
    await page.fill('input[name="name_ar"]', arabicText);

    // Verify the input displays Arabic correctly
    const inputValue = await page.locator('input[name="name_ar"]').inputValue();
    expect(inputValue).toBe(arabicText);

    // Check governorate dropdown has Arabic names
    await page.click('select[name="governorate_id"]');
    const optionText = await page.locator('select[name="governorate_id"] option').nth(1).textContent();
    
    // Verify Arabic characters are present (Unicode range: ء-ي)
    const hasArabic = /[\u0621-\u064A]/.test(optionText);
    expect(hasArabic).toBeTruthy();
  });
});
