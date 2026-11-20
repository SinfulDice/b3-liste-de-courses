import type { CSSProperties } from 'react'
import { Unicorn } from './Unicorn'
import './unicorns.css'

// R25 : réglages de chaque licorne du fond. Le délai est NÉGATIF : l'animation démarre
// "déjà commencée", donc les licornes sont réparties sur l'écran dès l'ouverture de la page.
// "rest" = où elle reste posée si le système demande moins d'animations (R26).
const FLYERS = [
  { top: '6%', size: 90, duration: 26, delay: -4, rest: '8%' },
  { top: '22%', size: 60, duration: 34, delay: -20, rest: '62%' },
  { top: '40%', size: 110, duration: 30, delay: -12, rest: '30%' },
  { top: '58%', size: 70, duration: 38, delay: -30, rest: '80%' },
  { top: '74%', size: 95, duration: 28, delay: -18, rest: '45%' },
  { top: '88%', size: 55, duration: 40, delay: -8, rest: '15%' },
]

export function UnicornSky() {
  return (
    // aria-hidden : décoratif, les lecteurs d'écran l'ignorent.
    <div className="sky" aria-hidden="true" data-testid="sky">
      {FLYERS.map((flyer, index) => (
        <div
          key={index}
          className="flyer"
          // Variables CSS propres à chaque licorne, lues dans unicorns.css avec var(--…).
          style={
            {
              '--top': flyer.top,
              '--size': `${flyer.size}px`,
              '--duration': `${flyer.duration}s`,
              '--delay': `${flyer.delay}s`,
              '--rest': flyer.rest, // R26 : position fixe quand les animations sont coupées
            } as CSSProperties
          }
        >
          <Unicorn className="flyer-body" />
        </div>
      ))}
    </div>
  )
}
