import type { Scenario, Tool, Verdict } from './scenarios.ts'

export const days = [
  { title: 'İlk növbə', topic: 'Fişinq və etibarlı mənbələr', intro: 'Növbənin ilk axşamıdır. Kampusdan gələn məktubları nəzərdən keçir. Vaxt təzyiqi hiss etdikdə göndərən ünvanını və keçidin hara apardığını yoxla.' },
  { title: 'Etibar sınağı', topic: 'Kimlik və səlahiyyət', intro: 'Bu gecə tanış adlar və vəzifələr kifayət etməyəcək. Müraciəti ünvanla, kimliyi isə müstəqil kanalla tutuşdur.' },
  { title: 'Kampus hücum altında', topic: 'Əlaqəli hadisələr', intro: 'Təhlükəsizlik masasına eyni hadisə haqqında fərqli məlumatlar gəlir. Son sorğuda sənədləri və növbətçinin cavabını birlikdə qiymətləndir.' },
]

export const policies = [
  ['01', 'Göndərən ünvanı', 'Görünən ad kimliyi təsdiqləmir. Tam domeni təsdiqlənmiş domen siyahısı ilə müqayisə et.'],
  ['02', 'Keçid və QR', 'Saytı açmadan hədəf domenə bax. Hesab əməliyyatını tanıdığın portal vasitəsilə başlat.'],
  ['03', 'Şifrə və birdəfəlik kod', 'Texniki dəstək heç vaxt çat, zəng və ya e-poçt vasitəsilə birdəfəlik kod istəmir.'],
  ['04', 'Müstəqil təsdiq', 'Şübhə qalırsa, rəsmi kataloqdakı nömrəyə və ya daxili qeydiyyat sisteminə müraciət et.'],
  ['05', 'Fövqəladə giriş', 'Müvəqqəti giriş üçün uyğun bilet, təsdiqlənmiş növbətçi və qeydə alınmış səlahiyyət tələb olunur.'],
] as const
const introductions = { '01': 0, '02': 0, '03': 2, '04': 0, '05': 3 }
export const policiesFor = (day: number) => policies.filter(([id]) => introductions[id] <= day)

export const toolNames: Record<Tool, string> = {
  domain: 'Domeni yoxla', link: 'Keçidi yoxla', identity: 'Kimliyi yoxla', compare: 'Dəlilləri müqayisə et',
}

export const bossChecks = ['domain', 'identity', 'compare'] as const
export function canDecide(entry: Scenario, checked: Tool[]) {
  return !entry.priority || bossChecks.every(tool => checked.includes(tool))
}

export interface Decision {
  id: string
  verdict: Verdict
  correct: boolean
  verified: boolean
  verificationAppropriate: boolean
  checked: Tool[]
  security: number
  trust: number
  xp: number
}

export function score(entry: Scenario, verdict: Verdict, verified: boolean, checked: Tool[]): Decision {
  const correct = verdict === entry.verdict
  return {
    id: entry.id, verdict, correct, verified, checked,
    verificationAppropriate: verified === entry.needsVerification,
    security: verdict === 'approve' && !correct ? -entry.impact : verdict === 'block' && correct ? 2 : 0,
    trust: verdict === 'block' && !correct ? -entry.impact : verdict === 'approve' && correct ? 2 : 0,
    xp: correct ? 100 + (verified && entry.needsVerification ? 25 : 0) : 0,
  }
}

export function getStreak(records: Decision[]) {
  let streak = 0
  for (const decision of records) {
    if (decision.id.startsWith('D')) streak = decision.correct ? streak + 1 : 0
  }
  return streak
}

export function metrics(records: Decision[]) {
  return {
    total: records.length,
    correct: records.filter(item => item.correct).length,
    falseApprovals: records.filter(item => !item.correct && item.verdict === 'approve').length,
    falseBlocks: records.filter(item => !item.correct && item.verdict === 'block').length,
    appropriateChecks: records.filter(item => item.verificationAppropriate).length,
  }
}

export function ending(security: number, trust: number, records: Decision[]) {
  const result = metrics(records)
  if (security >= 85 && trust >= 85 && result.correct >= 14) return 'positive'
  if (security >= 55 && trust >= 55) return 'mixed'
  return 'negative'
}
