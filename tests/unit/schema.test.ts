import { describe, it, expect } from 'vitest'
import { insertNoteSchema, updateNoteSchema } from '@/lib/db/schema'

describe('Database Schema Validation', () => {
  describe('insertNoteSchema', () => {
    it('should validate a valid note', () => {
      const validNote = {
        userId: 'user123',
        title: 'Test Note',
        content: 'This is a test note',
        position: 0,
      }

      const result = insertNoteSchema.safeParse(validNote)
      expect(result.success).toBe(true)
    })

    it('should reject note with empty title', () => {
      const invalidNote = {
        userId: 'user123',
        title: '',
        content: 'Content',
      }

      const result = insertNoteSchema.safeParse(invalidNote)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required')
      }
    })

    it('should reject note with title exceeding 200 characters', () => {
      const invalidNote = {
        userId: 'user123',
        title: 'a'.repeat(201),
        content: 'Content',
      }

      const result = insertNoteSchema.safeParse(invalidNote)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title too long')
      }
    })

    it('should reject note with content exceeding 100000 characters', () => {
      const invalidNote = {
        userId: 'user123',
        title: 'Title',
        content: 'a'.repeat(100001),
      }

      const result = insertNoteSchema.safeParse(invalidNote)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Content too long')
      }
    })

    it('should accept note with null parentId', () => {
      const validNote = {
        userId: 'user123',
        title: 'Test Note',
        content: 'Content',
        parentId: null,
      }

      const result = insertNoteSchema.safeParse(validNote)
      expect(result.success).toBe(true)
    })

    it('should accept note with valid parentId UUID', () => {
      const validNote = {
        userId: 'user123',
        title: 'Test Note',
        content: 'Content',
        parentId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = insertNoteSchema.safeParse(validNote)
      expect(result.success).toBe(true)
    })
  })

  describe('updateNoteSchema', () => {
    it('should validate a valid update', () => {
      const validUpdate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Updated Title',
      }

      const result = updateNoteSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should require id field', () => {
      const invalidUpdate = {
        title: 'Updated Title',
      }

      const result = updateNoteSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID format for id', () => {
      const invalidUpdate = {
        id: 'not-a-uuid',
        title: 'Updated Title',
      }

      const result = updateNoteSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })

    it('should allow partial updates', () => {
      const partialUpdate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'New content only',
      }

      const result = updateNoteSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })
})

