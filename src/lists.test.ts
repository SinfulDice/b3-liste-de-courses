import { describe, expect, it } from 'vitest'
import { addToList } from './list'
import {
  FAVORITES_ID,
  activeList,
  createList,
  deleteList,
  initialData,
  isFavorite,
  listNameError,
  renameList,
  toggleFavorite,
  updateItems,
} from './lists'
import { apple, milk } from './test-data'

describe('lists.ts', () => {
  it('R5 : au premier lancement, Favoris et « Ma liste » (active), toutes deux vides', () => {
    const data = initialData()
    expect(data.lists.map((list) => list.name)).toEqual(['Favoris', 'Ma liste'])
    expect(activeList(data).name).toBe('Ma liste')
    expect(data.lists.every((list) => list.items.length === 0)).toBe(true)
  })

  it('R52 : un nom vide, trop long ou déjà pris est refusé ; les espaces autour sont enlevés', () => {
    const { lists } = initialData()
    expect(listNameError('   ', lists)).toMatch(/vide/)
    expect(listNameError('a'.repeat(41), lists)).toMatch(/40/)
    expect(listNameError('a'.repeat(40), lists)).toBeNull()
    expect(listNameError('  ma LISTE ', lists)).toMatch(/déjà/)
    expect(listNameError('Courses du samedi', lists)).toBeNull()
  })

  it('R58 + R52 : le nom « Favoris » est déjà pris', () => {
    expect(listNameError('favoris', initialData().lists)).toMatch(/déjà/)
  })

  it('R52 : en renommant, une liste peut garder son nom ou changer ses majuscules', () => {
    const { lists } = initialData()
    expect(listNameError('MA LISTE', lists, 'ma-liste')).toBeNull()
  })

  it('R50 : créer une liste la rend active ; le nom est nettoyé', () => {
    const data = createList(initialData(), '  Samedi  ', 'samedi')
    expect(activeList(data)).toMatchObject({ id: 'samedi', name: 'Samedi' })
    expect(data.lists).toHaveLength(3)
  })

  it('R61 : une nouvelle liste reçoit 1 de chaque favori, non coché, dans l’ordre de Favoris', () => {
    let data = initialData()
    data = updateItems(data, FAVORITES_ID, (items) => addToList(addToList(items, milk, 6), apple, 2))
    data = updateItems(data, FAVORITES_ID, (items) => items.map((item) => ({ ...item, bought: true })))
    const created = activeList(createList(data, 'Samedi'))
    expect(created.items.map((item) => [item.title, item.quantity, item.bought])).toEqual([
      ['Milk', 1, false],
      ['Apple', 1, false],
    ])
  })

  it('R61 : sans favori, la nouvelle liste est vide ; les listes existantes ne changent pas', () => {
    let data = createList(initialData(), 'Samedi', 'samedi')
    expect(activeList(data).items).toEqual([])
    data = toggleFavorite(data, apple)
    expect(data.lists.find((list) => list.id === 'samedi')?.items).toEqual([])
  })

  it('R51 + R58 : renommer change le nom, sauf pour Favoris', () => {
    let data = renameList(initialData(), 'ma-liste', ' Semaine ')
    expect(activeList(data).name).toBe('Semaine')
    data = renameList(data, FAVORITES_ID, 'Autre')
    expect(data.lists[0].name).toBe('Favoris')
  })

  it('R53 : supprimer la liste active rend active la première autre liste (pas Favoris)', () => {
    let data = createList(initialData(), 'Samedi', 'samedi')
    data = deleteList(data, 'samedi')
    expect(activeList(data).name).toBe('Ma liste')
  })

  it('R53 : sans autre liste, Favoris devient active ; Favoris ne peut pas être supprimée', () => {
    let data = deleteList(initialData(), 'ma-liste')
    expect(activeList(data).id).toBe(FAVORITES_ID)
    data = deleteList(data, FAVORITES_ID)
    expect(data.lists).toHaveLength(1)
  })

  it('R60 : la licorne ajoute 1 dans Favoris, puis enlève toute la ligne', () => {
    let data = toggleFavorite(initialData(), apple)
    expect(isFavorite(data, apple.id)).toBe(true)
    expect(data.lists[0].items[0].quantity).toBe(1)
    data = updateItems(data, FAVORITES_ID, (items) => addToList(items, apple, 4)) // 5 pommes
    data = toggleFavorite(data, apple)
    expect(isFavorite(data, apple.id)).toBe(false)
  })

  it('R60 : la licorne ne change pas la liste active', () => {
    const data = toggleFavorite(initialData(), apple)
    expect(activeList(data).items).toEqual([])
    expect(data.activeId).toBe('ma-liste')
  })
})
