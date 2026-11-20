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

  it('R25 : le ciel de licornes est derrière le contenu, laisse passer les clics et ne déborde pas', () => {
    const css = readFileSync('src/unicorns.css', 'utf8')
    const sky = css.slice(css.indexOf('.sky {'), css.indexOf('}', css.indexOf('.sky {')))
    expect(sky).toContain('pointer-events: none')
    expect(sky).toContain('overflow: hidden')
    expect(sky).toContain('z-index: 0')
    expect(readFileSync('src/App.css', 'utf8')).toMatch(/\.app \{[^}]*z-index: 1/)
  })

  it('R26 + R31 : avec « moins d\'animations », toutes les animations de licornes sont coupées', () => {
    const css = readFileSync('src/unicorns.css', 'utf8')
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toContain('animation: none')
    for (const selector of ['.flyer', '.flyer-body', '.cart-ride', '.cart-ride-unicorn']) {
      expect(reduced).toContain(selector)
    }
  })

  it('R31 : la licorne au caddie (4s en CSS) et son minuteur ont la même durée', () => {
    const css = readFileSync('src/unicorns.css', 'utf8')
    expect(css).toContain('animation: ride-across 4s')
    expect(readFileSync('src/App.tsx', 'utf8')).toContain('CART_RIDE_MS = 4000')
  })

  it('R30 : le fichier du hennissement existe', () => {
    expect(existsSync('public/sounds/neigh.ogg')).toBe(true)
  })

  it('R21 : la page est en français et l\'onglet s\'appelle « Liste de courses »', () => {
    expect(html).toContain('<html lang="fr">')
    expect(html).toContain('<title>Liste de courses</title>')
  })
})
