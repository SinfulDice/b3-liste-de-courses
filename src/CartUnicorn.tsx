import { Unicorn } from './Unicorn'
import './unicorns.css'

export type CartRide = {
  key: number // identifiant unique de ce passage (plusieurs peuvent passer en même temps, R31)
  title: string // nom du produit écrit sur le caddie
  kind: 'add' | 'remove' // R27 : ajout ; R28 : suppression (nom barré)
}

// Une licorne qui pousse un caddie et traverse l'écran (l'animation est en CSS).
export function CartUnicorn({ ride }: { ride: CartRide }) {
  return (
    <div className={`cart-ride cart-ride--${ride.kind}`} data-testid="cart-unicorn">
      <Unicorn className="cart-ride-unicorn" />
      <div className="cart-ride-cart">
        {/* L'étiquette sur le caddie ; barrée pour une suppression (R28), via le CSS. */}
        <span className="cart-ride-label">{ride.title}</span>
        {/* Le caddie : même dessin que le favicon, en plus simple. */}
        <svg viewBox="0 0 64 56" aria-hidden="true" focusable="false">
          <path
            d="M4 6h7l6 25h28l5-18H14"
            fill="#ffffff"
            stroke="#1f8a4c"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="44" r="5" fill="#1f8a4c" />
          <circle cx="42" cy="44" r="5" fill="#1f8a4c" />
        </svg>
      </div>
    </div>
  )
}
