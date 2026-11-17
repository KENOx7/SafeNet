import { useEffect, useRef } from 'react'
import type { Character } from './cases.ts'
import { characterPath } from './cases.ts'

export interface VisitorPresentation {
  id: string
  character: Character
  feedback: 'success' | 'mistake' | null
  active: boolean
}

export default function VisitorScene({ presentation, onInspect }: {
  presentation: VisitorPresentation
  onInspect: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const current = useRef(presentation)
  const action = useRef(onInspect)
  useEffect(() => { current.current = presentation; action.current = onInspect }, [presentation, onInspect])
  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let disposed = false
    let game: import('phaser').Game | undefined
    let observer: ResizeObserver | undefined
    void import('./visitorPhaser.ts').then(({ createVisitorScene }) => {
      if (disposed) return
      game = createVisitorScene(parent, () => current.current, () => action.current())
      observer = new ResizeObserver(() => {
        if (game?.isBooted && parent.clientWidth && parent.clientHeight) game.scale.resize(parent.clientWidth, parent.clientHeight)
      })
      observer.observe(parent)
    })
    return () => {
      disposed = true
      observer?.disconnect()
      game?.destroy(true)
    }
  }, [])
  return <div className="jun-visitor-scene" ref={host} aria-hidden="true">
    <img className="jun-visitor-fallback" src={characterPath(presentation.character)} alt="" />
  </div>
}
