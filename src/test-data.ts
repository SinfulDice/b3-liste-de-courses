// Produits de test, copiés du vrai catalogue DummyJSON (mêmes id, noms et prix).
import type { Product } from './types'

export const apple: Product = {
  id: 16,
  title: 'Apple', // -> « Pomme » en français
  price: 1.99,
  thumbnail: 'https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp',
  category: 'groceries',
}

export const milk: Product = {
  id: 32,
  title: 'Milk', // -> « Lait » en français
  price: 3.49,
  thumbnail: 'https://cdn.dummyjson.com/product-images/groceries/milk/thumbnail.webp',
  category: 'groceries',
}
