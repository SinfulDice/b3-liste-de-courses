import type { ListItem, Product } from './types'

// Fonctions "pures" : elles reçoivent une liste et renvoient une NOUVELLE liste,
// sans jamais modifier l'ancienne. React compare l'ancienne et la nouvelle liste
// pour savoir s'il doit réafficher ; si on modifiait l'ancienne, il ne verrait rien.

export function isInList(list: ListItem[], productId: number): boolean {
  return list.some((item) => item.id === productId)
}

// R9 + R10 : produit absent -> nouvelle ligne en bas (quantité 1) ; présent -> quantité + 1.
export function addToList(list: ListItem[], product: Product): ListItem[] {
  if (isInList(list, product.id)) {
    return list.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
    )
  }
  return [...list, { ...product, quantity: 1 }]
}

// R14 : retire la ligne entière, quelle que soit la quantité.
export function removeFromList(list: ListItem[], productId: number): ListItem[] {
  return list.filter((item) => item.id !== productId)
}
