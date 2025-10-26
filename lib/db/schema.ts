import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  parentId: uuid('parent_id'),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  clientUpdatedAt: timestamp('client_updated_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1),
})

// Define relations for hierarchical structure
export const notesRelations = relations(notes, ({ one, many }) => ({
  parent: one(notes, {
    fields: [notes.parentId],
    references: [notes.id],
    relationName: 'note_hierarchy',
  }),
  children: many(notes, {
    relationName: 'note_hierarchy',
  }),
}))

// Zod schemas for validation
export const insertNoteSchema = createInsertSchema(notes, {
  title: schema => schema.title.min(1, 'Title is required').max(200, 'Title too long'),
  content: schema => schema.content.max(100000, 'Content too long'),
  parentId: schema => schema.parentId.nullable(),
})

export const selectNoteSchema = createSelectSchema(notes)

export const updateNoteSchema = insertNoteSchema.partial().extend({
  id: z.string().uuid(),
})

// Type exports
export type Note = typeof notes.$inferSelect
export type InsertNote = z.infer<typeof insertNoteSchema>
export type UpdateNote = z.infer<typeof updateNoteSchema>
