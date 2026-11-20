import { Link } from 'react-router'
import { ShoppingList } from './ShoppingList'
import type { ListItem } from './types'

type Props = {
  items: ListItem[]
  listName: string
  french: boolean
  busy: boolean
  onAdd: (item: ListItem, quantity: number) => Promise<boolean>
  onRemove: (item: ListItem, quantity: number) => Promise<boolean>
  onToggleBought: (item: ListItem) => void
}

// Page Ma liste : le nom de la liste active, puis ses lignes et son récapitulatif.
export function ListPage({ listName, ...listProps }: Props) {
  return (
    <section aria-labelledby="list-title">
      <h2 id="list-title">{listName}</h2>
      <ShoppingList {...listProps} />
      {listProps.items.length === 0 && (
        // R5 : une liste vide propose d'aller choisir des produits.
        // <Link> change de page SANS recharger le site (contrairement à un <a href> classique).
        <p className="empty-link">
          <Link to="/">Choisir des produits</Link>
        </p>
      )}
    </section>
  )
}
