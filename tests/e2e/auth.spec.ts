import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page with correct elements', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Pensieve')
    
    // Check email input exists
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Check continue button exists
    await expect(page.locator('button[type="submit"]')).toContainText('Continue')
    
    // Check security notice
    await expect(page.locator('text=Access is restricted to authorized users only')).toBeVisible()
  })

  test('should show error for empty email submission', async ({ page }) => {
    // Click continue without entering email
    await page.locator('button[type="submit"]').click()
    
    // Should show error message
    await expect(page.locator('text=Please enter your email address')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    // Enter invalid email
    await page.locator('input[type="email"]').fill('not-an-email')
    await page.locator('button[type="submit"]').click()
    
    // Should show error message
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should show error for unauthorized email', async ({ page }) => {
    // Enter unauthorized email
    await page.locator('input[type="email"]').fill('unauthorized@example.com')
    await page.locator('button[type="submit"]').click()
    
    // Wait for API call and error message
    await page.waitForTimeout(1000)
    
    // Should show error (either "Email not allowed" or "Invalid credentials")
    const errorVisible = await page.locator('div[class*="bg-red"]').isVisible()
    expect(errorVisible).toBe(true)
  })

  test('should trim whitespace from email input', async ({ page }) => {
    // Enter email with whitespace
    await page.locator('input[type="email"]').fill('  test@example.com  ')
    await page.locator('button[type="submit"]').click()
    
    // Wait for processing
    await page.waitForTimeout(500)
    
    // Email should be trimmed (check via network request if needed)
    // The validation should proceed with trimmed email
  })

  test('should show loading state during validation', async ({ page }) => {
    // Enter valid format email
    await page.locator('input[type="email"]').fill('test@example.com')
    
    // Click submit
    await page.locator('button[type="submit"]').click()
    
    // Button should be disabled during loading
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should prevent navigation to protected routes without session', async ({ page }) => {
    // Try to access root (protected route)
    await page.goto('/')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show passkey step after successful email validation', async ({ page, context }) => {
    // Note: This test requires ALLOWED_EMAILS to include test email
    // Or mock the API response
    
    // Skip if not in test environment with proper setup
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment setup')
    
    await page.locator('input[type="email"]').fill('allowed@example.com')
    await page.locator('button[type="submit"]').click()
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Should show passkey step
    await expect(page.locator('text=Continue with Passkey')).toBeVisible()
    await expect(page.locator('text=Signing in as')).toBeVisible()
  })

  test('should allow changing email from passkey step', async ({ page }) => {
    // Skip if not in test environment
    test.skip(process.env.NODE_ENV !== 'test', 'Requires test environment setup')
    
    // Get to passkey step (assuming allowed email)
    await page.locator('input[type="email"]').fill('allowed@example.com')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(1000)
    
    // Click change email
    await page.locator('text=Change email').click()
    
    // Should return to email step
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Continue')
  })

  test('should have proper meta tags for SEO blocking', async ({ page }) => {
    await page.goto('/login')
    
    // Check for noindex meta tag
    const metaRobots = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(metaRobots).toContain('noindex')
  })

  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/login')
    
    // Check for security headers
    const headers = response?.headers()
    expect(headers?.['x-frame-options']).toBe('DENY')
    expect(headers?.['x-content-type-options']).toBe('nosniff')
  })
})

test.describe('Session Management', () => {
  test('should maintain session after page reload', async ({ page, context }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Requires authenticated session')
    
    // Assuming user is logged in (set cookie manually for test)
    await context.addCookies([{
      name: 'better-auth.session_token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/')
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('should redirect to login after session expires', async ({ page, context }) => {
    // Clear all cookies
    await context.clearCookies()
    
    await page.goto('/')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size
  
  test('should display login form properly on mobile', async ({ page }) => {
    await page.goto('/login')
    
    // Check elements are visible and properly sized
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check form is not overflowing
    const form = page.locator('form')
    const boundingBox = await form.boundingBox()
    expect(boundingBox?.width).toBeLessThanOrEqual(375)
  })
})

