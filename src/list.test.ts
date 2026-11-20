import { describe, expect, it } from 'vitest'
import {
  addToList,
  computeTotals,
  isInList,
  lineTotal,
  removeFromList,
  removeQuantity,
  removesWholeLine,
  splitByBought,
  toggleBought,
} from './list'
import { apple, milk } from './test-data'
import type { ListItem } from './types'

// Petit raccourci pour fabriquer une ligne.
function line(product: typeof apple, quantity: number, bought = false): ListItem {
  return { ...product, quantity, bought }
}

describe('list.ts (fonctions pures)', () => {
  it('R9 : un produit absent est ajouté en bas avec la quantité X', () => {
    expect(addToList([line(milk, 1)], apple, 3)).toEqual([line(milk, 1), line(apple, 3)])
  })

  it('R10 : un produit déjà présent voit sa quantité augmenter de X, sans nouvelle ligne', () => {
    expect(addToList([line(apple, 2), line(milk, 1)], apple, 5)).toEqual([
      line(apple, 7),
      line(milk, 1),
    ])
  })

  it('R10 : rajouter un produit coché « acheté » le décoche', () => {
    expect(addToList([line(apple, 2, true)], apple, 1)).toEqual([line(apple, 3, false)])
  })

  it("R7 : l'ordre reste celui du premier ajout", () => {
    let items: ListItem[] = []
    items = addToList(items, apple)
    items = addToList(items, milk)
    items = addToList(items, apple)
    expect(items.map((item) => item.title)).toEqual(['Apple', 'Milk'])
  })

  it("R11 : la ligne utilise l'id du catalogue", () => {
    expect(addToList([], apple)[0].id).toBe(16)
  })

  it('R44 : retirer moins que la quantité baisse la quantité', () => {
    expect(removeQuantity([line(apple, 5)], 16, 2)).toEqual([line(apple, 3)])
    expect(removesWholeLine([line(apple, 5)], 16, 2)).toBe(false)
  })

  it('R44 : retirer autant ou plus que la quantité supprime la ligne', () => {
    expect(removeQuantity([line(apple, 5), line(milk, 1)], 16, 5)).toEqual([line(milk, 1)])
    expect(removeQuantity([line(apple, 5)], 16, 9)).toEqual([])
    expect(removesWholeLine([line(apple, 5)], 16, 5)).toBe(true)
  })

  it('R14 : supprimer retire la ligne entière, quelle que soit la quantité', () => {
    expect(removeFromList([line(apple, 5), line(milk, 1)], 16)).toEqual([line(milk, 1)])
  })

  it('R48 : cocher puis décocher « acheté »', () => {
    const checked = toggleBought([line(apple, 1)], 16)
    expect(checked[0].bought).toBe(true)
    expect(toggleBought(checked, 16)[0].bought).toBe(false)
  })

  it('R7 : les lignes cochées vont en bas, chaque groupe garde son ordre', () => {
    const items = [line(apple, 1, true), line(milk, 1), line({ ...apple, id: 99 }, 1, true)]
    const { toBuy, bought } = splitByBought(items)
    expect(toBuy.map((item) => item.id)).toEqual([32])
    expect(bought.map((item) => item.id)).toEqual([16, 99])
  })

  it('R46 : sous-total, total, déjà acheté, reste à payer et nombre d\'articles', () => {
    const items = [line(apple, 3), line(milk, 2, true)] // 3 × 1,99 + 2 × 3,49
    expect(lineTotal(items[0])).toBe(597)
    expect(computeTotals(items)).toEqual({ total: 1295, bought: 698, remaining: 597, count: 5 })
  })

  it('R47 : les totaux sont exacts au centime (pas de 0,30000000000000004)', () => {
    const tenCents = { ...apple, price: 0.1 }
    const twentyCents = { ...milk, price: 0.2 }
    expect(computeTotals([line(tenCents, 1), line(twentyCents, 1)]).total).toBe(30)
  })

  it('isInList dit si un produit est déjà dans la liste', () => {
    expect(isInList([line(apple, 1)], 16)).toBe(true)
    expect(isInList([line(apple, 1)], 32)).toBe(false)
  })

  it("les fonctions ne modifient pas la liste reçue (React a besoin d'une nouvelle liste)", () => {
    const items = [line(apple, 1)]
    addToList(items, apple)
    removeQuantity(items, 16, 1)
    toggleBought(items, 16)
    expect(items).toEqual([line(apple, 1)])
  })
})
