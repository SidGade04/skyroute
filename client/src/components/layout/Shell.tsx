import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { supabase } from '@/api/supabaseClient'
import { CurrencyDropdown, CurrencyProvider } from '@/components/common/CurrencyDropdown'
import { Button } from '@/components/ui/button'

const links = [
  { to: '/', label: 'Search', end: true },
  { to: '/rendezvous', label: 'Rendezvous' },
  { to: '/alerts', label: 'Sniper' },
]

export function Shell() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

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
              {email ? (
                <>
                  <span className="hidden max-w-40 truncate text-sm text-[var(--ink-muted)] sm:inline">
                    {email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2.5"
                    onClick={() => supabase.auth.signOut()}
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
