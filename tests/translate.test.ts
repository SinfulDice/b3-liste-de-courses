import { describe, expect, it } from 'vitest'
import { CATEGORY_NAMES_FR } from '../src/i18n/categories'
import { PRODUCT_NAMES_FR } from '../src/i18n/products'
import { categoryName, productName } from '../src/i18n/translate'
// Copie du vrai catalogue DummyJSON (194 produits), enregistrée le 2026-11-20.
import catalog from './fixtures/catalog.json'

const products = catalog.products
const categories = [...new Set(products.map((p) => p.category))] // Set = sans doublons

describe('Traduction', () => {
  it('R34 : les 194 produits du catalogue ont un nom français', () => {
    expect(products).toHaveLength(194)
    const missing = products.filter((p) => !PRODUCT_NAMES_FR[p.id]).map((p) => p.title)
    expect(missing).toEqual([])
  })

  it('R34 : les 24 catégories ont un nom français', () => {
    expect(categories).toHaveLength(24)
    const missing = categories.filter((slug) => !CATEGORY_NAMES_FR[slug])
    expect(missing).toEqual([])
  })

  it('R32 : un produit est affiché en français', () => {
    expect(productName({ id: 16, title: 'Apple' }, true)).toBe('Pomme')
    expect(productName({ id: 32, title: 'Milk' }, true)).toBe('Lait')
  })

  it('R32 : les marques et modèles ne sont pas traduits', () => {
    expect(productName({ id: 124, title: 'iPhone X' }, true)).toBe('iPhone X')
    expect(productName({ id: 97, title: 'Rolex Datejust' }, true)).toBe('Rolex Datejust')
  })

  it('R33 : une catégorie est affichée en français', () => {
    expect(categoryName('groceries', true)).toBe('Épicerie')
    expect(categoryName('kitchen-accessories', true)).toBe('Cuisine')
  })

  it('R34 : un produit ou une catégorie inconnus gardent leur nom anglais', () => {
    expect(productName({ id: 9999, title: 'Unknown Thing' }, true)).toBe('Unknown Thing')
    expect(categoryName('space-ships', true)).toBe('space-ships')
  })

  it('R57 : traduction désactivée -> noms anglais de DummyJSON', () => {
    expect(productName({ id: 16, title: 'Apple' }, false)).toBe('Apple')
    expect(categoryName('groceries', false)).toBe('groceries')
  })
})
