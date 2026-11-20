import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App, { CART_RIDE_MS } from './App'
import { NEIGH_URL } from './sound'
import { apple, milk } from './test-data'

// Les produits arrivent en anglais (Apple, Milk) ; l'app les affiche en français (Pomme, Lait).
const iphone = { ...apple, id: 124, title: 'iPhone X', price: 899.99, category: 'smartphones' }
const CATALOG = { products: [apple, milk, iphone] }

type Options = {
  catalogOk?: boolean
  addOk?: boolean
  deleteOk?: boolean
}

// Faux DummyJSON : répond selon l'URL et la méthode (GET, POST, DELETE).
function fakeDummyJson({ catalogOk = true, addOk = true, deleteOk = true }: Options = {}) {
  const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
    const method = options?.method ?? 'GET'
    let ok = true
    let body: unknown = {}
    if (method === 'GET') {
      ok = catalogOk
      body = CATALOG
    } else if (method === 'POST') {
      ok = addOk
      body = { id: 195, title: JSON.parse(String(options?.body)).title }
    } else if (method === 'DELETE') {
      ok = deleteOk
      body = { id: Number(url.split('/').pop()), isDeleted: true }
    }
    return { ok, status: ok ? 200 : 500, json: async () => body } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

type User = ReturnType<typeof userEvent.setup>

// MemoryRouter = un routeur qui garde l'adresse en mémoire (pas de vraie barre d'adresse en test).
// "initialEntries" choisit la page de départ.
function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

// Compte les appels faits avec une méthode donnée.
function callsWith(fetchMock: ReturnType<typeof fakeDummyJson>, method: string) {
  return fetchMock.mock.calls.filter(([, options]) => (options?.method ?? 'GET') === method)
}

// Intl écrit les prix avec des espaces insécables : on les remplace pour comparer.
function plainText(element: HTMLElement) {
  return (element.textContent ?? '').replace(/\s/g, ' ')
}

// Écrit X dans un sélecteur de quantité, puis quitte le champ (Tab) pour valider.
async function setQuantity(user: User, container: HTMLElement, quantity: number) {
  const input = within(container).getByRole('textbox', { name: 'Quantité' })
  await user.clear(input)
  await user.type(input, String(quantity))
  await user.tab()
}

// La carte d'un produit sur la page Produits.
function findCard(name: string) {
  return screen.findByRole('article', { name })
}

// Page Produits : règle X sur la carte du produit et clique sur « Ajouter ».
async function addFromCatalog(user: User, name: string, quantity = 1) {
  const card = await findCard(name)
  if (quantity !== 1) await setQuantity(user, card, quantity)
  await user.click(within(card).getByRole('button', { name: 'Ajouter' }))
}

async function goToList(user: User) {
  await user.click(screen.getByRole('link', { name: /^Ma liste/ }))
  // On attend que le lien soit marqué « page actuelle » (le titre, lui, est le nom de la liste active).
  await screen.findByRole('link', { name: /^Ma liste/, current: 'page' })
}

async function goToProducts(user: User) {
  await user.click(screen.getByRole('link', { name: 'Produits' }))
  await screen.findByRole('heading', { name: 'Produits', level: 2 })
}

// Ajoute depuis Produits puis va sur Ma liste et attend la ligne.
async function addThenOpenList(user: User, name: string, quantity = 1) {
  await addFromCatalog(user, name, quantity)
  // On attend « Dans la liste » sur LA carte du produit (d'autres cartes peuvent l'afficher aussi).
  await within(await findCard(name)).findByText(/Dans la liste/)
  await goToList(user)
  return findLine(name)
}

// Une ligne de la liste, retrouvée par le nom du produit.
function getLine(name: string) {
  return screen.getByRole('listitem', { name })
}

function findLine(name: string) {
  return screen.findByRole('listitem', { name })
}

// Clique sur « Ajouter » ou « Retirer » d'une ligne, avec X.
async function lineAction(user: User, name: string, action: 'Ajouter' | 'Retirer', quantity = 1) {
  const line = getLine(name)
  if (quantity !== 1) await setQuantity(user, line, quantity)
  await user.click(within(line).getByRole('button', { name: action }))
}

describe('Catalogue', () => {
  it('R2 : affiche « Chargement… » pendant le chargement du catalogue', async () => {
    fakeDummyJson()
    renderApp()
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    await findCard('Pomme')
  })

  it('R1 : tout le catalogue DummyJSON est chargé et affiché', async () => {
    const fetchMock = fakeDummyJson()
    renderApp()
    expect(await findCard('Pomme')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Lait' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'iPhone X' })).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0][0])).toContain('/products?limit=0')
  })

  it('R3 : si le catalogue ne charge pas, une erreur est affichée et on ne peut rien ajouter', async () => {
    fakeDummyJson({ catalogOk: false })
    renderApp()
    expect(await screen.findByRole('alert')).toHaveTextContent(/catalogue/i)
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument()
  })
})

describe('Deux pages', () => {
  it('R35 : un menu permet de passer de Produits à Ma liste et inversement', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await goToList(user)
    expect(screen.queryByRole('article', { name: 'Pomme' })).not.toBeInTheDocument()
    await goToProducts(user)
    expect(await findCard('Pomme')).toBeInTheDocument()
  })

  it('R35 : la page courante est mise en évidence dans le menu', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    expect(screen.getByRole('link', { name: 'Produits' })).toHaveAttribute('aria-current', 'page')
    await goToList(user)
    expect(screen.getByRole('link', { name: /^Ma liste/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Produits' })).not.toHaveAttribute('aria-current')
  })

  it("R36 : le lien « Ma liste » affiche le nombre d'articles", async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    expect(await screen.findByRole('link', { name: 'Ma liste 0' })).toBeInTheDocument()
    await addFromCatalog(user, 'Pomme', 3)
    await addFromCatalog(user, 'Lait', 2)
    expect(await screen.findByRole('link', { name: 'Ma liste 5' })).toBeInTheDocument()
  })

  it('R37 : ouvrir directement /liste affiche Ma liste', async () => {
    fakeDummyJson()
    renderApp('/liste')
    expect(await screen.findByRole('heading', { name: 'Ma liste', level: 2 })).toBeInTheDocument()
  })

  it('R37 : une adresse inconnue affiche la page Produits', async () => {
    fakeDummyJson()
    renderApp('/nimporte-quoi')
    expect(await screen.findByRole('heading', { name: 'Produits', level: 2 })).toBeInTheDocument()
  })
})

describe('Page Produits', () => {
  it('R38 : une carte affiche image, nom, catégorie et prix en français', async () => {
    fakeDummyJson()
    renderApp()
    const card = await findCard('Pomme')
    expect(card.querySelector('img')).toHaveAttribute('src', apple.thumbnail)
    expect(plainText(card)).toContain('Épicerie')
    expect(plainText(card)).toContain('1,99 €')
  })

  it('R39 : la recherche filtre par nom, sans accents ni majuscules', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher' }), 'POMME')
    expect(screen.getByRole('article', { name: 'Pomme' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Lait' })).not.toBeInTheDocument()
  })

  it('R39 : le filtre Catégorie se combine à la recherche ; aucun résultat -> message', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await user.click(screen.getByRole('button', { name: 'Smartphones' }))
    expect(screen.getByRole('article', { name: 'iPhone X' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Pomme' })).not.toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher' }), 'lait')
    expect(screen.getByText('Aucun produit trouvé')).toBeInTheDocument()
  })

  it('R40 : la page indique la liste dans laquelle on ajoute', async () => {
    fakeDummyJson()
    renderApp()
    await findCard('Pomme')
    expect(plainText(screen.getByText(/Ajouter à/))).toBe('Ajouter à : Ma liste')
  })

  it('R41 : une carte dont le produit est dans la liste affiche « Dans la liste : N »', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme', 4)
    expect(await within(await findCard('Pomme')).findByText('Dans la liste : 4')).toBeInTheDocument()
    expect(within(await findCard('Lait')).queryByText(/Dans la liste/)).not.toBeInTheDocument()
  })
})

describe('Ajouter', () => {
  it('R5 : la liste commence vide, avec un lien vers les produits', async () => {
    fakeDummyJson()
    renderApp('/liste')
    expect(await screen.findByText('La liste est vide')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Choisir des produits' })).toHaveAttribute('href', '/')
  })

  it("R9 : ajouter X d'un produit absent appelle POST (nom anglais) et crée la ligne avec X", async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const line = await addThenOpenList(user, 'Pomme', 3)
    expect(plainText(line)).toContain('3 × 1,99 € = 5,97 €')
    const posts = callsWith(fetchMock, 'POST')
    expect(posts).toHaveLength(1)
    expect(JSON.parse(String(posts[0][1]?.body))).toEqual({ title: 'Apple' })
  })

  it('R10 : rajouter un produit présent ajoute X, sans appel API ni nouvelle ligne', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme', 2)
    await screen.findByText('Dans la liste : 2')
    await addFromCatalog(user, 'Pomme', 3)
    await screen.findByText('Dans la liste : 5')
    await goToList(user)
    expect(plainText(await findLine('Pomme'))).toContain('5 × 1,99 €')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(callsWith(fetchMock, 'POST')).toHaveLength(1)
  })

  it('R10 : rajouter un produit coché « acheté » le décoche', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const line = await addThenOpenList(user, 'Pomme')
    await user.click(within(line).getByRole('checkbox'))
    await goToProducts(user)
    await addFromCatalog(user, 'Pomme')
    await screen.findByText('Dans la liste : 2')
    await goToList(user)
    expect(within(await findLine('Pomme')).getByRole('checkbox')).not.toBeChecked()
  })

  it('R8 : on ne peut ajouter que des produits du catalogue (aucun champ pour taper un nom)', async () => {
    fakeDummyJson()
    renderApp()
    await findCard('Pomme')
    // Les seuls champs texte sont les quantités (la recherche est un "searchbox", pas un "textbox").
    for (const field of screen.getAllByRole('textbox')) {
      expect(field).toHaveAccessibleName('Quantité')
    }
  })

  it("R12 : si l'ajout échoue, une erreur est affichée et la liste ne change pas", async () => {
    fakeDummyJson({ addOk: false })
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme')
    expect(await screen.findByRole('alert')).toHaveTextContent(/ajout/i)
    await goToList(user)
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
  })
})

describe('Quantité X (R43)', () => {
  it('R43 : X vaut 1 par défaut ; « − » est désactivé à 1, « + » augmente', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const card = await findCard('Pomme')
    const input = within(card).getByRole('textbox', { name: 'Quantité' })
    expect(input).toHaveValue('1')
    expect(within(card).getByRole('button', { name: 'Moins un' })).toBeDisabled()
    await user.click(within(card).getByRole('button', { name: 'Plus un' }))
    expect(input).toHaveValue('2')
  })

  it('R43 : une saisie invalide est ramenée entre 1 et 99 en quittant le champ', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const card = await findCard('Pomme')
    const input = within(card).getByRole('textbox', { name: 'Quantité' })
    await setQuantity(user, card, 150)
    expect(input).toHaveValue('99')
    expect(within(card).getByRole('button', { name: 'Plus un' })).toBeDisabled()
    await setQuantity(user, card, 0)
    expect(input).toHaveValue('1')
    await user.clear(input)
    await user.type(input, 'abc')
    await user.tab()
    expect(input).toHaveValue('1')
  })

  it('R43 : après un ajout réussi, X revient à 1 (carte et ligne)', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme', 3)
    await screen.findByText('Dans la liste : 3')
    expect(within(await findCard('Pomme')).getByRole('textbox', { name: 'Quantité' })).toHaveValue('1')
    await goToList(user)
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Ajouter', 4)
    expect(within(getLine('Pomme')).getByRole('textbox', { name: 'Quantité' })).toHaveValue('1')
  })
})

describe('Ma liste', () => {
  it('R6 : une ligne affiche image, nom, prix unitaire, quantité, sous-total, case et boutons', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const line = await addThenOpenList(user, 'Lait', 2)
    expect(line.querySelector('img')).toHaveAttribute('src', milk.thumbnail)
    expect(plainText(line)).toContain('Lait')
    expect(plainText(line)).toContain('2 × 3,49 € = 6,98 €')
    expect(within(line).getByRole('checkbox')).toBeInTheDocument()
    expect(within(line).getByRole('textbox', { name: 'Quantité' })).toBeInTheDocument()
    expect(within(line).getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
    expect(within(line).getByRole('button', { name: 'Retirer' })).toBeInTheDocument()
  })

  it("R7 : les lignes à acheter sont dans l'ordre du premier ajout", async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Lait')
    await screen.findByText('Dans la liste : 1')
    await addFromCatalog(user, 'Pomme')
    await goToList(user)
    await findLine('Pomme')
    const lines = within(screen.getByRole('list', { name: 'À acheter' })).getAllByRole('listitem')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual(['Lait', 'Pomme'])
  })

  it('R44 : « Ajouter » sur une ligne ajoute X sans appel API', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme')
    await lineAction(user, 'Pomme', 'Ajouter', 4)
    expect(plainText(getLine('Pomme'))).toContain('5 × 1,99 €')
    expect(callsWith(fetchMock, 'POST')).toHaveLength(1)
  })

  it('R44 : « Retirer » X < quantité baisse la quantité sans appel API', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme', 5)
    await lineAction(user, 'Pomme', 'Retirer', 2)
    expect(plainText(getLine('Pomme'))).toContain('3 × 1,99 €')
    expect(callsWith(fetchMock, 'DELETE')).toHaveLength(0)
  })

  it("R44 + R14 : « Retirer » X ≥ quantité appelle DELETE avec l'id du catalogue et retire la ligne", async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme', 2)
    await lineAction(user, 'Pomme', 'Retirer', 5)
    expect(await screen.findByText('La liste est vide')).toBeInTheDocument()
    const deletes = callsWith(fetchMock, 'DELETE')
    expect(deletes).toHaveLength(1)
    expect(deletes[0][0]).toBe('https://dummyjson.com/products/16')
  })

  it('R15 : si la suppression échoue, une erreur est affichée et la ligne reste', async () => {
    fakeDummyJson({ deleteOk: false })
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme')
    await lineAction(user, 'Pomme', 'Retirer')
    expect(await screen.findByRole('alert')).toHaveTextContent(/suppression/i)
    expect(getLine('Pomme')).toBeInTheDocument()
  })

  it("R17 : le message d'erreur disparaît quand l'action suivante réussit", async () => {
    const fetchMock = fakeDummyJson({ addOk: false })
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme')
    await screen.findByRole('alert')
    // DummyJSON remarche : on remplace le faux fetch par une version qui réussit.
    fetchMock.mockImplementation(async (_url, options) => {
      const title = JSON.parse(String(options?.body)).title
      return { ok: true, status: 200, json: async () => ({ id: 195, title }) } as Response
    })
    await addFromCatalog(user, 'Pomme')
    await screen.findByText('Dans la liste : 1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("R18 : les boutons Ajouter sont désactivés pendant un appel à l'API", async () => {
    let finishPost: (value: Response) => void = () => {}
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    // Le prochain POST ne répond pas tout de suite : on garde la main pour vérifier pendant l'attente.
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (finishPost = resolve)),
    )
    await addFromCatalog(user, 'Pomme')
    expect(within(await findCard('Lait')).getByRole('button', { name: 'Ajouter' })).toBeDisabled()
    finishPost({ ok: true, status: 200, json: async () => ({ id: 195 }) } as Response)
    await screen.findByText('Dans la liste : 1')
    expect(within(await findCard('Lait')).getByRole('button', { name: 'Ajouter' })).toBeEnabled()
  })

  it("R18 : le bouton Retirer est désactivé pendant un appel à l'API", async () => {
    let finishDelete: (value: Response) => void = () => {}
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Lait')
    await screen.findByText('Dans la liste : 1')
    await addThenOpenList(user, 'Pomme')
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (finishDelete = resolve)),
    )
    await lineAction(user, 'Pomme', 'Retirer')
    expect(within(getLine('Lait')).getByRole('button', { name: 'Retirer' })).toBeDisabled()
    finishDelete({ ok: true, status: 200, json: async () => ({ id: 16 }) } as Response)
    await screen.findByRole('listitem', { name: 'Lait' })
    expect(await within(getLine('Lait')).findByRole('button', { name: 'Retirer' })).toBeEnabled()
  })
})

describe('Prix, total et « déjà acheté »', () => {
  it('R46 : le récapitulatif affiche articles, total, déjà acheté et reste à payer', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme', 3) // 5,97 €
    await screen.findByText('Dans la liste : 3')
    await addThenOpenList(user, 'Lait', 2) // 6,98 €
    const summary = plainText(screen.getByLabelText('Récapitulatif'))
    expect(summary).toContain('Articles5')
    expect(summary).toContain('Total12,95 €')
    expect(summary).toContain('Déjà acheté0,00 €')
    expect(summary).toContain('Reste à payer12,95 €')
  })

  it('R48 : cocher une ligne la barre, la descend dans « Déjà acheté » et change le reste à payer', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme', 3)
    await screen.findByText('Dans la liste : 3')
    await addThenOpenList(user, 'Lait', 2)
    await user.click(within(getLine('Pomme')).getByRole('checkbox'))
    const boughtList = screen.getByRole('list', { name: 'Déjà acheté' })
    expect(within(boughtList).getByRole('listitem', { name: 'Pomme' })).toHaveClass('line--bought')
    const summary = plainText(screen.getByLabelText('Récapitulatif'))
    expect(summary).toContain('Déjà acheté5,97 €')
    expect(summary).toContain('Reste à payer6,98 €')
  })

  it("R48 : décocher remet la ligne à acheter ; cocher ne fait pas d'appel API", async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme')
    const callsBefore = fetchMock.mock.calls.length
    await user.click(within(getLine('Pomme')).getByRole('checkbox'))
    await user.click(within(getLine('Pomme')).getByRole('checkbox'))
    const toBuy = screen.getByRole('list', { name: 'À acheter' })
    expect(within(toBuy).getByRole('listitem', { name: 'Pomme' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
  })
})

describe("Traduction dans l'app", () => {
  it('R57 : l\'interrupteur « Noms en français » est activé par défaut et passe en anglais', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    const toggle = screen.getByRole('switch', { name: 'Noms en français' })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(await findCard('Apple')).toBeInTheDocument()
    expect(plainText(await findCard('Apple'))).toContain('groceries')
  })

  it('R57 : le choix est gardé après un rechargement', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await findCard('Pomme')
    await user.click(screen.getByRole('switch', { name: 'Noms en français' }))
    unmount() // = fermer la page...
    renderApp() // ...et la rouvrir
    expect(await findCard('Apple')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Noms en français' })).not.toBeChecked()
  })

  it('R57 : la recherche marche en français même quand les noms sont en anglais', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await user.click(screen.getByRole('switch', { name: 'Noms en français' }))
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher' }), 'pomme')
    expect(screen.getByRole('article', { name: 'Apple' })).toBeInTheDocument()
  })

  it("R21 : l'interface est en français", async () => {
    fakeDummyJson()
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Liste de courses' })).toBeInTheDocument()
  })
})

// Le faux audio.play() installé dans setupTests.ts : on lit combien de fois il a été appelé.
function neighCount() {
  return vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length
}

describe('Licornes', () => {
  it("R25 : 6 licornes SVG volent en fond, cachées aux lecteurs d'écran", async () => {
    fakeDummyJson()
    renderApp()
    await findCard('Pomme')
    const sky = screen.getByTestId('sky')
    expect(sky).toHaveAttribute('aria-hidden', 'true')
    expect(sky.querySelectorAll('.flyer svg')).toHaveLength(6)
  })

  it('R27 : un ajout réussi fait hennir et passer une licorne au caddie « X × nom »', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme', 2)
    const ride = await screen.findByTestId('cart-unicorn')
    expect(ride).toHaveTextContent('2 × Pomme')
    expect(ride).toHaveClass('cart-ride--add')
    expect(neighCount()).toBe(1)
  })

  it('R27 : ajouter depuis une ligne fait aussi passer une licorne au caddie', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme')
    await lineAction(user, 'Pomme', 'Ajouter', 3)
    expect(screen.getAllByTestId('cart-unicorn')[1]).toHaveTextContent('3 × Pomme')
    expect(neighCount()).toBe(2)
  })

  it('R28 : un retrait partiel réussi fait passer une licorne « retour », nom barré', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme', 5)
    await lineAction(user, 'Pomme', 'Retirer', 2)
    expect(document.querySelector('.cart-ride--remove')).toHaveTextContent('2 × Pomme')
    expect(neighCount()).toBe(2)
  })

  it('R28 : un retrait complet affiche la quantité vraiment retirée', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme', 2)
    await lineAction(user, 'Pomme', 'Retirer', 9)
    await screen.findByText('La liste est vide')
    expect(document.querySelector('.cart-ride--remove')).toHaveTextContent('2 × Pomme')
  })

  it('R29 : un ajout raté ne fait ni hennir ni passer de licorne au caddie', async () => {
    fakeDummyJson({ addOk: false })
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme')
    await screen.findByRole('alert')
    expect(screen.queryByTestId('cart-unicorn')).not.toBeInTheDocument()
    expect(neighCount()).toBe(0)
  })

  it('R29 : une suppression ratée ou une case cochée ne font pas passer de licorne', async () => {
    fakeDummyJson({ deleteOk: false })
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme')
    await user.click(within(getLine('Pomme')).getByRole('checkbox'))
    await lineAction(user, 'Pomme', 'Retirer')
    await screen.findByRole('alert')
    expect(document.querySelector('.cart-ride--remove')).toBeNull()
    expect(neighCount()).toBe(1) // seulement celui de l'ajout
  })

  it('R30 : le son joué est le fichier du hennissement', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme')
    await screen.findByTestId('cart-unicorn')
    const audio = vi.mocked(HTMLMediaElement.prototype.play).mock.contexts[0] as HTMLAudioElement
    expect(audio.src).toContain(NEIGH_URL)
  })

  it("R30 : si le navigateur refuse de jouer le son, rien ne casse et aucune erreur n'est affichée", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error('NotSupportedError'))
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addFromCatalog(user, 'Pomme')
    expect(await screen.findByText('Dans la liste : 1')).toBeInTheDocument()
    expect(screen.getByTestId('cart-unicorn')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('R31 : la licorne au caddie disparaît après 4 secondes ; plusieurs peuvent passer en même temps', async () => {
    // Faux minuteurs : on avance le temps nous-mêmes au lieu d'attendre 4 vraies secondes.
    // shouldAdvanceTime laisse quand même le temps avancer tout seul, ce dont userEvent a besoin.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fakeDummyJson()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderApp()
    await addFromCatalog(user, 'Pomme')
    await screen.findByText('Dans la liste : 1')
    await addFromCatalog(user, 'Lait')
    await within(await findCard('Lait')).findByText('Dans la liste : 1')
    expect(screen.getAllByTestId('cart-unicorn')).toHaveLength(2)
    act(() => {
      vi.advanceTimersByTime(CART_RIDE_MS)
    })
    expect(screen.queryByTestId('cart-unicorn')).not.toBeInTheDocument()
  })
})

// ---------- Étape 4 : listes, favoris, coupons, icônes ----------

function listSelect() {
  return screen.getByRole('combobox', { name: 'Liste active' })
}

// Ouvre « Nouvelle liste », tape le nom et valide.
async function createListNamed(user: User, name: string) {
  await user.click(screen.getByRole('button', { name: 'Nouvelle liste' }))
  const form = screen.getByRole('form', { name: 'Nouvelle liste' })
  await user.type(within(form).getByRole('textbox', { name: 'Nom de la liste' }), name)
  await user.click(within(form).getByRole('button', { name: 'Créer' }))
}

async function goToCoupons(user: User) {
  await user.click(screen.getByRole('link', { name: 'Coupons' }))
  await screen.findByRole('heading', { name: 'Coupons', level: 2 })
}

// Remplit le formulaire de la page Coupons et valide.
async function createCoupon(
  user: User,
  { name, kind = 'Pourcentage (%)', value, target = 'Toute la liste' }: { name: string; kind?: string; value: string; target?: string },
) {
  const form = screen.getByRole('form', { name: 'Nouveau coupon' })
  await user.type(within(form).getByRole('textbox', { name: 'Nom du coupon' }), name)
  await user.selectOptions(within(form).getByRole('combobox', { name: 'Type' }), kind)
  await user.type(within(form).getByRole('textbox', { name: 'Valeur' }), value)
  await user.selectOptions(within(form).getByRole('combobox', { name: "S'applique à" }), target)
  await user.click(within(form).getByRole('button', { name: 'Créer le coupon' }))
}

describe('Plusieurs listes (R49 à R54)', () => {
  it('R5 + R49 : au départ, le menu propose Favoris puis Ma liste (active)', async () => {
    fakeDummyJson()
    renderApp()
    await findCard('Pomme')
    const options = within(listSelect()).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Favoris', 'Ma liste'])
    expect(listSelect()).toHaveDisplayValue('Ma liste')
  })

  it('R50 + R40 : créer une liste la rend active ; Produits ajoute dedans', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await createListNamed(user, 'Samedi')
    expect(listSelect()).toHaveDisplayValue('Samedi')
    expect(plainText(screen.getByText(/Ajouter à/))).toBe('Ajouter à : Samedi')
    await addFromCatalog(user, 'Pomme', 2)
    await screen.findByText('Dans la liste : 2')
    // Retour sur Ma liste : elle est restée vide.
    await user.selectOptions(listSelect(), 'Ma liste')
    expect(screen.queryByText(/Dans la liste/)).not.toBeInTheDocument()
  })

  it('R52 : un nom déjà pris est refusé avec un message, rien n’est créé', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await createListNamed(user, '  ma LISTE ')
    expect(screen.getByRole('alert')).toHaveTextContent('déjà')
    expect(within(listSelect()).getAllByRole('option')).toHaveLength(2)
  })

  it('R51 : renommer la liste active', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await user.click(screen.getByRole('button', { name: 'Renommer' }))
    const input = screen.getByRole('textbox', { name: 'Nom de la liste' })
    expect(input).toHaveValue('Ma liste')
    await user.clear(input)
    await user.type(input, 'Semaine')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(listSelect()).toHaveDisplayValue('Semaine')
  })

  it('R53 : supprimer demande confirmation ; « Annuler » ne supprime rien', async () => {
    fakeDummyJson()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(confirm).toHaveBeenCalledWith('Supprimer la liste « Ma liste » ?')
    expect(within(listSelect()).getAllByRole('option')).toHaveLength(2)
  })

  it('R53 : après confirmation, la liste disparaît et une autre devient active, sans appel API', async () => {
    const fetchMock = fakeDummyJson()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await createListNamed(user, 'Samedi')
    const callsBefore = fetchMock.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(within(listSelect()).getAllByRole('option').map((o) => o.textContent)).toEqual(['Favoris', 'Ma liste'])
    expect(listSelect()).toHaveDisplayValue('Ma liste')
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
  })

  it('R58 : Favoris ne peut être ni renommée ni supprimée', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    await user.selectOptions(listSelect(), 'Favoris')
    expect(screen.getByRole('button', { name: 'Renommer' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeDisabled()
  })

  it('R54 : listes, lignes, cases et liste active sont retrouvées après un rechargement', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await findCard('Pomme')
    await createListNamed(user, 'Samedi')
    const line = await addThenOpenList(user, 'Lait', 3)
    await user.click(within(line).getByRole('checkbox'))
    unmount()
    renderApp('/liste')
    expect(await screen.findByRole('heading', { name: 'Samedi', level: 2 })).toBeInTheDocument()
    const reloaded = await findLine('Lait')
    expect(plainText(reloaded)).toContain('3 × 3,49 €')
    expect(within(reloaded).getByRole('checkbox')).toBeChecked()
  })

  it('R55 : une sauvegarde abîmée ne fait pas planter l’app', async () => {
    localStorage.setItem('liste-de-courses:data', '{oups')
    fakeDummyJson()
    renderApp('/liste')
    expect(await screen.findByText('La liste est vide')).toBeInTheDocument()
  })
})

describe('Favoris (R58 à R61)', () => {
  it('R59 + R60 : la licorne d’une carte met le produit en favori, puis l’enlève', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const card = await findCard('Pomme')
    const callsBefore = fetchMock.mock.calls.length
    await user.click(within(card).getByRole('button', { name: 'Ajouter aux favoris' }))
    const fav = within(card).getByRole('button', { name: 'Retirer des favoris' })
    expect(fav).toHaveClass('fav--on')
    // R60 : pas d'appel API, pas de licorne au caddie, et la liste active ne change pas.
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
    expect(screen.queryByTestId('cart-unicorn')).not.toBeInTheDocument()
    expect(neighCount()).toBe(0)
    expect(screen.getByRole('link', { name: 'Ma liste 0' })).toBeInTheDocument()
    await user.click(fav)
    expect(within(card).getByRole('button', { name: 'Ajouter aux favoris' })).not.toHaveClass('fav--on')
  })

  it('R58 + R60 : un favori apparaît dans la liste Favoris avec la quantité 1', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await user.click(within(await findCard('Lait')).getByRole('button', { name: 'Ajouter aux favoris' }))
    await user.selectOptions(listSelect(), 'Favoris')
    await user.click(screen.getByRole('link', { name: /^Ma liste/ }))
    expect(await screen.findByRole('heading', { name: 'Favoris', level: 2 })).toBeInTheDocument()
    expect(plainText(getLine('Lait'))).toContain('1 × 3,49 €')
  })

  it('R59 : la licorne d’une ligne marque le produit favori sur la carte aussi', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const line = await addThenOpenList(user, 'Pomme')
    await user.click(within(line).getByRole('button', { name: 'Ajouter aux favoris' }))
    expect(within(getLine('Pomme')).getByRole('button', { name: 'Retirer des favoris' })).toBeInTheDocument()
    await goToProducts(user)
    expect(within(await findCard('Pomme')).getByRole('button', { name: 'Retirer des favoris' })).toBeInTheDocument()
  })

  it('R61 : une nouvelle liste reçoit 1 de chaque favori', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await user.click(within(await findCard('Lait')).getByRole('button', { name: 'Ajouter aux favoris' }))
    await user.click(within(await findCard('Pomme')).getByRole('button', { name: 'Ajouter aux favoris' }))
    await createListNamed(user, 'Samedi')
    await user.click(screen.getByRole('link', { name: /^Ma liste/ }))
    await screen.findByRole('heading', { name: 'Samedi', level: 2 })
    const lines = within(screen.getByRole('list', { name: 'À acheter' })).getAllByRole('listitem')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual(['Lait', 'Pomme'])
    expect(plainText(getLine('Pomme'))).toContain('1 × 1,99 €')
  })
})

describe('Coupons (R62 à R67)', () => {
  it('R35 + R37 : la page Coupons a son lien et son adresse /coupons', async () => {
    fakeDummyJson()
    renderApp('/coupons')
    expect(await screen.findByRole('heading', { name: 'Coupons', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Coupons' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText("Aucun coupon pour l'instant")).toBeInTheDocument()
  })

  it('R62 + R64 : créer un coupon l’affiche avec sa description', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp('/coupons')
    await screen.findByRole('heading', { name: 'Coupons', level: 2 })
    await createCoupon(user, { name: 'LICORNE10', value: '10', target: 'Épicerie' })
    await createCoupon(user, { name: 'CINQ', kind: 'Montant (€)', value: '5,50' })
    const list = screen.getByRole('list', { name: 'Mes coupons' })
    expect(plainText(within(list).getByRole('listitem', { name: 'LICORNE10' }))).toContain('−10 % sur Épicerie')
    expect(plainText(within(list).getByRole('listitem', { name: 'CINQ' }))).toContain('−5,50 € sur toute la liste')
  })

  it('R63 : un coupon invalide est refusé avec un message', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp('/coupons')
    await screen.findByRole('heading', { name: 'Coupons', level: 2 })
    await createCoupon(user, { name: 'TROP', value: '150' })
    expect(screen.getByRole('alert')).toHaveTextContent('entre 1 et 100')
    expect(screen.getByText("Aucun coupon pour l'instant")).toBeInTheDocument()
  })

  it('R65 : sans coupon, Ma liste propose un lien vers la page Coupons', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await addThenOpenList(user, 'Pomme')
    expect(screen.getByRole('link', { name: 'Créer un coupon' })).toHaveAttribute('href', '/coupons')
  })

  it('R65 + R66 + R46 : cocher un coupon baisse le reste à payer (achats compris)', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp('/coupons')
    await screen.findByRole('heading', { name: 'Coupons', level: 2 })
    await createCoupon(user, { name: 'MOITIE', value: '50', target: 'Épicerie' })
    await goToProducts(user)
    await addFromCatalog(user, 'Pomme', 3) // 5,97 €
    await screen.findByText('Dans la liste : 3')
    await addThenOpenList(user, 'Lait', 2) // 6,98 €
    await user.click(within(getLine('Lait')).getByRole('checkbox')) // déjà acheté
    expect(plainText(screen.getByLabelText('Récapitulatif'))).not.toContain('Réductions')
    await user.click(screen.getByRole('checkbox', { name: /MOITIE/ }))
    const summary = plainText(screen.getByLabelText('Récapitulatif'))
    expect(summary).toContain('Total12,95 €')
    expect(summary).toContain('Réductions−6,48 €') // 50 % de 12,95 € = 6,475 -> 6,48 €
    expect(summary).toContain('Total après réductions6,47 €')
    expect(summary).toContain('Déjà acheté6,98 €')
    expect(summary).toContain('Reste à payer0,00 €') // 6,47 − 6,98 < 0 -> 0
  })

  it('R65 : un coupon coché ne vaut que pour sa liste', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp('/coupons')
    await screen.findByRole('heading', { name: 'Coupons', level: 2 })
    await createCoupon(user, { name: 'DIX', value: '10' })
    await goToProducts(user)
    await addThenOpenList(user, 'Pomme')
    await user.click(screen.getByRole('checkbox', { name: /DIX/ }))
    await createListNamed(user, 'Samedi')
    await goToProducts(user)
    await addThenOpenList(user, 'Pomme')
    expect(screen.getByRole('checkbox', { name: /DIX/ })).not.toBeChecked()
  })

  it('R64 : supprimer un coupon le retire de la page et des listes', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp('/coupons')
    await screen.findByRole('heading', { name: 'Coupons', level: 2 })
    await createCoupon(user, { name: 'DIX', value: '10' })
    await goToProducts(user)
    await addThenOpenList(user, 'Pomme')
    await user.click(screen.getByRole('checkbox', { name: /DIX/ }))
    await goToCoupons(user)
    await user.click(screen.getByRole('button', { name: 'Supprimer le coupon DIX' }))
    expect(screen.getByText("Aucun coupon pour l'instant")).toBeInTheDocument()
    await goToList(user)
    expect(plainText(screen.getByLabelText('Récapitulatif'))).not.toContain('Réductions')
  })

  it('R67 + R54 : les coupons sont sauvegardés et ne déclenchent ni API ni licorne', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    const { unmount } = renderApp('/coupons')
    await screen.findByRole('heading', { name: 'Coupons', level: 2 })
    const callsBefore = fetchMock.mock.calls.length
    await createCoupon(user, { name: 'DIX', value: '10' })
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
    expect(screen.queryByTestId('cart-unicorn')).not.toBeInTheDocument()
    unmount()
    renderApp('/coupons')
    expect(await screen.findByRole('listitem', { name: 'DIX' })).toBeInTheDocument()
  })
})

describe('Icônes et ordre (R68 à R70)', () => {
  it('R68 : les cartes et les lignes ont l’icône de leur catégorie, cachée aux lecteurs d’écran', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    const icon = (await findCard('Pomme')).querySelector('svg.category-icon--groceries')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    const line = await addThenOpenList(user, 'Pomme')
    expect(line.querySelector('svg.category-icon--groceries')).toBeInTheDocument()
  })

  it('R69 : le filtre est une rangée de boutons ; « Toutes » est choisi au départ', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    renderApp()
    await findCard('Pomme')
    const group = screen.getByRole('group', { name: 'Catégorie' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['Toutes', 'Épicerie', 'Smartphones'])
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[1].querySelector('svg')).toBeInTheDocument()
    await user.click(buttons[1])
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('R70 : les produits sont triés par catégorie (nom français, A→Z)', async () => {
    fakeDummyJson() // ordre DummyJSON du faux catalogue : Pomme, Lait, iPhone X
    renderApp()
    await findCard('Pomme')
    const names = screen.getAllByRole('article').map((card) => card.getAttribute('aria-label'))
    expect(names).toEqual(['Pomme', 'Lait', 'iPhone X']) // Épicerie (ordre gardé), puis Smartphones
  })
})
