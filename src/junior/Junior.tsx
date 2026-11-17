import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Award, Ban, BookOpen, Check, Coins, Fingerprint, Flag, Mail, Maximize, RotateCcw, ShieldCheck, ShieldOff, Settings, Heart, Star, Volume2, VolumeX, X } from 'lucide-react'
import { characterPath, rules, shifts, totalVisitors, visitors } from './cases.ts'
import { juniorTotals, useJunior } from './store.ts'
import { play } from '../audio.ts'
import VisitorScene from './VisitorScene.tsx'

export default function Junior({ active = true }: { active?: boolean }) {
  const state = useJunior()
  const [book, setBook] = useState(false)
  const muted = state.muted
  const [notice, setNotice] = useState('')
  const stage = useRef<HTMLElement>(null)
  const focus = useRef<HTMLButtonElement>(null)
  const total = juniorTotals(state.decisions)
  const shift = shifts[state.day]
  const visitor = visitors[state.day][state.index]
  const today = state.decisions.filter(record => record.day === state.day)
  const todayStats = juniorTotals(today)
  const playing = state.phase === 'playing'
  const visibleRules = rules.filter(rule => rule.day <= state.day)
  const pending = state.pending
  const needsReply = Boolean(pending?.correct && visitor.replies && !pending.reply)

  useEffect(() => {
    if (!pending || !active) return
    const target = needsReply ? stage.current?.querySelector<HTMLButtonElement>('.jun-reply button') : focus.current
    target?.focus({ preventScroll: true })
  }, [pending, active, needsReply])
  useEffect(() => {
    if (!active) setBook(false)
  }, [active])
  useEffect(() => {
    if (!book || !active) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setBook(false) }
    document.addEventListener('keydown', close)
    const before = document.activeElement
    const element = stage.current?.querySelector<HTMLButtonElement>('.jun-book-close')
    element?.focus()
    return () => { document.removeEventListener('keydown', close); if (before instanceof HTMLElement) before.focus({ preventScroll: true }) }
  }, [book, active])

  function answer(safe: boolean) {
    if (state.answer(safe)) {
      play('stamp', muted)
      play(safe === visitor.safe ? 'success' : 'warning', muted)
    }
  }
  async function fullscreen() {
    if (!stage.current) return
    try {
      if (document.fullscreenElement === stage.current) await document.exitFullscreen()
      else await stage.current.requestFullscreen()
    } catch { setNotice('Bu pəncərədə tam ekran açıla bilmir.') }
  }

  return <main className="junior-game" ref={stage} aria-label="Kiber Qalxan Junior oyunu">
    <div className="jun-scenery" aria-hidden="true"><div className="jun-orbit" /><div className="jun-hills" /><div className="jun-hills near" /></div>
    <details className="jun-settings">
      <summary aria-label="Junior ayarları"><Settings size={18} /></summary>
      <div>
        <button onClick={state.toggleMute}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}{muted ? 'Səsi aç' : 'Səsi söndür'}</button>
        <button onClick={() => void fullscreen()}><Maximize size={17} />Tam ekran</button>
        {state.phase !== 'welcome' && <button onClick={() => { if (confirm('Bu oyundakı irəliləyiş silinsin?')) state.reset() }}><RotateCcw size={17} />Yenidən başla</button>}
      </div>
    </details>

    {state.phase === 'welcome' ? <div className="jun-welcome">
      <div className="jun-welcome-copy"><div className="jun-eyebrow"><span /> YENİ NÖVBƏTÇİ AXTARILIR</div>
        <h1>Kiçik post.<br /><span>Böyük məsuliyyət.</span></h1>
        <p>İnternet qapısında növbə sənindir. Qonaqları dinlə, hesablarını yoxla və şəxsi məlumatları qoru.</p>
        <button className="jun-primary" onClick={() => { play('incoming', muted); state.begin() }}>Növbəyə başla <ArrowRight size={20} /></button>
        <div className="jun-welcome-meta"><span><Flag size={15} /> 3 gün</span><span><Fingerprint size={15} /> {totalVisitors} qonaq</span></div>
      </div>
      <div className="jun-hero-cast" aria-hidden="true">
        <span className="jun-speech">Posta xoş gəldin!</span>
        <img className="jun-hero-ranger" src={characterPath('ranger')} alt="" />
        <img className="jun-hero-gamer" src={characterPath('gamer')} alt="" />
        <div className="jun-hero-counter"><img src="/junior-art/laptop.png" alt="" /><span>KİBER QALXAN / QƏBUL</span></div>
      </div>
    </div> : state.phase === 'briefing' ? <div className="jun-between">
      <div className="jun-mentor-portrait"><img src={characterPath('mentor')} alt="Postun rəisi" /><span>Rəis Kamal</span></div>
      <motion.section className="jun-brief" key={state.day} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="jun-eyebrow">GÜN {state.day + 1} / 3</div><h1>{shift.title}</h1><p>{shift.briefing}</p>
        <div className="jun-new-rules">{rules.filter(rule => rule.day === state.day).map(rule => <div key={rule.title}><ShieldCheck size={20} /><div><h2>{rule.title}</h2><p>{rule.text}</p></div></div>)}</div>
        <button className="jun-primary" onClick={() => { play('incoming', muted); state.openPost() }}>Postu aç <ArrowRight size={19} /></button>
      </motion.section>
    </div> : playing ? <div className={"jun-shift" + (pending ? " has-feedback" : "")}>
      <header className="jun-play-header">
        <span className="jun-day">Gün {state.day + 1}/3 <i>·</i> <span aria-label={'Qonaq ' + (state.index + 1) + ' / ' + visitors[state.day].length}>{state.index + 1}/{visitors[state.day].length}</span></span>
        <span className="jun-subject">{shift.subject}</span>
        <span className="jun-score"><Star size={27} fill="currentColor" /><b>{total.score}</b><span className="sr-only"> xal</span></span>
        <span className="jun-lives" role="img" aria-label={total.shields + ' qalxan qalıb'}><ShieldCheck size={27} />{[0, 1, 2].map(index => <Heart key={index} size={28} fill={index < total.shields ? 'currentColor' : 'none'} className={index < total.shields ? '' : 'empty'} />)}</span>
      </header>
      <div className="jun-booth">
        <div className="jun-visitor-window">
          <VisitorScene presentation={{ id: visitor.id, character: visitor.character, active, feedback: pending ? pending.correct ? 'success' : 'mistake' : null }} onInspect={() => { play('key', muted) }} />
        </div>
        <AnimatePresence initial={false}>
          {pending && <motion.section key="feedback" className={'jun-feedback ' + (pending.correct ? 'correct' : 'mistake')} role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="jun-feedback-heading">{pending.correct ? <Award size={23} /> : <ShieldOff size={22} />}<h2>{pending.correct ? 'Düzgün qərardır!' : 'Bu ipucuna bir də bax.'}</h2>{pending.correct && <span>+10 xal · +5 qızıl</span>}</div>
            <p>{visitor.explanation}</p>
            {pending.correct && visitor.replies && <ReplyChallenge key={visitor.id} replies={visitor.replies} complete={Boolean(pending.reply)} onReply={index => {
              const correct = state.reply(index)
              play(correct ? 'success' : 'key', muted)
              return correct
            }} />}
          </motion.section>}
        </AnimatePresence>
      </div>
      <section className="jun-workspace" aria-label="Qonağın sənədləri">
        <div className="jun-documents">
          <article className="jun-id opened">
            <div className="jun-document-label"><Fingerprint size={15} /> HESAB KARTI</div>
            <div className="jun-id-person"><img src={characterPath(visitor.character)} alt="" /><strong>{visitor.name}</strong></div>
            <dl><div><dt>Hesab yaşı</dt><dd>{visitor.age}</dd></div><div><dt>Dost siyahında?</dt><dd>{visitor.friend ? 'Bəli' : 'Xeyr'}</dd></div></dl>
            {!visitor.friend && <p className="jun-account-note">Bu hesabla hələ tanış deyilsən.</p>}
          </article>
          <article className="jun-message opened">
            <div className="jun-document-label"><Mail size={15} /> MESAJ</div>
            <Message key={visitor.id} message={visitor.message} clue={visitor.clue} found={state.clueFound} pending={Boolean(pending)} onFind={() => { state.findClue(); play('key', muted) }} />
            {pending && <motion.span className={'jun-stamp ' + (pending.correct && pending.safe ? 'safe' : 'block')} initial={{ opacity: 0, scale: 1.6, rotate: -16 }} animate={{ opacity: 1, scale: 1, rotate: -9 }}>{!pending.correct ? 'YENİDƏN BAX' : pending.safe ? 'TƏHLÜKƏSİZ' : 'BLOKLANDI'}</motion.span>}
          </article>
        </div>

      </section>
      <footer className="jun-actions">
        <button className="jun-book-button" onClick={() => setBook(true)}><BookOpen size={30} /><span>Qayda<br />kitabçası</span></button>
        {pending ? <button className="jun-primary jun-continue" disabled={needsReply} ref={focus} onClick={() => { play('incoming', muted); state.advance() }}>{total.shields === 0 ? 'Növbənin nəticəsi' : state.index === visitors[state.day].length - 1 ? 'Günün hesabatı' : 'Növbəti qonaq'} <ArrowRight size={23} /></button> : <div className="jun-decisions">
          <button className="jun-safe" onClick={() => answer(true)}><ShieldCheck size={32} /><span>Təhlükəsiz</span></button>
          <button className="jun-block" onClick={() => answer(false)}><Ban size={32} /><span>Blokla</span></button>
        </div>}
      </footer>
    </div> : <div className="jun-between">
      <div className="jun-mentor-portrait"><img src={characterPath(state.phase === 'failed' ? 'mentor' : 'ranger')} alt="" /></div>
      <section className="jun-brief jun-report">
        <div className="jun-eyebrow">{state.phase === 'report' ? 'GÜN ' + (state.day + 1) + ' / NƏTİCƏ' : state.phase === 'failed' ? 'MƏŞQ VAXTIDIR' : 'ÜÇ GÜNLÜK NÖVBƏ BİTDİ'}</div>
        <h1>{state.phase === 'report' ? todayStats.correct === visitors[state.day].length ? 'Mükəmməl növbə!' : 'Bir gün də tamamlandı.' : state.phase === 'failed' ? 'Qalxanı birlikdə bərpa edək.' : total.correct === totalVisitors ? 'Kiber qəhrəman!' : total.correct >= 6 ? 'Kiber mühafizəçi!' : 'Kiber şagird!'}</h1>
        <p>{state.phase === 'failed' ? 'Üç səhvdən sonra post fasiləyə çıxır. Bu günün qaydalarını yenidən öyrənib eyni növbəni sına.' : state.phase === 'report' ? 'Qərarların qeydə alındı. Növbəti növbəyə hazırsan?' : 'Şəxsi məlumatı soruşan mesajda dayan. Şübhə etsən, etibar etdiyin böyüyə xəbər ver.'}</p>
        <div className="jun-result-grid">
          <div><Star size={20} /><strong>{state.phase === 'report' ? todayStats.score : total.score}<small>/{state.phase === 'report' ? String(visitors[state.day].length * 10) : String(totalVisitors * 10)}</small></strong><span>Xal</span></div>
          <div><ShieldCheck size={20} /><strong>{state.phase === 'report' ? todayStats.correct : total.correct}<small>/{state.phase === 'report' ? String(visitors[state.day].length) : String(totalVisitors)}</small></strong><span>Düzgün qərar</span></div>
          <div><Coins size={20} /><strong>{state.phase === 'report' ? todayStats.coins : total.coins}</strong><span>Qızıl</span></div>
        </div>
        {state.phase === 'failed' && <button className="jun-book-button" onClick={() => setBook(true)}><BookOpen size={18} /> Qaydaları yada sal</button>}
        <button className="jun-primary" onClick={() => {
          play('stamp', muted)
          if (state.phase === 'report') state.nextDay()
          else if (state.phase === 'failed') state.retry()
          else state.reset()
        }}>{state.phase === 'report' ? state.day === 2 ? 'Yekun nəticə' : (state.day + 2) + '-ci günə keç' : state.phase === 'failed' ? 'Bu günü yenidən oyna' : 'Yenidən oyna'} <ArrowRight size={18} /></button>
      </section>
    </div>}

    {notice && <div className="jun-notice" role="status">{notice}<button aria-label="Bildirişi bağla" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {book && <div className="jun-book-overlay" onClick={event => { if (event.target === event.currentTarget) setBook(false) }}>
      <section className="jun-book" role="dialog" aria-modal="true" aria-labelledby="jun-book-title" onKeyDown={event => {
        if (event.key !== 'Tab') return
        event.preventDefault()
        stage.current?.querySelector<HTMLButtonElement>('.jun-book-close')?.focus()
      }}>
        <button className="jun-book-close" onClick={() => setBook(false)} aria-label="Kitabçanı bağla"><X size={23} /></button>
        <div className="jun-eyebrow">POSTUN YADDAŞ KİTABÇASI</div><h2 id="jun-book-title">Qaydaları xatırla.</h2>
        <ol>{visibleRules.map(rule => <li key={rule.title}><Check size={17} /><div><strong>{rule.title}</strong><p>{rule.text}</p></div></li>)}</ol>
      </section>
    </div>}
  </main>
}

function Message({ message, clue, found, pending, onFind }: {
  message: string; clue: string; found: boolean; pending: boolean; onFind: () => void
}) {
  const [hint, setHint] = useState(false)
  // Each phrase is selectable so the answer is discovered rather than pre-highlighted.
  const offset = message.indexOf(clue)
  const pieces = [message.slice(0, offset), clue, message.slice(offset + clue.length)]
  return <>
    <blockquote aria-label={message}>“{pieces.map((piece, index) => piece && <span key={index} role="button"
      className={index === 1 && found ? 'jun-phrase found' : 'jun-phrase'}
      tabIndex={pending || found ? -1 : 0} aria-disabled={pending || found} aria-pressed={index === 1 && found}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click() } }}
      onClick={() => { if (pending || found) return; if (index === 1) { onFind(); setHint(false) } else setHint(true) }}>{piece}</span>)}”</blockquote>
    {!pending && <small className="jun-clue-hint" aria-live="polite">{found ? '✓ İpucu işarələndi' : hint ? 'Nə istənildiyini göstərən hissəyə bax.' : 'İpucunu tap: mesajın bir hissəsinə toxun.'}</small>}
  </>
}

function ReplyChallenge({ replies, complete, onReply }: {
  replies: string[]; complete: boolean; onReply: (index: number) => boolean
}) {
  const [wrong, setWrong] = useState<number | null>(null)
  return <div className="jun-reply">
    <h3>{complete ? '✓ Təhlükəsiz cavabı seçdin.' : 'Bəs sən nə cavab verərdin?'}</h3>
    {!complete && <div>{replies.map((reply, index) => <button key={reply} aria-label={reply} className={wrong === index ? 'wrong' : ''}
      onClick={() => { if (!onReply(index)) setWrong(index) }}><span aria-hidden="true">{index + 1}</span>{reply}</button>)}</div>}
    {wrong !== null && !complete && <small role="alert">Şəxsi məlumatı qoruyan cavabı yenidən seç.</small>}
  </div>
}
