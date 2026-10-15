import { Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDuration } from '@/lib/utils'
import type { StopoverInfo } from '@/types/skyroute.types'

export function IntentionalStopoverTag({ stopover }: { stopover: StopoverInfo }) {
  return (
    <Badge variant="secondary" className="h-auto gap-1.5 rounded-md px-2 py-1 font-normal">
      <Sun />
      Intentional stopover · {stopover.city} {formatDuration(stopover.layoverMinutes)} ·{' '}
      {formatDuration(stopover.downtownMinutes)} downtown ({stopover.daylightWindow})
    </Badge>
  )
}
