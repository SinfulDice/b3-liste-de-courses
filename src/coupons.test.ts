import { describe, expect, it } from 'vitest'
import {
  checkCoupon,
  computeSummary,
  couponDiscount,
  deleteCoupon,
  describeCoupon,
  parseEuroCents,
  parsePercent,
  toggleCouponInList,
} from './coupons'
import { initialData } from './lists'
import { apple, milk } from './test-data'
import type { Coupon, ListItem } from './types'

const iphone = { ...apple, id: 124, title: 'iPhone X', price: 899.99, category: 'smartphones' }
// 3 pommes (5,97 €) + 2 laits (6,98 €, cochés) + 1 iPhone (899,99 €) = 912,94 €
const items: ListItem[] = [
  { ...apple, quantity: 3, bought: false },
  { ...milk, quantity: 2, bought: true },
  { ...iphone, quantity: 1, bought: false },
]

function coupon(kind: Coupon['kind'], value: number, category = ''): Coupon {
  return { id: `${kind}${value}${category}`, name: 'TEST', kind, value, category }
}

const valid = { name: 'LICORNE10', kind: 'percent' as const, value: '10', category: '' }

describe('coupons.ts', () => {
  it('R63 : montant en € : virgule ou point, 2 décimales max, entre 0,01 et 999,99', () => {
    expect(parseEuroCents('5')).toBe(500)
    expect(parseEuroCents('5,5')).toBe(550)
    expect(parseEuroCents(' 0.01 ')).toBe(1)
    expect(parseEuroCents('999,99')).toBe(99999)
    expect(parseEuroCents('1000')).toBeNull()
    expect(parseEuroCents('0')).toBeNull()
    expect(parseEuroCents('1,234')).toBeNull()
    expect(parseEuroCents('abc')).toBeNull()
    expect(parseEuroCents('-5')).toBeNull()
  })

  it('R63 : pourcentage : entier entre 1 et 100', () => {
    expect(parsePercent('10')).toBe(10)
    expect(parsePercent('100')).toBe(100)
    expect(parsePercent('0')).toBeNull()
    expect(parsePercent('101')).toBeNull()
    expect(parsePercent('12,5')).toBeNull()
  })

  it('R62 : un coupon valide est accepté, nom nettoyé', () => {
    expect(checkCoupon({ ...valid, name: '  LICORNE10 ' }, [])).toEqual({
      ok: true,
      coupon: { name: 'LICORNE10', kind: 'percent', value: 10, category: '' },
    })
    expect(checkCoupon({ ...valid, kind: 'euro', value: '5,50', category: 'groceries' }, [])).toEqual({
      ok: true,
      coupon: { name: 'LICORNE10', kind: 'euro', value: 550, category: 'groceries' },
    })
  })

  it('R63 : nom vide, trop long ou déjà pris, ou valeur invalide -> message', () => {
    const existing = [{ ...coupon('percent', 10), name: 'licorne10' }]
    expect(checkCoupon({ ...valid, name: ' ' }, [])).toMatchObject({ ok: false, error: /vide/ })
    expect(checkCoupon({ ...valid, name: 'a'.repeat(31) }, [])).toMatchObject({ ok: false, error: /30/ })
    expect(checkCoupon({ ...valid, name: 'a'.repeat(30) }, [])).toMatchObject({ ok: true })
    expect(checkCoupon(valid, existing)).toMatchObject({ ok: false, error: /déjà/ })
    expect(checkCoupon({ ...valid, value: '150' }, [])).toMatchObject({ ok: false, error: /entre 1 et 100/ })
    expect(checkCoupon({ ...valid, kind: 'euro', value: '0' }, [])).toMatchObject({ ok: false, error: /0,01/ })
  })

  it('R64 : description lisible en français', () => {
    expect(describeCoupon(coupon('percent', 10, 'groceries'), true)).toBe('−10 % sur Épicerie')
    expect(describeCoupon(coupon('euro', 500), true).replace(/\s/g, ' ')).toBe('−5,00 € sur toute la liste')
  })

  it('R66 : % sur toute la liste, lignes achetées comprises, arrondi au centime', () => {
    expect(couponDiscount(coupon('percent', 10), items)).toBe(9129) // 10 % de 912,94 € = 91,294 -> 91,29 €
  })

  it('R66 : % sur une catégorie : seulement ses lignes ; catégorie absente -> 0', () => {
    expect(couponDiscount(coupon('percent', 50, 'groceries'), items)).toBe(648) // 50 % de 12,95 € = 6,475 -> 6,48 €
    expect(couponDiscount(coupon('percent', 50, 'laptops'), items)).toBe(0)
  })

  it('R66 : un coupon en € ne dépasse pas ce qu’il couvre', () => {
    expect(couponDiscount(coupon('euro', 500, 'groceries'), items)).toBe(500)
    expect(couponDiscount(coupon('euro', 2000, 'groceries'), items)).toBe(1295)
  })

  it('R66 + R46 : réductions additionnées sur les prix d’origine ; reste à payer', () => {
    const summary = computeSummary(items, [coupon('percent', 10), coupon('euro', 500)])
    expect(summary.total).toBe(91294)
    expect(summary.discount).toBe(9129 + 500)
    expect(summary.afterDiscount).toBe(91294 - 9629)
    expect(summary.bought).toBe(698)
    expect(summary.remaining).toBe(91294 - 9629 - 698)
  })

  it('R66 + R46 : les réductions ne dépassent jamais le total ; le reste à payer ne descend pas sous 0', () => {
    const smallList: ListItem[] = [{ ...apple, quantity: 1, bought: true }] // 1,99 €
    const summary = computeSummary(smallList, [coupon('percent', 100), coupon('euro', 500)])
    expect(summary.discount).toBe(199)
    expect(summary.afterDiscount).toBe(0)
    expect(summary.remaining).toBe(0)
  })

  it('R46 : sans coupon, aucune réduction', () => {
    const summary = computeSummary(items, [])
    expect(summary.discount).toBe(0)
    expect(summary.remaining).toBe(91294 - 698)
  })

  it('R65 : cocher un coupon ne vaut que pour une liste ; R64 : supprimer le décoche partout', () => {
    let data = { ...initialData(), coupons: [coupon('percent', 10)] }
    data = toggleCouponInList(data, 'ma-liste', 'percent10')
    expect(data.lists.map((list) => list.couponIds)).toEqual([[], ['percent10']])
    data = deleteCoupon(data, 'percent10')
    expect(data.coupons).toEqual([])
    expect(data.lists[1].couponIds).toEqual([])
  })
})
