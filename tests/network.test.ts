import assert from 'node:assert/strict'
import { test } from 'node:test'
import { edgeSeconds, location, nodes, resolve, waves } from '../src/network/rules.ts'

test('defenses intercept matching packets along their route and leave normal traffic alone', () => {
  const [normal, load] = waves[0].packets
  assert.equal(resolve(load, 0.5, { gateway: 'load' }, null), undefined)
  assert.equal(resolve(load, 10, { gateway: 'load' }, null)?.node, 'gateway')
  assert.equal(resolve(load, 10, { mail: 'load' }, null)?.verdict, 'hit')
  assert.equal(resolve(normal, 10, { gateway: 'load', archive: 'mail' }, null)?.verdict, 'delivered')
})

test('the temporary shield covers only its own node and timing window', () => {
  const packet = waves[0].packets[1]
  const arrival = packet.starts + 2 * edgeSeconds
  assert.equal(resolve(packet, arrival, {}, { node: 'web', from: arrival - 1, until: arrival + 1 })?.verdict, 'blocked')
  assert.equal(resolve(packet, arrival + 3, {}, { node: 'web', from: arrival + 0.1, until: arrival + 3 })?.verdict, 'hit')
  assert.equal(resolve(packet, arrival + 3, {}, { node: 'mail', from: 0, until: arrival + 3 })?.verdict, 'hit')
})

test('traffic starts at the inlet and crosses actual cable endpoints', () => {
  const packet = waves[2].packets[0]
  assert.equal(location(packet, -0.1), undefined)
  assert.deepEqual(location(packet, 0), { x: nodes.internet.x, y: nodes.internet.y })
  assert.deepEqual(location(packet, edgeSeconds), { x: nodes.gateway.x, y: nodes.gateway.y })
  assert.deepEqual(location(packet, edgeSeconds * 2), { x: nodes.mail.x, y: nodes.mail.y })
  assert.equal(location(packet, edgeSeconds * 3), undefined)
})
