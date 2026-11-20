import { ListLine } from './ListLine'
import { splitByBought } from './list'
import type { ListItem } from './types'

type Props = {
  items: ListItem[]
  french: boolean
  busy: boolean
  onAdd: (item: ListItem, quantity: number) => Promise<boolean>
  onRemove: (item: ListItem, quantity: number) => Promise<boolean>
  onToggleBought: (item: ListItem) => void
  favoriteIds: Set<number> // R59 : les produits favoris
  onToggleFavorite: (item: ListItem) => void
}

// Les lignes de la liste : à acheter, puis déjà achetées (le récapitulatif est dans Summary.tsx).
export function ShoppingList({ items, favoriteIds, ...lineProps }: Props) {
  if (items.length === 0) {
    return <p className="empty">La liste est vide</p>
  }

  const { toBuy, bought } = splitByBought(items) // R7

  return (
    <>
      {toBuy.length > 0 && (
        <ul className="list" aria-label="À acheter">
          {toBuy.map((item) => (
            // "{...lineProps}" passe d'un coup french, busy, onAdd… à chaque ligne.
            <ListLine key={item.id} item={item} favorite={favoriteIds.has(item.id)} {...lineProps} />
          ))}
        </ul>
      )}

      {bought.length > 0 && (
        <>
          <h2 className="section-title">Déjà acheté</h2>
          <ul className="list" aria-label="Déjà acheté">
            {bought.map((item) => (
              <ListLine key={item.id} item={item} favorite={favoriteIds.has(item.id)} {...lineProps} />
            ))}
          </ul>
        </>
      )}
    </>
  )
}
