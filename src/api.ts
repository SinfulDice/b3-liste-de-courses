import type { Product } from './types'

const API = 'https://dummyjson.com'

// fetch ne lance PAS d'erreur quand le serveur répond 404 ou 500 : il faut vérifier
// response.ok nous-mêmes. Cette petite fonction le fait pour tous les appels.
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`DummyJSON a répondu ${response.status}`)
  }
  return response.json() as Promise<T>
}

// R1 : tout le catalogue. "limit=0" = tous les produits (194) ; "select=…" demande à DummyJSON
// de n'envoyer que ces champs (et l'id), ce qui allège beaucoup la réponse.
export async function fetchCatalog(): Promise<Product[]> {
  const data = await request<{ products: Product[] }>(
    `${API}/products?limit=0&select=title,price,thumbnail,category`,
  )
  return data.products.map(({ id, title, price, thumbnail, category }) => ({
    id,
    title,
    price,
    thumbnail,
    category,
  }))
}

// R9 : DummyJSON fait semblant d'ajouter le produit (il renvoie toujours id 195, R11).
export async function addProduct(title: string): Promise<void> {
  await request(`${API}/products/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}

// R14 : DummyJSON fait semblant de supprimer le produit.
export async function deleteProduct(id: number): Promise<void> {
  await request(`${API}/products/${id}`, { method: 'DELETE' })
}
