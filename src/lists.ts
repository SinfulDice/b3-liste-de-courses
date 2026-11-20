import { addToList, isInList, removeFromList } from './list'
import type { AppData, ListItem, Product, ShoppingList } from './types'

// Gestion de PLUSIEURS listes (R49 à R53) et des favoris (R58 à R61).
// Comme list.ts, ce ne sont que des fonctions pures : elles reçoivent toutes les données (AppData)
// et renvoient de NOUVELLES données, sans rien modifier. App.tsx n'a plus qu'à les appeler.

export const FAVORITES_ID = 'favoris' // R58 : id fixe, pour toujours retrouver Favoris
export const FAVORITES_NAME = 'Favoris'
export const MAX_LIST_NAME = 40 // R52

// Fabrique un identifiant unique : l'heure (en base 36 = chiffres + lettres) + du hasard.
export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function emptyList(id: string, name: string): ShoppingList {
  return { id, name, items: [], couponIds: [] }
}

// R5 : au tout premier lancement, Favoris (vide) + « Ma liste » (vide, active).
export function initialData(): AppData {
  return {
    lists: [emptyList(FAVORITES_ID, FAVORITES_NAME), emptyList('ma-liste', 'Ma liste')],
    activeId: 'ma-liste',
    coupons: [],
  }
}

export function isFavoritesList(list: ShoppingList): boolean {
  return list.id === FAVORITES_ID
}

// La liste active. Si l'id ne correspond à rien (ne devrait pas arriver), on prend la première.
export function activeList(data: AppData): ShoppingList {
  return data.lists.find((list) => list.id === data.activeId) ?? data.lists[0]
}

export function favoritesList(data: AppData): ShoppingList {
  return data.lists.find(isFavoritesList) ?? emptyList(FAVORITES_ID, FAVORITES_NAME)
}

// R52 : renvoie un message d'erreur, ou null si le nom est bon.
// "exceptId" : quand on renomme, la liste peut garder son propre nom (ou changer ses majuscules).
export function listNameError(name: string, lists: ShoppingList[], exceptId?: string): string | null {
  const clean = name.trim()
  if (clean === '') return 'Le nom de la liste ne peut pas être vide.'
  if (clean.length > MAX_LIST_NAME) {
    return `Le nom de la liste doit faire ${MAX_LIST_NAME} caractères au plus.`
  }
  const taken = lists.some(
    (list) => list.id !== exceptId && list.name.toLowerCase() === clean.toLowerCase(),
  )
  if (taken) return `Une liste s'appelle déjà « ${clean} ».`
  return null
}

// R50 + R61 : nouvelle liste (nom déjà vérifié), qui reçoit 1 de chaque favori, non coché.
// Elle devient la liste active.
export function createList(data: AppData, name: string, id = makeId()): AppData {
  const items: ListItem[] = favoritesList(data).items.map((item) => ({
    ...item,
    quantity: 1,
    bought: false,
  }))
  return {
    ...data,
    lists: [...data.lists, { id, name: name.trim(), items, couponIds: [] }],
    activeId: id,
  }
}

// R51 + R58 : renommer (sauf Favoris).
export function renameList(data: AppData, id: string, name: string): AppData {
  if (id === FAVORITES_ID) return data
  return {
    ...data,
    lists: data.lists.map((list) => (list.id === id ? { ...list, name: name.trim() } : list)),
  }
}

// R53 + R58 : supprimer (sauf Favoris). La première autre liste devient active, sinon Favoris.
export function deleteList(data: AppData, id: string): AppData {
  if (id === FAVORITES_ID) return data
  const lists = data.lists.filter((list) => list.id !== id)
  const next = lists.find((list) => !isFavoritesList(list)) ?? lists[0]
  return { ...data, lists, activeId: data.activeId === id ? next.id : data.activeId }
}

export function setActive(data: AppData, id: string): AppData {
  return data.lists.some((list) => list.id === id) ? { ...data, activeId: id } : data
}

// Applique une fonction de list.ts (addToList, toggleBought…) aux lignes d'UNE liste.
// On passe l'id de la liste, pas "la liste active" : si l'utilisateur change de liste pendant un appel
// à l'API, l'ajout va quand même dans la liste où il a cliqué.
export function updateItems(
  data: AppData,
  listId: string,
  change: (items: ListItem[]) => ListItem[],
): AppData {
  return {
    ...data,
    lists: data.lists.map((list) =>
      list.id === listId ? { ...list, items: change(list.items) } : list,
    ),
  }
}

// R59 : un produit est favori s'il a une ligne dans Favoris.
export function isFavorite(data: AppData, productId: number): boolean {
  return isInList(favoritesList(data).items, productId)
}

// R60 : pas favori -> ligne de quantité 1 dans Favoris ; favori -> sa ligne est enlevée.
export function toggleFavorite(data: AppData, product: Product): AppData {
  return updateItems(data, FAVORITES_ID, (items) =>
    isInList(items, product.id) ? removeFromList(items, product.id) : addToList(items, product, 1),
  )
}
