import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { Crosshair, Loader2, X } from 'lucide-react'
import {
  armSniper,
  deleteSniper,
  disarmSniper,
  listSnipers,
  quoteSniper,
  rearmSniper,
  type Sniper,
  type SniperCondition,
} from '@/api/sniper'
import { supabase } from '@/api/supabaseClient'
import { AirportCombobox } from '@/components/search/AirportCombobox'
import { SniperScope } from '@/components/sniper/SniperScope'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCurrency } from '@/components/common/CurrencyDropdown'
import { formatMoney } from '@/lib/utils'

type Trigger = 'LTE' | 'LT' | 'BETWEEN' | 'PCT' | 'PCT_USER'
type Phase = 'idle' | 'scope' | 'armed'

const CAP = 5

const todayIso = () => format(new Date(), 'yyyy-MM-dd')
const plus = (iso: string, days: number) => format(addDays(parseISO(iso), days), 'yyyy-MM-dd')
const dayLabel = (iso: string) => format(parseISO(iso), 'MMM d')

function moneyExact(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function describe(c: SniperCondition, currency: string) {
  if (c.op === 'LTE' && c.amount != null) return `at or below ${formatMoney(c.amount, currency)}`
  if (c.op === 'LT' && c.amount != null) return `below ${formatMoney(c.amount, currency)}`
  if (c.op === 'BETWEEN' && c.min != null && c.max != null) {
    return `${formatMoney(c.min, currency)}–${formatMoney(c.max, currency)}`
  }
  if (c.op === 'PCT_BELOW' && c.pct != null) {
    return c.basis === 'USER' && c.amount != null
      ? `${c.pct}% below ${formatMoney(c.amount, currency)}`
      : `${c.pct}% below the armed fare`
  }
  return c.op
}

function num(raw: string) {
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

export function AlertsPage() {
  const { selected } = useCurrency()
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const [snipers, setSnipers] = useState<Sniper[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [origin, setOrigin] = useState('DXB')
  const [destination, setDestination] = useState('LHR')
  const [windowStart, setWindowStart] = useState(todayIso())
  const [windowEnd, setWindowEnd] = useState(plus(todayIso(), 6))
  const [trigger, setTrigger] = useState<Trigger>('LTE')
  const [amount, setAmount] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [pct, setPct] = useState('15')
  const [quote, setQuote] = useState<{ price: number; date: string; key: string } | null>(null)
  const [spotting, setSpotting] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Sniper | null>(null)
  const [error, setError] = useState<string | null>(null)

  const today = todayIso()
  const routeKey = `${origin}|${destination}|${windowStart}|${windowEnd}|${selected}`
  const live = quote?.key === routeKey ? quote : null
  const armedCount = snipers.filter((s) => s.status === 'ARMED').length

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!email) return
    setLoadingList(true)
    listSnipers()
      .then(setSnipers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingList(false))
  }, [email])

  function shiftStart(next: string) {
    setWindowStart(next)
    setQuote(null)
    if (windowEnd < next) setWindowEnd(next)
    else if (windowEnd > plus(next, 13)) setWindowEnd(plus(next, 13))
  }

  function condition(): SniperCondition | string {
    if (trigger === 'LTE' || trigger === 'LT') {
      const value = num(amount)
      if (!(value > 0)) return 'Enter a target above 0'
      if (live && value >= live.price) return `Target must be below ${moneyExact(live.price, selected)}`
      return { op: trigger, amount: value, min: null, max: null, pct: null, basis: null }
    }
    if (trigger === 'BETWEEN') {
      const lo = num(min)
      const hi = num(max)
      if (!(lo > 0) || !(hi > lo)) return 'Range needs a min below the max'
      if (live && hi >= live.price) return `Range must sit below ${moneyExact(live.price, selected)}`
      return { op: 'BETWEEN', amount: null, min: lo, max: hi, pct: null, basis: null }
    }
    const drop = num(pct)
    if (drop < 1 || drop > 99) return 'Percent is 1–99'
    if (trigger === 'PCT') {
      return { op: 'PCT_BELOW', amount: null, min: null, max: null, pct: drop, basis: 'SNAPSHOT' }
    }
    const ref = num(amount)
    if (!(ref > 0)) return 'Enter the reference fare'
    if (live && ref * (1 - drop / 100) >= live.price) {
      return `That percent still sits at or above ${moneyExact(live.price, selected)}`
    }
    return { op: 'PCT_BELOW', amount: ref, min: null, max: null, pct: drop, basis: 'USER' }
  }

  async function spot() {
    setError(null)
    setQuote(null)
    if (origin === destination) {
      setError('Origin and destination are the same')
      return
    }
    setSpotting(true)
    const key = routeKey
    try {
      const next = await quoteSniper({
        origin,
        destination,
        windowStart,
        windowEnd,
        currency: selected,
        matchMode: 'ANY',
      })
      setQuote({ price: next.price, date: next.date, key })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fare')
    } finally {
      setSpotting(false)
    }
  }

  async function arm(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!live) {
      setError('Spot the fare first')
      return
    }
    if (armedCount >= CAP) {
      setError('Five armed snipers is the cap')
      return
    }
    const built = condition()
    if (typeof built === 'string') {
      setError(built)
      return
    }
    setPhase('scope')
    const started = performance.now()
    try {
      const saved = await armSniper({
        origin,
        destination,
        windowStart,
        windowEnd,
        currency: selected,
        matchMode: 'ANY',
        conditions: [built],
      })
      const wait = Math.max(0, 720 - (performance.now() - started))
      await new Promise((r) => setTimeout(r, wait))
      setPhase('armed')
      await new Promise((r) => setTimeout(r, 520))
      setSnipers((list) => [saved, ...list.filter((s) => s.id !== saved.id)])
      setQuote(null)
      setPhase('idle')
    } catch (err) {
      setPhase('idle')
      setError(err instanceof Error ? err.message : 'Arm failed')
    }
  }

  async function remove(id: string) {
    setError(null)
    setBusyId(id)
    try {
      await deleteSniper(id)
      setSnipers((list) => list.filter((s) => s.id !== id))
      setPendingDelete(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  async function mutate(id: string, run: (id: string) => Promise<Sniper>) {
    setError(null)
    setBusyId(id)
    try {
      const saved = await run(id)
      setSnipers((list) => list.map((s) => (s.id === saved.id ? saved : s)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  if (email === undefined) {
    return (
      <section className="grid min-h-[40vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </section>
    )
  }

  if (!email) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
          Sniper
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Log in so a fare drop can email this account.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/login">Log in</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      {phase !== 'idle' && <SniperScope route={`${origin} → ${destination}`} armed={phase === 'armed'} />}
      <div className="mb-8 max-w-xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
          Sniper
        </h1>
        <p className="mt-2 text-muted-foreground">
          Armed through the last day of the window. Mail goes to {email}. {armedCount}/{CAP} armed.
        </p>
      </div>

      <form className="mb-10 flex flex-col gap-4 rounded-xl border bg-card p-4" onSubmit={arm}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <AirportCombobox label="Origin" value={origin} onChange={(v) => { setOrigin(v); setQuote(null) }} exclude={destination} />
          <AirportCombobox label="Destination" value={destination} onChange={(v) => { setDestination(v); setQuote(null) }} exclude={origin} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">From</Label>
            <DatePicker value={windowStart} min={today} onChange={shiftStart} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Until</Label>
            <DatePicker
              value={windowEnd}
              min={windowStart}
              max={plus(windowStart, 13)}
              onChange={(next) => { setWindowEnd(next); setQuote(null) }}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Trigger</Label>
            <Select value={trigger} onValueChange={(v) => setTrigger(v as Trigger)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LTE">At or below</SelectItem>
                <SelectItem value="LT">Below</SelectItem>
                <SelectItem value="BETWEEN">Range</SelectItem>
                <SelectItem value="PCT">Percent below armed fare</SelectItem>
                <SelectItem value="PCT_USER">Percent below a fare</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {trigger === 'BETWEEN' ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min" value={min} onChange={setMin} />
              <Field label="Max" value={max} onChange={setMax} />
            </div>
          ) : trigger === 'PCT' ? (
            <Field label="Percent" value={pct} onChange={setPct} />
          ) : trigger === 'PCT_USER' ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Fare" value={amount} onChange={setAmount} />
              <Field label="Percent" value={pct} onChange={setPct} />
            </div>
          ) : (
            <Field label="Target" value={amount} onChange={setAmount} />
          )}
        </div>

        {live && (
          <p className="text-sm text-muted-foreground">
            Cheapest in window {moneyExact(live.price, selected)} on {dayLabel(live.date)}. Arm under that.
          </p>
        )}
        {spotting && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Checking fares in this window
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={spotting || phase !== 'idle' || armedCount >= CAP} onClick={spot}>
            {spotting && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {spotting ? 'Spotting' : 'Spot'}
          </Button>
          <Button type="submit" disabled={!live || phase !== 'idle' || armedCount >= CAP}>
            <Crosshair data-icon="inline-start" />
            Arm
          </Button>
        </div>
      </form>

      {loadingList ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading snipers" />
        </div>
      ) : (
      <ul>
        {snipers.map((s, i) => (
          <li key={s.id}>
            {i > 0 && <Separator />}
            <div className={`offer-enter relative flex flex-wrap items-center justify-between gap-3 py-4 ${s.status === 'DISARMED' ? 'pr-8' : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
              {s.status === 'DISARMED' && (
                <button
                  type="button"
                  aria-label={`Delete ${s.origin} to ${s.destination}`}
                  disabled={busyId === s.id}
                  className="absolute top-3 right-0 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  onClick={() => setPendingDelete(s)}
                >
                  <X size={16} />
                </button>
              )}
              <div className="flex items-start gap-3">
                <Crosshair size={18} className="mt-1 text-primary" />
                <div>
                  <div className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {s.origin} → {s.destination}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.status === 'TRIGGERED' ? 'Headshot' : s.status} · {dayLabel(s.windowStart)}–{dayLabel(s.windowEnd)} · armed at {formatMoney(s.snapshotPrice, s.currency)}
                    {s.conditions[0] ? ` · ${describe(s.conditions[0], s.currency)}` : ''}
                    {s.triggeredPrice != null ? ` · hit ${formatMoney(s.triggeredPrice, s.currency)}` : ''}
                  </div>
                </div>
              </div>
              {s.status === 'ARMED' ? (
                <Button type="button" variant="ghost" size="sm" disabled={busyId === s.id} onClick={() => mutate(s.id, disarmSniper)}>
                  {busyId === s.id && <Loader2 data-icon="inline-start" className="animate-spin" />}
                  Disarm
                </Button>
              ) : s.status !== 'EXPIRED' && s.windowEnd >= today ? (
                <Button type="button" variant="ghost" size="sm" disabled={busyId === s.id || armedCount >= CAP} onClick={() => mutate(s.id, rearmSniper)}>
                  {busyId === s.id && <Loader2 data-icon="inline-start" className="animate-spin" />}
                  Rearm
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open && !busyId) setPendingDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this sniper?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? `${pendingDelete.origin} → ${pendingDelete.destination} is removed for good.` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busyId !== null} onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!pendingDelete || busyId === pendingDelete.id}
              onClick={() => pendingDelete && remove(pendingDelete.id)}
            >
              {pendingDelete && busyId === pendingDelete.id && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      <Input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
