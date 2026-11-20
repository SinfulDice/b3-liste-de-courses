import { describe, expect, it } from 'vitest'
import { addToList, isInList, removeFromList } from './list'
import type { ListItem } from './types'

const apple = { id: 16, title: 'Apple' }
const milk = { id: 36, title: 'Milk' }

describe('list.ts (fonctions pures)', () => {
  it('R9 : un produit absent est ajouté en bas avec la quantité 1', () => {
    const list: ListItem[] = [{ ...milk, quantity: 1 }]
    expect(addToList(list, apple)).toEqual([
      { ...milk, quantity: 1 },
      { ...apple, quantity: 1 },
    ])
  })

  it('R10 : un produit déjà présent voit sa quantité augmenter de 1, sans nouvelle ligne', () => {
    const list: ListItem[] = [{ ...apple, quantity: 2 }, { ...milk, quantity: 1 }]
    expect(addToList(list, apple)).toEqual([
      { ...apple, quantity: 3 },
      { ...milk, quantity: 1 },
    ])
  })

  it('R7 : l\'ordre reste celui du premier ajout', () => {
    let list: ListItem[] = []
    list = addToList(list, apple)
    list = addToList(list, milk)
    list = addToList(list, apple)
    expect(list.map((item) => item.title)).toEqual(['Apple', 'Milk'])
  })

  it('R11 : la ligne utilise l\'id du catalogue', () => {
    expect(addToList([], apple)[0].id).toBe(16)
  })

  it('R14 : supprimer retire la ligne entière, quelle que soit la quantité', () => {
    const list: ListItem[] = [{ ...apple, quantity: 5 }, { ...milk, quantity: 1 }]
    expect(removeFromList(list, 16)).toEqual([{ ...milk, quantity: 1 }])
  })

  it('isInList dit si un produit est déjà dans la liste', () => {
    const list: ListItem[] = [{ ...apple, quantity: 1 }]
    expect(isInList(list, 16)).toBe(true)
    expect(isInList(list, 36)).toBe(false)
  })

  it('les fonctions ne modifient pas la liste reçue (React a besoin d\'une nouvelle liste)', () => {
    const list: ListItem[] = [{ ...apple, quantity: 1 }]
    addToList(list, apple)
    removeFromList(list, 16)
    expect(list).toEqual([{ ...apple, quantity: 1 }])
  })
})
