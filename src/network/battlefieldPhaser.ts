import Phaser from 'phaser'
import { defenses, edges, location, nodes, waves } from './rules.ts'
import type { Defendable, NodeId, PacketKind } from './rules.ts'
import { pixelScale } from './Battlefield.tsx'
import type { BattlefieldSnapshot } from './Battlefield.tsx'

const tones = ['idle', 'armed', 'hurt'] as const
const ids = Object.keys(nodes) as NodeId[]
const packetInk: Record<PacketKind, number> = { normal: 0xa3d5a2, load: 0xf0ad65, mail: 0xe58c76, access: 0xed7165 }

export function createBattlefield(parent: HTMLElement, read: () => BattlefieldSnapshot, select: (node: Defendable) => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  class BattlefieldScene extends Phaser.Scene {
    private cables!: Phaser.GameObjects.Graphics
    private accents!: Phaser.GameObjects.Graphics
    private tokens!: Phaser.GameObjects.Graphics
    private packets: Phaser.GameObjects.Image[] = []
    private routes: Phaser.GameObjects.Image[] = []
    private sprites = new Map<NodeId, Phaser.GameObjects.Sprite>()
    private flashes = new Map<NodeId, { until: number; hit: boolean }>()
    private previous?: BattlefieldSnapshot
    private seen = 0
    private lastWidth = 0
    private lastHeight = 0
    private hadFlash = false

    preload() {
      for (const id of ids) for (const tone of tones) {
        const key = 'node-' + id + '-' + tone
        this.load.image(key, '/network-art/' + key + '.png')
      }
      for (const key of ['traffic', 'hostile', 'cable']) this.load.image(key, '/network-art/' + key + '.png')
    }

    create() {
      this.cables = this.add.graphics()
      this.accents = this.add.graphics().setDepth(3)
      this.tokens = this.add.graphics().setDepth(1)
      this.routes = edges.map(() => this.add.image(0, 0, 'cable').setAlpha(.66))
      for (const id of ids) {
        const sprite = this.add.sprite(0, 0, 'node-' + id + '-idle').setDepth(4)
        if (id !== 'internet') {
          sprite.setInteractive({ useHandCursor: true })
          sprite.on('pointerup', () => select(id))
          sprite.on('pointerover', () => sprite.setTint(0xf4e2b9))
          sprite.on('pointerout', () => sprite.clearTint())
        }
        this.sprites.set(id, sprite)
      }
    }

    update(time: number) {
      if (!this.cables) return
      const snapshot = read()
      const width = this.scale.width
      const height = this.scale.height
      if (snapshot === this.previous && width === this.lastWidth && height === this.lastHeight && !this.hadFlash) return
      const u = pixelScale(width, height)
      const project = (point: { x: number; y: number }) => ({ x: Math.round(point.x / 940 * width), y: Math.round(point.y / 440 * height) })
      const previous = this.previous

      if (!previous || previous.wave !== snapshot.wave || snapshot.outcomes.length < this.seen) {
        this.flashes.clear()
        this.seen = snapshot.outcomes.length
      }
      if (!reduced && previous && ((previous.phase !== 'running' && snapshot.phase === 'running') || previous.wave !== snapshot.wave)) {
        this.cameras.main.flash(230, 100, 123, 95, false)
      }
      for (const outcome of snapshot.outcomes.slice(this.seen)) {
        if (outcome.verdict === 'delivered') continue
        const hit = outcome.verdict === 'hit'
        const p = project(nodes[outcome.node])
        this.flashes.set(outcome.node, { until: time + 465, hit })
        if (!reduced) {
          if (hit) this.cameras.main.shake(155, 0.004)
          for (let index = 0; index < 8; index++) {
            const angle = index * Math.PI / 4
            const particle = this.add.rectangle(p.x, p.y, u * 2, u * 2, hit ? 0xef9b71 : 0xb2e399).setDepth(7)
            this.tweens.add({
              targets: particle, x: p.x + Math.cos(angle) * u * 27, y: p.y + Math.sin(angle) * u * 23,
              alpha: 0, duration: 340, ease: 'Cubic.Out', onComplete: () => particle.destroy(),
            })
          }
        }
      }
      this.seen = snapshot.outcomes.length
      this.previous = snapshot
      this.lastWidth = width
      this.lastHeight = height

      const highlighted = new Set<string>()
      for (const packet of waves[snapshot.wave].packets) if (packet.kind === snapshot.tool) {
        for (let index = 1; index < packet.path.length; index++) highlighted.add(packet.path[index - 1] + ':' + packet.path[index])
      }
      this.cables.clear()
      for (const [index, [from, to]] of edges.entries()) {
        const a = project(nodes[from])
        const b = project(nodes[to])
        const preview = highlighted.has(from + ':' + to)
        this.cables.lineStyle(u * 4, 0x071513).lineBetween(a.x, a.y, b.x, b.y)
        this.routes[index].setPosition((a.x + b.x) / 2, (a.y + b.y) / 2)
          .setRotation(Math.atan2(b.y - a.y, b.x - a.x)).setDisplaySize(Math.hypot(b.x - a.x, b.y - a.y), u * 6)
          .setAlpha(preview ? .98 : .60).setTint(preview ? 0xfbbc70 : 0xb5d9bc)
        if (preview) for (const t of [0.25, 0.5, 0.75]) {
          this.cables.fillStyle(0xf1c587).fillRect(Math.round(a.x + (b.x - a.x) * t), Math.round(a.y + (b.y - a.y) * t) - u * 5, u * 3, u * 2)
        }
      }

      this.tokens.clear()
      this.packets.forEach(image => image.setVisible(false))
      const resolved = new Set(snapshot.outcomes.map(item => item.packet))
      if (snapshot.phase === 'running') for (const packet of waves[snapshot.wave].packets) {
        const position = resolved.has(packet.id) ? undefined : location(packet, snapshot.elapsed)
        if (!position) continue
        const p = project(position)
        const key = packet.kind === 'normal' ? 'traffic' : 'hostile'
        const image = this.packets[packet.id] ?? (this.packets[packet.id] = this.add.image(0, 0, key).setDepth(2).setOrigin(.69, .5))
        image.setTexture(key).setPosition(p.x, p.y).setDisplaySize(u * 23, u * 14).setVisible(true)
        if (packet.kind !== 'normal' && snapshot.elapsed - packet.starts < 0.22) {
          this.tokens.lineStyle(u, packetInk[packet.kind], .7).strokeRect(p.x - u * 8, p.y - u * 7, u * 16, u * 14)
        }
      }

      this.accents.clear()
      this.hadFlash = false
      for (const id of ids) {
        const p = project(nodes[id])
        const sprite = this.sprites.get(id)!
        const installed = id === 'internet' ? undefined : snapshot.installed[id]
        if (id !== 'internet' && installed && previous && previous.installed[id] !== installed) {
          this.flashes.set(id, { until: time + 360, hit: false })
        }
        const flash = this.flashes.get(id)
        const effect = flash && time < flash.until ? flash : undefined
        if (effect) this.hadFlash = true
        else if (flash) this.flashes.delete(id)
        const protectedNode = snapshot.shield?.node === id && snapshot.elapsed < snapshot.shield.until
        const selected = snapshot.target === id
        const tone = effect?.hit ? 'hurt' : installed || protectedNode || effect ? 'armed' : 'idle'
        const vertical = !reduced && effect && !effect.hit ? Math.round(Math.max(0, effect.until - time) / 140) * u : 0
        const frame = sprite.setPosition(p.x, p.y - vertical).setTexture('node-' + id + '-' + tone).frame
        sprite.setDisplaySize(Math.round(frame.realWidth * u / 4.65), Math.round(frame.realHeight * u / 4.65))

        if (selected || protectedNode || effect) {
          const accent = effect?.hit ? 0xeb8869 : protectedNode || effect ? 0xb4d9a0 : 0xe3b276
          const size = u * 23
          const corner = u * 5
          this.accents.fillStyle(accent)
          for (const x of [-size, size - corner]) for (const y of [-size, size - corner]) {
            this.accents.fillRect(p.x + x, p.y + y + (y > 0 ? corner - u : 0), corner, u)
            this.accents.fillRect(p.x + x + (x > 0 ? corner - u : 0), p.y + y, u, corner)
          }
        }
        if (installed) {
          const color = Number.parseInt(defenses[installed].color.slice(1), 16)
          this.accents.fillStyle(0x113028).fillRect(p.x + u * 14, p.y - u * 19, u * 7, u * 7)
          this.accents.fillStyle(color).fillRect(p.x + u * 16, p.y - u * 17, u * 3, u * 3)
        }
      }
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO, parent, transparent: true, pixelArt: true, roundPixels: true,
    width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight),
    scene: BattlefieldScene, scale: { mode: Phaser.Scale.RESIZE },
    input: { keyboard: false, gamepad: false },
  })
}
