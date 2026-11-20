import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Avant chaque test : jsdom (le faux navigateur) ne sait pas jouer de son.
// On remplace donc audio.play() par un faux qui "réussit" tout de suite,
// et qui permet aux tests de compter les hennissements (R27 à R30).
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
})

// Après chaque test : on enlève ce qui a été affiché, on remet les faux à zéro
// et on revient aux vrais minuteurs (certains tests les accélèrent).
afterEach(() => {
  cleanup()
  localStorage.clear() // chaque test repart d'un navigateur "neuf" (R54, R57)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
