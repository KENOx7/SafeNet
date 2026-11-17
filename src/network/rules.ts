export const nodes = {
  internet: { name: 'İnternet', x: 115, y: 220 },
  gateway: { name: 'Giriş', x: 333, y: 220 },
  web: { name: 'Veb server', x: 569, y: 110 },
  mail: { name: 'Poçt serveri', x: 569, y: 330 },
  archive: { name: 'Arxiv', x: 823, y: 220 },
} as const

export type NodeId = keyof typeof nodes
export type Defendable = Exclude<NodeId, 'internet'>
export type Threat = 'load' | 'mail' | 'access'
export type PacketKind = Threat | 'normal'
export type Installations = Partial<Record<Defendable, Threat>>

export const defenses = {
  load: { name: 'Trafik filtri', stops: 'Yük hücumunu saxlayır', price: 60, damage: 1, color: '#f1b16f' },
  mail: { name: 'Poçt sipəri', stops: 'Saxta məktubu saxlayır', price: 75, damage: 1, color: '#d99bd9' },
  access: { name: 'Giriş kilidi', stops: 'İcazəsiz girişi saxlayır', price: 90, damage: 2, color: '#f18280' },
} as const satisfies Record<Threat, { name: string; stops: string; price: number; damage: number; color: string }>

export const packetNames: Record<PacketKind, string> = {
  load: 'Yük hücumu', mail: 'Saxta məktub', access: 'İcazəsiz giriş', normal: 'Adi trafik',
}

export interface Packet {
  id: number
  starts: number
  kind: PacketKind
  path: NodeId[]
}

function wavePackets(items: [number, PacketKind, 'web' | 'mail', boolean?][]): Packet[] {
  return items.map(([starts, kind, branch, toArchive], id) => ({
    id, starts, kind, path: ['internet', 'gateway', branch, ...(toArchive ? ['archive'] as const : [])],
  }))
}

export const waves = [
  {
    name: 'Girişdə sıxlıq',
    brief: 'Veb xəttinə yük hücumu gəlir. Trafik filtrini həmin marşruta qoy.',
    packets: wavePackets([[0, 'normal', 'mail', true], [0.65, 'load', 'web'], [1.45, 'load', 'web'], [2.2, 'normal', 'web', true], [2.85, 'load', 'web'], [3.65, 'normal', 'mail']]),
  },
  {
    name: 'Saxta poçt',
    brief: 'Veb və poçt xətlərinə hücum gəlir. Hər xətti uyğun alətlə qoru.',
    packets: wavePackets([[0, 'mail', 'mail'], [0.65, 'normal', 'web', true], [1.35, 'load', 'web'], [2.05, 'mail', 'mail'], [2.85, 'normal', 'mail'], [3.55, 'load', 'web'], [4.3, 'mail', 'mail']]),
  },
  {
    name: 'Arxivi qoru',
    brief: 'Giriş cəhdləri iki yoldan arxivə gəlir. Ortaq qovşağı qoru.',
    packets: wavePackets([[0, 'access', 'mail', true], [0.55, 'normal', 'web', true], [1.05, 'load', 'web'], [1.55, 'mail', 'mail'], [2.2, 'access', 'web', true], [2.85, 'load', 'web'], [3.5, 'mail', 'mail'], [4.05, 'access', 'mail', true], [4.8, 'normal', 'mail', true]]),
  },
]

export const edgeSeconds = 1.45
export const maxHealth = 6
export const reward = 95
export const edges: [NodeId, NodeId][] = [
  ['internet', 'gateway'], ['gateway', 'web'], ['gateway', 'mail'], ['web', 'archive'], ['mail', 'archive'],
]

export interface Outcome {
  packet: number
  node: NodeId
  time: number
  verdict: 'blocked' | 'hit' | 'delivered'
}

export interface Shield {
  node: Defendable
  until: number
  from: number
}

export function resolve(packet: Packet, elapsed: number, installed: Installations, shield: Shield | null): Outcome | undefined {
  for (let index = 1; index < packet.path.length; index++) {
    const time = packet.starts + edgeSeconds * index
    if (time > elapsed) return
    const node = packet.path[index]
    const intercepted = packet.kind !== 'normal' && node !== 'internet' && (
      installed[node] === packet.kind || (shield?.node === node && shield.from <= time && shield.until >= time)
    )
    if (intercepted) return { packet: packet.id, node, time, verdict: 'blocked' }
    if (index === packet.path.length - 1) return {
      packet: packet.id, node, time, verdict: packet.kind === 'normal' ? 'delivered' : 'hit',
    }
  }
}

export function location(packet: Packet, elapsed: number) {
  const edge = (elapsed - packet.starts) / edgeSeconds
  if (edge < 0 || edge >= packet.path.length - 1) return
  const index = Math.floor(edge)
  const t = edge - index
  const start = nodes[packet.path[index]]
  const end = nodes[packet.path[index + 1]]
  return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t }
}
