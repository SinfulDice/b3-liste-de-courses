// Une licorne ailée vue de profil, tournée vers la droite, dessinée en SVG.
// "viewBox" définit le système de coordonnées (120 de large, 80 de haut) :
// le dessin s'adapte ensuite à n'importe quelle taille donnée en CSS.

type UnicornProps = {
  className?: string
}

export function Unicorn({ className }: UnicornProps) {
  return (
    <svg className={className} viewBox="0 0 120 80" aria-hidden="true" focusable="false">
      {/* Queue arc-en-ciel : trois courbes de couleurs différentes */}
      <path d="M30 42 C18 38 12 48 4 56" stroke="#ff8fc7" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M30 45 C20 44 14 54 8 62" stroke="#b18cff" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M30 48 C22 50 18 58 14 66" stroke="#7cc8ff" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Crinière arc-en-ciel, dessinée AVANT le cou pour qu'elle dépasse derrière lui */}
      <path d="M86 12 C76 16 70 26 64 38" stroke="#ff8fc7" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M82 12 C72 16 66 26 60 36" stroke="#b18cff" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Pattes repliées comme en plein vol : un trait lilas épais, puis un trait blanc
          plus fin par-dessus, ce qui dessine une patte blanche avec un contour. */}
      <g strokeLinecap="round">
        <g stroke="#c9b6e4" strokeWidth="8">
          <path d="M38 54 L32 68" />
          <path d="M46 56 L44 72" />
          <path d="M66 55 L72 68" />
          <path d="M74 52 L82 63" />
        </g>
        <g stroke="#ffffff" strokeWidth="4">
          <path d="M38 54 L32 68" />
          <path d="M46 56 L44 72" />
          <path d="M66 55 L72 68" />
          <path d="M74 52 L82 63" />
        </g>
      </g>

      {/* Corps + cou + tête, en blanc avec un contour lilas */}
      <g fill="#ffffff" stroke="#c9b6e4" strokeWidth="2" strokeLinejoin="round">
        <ellipse cx="55" cy="45" rx="27" ry="14" />
        <path d="M70 40 L82 18 L94 22 L80 50 Z" />
        <ellipse cx="93" cy="24" rx="12" ry="7" transform="rotate(25 93 24)" />
      </g>

      {/* Oreille, corne dorée, œil */}
      <path d="M86 16 L87 8 L91 15 Z" fill="#ffffff" stroke="#c9b6e4" strokeWidth="1.5" />
      <path d="M90 15 L101 1 L95 17 Z" fill="#ffd257" stroke="#e0a800" strokeWidth="1" />
      <circle cx="97" cy="23" r="1.8" fill="#3a2a4f" />

      {/* Aile en plumes (les petites bosses), posée sur le corps */}
      <path
        d="M48 40 C40 22 48 6 74 6 C70 10 70 12 66 14 C70 16 68 19 63 20 C66 23 64 26 60 27 C62 31 60 35 58 40 Z"
        fill="#eaf6ff"
        stroke="#9fc9ea"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
