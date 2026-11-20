import { useState } from 'react'
import { productName } from './i18n/translate'
import { lineTotal } from './list'
import { formatEuros, toCents } from './money'
import { QuantityPicker } from './QuantityPicker'
import type { ListItem } from './types'

type Props = {
  item: ListItem
  french: boolean
  busy: boolean
  // Renvoient une promesse de "réussi ?" pour remettre X à 1 après un succès (R43).
  onAdd: (item: ListItem, quantity: number) => Promise<boolean>
  onRemove: (item: ListItem, quantity: number) => Promise<boolean>
  onToggleBought: (item: ListItem) => void
}

// R6 : une ligne de la liste : image, nom, prix unitaire × quantité, sous-total,
// case « acheté », sélecteur X et boutons Ajouter / Retirer.
export function ListLine({ item, french, busy, onAdd, onRemove, onToggleBought }: Props) {
  // Chaque ligne a son propre X (1 par défaut). Il vit ici : le reste de l'app n'en a pas besoin.
  const [quantity, setQuantity] = useState(1)
  const name = productName(item, french)

  return (
    // aria-label donne un nom à la ligne : les tests (et les lecteurs d'écran) la retrouvent par ce nom.
    <li className={item.bought ? 'line line--bought' : 'line'} aria-label={name}>
      <img className="line-img" src={item.thumbnail} alt="" loading="lazy" />
      <div className="line-info">
        <label className="line-check">
          <input
            type="checkbox"
            checked={item.bought}
            onChange={() => onToggleBought(item)}
          />
          {/* R48 : le nom est barré via le CSS quand la ligne est cochée. */}
          <span className="line-name">{name}</span>
        </label>
        <p className="line-price">
          {item.quantity} × {formatEuros(toCents(item.price))} ={' '}
          <strong>{formatEuros(lineTotal(item))}</strong>
        </p>
      </div>
      <div className="line-actions">
        <QuantityPicker value={quantity} onChange={setQuantity} label={`Quantité pour ${name}`} />
        <button
          type="button"
          onClick={async () => {
            if (await onAdd(item, quantity)) setQuantity(1) // R43
          }}
          disabled={busy}
        >
          Ajouter
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={async () => {
            if (await onRemove(item, quantity)) setQuantity(1) // R43
          }}
          disabled={busy}
        >
          Retirer
        </button>
      </div>
    </li>
  )
}
