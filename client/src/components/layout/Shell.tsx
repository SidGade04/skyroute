import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { CircleUser } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/api/supabaseClient'
import { CurrencyDropdown, CurrencyProvider } from '@/components/common/CurrencyDropdown'
import { Button } from '@/components/ui/button'

const links = [
  { to: '/', label: 'Search', end: true },
  { to: '/rendezvous', label: 'Rendezvous' },
  { to: '/alerts', label: 'Sniper' },
]

function accountFrom(user: User | null) {
  if (!user?.email) return null
  const meta = user.user_metadata as { avatar_url?: string; picture?: string }
  return { email: user.email, avatarUrl: meta.avatar_url || meta.picture || null }
}

export function Shell() {
  const [account, setAccount] = useState<{ email: string; avatarUrl: string | null } | null>(null)
  const [goodbye, setGoodbye] = useState<null | 'in' | 'out'>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAccount(accountFrom(data.session?.user ?? null)))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(accountFrom(session?.user ?? null))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  function logout() {
    if (goodbye) return
    setGoodbye('in')
    window.setTimeout(async () => {
      await supabase.auth.signOut()
      setGoodbye('out')
      window.setTimeout(() => setGoodbye(null), 320)
    }, 680)
  }

  return (
    <CurrencyProvider>
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-5 md:h-[4.25rem] md:px-8">
          <NavLink
            to="/"
            className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--ink)] md:text-[1.75rem]"
          >
            SkyRoute
          </NavLink>
          <div className="flex items-center gap-1 md:gap-2">
            <nav className="flex items-center gap-0.5 md:gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-2.5 py-2 text-sm font-medium transition-colors md:px-3.5',
                      isActive
                        ? 'bg-[var(--ink)] text-white'
                        : 'text-[var(--ink-muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-1 flex items-center gap-1.5 border-l border-[var(--line)] pl-2 md:ml-2 md:pl-3">
              {account ? (
                <>
                  <span
                    title={account.email}
                    className="grid size-8 place-items-center overflow-hidden rounded-full bg-[var(--wash)] text-[var(--ink)]"
                  >
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="size-full object-cover"
                      />
                    ) : (
                      <CircleUser className="size-5" aria-hidden />
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2.5"
                    disabled={goodbye !== null}
                    onClick={logout}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="px-2.5" asChild>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button size="sm" className="px-2.5" asChild>
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {goodbye && (
        <div
          className={cn(
            'fixed inset-0 z-[80] flex items-center justify-center bg-[var(--paper)]/80 backdrop-blur-sm transition-opacity duration-300',
            goodbye === 'out' ? 'opacity-0' : 'opacity-100',
          )}
        >
          <p className="hero-rise font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Signed out
          </p>
        </div>
      )}

      <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 md:flex-row md:items-start md:justify-between md:px-8 md:py-12">
          <div className="max-w-xs">
            <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
              SkyRoute
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Fare intelligence that prices the bags you actually fly with.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className="text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 text-xs text-white/45 md:px-8">
            <span>© {new Date().getFullYear()} SkyRoute</span>
            <span>Bags priced in. Surprises priced out.</span>
            <CurrencyDropdown />
          </div>
        </div>
      </footer>
    </div>
    </CurrencyProvider>
  )
}
