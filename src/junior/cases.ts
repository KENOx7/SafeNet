import { z } from 'zod'

export const characterNames = ['ranger', 'mia', 'hood', 'streamer', 'student', 'mentor', 'gamer', 'stranger'] as const
export type Character = typeof characterNames[number]
export const characterPath = (name: Character) => '/junior-art/' + name + '.png'

const visitorSchema = z.object({
  id: z.string(),
  character: z.enum(characterNames),
  name: z.string(),
  age: z.string(),
  friend: z.boolean(),
  message: z.string(),
  safe: z.boolean(),
  explanation: z.string(),
  badge: z.string(),
  clue: z.string(),
  replies: z.array(z.string()).length(3).optional(),
  reply: z.number().int().min(0).max(2).optional(),
})

export const shifts = [
  { title: 'İlk növbən', subject: 'Şəxsi məlumatını qoru', briefing: 'Qonağın hesab kartına və mesajına bax. Mesajdakı ipucunu işarələ, sonra təhlükəsiz olub-olmadığına qərar ver.' },
  { title: 'Hədiyyənin sirri', subject: 'Keçidlər və parollar', briefing: 'Bu gün pulsuz hədiyyələr və kömək təklifləri gəlir. Hesabını qorumaq üçün yeni qaydaları öyrən.' },
  { title: 'Diqqətli baxış', subject: 'Yeni hesablar, köhnə dostlar', briefing: 'Bir hesabın yaşı hər şeyi demir. Hər dəfə mesajda nə istənildiyinə bax.' },
] as const

export const rules = [
  { day: 0, title: 'Şəklini qoru', text: 'Tanımadığın biri şəxsi şəklini istəyirsə, paylaşma və etibar etdiyin böyüyə xəbər ver.' },
  { day: 0, title: 'Ünvanın özəl qalsın', text: 'Məktəbini, ev ünvanını və görüş yerini yad biri ilə paylaşma.' },
  { day: 0, title: 'Oyun söhbəti', text: 'Şəxsi məlumat istəməyən oyun söhbətini və xoş arzunu qəbul edə bilərsən.' },
  { day: 1, title: 'Hədiyyəyə tələsmə', text: 'Qəfil pulsuz hədiyyə vəd edən naməlum keçidi açma. Əvvəlcə böyüklə yoxla.' },
  { day: 1, title: 'Şifrə və giriş kodu', text: 'Şifrəni və birdəfəlik giriş kodunu söhbətdə heç kimə vermə.' },
  { day: 2, title: 'Yeni hesabı yoxla', text: 'Yeni hesab və şəxsi sual birlikdə xəbərdarlıqdır. Qərarı mesajın nə istədiyinə görə ver.' },
] as const

export const visitors = z.array(z.array(visitorSchema).length(4)).length(3).parse([
  [
    { id: 'J1-1', character: 'streamer', name: 'GamerAli', age: '2 il', friend: true,
      message: 'Əla matç idi! Yenidən bir komandada oynayaq?',
      safe: true, clue: 'Yenidən bir komandada oynayaq?', explanation: 'Bu mesaj yalnız oyun haqqındadır. Şifrə və ya şəxsi məlumat istəmir.', badge: 'Diqqətli göz' },
    { id: 'J1-2', character: 'mia', name: 'Bestie_2024', age: '3 gün', friend: false,
      message: 'Salam dostum! Mənə üzünün real şəklini göndər!',
      safe: false, clue: 'üzünün real şəklini göndər', explanation: 'Mehriban danışması onu tanıdığın biri etmir. Şəklini yad hesabla paylaşma və böyüyə xəbər ver.', badge: 'Gizlilik qoruyucusu' },
    { id: 'J1-3', character: 'hood', name: 'ProPlayer77', age: '5 gün', friend: false,
      message: 'Hansı məktəbdə oxuyursan? Dərsdən sonra görüşək.',
      safe: false, clue: 'Hansı məktəbdə oxuyursan?', explanation: 'Məktəbin və görüş yerin şəxsi məlumatdır. Tanımadığın hesaba belə məlumat vermə.', badge: 'Təhlükə ovçusu' },
    { id: 'J1-4', character: 'gamer', name: 'LunaPlay', age: '8 ay', friend: true,
      message: 'Səsli söhbətə qoşulmaq istəmirsənsə, oyunun çatından yaza bilərik.',
      safe: true, clue: 'çatından yaza bilərik', explanation: 'Bu mesaj seçiminə hörmət edir. Səndən şəxsi məlumat və ya görüntü istənilmir.', badge: 'Öz seçimin',
      replies: ['Çatdan yazmaq mənə uyğundur.', 'Ev ünvanımı da yazım?', 'Şifrəmi sənə göndərim?'], reply: 0 },
  ],
  [
    { id: 'J2-1', character: 'gamer', name: 'SwordMaster', age: '1 il', friend: true,
      message: 'Bu oyunda yeni qılınc görünüşünü sınamısan?',
      safe: true, clue: 'yeni qılınc görünüşünü', explanation: 'Sual oyundakı əşyaya aiddir. Səndən şəxsi məlumat və hesab girişi istənilmir.', badge: 'Oyun yoldaşı' },
    { id: 'J2-2', character: 'stranger', name: 'FreeGifts_XD', age: '2 gün', friend: false,
      message: 'Bu keçidə bas, 10 000 pulsuz oyun pulu qazan!',
      safe: false, clue: '10 000 pulsuz oyun pulu', explanation: 'Pulsuz hədiyyə vədi səni saxta səhifəyə çəkə bilər. Keçidi açmadan etibarlı böyüklə yoxla.', badge: 'Keçid detektivi' },
    { id: 'J2-3', character: 'student', name: 'HelperFox', age: '4 gün', friend: false,
      message: 'Hesabını gücləndirim! Giriş şifrəsini mənə de.',
      safe: false, clue: 'Giriş şifrəsini mənə de', explanation: 'Kömək təklifi olsa da, şifrə gizli qalmalıdır. Onu söhbətdə paylaşma.', badge: 'Şifrə mühafizəçisi' },
    { id: 'J2-4', character: 'mentor', name: 'Support_Max', age: '2 il', friend: false,
      message: 'Dəstək xidmətindənəm. Hesabını qorumaq üçün gələn birdəfəlik kodu mənə yaz.',
      safe: false, clue: 'birdəfəlik kodu mənə yaz', explanation: 'Giriş kodu da şifrə kimi gizlidir. Dəstək adından yazılması kodu paylaşmaq üçün əsas deyil.', badge: 'Kod keşikçisi',
      replies: ['Kodu dərhal göndərirəm.', 'Kodu paylaşmıram. Rəsmi dəstəyi böyüklə yoxlayacağam.', 'Əvəzində dostumun kodunu verim?'], reply: 1 },
  ],
  [
    { id: 'J3-1', character: 'mia', name: 'MiniMia', age: '3 il', friend: true,
      message: 'Bu gün ev tapşırığında uğurlar!',
      safe: true, clue: 'ev tapşırığında uğurlar', explanation: 'Bu, xoş arzudur. Şəxsi məlumat və ya şübhəli keçid yoxdur.', badge: 'Mehriban baxış' },
    { id: 'J3-2', character: 'streamer', name: 'NewUser_999', age: '1 gün', friend: false,
      message: 'Salam! Harada yaşayırsan? Küçənin adı nədir?',
      safe: false, clue: 'Küçənin adı nədir?', explanation: 'Ünvanını tanımadığın hesaba vermə. Yeni hesabın şəxsi sualı diqqətli olmağı tələb edir.', badge: 'Ünvan keşikçisi' },
    { id: 'J3-3', character: 'hood', name: 'TeamPanda', age: '1 il', friend: true,
      message: 'Bu səviyyədə hansı qapını seçim? Komandamıza kömək et!',
      safe: true, clue: 'hansı qapını seçim?', explanation: 'Geyimi və görünüşü qərarı dəyişmir. Mesaj yalnız oyun köməyidir.', badge: 'Kiber çempion' },
    { id: 'J3-4', character: 'student', name: 'RaufTeam', age: '4 il', friend: true,
      message: 'Mənəm, Rauf! Yeni telefon almışam. Tez ol, hesabının bərpa kodunu göndər, sonra izah edərəm.',
      safe: false, clue: 'hesabının bərpa kodunu göndər', explanation: 'Tanış ad və köhnə hesab belə kod istəyəndə dayan. Dostunun hesabı başqasının əlinə keçmiş ola bilər. Onu əvvəlcədən tanıdığın kanalla yoxla.', badge: 'Son yoxlama',
      replies: ['Tanış addır, kodu göndərim.', 'Telefon nömrəmi və ünvanımı göndərim.', 'Kodu verməyəcəyəm. Dostumla tanıdığım kanaldan danışacağam.'], reply: 2 },
  ],
])
export type Visitor = z.infer<typeof visitorSchema>
export const totalVisitors = visitors.reduce((sum, day) => sum + day.length, 0)
