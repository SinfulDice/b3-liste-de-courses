// Un produit du catalogue DummyJSON (on ne garde que ce dont on a besoin).
export type Product = {
  id: number
  title: string // nom anglais, tel que DummyJSON l'envoie
  price: number // en dollars dans l'API, affiché en euros (R45)
  thumbnail: string // adresse de la petite image
  category: string // "slug" anglais, ex : "groceries"
}

// Une ligne de MA liste de courses : un produit + combien j'en veux.
export type ListItem = Product & {
  quantity: number
}
