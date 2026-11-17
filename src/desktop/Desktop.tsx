import { lazy, Suspense, useEffect, useState } from 'react'
import { ChevronDown, Grid2X2, Maximize, Terminal, X } from 'lucide-react'

const Defense = lazy(() => import('../network/NetworkDefense.tsx'))
const Junior = lazy(() => import('../junior/Junior.tsx'))
const Detective = lazy(() => import('../detective/Detective.tsx'))
const RealAi = lazy(() => import('../real-ai/RealAi.tsx'))
function PhishingHunter() {
  return <iframe className="pc-game-frame" title="Fişinq Ovçusu" src="/phishing-hunter/index.html" />
}
const programs = {
  network: { name: 'Network Defense', icon: 'network-defence', description: 'Şəbəkəni qoru' },
  junior: { name: 'Kiber Qalxan Junior', icon: 'kiber-qalxan', description: 'Növbə postunu aç' },
  detective: { name: 'Şəkil Detektivi', icon: 'sekil-dedektivi', description: 'Şəkildəki sirləri tap' },
  'real-ai': { name: 'Real yoxsa AI?', icon: 'real-ai', description: 'Uyğunsuz detalı tap' },
  'phishing-hunter': { name: 'Fişinq Ovçusu', icon: 'fisunq', description: 'Məktubları araşdır' },
}
type Program = keyof typeof programs
const programIds = Object.keys(programs) as Program[]
const programViews = { network: Defense, junior: Junior, detective: Detective, 'real-ai': RealAi, 'phishing-hunter': PhishingHunter }

function ProgramIcon({ id }: { id: Program }) {
  return <img className="pc-app-icon" src={'/desktop-icons/' + programs[id].icon + '.webp'} alt="" draggable={false} />
}

function requested(): Program | null {
  const value = new URLSearchParams(location.search).get('app')
  return programIds.find(id => id === value) ?? null
}

export default function Desktop() {
  const [booting, setBooting] = useState(() => Boolean(document.getElementById('safenet-boot')))
  const [active, setActive] = useState<Program | null>(requested)
  const [opened, setOpened] = useState<Program[]>(() => { const first = requested(); return first ? [first] : [] })
  const [time, setTime] = useState(new Date())
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const screen = document.getElementById('safenet-boot')
    if (!screen) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const welcomeAt = reducedMotion ? 100 : 650
    const welcome = window.setTimeout(() => { screen.dataset.phase = 'welcome' }, welcomeAt)
    const finish = window.setTimeout(() => {
      screen.remove()
      setBooting(false)
    }, welcomeAt + (reducedMotion ? 350 : 1120))
    return () => { window.clearTimeout(welcome); window.clearTimeout(finish) }
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 30_000)
    const pop = () => {
      const id = requested()
      setActive(id)
      if (id) setOpened(previous => previous.includes(id) ? previous : [...previous, id])
    }
    window.addEventListener('popstate', pop)
    return () => { clearInterval(timer); window.removeEventListener('popstate', pop) }
  }, [])
  function launch(id: Program | null) {
    setActive(id)
    if (id) setOpened(previous => previous.includes(id) ? previous : [...previous, id])
    const url = new URL(location.href)
    if (id) url.searchParams.set('app', id)
    else url.searchParams.delete('app')
    history.pushState(null, '', url)
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { setNotice('Bu pəncərədə tam ekran açıla bilmir.') }
  }
  return <div className="pc-shell" inert={booting || undefined} aria-hidden={booting || undefined}>
    <header className="pc-bar">
      <button className="pc-home" onClick={() => launch(null)} aria-label="PC masaüstünə qayıt"><Terminal size={17} /> <strong>SafeNet</strong></button>
      <details className="pc-app-menu" onKeyDown={event => {
        if (event.key !== 'Escape') return
        event.currentTarget.open = false
        event.currentTarget.querySelector('summary')?.focus()
      }}>
        <summary>Tətbiqlər <ChevronDown size={12} /></summary>
        <div className="pc-app-list">
          {programIds.map(id => <button key={id} onClick={event => {
            const menu = event.currentTarget.closest('details')
            if (menu) {
              menu.open = false
              menu.querySelector('summary')?.focus()
            }
            launch(id)
          }}><ProgramIcon id={id} />{programs[id].name}</button>)}
        </div>
      </details>
      <span className="pc-active">{active ? programs[active].name : 'Masaüstü'}</span>
      <time>{new Intl.DateTimeFormat('az', { timeZone: 'Asia/Baku', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(time)}</time>
      <button onClick={() => void fullscreen()} aria-label="PC tam ekran"><Maximize size={16} /></button>
    </header>
    <div className="pc-area">
      <main className={'pc-desktop' + (active ? ' pc-hidden' : '')} inert={active !== null || undefined} aria-hidden={active !== null || undefined}>
        <div className="pc-icons">{programIds.map(id => {
          const { name, description } = programs[id]
          return <button key={id} onClick={() => launch(id)} aria-label={name + ' aç'} title={description}>
            <ProgramIcon id={id} /><strong>{name}</strong>
          </button>
        })}</div>
      </main>
      {opened.map(id => {
        const ProgramView = programViews[id]
        return <section key={id} className={'pc-program' + (active !== id ? ' pc-hidden' : '')}
        aria-label={programs[id].name + ' proqramı'} aria-hidden={active !== id || undefined} inert={active !== id || undefined}>
        <Suspense fallback={<p className="pc-loading" role="status">Oyun açılır…</p>}>
          <ProgramView active={active === id} />
        </Suspense>
      </section>})}
      {notice && <div className="pc-notice" role="status">{notice}<button aria-label="Bildirişi bağla" onClick={() => setNotice('')}><X size={17} /></button></div>}
    </div>
    <footer className="pc-taskbar">
      <button className="pc-show" onClick={() => launch(null)} aria-label="Masaüstünü göstər"><Grid2X2 size={18} /></button>
      {opened.map(id => <button key={id} className={active === id ? 'selected' : ''} onClick={() => launch(id)}><ProgramIcon id={id} />{programs[id].name}</button>)}
    </footer>
  </div>
}

