import { useState } from 'react'
import { ArrowRightLeft, Search } from 'lucide-react'
import hero from '@/assets/hero.jpg'
import { AirportCombobox } from '@/components/search/AirportCombobox'
import { BaggageControlBar } from '@/components/search/BaggageControlBar'
import { FlightOfferCard } from '@/components/search/FlightOfferCard'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { MOCK_OFFERS } from '@/lib/mock-data'
import { sortByTrueCost } from '@/lib/truecost-client'
import { formatDateLabel } from '@/lib/utils'
import type { BaggageSelection, SearchParams } from '@/types/skyroute.types'

const defaultBags: BaggageSelection = { personalItem: true, carryOn: 1, checked: 0 }

export function SearchPage() {
  const [params, setParams] = useState<SearchParams>({
    origin: 'DXB',
    destination: 'LHR',
    departureDate: '2026-11-12',
    returnDate: '2026-11-15',
    passengers: 1,
  })
  const [bags, setBags] = useState(defaultBags)
  const [searched, setSearched] = useState(false)

  const offers = sortByTrueCost(
    MOCK_OFFERS.map((o) => ({ ...o, origin: params.origin, destination: params.destination })),
    bags,
  )

  return (
    <>
      {!searched ? (
        <section className="relative min-h-[calc(100dvh-64px)] overflow-hidden">
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover hero-pan" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,22,40,0.35)_0%,rgba(8,22,40,0.55)_45%,rgba(243,246,249,0.92)_78%,var(--background)_100%)]" />

          <div className="relative mx-auto flex min-h-[calc(100dvh-64px)] max-w-5xl flex-col justify-end px-5 pb-16 pt-24 md:px-8">
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
                setSearched(true)
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
                    onChange={(departureDate) =>
                      setParams((p) => ({
                        ...p,
                        departureDate,
                        returnDate: departureDate > p.returnDate ? departureDate : p.returnDate,
                      }))
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Return
                  </Label>
                  <DatePicker
                    value={params.returnDate}
                    min={params.departureDate}
                    onChange={(returnDate) => setParams((p) => ({ ...p, returnDate }))}
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="h-9">
                <Search data-icon="inline-start" />
                Search
              </Button>
            </form>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
          <div className="mb-6">
            <Button type="button" variant="link" className="mb-2 h-auto px-0" onClick={() => setSearched(false)}>
              ← Edit search
            </Button>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
              {params.origin} → {params.destination}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateLabel(params.departureDate)} · {formatDateLabel(params.returnDate)} · {params.passengers} passenger · sorted by TrueCost™
            </p>
          </div>

          <div className="mb-6">
            <BaggageControlBar value={bags} onChange={setBags} />
          </div>

          <div>
            {offers.map((offer, i) => (
              <FlightOfferCard key={offer.id} offer={offer} bags={bags} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
