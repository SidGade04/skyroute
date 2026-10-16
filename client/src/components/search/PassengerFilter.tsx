import { useState } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type PassengerCounts = {
  adults: number
  children: number
  infants: number
}

type Props = {
  adults: number
  children: number
  infants: number
  onChange: (next: PassengerCounts) => void
}

function n(v: number | undefined | null) {
  return Number.isFinite(Number(v)) ? Number(v) : 0
}

export function PassengerFilter({ adults, children, infants, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const a = Math.max(1, n(adults))
  const c = n(children)
  const i = Math.min(n(infants), a)
  const total = a + c + i

  function setAdults(next: number) {
    const nextAdults = Math.max(1, Math.min(9, next))
    onChange({
      adults: nextAdults,
      children: c,
      infants: Math.min(i, nextAdults),
    })
  }

  function setChildren(next: number) {
    onChange({ adults: a, children: Math.max(0, Math.min(8, next)), infants: i })
  }

  function setInfants(next: number) {
    onChange({ adults: a, children: c, infants: Math.max(0, Math.min(a, next)) })
  }

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg border bg-card transition-[max-width] duration-300 ease-out ${
        open ? 'max-w-full' : 'max-w-28'
      }`}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto shrink-0 gap-1.5 px-3 py-3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Collapse passenger filter' : 'Open passenger filter'}
      >
        <Users size={16} className="text-primary" />
        {!open && (
          <span className="font-[family-name:var(--font-display)] text-xs font-semibold tabular-nums">
            {total}
          </span>
        )}
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </Button>

      <div
        className={`flex items-center gap-x-6 overflow-hidden whitespace-nowrap pr-4 transition-[opacity,max-width] duration-300 ease-out ${
          open ? 'max-w-2xl opacity-100' : 'max-w-0 opacity-0'
        }`}
      >
        <Stepper label="Adults" count={a} onDec={() => setAdults(a - 1)} onInc={() => setAdults(a + 1)} />
        <Stepper label="Children" count={c} onDec={() => setChildren(c - 1)} onInc={() => setChildren(c + 1)} />
        <Stepper label="Infants" count={i} onDec={() => setInfants(i - 1)} onInc={() => setInfants(i + 1)} />
      </div>
    </div>
  )
}

function Stepper({
  label,
  count,
  onDec,
  onInc,
}: {
  label: string
  count: number
  onDec: () => void
  onInc: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon-xs" onClick={onDec} aria-label={`Decrease ${label}`}>
          −
        </Button>
        <span className="w-6 text-center font-[family-name:var(--font-display)] text-sm font-semibold">
          {count}
        </span>
        <Button type="button" variant="outline" size="icon-xs" onClick={onInc} aria-label={`Increase ${label}`}>
          +
        </Button>
      </div>
    </div>
  )
}
