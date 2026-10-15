import { useMemo, useState } from 'react'
import { HubComparisonCard } from '@/components/rendezvous/HubComparisonCard'
import { MultiOriginBuilder } from '@/components/rendezvous/MultiOriginBuilder'
import { OptimizationModeTabs } from '@/components/rendezvous/OptimizationModeTabs'
import { Button } from '@/components/ui/button'
import { MOCK_HUBS } from '@/lib/mock-data'
import type { OptimizationMode, RendezvousOrigin } from '@/types/skyroute.types'

export function RendezvousPage() {
  const [origins, setOrigins] = useState<RendezvousOrigin[]>([
    { airport: 'DXB', travelers: 2 },
    { airport: 'LHR', travelers: 1 },
    { airport: 'JFK', travelers: 1 },
  ])
  const [mode, setMode] = useState<OptimizationMode>('min_total')
  const [ran, setRan] = useState(false)

  const hubs = useMemo(() => {
    const copy = [...MOCK_HUBS]
    if (mode === 'fair_split') copy.sort((a, b) => a.variance - b.variance)
    else if (mode === 'duration_balance') copy.sort((a, b) => a.avgDurationMinutes - b.avgDurationMinutes)
    else copy.sort((a, b) => a.totalCost - b.totalCost)
    return copy
  }, [mode])

  return (
    <section className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-8 max-w-xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
          Group Rendezvous™
        </h1>
        <p className="mt-2 text-muted-foreground">
          Up to 10 origins. Rank hubs by total spend, fair split, or flight time.
        </p>
      </div>

      <div className="space-y-6">
        <MultiOriginBuilder origins={origins} onChange={setOrigins} />
        <OptimizationModeTabs value={mode} onChange={setMode} />
        <Button type="button" onClick={() => setRan(true)}>
          Find mutual hubs
        </Button>
      </div>

      {ran && (
        <div className="mt-10">
          {hubs.map((hub, i) => (
            <HubComparisonCard key={hub.hub} hub={hub} rank={i + 1} />
          ))}
        </div>
      )}
    </section>
  )
}
