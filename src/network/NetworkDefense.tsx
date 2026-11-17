import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { play } from '../audio.ts'
import { defenses, maxHealth, nodes, packetNames, reward, waves } from './rules.ts'
import type { Defendable, NodeId, PacketKind, Threat } from './rules.ts'
import { useNetwork } from './store.ts'
import { PixelIcon } from './PixelIcon.tsx'

const Battlefield = lazy(() => import('./Battlefield.tsx'))
const nodeIds = Object.keys(nodes) as NodeId[]
const tools = Object.keys(defenses) as Threat[]
const kindColors: Record<PacketKind, string> = { normal: '#a3d5a2', load: '#f0ad65', mail: '#e58c76', access: '#ed7165' }
const nodeNotes: Record<Defendable, string> = {
  gateway: 'Bütün paketlər əvvəlcə bu qovşaqdan keçir.',
  web: 'Trafik filtri sayta gələn adi paketləri buraxır.',
  mail: 'Saxta məktublar poçt xəttində hərəkət edir.',
  archive: 'Məktəbin məlumatları burada saxlanılır. İcazəsiz girişi dayandır.',
}

function timestamp(seconds: number) {
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(Math.floor(seconds % 60)).padStart(2, '0')
}

export default function NetworkDefense({ active = true }: { active?: boolean }) {
  const state = useNetwork()
  const [tool, setTool] = useState<Threat | null>(null)
  const [target, setTarget] = useState<Defendable | null>(null)
  const [note, setNote] = useState('')
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const stage = useRef<HTMLElement>(null)
  const acknowledged = useRef(state.outcomes.length)
  const wave = waves[state.wave]
  const kinds = [...new Set(wave.packets.map(packet => packet.kind))]
  const running = state.phase === 'running'
  const failed = state.phase === 'lost'
  const activeShield = state.shield && state.elapsed < state.shield.until
  const finished = state.phase === 'won' || state.phase === 'lost'
  const targetDefense = target && state.installed[target]
  const primaryPacket = wave.packets.find(packet => packet.kind !== 'normal')!
  const defaultAnchor = primaryPacket.path.at(-1) as Defendable
  const inspected = target ?? defaultAnchor
  const localThreats = [...new Set(wave.packets.filter(packet => packet.kind !== 'normal' && packet.path.includes(inspected)).map(packet => packet.kind as Threat))]
  const localOutcomes = state.outcomes.filter(item => item.node === inspected)
  const incidents = state.outcomes.filter(item => item.verdict !== 'delivered').slice(-3).reverse()
  const hit = state.outcomes.find(item => item.verdict === 'hit')

  useEffect(() => {
    if (!active || !running || state.paused) return
    const timer = window.setInterval(() => {
      if (!document.hidden) useNetwork.getState().tick(0.05)
    }, 50)
    return () => window.clearInterval(timer)
  }, [active, running, state.paused])

  useEffect(() => {
    const report = state.outcomes.slice(acknowledged.current)
    acknowledged.current = state.outcomes.length
    if (report.some(item => item.verdict === 'hit')) play('warning', muted)
    else if (report.some(item => item.verdict === 'blocked')) play('success', muted)
  }, [state.outcomes, muted])

  useEffect(() => {
    const sync = () => setFullscreen(stage.current !== null && document.fullscreenElement === stage.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  async function toggleFullscreen() {
    const surface = stage.current
    if (!surface) return
    try {
      if (document.fullscreenElement === surface) await document.exitFullscreen()
      else await surface.requestFullscreen()
    } catch {
      setNote('Brauzer bu pəncərədə tam ekranı aça bilmir.')
    }
  }

  function selectNode(node: Defendable) {
    setTarget(node)
    if (state.phase === 'setup' && tool) {
      if (!state.install(node, tool)) {
        play('key', muted)
        setNote('Bu qovşaq üçün büdcən çatmır.')
        return
      }
      play('stamp', muted)
      setNote(defenses[tool].name + ' yerləşdirildi · ' + nodes[node].name)
      setTool(null)
    } else {
      play('key', muted)
      setNote('')
    }
  }

  function prepareNext() {
    play('stamp', muted)
    setNote('')
    setTool(null)
    state.next()
  }

  const instruction = note || (state.phase === 'setup' ? tool
    ? defenses[tool].name + ' üçün ekranda qovşaq seç.'
    : 'Aləti seç, sonra monitorda qovşağa bas.'
    : running ? state.paused ? 'Dalğa dayandırılıb.'
      : target ? nodes[target].name + ' seçilib.' : 'Lazım olsa, qovşağı seçib qalxanı işə sal.'
      : state.phase === 'clear' ? 'Növbəti dalğa üçün +' + reward + ' büdcə qazanıldı.'
      : state.phase === 'won' ? 'Üç dalğanı keçdin. Şəbəkə işləyir.' : 'Müdafiəni dəyişib bu dalğanı yenidən sına.')

  return <main className="network-game" aria-label="Network Defense oyunu" ref={stage}>
    <div className="net-office" aria-hidden="true" />
    <header className="net-mast">
      <div className="net-brand net-metal">
        <img className="net-brand-mark" src="/network-art/shield.png" alt="" />
        <div><h1>NETWORK DEFENSE</h1><span>OYU · CISO NÖVBƏSİ</span></div>
      </div>
      <div className="net-campus" aria-hidden="true" />
      <div className="net-instrument net-metal">
        <div className="net-register">
          <small>DALĞA 0{state.wave + 1} / 0{waves.length}</small>
          <div className={'net-wave-readout' + (failed ? ' failed' : '')}><i className={running && !state.paused ? 'live' : ''} />{state.phase === 'setup' ? 'Hazırlıq' : state.phase === 'clear' ? 'Dalğa keçildi' : failed ? 'Uğursuz cəhd' : finished ? 'Nəticə' : state.paused ? 'Fasilə' : 'Hücum gedir'}</div>
        </div>
        <div className="net-register net-budget"><img src="/network-art/coin.png" alt="" /><div><small>Büdcə</small><strong>{state.credits}</strong></div></div>
        <div className="net-register net-health"><img src="/network-art/shield.png" alt="" /><div><small>Şəbəkə bütövlüyü</small><div className="health-cells" role="img" aria-label={state.health + ' / ' + maxHealth}>
          {Array.from({ length: maxHealth }, (_, index) => <i key={index} className={index < state.health ? 'full' : ''} />)}
        </div></div></div>
      </div>
      <div className="net-utility">
        <button className={'net-hardware-key net-pause-key' + (state.paused ? ' resume' : '')} onClick={state.pause} disabled={!running} aria-label={state.paused ? 'Davam et' : 'Fasilə ver'} title={state.paused ? 'Davam et' : 'Fasilə ver'} />
        <button className="net-hardware-key" onClick={() => setMuted(!muted)} aria-label={muted ? 'Səsi aç' : 'Səsi söndür'} title={muted ? 'Səsi aç' : 'Səsi söndür'}><PixelIcon name={muted ? 'muted' : 'sound'} size={19} /></button>
        <button className="net-hardware-key" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? 'Tam ekrandan çıx' : 'Tam ekran'} title={fullscreen ? 'Tam ekrandan çıx' : 'Tam ekran'}><PixelIcon name="expand" size={19} /></button>
      </div>
    </header>

    <div className="net-station">
      <aside className="net-left" aria-label="Missiya və hadisələr">
        <section className="net-mission net-metal">
          <h2><PixelIcon name="target" size={21} /> Missiya</h2>
          <div className="net-inset">
            <h3>{state.phase === 'won' ? 'Şəbəkə qorundu' : wave.name}</h3>
            <p>{state.phase === 'won' ? instruction : wave.brief}</p>
          </div>
        </section>
        <section className="net-log net-metal">
          <h2><PixelIcon name="log" size={19} /> Hadisə jurnalı</h2>
          <ol className="net-inset">
            {incidents.length ? incidents.map(item => <li key={item.packet} className={item.verdict}>
              <i /><time>{timestamp(item.time)}</time><span>{nodes[item.node].name} · {item.verdict === 'blocked' ? 'bloklandı' : 'zərər aldı'}</span>
            </li>) : <li><i /><time>00:00</time><span>{running ? 'Paketlər yoldadır' : 'Növbə hazırdır'}</span></li>}
          </ol>
          <div className="net-tally"><span>{state.blocked} blok</span><span>{state.delivered} çatdırıldı</span></div>
        </section>
      </aside>

      <section className="net-monitor net-metal" aria-label="Şəbəkə monitoru">
        <div className="net-glass">
          <div className="map-caption"><span>OYU UNİVERSİTETİ<br />ŞƏBƏKƏ TOPOLOGİYASI</span><span>{wave.packets.length - state.outcomes.length} paket qalıb</span></div>
          <Suspense fallback={null}>
            <Battlefield snapshot={{ wave: state.wave, phase: state.phase, elapsed: state.elapsed, installed: state.installed,
              outcomes: state.outcomes, shield: state.shield, target, tool }} onSelect={selectNode} />
          </Suspense>
          {nodeIds.map(id => {
            const position = { left: nodes[id].x / 9.4 + '%', top: nodes[id].y / 4.4 + '%' }
            if (id === 'internet') return <span className="net-node-label" key={id} style={position}>{nodes[id].name}</span>
            const current = state.installed[id]
            return <button key={id} type="button" className="net-node-label" style={position} onClick={() => selectNode(id)}
              aria-label={nodes[id].name} aria-pressed={target === id} aria-description={current ? defenses[current].name : undefined}>
              {nodes[id].name}{current && <i style={{ backgroundColor: kindColors[current] }} />}
            </button>
          })}
          <div className="packet-legend" aria-label="Paket növləri">{kinds.map(kind => <span key={kind}><i style={{ backgroundColor: kindColors[kind] }} />{packetNames[kind]}</span>)}</div>
          {running && state.paused && <div className="net-pause-banner"><PixelIcon name="pause" size={16} /> FASİLƏ</div>}
          {failed && <div className="net-fail-banner" role="alert">
            <PixelIcon name="alert" size={22} />
            <div><h2>Dalğa keçilmədi</h2><p>{hit ? nodes[hit.node].name + ' zərərli paket qəbul etdi.' : 'Şəbəkənin müdafiəsi pozuldu.'}</p></div>
          </div>}
        </div>
      </section>

      <aside className="net-clipboard" aria-label="Qovşağın vəziyyəti">
        <div className="net-inspector net-metal">
          <h2><img src={inspected === 'mail' ? '/network-art/envelope.png' : '/network-art/shield.png'} alt="" /> {nodes[inspected].name}</h2>
          <div className={'net-node-state' + (localThreats.length ? ' threatened' : '')}>
            <PixelIcon name={localThreats.length ? 'alert' : 'shield'} size={16} />
            {localThreats.length ? 'Təhlükə marşrutu' : 'Marşrut sabitdir'}
          </div>
          <p>{nodeNotes[inspected]}</p>
          {localThreats.length > 0 && <ul>{localThreats.map(kind => <li key={kind}><i style={{ backgroundColor: kindColors[kind] }} />{packetNames[kind]}</li>)}</ul>}
          {state.phase === 'setup' && localThreats.length > 0 && <div className="net-advice">
            <small>UYĞUN MÜDAFİƏ</small>
            <strong>{localThreats.map(kind => defenses[kind].name).join(' · ')}</strong>
          </div>}
          {localOutcomes.length > 0 && <p className="net-node-tally">{localOutcomes.filter(item => item.verdict === 'blocked').length} blok · {localOutcomes.filter(item => item.verdict === 'hit').length} zərbə</p>}
          <div className="net-slotted">
            <small>YERLƏŞDİRİLƏN MÜDAFİƏ</small>
            <strong>{state.installed[inspected] ? defenses[state.installed[inspected]].name : 'Boş yuva'}</strong>
            {state.phase === 'setup' && target && targetDefense &&
              <button className="net-small-key" onClick={() => { state.remove(target); play('key', muted); setNote('Müdafiə geri götürüldü. Büdcə qaytarıldı.') }}>Geri götür</button>}
          </div>
        </div>
      </aside>
    </div>

    <footer className="net-desk">
      <img className="net-props" src="/network-art/desk-props.png" alt="" />
      <section className="net-rack net-metal">
        <div className="net-rack-top"><h2>Müdafiə alətləri</h2><span role="status">{instruction}</span></div>
        <div className="defense-tools" role="group" aria-label="Müdafiə alətləri">{tools.map(id => {
          const defense = defenses[id]
          return <button key={id} className={'net-module net-module-' + id + (tool === id ? ' selected' : '')} aria-pressed={tool === id} disabled={state.phase !== 'setup'}
            onClick={() => { play('key', muted); setNote(''); setTool(tool === id ? null : id) }}>
            <span className="defense-emblem" aria-hidden="true" />
            <span className="defense-text">
              <span className="defense-title"><strong>{defense.name}</strong><span className="defense-cost"><img src="/network-art/coin.png" alt="" />{defense.price}</span></span>
              <small>{defense.stops}</small>
            </span>
          </button>
        })}</div>
      </section>
      <div className="net-launch-base net-metal">
        {state.phase === 'setup' ? <button className="net-ignition" onClick={() => { play('stamp', muted); setTool(null); setNote(''); state.playWave() }}>
          <PixelIcon name="play" size={29} /><span>Dalğanı başlat</span>
        </button> : running ? <button className="net-ignition green" disabled={!target || Boolean(state.shield) || state.paused}
          onClick={() => { if (target) { play('stamp', muted); state.protect(target) } }}>
          <PixelIcon name="bolt" size={25} /><span>{activeShield ? 'Qalxan aktivdir' : state.shield ? 'Qalxan istifadə edildi' : '3 saniyəlik qalxan'}</span>
        </button> : state.phase === 'clear' ? <button className="net-ignition green" onClick={prepareNext}>
          <PixelIcon name="play" size={26} /><span>Növbəti dalğa</span>
        </button> : failed ? <button className="net-ignition retry" onClick={() => { play('stamp', muted); setNote(''); setTool(null); setTarget(null); state.retry() }}>
          <PixelIcon name="reset" size={25} /><span>Dalğanı yenidən oyna</span>
        </button> : <button className="net-ignition green" onClick={() => { play('stamp', muted); setNote(''); setTool(null); setTarget(null); state.reset() }}>
          <PixelIcon name="reset" size={25} /><span>Yenidən oyna</span>
        </button>}
      </div>
      <img className="net-keyboard" src="/network-art/keyboard.png" alt="" />
    </footer>
  </main>
}
