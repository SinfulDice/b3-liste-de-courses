import { useEffect, useState, type FormEvent } from 'react'
import { addProduct, deleteProduct, fetchCatalog } from './api'
import { addToList, isInList, removeFromList } from './list'
import type { ListItem, Product } from './types'
import './App.css'

// État du chargement du catalogue : en cours, raté ou prêt.
type CatalogStatus = 'loading' | 'error' | 'ready'

function App() {
  // useState garde une valeur entre deux affichages ; quand on la change, React réaffiche.
  const [catalog, setCatalog] = useState<Product[]>([])
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [list, setList] = useState<ListItem[]>([]) // R5 : commence vide. R16 : juste en mémoire.
  const [selectedId, setSelectedId] = useState('') // '' = aucun produit choisi
  const [busy, setBusy] = useState(false) // R18 : un appel à l'API est en cours
  const [error, setError] = useState<string | null>(null)

  // useEffect lance du code APRÈS l'affichage. Avec [] à la fin, une seule fois au démarrage.
  useEffect(() => {
    // Si le composant disparaît avant la réponse, on ignore la réponse (évite un avertissement React).
    let cancelled = false
    fetchCatalog()
      .then((products) => {
        if (cancelled) return
        setCatalog(products)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error') // R3
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAdd(event: FormEvent) {
    event.preventDefault() // empêche le formulaire de recharger la page
    const product = catalog.find((p) => String(p.id) === selectedId)
    if (!product) return // R8 : rien de choisi -> rien ne se passe

    // R10 : déjà dans la liste -> quantité + 1, sans appel API (DummyJSON ignore la quantité).
    if (isInList(list, product.id)) {
      setList((current) => addToList(current, product))
      setError(null) // R17
      return
    }

    setBusy(true)
    try {
      await addProduct(product.title) // R9
      setList((current) => addToList(current, product))
      setError(null) // R17
    } catch {
      setError("L'ajout a échoué. Réessaie.") // R12
    } finally {
      setBusy(false) // "finally" s'exécute dans tous les cas, réussite ou échec
    }
  }

  async function handleDelete(item: ListItem) {
    setBusy(true)
    try {
      await deleteProduct(item.id) // R14 : id du catalogue
      setList((current) => removeFromList(current, item.id))
      setError(null) // R17
    } catch {
      setError(`La suppression de « ${item.title} » a échoué. Réessaie.`) // R15
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="app">
      <h1>Liste de courses</h1>

      {status === 'loading' && <p>Chargement…</p>}

      {status === 'error' && (
        <p className="error" role="alert">
          Impossible de charger le catalogue. Vérifie ta connexion puis recharge la page.
        </p>
      )}

      {status === 'ready' && (
        <>
          <form className="add-form" onSubmit={handleAdd}>
            <label htmlFor="product">Produit</label>
            <select
              id="product"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              <option value="">— Choisir un produit —</option>
              {catalog.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
            <button type="submit" disabled={busy}>
              Ajouter
            </button>
          </form>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {list.length === 0 ? (
            <p className="empty">La liste est vide</p>
          ) : (
            <ul className="list" aria-label="Ma liste">
              {list.map((item) => (
                // key : React a besoin d'un identifiant unique par ligne (R11 : id du catalogue).
                <li key={item.id}>
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={busy}
                    aria-label={`Supprimer ${item.title}`}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}

export default App
