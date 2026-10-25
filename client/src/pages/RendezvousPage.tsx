import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { findRendezvous } from '@/api/mutations/findRendezvous'
import { supabase } from '@/api/supabaseClient'
import { useCurrency } from '@/components/common/CurrencyDropdown'
import { HubComparisonCard } from '@/components/rendezvous/HubComparisonCard'
import { MultiOriginBuilder } from '@/components/rendezvous/MultiOriginBuilder'
import { OptimizationModeTabs } from '@/components/rendezvous/OptimizationModeTabs'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { HubOption, OptimizationMode, RendezvousOrigin, RendezvousResponse } from '@/types/skyroute.types'

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function errorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return 'Rendezvous search failed'
  const message = (error.response?.data as { message?: string } | undefined)?.message
  return message || 'Rendezvous search failed'
}

export function RendezvousPage() {
  const { selected } = useCurrency()
  const today = todayIso()
  const [origins, setOrigins] = useState<RendezvousOrigin[]>([
    { airport: 'DXB', travelers: 2 },
    { airport: 'LHR', travelers: 1 },
    { airport: 'JFK', travelers: 1 },
  ])
  const [departureDate, setDepartureDate] = useState(today)
  const [returnDate, setReturnDate] = useState<string | null>(null)
  const [roundTrip, setRoundTrip] = useState(false)
  const [mode, setMode] = useState<OptimizationMode>('min_total')
  const [result, setResult] = useState<RendezvousResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  const hubs = useMemo(() => {
    const copy = [...(result?.hubs ?? [])]
    if (mode === 'fair_split') copy.sort((a, b) => a.variance - b.variance)
    else if (mode === 'duration_balance') copy.sort((a, b) => a.avgDurationMinutes - b.avgDurationMinutes)
    else copy.sort((a, b) => a.totalCost - b.totalCost)
    return copy
  }, [result, mode])

  async function search() {
    setLoading(true)
    setError(null)
    setNeedsLogin(false)
    setResult(null)
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setNeedsLogin(true)
      setLoading(false)
      return
    }
    try {
      setResult(
        await findRendezvous({
          origins,
          departureDate,
          returnDate: roundTrip ? returnDate : null,
          currency: selected,
        }),
      )
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) setNeedsLogin(true)
      else setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

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

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (roundTrip && !returnDate) return
          void search()
        }}
      >
        <MultiOriginBuilder origins={origins} onChange={setOrigins} />
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          className="w-full sm:w-fit"
          value={roundTrip ? 'round' : 'one'}
          onValueChange={(value) => {
            if (value !== 'one' && value !== 'round') return
            const next = value === 'round'
            setRoundTrip(next)
            if (!next) setReturnDate(null)
          }}
          aria-label="Trip type"
        >
          <ToggleGroupItem value="one" className="h-9 flex-1 px-3 text-sm sm:flex-none">
            One-way
          </ToggleGroupItem>
          <ToggleGroupItem value="round" className="h-9 flex-1 px-3 text-sm sm:flex-none">
            Round trip
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Departure</Label>
            <DatePicker
              value={departureDate}
              min={today}
              onChange={(next) => {
                setDepartureDate(next)
                if (returnDate && next > returnDate) setReturnDate(next)
              }}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Return</Label>
            <DatePicker
              disabled={!roundTrip}
              placeholder={roundTrip ? 'Pick a date' : '—'}
              value={roundTrip ? (returnDate ?? '') : ''}
              min={departureDate > today ? departureDate : today}
              onChange={setReturnDate}
            />
          </div>
        </div>
        <OptimizationModeTabs value={mode} onChange={setMode} />
        <Button type="submit" disabled={loading || (roundTrip && !returnDate)}>
          {loading ? 'Searching…' : 'Find mutual hubs'}
        </Button>
      </form>

      {needsLogin && (
        <p className="mt-6 text-sm text-destructive">
          <Link to="/login" className="underline">
            Log in
          </Link>{' '}
          to search rendezvous.
        </p>
      )}
      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
      {loading && <p className="mt-6 text-sm text-muted-foreground">Searching hubs…</p>}

      {result && !loading && (
        <div className="mt-10">
          {hubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mutual hubs for these origins.</p>
          ) : (
            hubs.map((hub: HubOption, i) => (
              <HubComparisonCard key={hub.hub} hub={hub} rank={i + 1} currency={result.currency} />
            ))
          )}
        </div>
      )}
    </section>
  )
}
