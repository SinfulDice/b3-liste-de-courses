import { useState } from 'react'

export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 99

// R43 : ramène n'importe quelle saisie à un entier entre 1 et 99.
// "abc" ou "" -> 1 ; "0" -> 1 ; "150" -> 99 ; "3.7" -> 3.
export function clampQuantity(text: string): number {
  const value = Number.parseInt(text, 10) // texte -> entier (NaN si ce n'est pas un nombre)
  if (Number.isNaN(value)) return MIN_QUANTITY
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value))
}

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
