import { POST } from '@/app/api/validate-email/route'
import { beforeEach, describe, expect, it } from 'vitest'

// Note: Tests run in development mode by default, so they use the ALLOWED_EMAILS env var
// which is set in tests/setup.ts

describe('Validate Email API', () => {
  describe('Input Validation', () => {
    it('should reject missing email', async () => {
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.message).toBe('Invalid email')
    })

    it('should reject invalid email format', async () => {
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.message).toBe('Invalid email')
    })

    it('should reject email exceeding 254 characters', async () => {
      const longEmail = `${'a'.repeat(250)}@test.com`
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: longEmail }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.message).toBe('Invalid email')
    })

    it('should reject non-string email', async () => {
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 123 }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in response', async () => {
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Cache-Control')).toContain('no-store')
    })
  })

  describe('Email Validation Logic', () => {
    it('should accept allowed email from env', async () => {
      // test@example.com is in ALLOWED_EMAILS (set in setup.ts)
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.ok).toBe(true)
    })

    it('should reject email not in allowed list', async () => {
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notallowed@example.com' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.message).toBe('Invalid credentials')
    })

    it('should accept valid email format', async () => {
      const validEmails = [
        'test@example.com', // This one is allowed
        'allowed@example.com', // This one too
      ]

      for (const email of validEmails) {
        const request = new Request('http://localhost:3000/api/validate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const response = await POST(request)
        // Should return 200 for allowed emails
        expect(response.status).toBe(200)
      }
    })

    it('should handle case-insensitive email comparison', async () => {
      const request1 = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'Test@Example.COM' }),
      })

      const request2 = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response1 = await POST(request1)
      const response2 = await POST(request2)

      // Both should have same result (case-insensitive) - both should be 200 since test@example.com is allowed
      expect(response1.status).toBe(response2.status)
      expect(response1.status).toBe(200)
    })
  })

  describe('Error Responses', () => {
    it('should return generic error message for unauthorized email', async () => {
      const request = new Request('http://localhost:3000/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'unauthorized@example.com' }),
      })

      const response = await POST(request)

      if (response.status === 403) {
        const data = await response.json()
        expect(data.message).toBe('Invalid credentials')
      }
    })
  })
})
