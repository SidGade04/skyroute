import type { BaggageFees, BaggageSelection, FlightOffer } from '../types/skyroute.types'

export function trueCost(baseFare: number, fees: BaggageFees, bags: BaggageSelection) {
  // ponytail: optimistic client math only; server remains source of truth
  return (
    baseFare +
    (bags.personalItem ? fees.personalItem : 0) +
    bags.carryOn * fees.carryOn +
    bags.checked * fees.checked
  )
}

export function sortByTrueCost(offers: FlightOffer[], bags: BaggageSelection) {
  return [...offers].sort(
    (a, b) => trueCost(a.baseFare, a.baggageFees, bags) - trueCost(b.baseFare, b.baggageFees, bags),
  )
}
