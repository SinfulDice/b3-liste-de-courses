import { Link } from 'react-router'
import { couponDiscount, describeCoupon } from './coupons'
import { formatEuros } from './money'
import type { Coupon, ListItem } from './types'

type Props = {
  coupons: Coupon[] // tous les coupons créés
  checkedIds: string[] // ceux cochés pour cette liste
  items: ListItem[]
  french: boolean
  onToggle: (couponId: string) => void
}

// R65 : sur Ma liste, on coche les coupons à utiliser pour CETTE liste.
export function CouponPicker({ coupons, checkedIds, items, french, onToggle }: Props) {
  return (
    <section className="coupons-picker" aria-labelledby="coupons-picker-title">
      <h3 id="coupons-picker-title" className="section-title">
        Coupons
      </h3>
      {coupons.length === 0 ? (
        <p className="muted">
          Aucun coupon. <Link to="/coupons">Créer un coupon</Link>
        </p>
      ) : (
        <ul className="coupon-checks">
          {coupons.map((coupon) => {
            const checked = checkedIds.includes(coupon.id)
            return (
              <li key={coupon.id}>
                <label>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(coupon.id)} />
                  <strong>{coupon.name}</strong> {describeCoupon(coupon, french)}
                </label>
                {/* La réduction que ce coupon donne sur cette liste (R66), seulement s'il est coché. */}
                {checked && (
                  <span className="coupon-amount">−{formatEuros(couponDiscount(coupon, items))}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
