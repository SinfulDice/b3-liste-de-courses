import { useState } from 'react'
import { MAX_QUANTITY, MIN_QUANTITY, clampQuantity } from './quantity'

type Props = {
  value: number
  onChange: (value: number) => void
  label: string // pour les lecteurs d'écran, ex : « Quantité de Pomme »
}

// R43 : [−] [ X ] [+]. Composant "contrôlé" : la valeur vient du parent (props),
// et chaque changement est renvoyé au parent par onChange.
export function QuantityPicker({ value, onChange, label }: Props) {
  // Pendant qu'on tape, le champ peut contenir un texte invalide ("", "1a") :
  // on le garde à part dans "draft", et on ne le corrige qu'en quittant le champ (onBlur).
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <div className="qty" role="group" aria-label={label}>
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(value - 1)}
        disabled={value <= MIN_QUANTITY}
        aria-label="Moins un"
      >
        −
      </button>
      <input
        className="qty-input"
        type="text"
        inputMode="numeric" // sur mobile : clavier avec des chiffres
        aria-label="Quantité"
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== null) onChange(clampQuantity(draft))
          setDraft(null)
        }}
      />
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label="Plus un"
      >
        +
      </button>
    </div>
  )
}
