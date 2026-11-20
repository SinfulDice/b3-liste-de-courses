import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App, { CART_RIDE_MS } from './App'
import { NEIGH_URL } from './sound'
import { apple, milk } from './test-data'

// Les produits arrivent en anglais (Apple, Milk) ; l'app les affiche en français (Pomme, Lait).
const CATALOG = { products: [apple, milk] }

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

// Compte les appels faits avec une méthode donnée.
function callsWith(fetchMock: ReturnType<typeof fakeDummyJson>, method: string) {
  return fetchMock.mock.calls.filter(([, options]) => (options?.method ?? 'GET') === method)
}

// Attend le catalogue, choisit un produit et clique sur Ajouter.
async function addFromCatalog(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.selectOptions(await screen.findByLabelText('Produit'), title)
  await user.click(screen.getByRole('button', { name: 'Ajouter' }))
}

function getList() {
  return screen.getByRole('list', { name: 'Ma liste' })
}

describe('App', () => {
  it('R2 : affiche « Chargement… » pendant le chargement du catalogue', async () => {
    fakeDummyJson()
    render(<App />)
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    await screen.findByLabelText('Produit')
  })

  it('R1 + R4 : le catalogue DummyJSON apparaît dans un menu déroulant', async () => {
    const fetchMock = fakeDummyJson()
    render(<App />)
    const select = await screen.findByLabelText('Produit')
    expect(within(select).getByRole('option', { name: 'Pomme' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Lait' })).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0][0])).toContain('/products?limit=0')
  })

  it('R3 : si le catalogue ne charge pas, une erreur est affichée et on ne peut rien ajouter', async () => {
    fakeDummyJson({ catalogOk: false })
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/catalogue/i)
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument()
  })

  it('R5 : la liste commence vide', async () => {
    fakeDummyJson()
    render(<App />)
    await screen.findByLabelText('Produit')
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
  })

  it('R4 : un produit déjà dans la liste reste proposé dans le catalogue', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText(/Pomme/)
    const select = screen.getByLabelText('Produit')
    expect(within(select).getByRole('option', { name: 'Pomme' })).toBeInTheDocument()
  })

  it('R6 + R9 : ajouter un produit absent appelle POST et l\'affiche avec × 1', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    expect(await within(getList()).findByText('Pomme × 1')).toBeInTheDocument()
    expect(callsWith(fetchMock, 'POST')).toHaveLength(1)
    expect(screen.queryByText('La liste est vide')).not.toBeInTheDocument()
  })

  it('R10 : ajouter un produit déjà présent augmente la quantité, sans appel API ni nouvelle ligne', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    await addFromCatalog(user, 'Pomme')
    expect(await within(getList()).findByText('Pomme × 2')).toBeInTheDocument()
    expect(within(getList()).getAllByRole('listitem')).toHaveLength(1)
    expect(callsWith(fetchMock, 'POST')).toHaveLength(1)
  })

  it('R7 : les lignes sont dans l\'ordre du premier ajout', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Lait')
    await within(getList()).findByText('Lait × 1')
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    const lines = within(getList()).getAllByRole('listitem')
    expect(lines[0]).toHaveTextContent('Lait')
    expect(lines[1]).toHaveTextContent('Pomme')
  })

  it('R8 : sans produit choisi, Ajouter ne fait rien', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await screen.findByLabelText('Produit')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(callsWith(fetchMock, 'POST')).toHaveLength(0)
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
  })

  it('R8 : il n\'y a pas de champ texte libre', async () => {
    fakeDummyJson()
    render(<App />)
    await screen.findByLabelText('Produit')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('R12 : si l\'ajout échoue, une erreur est affichée et la liste ne change pas', async () => {
    fakeDummyJson({ addOk: false })
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    expect(await screen.findByRole('alert')).toHaveTextContent(/ajout/i)
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
  })

  it('R13 + R14 : Supprimer appelle DELETE avec l\'id du catalogue et retire toute la ligne', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 2')
    await user.click(screen.getByRole('button', { name: 'Supprimer Pomme' }))
    expect(await screen.findByText('La liste est vide')).toBeInTheDocument()
    const deletes = callsWith(fetchMock, 'DELETE')
    expect(deletes).toHaveLength(1)
    expect(deletes[0][0]).toBe('https://dummyjson.com/products/16')
  })

  it('R15 : si la suppression échoue, une erreur est affichée et la ligne reste', async () => {
    fakeDummyJson({ deleteOk: false })
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    await user.click(screen.getByRole('button', { name: 'Supprimer Pomme' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/suppression/i)
    expect(within(getList()).getByText('Pomme × 1')).toBeInTheDocument()
  })

  it('R16 : la liste n\'est pas gardée : une nouvelle app démarre vide', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    unmount()
    render(<App />)
    await screen.findByLabelText('Produit')
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
  })

  it('R17 : le message d\'erreur disparaît quand l\'action suivante réussit', async () => {
    const fetchMock = fakeDummyJson({ addOk: false })
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await screen.findByRole('alert')
    // DummyJSON remarche : on remplace le faux fetch par une version qui réussit.
    fetchMock.mockImplementation(async (_url, options) => {
      const title = JSON.parse(String(options?.body)).title
      return { ok: true, status: 200, json: async () => ({ id: 195, title }) } as Response
    })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await within(getList()).findByText('Pomme × 1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('R18 : les boutons sont désactivés pendant un appel à l\'API', async () => {
    let finishPost: (value: Response) => void = () => {}
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await screen.findByLabelText('Produit')
    // Le prochain POST ne répond pas tout de suite : on garde la main pour vérifier pendant l'attente.
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (finishPost = resolve)),
    )
    await addFromCatalog(user, 'Pomme')
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled()
    finishPost({ ok: true, status: 200, json: async () => ({ id: 195 }) } as Response)
    // screen.findByText attend que le texte apparaisse (la liste n'existe pas encore ici).
    await screen.findByText('Pomme × 1')
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Supprimer Pomme' })).toBeEnabled()
  })

  it('R21 : l\'interface est en français', async () => {
    fakeDummyJson()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Liste de courses' })).toBeInTheDocument()
  })
})

// Le faux audio.play() installé dans setupTests.ts : on lit combien de fois il a été appelé.
function neighCount() {
  return vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length
}

describe('Licornes (v1.1)', () => {
  it('R25 : 6 licornes SVG volent en fond, cachées aux lecteurs d\'écran', async () => {
    fakeDummyJson()
    render(<App />)
    await screen.findByLabelText('Produit')
    const sky = screen.getByTestId('sky')
    expect(sky).toHaveAttribute('aria-hidden', 'true')
    expect(sky.querySelectorAll('.flyer svg')).toHaveLength(6)
  })

  it('R25 : les licornes du fond ne gênent pas l\'utilisation de la liste', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    expect(await within(getList()).findByText('Pomme × 1')).toBeInTheDocument()
  })

  it('R27 : un ajout réussi fait hennir et passer une licorne au caddie avec le nom du produit', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    const ride = await screen.findByTestId('cart-unicorn')
    expect(ride).toHaveTextContent('Pomme')
    expect(ride).toHaveClass('cart-ride--add')
    expect(neighCount()).toBe(1)
  })

  it('R27 : quantité + 1 fait aussi hennir et passer une licorne au caddie', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 2')
    expect(screen.getAllByTestId('cart-unicorn')).toHaveLength(2)
    expect(neighCount()).toBe(2)
  })

  it('R28 : une suppression réussie fait hennir et passer une licorne au caddie, nom barré', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    await user.click(screen.getByRole('button', { name: 'Supprimer Pomme' }))
    await screen.findByText('La liste est vide')
    const removeRide = document.querySelector('.cart-ride--remove')
    expect(removeRide).toHaveTextContent('Pomme')
    expect(neighCount()).toBe(2) // 1 pour l'ajout + 1 pour la suppression
  })

  it('R29 : un ajout raté ne fait ni hennir ni passer de licorne au caddie', async () => {
    fakeDummyJson({ addOk: false })
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await screen.findByRole('alert')
    expect(screen.queryByTestId('cart-unicorn')).not.toBeInTheDocument()
    expect(neighCount()).toBe(0)
  })

  it('R29 : une suppression ratée ne fait ni hennir ni passer de licorne au caddie', async () => {
    fakeDummyJson({ deleteOk: false })
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    await user.click(screen.getByRole('button', { name: 'Supprimer Pomme' }))
    await screen.findByRole('alert')
    expect(document.querySelector('.cart-ride--remove')).toBeNull()
    expect(neighCount()).toBe(1) // seulement celui de l'ajout
  })

  it('R30 : le son joué est le fichier du hennissement', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await screen.findByTestId('cart-unicorn')
    const audio = vi.mocked(HTMLMediaElement.prototype.play).mock.contexts[0] as HTMLAudioElement
    expect(audio.src).toContain(NEIGH_URL)
  })

  it('R30 : si le navigateur refuse de jouer le son, rien ne casse et aucune erreur n\'est affichée', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error('NotSupportedError'))
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    expect(await within(getList()).findByText('Pomme × 1')).toBeInTheDocument()
    expect(screen.getByTestId('cart-unicorn')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('R31 : la licorne au caddie disparaît après 4 secondes ; plusieurs peuvent passer en même temps', async () => {
    // Faux minuteurs : on avance le temps nous-mêmes au lieu d'attendre 4 vraies secondes.
    // shouldAdvanceTime laisse quand même le temps avancer tout seul, ce dont userEvent a besoin.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fakeDummyJson()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    await addFromCatalog(user, 'Lait')
    await within(getList()).findByText('Lait × 1')
    expect(screen.getAllByTestId('cart-unicorn')).toHaveLength(2)
    act(() => {
      vi.advanceTimersByTime(CART_RIDE_MS)
    })
    expect(screen.queryByTestId('cart-unicorn')).not.toBeInTheDocument()
  })
})

describe('Traduction dans l\'app (v2)', () => {
  it('R32 : le catalogue et la liste affichent les noms français', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    const select = await screen.findByLabelText('Produit')
    expect(within(select).getByRole('option', { name: 'Pomme' })).toBeInTheDocument()
    await addFromCatalog(user, 'Pomme')
    expect(await within(getList()).findByText('Pomme × 1')).toBeInTheDocument()
  })

  it('R57 : l\'interrupteur « Noms en français » est activé par défaut et passe en anglais', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await within(getList()).findByText('Pomme × 1')
    const toggle = screen.getByRole('switch', { name: 'Noms en français' })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(within(getList()).getByText('Apple × 1')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Produit')).getByRole('option', { name: 'Milk' })).toBeInTheDocument()
  })

  it('R57 : le choix est gardé après un rechargement', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await screen.findByLabelText('Produit')
    await user.click(screen.getByRole('switch', { name: 'Noms en français' }))
    unmount() // = fermer la page...
    render(<App />) // ...et la rouvrir
    await screen.findByLabelText('Produit')
    expect(screen.getByRole('switch', { name: 'Noms en français' })).not.toBeChecked()
  })

  it('R27 : le caddie porte le nom français du produit', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Lait')
    expect(await screen.findByTestId('cart-unicorn')).toHaveTextContent('Lait')
  })
})
