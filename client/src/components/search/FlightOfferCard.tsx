import { Crosshair } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { trueCost } from '@/lib/truecost-client'
import { formatDuration, formatMoney, formatTime } from '@/lib/utils'
import type { BaggageSelection, FlightOffer } from '@/types/skyroute.types'
import { IntentionalStopoverTag } from './IntentionalStopoverTag'

type Props = {
  offer: FlightOffer
  bags: BaggageSelection
  index: number
}

export function FlightOfferCard({ offer, bags, index }: Props) {
  const total = trueCost(offer.baseFare, offer.baggageFees, bags)
  const bagDelta = total - offer.baseFare

  return (
    <article
      className="offer-enter grid gap-4 border-b py-5 md:grid-cols-[1fr_auto] md:items-center"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide">
            {offer.airlineCode}
          </span>
          <span className="text-sm text-muted-foreground">{offer.airline}</span>
          {offer.mistakeFare && (
            <Badge variant="outline">
              <Crosshair />
              Sniper™ mistake fare
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
              {formatTime(offer.departAt)}
            </div>
            <div className="text-sm text-muted-foreground">{offer.origin}</div>
          </div>
          <div className="mb-1 min-w-28 flex-1">
            <div className="mb-1 text-center text-xs text-muted-foreground">
              {formatDuration(offer.durationMinutes)} · {offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop`}
            </div>
            <Separator />
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
              {formatTime(offer.arriveAt)}
            </div>
            <div className="text-sm text-muted-foreground">{offer.destination}</div>
          </div>
        </div>

        {offer.stopover && <IntentionalStopoverTag stopover={offer.stopover} />}
      </div>

      <div className="text-left md:text-right">
        <div className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          {formatMoney(total, offer.currency)}
        </div>
        <div className="text-xs text-muted-foreground">
          TrueCost™
          {bagDelta > 0 ? ` · +${formatMoney(bagDelta)} bags` : ' · bags included'}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground/70">
          Base {formatMoney(offer.baseFare, offer.currency)}
        </div>
      </div>
    </article>
  )
}
