import { z } from 'zod'

/**
 * Email validation schema
 * - Must be a valid email format
 * - Max length 254 characters (RFC 5321 standard)
 * - Automatically trims whitespace
 * - Converts to lowercase for consistency
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format')
  .max(254, 'Email address is too long')

/**
 * Request body schema for email validation endpoint
 */
export const validateEmailRequestSchema = z.object({
  email: emailSchema,
})

export type ValidateEmailRequest = z.infer<typeof validateEmailRequestSchema>
