import { describe, it, expect } from 'vitest'
import { emailSchema, validateEmailRequestSchema } from '@/lib/validators/email'

describe('Email Validators', () => {
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should trim whitespace', () => {
      const result = emailSchema.safeParse('  test@example.com  ')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should convert to lowercase', () => {
      const result = emailSchema.safeParse('Test@Example.COM')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'not-an-email',
        'missing@domain',
        '@nodomain.com',
        'no-at-sign.com',
        'spaces in@email.com',
        '',
      ]

      for (const email of invalidEmails) {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid email')
        }
      }
    })

    it('should reject email exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      const result = emailSchema.safeParse(longEmail)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('too long')
      }
    })

    it('should accept email at max length (254 chars)', () => {
      // Create a valid email that's exactly 254 chars
      const localPart = 'a'.repeat(240)
      const email = `${localPart}@example.com` // 240 + 1 + 11 + 1 + 3 = 254
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(true)
    })

    it('should accept various valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.com',
        'user-name@example.com',
        'user123@example.com',
        'user@subdomain.example.com',
        'user@example.co.uk',
        '123@example.com',
      ]

      for (const email of validEmails) {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(true)
      }
    })

    it('should reject non-string input', () => {
      const result = emailSchema.safeParse(123)
      expect(result.success).toBe(false)
    })

    it('should reject null/undefined', () => {
      const result1 = emailSchema.safeParse(null)
      const result2 = emailSchema.safeParse(undefined)
      expect(result1.success).toBe(false)
      expect(result2.success).toBe(false)
    })
  })

  describe('validateEmailRequestSchema', () => {
    it('should validate request body with email', () => {
      const result = validateEmailRequestSchema.safeParse({
        email: 'test@example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('should reject request body without email', () => {
      const result = validateEmailRequestSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject request body with invalid email', () => {
      const result = validateEmailRequestSchema.safeParse({
        email: 'invalid-email',
      })
      expect(result.success).toBe(false)
    })

    it('should apply email transformations', () => {
      const result = validateEmailRequestSchema.safeParse({
        email: '  Test@Example.COM  ',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })
  })
})

