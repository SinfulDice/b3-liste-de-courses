import { useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import { addProduct, deleteProduct, fetchCatalog } from './api'
import { CartUnicorn, type CartRide } from './CartUnicorn'
import { productName } from './i18n/translate'
import { ListPage } from './ListPage'
import { addToList, computeTotals, isInList, removeQuantity, removesWholeLine, toggleBought } from './list'
import { ProductsPage } from './ProductsPage'
import { playNeigh } from './sound'
import { isBoolean, loadValue, saveValue } from './storage'
import type { ListItem, Product } from './types'
import { UnicornSky } from './UnicornSky'
import './App.css'

// R31 : durée d'un passage de licorne au caddie (la même que l'animation CSS ride-across).
export const CART_RIDE_MS = 4000

// État du chargement du catalogue : en cours, raté ou prêt.
type CatalogStatus = 'loading' | 'error' | 'ready'

// Nom de la liste (une seule pour l'instant ; plusieurs listes à l'étape 4).
const LIST_NAME = 'Ma liste'

function App() {
  // useState garde une valeur entre deux affichages ; quand on la change, React réaffiche.
  const [catalog, setCatalog] = useState<Product[]>([])
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [items, setItems] = useState<ListItem[]>([]) // R5 : commence vide
  const [busy, setBusy] = useState(false) // R18 : un appel à l'API est en cours
  const [error, setError] = useState<string | null>(null)
  const [rides, setRides] = useState<CartRide[]>([]) // licornes au caddie en train de passer
  // useRef garde une valeur qui ne provoque PAS de réaffichage quand elle change :
  // parfait pour un simple compteur qui fabrique des identifiants uniques.
  const nextRideKey = useRef(0)
  // R57 : noms en français ou en anglais. On passe une FONCTION à useState : elle n'est
  // appelée qu'au premier affichage, pour lire la sauvegarde une seule fois.
  const [french, setFrench] = useState(() => loadValue('french', true, isBoolean))

  // R57 : à chaque changement de "french", on le sauvegarde dans le navigateur.
  useEffect(() => {
    saveValue('french', french)
  }, [french])

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

  // R27 / R28 : hennissement + licorne au caddie, appelé seulement après une action RÉUSSIE (R29).
  function celebrate(label: string, kind: CartRide['kind']) {
    playNeigh()
    const key = nextRideKey.current++
    setRides((current) => [...current, { key, title: label, kind }])
    // R31 : on retire cette licorne-là (et seulement elle) après 4 secondes.
    // Un minuteur plutôt que la fin de l'animation CSS : sans animation (R26), il n'y a pas de "fin".
    setTimeout(() => {
      setRides((current) => current.filter((ride) => ride.key !== key))
    }, CART_RIDE_MS)
  }

  // R9 + R10 : ajoute X d'un produit. Utilisé par le formulaire ET par le bouton « Ajouter » d'une ligne.
  // Renvoie true si l'ajout a réussi (pour remettre X à 1, R43).
  async function addQuantity(product: Product, amount: number): Promise<boolean> {
    const label = `${amount} × ${productName(product, french)}` // R27 : « 2 × Pomme »

    // R10 : déjà dans la liste -> quantité + X, sans appel API (DummyJSON ignore la quantité).
    if (isInList(items, product.id)) {
      setItems((current) => addToList(current, product, amount))
      setError(null) // R17
      celebrate(label, 'add')
      return true
    }

    setBusy(true)
    try {
      await addProduct(product.title) // R9 : on envoie le nom anglais, celui de DummyJSON
      setItems((current) => addToList(current, product, amount))
      setError(null) // R17
      celebrate(label, 'add') // R27
      return true
    } catch {
      setError("L'ajout a échoué. Réessaie.") // R12
      return false
    } finally {
      setBusy(false) // "finally" s'exécute dans tous les cas, réussite ou échec
    }
  }

  // R44 : retire X. S'il ne reste rien, c'est une suppression : appel DELETE (R14).
  // Renvoie true si le retrait a réussi.
  async function removeAmount(item: ListItem, amount: number): Promise<boolean> {
    const name = productName(item, french)
    const removed = Math.min(amount, item.quantity) // on ne peut pas retirer plus qu'il n'y en a
    const label = `${removed} × ${name}`

    if (!removesWholeLine(items, item.id, amount)) {
      setItems((current) => removeQuantity(current, item.id, amount))
      setError(null) // R17
      celebrate(label, 'remove') // R28
      return true
    }

    setBusy(true)
    try {
      await deleteProduct(item.id) // R14 : id du catalogue
      setItems((current) => removeQuantity(current, item.id, amount))
      setError(null) // R17
      celebrate(label, 'remove') // R28
      return true
    } catch {
      setError(`La suppression de « ${name} » a échoué. Réessaie.`) // R15
      return false
    } finally {
      setBusy(false)
    }
  }

  const itemCount = computeTotals(items).count // R36

  return (
    // <> … </> = un "fragment" : regroupe plusieurs éléments sans ajouter de balise dans la page.
    <>
      <UnicornSky />
      <div className="app">
        {/* En-tête commun aux deux pages (R35, R57). */}
        <header className="header">
          <h1>Liste de courses</h1>
          {/* R35 : NavLink = un lien qui sait s'il pointe vers la page actuelle : il reçoit alors
              aria-current="page" et la classe "active" (mise en évidence en CSS).
              "end" : « Produits » (/) n'est actif que sur / exactement, pas sur /liste. */}
          <nav className="nav" aria-label="Pages">
            <NavLink to="/" end>
              Produits
            </NavLink>
            <NavLink to="/liste">
              Ma liste <span className="badge">{itemCount}</span>
            </NavLink>
          </nav>
          {/* R57 : interrupteur de traduction. role="switch" dit aux lecteurs d'écran
              que c'est un interrupteur marche/arrêt, pas une simple case à cocher. */}
          <label className="toggle">
            <input
              type="checkbox"
              role="switch"
              checked={french}
              onChange={(event) => setFrench(event.target.checked)}
            />
            Noms en français
          </label>
        </header>

        <main>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {status === 'loading' && <p>Chargement…</p>}

          {status === 'error' && (
            <p className="error" role="alert">
              Impossible de charger le catalogue. Vérifie ta connexion puis recharge la page.
            </p>
          )}

          {status === 'ready' && (
            // R35 + R37 : <Routes> affiche la <Route> dont le "path" correspond à l'adresse.
            <Routes>
              <Route
                path="/"
                element={
                  <ProductsPage
                    catalog={catalog}
                    items={items}
                    listName={LIST_NAME}
                    french={french}
                    busy={busy}
                    onAdd={addQuantity}
                  />
                }
              />
              <Route
                path="/liste"
                element={
                  <ListPage
                    items={items}
                    listName={LIST_NAME}
                    french={french}
                    busy={busy}
                    onAdd={addQuantity}
                    onRemove={removeAmount}
                    onToggleBought={(item) => setItems((current) => toggleBought(current, item.id))}
                  />
                }
              />
              {/* R37 : toute autre adresse renvoie vers Produits. "replace" : l'adresse inconnue
                  ne reste pas dans l'historique (le bouton « retour » n'y ramène pas). */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>
      {/* R27 / R28 : les licornes au caddie, devant le contenu. aria-hidden : décoratif. */}
      <div className="cart-rides" aria-hidden="true">
        {rides.map((ride) => (
          <CartUnicorn key={ride.key} ride={ride} />
        ))}
      </div>
    </>
  )
}

export default App
