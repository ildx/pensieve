import { describe, it, expect } from 'vitest'
import { getClientIp, sleep } from '@/lib/utils/rateLimit'

describe('Rate Limit Utils', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => {
            if (key === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
            return null
          },
        },
      } as unknown as Request

      const ip = getClientIp(mockRequest)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is missing', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => {
            if (key === 'x-real-ip') return '192.168.1.2'
            return null
          },
        },
      } as unknown as Request

      const ip = getClientIp(mockRequest)
      expect(ip).toBe('192.168.1.2')
    })

    it('should return "unknown" when no IP headers are present', () => {
      const mockRequest = {
        headers: {
          get: () => null,
        },
      } as unknown as Request

      const ip = getClientIp(mockRequest)
      expect(ip).toBe('unknown')
    })

    it('should handle empty x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => {
            if (key === 'x-forwarded-for') return ''
            return null
          },
        },
      } as unknown as Request

      const ip = getClientIp(mockRequest)
      expect(ip).toBe('unknown')
    })
  })

  describe('sleep', () => {
    it('should delay execution for specified milliseconds', async () => {
      const start = Date.now()
      await sleep(100)
      const duration = Date.now() - start
      
      // Allow 20ms tolerance for timing
      expect(duration).toBeGreaterThanOrEqual(100)
      expect(duration).toBeLessThan(150)
    })

    it('should resolve without value', async () => {
      const result = await sleep(10)
      expect(result).toBeUndefined()
    })
  })
})

