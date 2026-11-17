export interface Proof {
  prompt: string
  options: string[]
  answers: number[]
  hint: string
}

const proofs: Record<string, Proof> = {
  'D1-02': {
    prompt: 'Göndərənin domenini tap.',
    options: ['scholarship', 'oyu-support.example', 'oyu.example'],
    answers: [1],
    hint: 'Göndərənin ünvanında @ işarəsindən sonrakı hissəyə bax.',
  },
  'D1-04': {
    prompt: 'Kimliyi hansı dəlillə yoxlayarsan?',
    options: ['Məktəbin işçi siyahısı', 'Məktubdakı loqo', 'Məktubun başlığı'],
    answers: [0],
    hint: 'Məktəbin özündə saxlanılan qeydi seç.',
  },
  'D1-05': {
    prompt: 'Keçid hansı sayta aparır?',
    options: ['document', 'oyu.example', 'campus-archive.example'],
    answers: [2],
    hint: 'https:// yazısından sonra ilk / işarəsinə qədər olan hissəyə bax.',
  },
  'D2-01': {
    prompt: 'Söhbətdə hansı məlumatı gizli saxlamalısan?',
    options: ['Sorğunun nömrəsi', 'Birdəfəlik giriş kodu', 'Xidmət masası adı'],
    answers: [1],
    hint: 'Hesabına daxil olmaq üçün istifadə etdiyin kodu düşün.',
  },
  'D2-02': {
    prompt: 'Əlavə yoxlamanın lazım olduğunu göstərən iki dəlili seç.',
    options: ['Material açıq istifadə üçündür', 'Müəllim kataloqda var', 'Xarici ünvan qeydiyyatda yoxdur', 'Sorğunu kimin göndərdiyi bilinmir'],
    answers: [2, 3],
    hint: 'Göndərənin kimliyini şübhəli edən iki fakta bax.',
  },
  'D3-05': {
    prompt: 'Yazma icazəsini şübhəli edən iki dəlili seç.',
    options: ['Bilet 314 imzalanmayıb', 'Sorğu məktəbin domenindən gəlib', 'Qüvvədə olan icazə yalnız oxuma üçündür', 'IR-314 nömrəsi mövcuddur'],
    answers: [0, 2],
    hint: 'Tələb olunan icazəni məktəbin verdiyi icazə ilə tutuşdur.',
  },
}

export const proofFor = (id: string): Proof | undefined => proofs[id]
export const hasProof = (id: string, pinned: readonly number[]) =>
  proofFor(id)?.answers.every(index => pinned.includes(index)) ?? true
