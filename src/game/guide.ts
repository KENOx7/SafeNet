import type { Scenario, Tool, Verdict } from './scenarios.ts'
import { canDecide } from './rules.ts'
import { hasProof } from './proofs.ts'

const lessons = {
  'D1-01': { title: 'İlk çatdırılma', note: 'Kitabxana yalnız iş saatını xəbər verir. Məktubu aşağıdakı yaşıl qutuya sürüklə.' },
  'D1-02': { title: 'Yeni bacarıq · Ünvanı yoxla', note: 'Göndərənin ünvanını yoxla, ipucunu seç və məktubu uyğun qutuya göndər.', tool: 'domain' },
  'D1-03': { title: 'Yeni bacarıq · Kömək istə', note: 'Əmin deyilsənsə, “Yoxlat” düyməsini seç. Məktəb sənə cavab verəcək və bir yoxlama haqqın azalacaq.', verify: true },
  'D1-04': { title: 'Yeni bacarıq · Kimdir?', note: 'Göndərən özünü məktəb işçisi kimi təqdim edir. Adını məktəbin siyahısında axtar.', tool: 'identity' },
  'D1-05': { title: 'Yeni bacarıq · Keçid hara aparır?', note: 'Keçid səni bir səhifəyə aparan ünvandır. Düyməyə basıb səhifənin ünvanına bax.', tool: 'link' },
  'D2-01': { title: 'Yeni bacarıq · Söhbətdə təhlükəsizlik', note: 'Söhbəti aç və bu sorğu üçün rəsmi nömrə olub-olmadığını soruş. Şifrə və giriş kodunu gizli saxla.' },
  'D2-02': { title: 'Yeni bacarıq · Məlumatları tutuşdur', note: 'Məktubun dediyini məktəbin öz qeydi ilə müqayisə et. Fərq görsən, kömək istəyə bilərsən.', tool: 'compare' },
  'D2-03': { title: 'Yeni alət · Yaddaş kitabçası', note: 'Əvvəlki qaydaları xatırlamaq istəsən, aşağıdakı kitabçanı aç.' },
} satisfies Record<string, { title: string; note: string; tool?: Tool; verify?: boolean }>

export function lessonFor(id: string): { title: string; note: string; tool?: Tool; verify?: boolean } | undefined {
  return lessons[id as keyof typeof lessons]
}

export function unlocked(day: number, index: number) {
  if (day === 0) return { tools: ['domain', 'identity', 'link', 'compare'] as Tool[], verify: true, rulebook: false }
  const stage = (day - 1) * 5 + index
  const tools: Tool[] = []
  if (stage >= 1) tools.push('domain')
  if (stage >= 3) tools.push('identity')
  if (stage >= 4) tools.push('link')
  if (stage >= 6) tools.push('compare')
  return { tools, verify: stage >= 2, rulebook: stage >= 7 }
}

export function canChoose(entry: Scenario, state: {
  checked: Tool[]; opened: boolean; verified: boolean; budget: number; pinned: number[]
}, verdict?: Verdict) {
  if (!canDecide(entry, state.checked) || !hasProof(entry.id, state.pinned)) return false
  if (entry.id === 'D1-01' && (!state.opened || verdict === 'block')) return false
  const lesson = lessonFor(entry.id)
  if (lesson?.tool && !state.checked.includes(lesson.tool)) return false
  return !lesson?.verify || state.verified || state.budget === 0
}
