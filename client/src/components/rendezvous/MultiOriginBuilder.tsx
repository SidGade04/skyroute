import { Plus, Trash2 } from 'lucide-react'
import { AirportCombobox } from '@/components/search/AirportCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RendezvousOrigin } from '@/types/skyroute.types'

type Props = {
  origins: RendezvousOrigin[]
  onChange: (next: RendezvousOrigin[]) => void
}

export function MultiOriginBuilder({ origins, onChange }: Props) {
  return (
    <div className="space-y-3">
      {origins.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-3">
          <AirportCombobox
            label={`Origin ${i + 1}`}
            value={row.airport}
            onChange={(airport) =>
              onChange(origins.map((o, j) => (j === i ? { ...o, airport } : o)))
            }
          />
          <div className="flex w-28 flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Travelers
            </Label>
            <Input
              type="number"
              min={1}
              max={9}
              value={row.travelers}
              onChange={(e) =>
                onChange(
                  origins.map((o, j) =>
                    j === i ? { ...o, travelers: Math.max(1, Number(e.target.value) || 1) } : o,
                  ),
                )
              }
            />
          </div>
          {origins.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mb-0.5"
              onClick={() => onChange(origins.filter((_, j) => j !== i))}
              aria-label="Remove origin"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      ))}
      {origins.length < 10 && (
        <Button
          type="button"
          variant="link"
          className="h-auto px-0"
          onClick={() => onChange([...origins, { airport: 'CDG', travelers: 1 }])}
        >
          <Plus data-icon="inline-start" />
          Add origin
        </Button>
      )}
    </div>
  )
}
