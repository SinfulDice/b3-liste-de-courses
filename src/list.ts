import { toCents } from './money'
import type { ListItem, Product } from './types'

// Fonctions "pures" : elles reçoivent une liste et renvoient une NOUVELLE liste,
// sans jamais modifier l'ancienne. React compare l'ancienne et la nouvelle liste
// pour savoir s'il doit réafficher ; si on modifiait l'ancienne, il ne verrait rien.

export function isInList(items: ListItem[], productId: number): boolean {
  return items.some((item) => item.id === productId)
}

export function findItem(items: ListItem[], productId: number): ListItem | undefined {
  return items.find((item) => item.id === productId)
}

// R9 + R10 : produit absent -> nouvelle ligne en bas (quantité X) ;
// présent -> quantité + X, et la ligne est décochée (il en faut à nouveau).
export function addToList(items: ListItem[], product: Product, quantity = 1): ListItem[] {
  if (isInList(items, product.id)) {
    return items.map((item) =>
      item.id === product.id
        ? { ...item, quantity: item.quantity + quantity, bought: false }
        : item,
    )
  }
  return [...items, { ...product, quantity, bought: false }]
}

// R44 : retirer X enlève-t-il toute la ligne ? (X >= quantité)
// Utile AVANT d'agir : dans ce cas seulement, on appelle DELETE (R14).
export function removesWholeLine(items: ListItem[], productId: number, quantity: number): boolean {
  const item = findItem(items, productId)
  return item !== undefined && quantity >= item.quantity
}

// R44 : enlève X ; s'il ne reste rien, la ligne disparaît.
export function removeQuantity(items: ListItem[], productId: number, quantity: number): ListItem[] {
  if (removesWholeLine(items, productId, quantity)) {
    return removeFromList(items, productId)
  }
  return items.map((item) =>
    item.id === productId ? { ...item, quantity: item.quantity - quantity } : item,
  )
}

// R14 : retire la ligne entière, quelle que soit la quantité.
export function removeFromList(items: ListItem[], productId: number): ListItem[] {
  return items.filter((item) => item.id !== productId)
}

// R48 : coche / décoche « acheté ».
export function toggleBought(items: ListItem[], productId: number): ListItem[] {
  return items.map((item) => (item.id === productId ? { ...item, bought: !item.bought } : item))
}

// R7 : à acheter en haut, déjà acheté en bas ; chaque groupe garde l'ordre du premier ajout.
export function splitByBought(items: ListItem[]): { toBuy: ListItem[]; bought: ListItem[] } {
  return {
    toBuy: items.filter((item) => !item.bought),
    bought: items.filter((item) => item.bought),
  }
}

// Sous-total d'une ligne, en centimes : prix × quantité.
export function lineTotal(item: ListItem): number {
  return toCents(item.price) * item.quantity
}

export type Totals = {
  total: number // centimes, toutes les lignes
  bought: number // centimes, lignes cochées
  remaining: number // centimes, reste à payer
  count: number // nombre d'articles (somme des quantités)
}

// R46 : le récapitulatif. "reduce" parcourt la liste en accumulant un résultat.
export function computeTotals(items: ListItem[]): Totals {
  const total = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const bought = items
    .filter((item) => item.bought)
    .reduce((sum, item) => sum + lineTotal(item), 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return { total, bought, remaining: total - bought, count }
}
