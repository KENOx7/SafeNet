import { useState } from 'react'
import { ArrowRight, Award, Radio, ShieldCheck } from 'lucide-react'
import { findCase, getCases } from '../game/scenarios.ts'
import { days, ending, metrics } from '../game/rules.ts'
import type { Decision } from '../game/rules.ts'
import { coachOutput, getSkills, practiceTopics, recommendation, topicNames } from '../game/coach.ts'
import { useGame } from '../store.ts'

function decisionsFor(records: Decision[], day: number) {
  const ids = new Set(getCases(day).map(entry => entry.id))
  return records.filter(item => ids.has(item.id))
}

function Coach({ records }: { records: Decision[] }) {
  const skills = getSkills(records)
  const topics = practiceTopics(skills)
  const [topic, setTopic] = useState(topics[0])
  const [source, setSource] = useState<'idle' | 'loading' | 'local' | 'ai'>('idle')
  const strongest = [...skills].sort((a, b) => b.correct - a.correct)[0]
  const review = records.filter(record => !record.correct || !record.verificationAppropriate)
  async function load() {
    setSource('loading')
    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }), signal: AbortSignal.timeout(5500),
      })
      if (!response.ok) throw new Error('Coach unavailable')
      const result = coachOutput.parse(await response.json())
      if (!topics.includes(result.topic)) throw new Error('Unexpected topic')
      setTopic(result.topic)
      setSource('ai')
    } catch {
      setSource('local')
    }
  }
  return <section className="report-block">
    <h2><Radio size={18} /> Təhlükəsizlik məşqçisi</h2>
    {strongest.correct > 0 && <p>Ən çox düzgün tətbiq etdiyin bacarıq · <strong>{topicNames[strongest.topic]}</strong></p>}
    <p>Növbəti mövzu · <strong>{topicNames[topic]}</strong></p>
    <p>{recommendation(topic)}</p>
    {review.length > 0 && <details className="review"><summary>Yenidən baxılacaq sorğular ({review.length})</summary>
      <ul>{review.map(record => {
        const entry = findCase(record.id)!
        return <li key={record.id}><strong>{entry.title}</strong><p>{entry.lesson}</p></li>
      })}</ul>
    </details>}
    {source === 'idle' || source === 'loading' ? <button onClick={load} disabled={source === 'loading'} className="small-button">{source === 'loading' ? 'Məşqçi cavab hazırlayır…' : 'AI məşqçisinə müraciət et'}</button> :
      <p role="status" className="coach-source">{source === 'ai' ? 'Mövzu AI məşqçisi tərəfindən seçildi.' : 'AI məşqçisi əlçatan deyil. Tövsiyə təlim nəticələrindən hesablandı.'}</p>}
  </section>
}

const endings = {
  positive: ['Kampus qorundu', 'Rektorluq növbə heyətinə təşəkkür etdi. Kampus həm təhlükəsizliyini, həm də tələbələrin etibarını qorudu.'],
  mixed: ['Səhərə qədər nəzarət', 'Təhlükəsizlik masası növbəni başa vurdu. Komanda insidentlərə və xidmətin gecikməsinə səbəb olan qərarları yenidən nəzərdən keçirəcək.'],
  negative: ['Fövqəladə iclas', 'Rəhbərlik ardıcıl qərarların təsirini araşdırır. Bərpa heyəti insidentləri və xidmət fasilələrini qeydiyyata alır.'],
}

export default function Reports() {
  const state = useGame()
  const day = days[state.day - 1]
  const current = decisionsFor(state.decisions, state.day)
  const pre = metrics(decisionsFor(state.decisions, 0))
  const post = metrics(decisionsFor(state.decisions, 4))
  const campaign = state.decisions.filter(item => item.id.startsWith('D'))
  const total = metrics(campaign)
  const lastDay = decisionsFor(state.decisions, state.day - 1)
  const followup = lastDay.filter(item => !item.correct && item.verdict === 'approve').map(item => findCase(item.id)?.followup).find(Boolean)
  const previous = metrics(lastDay)
  const rank = state.xp >= 1400 ? 'Cyber Guardian' : state.xp >= 950 ? 'Defender' : state.xp >= 450 ? 'Analyst' : 'Rookie'
  const badges = [
    campaign.filter(item => item.correct && item.verdict === 'block' && ['domain', 'link'].includes(findCase(item.id)!.category)).length >= 3 && 'Phishing Hunter',
    campaign.filter(item => item.correct && item.verified && item.verificationAppropriate).length >= 3 && 'Zero Trust',
    [1, 2, 3].some(shift => decisionsFor(campaign, shift).filter(item => item.correct && item.verificationAppropriate).length === getCases(shift).length) && 'Perfect Shift',
    campaign.some(item => item.id === 'D3-05' && item.correct && item.verified) && 'Social Engineering Survivor',
  ].filter(Boolean)
  if (state.phase === 'briefing') return <>
    <div className="eyebrow">{day ? 'NÖVBƏ ' + String(state.day).padStart(2, '0') + ' / 03' : 'İKİ MƏKTUB'}</div>
    <h1>{day?.title ?? (state.day === 0 ? 'İlkin sınaq' : 'Son sınaq')}</h1>
    {day && <div className="brief-topic">{day.topic}</div>}
    <p>{day?.intro ?? (state.day === 0 ? 'İlk növbədən əvvəl iki məktuba bax və qərarını ver.' : 'İki yeni məktub gəlib. Öyrəndiklərini istifadə et və öz qərarını ver.')}</p>
    {state.day > 1 && state.day <= 3 && <div className="dispatch"><Radio size={18} /><div><strong>Kampus xəbəri</strong>
      <p>{followup ?? (previous.falseApprovals ? 'Bərpa qrupu əvvəlki növbədə təsdiqlənən şübhəli sorğuları araşdırır.' : previous.falseBlocks ? 'Xidmət masası bloklanan qanuni sorğuları yenidən açmaq üçün müraciət edib.' : 'Əvvəlki növbə insidentsiz başa çatdı.')}</p>
      {previous.falseBlocks > 0 && (followup || previous.falseApprovals > 0) && <p>Xidmət masası bloklanmış qanuni sorğular üçün əlavə baxış istəyir.</p>}
    </div></div>}
    <button className="primary" onClick={state.startShift}>Masaya keç <ArrowRight size={19} /></button>
  </>
  if (state.phase === 'summary') {
    const result = metrics(current)
    const grade = result.correct === result.total && result.appropriateChecks === result.total ? 'A' :
      result.correct >= 4 ? 'B' : result.correct >= 3 ? 'C' : 'D'
    return <>
      <div className="eyebrow">{day ? 'NÖVBƏ HESABATI' : 'QİYMƏTLƏNDİRMƏ'}</div>
      <h1>{day ? 'Növbə tamamlandı' : 'İlkin yoxlama tamamlandı'}</h1>
      {day ? <p>{result.total} məktubdan <strong>{result.correct}</strong>-nə düzgün cavab verdin.</p> : <p>İlkin cavablar yadda saxlanıldı. Müqayisəni təlimin sonunda görəcəksən.</p>}
      <button className="primary" onClick={state.nextShift}>{state.day === 3 ? 'Son sınağa keç' : state.day === 0 ? 'İlk növbəyə keç' : 'Növbəti növbə'} <ArrowRight size={19} /></button>
      {day && <details className="summary-details"><summary>Növbənin nəticələri</summary><div className="report-metrics">
        <div><span>Qiymət</span><strong>{grade}</strong></div><div><span>Düzgün</span><strong>{result.correct}/{result.total}</strong></div>
        <div><span>İnsident</span><strong>{result.falseApprovals}</strong></div><div><span>Yanlış blok</span><strong>{result.falseBlocks}</strong></div>
      </div><div className="dispatch"><ShieldCheck size={19} /><p>Təhlükəsizlik <b>{state.security}</b> · Etibar <b>{state.trust}</b> · <b>{state.xp} XP</b></p></div></details>}
    </>
  }
  if (state.phase === 'report') {
    const change = pre.total ? (post.correct / post.total - pre.correct / pre.total) * 100 : null
    return <>
      <div className="eyebrow">TƏHLÜKƏSİZLİK HESABATI</div>
      <h1>Üç növbənin nəticəsi</h1>
      <p><strong>{total.correct}/{total.total}</strong> düzgün qərar verdin. {post.correct}/{post.total} son sınaq məktubunu düzgün qiymətləndirdin.</p>
      <button className="primary" onClick={state.showEnding}>Sonluğu gör <ArrowRight size={19} /></button>
      <details className="summary-details" open={pre.total > 0}>
        <summary>Ətraflı hesabat</summary>
      <div className="report-metrics">
        <div><span>Düzgün qərar</span><strong>{total.correct}/{total.total}</strong></div>
        <div><span>Təhlükəsizlik</span><strong>{state.security}</strong></div>
        <div><span>Etibar</span><strong>{state.trust}</strong></div>
        <div><span>Təcrübə</span><strong>{state.xp}</strong></div>
      </div>
      <section className="report-block">
        <h2>{change === null ? 'Son sınağın nəticəsi' : 'İlkin və yekun qiymətləndirmə'}</h2>
        {change === null ? <p><strong>{post.correct}/{post.total} düzgün qərar</strong> · {post.appropriateChecks}/{post.total} uyğun yoxlama qərarı</p> : <>
        <table className="report-table"><thead><tr><th scope="col">Göstərici</th><th scope="col">İlkin</th><th scope="col">Yekun</th></tr></thead><tbody>
          <tr><th scope="row">Düzgün qərar</th><td>{pre.correct}/{pre.total}</td><td>{post.correct}/{post.total}</td></tr>
          <tr><th scope="row">Yanlış qərar</th><td>{pre.total - pre.correct}</td><td>{post.total - post.correct}</td></tr>
          <tr><th scope="row">Yanlış təsdiq</th><td>{pre.falseApprovals}</td><td>{post.falseApprovals}</td></tr>
          <tr><th scope="row">Yanlış blok</th><td>{pre.falseBlocks}</td><td>{post.falseBlocks}</td></tr>
          <tr><th scope="row">Uyğun yoxlama qərarı</th><td>{pre.appropriateChecks}/{pre.total}</td><td>{post.appropriateChecks}/{post.total}</td></tr>
        </tbody></table>
        <p>Düzgün cavab payındakı dəyişiklik · <strong>{change > 0 ? '+' : ''}{change} faiz bəndi</strong></p></>}
        <details className="review"><summary>Qiymətləndirmə sorğularının izahı</summary><ul>
          {[...(pre.total ? getCases(0) : []), ...getCases(4)].map(entry => <li key={entry.id}><strong>{entry.title}</strong><p>{entry.lesson}</p></li>)}
        </ul></details>
      </section>
      <section className="report-block">
        <h2><Award size={18} /> {rank}</h2>
        {badges.length ? <div className="flex flex-wrap gap-2">{badges.map(badge => <span className="badge" key={String(badge)}>{badge}</span>)}</div> : <p>Bu təlimdə nişan qazanılmadı.</p>}
      </section>
      <Coach records={campaign} />
      </details>
    </>
  }
  const [title, detail] = endings[ending(state.security, state.trust, campaign)]
  return <>
    <div className="eyebrow">TƏLİMİN SONU · {rank}</div>
    <h1>{title}</h1><p>{detail}</p>
    <div className="dispatch"><ShieldCheck size={19} /><p>{total.correct}/{total.total} düzgün qərar · {total.falseApprovals} insident · {total.falseBlocks} yanlış blok</p></div>
    <button className="primary" onClick={state.reset}>Yeni təlimə başla <ArrowRight size={19} /></button>
  </>
}
