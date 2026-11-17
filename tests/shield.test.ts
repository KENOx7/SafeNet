import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shieldCoach } from '../api/ai/shield.ts'

const request = (data: unknown) => new Request('http://localhost/api/ai/shield', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

test('Grok coaching sends a fixed topic and a verdict without player-supplied text', async () => {
  const call: typeof fetch = async (url, options) => {
    assert.equal(url, 'https://api.x.ai/v1/responses')
    const body = JSON.parse(String(options?.body))
    assert.equal(body.store, false)
    assert.deepEqual(JSON.parse(body.input), { topic: 'lookalike sender and a password request', correct: false })
    return Response.json({ output: [{ type: 'message', content: [
      { type: 'output_text', text: JSON.stringify({ tip: 'Şübhəli məktubu valideyninə göstər.' }) },
    ] }] })
  }
  const response = await shieldCoach(request({ round: 0, correct: false }), { XAI_API_KEY: 'test' }, call)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { tip: 'Şübhəli məktubu valideyninə göstər.' })
})

test('Grok coaching rejects unexpected input and unsafe output and handles a missing key', async () => {
  assert.equal((await shieldCoach(request({ round: 0, correct: true, message: 'other' }), {})).status, 400)
  assert.equal((await shieldCoach(request({ round: 0, correct: true }), {})).status, 503)
  const call: typeof fetch = async () => Response.json({ output: [{ type: 'message', content: [
    { type: 'output_text', text: JSON.stringify({ tip: 'See https://example.com' }) },
  ] }] })
  assert.equal((await shieldCoach(request({ round: 0, correct: true }), { XAI_API_KEY: 'test' }, call)).status, 503)
})
