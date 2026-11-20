import { describe, expect, it } from 'vitest'
import { categoriesOf, filterProducts, matchesSearch, normalizeText, sortByCategory } from './search'
import { apple, milk } from './test-data'

const iphone = { ...apple, id: 124, title: 'iPhone X', category: 'smartphones' }
const spiceRack = { ...apple, id: 73, title: 'Spice Rack', category: 'kitchen-accessories' } // « Étagère à épices »
const products = [apple, milk, iphone, spiceRack]

describe('search.ts', () => {
  it('R39 : la comparaison ignore majuscules et accents', () => {
    expect(normalizeText('  Étagère à ÉPICES ')).toBe('etagere a epices')
  })

  it('R39 : on trouve un produit par son nom français ou anglais, sans accent', () => {
    expect(matchesSearch(spiceRack, 'epice')).toBe(true) // français, sans accent
    expect(matchesSearch(spiceRack, 'spice')).toBe(true) // anglais
    expect(matchesSearch(apple, 'POMME')).toBe(true)
    expect(matchesSearch(apple, 'lait')).toBe(false)
  })

  it('R39 : une recherche vide garde tout', () => {
    expect(filterProducts(products, '', '')).toHaveLength(4)
  })

  it('R39 : filtre par catégorie, et les deux filtres se combinent', () => {
    expect(filterProducts(products, '', 'groceries')).toEqual([apple, milk])
    expect(filterProducts(products, 'lait', 'groceries')).toEqual([milk])
    expect(filterProducts(products, 'lait', 'smartphones')).toEqual([])
  })

  it('R39 : la liste des catégories est sans doublon et triée par nom français', () => {
    // Cuisine, Épicerie, Smartphones (« É » est trié avec les « E »)
    expect(categoriesOf(products)).toEqual(['kitchen-accessories', 'groceries', 'smartphones'])
  })
})

describe('R70 : ordre des produits', () => {
  it('R70 : trié par nom français de catégorie ; ordre DummyJSON gardé dans une catégorie', () => {
    const banana = { ...apple, id: 99, title: 'Banana' }
    const sorted = sortByCategory([iphone, apple, spiceRack, milk, banana])
    // Cuisine (épices), Épicerie (pomme, lait, banane dans l'ordre d'origine), Smartphones
    expect(sorted.map((p) => p.title)).toEqual(['Spice Rack', 'Apple', 'Milk', 'Banana', 'iPhone X'])
  })

  it("R70 : sortByCategory ne modifie pas le tableau d'origine", () => {
    const original = [iphone, apple]
    sortByCategory(original)
    expect(original).toEqual([iphone, apple])
  })
})
