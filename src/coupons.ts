import { categoryName } from './i18n/translate'
import { computeTotals, lineTotal, type Totals } from './list'
import { formatEuros } from './money'
import type { AppData, Coupon, CouponKind, ListItem } from './types'

// Les coupons (R62 à R67), en fonctions pures.

export const MAX_COUPON_NAME = 30
export const WHOLE_LIST = '' // R62 : « S'applique à : Toute la liste »

// Ce que le formulaire envoie : la valeur est encore du texte tapé par l'utilisateur.
export type CouponInput = {
  name: string
  kind: CouponKind
  value: string
  category: string
}

// R63 : « 5 », « 5,5 », « 5.50 » -> centimes (500, 550, 550). Invalide ou hors 0,01–999,99 -> null.
export function parseEuroCents(text: string): number | null {
  const clean = text.trim()
  // Expression régulière : des chiffres, puis éventuellement , ou . suivi de 1 ou 2 chiffres.
  if (!/^\d+([.,]\d{1,2})?$/.test(clean)) return null
  const cents = Math.round(Number(clean.replace(',', '.')) * 100)
  return cents >= 1 && cents <= 99999 ? cents : null
}

// R63 : un pourcentage entier entre 1 et 100, sinon null.
export function parsePercent(text: string): number | null {
  const clean = text.trim()
  if (!/^\d+$/.test(clean)) return null
  const value = Number(clean)
  return value >= 1 && value <= 100 ? value : null
}

// R62 + R63 : vérifie le formulaire. Renvoie soit le coupon (sans id), soit un message d'erreur.
// Ce type "union" oblige le code qui l'appelle à regarder "ok" avant d'utiliser le résultat.
export type CouponCheck = { ok: true; coupon: Omit<Coupon, 'id'> } | { ok: false; error: string }

export function checkCoupon(input: CouponInput, coupons: Coupon[]): CouponCheck {
  const name = input.name.trim()
  if (name === '') return { ok: false, error: 'Le nom du coupon ne peut pas être vide.' }
  if (name.length > MAX_COUPON_NAME) {
    return { ok: false, error: `Le nom du coupon doit faire ${MAX_COUPON_NAME} caractères au plus.` }
  }
  if (coupons.some((coupon) => coupon.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: `Un coupon s'appelle déjà « ${name} ».` }
  }
  const value = input.kind === 'percent' ? parsePercent(input.value) : parseEuroCents(input.value)
  if (value === null) {
    return {
      ok: false,
      error:
        input.kind === 'percent'
          ? 'Le pourcentage doit être un nombre entier entre 1 et 100.'
          : 'Le montant doit être entre 0,01 et 999,99 €.',
    }
  }
  return { ok: true, coupon: { name, kind: input.kind, value, category: input.category } }
}

// R64 : « −10 % sur Épicerie », « −5,00 € sur toute la liste ».
export function describeCoupon(coupon: Coupon, french: boolean): string {
  const amount = coupon.kind === 'percent' ? `${coupon.value} %` : formatEuros(coupon.value)
  const target =
    coupon.category === WHOLE_LIST ? 'toute la liste' : categoryName(coupon.category, french)
  return `−${amount} sur ${target}`
}

// R66 : la réduction d'UN coupon sur une liste, en centimes. Les lignes cochées « acheté » comptent.
export function couponDiscount(coupon: Coupon, items: ListItem[]): number {
  const base = items
    .filter((item) => coupon.category === WHOLE_LIST || item.category === coupon.category)
    .reduce((sum, item) => sum + lineTotal(item), 0)
  if (coupon.kind === 'percent') return Math.round((base * coupon.value) / 100)
  return Math.min(coupon.value, base) // un coupon en € n'enlève jamais plus que ce qu'il couvre
}

export type Summary = Totals & {
  discount: number // R66 : total des réductions (centimes)
  afterDiscount: number // Total − réductions
}

// R46 + R66 : le récapitulatif complet d'une liste avec ses coupons cochés.
export function computeSummary(items: ListItem[], coupons: Coupon[]): Summary {
  const totals = computeTotals(items)
  const sum = coupons.reduce((acc, coupon) => acc + couponDiscount(coupon, items), 0)
  const discount = Math.min(sum, totals.total) // jamais plus que le Total
  const afterDiscount = totals.total - discount
  // Reste à payer = après réductions − déjà acheté, jamais négatif.
  const remaining = Math.max(0, afterDiscount - totals.bought)
  return { ...totals, discount, afterDiscount, remaining }
}

// Les coupons cochés dans une liste (on ignore un id qui ne correspondrait plus à aucun coupon).
export function couponsOf(data: AppData, couponIds: string[]): Coupon[] {
  return data.coupons.filter((coupon) => couponIds.includes(coupon.id))
}

export function addCoupon(data: AppData, coupon: Coupon): AppData {
  return { ...data, coupons: [...data.coupons, coupon] }
}

// R64 : supprimer un coupon le décoche aussi dans toutes les listes.
export function deleteCoupon(data: AppData, couponId: string): AppData {
  return {
    ...data,
    coupons: data.coupons.filter((coupon) => coupon.id !== couponId),
    lists: data.lists.map((list) => ({
      ...list,
      couponIds: list.couponIds.filter((id) => id !== couponId),
    })),
  }
}

// R65 : coche / décoche un coupon pour UNE liste.
export function toggleCouponInList(data: AppData, listId: string, couponId: string): AppData {
  return {
    ...data,
    lists: data.lists.map((list) => {
      if (list.id !== listId) return list
      const has = list.couponIds.includes(couponId)
      return {
        ...list,
        couponIds: has
          ? list.couponIds.filter((id) => id !== couponId)
          : [...list.couponIds, couponId],
      }
    }),
  }
}
