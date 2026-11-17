import Phaser from 'phaser'
import type { DeskEvent, DeskPresentation } from './DeskScene.tsx'
import type { Verdict } from '../game/scenarios.ts'

const width = 980
const height = 180
const center = { x: 490, y: 90 }

export function createDesk(parent: HTMLElement, dispatch: (event: DeskEvent) => void, read: () => DeskPresentation) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  class Desk extends Phaser.Scene {
    create() {
      const board = this.add.graphics()
      board.fillStyle(0x312324).fillRect(0, 0, width, height)
      board.fillStyle(0x56382d).fillRect(0, 10, width, 151)
      for (let row = 21; row < 160; row += 14) {
        board.fillStyle(row % 3 === 0 ? 0x694535 : 0x463029).fillRect(0, row, width, 2)
        for (let x = row * 3 % 70; x < width; x += 110) board.fillStyle(0x744b37, 0.5).fillRect(x, row + 5, 65, 2)
      }
      board.fillStyle(0x8f6044).fillRect(0, 159, width, 3)
      board.fillStyle(0x201820).fillRect(0, 171, width, 9)

      const label = (x: number, y: number, text: string, size: number, color: string) =>
        this.add.text(x, y, text, { fontFamily: 'Consolas, monospace', fontSize: size, fontStyle: 'bold', color }).setOrigin(0.5)

      const makeTray = (x: number, verdict: Verdict, title: string, color: number, ink: string) => {
        const shadow = this.add.rectangle(x + 4, 97, 229, 110, 0x211a20)
        const box = this.add.rectangle(x, 90, 229, 110, color).setStrokeStyle(3, 0xb08b65)
        const slot = this.add.rectangle(x, 69, 197, 28, 0x101518).setStrokeStyle(2, color)
        const text = label(x, 116, title, 19, ink)
        const zone = this.add.zone(x, 90, 229, 110).setRectangleDropZone(229, 110)
        const visual = [shadow, box, slot, text]
        return { verdict, zone, box, visual, color }
      }

      const trays = [
        makeTray(218, 'approve', '✓  GÖNDƏR', 0x315b49, '#daf0c5'),
        makeTray(762, 'block', '×  KARANTİN', 0x743e3b, '#f8d1bc'),
      ]

      const graphics = this.make.graphics({ x: 0, y: 0 }, false)
      graphics.fillStyle(0x39262b).fillRect(6, 8, 162, 101)
      graphics.fillStyle(0xd7b68b).fillRect(0, 0, 158, 99)
      graphics.fillStyle(0xf9e2ad).fillRect(3, 3, 152, 91)
      graphics.lineStyle(2, 0xa5805d)
      graphics.lineBetween(4, 4, 79, 57)
      graphics.lineBetween(79, 57, 155, 4)
      graphics.lineBetween(4, 93, 58, 42)
      graphics.lineBetween(155, 93, 101, 42)
      graphics.generateTexture('dispatch-letter', 168, 109)
      graphics.destroy()

      const letter = this.add.sprite(center.x, center.y, 'dispatch-letter').setDepth(5).setInteractive({ useHandCursor: true })
      const seal = label(center.x - 3, center.y + 6, '●', 23, '#994e37').setDepth(6)
      const status = label(center.x, 154, '', 13, '#ffe1a8').setDepth(7)
      let state = read()
      let moving = false
      let settled = true
      let stamped = false

      const place = (x = center.x, y = center.y) => {
        letter.setPosition(x, y)
        seal.setPosition(x - 3, y + 6)
      }

      const clearTray = () => trays.forEach(tray => tray.box.setStrokeStyle(3, 0xb08b65))
      const render = (current: DeskPresentation) => {
        if (current.caseId !== state.caseId) {
          this.tweens.killTweensOf(letter)
          place()
          letter.setAlpha(1).setScale(1)
          seal.setVisible(true)
          settled = true
          stamped = false
          clearTray()
        }
        state = current
        const canDrag = current.status === 'ready'
        letter.setTint(current.status === 'inspect' ? 0xb4a58e : 0xffffff)
        this.input.setDraggable(letter, canDrag)
        const interactive = canDrag || current.status === 'sealed'
        if (interactive) letter.setInteractive({ useHandCursor: true })
        else letter.disableInteractive()
        for (const tray of trays) {
          const visible = tray.verdict !== 'block' || current.canBlock
          tray.visual.forEach(object => object.setVisible(visible).setAlpha(canDrag || current.status === 'done' ? 1 : 0.48))
          tray.zone.input!.enabled = visible && canDrag
        }

        if (current.outcome && !stamped) {
          stamped = true
          const destination = trays.find(tray => tray.verdict === current.outcome!.verdict)!
          const targetX = destination.zone.x
          seal.setVisible(false)
          const color = current.outcome.correct === undefined ? 0xf0d0a1 : current.outcome.correct ? 0xcde597 : 0xf9a780
          destination.box.setStrokeStyle(3, color)
          place(targetX, 69)
          letter.setScale(0.62).setAlpha(0.35)
          if (!reduced) {
            this.tweens.add({ targets: letter, scale: { from: 0.94, to: 0.62 }, duration: 250, ease: 'Back.In' })
            for (let index = 0; index < 10; index++) {
              const piece = this.add.rectangle(targetX, 70, 6, 5, color).setDepth(8)
              const angle = index * Math.PI / 5
              this.tweens.add({ targets: piece, x: targetX + Math.cos(angle) * 105, y: 70 + Math.sin(angle) * 59, angle: 110, alpha: 0, duration: 440, onComplete: () => piece.destroy() })
            }
            if (current.outcome.correct === false) this.cameras.main.shake(120, 0.004)
          }
        }
        status.setText(current.status === 'sealed' ? 'ZƏRFİ AÇ' : current.status === 'inspect' ? 'ƏVVƏL İPUCUNA BAX' :
          current.status === 'ready' ? 'MƏKTUBU QUTUYA SÜRÜKLƏ' : current.outcome?.correct ? 'QƏRAR DÜZGÜNDÜR' : 'QƏRAR QEYD OLUNDU')
      }

      letter.on('pointerup', () => { if (!moving && state.status === 'sealed') dispatch('open') })
      letter.on('dragstart', () => { settled = false; moving = true })
      letter.on('drag', (_pointer: unknown, x: number, y: number) => place(x, y))
      letter.on('dragenter', (_pointer: unknown, zone: Phaser.GameObjects.Zone) => {
        trays.find(tray => tray.zone === zone)?.box.setStrokeStyle(4, 0xffdca0)
      })
      letter.on('dragleave', clearTray)
      letter.on('drop', (_pointer: unknown, zone: Phaser.GameObjects.Zone) => {
        const tray = trays.find(candidate => candidate.zone === zone)
        if (tray && state.status === 'ready') {
          settled = true
          dispatch(tray.verdict)
        }
      })
      letter.on('dragend', () => {
        moving = false
        clearTray()
        if (!settled) place()
      })
      render(state)
      this.game.events.on('desk:render', render)
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off('desk:render', render))
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO, parent, width, height, scene: Desk, transparent: true,
    pixelArt: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 30 },
    input: { keyboard: false, gamepad: false },
  })
}
