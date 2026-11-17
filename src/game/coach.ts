import { z } from 'zod'
import { findCase } from './scenarios.ts'
import type { Decision } from './rules.ts'

export const topicNames = {
  domain: 'Göndərən domeni',
  link: 'Keçid və QR',
  identity: 'Kimlik və müstəqil təsdiq',
  policy: 'Kampus siyasəti',
} as const

const topics = ['domain', 'link', 'identity', 'policy'] as const
export type Topic = typeof topics[number]
const counter = z.object({ topic: z.enum(topics), mistakes: z.number().int().min(0).max(15), correct: z.number().int().min(0).max(15) }).strict()
export const coachInput = z.object({
  skills: z.array(counter).length(4).refine(values => new Set(values.map(value => value.topic)).size === 4),
}).strict()
export const coachOutput = z.object({ topic: z.enum(topics) }).strict()

const advice: Record<Topic, string> = {
  domain: 'Görünən ada əsaslanmadan tam göndərən domenini kataloqdakı ünvanla tutuşdur.',
  link: 'Keçid və QR hədəfinin tam domenini açmadan yoxla. Tanıdığın portala özün daxil ol.',
  identity: 'Kimlik və ya səlahiyyət qeyri-müəyyəndirsə, kataloqdakı rəsmi əlaqə kanalından təsdiq al.',
  policy: 'Giriş sorğusunda bilet nömrəsini, tələb olunan səlahiyyəti və təsdiq imzasını birlikdə yoxla.',
}

export function getSkills(records: Decision[]) {
  return topics.map(topic => {
    const entries = records.filter(record => findCase(record.id)?.category === topic)
    const correct = entries.filter(record => record.correct && record.verificationAppropriate).length
    return { topic, correct, mistakes: entries.length - correct }
  })
}

export function practiceTopics(skills: z.infer<typeof coachInput>['skills']): Topic[] {
  const max = Math.max(...skills.map(skill => skill.mistakes))
  if (max === 0) return ['policy']
  return skills.filter(skill => skill.mistakes === max).map(skill => skill.topic)
}

export function recommendation(topic: Topic) {
  return advice[topic]
}
