import { Link } from 'react-router'
import { computeSummary } from './coupons'
import { CouponPicker } from './CouponPicker'
import { ShoppingList } from './ShoppingList'
import { Summary } from './Summary'
import type { Coupon, ListItem, ShoppingList as List } from './types'

type Props = {
  list: List // la liste active
  coupons: Coupon[] // tous les coupons créés (R65)
  french: boolean
  busy: boolean
  favoriteIds: Set<number>
  onAdd: (item: ListItem, quantity: number) => Promise<boolean>
  onRemove: (item: ListItem, quantity: number) => Promise<boolean>
  onToggleBought: (item: ListItem) => void
  onToggleFavorite: (item: ListItem) => void
  onToggleCoupon: (couponId: string) => void
}

// Page Ma liste : nom de la liste active, ses lignes, ses coupons, puis le récapitulatif.
export function ListPage({ list, coupons, onToggleCoupon, ...lineProps }: Props) {
  const checked = coupons.filter((coupon) => list.couponIds.includes(coupon.id))
  const summary = computeSummary(list.items, checked) // R46 + R66

  return (
    <section aria-labelledby="list-title" className="narrow">
      <h2 id="list-title">{list.name}</h2>
      <ShoppingList items={list.items} {...lineProps} />
      {list.items.length === 0 ? (
        // R5 : une liste vide propose d'aller choisir des produits.
        // <Link> change de page SANS recharger le site (contrairement à un <a href> classique).
        <p className="empty-link">
          <Link to="/">Choisir des produits</Link>
        </p>
      ) : (
        <>
          <CouponPicker
            coupons={coupons}
            checkedIds={list.couponIds}
            items={list.items}
            french={lineProps.french}
            onToggle={onToggleCoupon}
          />
          <Summary summary={summary} hasCoupons={checked.length > 0} />
        </>
      )}
    </section>
  )
}
