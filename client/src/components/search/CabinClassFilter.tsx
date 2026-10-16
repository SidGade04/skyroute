import { useState } from 'react'
import { Armchair, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CabinClass } from '@/types/skyroute.types'

const OPTIONS: { value: CabinClass; label: string; short: string }[] = [
  { value: 'economy', label: 'Economy', short: 'Eco' },
  { value: 'premium_economy', label: 'Premium Economy', short: 'Prem Eco' },
  { value: 'business', label: 'Business', short: 'Biz' },
  { value: 'first', label: 'First', short: 'First' },
]

type Props = {
  value: CabinClass
  onChange: (cabinClass: CabinClass) => void
}

export function CabinClassFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg border bg-card transition-[max-width] duration-300 ease-out ${
        open ? 'max-w-full' : 'max-w-36'
      }`}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto shrink-0 gap-1.5 px-3 py-3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Collapse cabin class filter' : 'Open cabin class filter'}
      >
        <Armchair size={16} className="text-primary" />
        {!open && (
          <span className="font-[family-name:var(--font-display)] text-xs font-semibold">
            {current.short}
          </span>
        )}
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </Button>

      <div
        className={`flex items-center gap-1 overflow-hidden whitespace-nowrap pr-3 transition-[opacity,max-width] duration-300 ease-out ${
          open ? 'max-w-md opacity-100' : 'max-w-0 opacity-0'
        }`}
      >
        {OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={value === opt.value ? 'default' : 'outline'}
            className="h-7 px-2.5 text-xs"
            onClick={() => onChange(opt.value)}
          >
            {opt.short}
          </Button>
        ))}
      </div>
    </div>
  )
}
