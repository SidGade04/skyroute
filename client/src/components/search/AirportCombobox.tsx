import { useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAirport } from '@/hooks/useAirport'
import { useAirportAutocomplete } from '@/hooks/useAirportAutocomplete'
import { cn } from '@/lib/utils'
import type { Airport, IataCode } from '@/types/skyroute.types'

type Props = {
  label: string
  value: IataCode
  onChange: (iata: IataCode) => void
  exclude?: IataCode
}

export function AirportCombobox({ label, value, onChange, exclude }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Airport | null>(null)

  const selected = useAirport(picked?.iata === value ? undefined : value)
  const display = picked?.iata === value ? picked : selected

  const { airports, loading } = useAirportAutocomplete(q, open)
  const results = airports.filter((a) => a.iata !== exclude)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQ('')
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-between font-normal"
          >
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-base font-semibold">
                {value || '—'}
              </span>
              <span className="truncate text-muted-foreground">{display?.city ?? 'Airport'}</span>
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="City or IATA"
              value={q}
              onValueChange={setQ}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading…' : q.trim() ? 'No airport found.' : ' '}
              </CommandEmpty>
              <CommandGroup heading={!q.trim() && results.length > 0 ? 'Popular' : undefined}>
                {results.map((a) => (
                  <CommandItem
                    key={a.iata}
                    value={`${a.iata} ${a.city} ${a.name}`}
                    data-checked={a.iata === value || undefined}
                    onSelect={() => {
                      setPicked(a)
                      onChange(a.iata)
                      setOpen(false)
                      setQ('')
                    }}
                    className={cn(a.iata === value && 'bg-muted')}
                  >
                    <span className="w-10 font-[family-name:var(--font-display)] font-semibold">
                      {a.iata}
                    </span>
                    <span className="text-muted-foreground">
                      {a.city} · {a.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
