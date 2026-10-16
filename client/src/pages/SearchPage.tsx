import { useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowRightLeft, Search } from 'lucide-react'
import hero from '@/assets/hero.jpg'
import { findFlightData } from '@/api/mutations/findFlightData'
import { AirlineFilter } from '@/components/search/AirlineFilter'
import { AirportCombobox } from '@/components/search/AirportCombobox'
import { BaggageControlBar } from '@/components/search/BaggageControlBar'
import { CabinClassFilter } from '@/components/search/CabinClassFilter'
import { FlightOfferCard } from '@/components/search/FlightOfferCard'
import { PassengerFilter } from '@/components/search/PassengerFilter'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { formatDateLabel } from '@/lib/utils'
import type { AirlineOption, CabinClass, FlightSearchRequest, FlightSearchResponse } from '@/types/skyroute.types'

const PAGE_SIZE = 10

// ponytail: local calendar day only; fine for UX min-date
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const defaults: FlightSearchRequest = {
  origin: 'DXB',
  destination: 'LHR',
  departureDate: '2026-11-12',
  returnDate: '2026-11-15',
  adults: 1,
  children: 0,
  infants: 0,
  bags: [],
  cabinClass: 'economy',
  page: 0,
  size: PAGE_SIZE,
}

export function SearchPage() {
  const today = todayIso()
  const [params, setParams] = useState<FlightSearchRequest>(defaults)
  const [offers, setOffers] = useState<FlightSearchResponse[]>([])
  const [airlines, setAirlines] = useState<AirlineOption[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(request: FlightSearchRequest) {
    setLoading(true)
    setError(null)
    try {
      const data = await findFlightData({
        ...request,
        page: request.page ?? 0,
        size: request.size ?? PAGE_SIZE,
      })
      setOffers(data.content ?? [])
      setAirlines(data.airlines)
      setPage(data.page ?? 0)
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
      setSearched(true)
    } catch {
      setError('Search failed')
      setOffers([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  function goToPage(nextPage: number) {
    const next = { ...params, page: nextPage, size: PAGE_SIZE }
    setParams(next)
    void runSearch(next)
  }

  return (
    <>
      {!searched ? (
        <section className="relative min-h-[calc(100dvh-4.25rem)] overflow-hidden">
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover hero-pan" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,22,40,0.35)_0%,rgba(8,22,40,0.55)_45%,rgba(243,246,249,0.92)_78%,var(--background)_100%)]" />

          <div className="relative mx-auto flex min-h-[calc(100dvh-4.25rem)] max-w-5xl flex-col justify-end px-5 pb-16 pt-24 md:px-8">
            <div className="hero-rise mb-8 max-w-xl">
              <h1 className="font-[family-name:var(--font-display)] text-6xl font-bold tracking-tight text-white md:text-7xl">
                SkyRoute
              </h1>
              <p className="mt-3 max-w-md text-base text-white/85 md:text-lg">
                Fare intelligence that prices the bags you actually fly with.
              </p>
            </div>

            <form
              className="hero-rise command-bar grid gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur md:grid-cols-[1fr_auto_1fr_auto_auto] md:items-end"
              style={{ animationDelay: '120ms' }}
              onSubmit={(e) => {
                e.preventDefault()
                const next = { ...params, airline: null, page: 0, size: PAGE_SIZE }
                setParams(next)
                void runSearch(next)
              }}
            >
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
                className="mb-0.5 hidden md:inline-flex"
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
              <div className="grid grid-cols-2 gap-2">
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
                          p.returnDate && departureDate > p.returnDate
                            ? departureDate
                            : p.returnDate,
                      }))
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Return
                  </Label>
                  <DatePicker
                    value={params.returnDate ?? ''}
                    min={params.departureDate > today ? params.departureDate : today}
                    onChange={(returnDate) => setParams((p) => ({ ...p, returnDate }))}
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="h-9" disabled={loading}>
                <Search data-icon="inline-start" />
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </form>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
          <div className="mb-6">
            <Button
              type="button"
              variant="link"
              className="mb-2 h-auto px-0"
              onClick={() => setSearched(false)}
            >
              ← Edit search
            </Button>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
              {params.origin} → {params.destination}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateLabel(params.departureDate)}
              {params.returnDate ? ` · ${formatDateLabel(params.returnDate)}` : ''} ·{' '}
              {(params.adults ?? 1) + (params.children ?? 0) + (params.infants ?? 0)} passenger
              {(params.adults ?? 1) + (params.children ?? 0) + (params.infants ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <PassengerFilter
              adults={params.adults ?? 1}
              children={params.children ?? 0}
              infants={params.infants ?? 0}
              onChange={(pax) => {
                const next = { ...params, ...pax, page: 0, size: PAGE_SIZE }
                setParams(next)
                void runSearch(next)
              }}
            />
            <BaggageControlBar
              bags={params.bags ?? []}
              onChange={(bags) => {
                const next = { ...params, bags, page: 0, size: PAGE_SIZE }
                setParams(next)
                void runSearch(next)
              }}
            />
            <CabinClassFilter
              value={params.cabinClass ?? 'economy'}
              onChange={(cabinClass: CabinClass) => {
                const next = { ...params, cabinClass, page: 0, size: PAGE_SIZE }
                setParams(next)
                void runSearch(next)
              }}
            />
            <AirlineFilter
              airlines={airlines}
              value={params.airline ?? null}
              onChange={(airline) => {
                const next = { ...params, airline, page: 0, size: PAGE_SIZE }
                setParams(next)
                void runSearch(next)
              }}
            />
          </div>

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {loading && <p className="mb-4 text-sm text-muted-foreground">Updating…</p>}

          <div>
            {!loading && offers.length === 0 && (
              <p className="text-sm text-muted-foreground">No offers found.</p>
            )}
            {offers.map((offer, i) => (
              <FlightOfferCard key={offer.offerId ?? i} offer={offer} index={i} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
                {totalElements > 0 ? ` · ${totalElements} offers` : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page <= 0}
                  onClick={() => goToPage(page - 1)}
                >
                  <ArrowLeft data-icon="inline-start" />
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page >= totalPages - 1}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  )
}
