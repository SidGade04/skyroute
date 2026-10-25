import { formatDuration, formatMoney } from '../../lib/utils'
import type { HubOption } from '../../types/skyroute.types'

export function HubComparisonCard({ hub, rank, currency = 'USD' }: { hub: HubOption; rank: number; currency?: string }) {
  return (
    <article className="offer-enter space-y-4 border-b border-[var(--line)] py-5" style={{ animationDelay: `${rank * 60}ms` }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">Hub #{rank}</div>
          <h3 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {hub.hub} <span className="text-[var(--ink-muted)]">{hub.city}</span>
          </h3>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            {formatMoney(hub.totalCost, currency)}
          </div>
          <div className="text-xs text-[var(--ink-muted)]">
            total · average {formatDuration(hub.avgDurationMinutes)}
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {hub.perOrigin.map((row) => (
          <div key={row.origin} className="rounded-sm bg-[var(--wash)] px-3 py-2">
            <div className="font-[family-name:var(--font-display)] font-semibold">{row.origin}</div>
            <div className="text-sm text-[var(--ink-muted)]">
              {formatMoney(row.cost, currency)} · {formatDuration(row.durationMinutes)}
            </div>
            <div className="text-sm text-[var(--ink-muted)]">{formatMoney(row.perPerson, currency)} a person</div>
          </div>
        ))}
      </div>
    </article>
  )
}
