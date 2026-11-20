// R43 : bornes de la quantité X, et correction d'une saisie.
// Dans un fichier à part (pas dans QuantityPicker.tsx) : un fichier de composant ne doit
// exporter que des composants, sinon le "Fast Refresh" de Vite (rechargement rapide) ne marche plus.

export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 99

// Ramène n'importe quelle saisie à un entier entre 1 et 99.
// "abc" ou "" -> 1 ; "0" -> 1 ; "150" -> 99 ; "3.7" -> 3.
export function clampQuantity(text: string): number {
  const value = Number.parseInt(text, 10) // texte -> entier (NaN si ce n'est pas un nombre)
  if (Number.isNaN(value)) return MIN_QUANTITY
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value))
}
