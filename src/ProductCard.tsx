import { useState } from 'react'
import { CategoryIcon } from './CategoryIcon'
import { FavoriteButton } from './FavoriteButton'
import { categoryName, productName } from './i18n/translate'
import { formatEuros, toCents } from './money'
import { QuantityPicker } from './QuantityPicker'
import type { Product } from './types'

type Props = {
  product: Product
  french: boolean
  busy: boolean
  inList: number // R41 : quantité déjà dans la liste active (0 = absent)
  onAdd: (product: Product, quantity: number) => Promise<boolean>
  favorite: boolean // R59
  onToggleFavorite: (product: Product) => void
}

// R38 + R40 + R41 : la carte d'un produit sur la page Produits.
export function ProductCard({ product, french, busy, inList, onAdd, favorite, onToggleFavorite }: Props) {
  const [quantity, setQuantity] = useState(1) // R43 : X propre à chaque carte
  const name = productName(product, french)

  return (
    // <article> = un bloc qui a du sens tout seul. aria-label lui donne le nom du produit.
    <article className="card" aria-label={name}>
      {/* alt="" : l'image est décorative, le nom est déjà écrit juste en dessous. */}
      <img className="card-img" src={product.thumbnail} alt="" loading="lazy" />
      {/* R59 : la licorne des favoris, posée en haut à droite de l'image (CSS). */}
      <FavoriteButton favorite={favorite} onToggle={() => onToggleFavorite(product)} />
      <div className="card-body">
        <h3 className="card-name">{name}</h3>
        <p className="card-category">
          <CategoryIcon slug={product.category} /> {/* R68 */}
          {categoryName(product.category, french)}
        </p>
        <p className="card-price">{formatEuros(toCents(product.price))}</p>
        {inList > 0 && <p className="card-in-list">Dans la liste : {inList}</p>}
        <div className="card-actions">
          <QuantityPicker value={quantity} onChange={setQuantity} label={`Quantité de ${name}`} />
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await onAdd(product, quantity)) setQuantity(1) // R43
            }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </article>
  )
}
