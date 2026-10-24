import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { syncUser } from '@/api/mutations/syncUser'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const oauthError = new URLSearchParams(window.location.search).get('error_description')

    async function run() {
      if (oauthError) {
        setError(oauthError)
        return
      }
      // ponytail: poll until detectSessionInUrl exchanges ?code=; calling getSession inside onAuthStateChange deadlocks
      for (let i = 0; i < 20 && !cancelled; i++) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          try {
            await syncUser()
            if (!cancelled) navigate('/', { replace: true })
          } catch (e) {
            if (!cancelled) setError(e instanceof Error ? e.message : 'Could not sync account')
          }
          return
        }
        await new Promise((r) => setTimeout(r, 200))
      }
      if (!cancelled) setError('Sign-in did not complete')
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
        {error ? 'Sign-in failed' : 'Signing you in'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{error ?? 'Finishing Google sign-in…'}</p>
      {error && (
        <Link to="/login" className="mt-6 text-sm font-medium underline-offset-4 hover:underline">
          Back to log in
        </Link>
      )}
    </section>
  )
}
