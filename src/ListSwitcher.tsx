import { useState, type FormEvent } from 'react'
import { isFavoritesList, listNameError, MAX_LIST_NAME } from './lists'
import type { ShoppingList } from './types'

type Props = {
  lists: ShoppingList[]
  activeId: string
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onRename: (name: string) => void
  onDelete: () => void
}

// Ce que le petit formulaire est en train de faire : rien, créer, ou renommer.
type Mode = 'idle' | 'create' | 'rename'

// R49 à R53 : choisir la liste active, et créer / renommer / supprimer une liste.
export function ListSwitcher({ lists, activeId, onSelect, onCreate, onRename, onDelete }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const active = lists.find((list) => list.id === activeId) ?? lists[0]
  const locked = isFavoritesList(active) // R58 : Favoris ne se renomme ni ne se supprime

  function open(next: Mode) {
    setMode(next)
    setName(next === 'rename' ? active.name : '') // pour renommer, on part du nom actuel
    setError(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // R52 : on vérifie le nom ; en renommant, la liste peut garder son propre nom.
    const problem = listNameError(name, lists, mode === 'rename' ? active.id : undefined)
    if (problem) {
      setError(problem)
      return // rien n'est créé ni renommé
    }
    if (mode === 'create') onCreate(name)
    else onRename(name)
    setMode('idle')
  }

  function handleDelete() {
    // R53 : window.confirm affiche une boîte « OK / Annuler » du navigateur et renvoie true ou false.
    if (window.confirm(`Supprimer la liste « ${active.name} » ?`)) onDelete()
  }

  return (
    <div className="lists">
      <div className="lists-row">
        <label className="lists-select">
          Liste active
          <select value={activeId} onChange={(event) => onSelect(event.target.value)}>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </label>
        <div className="lists-buttons">
          <button type="button" className="btn-light" onClick={() => open('create')}>
            Nouvelle liste
          </button>
          <button type="button" className="btn-light" onClick={() => open('rename')} disabled={locked}>
            Renommer
          </button>
          <button type="button" className="btn-light btn-light-danger" onClick={handleDelete} disabled={locked}>
            Supprimer
          </button>
        </div>
      </div>

      {mode !== 'idle' && (
        <form
          className="lists-form"
          aria-label={mode === 'create' ? 'Nouvelle liste' : 'Renommer la liste'}
          onSubmit={handleSubmit}
        >
          <label>
            Nom de la liste
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_LIST_NAME + 10} // une petite marge : les espaces autour sont enlevés ensuite
              autoFocus // le curseur est mis dans le champ dès qu'il apparaît
            />
          </label>
          <button type="submit">{mode === 'create' ? 'Créer' : 'Enregistrer'}</button>
          <button type="button" className="btn-light" onClick={() => setMode('idle')}>
            Annuler
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
