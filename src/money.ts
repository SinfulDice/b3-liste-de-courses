// R45 + R47 : l'argent est calculé en CENTIMES (nombres entiers).
// Pourquoi ? En JavaScript, 0.1 + 0.2 = 0.30000000000000004 : les nombres à virgule sont
// stockés en binaire et ne tombent pas toujours juste. Les entiers, eux, sont exacts.

// 1.99 -> 199. Les prix DummyJSON ont au plus 2 décimales ; la multiplication peut donner
// une valeur un tout petit peu fausse (0.29 * 100 = 28.999999999999996) que Math.round corrige (29).
export function toCents(price: number): number {
  return Math.round(price * 100)
}

// Intl.NumberFormat = l'outil du navigateur pour écrire des nombres "à la française" :
// virgule pour les décimales, espace pour les milliers, « € » après le nombre.
const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

// 199 -> « 1,99 € ». R45 : on garde le nombre de DummyJSON (dollars), affiché en euros.
export function formatEuros(cents: number): string {
  return euros.format(cents / 100)
}
