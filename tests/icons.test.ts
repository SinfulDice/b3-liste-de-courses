import { describe, expect, it } from 'vitest'
import { CATEGORY_ICONS, FALLBACK_ICON, iconFor } from '../src/categoryIcons'
import catalog from './fixtures/catalog.json'

const categories = [...new Set(catalog.products.map((p) => p.category))]

describe('icônes de catégories', () => {
  it('R68 : les 24 catégories du catalogue ont une icône à elles', () => {
    expect(categories).toHaveLength(24)
    const missing = categories.filter((slug) => !CATEGORY_ICONS[slug])
    expect(missing).toEqual([])
  })

  it('R68 : une catégorie inconnue a une icône générique', () => {
    expect(iconFor('inconnue')).toBe(FALLBACK_ICON)
    expect(iconFor('groceries')).not.toBe(FALLBACK_ICON)
  })
})
