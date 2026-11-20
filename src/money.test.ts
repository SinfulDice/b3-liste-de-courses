import { describe, expect, it } from 'vitest'
import { formatEuros, toCents } from './money'

// Intl met des espaces insécables (qui empêchent « € » d'aller seul à la ligne).
// Pour comparer, on les remplace par des espaces normaux.
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('money.ts', () => {
  it('R47 : les prix sont convertis en centimes entiers, sans erreur d\'arrondi', () => {
    expect(toCents(1.99)).toBe(199)
    expect(toCents(0.29)).toBe(29) // 0.29 * 100 = 28.999999999999996 en JavaScript
    expect(toCents(1.15)).toBe(115) // 1.15 * 100 = 114.99999999999999
    expect(toCents(36999.99)).toBe(3699999)
  })

  it('R45 : format français en euros (virgule, espace avant €, espace pour les milliers)', () => {
    expect(plain(formatEuros(199))).toBe('1,99 €')
    expect(plain(formatEuros(3699999))).toBe('36 999,99 €')
    expect(plain(formatEuros(0))).toBe('0,00 €')
  })
})
