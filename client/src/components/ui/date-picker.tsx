import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Props = {
  value?: string
  onChange: (isoDate: string) => void
  className?: string
  /** Inclusive ISO lower bound (yyyy-MM-dd) */
  min?: string
  /** Inclusive ISO upper bound (yyyy-MM-dd) */
  max?: string
}

function parseIso(iso?: string) {
  if (!iso) return undefined
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function DatePicker({ value, onChange, className, min, max }: Props) {
  const date = parseIso(value)
  const minDate = parseIso(min)
  const maxDate = parseIso(max)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!date}
          className={cn(
            'h-9 w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          {date ? format(date, 'MMM d, yyyy') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          onSelect={(next) => {
            if (!next) return
            onChange(format(next, 'yyyy-MM-dd'))
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
