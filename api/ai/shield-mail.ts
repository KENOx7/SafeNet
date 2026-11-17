import { z } from 'zod'

const mailCount = 10
const completion = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
})
const mailBatch = z.object({ greetings: z.array(z.string()).length(mailCount) })
const greeting = z.string().trim().min(4).max(72).regex(/^[\p{L} ,!.]+$/u)
const responseOptions = { headers: { 'Cache-Control': 'no-store' } }
let pending = 0
let recentRequests: number[] = []

export async function shieldMail(request: Request, env = process.env) {
  if (request.method !== 'POST') return failure(405)
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return failure(415)
  const key = env.GROQ_API_KEY
  if (!key) return failure(503)

  const now = Date.now()
  recentRequests = recentRequests.filter(time => now - time < 60_000)
  if (pending >= 2 || recentRequests.length >= 12) return failure(429)
  recentRequests.push(now)
  pending += 1
  try {
    const result = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        model: env.GROQ_MODEL || 'openai/gpt-oss-20b',
        reasoning_effort: 'low',
        temperature: 1,
        max_completion_tokens: 750,
        messages: [{
          role: 'system',
          content: 'Write exactly ten short greetings in standard Azerbaijani (az-Latn-AZ) for fictional letters in a children’s game. Each should be a natural email salutation of two to six words, like “Salam, əziz oxucular!” or “Hər vaxtınız xeyir!”. Use only letters, spaces, commas, periods and exclamation marks. Follow these styles in order: friendly, teacher to class, newsletter, formal, affectionate family member, casual, formal, teacher to student, formal, club to members. Vary phrasing and tone. Only greetings. Never include a request, question, name, contact details, instructions, promises or a topic beyond saying hello. Return JSON.',
        }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'mail_greetings',
            strict: true,
            schema: {
              type: 'object',
              properties: { greetings: { type: 'array', items: { type: 'string' } } },
              required: ['greetings'],
              additionalProperties: false,
            },
          },
        },
      }),
    })
    if (!result.ok) return failure(503)
    const { choices } = completion.parse(await result.json())
    const batch = mailBatch.parse(JSON.parse(choices[0].message.content))
    const greetings = batch.greetings.map(line => greeting.safeParse(line).data ?? null)
    if (!greetings.some(Boolean)) return failure(503)
    return Response.json({ greetings }, responseOptions)
  } catch {
    return failure(503)
  } finally {
    pending -= 1
  }
}

function failure(status: number) {
  return Response.json({ error: 'mail-variants-unavailable' }, { ...responseOptions, status })
}

export default { fetch: (request: Request) => shieldMail(request) }
