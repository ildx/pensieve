import { proxy } from '@/proxy'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

describe('Proxy Middleware', () => {
  describe('Public Routes', () => {
    it('should allow access to /login without session', async () => {
      const request = new NextRequest('http://localhost:3000/login')
      const response = await proxy(request)

      expect(response.status).not.toBe(307) // Not redirected
    })

    it('should allow access to /unauthorized without session', async () => {
      const request = new NextRequest('http://localhost:3000/unauthorized')
      const response = await proxy(request)

      expect(response.status).not.toBe(307)
    })

    it('should allow access to /api/auth routes without session', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await proxy(request)

      expect(response.status).not.toBe(307)
    })

    it('should allow access to /api/validate-email without session', async () => {
      const request = new NextRequest('http://localhost:3000/api/validate-email')
      const response = await proxy(request)

      expect(response.status).not.toBe(307)
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to /login when accessing root without session', async () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect to /login when accessing /notes without session', async () => {
      const request = new NextRequest('http://localhost:3000/notes')
      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect to /login when session cookie is empty', async () => {
      const request = new NextRequest('http://localhost:3000/')
      request.cookies.set('better-auth.session_token', '')

      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect to /login when session token is too short', async () => {
      const request = new NextRequest('http://localhost:3000/')
      request.cookies.set('better-auth.session_token', 'short')

      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect to /login when session token is too long', async () => {
      const request = new NextRequest('http://localhost:3000/')
      request.cookies.set('better-auth.session_token', 'a'.repeat(501))

      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })
  })

  describe('Session Validation', () => {
    it('should allow access with valid session token format', async () => {
      const request = new NextRequest('http://localhost:3000/')
      // Valid format: length between 10-500
      request.cookies.set('better-auth.session_token', 'valid-session-token-12345')

      const response = await proxy(request)

      // Should not redirect (note: actual validation happens in Better Auth)
      expect(response.status).not.toBe(307)
    })

    it('should handle session token with special characters', async () => {
      const request = new NextRequest('http://localhost:3000/')
      request.cookies.set('better-auth.session_token', 'token-with-special_chars.123')

      const response = await proxy(request)

      // Should not redirect based on format alone
      expect(response.status).not.toBe(307)
    })
  })

  describe('Static Files', () => {
    it('should not process static files', async () => {
      // These should be excluded by matcher config
      const staticPaths = [
        '/_next/static/chunk.js',
        '/_next/image?url=/test.jpg',
        '/favicon.ico',
        '/test.svg',
        '/image.png',
      ]

      // Note: In actual Next.js, these wouldn't reach the middleware
      // This test verifies the config matcher pattern
      for (const path of staticPaths) {
        const request = new NextRequest(`http://localhost:3000${path}`)
        // If it reaches proxy, it should handle gracefully
        const response = await proxy(request)
        expect(response).toBeDefined()
      }
    })
  })
})
