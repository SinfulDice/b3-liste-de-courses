import { Unicorn } from './Unicorn'

type Props = {
  favorite: boolean
  onToggle: () => void
}

// R59 : le bouton licorne. En couleur = favori, grise = pas favori (le gris est fait en CSS).
// Le nom du bouton (aria-label) dit ce qu'un clic va FAIRE, pour les lecteurs d'écran ;
// "title" affiche le même texte en bulle quand la souris passe dessus.
export function FavoriteButton({ favorite, onToggle }: Props) {
  const label = favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
  return (
    <button
      type="button"
      className={favorite ? 'fav fav--on' : 'fav'}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <Unicorn className="fav-unicorn" />
    </button>
  )
}
