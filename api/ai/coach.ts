import { z } from 'zod'
import { coachInput, coachOutput, practiceTopics } from '../../src/game/coach.ts'

const completion = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1) })
const options = { headers: { 'Cache-Control': 'no-store' } }

export async function coach(request: Request, env = process.env) {
    if (request.method !== 'POST') return Response.json({ error: 'method' }, { ...options, status: 405 })
    const raw = request.headers.get('content-type')?.includes('application/json') ? await request.text().catch(() => '') : ''
    let body: unknown
    if (raw.length <= 1024) {
      try { body = JSON.parse(raw) } catch { /* Invalid JSON is handled by the schema. */ }
    }
    const input = coachInput.safeParse(body)
    if (!input.success) return Response.json({ error: 'invalid-input' }, { ...options, status: 400 })
    const key = env.GROQ_API_KEY
    if (!key) return Response.json({ error: 'unavailable' }, { ...options, status: 503 })
    const allowed = practiceTopics(input.data.skills)
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4500),
        body: JSON.stringify({
          model: env.GROQ_MODEL || 'openai/gpt-oss-20b',
          reasoning_effort: 'low',
          max_completion_tokens: 256,
          messages: [
            { role: 'system', content: 'Choose one permitted defensive practice topic for this fictional training game. Prefer the weakest accuracy among the permitted topics. Return JSON only.' },
            { role: 'user', content: JSON.stringify({ skills: input.data.skills, allowed }) },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'training_topic', strict: true,
              schema: {
                type: 'object', properties: { topic: { type: 'string', enum: allowed } },
                required: ['topic'], additionalProperties: false,
              },
            },
          },
        }),
      })
      if (!response.ok) throw new Error('Provider unavailable')
      const result = completion.parse(await response.json())
      const output = coachOutput.parse(JSON.parse(result.choices[0].message.content))
      if (!allowed.includes(output.topic)) throw new Error('Topic outside training results')
      return Response.json(output, options)
    } catch {
      return Response.json({ error: 'unavailable' }, { ...options, status: 503 })
    }
}

export default { fetch: (request: Request) => coach(request) }
