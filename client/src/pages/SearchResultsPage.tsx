import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { findFlightData } from '@/api/mutations/findFlightData'
import { AirlineFilter } from '@/components/search/AirlineFilter'
import { BaggageControlBar } from '@/components/search/BaggageControlBar'
import { CabinClassFilter } from '@/components/search/CabinClassFilter'
import { FlightOfferCard } from '@/components/search/FlightOfferCard'
import { PassengerFilter } from '@/components/search/PassengerFilter'
import { Button } from '@/components/ui/button'
import { formatDateLabel } from '@/lib/utils'
import type { AirlineOption, CabinClass, FlightSearchRequest, FlightSearchResponse } from '@/types/skyroute.types'

const PAGE_SIZE = 10

function isSearch(value: unknown): value is FlightSearchRequest {
  return !!value && typeof value === 'object' && 'origin' in value && 'departureDate' in value
}

export function SearchResultsPage() {
  const navigate = useNavigate()
  const initial = useLocation().state
  const request = isSearch(initial) ? initial : null
  const [params, setParams] = useState<FlightSearchRequest | null>(request)
  const [offers, setOffers] = useState<FlightSearchResponse[]>([])
  const [airlines, setAirlines] = useState<AirlineOption[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(!!request)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(next: FlightSearchRequest) {
    setLoading(true)
    setError(null)
    try {
      const data = await findFlightData({
        ...next,
        page: next.page ?? 0,
        size: next.size ?? PAGE_SIZE,
      })
      setOffers(data.content ?? [])
      setAirlines(data.airlines)
      setPage(data.page ?? 0)
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
    } catch {
      setError('Search failed')
      setOffers([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (request) void runSearch(request)
    // ponytail: search once from the navigation state; filters call runSearch directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!params) return <Navigate to="/" replace />

  function goToPage(nextPage: number) {
    const next = { ...params!, page: nextPage, size: PAGE_SIZE }
    setParams(next)
    void runSearch(next)
  }

  const passengers = (params.adults ?? 1) + (params.children ?? 0) + (params.infants ?? 0)

  return (
    <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <div className="mb-6">
        <Button
          type="button"
          variant="link"
          className="mb-2 h-auto px-0"
          onClick={() => navigate('/', { state: params })}
        >
          ← Edit search
        </Button>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          {params.origin} → {params.destination}
        </h1>
        <p className="text-sm text-muted-foreground">
          {params.returnDate ? 'Round trip' : 'One-way'} · {formatDateLabel(params.departureDate)}
          {params.returnDate ? ` · ${formatDateLabel(params.returnDate)}` : ''} · {passengers}{' '}
          passenger{passengers === 1 ? '' : 's'}
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
      {loading && <p className="mb-4 text-sm text-muted-foreground">Searching…</p>}

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
  )
}
