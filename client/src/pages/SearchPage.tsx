import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRightLeft, Search } from 'lucide-react'
import hero from '@/assets/hero.jpg'
import { AirportCombobox } from '@/components/search/AirportCombobox'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { FlightSearchRequest } from '@/types/skyroute.types'

const PAGE_SIZE = 10

// ponytail: local calendar day only; fine for UX min-date
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const defaults: FlightSearchRequest = {
  origin: 'DXB',
  destination: 'LHR',
  departureDate: todayIso(),
  returnDate: null,
  adults: 1,
  children: 0,
  infants: 0,
  bags: [],
  cabinClass: 'economy',
  page: 0,
  size: PAGE_SIZE,
}

export function SearchPage() {
  const navigate = useNavigate()
  const incoming = useLocation().state as FlightSearchRequest | null
  const today = todayIso()
  const [params, setParams] = useState<FlightSearchRequest>(() =>
    incoming?.origin ? { ...defaults, ...incoming } : defaults,
  )
  const [roundTrip, setRoundTrip] = useState(() => Boolean(incoming?.returnDate))

  return (
    <section className="relative min-h-[calc(100dvh-4.25rem)] overflow-hidden">
      <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover hero-pan" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,22,40,0.35)_0%,rgba(8,22,40,0.55)_45%,rgba(243,246,249,0.92)_78%,var(--background)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.55)_55%,var(--background)_100%)]" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4.25rem)] max-w-6xl flex-col justify-end px-5 pb-16 pt-24 md:px-8">
        <div className="hero-rise mb-8 max-w-xl">
          <h1 className="font-[family-name:var(--font-display)] text-6xl font-bold tracking-tight text-white md:text-7xl">
            SkyRoute
          </h1>
          <p className="mt-3 max-w-md text-base text-white/85 md:text-lg">
            Fare intelligence that prices the bags you actually fly with.
          </p>
        </div>

        <form
          className="hero-rise command-bar flex flex-col gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur"
          style={{ animationDelay: '120ms' }}
          onSubmit={(e) => {
            e.preventDefault()
            if (roundTrip && !params.returnDate) return
            navigate('/search-results', {
              state: {
                ...params,
                returnDate: roundTrip ? params.returnDate : null,
                airline: null,
                page: 0,
                size: PAGE_SIZE,
              },
            })
          }}
        >
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
              if (!next) setParams((p) => ({ ...p, returnDate: null }))
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <AirportCombobox
              label="From"
              value={params.origin}
              exclude={params.destination}
              onChange={(origin) => setParams((p) => ({ ...p, origin }))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden size-9 lg:inline-flex"
              onClick={() =>
                setParams((p) => ({ ...p, origin: p.destination, destination: p.origin }))
              }
              aria-label="Swap airports"
            >
              <ArrowRightLeft />
            </Button>
            <AirportCombobox
              label="To"
              value={params.destination}
              exclude={params.origin}
              onChange={(destination) => setParams((p) => ({ ...p, destination }))}
            />
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Departure
              </Label>
              <DatePicker
                value={params.departureDate}
                min={today}
                onChange={(departureDate) =>
                  setParams((p) => ({
                    ...p,
                    departureDate,
                    returnDate:
                      p.returnDate && departureDate > p.returnDate ? departureDate : p.returnDate,
                  }))
                }
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Return
              </Label>
              <DatePicker
                disabled={!roundTrip}
                placeholder={roundTrip ? 'Pick a date' : '—'}
                value={roundTrip ? (params.returnDate ?? '') : ''}
                min={params.departureDate > today ? params.departureDate : today}
                onChange={(returnDate) => setParams((p) => ({ ...p, returnDate }))}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-9 sm:col-span-2 lg:col-span-1"
              disabled={roundTrip && !params.returnDate}
            >
              <Search data-icon="inline-start" />
              Search
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
