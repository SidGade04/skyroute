import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { CircleUser } from 'lucide-react'
import { api } from '@/api/client'
import { supabase } from '@/api/supabaseClient'
import { syncUser, updateUser, type UserProfile } from '@/api/mutations/syncUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { DIAL_CODES } from '@/types/dialCodes.types'

function displayName(profile: UserProfile) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  return name || profile.email.split('@')[0]
}

function splitPhone(stored: string | null) {
  const raw = (stored ?? '').replace(/\s/g, '')
  const match = DIAL_CODES.filter(([, , code]) => raw.startsWith(code)).sort(
    (a, b) => b[2].length - a[2].length,
  )[0]
  if (!match) return { country: 'AE', national: '' }
  return { country: match[0], national: raw.slice(match[2].length) }
}

function memberSince(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('AE')
  const [phone, setPhone] = useState('')
  const dial = DIAL_CODES.find(([iso]) => iso === country)?.[2] ?? '+971'
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'signed-out' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  function show(next: UserProfile) {
    setProfile(next)
    const parts = splitPhone(next.phone)
    setEmail(next.email)
    setCountry(parts.country)
    setPhone(parts.national)
  }

  useEffect(() => {
    let alive = true
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return
      alive = false
      setProfile(null)
      setState('signed-out')
    })
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!alive) return
      if (!sessionData.session) {
        setState('signed-out')
        return
      }
      try {
        let next: UserProfile
        try {
          next = (await api.get<UserProfile>('/api/v1/users/me')).data
        } catch (e) {
          if (!axios.isAxiosError(e) || e.response?.status !== 404) throw e
          next = await syncUser()
        }
        if (!alive) return
        show(next)
        setState('ready')
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'Could not load profile')
        setState('error')
      }
    })()
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (state === 'signed-out') {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-lg flex-col justify-center px-5 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          Your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to see your profile.</p>
        <Button className="mt-6 w-fit" asChild>
          <Link to="/login">Log in</Link>
        </Button>
      </section>
    )
  }

  if (state === 'error' || (state === 'ready' && !profile)) {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-lg flex-col justify-center px-5 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          Profile unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? 'Could not load profile'}</p>
      </section>
    )
  }

  const name = profile ? displayName(profile) : ''
  const google = profile?.provider?.toLowerCase() === 'google'

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    const nextEmail = email.trim()
    setSaving(true)
    setNote(null)
    setSaveError(null)
    try {
      let notice = 'Saved'
      if (!google && nextEmail !== profile.email) {
        const { data, error: authError } = await supabase.auth.updateUser({ email: nextEmail })
        if (authError) throw new Error(authError.message)
        if (data.user?.email !== nextEmail) notice = 'Saved. Confirm the new email from your inbox.'
      }
      const national = phone.trim()
      show(
        await updateUser({
          email: google ? null : nextEmail,
          phone: national ? `${dial} ${national}` : null,
        }),
      )
      setNote(notice)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const provider = profile?.provider
    ? profile.provider[0].toUpperCase() + profile.provider.slice(1)
    : '—'

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <div className="hero-sky relative overflow-hidden rounded-2xl px-6 py-10 md:px-10 md:py-12">
        <div className="hero-rise flex flex-col items-start gap-6 sm:flex-row sm:items-end">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-white/15 text-white ring-2 ring-white/40">
            {state === 'loading' ? null : profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            ) : (
              <CircleUser className="size-12" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">Account</p>
            <h1 className="mt-1 truncate font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {state === 'loading' ? '…' : name}
            </h1>
            <p className="mt-1 truncate text-sm text-white/75">{profile?.email ?? 'Loading your profile'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="hero-rise mt-6 overflow-hidden rounded-xl border bg-card" style={{ animationDelay: '80ms' }}>
          <div className="grid gap-5 px-6 py-5">
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 border-zinc-200 bg-white shadow-none focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
                disabled={state !== 'ready' || google}
                required
              />
              {google && <p className="text-xs text-zinc-500">Managed by Google</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-zinc-700">
                Phone
              </Label>
              <div className="flex h-9 overflow-hidden rounded-lg border border-zinc-200 bg-white focus-within:border-zinc-400 focus-within:ring-3 focus-within:ring-zinc-200">
                <Select value={country} onValueChange={setCountry} disabled={state !== 'ready'}>
                  <SelectTrigger
                    aria-label="Country code"
                    className="h-9 w-[4.75rem] shrink-0 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  >
                    {dial}
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {DIAL_CODES.map(([iso, countryName, code]) => (
                      <SelectItem key={iso} value={iso}>
                        {countryName} {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-px self-stretch bg-zinc-200" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="50 123 4567"
                  pattern="[0-9 ]{4,16}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  disabled={state !== 'ready'}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={saveError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'} role="status">
              {saveError ?? note ?? ''}
            </p>
            <Button type="submit" disabled={state !== 'ready' || saving} className="h-9 px-4 sm:ml-auto">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {[
          ['Sign-in', provider],
          ['Member since', profile ? memberSince(profile.createdAt) : '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-4">
            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
            <dd className="mt-1.5 truncate text-sm font-medium text-[var(--ink)]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
