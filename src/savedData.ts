import { FAVORITES_ID, FAVORITES_NAME, initialData } from './lists'
import { loadValue, saveValue } from './storage'
import type { AppData, Coupon, ListItem, ShoppingList } from './types'

// R54 + R55 : lire et écrire toutes les données de l'app dans le localStorage.
// Ce qu'on relit peut être n'importe quoi (ancienne version de l'app, fichier modifié à la main…) :
// chaque "garde de type" ci-dessous vérifie un morceau avant qu'on lui fasse confiance.

const KEY = 'data'

// "Record<string, unknown>" = un objet dont on ne connaît pas encore le contenu.
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isListItem(value: unknown): value is ListItem {
  return (
    isObject(value) &&
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.price === 'number' &&
    typeof value.thumbnail === 'string' &&
    typeof value.category === 'string' &&
    Number.isInteger(value.quantity) &&
    (value.quantity as number) >= 1 &&
    typeof value.bought === 'boolean'
  )
}

function isShoppingList(value: unknown): value is ShoppingList {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.items) &&
    value.items.every(isListItem) &&
    Array.isArray(value.couponIds) &&
    value.couponIds.every((id) => typeof id === 'string')
  )
}

function isCoupon(value: unknown): value is Coupon {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.kind === 'percent' || value.kind === 'euro') &&
    typeof value.value === 'number' &&
    typeof value.category === 'string'
  )
}

export function isAppData(value: unknown): value is AppData {
  return (
    isObject(value) &&
    Array.isArray(value.lists) &&
    value.lists.length > 0 &&
    value.lists.every(isShoppingList) &&
    typeof value.activeId === 'string' &&
    Array.isArray(value.coupons) &&
    value.coupons.every(isCoupon)
  )
}

// Répare les petits défauts d'une sauvegarde valide : Favoris absent (R58), liste active inconnue.
function repair(data: AppData): AppData {
  const lists = data.lists.some((list) => list.id === FAVORITES_ID)
    ? data.lists
    : [{ id: FAVORITES_ID, name: FAVORITES_NAME, items: [], couponIds: [] }, ...data.lists]
  const activeId = lists.some((list) => list.id === data.activeId) ? data.activeId : lists[0].id
  return { ...data, lists, activeId }
}

// R55 : absente, illisible ou abîmée -> premier lancement (R5).
export function loadAppData(): AppData {
  const saved = loadValue<AppData | null>(KEY, null, (value): value is AppData | null =>
    isAppData(value),
  )
  return saved ? repair(saved) : initialData()
}

export function saveAppData(data: AppData): void {
  saveValue(KEY, data)
}
