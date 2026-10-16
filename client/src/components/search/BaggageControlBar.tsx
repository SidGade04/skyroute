import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Luggage, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DEFAULT_WEIGHT_KG = 23
const MAX_BAGS = 5
const MAX_WEIGHT_KG = 50

type Props = {
  bags: number[]
  onChange: (bags: number[]) => void
}

export function BaggageControlBar({ bags, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const list = bags ?? []
  const totalKg = list.reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function addBag() {
    if (list.length >= MAX_BAGS) return
    onChange([...list, DEFAULT_WEIGHT_KG])
  }

  function removeBag(index: number) {
    onChange(list.filter((_, i) => i !== index))
  }

  function setWeight(index: number, weightKg: number) {
    onChange(
      list.map((w, i) => (i === index ? Math.max(1, Math.min(MAX_WEIGHT_KG, weightKg)) : w)),
    )
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto gap-1.5 px-3 py-3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Baggage filter"
      >
        <Luggage size={16} className="text-primary" />
        <span className="font-[family-name:var(--font-display)] text-xs font-semibold tabular-nums">
          {list.length === 0 ? 'No bags' : `${list.length} bag${list.length === 1 ? '' : 's'} · ${totalKg}kg`}
        </span>
        <ChevronDown size={14} className={`opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 rounded-lg border bg-card p-3 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Bags you&apos;re taking</p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {list.length}/{MAX_BAGS}
            </span>
          </div>
          <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
            Total checked bags (not extras). Included allowance is free; only bags beyond the fare are charged.
          </p>

          {list.length === 0 ? (
            <p className="mb-3 text-sm text-muted-foreground">No bags added.</p>
          ) : (
            <ul className="mb-3 space-y-2">
              {list.map((weightKg, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-xs text-muted-foreground">#{index + 1}</span>
                  <div className="flex flex-1 items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      onClick={() => setWeight(index, weightKg - 1)}
                      aria-label={`Decrease bag ${index + 1} weight`}
                    >
                      −
                    </Button>
                    <span className="w-10 text-center font-[family-name:var(--font-display)] text-sm font-semibold tabular-nums">
                      {weightKg}
                      <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">kg</span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      onClick={() => setWeight(index, weightKg + 1)}
                      aria-label={`Increase bag ${index + 1} weight`}
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeBag(index)}
                      aria-label={`Remove bag ${index + 1}`}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full gap-1 text-xs"
            disabled={list.length >= MAX_BAGS}
            onClick={addBag}
          >
            <Plus size={12} />
            Add bag
          </Button>
        </div>
      )}
    </div>
  )
}
