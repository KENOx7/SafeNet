import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Ban, BookOpen, Check, FileSearch, Fingerprint, Flame, Globe2, Lightbulb, Link2, Mail, MessageSquare, Pin, ScanLine, Search, TriangleAlert, X } from 'lucide-react'
import { useGame } from '../store.ts'
import { getCases, trustedDomains } from '../game/scenarios.ts'
import type { Scenario, Tool } from '../game/scenarios.ts'
import { bossChecks, getStreak, policiesFor, toolNames } from '../game/rules.ts'
import { canChoose, lessonFor, unlocked } from '../game/guide.ts'
import { hasProof, proofFor } from '../game/proofs.ts'
import type { Proof } from '../game/proofs.ts'
import { play } from '../audio.ts'
import DeskScene from './DeskScene.tsx'
import type { DeskEvent } from './DeskScene.tsx'

const kit = { domain: Globe2, link: Link2, identity: Fingerprint, compare: FileSearch }
type Tab = Tool | 'rulebook' | 'chat'

function Evidence({ tab, entry }: { tab: Tool; entry: Scenario }) {
  const domain = entry.address.split('@')[1]
  const host = entry.link ? new URL(entry.link).hostname : null
  const rows: Record<Tool, [string, string][]> = {
    domain: [['Göndərənin domeni', domain], ['Məktəbin domenləri', entry.id === 'D1-02' ? 'oyu.example' : trustedDomains.join(' · ')]],
    link: host && entry.link ? [['Hədəf ünvanı', entry.link], ['Saytın domeni', host], ['Kampus siyahısı', trustedDomains.includes(host) ? 'Siyahıda var' : 'Siyahıda yoxdur']] : [['Keçid', 'Bu sorğuda keçid yoxdur.']],
    identity: [['Təqdim olunan ad', entry.sender], ['Kataloq qeydi', entry.identity]],
    compare: [['Daxili istinad', entry.record], ['Göndərən', entry.address], ['Hədəf', host ?? 'Keçid yoxdur']],
  }
  return <dl className="evidence">{rows[tab].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
}

function Conversation({ entry }: { entry: Scenario }) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const transcript = entry.conversation!
  function send(message: string) {
    const text = message.trim()
    if (!text || messages.length >= 5) return
    const response = /rəsmi|kataloq|bilet|nömrə|zəng|yoxla|təsdiq/i.test(text) ? transcript[1] : transcript[2]
    setMessages([...messages, text, response])
    setDraft('')
  }
  return <div className="chat">
    <small>Bu, oyundakı söhbətdir. Öz şifrəni və məlumatlarını yazma.</small>
    <p>{transcript[0]}</p>
    {messages.map((line, index) => <p className={index % 2 === 0 ? 'player-message' : ''} key={index}>{line}</p>)}
    {!messages.length && <button className="small-button suggested-reply" onClick={() => send('Rəsmi sorğu nömrəsi varmı?')}>Rəsmi sorğu nömrəsi varmı?</button>}
    {messages.length < 6 && <form onSubmit={event => { event.preventDefault(); send(draft) }}><input value={draft} maxLength={180} onChange={event => setDraft(event.target.value)} aria-label="Mesajın" placeholder="Öz sualını yaz…" /><button type="submit" className="small-button" aria-label="Göndər"><ArrowRight size={17} /></button></form>}
  </div>
}

function ProofBoard({ proof, pinned, complete, onPin }: {
  proof: Proof
  pinned: number[]
  complete: boolean
  onPin: (index: number) => boolean
}) {
  const [missed, setMissed] = useState(false)
  const dragged = useRef<number | null>(null)
  const board = useRef<HTMLElement>(null)
  useEffect(() => { board.current?.scrollIntoView({ block: 'nearest' }) }, [])
  function choose(index: number) {
    setMissed(!onPin(index))
  }
  return <section className="proof-board" ref={board} aria-label="Dəlil lövhəsi">
    <strong><Pin size={17} /> {proof.prompt}</strong>
    {!complete && <div className="proof-options">
      {proof.options.map((option, index) => !pinned.includes(index) && <button key={option} draggable
        onDragStart={event => { dragged.current = index; event.dataTransfer.setData('text/plain', option); event.dataTransfer.effectAllowed = 'move' }}
        onDragEnd={() => { dragged.current = null }} onClick={() => choose(index)}>{option}</button>)}
    </div>}
    <div className={'proof-slot' + (complete ? ' complete' : '')}
      onDragOver={event => { if (dragged.current !== null) event.preventDefault() }}
      onDrop={event => {
        event.preventDefault()
        if (dragged.current !== null) choose(dragged.current)
        dragged.current = null
      }}>
      {pinned.map(index => <span key={index}><Check size={14} /> {proof.options[index]}</span>)}
      {!complete && <small>{pinned.length}/{proof.answers.length} · Dəlili bura gətir və ya üzərinə bas</small>}
    </div>
    {missed && !complete && <p className="proof-hint" role="status">{proof.hint}</p>}
  </section>
}

export default function Desk() {
  const state = useGame()
  const [tab, setTab] = useState<Tab | null>(null)
  const requestRef = useRef<HTMLElement>(null)
  const resultRef = useRef<HTMLButtonElement>(null)
  const cases = getCases(state.day)
  const entry = cases[state.index]
  const { pending, verified, muted, budget } = state
  const campaign = state.day > 0 && state.day < 4
  const features = unlocked(state.day, state.index)
  const lesson = lessonFor(entry.id)
  const proof = proofFor(entry.id)
  const showProof = proof && (!lesson?.tool || state.checked.includes(lesson.tool)) &&
    (!entry.priority || bossChecks.every(tool => state.checked.includes(tool)))
  const showDetails = tab && (!pending || tab === 'rulebook')
  const streak = getStreak(state.decisions)
  const first = entry.id === 'D1-01'
  const sealed = first && !state.opened && !pending
  const ready = canChoose(entry, state)
  const Icon = entry.channel === 'Mesaj' ? MessageSquare : entry.channel === 'QR bildirişi' ? ScanLine : Mail

  useEffect(() => {
    setTab(null)
    play('incoming', useGame.getState().muted)
  }, [entry.id])

  useEffect(() => {
    if (pending) resultRef.current?.focus()
  }, [pending])

  const open = (next: Tab) => {
    setTab(next)
    if (next in kit) state.inspect(next as Tool)
    play('key', muted)
  }

  function advance() {
    state.advance()
    requestRef.current?.scrollTo(0, 0)
    requestRef.current?.focus({ preventScroll: true })
  }

  function act(event: DeskEvent | 'verify') {
    if (event === 'open') {
      state.openMail()
      play('key', muted)
      requestRef.current?.focus({ preventScroll: true })
    } else if (event === 'verify') {
      if (state.verify()) {
        setTab(null)
        play('stamp', muted)
      }
    } else if (state.decide(event)) {
      play('stamp', muted)
      if (campaign) play(useGame.getState().pending?.correct ? 'success' : 'warning', muted)
    }
  }

  const nextLabel = state.index + 1 === cases.length ? 'Nəticələrə bax' : 'Növbəti məktub'
  const task = campaign ? ['1-ci növbə', '2-ci növbə', '3-cü növbə'][state.day - 1] : state.day === 0 ? 'İlkin sınaq' : 'Son sınaq'
  const detailTitle = tab === 'rulebook' ? 'Yaddaş kitabçası' : tab === 'chat' ? 'Söhbət' : tab ? toolNames[tab] : ''
  const importantTools: readonly Tool[] = entry.priority ? bossChecks : lesson?.tool ? [lesson.tool] : []
  return <main id="main" className="guided-desk">
    <div className="workstation">
    <div className="terminal-shell">
      <div className="terminal-header"><span><i /> {task}</span>{campaign && streak > 1 && <span className="streak" aria-label={streak + ' ardıcıl düzgün qərar'}><Flame size={17} /> ×{streak}</span>}<span><Mail size={15} /> {state.index + 1}/{cases.length}</span></div>
    <section className="guided-card terminal-screen" ref={requestRef} tabIndex={-1} aria-label="Cari məktub">
      <AnimatePresence mode="wait" initial={false}>
        {sealed ? <motion.div key="envelope" className="mail-arrival" exit={{ opacity: 0, scale: 0.97 }}>
          <div className="mail-emblem"><Mail size={55} strokeWidth={1.6} /></div>
          <h1>İlk məktubun gəldi!</h1>
          <p>Masadakı zərfin üzərinə bas.</p>
          <button className="small-button" onClick={() => act('open')}>Məktubu aç <ArrowRight size={17} /></button>
        </motion.div> : <motion.div className="paper guided-paper" key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          <div className="paper-body">
            <div className="letter-sender"><Icon size={19} /><span>Kimdən? <strong>{entry.sender}</strong></span></div>
            <h1>{entry.title}</h1>
            <p>{entry.message}</p>
            {(entry.id === 'D1-02' || state.day === 0) && <div className="letter-address"><Mail size={16} /><code>{entry.address}</code></div>}
            {entry.link && state.day === 0 && <div className="letter-address"><Link2 size={16} /><code>{entry.link}</code></div>}
          </div>

          {lesson && !pending && <div className="lesson-note">
            <Lightbulb size={23} />
            <div><strong>{first ? 'İlk addım' : lesson.title}</strong><p>{lesson.note}</p></div>
          </div>}

          {!pending && (features.tools.some(tool => tool !== 'link' || entry.link) || entry.conversation || features.verify) && <div className="letter-tools">
            {features.tools.filter(tool => tool !== 'link' || entry.link).map(tool => {
              const Item = kit[tool]
              return <button key={tool} className={importantTools.includes(tool) && !state.checked.includes(tool) ? 'new-tool' : ''} onClick={() => open(tool)} aria-expanded={tab === tool} aria-controls="mail-evidence">
                <Item size={17} /> {toolNames[tool]} {state.checked.includes(tool) && <Check size={15} />}
              </button>
            })}
            {entry.conversation && <button className={entry.id === 'D2-01' ? 'new-tool' : ''} aria-expanded={tab === 'chat'} aria-controls="mail-evidence" onClick={() => open('chat')}><MessageSquare size={17} /> Söhbəti aç</button>}
            {features.verify && <button className={lesson?.verify && !verified && budget > 0 ? 'new-tool' : ''} onClick={() => act('verify')} disabled={verified || budget === 0}><Search size={17} /> {verified ? 'Yoxlanıldı' : 'Yoxlat'} <small>{budget} haqqın qalıb</small></button>}
          </div>}

          {verified && !pending && <div className="letter-evidence verified-response" role="status">
            <strong><Check size={17} /> Məktəbin cavabı</strong><p>{entry.verification}</p>
          </div>}
          {(showDetails || showProof && !pending) && <div className={'investigation-area' + (showDetails && showProof && !pending ? ' with-proof' : '')}>
          {showDetails && <motion.section className="letter-evidence" id="mail-evidence" key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <div className="letter-evidence-heading"><strong>{detailTitle}</strong><button aria-label="Pəncərəni bağla" onClick={() => setTab(null)}><X size={18} /></button></div>
            {tab === 'rulebook' ? <ol className="rules">{policiesFor(state.day).map(([number, heading, description]) => <li key={number}><strong>{heading}</strong><p>{description}</p></li>)}</ol> :
              tab === 'chat' && entry.conversation ? <Conversation entry={entry} /> :
              tab !== 'chat' ? <Evidence tab={tab} entry={entry} /> : null}
          </motion.section>}

          {showProof && !pending && <ProofBoard key={entry.id} proof={proof} pinned={state.pinned} complete={hasProof(entry.id, state.pinned)} onPin={index => {
            const hit = state.pin(index)
            play(hit ? 'success' : 'key', muted)
            return hit
          }} />}
          </div>}
          {pending ? <motion.div className={'letter-outcome ' + (!campaign || pending.correct ? 'good' : 'bad')} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div role="status">
              <strong>{!campaign || pending.correct ? <Check size={23} /> : <TriangleAlert size={23} />}
                {!campaign ? 'Cavabın yadda saxlanıldı' : pending.correct ? 'Afərin, düzgün qərardır!' : pending.verdict === 'approve' ? 'Bu sorğu riskli idi' : 'Bu sorğu etibarlı idi'}
              </strong>
              {campaign && pending.xp > 0 && <p className="reward">+{pending.xp} XP {streak > 1 && '· ' + streak + ' ardıcıl düzgün qərar'}</p>}
              {campaign && <p>{entry.lesson}</p>}
              {campaign && !pending.verificationAppropriate && <p>{pending.verified ? 'Burada yoxlama haqqını saxlaya bilərdin.' : 'Əmin olmayanda məktəbdən cavab istə.'}</p>}
            </div>
            <button ref={resultRef} onClick={advance} className="primary">{nextLabel} <ArrowRight size={18} /></button>
          </motion.div> : ready ? <div className="letter-actions">
            <button className="stamp approve" onClick={() => act('approve')}><Check size={21} /> Təsdiqlə</button>
            {!first && <button className="stamp block" onClick={() => act('block')}><Ban size={21} /> Blokla</button>}
          </div> : entry.priority && !showProof ? <p className="letter-progress">Qərardan əvvəl üç ipucuna bax · {bossChecks.filter(tool => state.checked.includes(tool)).length} / 3</p> : null}
        </motion.div>}
      </AnimatePresence>
    </section>
      <div className="terminal-footer">
        <div className="mail-steps" role="group" aria-label={'Məktub ' + (state.index + 1) + ' / ' + cases.length}>
          {cases.map((item, index) => <span key={item.id} className={index < state.index || (index === state.index && pending) ? 'done' : index === state.index ? 'current' : ''}>
            {index < state.index || (index === state.index && pending) ? <Check size={13} /> : index + 1}
          </span>)}
        </div>
        {features.rulebook && <div className="study-actions">
          <button aria-expanded={tab === 'rulebook'} onClick={() => tab === 'rulebook' ? setTab(null) : open('rulebook')}><BookOpen size={17} /> Yaddaş kitabçası</button>
        </div>}
      </div>
    </div>
    <div className="terminal-stand" aria-hidden="true" />
    </div>
    <div className="scene-frame dispatch-board">
      <DeskScene caseId={entry.id} canBlock={!first} status={pending ? 'done' : sealed ? 'sealed' : ready ? 'ready' : 'inspect'}
        outcome={pending && { verdict: pending.verdict, correct: campaign ? pending.correct : undefined }} onAction={act} />
    </div>
  </main>
}
