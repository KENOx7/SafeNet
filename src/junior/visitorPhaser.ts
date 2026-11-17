import Phaser from 'phaser'
import { characterNames, characterPath } from './cases.ts'
import type { VisitorPresentation } from './VisitorScene.tsx'

export function createVisitorScene(parent: HTMLElement, read: () => VisitorPresentation, inspect: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  class Visitor extends Phaser.Scene {
    private person!: Phaser.GameObjects.Image
    private backdrop!: Phaser.GameObjects.Graphics
    private previous?: VisitorPresentation
    private lastWidth = 0
    private lastHeight = 0

    preload() {
      for (const character of characterNames) this.load.image(character, characterPath(character))
    }
    create() {
      this.backdrop = this.add.graphics()
      this.person = this.add.image(0, 0, read().character).setOrigin(.5, 1).setInteractive({ useHandCursor: true })
      this.person.on('pointerup', inspect)
      parent.classList.add('ready')
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => parent.classList.remove('ready'))
    }
    update() {
      if (!this.person) return
      const state = read()
      const w = this.scale.width
      const h = this.scale.height
      if (state === this.previous && w === this.lastWidth && h === this.lastHeight) return
      const changedVisitor = state.id !== this.previous?.id
      const resized = w !== this.lastWidth || h !== this.lastHeight
      if (changedVisitor || resized) {
        this.tweens.killTweensOf(this.person)
        this.person.setTexture(state.character)
        const scale = Math.min(w * .86 / this.person.width, h * .98 / this.person.height)
        this.person.setScale(scale).setPosition(w * .5, h + 2).setAlpha(1).setAngle(0)
        if (!reduced && changedVisitor) this.tweens.add({ targets: this.person, y: { from: h + 90, to: h + 2 }, alpha: { from: 0, to: 1 }, duration: 450, ease: 'Back.Out' })
        const g = this.backdrop.clear()
        g.fillStyle(0x7fa495, .06).fillCircle(w / 2, h, h * .95)
        g.lineStyle(1, 0xadc8bd, .4).strokeCircle(w / 2, h, h * 1.12)
        g.fillStyle(0xdceadf, .6).fillCircle(w * .15, h * .33, 5).fillCircle(w * .82, h * .43, 3)
      }
      if (state.feedback && state.feedback !== this.previous?.feedback && !reduced) {
        const color = state.feedback === 'success' ? 0x84bea0 : 0xdca27d
        const badge = this.add.circle(w * .78, h * .24, 25, color).setAlpha(.9)
        this.tweens.add({ targets: badge, scale: 1.8, alpha: 0, duration: 500, onComplete: () => badge.destroy() })
      }
      this.previous = state
      this.lastWidth = w
      this.lastHeight = h
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO, parent, width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight),
    // React changes the host width when feedback opens. ResizeObserver owns sizing;
    // Phaser RESIZE would restore its cached parent size during refresh.
    transparent: true, scene: Visitor, scale: { mode: Phaser.Scale.NONE },
    fps: { target: 30 }, input: { keyboard: false, gamepad: false },
  })
}
