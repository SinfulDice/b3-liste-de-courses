// Un produit du catalogue DummyJSON (on ne garde que ce dont on a besoin).
export type Product = {
  id: number
  title: string // nom anglais, tel que DummyJSON l'envoie
  price: number // en dollars dans l'API, affiché en euros (R45)
  thumbnail: string // adresse de la petite image
  category: string // "slug" anglais, ex : "groceries"
}

// Une ligne d'une liste de courses : le produit + combien j'en veux + déjà acheté ou non.
export type ListItem = Product & {
  quantity: number
  bought: boolean // R48
}

// R49 : une liste de courses nommée. "id" ne change jamais (même si on renomme la liste).
export type ShoppingList = {
  id: string
  name: string
  items: ListItem[]
  couponIds: string[] // R65 : les coupons cochés pour CETTE liste
}

// R62 : un coupon. "value" : un pourcentage entier (10 = −10 %) ou des centimes (500 = −5,00 €).
export type CouponKind = 'percent' | 'euro'
export type Coupon = {
  id: string
  name: string
  kind: CouponKind
  value: number
  category: string // slug de la catégorie, ou '' = toute la liste
}

// Tout ce que l'app sauvegarde (R54) : les listes, la liste active et les coupons.
export type AppData = {
  lists: ShoppingList[]
  activeId: string
  coupons: Coupon[]
}
