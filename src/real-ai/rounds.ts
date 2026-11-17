export const subjects = {
  cat: {
    title: 'Şən pişik', hint: 'Gözləri və pəncələri say.',
    ai: 'Pişiyin üzündə iki göz, alnının ortasında isə bir göz də görünür.',
    normal: 'Pişiyin üzünün hər tərəfində bir göz var. Alnındakı tünd xətlər tük naxışıdır.',
    lesson: 'Gözləri bir-bir say və alnındakı tük naxışını gözlə qarışdırma.',
    focus: { ai: [53, 20, 13, 10], normal: [53, 27, 20, 12] },
  },
  kid: {
    title: 'Futbol oyunu', hint: 'Uşağın əllərinə və topun formasına bax.',
    ai: 'Uşağın iki əli belindədir. Şəklin sağında, çiyninin üstündə bir əl də görünür.',
    normal: 'Uşağın iki əli belindədir. Ayağının yanındakı futbol topu yuvarlaq formasını saxlayır.',
    lesson: 'Əlləri say və hər əlin hansı qola birləşdiyinə bax.',
    focus: { ai: [57, 23, 15, 13], normal: [47, 41, 32, 12] },
  },
  landscape: {
    title: 'Dağ mənzərəsi', hint: 'Göyə və dağların aşağı hissəsinə bax.',
    ai: 'Dağların üstündə, səmanın ortasında bir qaya parçası havada asılı qalıb. Səmada iki günəş də görünür.',
    normal: 'Dağların yamacları aşağıdakı meşəyə doğru uzanır. Səmada bir günəş görünür.',
    lesson: 'Mənzərədə qayanın və dağın yerə necə birləşdiyinə bax.',
    focus: { ai: [54, 23, 35, 22], normal: [54, 45, 49, 23] },
  },
  house: {
    title: 'Rəngli ev', hint: 'Damın xəttinə, bacaya və pəncərələrə bax.',
    ai: 'Qırmızı damın kənarı dalğa kimi bükülür. Yuxarıdakı pəncərə də yana əyilib.',
    normal: 'Qırmızı damın kənarları düz xətt boyunca gedir. Baca və pəncərə də yerlərində düz dayanır.',
    lesson: 'Damın kənarını gözünlə izlə və yaxınlıqdakı pəncərənin formasına bax.',
    focus: { ai: [51, 35, 62, 32], normal: [51, 33, 61, 29] },
  },
  dog: {
    title: 'Balaca it', hint: 'İtin başının üst hissəsinə bax.',
    ai: 'İtin sağında və solunda bir qulaq var. Başının üstündə bir qulaq da görünür.',
    normal: 'İtin başının hər tərəfində bir qulaq sallanır. Başının üstündə ağ tük görünür.',
    lesson: 'Başın hər iki tərəfinə və təpəsinə baxıb qulaqları say.',
    focus: { ai: [62, 12, 18, 14], normal: [52, 21, 52, 23] },
  },
  cake: {
    title: 'Ad günü tortu', hint: 'Tortun ön tərəfinə və üstündəki bəzəklərə bax.',
    ai: 'Tortun önündə mavi göz və içəridən işıq gələn balaca qapı görünür.',
    normal: 'Tortun üstündə şamlar var. Ön tərəfdəki ağ və sarı detallar çiçək bəzəkləridir.',
    lesson: 'Tortun önünə bax və adi bəzəklərlə nağıl detallarını ayırd et.',
    focus: { ai: [48, 71, 37, 28], normal: [48, 66, 54, 22] },
  },
} as const

type Subject = keyof typeof subjects
export type Variant = 'ai' | 'normal'
export type Round = { subject: Subject; variant: Variant }
export const roundCount = 6

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    const item = items[index]
    items[index] = items[other]
    items[other] = item
  }
  return items
}

export function makeRounds(): Round[] {
  const order = shuffle(Object.keys(subjects) as Subject[])
  const variants = shuffle<Variant>(['ai', 'ai', 'ai', 'normal', 'normal', 'normal'])
  return order.map((subject, index) => ({ subject, variant: variants[index] }))
}
