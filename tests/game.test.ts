import assert from 'node:assert/strict'
import { test } from 'node:test'
import { coach } from '../api/ai/coach.ts'
import { getSkills } from '../src/game/coach.ts'
import { canChoose, unlocked } from '../src/game/guide.ts'
import { canDecide, ending, getStreak, metrics, score } from '../src/game/rules.ts'
import { findCase, getCases, scenarios } from '../src/game/scenarios.ts'

test('validates five unique fictional cases per shift and two assessment pairs', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(day => getCases(day).length), [2, 5, 5, 5, 2])
  assert.equal(new Set(scenarios.map(item => item.id)).size, scenarios.length)
  for (const item of scenarios) {
    assert.match(item.address, /\.example$/)
    if (item.link) assert.match(new URL(item.link).hostname, /\.example$/)
  }
})

test('scores verdicts, penalties, and appropriate verification separately', () => {
  const scholarship = findCase('D1-02')!
  const mismatch = findCase('D2-02')!
  assert.equal(score(scholarship, 'approve', false, []).security, -19)
  assert.equal(score(scholarship, 'block', false, []).xp, 100)
  assert.equal(score(scholarship, 'block', true, []).verificationAppropriate, false)
  assert.equal(score(mismatch, 'block', false, []).trust, -12)
  assert.equal(score(mismatch, 'approve', true, []).xp, 125)
})

test('guides the first letters with one new tool at a time', () => {
  const state = { checked: [], budget: 3, verified: false, opened: false, pinned: [] }
  const first = findCase('D1-01')!
  assert.deepEqual(unlocked(1, 0).tools, [])
  assert.equal(canChoose(first, state, 'approve'), false)
  assert.equal(canChoose(first, { ...state, opened: true }, 'approve'), true)
  assert.equal(canChoose(first, { ...state, opened: true }, 'block'), false)
  assert.deepEqual(unlocked(1, 1).tools, ['domain'])
  assert.equal(unlocked(1, 1).verify, false)
  assert.equal(canChoose(findCase('D1-02')!, state), false)
  assert.equal(canChoose(findCase('D1-02')!, { ...state, checked: ['domain'] }), false)
  assert.equal(canChoose(findCase('D1-02')!, { ...state, checked: ['domain'], pinned: [1] }), true)
  const reset = findCase('D1-03')!
  assert.equal(canChoose(reset, state), false)
  assert.equal(canChoose(reset, { ...state, verified: true }), true)
  assert.equal(canChoose(reset, { ...state, budget: 0 }), true)
})

test('gates incident resolution on three evidence checks and supports all endings', () => {
  const boss = findCase('D3-05')!
  assert.equal(canDecide(boss, ['domain', 'compare']), false)
  assert.equal(canDecide(boss, ['domain', 'compare', 'identity']), true)
  const search = { checked: ['domain', 'compare', 'identity'] as const, budget: 0, verified: false, opened: true }
  assert.equal(canChoose(boss, { ...search, checked: [...search.checked], pinned: [0] }), false)
  assert.equal(canChoose(boss, { ...search, checked: [...search.checked], pinned: [2, 0] }), true)
  const perfect = scenarios.filter(item => item.day >= 1 && item.day <= 3).map(item => score(item, item.verdict, item.needsVerification, []))
  assert.equal(metrics(perfect).correct, 15)
  assert.equal(getStreak(perfect), 15)
  assert.equal(getStreak([...perfect, score(boss, 'approve', false, [])]), 0)
  assert.equal(ending(100, 100, perfect), 'positive')
  assert.equal(ending(80, 90, perfect), 'mixed')
  assert.equal(ending(54, 100, perfect), 'negative')
  assert.equal(ending(100, 54, perfect), 'negative')
})

test('coach fails safely with no key and rejects malformed input', async () => {
  const request = (body: unknown) => new Request('http://localhost/api/ai/coach', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  assert.equal((await coach(request({ unrelated: 1 }), {})).status, 400)
  assert.equal((await coach(request({ skills: getSkills([]) }), {})).status, 503)
})

test('coach validates structured provider output against supported training topics', async t => {
  const input = { skills: getSkills([]) }
  const request = () => new Request('http://localhost/api/ai/coach', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  })
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({
    choices: [{ message: { content: JSON.stringify({ topic: 'policy' }) } }],
  }))
  const env = { GROQ_API_KEY: 'fixture' }
  assert.deepEqual(await (await coach(request(), env)).json(), { topic: 'policy' })
  mock.mock.mockImplementation(async () => Response.json({
    choices: [{ message: { content: JSON.stringify({ topic: 'identity' }) } }],
  }))
  assert.equal((await coach(request(), env)).status, 503)
})
