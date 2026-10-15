import { useState } from 'react'
import { Bell, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/utils'

type Alert = {
  id: string
  route: string
  ceiling: number
  dropPct: number
  channel: 'Telegram' | 'Email'
}

const seed: Alert[] = [
  { id: '1', route: 'DXB → LHR', ceiling: 420, dropPct: 30, channel: 'Telegram' },
  { id: '2', route: 'JFK → LIS', ceiling: 310, dropPct: 35, channel: 'Email' },
]

export function AlertsPage() {
  const [alerts, setAlerts] = useState(seed)
  const [route, setRoute] = useState('DXB → CDG')
  const [ceiling, setCeiling] = useState(380)

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <div className="mb-8 max-w-xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
          Sniper™ alerts
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ceiling + statistical drop triggers. Mock CRUD until the Spring API lands.
        </p>
      </div>

      <form
        className="mb-10 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_140px_auto]"
        onSubmit={(e) => {
          e.preventDefault()
          setAlerts((a) => [
            {
              id: String(Date.now()),
              route,
              ceiling,
              dropPct: 30,
              channel: 'Telegram',
            },
            ...a,
          ])
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Route
          </Label>
          <Input value={route} onChange={(e) => setRoute(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Ceiling
          </Label>
          <Input
            type="number"
            value={ceiling}
            onChange={(e) => setCeiling(Number(e.target.value))}
          />
        </div>
        <Button type="submit" className="mt-auto h-9">
          <Bell data-icon="inline-start" />
          Arm
        </Button>
      </form>

      <ul>
        {alerts.map((a, i) => (
          <li key={a.id}>
            {i > 0 && <Separator />}
            <div
              className="offer-enter flex flex-wrap items-center justify-between gap-3 py-4"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <Crosshair size={18} className="mt-1 text-primary" />
                <div>
                  <div className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {a.route}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ≤ {formatMoney(a.ceiling)} or &gt;{a.dropPct}% under 90-day avg · {a.channel}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAlerts((list) => list.filter((x) => x.id !== a.id))}
              >
                Disarm
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
