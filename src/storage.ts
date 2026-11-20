// Sauvegarde dans le navigateur (localStorage), en version "qui ne plante jamais" (R55).
// localStorage peut lancer une erreur (navigation privée, stockage plein ou bloqué) :
// on l'entoure toujours de try/catch, et on renvoie une valeur par défaut si besoin.

const PREFIX = 'liste-de-courses:'

export function loadValue<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback // rien de sauvegardé
    const value: unknown = JSON.parse(raw) // texte -> valeur JavaScript (peut lancer une erreur)
    return isValid(value) ? value : fallback // sauvegarde abîmée -> valeur par défaut
  } catch {
    return fallback
  }
}

export function saveValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value)) // valeur -> texte
  } catch {
    // Sauvegarde impossible : l'app continue sans (R55).
  }
}

// Petit "garde de type" réutilisable : vérifie qu'une valeur inconnue est un booléen.
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}
