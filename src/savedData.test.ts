import { describe, expect, it, vi } from 'vitest'
import { createList, initialData } from './lists'
import { loadAppData, saveAppData } from './savedData'

const KEY = 'liste-de-courses:data'

describe('savedData.ts', () => {
  it('R54 : ce qui est sauvegardé est relu à l’identique', () => {
    const data = createList(initialData(), 'Samedi', 'samedi')
    saveAppData(data)
    expect(loadAppData()).toEqual(data)
  })

  it('R55 : sauvegarde absente -> premier lancement', () => {
    expect(loadAppData()).toEqual(initialData())
  })

  it('R55 : sauvegarde illisible ou abîmée -> premier lancement', () => {
    for (const raw of ['{pas du json', '42', '{"lists":[]}', '{"lists":[{"id":1}],"activeId":"x","coupons":[]}']) {
      localStorage.setItem(KEY, raw)
      expect(loadAppData()).toEqual(initialData())
    }
  })

  it('R55 : une ligne avec une quantité impossible rend la sauvegarde invalide', () => {
    const data = initialData()
    data.lists[1].items = [{ id: 1, title: 'x', price: 1, thumbnail: '', category: 'c', quantity: 0, bought: false }]
    saveAppData(data)
    expect(loadAppData()).toEqual(initialData())
  })

  it('R58 + R55 : Favoris manquant est remis ; une liste active inconnue est remplacée', () => {
    const data = initialData()
    localStorage.setItem(KEY, JSON.stringify({ ...data, lists: [data.lists[1]], activeId: 'disparue' }))
    const loaded = loadAppData()
    expect(loaded.lists.map((list) => list.name)).toEqual(['Favoris', 'Ma liste'])
    expect(loaded.activeId).toBe('favoris')
  })

  it('R55 : si le navigateur refuse le localStorage, rien ne plante', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveAppData(initialData())).not.toThrow()
    expect(loadAppData()).toEqual(initialData())
  })
})
