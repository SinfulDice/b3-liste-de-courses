import { useState } from 'react'
import { categoryName } from './i18n/translate'
import { findItem } from './list'
import { ProductCard } from './ProductCard'
import { ALL_CATEGORIES, categoriesOf, filterProducts } from './search'
import type { ListItem, Product } from './types'

type Props = {
  catalog: Product[]
  items: ListItem[] // les lignes de la liste active (pour R41)
  listName: string // R40 : « Ajouter à : … »
  french: boolean
  busy: boolean
  onAdd: (product: Product, quantity: number) => Promise<boolean>
}

// Page Produits (R38 à R41).
export function ProductsPage({ catalog, items, listName, french, busy, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)

  // Recalculé à chaque affichage : 194 produits, c'est très rapide, pas besoin d'optimiser.
  const visible = filterProducts(catalog, query, category)

  return (
    <section aria-labelledby="products-title">
      <h2 id="products-title">Produits</h2>
      <p className="target-list">
        Ajouter à : <strong>{listName}</strong>
      </p>

      <div className="filters">
        <label className="filter">
          Rechercher
          {/* type="search" : sur mobile, le clavier affiche une touche « Rechercher ». */}
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="filter">
          Catégorie
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value={ALL_CATEGORIES}>Toutes</option>
            {categoriesOf(catalog).map((slug) => (
              <option key={slug} value={slug}>
                {categoryName(slug, french)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="empty">Aucun produit trouvé</p>
      ) : (
        <div className="grid">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              french={french}
              busy={busy}
              inList={findItem(items, product.id)?.quantity ?? 0}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </section>
  )
}
