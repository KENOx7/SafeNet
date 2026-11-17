import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Bot, Camera, Check, Hand, Home, Image, Lightbulb, Play, RotateCcw, ScanEye, Star, Trophy, Type, Volume2, VolumeX, X } from 'lucide-react'
import { play } from '../audio.ts'
import { roundCount, subjects } from './rounds.ts'
import type { Round, Variant } from './rounds.ts'
import { useRealAi } from './store.ts'
import './real-ai.css'

const fox = '/real-ai/ui/fox_3d_scene.png'
const tips = [
  { Icon: Hand, text: 'Əlləri, ayaqları və pəncələri say.' },
  { Icon: Type, text: 'Şəkildəki yazıları oxumağa çalış.' },
  { Icon: ScanEye, text: 'Formalara və arxa plana diqqət et.' },
]
const label = { ai: 'AI · Uyğunsuz', normal: 'Real · Normal' }
const training = 'Təlim simulyasiyası. Bütün şəkillər süni intellektlə hazırlanıb. “Real” adi görünən nümunədir.'

export default function RealAi({ active }: { active: boolean }) {
  const game = useRealAi()
  const [rulesOpen, setRulesOpen] = useState(false)
  const round = game.rounds[game.index]
  const choice = game.answers[game.index]
  const score = game.answers.filter((answer, index) => game.rounds[index]?.variant === answer).length
  const nextButton = useRef<HTMLButtonElement>(null)
  const card = useRef<HTMLElement>(null)
  const resultTitle = useRef<HTMLHeadingElement>(null)

  function answer(guess: Variant) {
    const correct = game.answer(guess)
    if (correct !== undefined) play(correct ? 'success' : 'warning', game.muted)
  }

  useEffect(() => { if (!active) setRulesOpen(false) }, [active])
  useEffect(() => {
    if (!active || rulesOpen) return
    if (game.phase === 'result') resultTitle.current?.focus({ preventScroll: true })
    else if (game.phase === 'playing') {
      if (choice) nextButton.current?.focus({ preventScroll: true })
      else card.current?.focus({ preventScroll: true })
    }
  }, [active, choice, game.phase, game.index, rulesOpen])

  function start() {
    game.start()
    play('incoming', game.muted)
  }

  return <main className="rai-game" aria-label="Real yoxsa AI oyunu" onKeyDown={event => {
    if (!active || rulesOpen || game.phase !== 'playing' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      answer(event.key === 'ArrowLeft' ? 'ai' : 'normal')
    }
  }}>
    <header className="rai-hud">
      <div className="rai-brand"><Image aria-hidden="true" /><span>Real yoxsa <b>AI?</b></span></div>
      {game.phase === 'playing' && <div className="rai-progress">
        <span>Raund {game.index + 1}/{roundCount}</span>
        <ol aria-label="Raund nəticələri">{game.rounds.map((item, index) => {
          const picked = game.answers[index]
          const status = picked ? picked === item.variant ? 'right' : 'wrong' : index === game.index ? 'current' : ''
          const description = picked ? picked === item.variant ? 'düzgün' : 'səhv' : index === game.index ? 'cari' : 'gözləyir'
          return <li key={item.subject} className={status} aria-label={'Raund ' + (index + 1) + ', ' + description}>{status === 'right' ? <Check size={13} /> : status === 'wrong' ? <X size={12} /> : null}</li>
        })}</ol>
      </div>}
      <div className="rai-hud-actions">
        {game.phase !== 'intro' && <span className="rai-score" aria-label={score + ' xal'}><Star fill="currentColor" />{score}</span>}
        <button className="rai-icon" aria-label={game.muted ? 'Səsi aç' : 'Səsi söndür'} onClick={game.toggleMute}>{game.muted ? <VolumeX /> : <Volume2 />}</button>
        <button className="rai-icon" aria-label="Qaydalar" onClick={() => setRulesOpen(true)}><BookOpen /></button>
      </div>
    </header>

    {game.phase === 'intro' && <section className="rai-intro">
      <div className="rai-intro-copy">
        <h1>Real yoxsa <em>AI?</em></h1>
        <p>Kiber Tülkü ilə altı şəkli araşdır. Hansında qəsdən uyğunsuz detal gizlənib?</p>
        <TipList />
        <button className="rai-button gold" onClick={start}><Play fill="currentColor" />Oyuna başla</button>
      </div>
      <figure className="rai-fox rai-intro-fox"><img src={fox} alt="Böyüdücü tutan Kiber Tülkü" /></figure>
    </section>}

    {game.phase === 'playing' && round && <section className="rai-board">
      <aside className="rai-guide" aria-label="Kiber Tülkü">
        <div className="rai-speech"><strong>Kiber Tülkü</strong><p>{choice ? 'Şəkildə qızılı çərçivəyə bax. İzah həmin hissəni göstərir.' : 'Qərar verməzdən əvvəl şəkli yaxşıca araşdır.'}</p></div>
        <figure className="rai-fox"><img src={fox} alt="" /></figure>
      </aside>
      <ImageCard key={round.subject} round={round} choice={choice} cardRef={card} onAnswer={answer} />
      <aside className="rai-investigate">
        {choice ? <Feedback round={round} choice={choice} /> : <>
          <h2><Lightbulb /> Nəyə diqqət etməli?</h2>
          <TipList />
          <Hint key={round.subject} text={subjects[round.subject].hint} />
        </>}
      </aside>
      <div className="rai-decisions">
        {choice ? <button ref={nextButton} className="rai-button gold" onClick={game.next}>{game.index === roundCount - 1 ? 'Nəticəyə bax' : 'Növbəti raund'}<ArrowRight /></button> : <>
          <button className="rai-button pink" onClick={() => answer('ai')}><ArrowLeft /><span><b>AI</b><small>Uyğunsuz detal</small></span><Bot className="rai-choice-icon" /></button>
          <button className="rai-button green" onClick={() => answer('normal')}><Camera className="rai-choice-icon" /><span><b>Real</b><small>Normal nümunə</small></span><ArrowRight /></button>
        </>}
      </div>
    </section>}

    {game.phase === 'result' && <section className="rai-result">
      <div className="rai-trophy"><Trophy size={54} /></div>
      <h1 ref={resultTitle} tabIndex={-1}>{score}/{roundCount} düzgün</h1>
      <p>{score >= 5 ? 'Detalları çox diqqətlə araşdırdın!' : 'Hər raundda yeni bir detal öyrəndin.'}</p>
      <ul>
        <li><Check /> Artıq bədən hissəsi və qarışıq yazı araşdırmaq üçün ipucu ola bilər.</li>
        <li><Check /> Uyğun görünən detal şəklin həqiqiliyini sübut etmir.</li>
        <li><Check /> Şəklə inanmadan və onu paylaşmadan əvvəl müəllifini və mənbəyini yoxla.</li>
      </ul>
      <div className="rai-result-actions"><button className="rai-button lilac" onClick={game.home}><Home /> Ana menyu</button><button className="rai-button gold" onClick={start}><RotateCcw /> Yenidən oyna</button></div>
    </section>}

    <p className="rai-training">{training}</p>

    {active && rulesOpen && <Rules onClose={() => setRulesOpen(false)}>
      <p>Hər raundda şəkildəki detallara bax və iki seçimdən birini et.</p>
      <ul>
        <li><ArrowLeft /> Sola sürüşdür və ya sol oxu bas. <strong>AI · Uyğunsuz</strong></li>
        <li><ArrowRight /> Sağa sürüşdür və ya sağ oxu bas. <strong>Real · Normal</strong></li>
      </ul>
      <p>Seçim düymələrini də istifadə edə bilərsən. Hər düzgün cavab 1 xal qazandırır.</p>
      {game.phase === 'playing' && <button className="rai-button lilac" onClick={() => { setRulesOpen(false); start() }}><RotateCcw /> Yeni oyun başlat</button>}
    </Rules>}
  </main>
}

function TipList() {
  return <ul className="rai-tips">{tips.map(({ Icon, text }) => <li key={text}><span><Icon size={19} /></span>{text}</li>)}</ul>
}

function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return <div className="rai-hint">
    <button aria-expanded={open} onClick={() => setOpen(!open)}><Lightbulb size={19} /> {open ? 'İpucunu bağla' : 'İpucu göstər'}</button>
    {open && <p>{text}</p>}
  </div>
}

function ImageCard({ round, choice, cardRef, onAnswer }: {
  round: Round; choice?: Variant; cardRef: React.RefObject<HTMLElement | null>; onAnswer: (choice: Variant) => void
}) {
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const [offset, setOffset] = useState<number | null>(null)
  const subject = subjects[round.subject]
  const [x, y, width, height] = subject.focus[round.variant]
  function finish(event: PointerEvent<HTMLElement>, commit: boolean) {
    const start = drag.current
    if (start?.id !== event.pointerId) return
    drag.current = null
    setOffset(null)
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (commit && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) onAnswer(dx < 0 ? 'ai' : 'normal')
  }
  const moving = choice ? null : offset
  return <div className="rai-photo-slot">
    <figure ref={cardRef} tabIndex={-1} aria-label={subject.title} className={'rai-photo' + (moving !== null ? ' dragging' : '') + (choice ? ' answered' : '')}
      style={moving === null ? undefined : { transform: 'translateX(' + moving + 'px) rotate(' + moving / 13 + 'deg)' }}
      onPointerDown={event => {
        if (choice || !event.isPrimary || event.button !== 0) return
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        event.currentTarget.setPointerCapture(event.pointerId)
        setOffset(0)
      }}
      onPointerMove={event => {
        if (drag.current?.id === event.pointerId) setOffset(Math.max(-125, Math.min(125, event.clientX - drag.current.x)))
      }}
      onPointerUp={event => finish(event, true)}
      onPointerCancel={event => finish(event, false)}
      onLostPointerCapture={event => finish(event, false)}>
      <div className="rai-art"><img src={'/real-ai/cases/' + round.subject + '_' + round.variant + '.png'} alt={subject.title + '. ' + subject[round.variant]} draggable={false} />
        {choice && <span className="rai-detail-focus" aria-hidden="true"
          style={{ left: x + '%', top: y + '%', width: width + '%', height: height + '%' }} />}
        {moving !== null && Math.abs(moving) >= 30 && <span aria-hidden="true" className={'rai-drag-label ' + (moving < 0 ? 'ai' : 'normal')}>{moving < 0 ? 'AI' : 'Real'}</span>}
      </div>
      <figcaption><strong>{subject.title}</strong><span>{choice ? label[round.variant] : '← AI  ·  Real →'}</span></figcaption>
    </figure>
  </div>
}

function Feedback({ round, choice }: { round: Round; choice: Variant }) {
  const correct = round.variant === choice
  const subject = subjects[round.subject]
  return <section className={'rai-feedback ' + (correct ? 'correct' : 'incorrect')} role="status">
    <div className="rai-verdict">{correct ? <Check /> : <ScanEye />}<strong>{correct ? 'Düzgün bildin!' : 'Gəl, birlikdə baxaq'}</strong></div>
    <div className="rai-answer-reveal">
      {!correct && <p>Sənin seçimin <strong>{label[choice]}</strong></p>}
      <p>Düzgün seçim <strong>{label[round.variant]}</strong></p>
    </div>
    <h3><ScanEye size={16} /> Çərçivədəki detal</h3>
    <p>{subject[round.variant]}</p>
    {!correct && <div className="rai-lesson"><Lightbulb size={17} /><p><strong>Növbəti dəfə</strong> {subject.lesson}</p></div>}
    {correct && <span className="rai-point"><Star size={17} fill="currentColor" /> +1 xal</span>}
  </section>
}

function Rules({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={dialog} className="rai-dialog" aria-labelledby="rai-rules" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="rai-dialog-heading"><h2 id="rai-rules">Qaydalar</h2><button className="rai-icon" onClick={onClose} aria-label="Qaydaları bağla"><X /></button></div>
    {children}
  </dialog>
}
