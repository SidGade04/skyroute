import { Plane } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AirlineOption } from '@/types/skyroute.types'

// Radix Select forbids '' as an item value
const ALL = '__all__'

type Props = {
  airlines: AirlineOption[]
  value: string | null
  onChange: (airline: string | null) => void
}

export function AirlineFilter({ airlines, value, onChange }: Props) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
      <SelectTrigger
        aria-label="Airline"
        className="w-40 gap-1.5 bg-card px-3 py-3 font-[family-name:var(--font-display)] text-xs font-semibold data-[size=default]:h-auto"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={ALL}>
          <Plane className="size-4 text-primary" />
          All airlines
        </SelectItem>
        {airlines.map((a) => (
          <SelectItem key={a.name} value={a.name}>
            {a.logoUrl ? (
              <img src={a.logoUrl} alt="" className="size-4 object-contain" />
            ) : (
              <Plane className="size-4 text-muted-foreground" />
            )}
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
