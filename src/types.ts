// Un produit du catalogue DummyJSON (on ne garde que ce dont on a besoin).
export type Product = {
  id: number
  title: string
}

// Une ligne de MA liste de courses : un produit + combien j'en veux.
export type ListItem = Product & {
  quantity: number
}
