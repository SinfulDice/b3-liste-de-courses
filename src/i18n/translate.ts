import { CATEGORY_NAMES_FR } from './categories'
import { PRODUCT_NAMES_FR } from './products'

// R32 + R34 + R57 : nom à afficher pour un produit.
// "??" = "si la valeur de gauche est absente (undefined), prends celle de droite" :
// un produit absent du dictionnaire garde son nom anglais (R34).
export function productName(product: { id: number; title: string }, french: boolean): string {
  if (!french) return product.title
  return PRODUCT_NAMES_FR[product.id] ?? product.title
}

// R33 + R34 + R57 : nom à afficher pour une catégorie (slug anglais -> français).
export function categoryName(slug: string, french: boolean): string {
  if (!french) return slug
  return CATEGORY_NAMES_FR[slug] ?? slug
}
