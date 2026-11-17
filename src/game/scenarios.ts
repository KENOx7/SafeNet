import { z } from 'zod'
import { assessments, finalShift, firstShift, secondShift } from './caseData.ts'

export const tools = ['domain', 'link', 'identity', 'compare'] as const
export type Tool = typeof tools[number]
export type Verdict = 'approve' | 'block'
export const trustedDomains = ['oyu.example', 'library.oyu.example', 'id.oyu.example', 'help.oyu.example']

const fictionalUrl = z.url().refine(value => {
  const url = new URL(value)
  return url.protocol === 'https:' && url.hostname.endsWith('.example') && !url.username && !url.password
})
export const scenarioSchema = z.object({
  id: z.string().min(1),
  day: z.number().int().min(0).max(4),
  category: z.enum(['domain', 'link', 'identity', 'policy']),
  channel: z.enum(['E-poçt', 'Mesaj', 'QR bildirişi', 'Giriş sorğusu']),
  title: z.string(),
  sender: z.string(),
  address: z.email().refine(value => value.endsWith('.example')),
  message: z.string(),
  link: fictionalUrl.optional(),
  identity: z.string(),
  record: z.string(),
  verification: z.string(),
  needsVerification: z.boolean().default(false),
  verdict: z.enum(['approve', 'block']),
  lesson: z.string(),
  impact: z.number().int().min(1).max(30).default(12),
  followup: z.string().optional(),
  conversation: z.array(z.string()).min(3).optional(),
  priority: z.boolean().default(false),
})
export type Scenario = z.infer<typeof scenarioSchema>
export type ScenarioInput = z.input<typeof scenarioSchema>

export const scholarship = {
  id: 'D1-02', day: 1, category: 'domain', channel: 'E-poçt',
  title: 'Təqaüd hesabının təsdiqi',
  sender: 'Təqaüd şöbəsi', address: 'scholarship@oyu-support.example',
  message: 'Məktubda təqaüdünü saxlamaq üçün hesabını 15 dəqiqə ərzində təsdiqləməyin istənilir.',
  link: 'https://scholarship-review.example/status',
  identity: 'Kataloqda şöbənin ünvanı scholarship@oyu.example kimi qeyd olunub.',
  record: 'Qayda 01 • Təqaüdlə bağlı bildirişlər tələbə portalında da görünür.',
  verification: 'Təqaüd şöbəsi bu gün hesab təsdiqi sorğusu göndərmədiyini bildirdi.',
  verdict: 'block', lesson: 'Məktubun ünvanı məktəbin rəsmi ünvanından fərqli idi. Kimsə səni tələsdirəndə dayan və ünvanı yoxla.',
  impact: 19, followup: 'Təqaüd bildirişinə görə bir neçə tələbə hesabı təhlükəsizlik baxışına alındı.',
} satisfies z.input<typeof scenarioSchema>

export const scenarios = z.array(scenarioSchema).refine(
  entries => new Set(entries.map(entry => entry.id)).size === entries.length,
  'Scenario IDs must be unique.',
).parse([firstShift[0], scholarship, ...firstShift.slice(1), ...secondShift, ...finalShift, ...assessments])
export const getCases = (day: number) => scenarios.filter(entry => entry.day === day)
export const findCase = (id: string) => scenarios.find(entry => entry.id === id)
