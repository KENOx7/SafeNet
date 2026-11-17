import { useEffect, useRef } from 'react'
import type { useNetwork } from './store.ts'
import type { Defendable, Threat } from './rules.ts'

export type BattlefieldSnapshot = Pick<ReturnType<typeof useNetwork.getState>,
  'wave' | 'phase' | 'elapsed' | 'installed' | 'outcomes' | 'shield'> & { target: Defendable | null; tool: Threat | null }

export function pixelScale(width: number, height: number) {
  return Math.max(1, Math.min(3, Math.floor(Math.min(width / 330, height / 150))))
}

export default function Battlefield({ snapshot, onSelect }: {
  snapshot: BattlefieldSnapshot
  onSelect: (node: Defendable) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const current = useRef(snapshot)
  const selection = useRef(onSelect)
  useEffect(() => { current.current = snapshot; selection.current = onSelect }, [snapshot, onSelect])

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let disposed = false
    let game: import('phaser').Game | undefined
    function measure() {
      const width = parent!.clientWidth
      const height = parent!.clientHeight
      if (!width || !height) return
      parent!.parentElement?.style.setProperty('--node-offset', (pixelScale(width, height) * 22 + 2) + 'px')
      if (game?.isBooted) game.scale.resize(width, height)
    }
    const resize = new ResizeObserver(measure)
    resize.observe(parent)
    void import('./battlefieldPhaser.ts').then(({ createBattlefield }) => {
      if (disposed) return
      measure()
      game = createBattlefield(parent, () => current.current, node => selection.current(node))
    }).catch(() => { /* The labelled node controls remain available. */ })
    return () => {
      disposed = true
      resize.disconnect()
      game?.destroy(true)
    }
  }, [])

  return <div className="net-field" ref={host} aria-hidden="true" />
}
