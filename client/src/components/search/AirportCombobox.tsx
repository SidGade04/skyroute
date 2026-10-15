import { useMemo, useState } from 'react'
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
import { AIRPORTS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { IataCode } from '@/types/skyroute.types'

type Props = {
  label: string
  value: IataCode
  onChange: (iata: IataCode) => void
  exclude?: IataCode
}

export function AirportCombobox({ label, value, onChange, exclude }: Props) {
  const [open, setOpen] = useState(false)
  const selected = AIRPORTS.find((a) => a.iata === value)

  const results = useMemo(
    () => AIRPORTS.filter((a) => a.iata !== exclude),
    [exclude],
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
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
              <span className="truncate text-muted-foreground">{selected?.city ?? 'Airport'}</span>
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="City or IATA" />
            <CommandList>
              <CommandEmpty>No airport found.</CommandEmpty>
              <CommandGroup>
                {results.map((a) => (
                  <CommandItem
                    key={a.iata}
                    value={`${a.iata} ${a.city} ${a.name}`}
                    data-checked={a.iata === value || undefined}
                    onSelect={() => {
                      onChange(a.iata)
                      setOpen(false)
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
