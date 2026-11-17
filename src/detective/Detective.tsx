import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, BookOpen, Check, ClipboardList, EyeOff, Lightbulb, LockKeyhole, RotateCcw, Search, Share2, ShieldCheck, Star, Volume2, VolumeX, X } from 'lucide-react'
import { levels } from './levels.ts'
import type { StateSnapshot } from './types.ts'
import { useDetective } from './store.ts'
import { play } from '../audio.ts'

const cat = '/detective-art/detective-cat.svg'
export default function Detective({ active = true }: { active?: boolean }) {
  const game = useDetective()
  const [book, setBook] = useState(false)
  const state = { ...game, score: game.completed * 20 + game.foundIds.size * 10 }
  const level = levels[game.level]
  const next = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!active) setBook(false) }, [active])
  useEffect(() => { if (game.phase === 'success' && active) next.current?.focus({ preventScroll: true }) }, [game.phase, active])
  return <main className="detective-game" aria-label="Şəkil Detektivi oyunu">
    <HUD state={state} />
    {game.phase === 'intro' ? <section className="det-intro">
      <div className="det-intro-copy"><span className="det-eyebrow">4 ŞƏKİL · 8 GİZLİ MƏLUMAT</span><h1>Hər şəkil<br />bir sirr saxlayır.</h1><p>Detektiv Pişiklə şəkilləri araşdır. Şəxsi məlumatları tap, gizlət və sonra təhlükəsiz paylaş.</p><button className="det-button green" onClick={() => { game.begin(); play('incoming', game.muted) }}>Macəraya başla <ArrowRight /></button></div>
      <div className="det-intro-art"><img className="det-intro-photo" src="/detective-art/bedroom.png" alt="Şəxsi məlumat axtaracağın rəngarəng otaq" /><img className="det-intro-cat" src={cat} alt="Detektiv Pişik" /><span className="det-intro-tag"><Search size={19} /> Əvvəl yoxla, sonra paylaş!</span></div>
    </section> : game.phase === 'end' ? <ResultScreen score={state.score} onReplay={game.begin} /> : <div className="det-play">
      <aside className="det-guide"><div className="det-speech"><span>Detektiv Pişik deyir:</span><h1>Bu şəkildə nə gizlidir?</h1><p>Ünvanı, məktəbi və hesab məlumatlarını axtar. Tapdığın yerə toxunaraq onu gizlət.</p></div><img src={cat} alt="Böyüdücü ilə Detektiv Pişik" /><div className="det-guide-label"><LockKeyhole size={16} /> Paylaşmadan əvvəl düşün.</div></aside>
      <article className="det-post">
        <div className="det-post-heading"><img src={cat} alt="" /><div><strong>Pişik_Dost</strong><span>{level.title}</span></div><span className="det-post-number">0{game.level + 1}</span></div>
        <h2>{level.caption}</h2>
        <GameScene state={state} onRedact={id => { if (game.redact(id)) play('success', game.muted) }} onSafeObject={game.inspectSafe} />
        <div className="det-post-footer"><EyeOff size={17} /><span>Şəxsi paylaşımın önizləməsi</span><span className="det-post-secure">{game.foundIds.size}/2 gizlədildi</span></div>
      </article>
      <aside className="det-mission"><ClueChecklist state={state} /><HintPanel state={state} />
        <div className="det-notice" role="status">{game.notice || (game.foundIds.size === 2 ? 'İki məlumat da gizlədildi. Şəkil paylaşmağa hazırdır!' : 'Şəkildə şəxsi məlumat olan yerləri tap və gizlət.')}</div>
      </aside>
      <div className="det-actions"><button className="det-button lilac" onClick={() => setBook(true)}><BookOpen size={20} />Qaydalar</button><button className="det-button green det-share" onClick={() => {
        play(game.share() ? 'stamp' : 'warning', game.muted)
      }}><Share2 size={24} />Paylaş {game.foundIds.size === 2 && <Check size={22} />}</button></div>
    </div>}
    <AnimatePresence>{game.phase === 'success' && <SuccessModal level={game.level} nextRef={next} onNext={game.next} />}</AnimatePresence>
    {book && <Rules onClose={() => setBook(false)} />}
  </main>
}

function HUD({ state }: { state: StateSnapshot }) {
  return <header className="det-hud"><div className="det-brand"><span><Search size={28} /></span><div><strong>Şəkil Detektivi</strong><small>Paylaşmadan əvvəl yoxla</small></div></div>
    <div className="det-level"><b>Səviyyə {state.phase === 'end' ? 4 : state.level + 1} / 4</b><div className="det-pips" aria-label={state.completed + ' səviyyə tamamlandı'}>{levels.map((_, index) => <i key={index} className={index < state.completed ? 'done' : index === state.level ? 'now' : ''}>{index < state.completed ? <Check size={13} /> : null}</i>)}</div></div>
    <span className="det-score"><Star size={23} fill="currentColor" /><b>{state.score}</b><span className="sr-only">xal</span></span>
    <button className="det-icon-button" aria-label={state.muted ? 'Səsi aç' : 'Səsi söndür'} onClick={useDetective.getState().toggleMute}>{state.muted ? <VolumeX size={21} /> : <Volume2 size={21} />}</button>
  </header>
}

function GameScene({ state, onRedact, onSafeObject }: { state: StateSnapshot; onRedact: (id: string) => void; onSafeObject: () => void }) {
  const level = levels[state.level]
  return <div className="det-scene-wrap"><div className={"det-scene " + level.id} aria-label={level.title + ' — araşdırılacaq şəkil'}>
    <img src={'/detective-art/' + ['bedroom', 'school', 'desk', 'street'][state.level] + '.png'} alt={level.title} draggable={false} />
    <button className="det-safe-area" aria-label="Şəkildəki digər əşyaları yoxla" onClick={onSafeObject} />
    {level.clues.map(clue => {
      const found = state.foundIds.has(clue.id)
      return <button key={clue.id} className={'det-hotspot clue-' + clue.id + ' ' + clue.kind + (found ? ' redacted' : '') + (state.hint && !found ? ' hinted' : '')}
        style={{ left: clue.x + '%', top: clue.y + '%', width: clue.w + '%', height: clue.h + '%' }} aria-label={(found ? 'Gizlədildi: ' : 'Araşdır: ') + clue.label}
        aria-pressed={found} aria-disabled={found || state.phase !== 'playing'} onClick={() => onRedact(clue.id)}>
        {found ? <span className="det-redaction" aria-hidden="true" /> : <span className="det-clue-text">{clue.text}</span>}
      </button>
    })}
  </div></div>
}

function ClueChecklist({ state }: { state: StateSnapshot }) {
  return <section className="det-checklist"><div className="det-panel-heading"><ClipboardList size={24} /><h2>Tapılacaq<br />gizli məlumatlar</h2><span>{state.foundIds.size}/2</span></div><ul>{levels[state.level].clues.map(clue => <li className={state.foundIds.has(clue.id) ? 'found' : ''} key={clue.id}><span className="det-check">{state.foundIds.has(clue.id) && <Check size={18} />}</span><span>{clue.label}</span></li>)}</ul><div className="det-progress" role="progressbar" aria-label="Gizlədilən məlumatlar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={state.foundIds.size}><span style={{ width: state.foundIds.size * 50 + '%' }} /></div></section>
}
function HintPanel({ state }: { state: StateSnapshot }) {
  return <section className="det-hint"><h2><Lightbulb size={23} />Detektivin ipucu</h2><p>{state.hint ? levels[state.level].hint : 'Şəkli diqqətlə araşdır. Şəxsi məlumat bəzən arxa planda gizlənir.'}</p><button onClick={useDetective.getState().showHint} aria-pressed={state.hint}>{state.hint ? 'İpucu açıqdır' : 'İpucu göstər'}<Search size={16} /></button></section>
}
function SuccessModal({ level, onNext, nextRef }: { level: number; onNext: () => void; nextRef: React.RefObject<HTMLButtonElement | null> }) {
  return <motion.div className="det-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.section className="det-success" role="dialog" aria-modal="true" aria-labelledby="det-success-title" initial={{ y: 15, scale: .96 }} animate={{ y: 0, scale: 1 }} onKeyDown={event => { if (event.key === 'Tab') { event.preventDefault(); nextRef.current?.focus() } }}>
    <img src={cat} alt="" /><div className="det-reward"><Star fill="currentColor" />20 xal qorundu</div><h2 id="det-success-title">Əla iş, detektiv!</h2><p>Şəkildəki iki şəxsi məlumatı gizlətdin. Paylaşım artıq təhlükəsizdir.</p><button ref={nextRef} className="det-button green" onClick={onNext}>{level === 3 ? 'Nəticəyə bax' : 'Növbəti səviyyə'}<ArrowRight /></button>
  </motion.section></motion.div>
}
function ResultScreen({ score, onReplay }: { score: number; onReplay: () => void }) {
  return <section className="det-result"><div className="det-badge"><ShieldCheck size={65} /><span>KİBER DETEKTİV</span></div><h1>Bütün sirləri qorudun!</h1><p>4 şəkil araşdırdın, 8 şəxsi məlumatı gizlətdin və <strong>{score} xal</strong> qazandın.</p><ul><li><Check />Ünvan və telefon nömrəsini gizlət.</li><li><Check />Məktəb və küçə lövhələrini yoxla.</li><li><Check />Şifrələr və şəxsi sənədlər şəkildə qalmasın.</li></ul><button className="det-button green" onClick={onReplay}><RotateCcw size={22} />Yenidən oyna</button></section>
}
function Rules({ onClose }: { onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => { const before = document.activeElement; close.current?.focus(); return () => { if (before instanceof HTMLElement) before.focus({ preventScroll: true }) } }, [])
  return <div className="det-overlay" onClick={event => { if (event.target === event.currentTarget) onClose() }}><section className="det-rules" role="dialog" aria-modal="true" aria-labelledby="det-rules-title" onKeyDown={event => { if (event.key === 'Escape') onClose(); if (event.key === 'Tab') { event.preventDefault(); close.current?.focus() } }}><button ref={close} className="det-close" aria-label="Qaydaları bağla" onClick={onClose}><X /></button><BookOpen size={36} /><h2 id="det-rules-title">Üç detektiv qaydası</h2><ol><li>Şəkildə ünvan, telefon, məktəb və hesab məlumatı axtar.</li><li>Məlumatın üzərinə toxun və ya klaviaturada Tab ilə seçib Enter bas. Tapdığın yer örtüləcək.</li><li>Hər iki məlumat gizləndikdən sonra “Paylaş” düyməsini bas.</li></ol></section></div>
}
