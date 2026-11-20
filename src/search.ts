import { CATEGORY_NAMES_FR } from './i18n/categories'
import { PRODUCT_NAMES_FR } from './i18n/products'
import type { Product } from './types'

// R39 : met un texte "à plat" pour comparer : minuscules et sans accents.
// normalize('NFD') sépare chaque lettre de son accent (« é » -> « e » + « ´ »),
// puis on supprime les accents (\p{Diacritic} = "tous les signes diacritiques").
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

// R39 : le produit correspond-il à la recherche ? On cherche dans le nom français ET anglais,
// quel que soit l'interrupteur de traduction (R57).
export function matchesSearch(product: Product, query: string): boolean {
  const wanted = normalizeText(query)
  if (wanted === '') return true
  const names = [product.title, PRODUCT_NAMES_FR[product.id] ?? '']
  return names.some((name) => normalizeText(name).includes(wanted))
}

export const ALL_CATEGORIES = '' // valeur de « Toutes » dans le menu des catégories

// R39 : les deux filtres se combinent (recherche ET catégorie).
export function filterProducts(products: Product[], query: string, category: string): Product[] {
  return products.filter(
    (product) =>
      (category === ALL_CATEGORIES || product.category === category) &&
      matchesSearch(product, query),
  )
}

// R70 : trie les produits par nom français de catégorie (A→Z). "sort" est "stable" en JavaScript :
// deux produits de la même catégorie gardent leur ordre DummyJSON. On copie d'abord ([...products])
// car sort() modifie le tableau, et on ne touche jamais aux données d'origine.
export function sortByCategory(products: Product[]): Product[] {
  return [...products].sort((a, b) => compareCategories(a.category, b.category))
}

function compareCategories(a: string, b: string): number {
  return (CATEGORY_NAMES_FR[a] ?? a).localeCompare(CATEGORY_NAMES_FR[b] ?? b, 'fr')
}

// R39 : la liste des catégories présentes dans le catalogue, sans doublons,
// triée par nom français (localeCompare sait trier « É » avec les « E »).
export function categoriesOf(products: Product[]): string[] {
  const slugs = [...new Set(products.map((product) => product.category))]
  return slugs.sort(compareCategories)
}
