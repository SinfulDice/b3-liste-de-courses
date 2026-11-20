import { createElement } from 'react'
import { iconFor } from './categoryIcons'

// R68 : affiche l'icône d'une catégorie. Décorative : le nom de la catégorie est toujours écrit à côté,
// donc on la cache aux lecteurs d'écran (aria-hidden).
// createElement(Composant, props) = ce que <Composant {...props} /> fait en coulisses. On l'utilise ici
// car le composant à afficher est CHOISI selon la catégorie (Shirt, Laptop…), pas écrit en dur.
export function CategoryIcon({ slug, size = 18 }: { slug: string; size?: number }) {
  return createElement(iconFor(slug), {
    className: `category-icon category-icon--${slug}`, // ex : category-icon--groceries
    size,
    'aria-hidden': true,
  })
}
