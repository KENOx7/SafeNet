export type Clue = {
  id: string; label: string; text: string; explanation: string
  x: number; y: number; w: number; h: number; kind: 'paper' | 'sign' | 'badge' | 'notebook'
}
export type Level = { id: string; title: string; caption: string; image: string; hint: string; clues: Clue[] }
export const levels: Level[] = [
  { id: 'bedroom', title: 'Yataq otağı selfisi', caption: 'Yeni otağım! Necədir?', image: 'bedroom',
    hint: 'Masadakı təqvimə və sarı qeydə diqqətlə bax. Şəxsi məlumat yalnız üzündə olmur.',
    clues: [
      { id: 'address', label: 'Ev ünvanı', text: 'Nizami küçəsi\nEv №12', explanation: 'Ünvan yaşadığın yeri göstərir. Şəkli paylaşanda onu ört.', x: 70, y: 58.5, w: 16.5, h: 11, kind: 'paper' },
      { id: 'phone', label: 'Telefon nömrəsi', text: 'Telefon\n050 0000000', explanation: 'Telefon nömrəsi şəxsi məlumatdır. Açıq paylaşımda görünməsin.', x: 80.5, y: 73, w: 12, h: 9, kind: 'paper' },
    ] },
  { id: 'school', title: 'Məktəb həyəti', caption: 'Dostumla məktəbin qarşısında!', image: 'school',
    hint: 'Binanın girişindəki lövhəni və oğlanın geyimindəki nişanı yoxla.',
    clues: [
      { id: 'school-sign', label: 'Məktəbin adı', text: '5 saylı məktəb', explanation: 'Məktəbin adı hər gün harada olduğunu göstərə bilər.', x: 43, y: 28, w: 25, h: 8, kind: 'sign' },
      { id: 'uniform-badge', label: 'Formadakı məktəb nişanı', text: '№5', explanation: 'Geyimdəki nişan da məktəbini tanıda bilər. Onu da gizlət.', x: 30.5, y: 88, w: 6, h: 10, kind: 'badge' },
    ] },
  { id: 'desk', title: 'Kompüter masası', caption: 'Yeni oyunun ekranına baxın!', image: 'desk',
    hint: 'Monitora yapışdırılmış sarı qeyd və açıq dəftər nələri göstərir?',
    clues: [
      { id: 'password', label: 'Giriş şifrəsi', text: 'Şifrə\nBulud!27', explanation: 'Şifrəni nə söhbətdə, nə də şəklin arxa planında paylaş.', x: 62.5, y: 19, w: 11, h: 10.5, kind: 'paper' },
      { id: 'email', label: 'Şəxsi e-poçt ünvanı', text: 'ali@example.com', explanation: 'Şəxsi e-poçt ünvanını açıq şəkildən çıxart.', x: 42.5, y: 73.5, w: 19, h: 5, kind: 'notebook' },
    ] },
  { id: 'street', title: 'Küçədə gəzinti', caption: 'Velosipedlə gəzirəm!', image: 'street',
    hint: 'Velosiped təhlükəli deyil. Küçə lövhəsi və divardakı nömrə hansı məlumatı verir?',
    clues: [
      { id: 'street-sign', label: 'Küçənin adı', text: 'Çinar küçəsi', explanation: 'Küçənin adı çəkildiyin yeri tanıda bilər.', x: 34, y: 19, w: 21, h: 9, kind: 'sign' },
      { id: 'building', label: 'Binanın nömrəsi', text: 'Bina 24', explanation: 'Küçə adı və bina nömrəsi birlikdə dəqiq ünvanı göstərə bilər.', x: 71, y: 23, w: 11.5, h: 7.5, kind: 'notebook' },
    ] },
]
