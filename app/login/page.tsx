'use client'

import { passkey, passkeySignIn, signUp } from '@/lib/auth-client'
import { emailSchema } from '@/lib/validators/email'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'passkey'>('email')

  // Check for error in URL parameters
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError('Access denied: Your email is not authorized to access this application.')
    }
  }, [searchParams])

  // no live validation – we validate on submit only

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate email using Zod schema
    const validationResult = emailSchema.safeParse(email)

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message || 'Please enter a valid email address'
      setError(errorMessage)
      setIsLoading(false)
      return
    }

    // Email is now validated, trimmed, and lowercased by Zod
    const validatedEmail = validationResult.data

    // Server-side validation against allowlist
    try {
      const res = await fetch('/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: validatedEmail }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.message || 'Email not allowed')
        setIsLoading(false)
        return
      }
      // Store validated email for passkey step
      setEmail(validatedEmail)
    } catch (err) {
      // If the validation API fails, fall back to DB trigger later – but surface a generic error now
      console.error('Validation error:', err)
      setError('Validation failed, please try again.')
      setIsLoading(false)
      return
    }

    setStep('passkey')
    setIsLoading(false)
  }

  const handlePasskeyAuth = async () => {
    // Cooldown guard to avoid hammering auth/DB on rapid retries
    if (cooldownUntil && Date.now() < cooldownUntil) return
    setIsLoading(true)
    setError(null)

    // Helper to guard against indefinite hangs in production
    const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
      return await Promise.race<Promise<T>>([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timeout`)), ms)),
      ])
    }

    try {
      // Try creating/ensuring the account first; if it already exists, we'll sign in
      try {
        const signupPromise = signUp.email({
          email,
          password: crypto.randomUUID(),
          name: email.split('@')[0],
        })
        const timeout = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Sign-up timeout')), 3500)
        )
        const result: unknown = await Promise.race([signupPromise, timeout])
        if (result && typeof result === 'object' && 'error' in result) {
          const msg = (result as { error?: { message?: string } }).error?.message
          if (msg && !msg.includes('already exists')) {
            throw new Error(msg)
          }
        }
      } catch (e) {
        // If signup failed due to timeout or unexpected error, try sign-in path
      }

      // If user existed or after creating the account, add/register a passkey
      try {
        const reg = await withTimeout(
          passkey.addPasskey({
            authenticatorAttachment: 'platform',
            useAutoRegister: false,
          }),
          15000,
          'Passkey registration'
        )
        if (reg?.error) throw new Error(reg.error.message || 'Failed to register passkey')
        // Success: navigate immediately
        window.location.href = '/'
        return
      } catch (_) {
        // If adding a passkey requires an existing session (returning user), try passkey sign-in
        await withTimeout(passkeySignIn(), 12000, 'Passkey sign-in')
        // Success: navigate immediately
        window.location.href = '/'
        return
      }
    } catch (err: unknown) {
      console.error('Passkey auth error:', err)
      const error = err as Error
      if (error.message?.includes('Unauthorized')) {
        setError('Access denied: Your email is not authorized to access this application.')
      } else if (
        error.message?.includes('User cancelled') ||
        error.message?.includes('NotAllowedError')
      ) {
        setError('Passkey authentication was cancelled.')
      } else {
        setError(error.message || 'Failed to authenticate. Please try again.')
        setCooldownUntil(Date.now() + 5000)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Pensieve</h1>
            <p className="text-gray-600 dark:text-gray-400">Your personal note-taking sanctuary</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  disabled={isLoading}
                />
                {/* no live validation hints */}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Signing in as</p>
                <p className="font-medium text-gray-900 dark:text-white">{email}</p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setError(null)
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  Change email
                </button>
              </div>

              <button
                type="button"
                onClick={handlePasskeyAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      role="img"
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-label="Loading"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <svg
                      role="img"
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Passkey icon"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    <span>Continue with Passkey</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                {isLoading
                  ? 'Setting up your passkey...'
                  : "Use your device's biometric or PIN to authenticate"}
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Access is restricted to authorized users only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}
    >
      <LoginPageInner />
    </Suspense>
  )
}
