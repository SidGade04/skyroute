import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { OptimizationMode } from '@/types/skyroute.types'

const MODES: { id: OptimizationMode; label: string }[] = [
  { id: 'min_total', label: 'Min total' },
  { id: 'fair_split', label: 'Fair split' },
  { id: 'duration_balance', label: 'Duration' },
]

type Props = {
  value: OptimizationMode
  onChange: (mode: OptimizationMode) => void
}

export function OptimizationModeTabs({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as OptimizationMode)}>
      <TabsList>
        {MODES.map((m) => (
          <TabsTrigger key={m.id} value={m.id}>
            {m.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
