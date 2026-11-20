// Tests sur les fichiers du projet (pas sur React). Ce dossier est hors de src/,
// car ces tests lisent des fichiers avec Node (node:fs), ce que le code du navigateur ne fait pas.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync('index.html', 'utf8')

describe('fichiers statiques', () => {
  it('R19 : index.html pointe vers un favicon SVG qui existe', () => {
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />')
    expect(existsSync('public/favicon.svg')).toBe(true)
  })

  it('R19 : le favicon est le caddie, pas le logo Vite', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8')
    expect(svg).toContain('caddie')
    expect(svg.toLowerCase()).not.toContain('vite')
  })

  it('R20 : la page a la balise viewport pour les mobiles', () => {
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1.0"')
  })

  it('R21 : la page est en français et l\'onglet s\'appelle « Liste de courses »', () => {
    expect(html).toContain('<html lang="fr">')
    expect(html).toContain('<title>Liste de courses</title>')
  })
})
