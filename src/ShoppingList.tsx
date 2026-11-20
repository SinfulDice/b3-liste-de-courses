import { ListLine } from './ListLine'
import { computeTotals, splitByBought } from './list'
import { formatEuros } from './money'
import type { ListItem } from './types'

type Props = {
  items: ListItem[]
  french: boolean
  busy: boolean
  onAdd: (item: ListItem, quantity: number) => Promise<boolean>
  onRemove: (item: ListItem, quantity: number) => Promise<boolean>
  onToggleBought: (item: ListItem) => void
}

// La liste de courses : lignes à acheter, lignes déjà achetées, puis le récapitulatif.
export function ShoppingList({ items, ...lineProps }: Props) {
  if (items.length === 0) {
    return <p className="empty">La liste est vide</p>
  }

  const { toBuy, bought } = splitByBought(items) // R7
  const totals = computeTotals(items) // R46

  return (
    <>
      {toBuy.length > 0 && (
        <ul className="list" aria-label="À acheter">
          {toBuy.map((item) => (
            // "{...lineProps}" passe d'un coup french, busy, onAdd… à chaque ligne.
            <ListLine key={item.id} item={item} {...lineProps} />
          ))}
        </ul>
      )}

      {bought.length > 0 && (
        <>
          <h2 className="section-title">Déjà acheté</h2>
          <ul className="list" aria-label="Déjà acheté">
            {bought.map((item) => (
              <ListLine key={item.id} item={item} {...lineProps} />
            ))}
          </ul>
        </>
      )}

      {/* R46 : <dl> = liste de "termes" (dt) et de leurs "valeurs" (dd), parfait pour un récap. */}
      <dl className="summary" aria-label="Récapitulatif">
        <div>
          <dt>Articles</dt>
          <dd>{totals.count}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatEuros(totals.total)}</dd>
        </div>
        <div>
          <dt>Déjà acheté</dt>
          <dd>{formatEuros(totals.bought)}</dd>
        </div>
        <div className="summary-remaining">
          <dt>Reste à payer</dt>
          <dd>{formatEuros(totals.remaining)}</dd>
        </div>
      </dl>
    </>
  )
}
