import { NavLink, Outlet } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Search', end: true },
  { to: '/rendezvous', label: 'Rendezvous' },
  { to: '/alerts', label: 'Sniper' },
]

export function Shell() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8">
        <NavLink to="/" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
          SkyRoute
        </NavLink>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'sm' }),
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
