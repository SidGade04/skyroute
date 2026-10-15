import type { ReactNode } from 'react'
import { Briefcase, Luggage, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { BaggageSelection } from '@/types/skyroute.types'

type Props = {
  value: BaggageSelection
  onChange: (next: BaggageSelection) => void
}

function Stepper({
  label,
  icon,
  count,
  onDec,
  onInc,
}: {
  label: string
  icon: ReactNode
  count: number
  onDec: () => void
  onInc: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
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

export function BaggageControlBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Package size={16} className="text-primary" />
        TrueCost™ bags
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="personal-item"
          checked={value.personalItem}
          onCheckedChange={(checked) =>
            onChange({ ...value, personalItem: checked === true })
          }
        />
        <Label htmlFor="personal-item" className="text-muted-foreground">
          Personal item
        </Label>
      </div>
      <Stepper
        label="Carry-on"
        icon={<Briefcase size={14} />}
        count={value.carryOn}
        onDec={() => onChange({ ...value, carryOn: Math.max(0, value.carryOn - 1) })}
        onInc={() => onChange({ ...value, carryOn: Math.min(2, value.carryOn + 1) })}
      />
      <Stepper
        label="Checked"
        icon={<Luggage size={14} />}
        count={value.checked}
        onDec={() => onChange({ ...value, checked: Math.max(0, value.checked - 1) })}
        onInc={() => onChange({ ...value, checked: Math.min(3, value.checked + 1) })}
      />
    </div>
  )
}
