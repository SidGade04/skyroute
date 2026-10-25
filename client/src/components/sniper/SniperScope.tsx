type Props = {
  route: string
  armed: boolean
}

export function SniperScope({ route, armed }: Props) {
  return (
    <div className="fixed inset-0 z-[90] bg-black" role="status" aria-live="polite">
      <p className="sr-only">{armed ? `Armed ${route}` : `Arming ${route}`}</p>
      <div className={`sniper-scope ${armed ? 'kick' : ''}`}>
        <div className="absolute inset-[10%] rounded-full border border-white/25" />
        <div className="absolute top-0 left-1/2 h-[42%] w-px -translate-x-1/2 bg-white/90" />
        <div className="absolute bottom-0 left-1/2 h-[42%] w-px -translate-x-1/2 bg-white/90" />
        <div className="absolute top-1/2 left-0 h-px w-[42%] -translate-y-1/2 bg-white/90" />
        <div className="absolute top-1/2 right-0 h-px w-[42%] -translate-y-1/2 bg-white/90" />
        <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e23b2f]" />
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 font-[family-name:var(--font-display)] text-[11px] tracking-[0.28em] text-white/80">
          {route}
        </div>
        {armed && (
          <div className="sniper-stamp absolute top-[58%] left-1/2 -translate-x-1/2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[0.35em] text-[#e23b2f]">
            ARMED
          </div>
        )}
      </div>
    </div>
  )
}
