import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Maximize, Minimize, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { useGame } from './store.ts'
import { setMuted } from './audio.ts'

const Desk = lazy(() => import('./components/Desk.tsx'))
const Reports = lazy(() => import('./components/Reports.tsx'))

export default function App({ active = true }: { active?: boolean }) {
  const state = useGame()
  const stage = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [fullscreenNote, setFullscreenNote] = useState('')
  const toggleFullscreen = useCallback(async () => {
    const target = stage.current
    if (!target) return
    setFullscreenNote('')
    try {
      if (document.fullscreenElement === target) await document.exitFullscreen()
      else await target.requestFullscreen()
    } catch {
      setFullscreenNote('Bu pəncərədə tam ekran açıla bilmir.')
    }
  }, [])

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === stage.current)
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target
      if (!active || event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key.toLowerCase() !== 'f') return
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return
      event.preventDefault()
      void toggleFullscreen()
    }
    document.addEventListener('fullscreenchange', syncFullscreen)
    document.addEventListener('keydown', shortcut)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
      document.removeEventListener('keydown', shortcut)
    }
  }, [active, toggleFullscreen])

  useEffect(() => { setMuted(state.muted) }, [state.muted])
  const inDesk = state.phase === 'desk'
  const fullscreenLabel = fullscreen ? 'Tam ekrandan çıx' : 'Tam ekran'
  return <div className="app" ref={stage}>
    <a className="skip" href="#main">Məzmuna keç</a>
    <div className="game-controls" role="group" aria-label="Oyun ayarları">
      {state.phase !== 'intro' && <button className="icon-button" aria-label="Yenidən başla" title="Yenidən başla" onClick={() => { if (window.confirm('Cari irəliləyiş silinəcək. Yenidən başlamaq istəyirsən?')) state.reset() }}><RotateCcw size={18} /></button>}
      <button className="icon-button" aria-label={state.muted ? 'Səsi aç' : 'Səsi söndür'} title={state.muted ? 'Səsi aç' : 'Səsi söndür'} onClick={state.toggleMute}>{state.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
      <button className="icon-button fullscreen-button" aria-label={fullscreenLabel} title={fullscreenLabel + ' (F)'} onClick={() => void toggleFullscreen()}>
        {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        <kbd aria-hidden="true">F</kbd>
      </button>
      {fullscreenNote && <p className="fullscreen-note" role="status">{fullscreenNote}<button onClick={() => setFullscreenNote('')} aria-label="Bildirişi bağla">×</button></p>}
    </div>
    {state.phase === 'intro' ? <main id="main" className="hero">
      <div className="hero-content">
        <h1>TRUST,<br /><em>PLEASE<span>.</span></em></h1>
        <p className="hero-sub">İNSAN FAYRVOLU</p>
        <div className="title-menu">
          <button className="primary" onClick={() => state.begin()}>Oyuna başla <ArrowRight size={20} /></button>
          <details className="assessment-option"><summary>Müəllimlər üçün</summary><button className="small-button" onClick={() => state.begin(true)}>İlkin ölçmə ilə başla</button></details>
          <a className="small-button assessment-option" href="/?app=network">Network Defense</a>
        </div>
      </div>
    </main> : inDesk ? <Suspense fallback={<main id="main" className="transition-page" role="status">Masa hazırlanır…</main>}><Desk /></Suspense> :
      <main id="main" className="transition-page">
        <section className="terminal-shell report-terminal">
          <div className="terminal-header"><span><i /> OYU TERMİNAL</span></div>
          <motion.div className="brief terminal-screen" key={state.phase + state.day} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Suspense fallback={<p role="status">Məlumat hazırlanır…</p>}><Reports /></Suspense>
          </motion.div>
        </section>
      </main>}
  </div>
}
