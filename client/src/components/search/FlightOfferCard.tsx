import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { dayOffset, formatDuration, formatIsoDuration, formatTime, minutesBetween } from '@/lib/utils'
import { useCurrency } from '@/components/common/CurrencyDropdown'
import type { FlightSearchResponse } from '@/types/skyroute.types'

type Props = {
  offer: FlightSearchResponse
  index: number
}

export function FlightOfferCard({ offer, index }: Props) {
  const slices = offer.slices ?? []
  const b = offer.breakdown
  const currency = offer.currency
  const { money } = useCurrency()

  return (
    <Card className="offer-enter mb-3" style={{ animationDelay: `${index * 60}ms` }}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {offer.airlineLogoUrl && (
              <img src={offer.airlineLogoUrl} alt="" className="h-5 w-5 object-contain" />
            )}
            <span className="text-sm text-muted-foreground">{offer.airlineName}</span>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
              {money(Number(offer.totalPrice), currency)}
            </div>
            {b && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {[
                  (b.adults ?? 0) > 0 ? `${b.adults} adult${b.adults > 1 ? 's' : ''}` : null,
                  (b.children ?? 0) > 0 ? `${b.children} child${b.children > 1 ? 'ren' : ''}` : null,
                  (b.infants ?? 0) > 0 ? `${b.infants} infant${b.infants > 1 ? 's' : ''}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {slices.map((slice, i) => {
            const segs = slice.segments ?? []
            const stops = Math.max(segs.length - 1, 0)
            const plusDays = dayOffset(slice.departureTime, slice.arrivalTime)
            return (
            <div key={`${slice.originCode}-${slice.destinationCode}-${i}`}>
              {slices.length > 1 && (
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {i === 0 ? 'Outbound' : 'Return'}
                </p>
              )}
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <div className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
                    {formatTime(slice.departureTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">{slice.originCode}</div>
                </div>
                <div className="mb-1 min-w-28 flex-1">
                  <div className="mb-1 text-center text-xs text-muted-foreground">
                    {formatIsoDuration(slice.duration)}
                  </div>
                  <Separator />
                  <div className="mt-1 text-center text-xs text-muted-foreground">
                    {stops === 0
                      ? 'Direct'
                      : `${stops} stop${stops > 1 ? 's' : ''} · ${segs.slice(0, -1).map((s) => s.destinationCode).join(', ')}`}
                  </div>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
                    {formatTime(slice.arrivalTime)}
                    {plusDays > 0 && <sup className="ml-0.5 text-xs text-muted-foreground">+{plusDays}</sup>}
                  </div>
                  <div className="text-sm text-muted-foreground">{slice.destinationCode}</div>
                </div>
              </div>
              {stops > 0 && (
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none">Flight details</summary>
                  <ol className="mt-2 space-y-2 border-l pl-3">
                    {segs.map((s, j) => (
                      <li key={`${s.flightNumber ?? ''}-${j}`}>
                        <div className="text-foreground">
                          {formatTime(s.departureTime)} {s.originCode} → {formatTime(s.arrivalTime)} {s.destinationCode}
                          {dayOffset(s.departureTime, s.arrivalTime) > 0 && ` (+${dayOffset(s.departureTime, s.arrivalTime)})`}
                        </div>
                        <div>
                          {[s.flightNumber, s.operatingCarrier, s.aircraft, s.duration && formatIsoDuration(s.duration)]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                        {j < segs.length - 1 && (
                          <div className="mt-2 italic">
                            Layover in {s.destinationCode} · {formatDuration(minutesBetween(s.arrivalTime, segs[j + 1].departureTime))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
            )
          })}
        </div>

        {b && (
          <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>Fare</span>
              <span>{money(Number(b.fare) || 0, currency)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Taxes</span>
              <span>{money(Number(b.taxes) || 0, currency)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>
                Bags
                {(b.includedBags ?? 0) > 0 || (b.extraBags ?? 0) > 0
                  ? ` (${b.includedBags ?? 0} incl${(b.extraBags ?? 0) > 0 ? ` · ${b.extraBags} extra` : ''})`
                  : ''}
              </span>
              <span>
                {(Number(b.baggageFees) || 0) > 0
                  ? `+${money(Number(b.baggageFees) || 0, currency)}`
                  : 'included'}
              </span>
            </div>
            {b.infantNote && <p className="pt-1 text-[11px] text-muted-foreground/80">{b.infantNote}</p>}
            <div className="flex justify-between gap-4 border-t pt-1 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
              <span>Total</span>
              <span>{money(Number(b.total ?? offer.totalPrice) || 0, currency)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
