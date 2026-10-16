import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getFxRates } from '@/api/queries/fx/getFxRates'
import { formatMoney } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'JPY', 'CAD', 'AUD']
const STORAGE_KEY = 'skyroute.currency'

type CurrencyCtx = {
  selected: string
  setSelected: (c: string) => void
  money: (amount: number, from: string) => string
}

const Ctx = createContext<CurrencyCtx>({
  selected: 'USD',
  setSelected: () => {},
  money: (amount, from) => formatMoney(amount, from),
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selected, setSelectedState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'USD')
  const [rates, setRates] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    getFxRates()
      .then((r) => setRates(r.rates))
      .catch(() => setRates(null))
  }, [])

  const setSelected = useCallback((c: string) => {
    localStorage.setItem(STORAGE_KEY, c)
    setSelectedState(c)
  }, [])

  // falls back to the source currency until rates load or if either code is unknown
  const money = useCallback(
    (amount: number, from: string) => {
      const r = rates?.[selected]
      const f = rates?.[from]
      return r && f ? formatMoney((amount * r) / f, selected) : formatMoney(amount, from)
    },
    [rates, selected],
  )

  return <Ctx.Provider value={{ selected, setSelected, money }}>{children}</Ctx.Provider>
}

export const useCurrency = () => useContext(Ctx)

export function CurrencyDropdown() {
  const { selected, setSelected } = useCurrency()
  return (
    <Select value={selected} onValueChange={setSelected}>
      <SelectTrigger size="sm" aria-label="Currency" className="border-white/20 text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c} value={c}>
            {/* ponytail: ISO 4217 prefix = ISO 3166 country for this list (EUR→eu works too); breaks for X** codes */}
            <img src={`https://flagcdn.com/w20/${c.slice(0, 2).toLowerCase()}.png`} alt="" className="h-3 w-5 rounded-[2px] object-cover" />
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
