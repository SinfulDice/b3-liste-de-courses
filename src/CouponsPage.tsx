import { useState, type FormEvent } from 'react'
import { CategoryIcon } from './CategoryIcon'
import { checkCoupon, describeCoupon, WHOLE_LIST, type CouponInput } from './coupons'
import { categoryName } from './i18n/translate'
import type { Coupon, CouponKind } from './types'

type Props = {
  coupons: Coupon[]
  categories: string[] // triées (R70)
  french: boolean
  onCreate: (coupon: Omit<Coupon, 'id'>) => void
  onDelete: (couponId: string) => void
}

const EMPTY_FORM: CouponInput = { name: '', kind: 'percent', value: '', category: WHOLE_LIST }

// Page Coupons (R62 à R64) : un formulaire pour créer, puis la liste des coupons.
export function CouponsPage({ coupons, categories, french, onCreate, onDelete }: Props) {
  // Tout le formulaire dans UN objet d'état. Pour changer un champ : { ...form, champ: valeur }.
  const [form, setForm] = useState<CouponInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = checkCoupon(form, coupons) // R63
    if (!result.ok) {
      setError(result.error)
      return
    }
    onCreate(result.coupon)
    setForm(EMPTY_FORM) // le formulaire se vide pour le coupon suivant
    setError(null)
  }

  return (
    <section aria-labelledby="coupons-title" className="narrow">
      <h2 id="coupons-title">Coupons</h2>

      <form className="coupon-form" aria-label="Nouveau coupon" onSubmit={handleSubmit}>
        <label>
          Nom du coupon
          <input
            value={form.name}
            placeholder="ex : LICORNE10"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Type
          <select
            value={form.kind}
            onChange={(event) => setForm({ ...form, kind: event.target.value as CouponKind })}
          >
            <option value="percent">Pourcentage (%)</option>
            <option value="euro">Montant (€)</option>
          </select>
        </label>
        <label>
          Valeur
          {/* inputMode="decimal" : sur mobile, un clavier de chiffres avec la virgule. */}
          <input
            value={form.value}
            inputMode="decimal"
            placeholder={form.kind === 'percent' ? 'ex : 10' : 'ex : 5,50'}
            onChange={(event) => setForm({ ...form, value: event.target.value })}
          />
        </label>
        <label>
          S'applique à
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            <option value={WHOLE_LIST}>Toute la liste</option>
            {categories.map((slug) => (
              <option key={slug} value={slug}>
                {categoryName(slug, french)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Créer le coupon</button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>

      {coupons.length === 0 ? (
        <p className="empty">Aucun coupon pour l'instant</p>
      ) : (
        <ul className="coupon-list" aria-label="Mes coupons">
          {coupons.map((coupon) => (
            <li key={coupon.id} className="coupon" aria-label={coupon.name}>
              {coupon.category !== WHOLE_LIST && <CategoryIcon slug={coupon.category} />}
              <div className="coupon-text">
                <strong>{coupon.name}</strong>
                <span>{describeCoupon(coupon, french)}</span>
              </div>
              <button
                type="button"
                className="btn-light btn-light-danger"
                aria-label={`Supprimer le coupon ${coupon.name}`}
                onClick={() => onDelete(coupon.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
