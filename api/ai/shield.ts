import { z } from 'zod'

const topics = [
  'lookalike sender and a password request',
  'an expected school trip notice; verify through the known school channel',
  'an expected library reading list; verify the subscription separately',
  'a false deadline and a password request',
  'an ordinary family message; verify unexpected requests by calling the known number',
  'an unsolicited executable attachment; do not open it',
  'a fake prize asking for private information',
  'an expected lesson notice; use a known saved address to check it',
  'an impersonated account alert asking for passwords',
  'an expected club schedule; confirm through the known club channel',
] as const

const input = z.object({ round: z.number().int().min(0).max(topics.length - 1), correct: z.boolean() }).strict()
const output = z.object({ tip: z.string().trim().min(12).max(240) }).strict()
const provider = z.object({ output: z.array(z.object({
  type: z.string(),
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
})) })

const options = { headers: { 'Cache-Control': 'no-store' } }
let windowStart = 0
let used = 0

export async function shieldCoach(request: Request, env = process.env, callProvider = fetch) {
  if (request.method !== 'POST') return Response.json({}, { ...options, status: 405 })
  if (!request.headers.get('content-type')?.startsWith('application/json')) return Response.json({}, { ...options, status: 415 })
  const raw = await request.text().catch(() => '')
  let payload: unknown
  try { if (raw.length <= 256) payload = JSON.parse(raw) } catch { /* Schema rejects malformed JSON. */ }
  const data = input.safeParse(payload)
  if (!data.success) return Response.json({}, { ...options, status: 400 })
  const key = env.XAI_API_KEY?.trim()
  if (!key) return Response.json({}, { ...options, status: 503 })

  const now = Date.now()
  if (now - windowStart >= 60_000) {
    windowStart = now
    used = 0
  }
  if (used >= 30) return Response.json({}, { ...options, status: 429 })
  used++

  try {
    const result = await callProvider('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(7500),
      body: JSON.stringify({
        model: env.XAI_MODEL?.trim() || 'grok-4.7',
        store: false,
        reasoning: { effort: 'low' },
        max_output_tokens: 480,
        instructions: 'You coach Azerbaijani children in a fictional email-safety game. Respond with one or two short Azerbaijani sentences, at most 240 characters, based only on the supplied topic and whether the player identified it. Give one concrete defensive action. Never claim that a domain extension, familiar name, or absence of a link proves safety. No links, addresses, credentials, markup, offensive instructions or requests for personal information. Do not change the game verdict.',
        input: JSON.stringify({ topic: topics[data.data.round], correct: data.data.correct }),
        text: { format: {
          type: 'json_schema', name: 'defensive_tip', strict: true,
          schema: { type: 'object', required: ['tip'], additionalProperties: false, properties: { tip: { type: 'string' } } },
        } },
      }),
    })
    if (!result.ok) throw new Error('Provider unavailable')
    const response = provider.parse(await result.json())
    const message = response.output.find(item => item.type === 'message')
    const text = message?.content?.find(item => item.type === 'output_text')?.text
    if (!text) throw new Error('Empty coaching response')
    const tip = output.parse(JSON.parse(text))
    if (/[<>@:/\\\x60]|\bwww\b|[\p{L}\d-]+\.[\p{L}]{2,}/iu.test(tip.tip)) throw new Error('Unsupported coaching content')
    return Response.json(tip, options)
  } catch {
    return Response.json({}, { ...options, status: 503 })
  }
}

export default { fetch: (request: Request) => shieldCoach(request) }
