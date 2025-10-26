// Global type definitions

export type Note = {
  id: string
  userId: string
  parentId: string | null
  title: string
  content: string
  position: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  clientUpdatedAt: Date
  version: number
}

export type CreateNoteInput = Pick<Note, 'title' | 'content'> & {
  parentId?: string | null
}

export type UpdateNoteInput = Partial<CreateNoteInput> & {
  id: string
}

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error'

export type PendingChange = {
  id: string
  noteId: string
  operation: 'create' | 'update' | 'delete'
  data: Partial<Note>
  timestamp: number
}
