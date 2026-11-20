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

type User = ReturnType<typeof userEvent.setup>

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

function addForm() {
  return screen.getByRole('form', { name: 'Ajouter un produit' })
}

// Attend le catalogue, choisit un produit, règle X et clique sur Ajouter.
async function addFromCatalog(user: User, name: string, quantity = 1) {
  await user.selectOptions(await screen.findByLabelText('Produit'), name)
  if (quantity !== 1) await setQuantity(user, addForm(), quantity)
  await user.click(within(addForm()).getByRole('button', { name: 'Ajouter' }))
}

// Une ligne de la liste, retrouvée par le nom du produit.
function getLine(name: string) {
  return screen.getByRole('listitem', { name })
}

async function findLine(name: string) {
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
    render(<App />)
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    await screen.findByLabelText('Produit')
  })

  it('R1 : tout le catalogue DummyJSON est chargé et proposé', async () => {
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
})

describe('Ajouter', () => {
  it('R5 : la liste commence vide', async () => {
    fakeDummyJson()
    render(<App />)
    await screen.findByLabelText('Produit')
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
  })

  it("R9 : ajouter X d'un produit absent appelle POST (nom anglais) et crée la ligne avec X", async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 3)
    const line = await findLine('Pomme')
    expect(plainText(line)).toContain('3 × 1,99 € = 5,97 €')
    const posts = callsWith(fetchMock, 'POST')
    expect(posts).toHaveLength(1)
    expect(JSON.parse(String(posts[0][1]?.body))).toEqual({ title: 'Apple' })
  })

  it('R10 : rajouter un produit présent ajoute X, sans appel API ni nouvelle ligne', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 2)
    await findLine('Pomme')
    await addFromCatalog(user, 'Pomme', 3)
    expect(plainText(getLine('Pomme'))).toContain('5 × 1,99 €')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(callsWith(fetchMock, 'POST')).toHaveLength(1)
  })

  it('R10 : rajouter un produit coché « acheté » le décoche', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await user.click(within(await findLine('Pomme')).getByRole('checkbox'))
    await addFromCatalog(user, 'Pomme')
    expect(within(getLine('Pomme')).getByRole('checkbox')).not.toBeChecked()
  })

  it('R8 : sans produit choisi, Ajouter ne fait rien ; pas de champ texte libre pour le nom', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await screen.findByLabelText('Produit')
    await user.click(within(addForm()).getByRole('button', { name: 'Ajouter' }))
    expect(callsWith(fetchMock, 'POST')).toHaveLength(0)
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
    // Le seul champ texte est celui de la quantité.
    expect(within(addForm()).getAllByRole('textbox')).toHaveLength(1)
  })

  it("R12 : si l'ajout échoue, une erreur est affichée et la liste ne change pas", async () => {
    fakeDummyJson({ addOk: false })
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    expect(await screen.findByRole('alert')).toHaveTextContent(/ajout/i)
    expect(screen.getByText('La liste est vide')).toBeInTheDocument()
  })
})

describe('Quantité X (R43)', () => {
  it('R43 : X vaut 1 par défaut ; « − » est désactivé à 1, « + » augmente', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await screen.findByLabelText('Produit')
    const form = addForm()
    const input = within(form).getByRole('textbox', { name: 'Quantité' })
    expect(input).toHaveValue('1')
    expect(within(form).getByRole('button', { name: 'Moins un' })).toBeDisabled()
    await user.click(within(form).getByRole('button', { name: 'Plus un' }))
    expect(input).toHaveValue('2')
  })

  it('R43 : une saisie invalide est ramenée entre 1 et 99 en quittant le champ', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await screen.findByLabelText('Produit')
    const form = addForm()
    const input = within(form).getByRole('textbox', { name: 'Quantité' })
    await setQuantity(user, form, 150)
    expect(input).toHaveValue('99')
    expect(within(form).getByRole('button', { name: 'Plus un' })).toBeDisabled()
    await setQuantity(user, form, 0)
    expect(input).toHaveValue('1')
    await user.clear(input)
    await user.type(input, 'abc')
    await user.tab()
    expect(input).toHaveValue('1')
  })

  it('R43 : après un ajout réussi, X revient à 1 (formulaire et ligne)', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 3)
    await findLine('Pomme')
    expect(within(addForm()).getByRole('textbox', { name: 'Quantité' })).toHaveValue('1')
    await lineAction(user, 'Pomme', 'Ajouter', 4)
    expect(within(getLine('Pomme')).getByRole('textbox', { name: 'Quantité' })).toHaveValue('1')
  })
})

describe('Ma liste', () => {
  it('R6 : une ligne affiche image, nom, prix unitaire, quantité, sous-total, case et boutons', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Lait', 2)
    const line = await findLine('Lait')
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
    render(<App />)
    await addFromCatalog(user, 'Lait')
    await findLine('Lait')
    await addFromCatalog(user, 'Pomme')
    await findLine('Pomme')
    const lines = within(screen.getByRole('list', { name: 'À acheter' })).getAllByRole('listitem')
    expect(lines.map((line) => line.getAttribute('aria-label'))).toEqual(['Lait', 'Pomme'])
  })

  it('R44 : « Ajouter » sur une ligne ajoute X sans appel API', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Ajouter', 4)
    expect(plainText(getLine('Pomme'))).toContain('5 × 1,99 €')
    expect(callsWith(fetchMock, 'POST')).toHaveLength(1)
  })

  it('R44 : « Retirer » X < quantité baisse la quantité sans appel API', async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 5)
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Retirer', 2)
    expect(plainText(getLine('Pomme'))).toContain('3 × 1,99 €')
    expect(callsWith(fetchMock, 'DELETE')).toHaveLength(0)
  })

  it("R44 + R14 : « Retirer » X ≥ quantité appelle DELETE avec l'id du catalogue et retire la ligne", async () => {
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 2)
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Retirer', 5)
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
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Retirer')
    expect(await screen.findByRole('alert')).toHaveTextContent(/suppression/i)
    expect(getLine('Pomme')).toBeInTheDocument()
  })

  it("R17 : le message d'erreur disparaît quand l'action suivante réussit", async () => {
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
    await user.click(within(addForm()).getByRole('button', { name: 'Ajouter' }))
    await findLine('Pomme')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("R18 : les boutons Ajouter et Retirer sont désactivés pendant un appel à l'API", async () => {
    let finishPost: (value: Response) => void = () => {}
    const fetchMock = fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Lait')
    await findLine('Lait')
    // Le prochain POST ne répond pas tout de suite : on garde la main pour vérifier pendant l'attente.
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (finishPost = resolve)),
    )
    await addFromCatalog(user, 'Pomme')
    expect(within(addForm()).getByRole('button', { name: 'Ajouter' })).toBeDisabled()
    expect(within(getLine('Lait')).getByRole('button', { name: 'Retirer' })).toBeDisabled()
    finishPost({ ok: true, status: 200, json: async () => ({ id: 195 }) } as Response)
    await findLine('Pomme')
    expect(within(addForm()).getByRole('button', { name: 'Ajouter' })).toBeEnabled()
  })
})

describe('Prix, total et « déjà acheté »', () => {
  it('R46 : le récapitulatif affiche articles, total, déjà acheté et reste à payer', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 3) // 5,97 €
    await findLine('Pomme')
    await addFromCatalog(user, 'Lait', 2) // 6,98 €
    await findLine('Lait')
    const summary = plainText(screen.getByLabelText('Récapitulatif'))
    expect(summary).toContain('Articles5')
    expect(summary).toContain('Total12,95 €')
    expect(summary).toContain('Déjà acheté0,00 €')
    expect(summary).toContain('Reste à payer12,95 €')
  })

  it('R48 : cocher une ligne la barre, la descend dans « Déjà acheté » et change le reste à payer', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 3)
    await findLine('Pomme')
    await addFromCatalog(user, 'Lait', 2)
    await findLine('Lait')
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
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await findLine('Pomme')
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
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await findLine('Pomme')
    const toggle = screen.getByRole('switch', { name: 'Noms en français' })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(getLine('Apple')).toBeInTheDocument()
    const select = screen.getByLabelText('Produit')
    expect(within(select).getByRole('option', { name: 'Milk' })).toBeInTheDocument()
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

  it("R21 : l'interface est en français", async () => {
    fakeDummyJson()
    render(<App />)
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
    render(<App />)
    await screen.findByLabelText('Produit')
    const sky = screen.getByTestId('sky')
    expect(sky).toHaveAttribute('aria-hidden', 'true')
    expect(sky.querySelectorAll('.flyer svg')).toHaveLength(6)
  })

  it('R27 : un ajout réussi fait hennir et passer une licorne au caddie « X × nom »', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 2)
    const ride = await screen.findByTestId('cart-unicorn')
    expect(ride).toHaveTextContent('2 × Pomme')
    expect(ride).toHaveClass('cart-ride--add')
    expect(neighCount()).toBe(1)
  })

  it('R27 : ajouter depuis une ligne fait aussi passer une licorne au caddie', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Ajouter', 3)
    expect(screen.getAllByTestId('cart-unicorn')[1]).toHaveTextContent('3 × Pomme')
    expect(neighCount()).toBe(2)
  })

  it('R28 : un retrait partiel réussi fait passer une licorne « retour », nom barré', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 5)
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Retirer', 2)
    expect(document.querySelector('.cart-ride--remove')).toHaveTextContent('2 × Pomme')
    expect(neighCount()).toBe(2)
  })

  it('R28 : un retrait complet affiche la quantité vraiment retirée', async () => {
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme', 2)
    await findLine('Pomme')
    await lineAction(user, 'Pomme', 'Retirer', 9)
    await screen.findByText('La liste est vide')
    expect(document.querySelector('.cart-ride--remove')).toHaveTextContent('2 × Pomme')
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

  it('R29 : une suppression ratée ou une case cochée ne font pas passer de licorne', async () => {
    fakeDummyJson({ deleteOk: false })
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    await findLine('Pomme')
    await user.click(within(getLine('Pomme')).getByRole('checkbox'))
    await lineAction(user, 'Pomme', 'Retirer')
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

  it("R30 : si le navigateur refuse de jouer le son, rien ne casse et aucune erreur n'est affichée", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error('NotSupportedError'))
    fakeDummyJson()
    const user = userEvent.setup()
    render(<App />)
    await addFromCatalog(user, 'Pomme')
    expect(await findLine('Pomme')).toBeInTheDocument()
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
    await findLine('Pomme')
    await addFromCatalog(user, 'Lait')
    await findLine('Lait')
    expect(screen.getAllByTestId('cart-unicorn')).toHaveLength(2)
    act(() => {
      vi.advanceTimersByTime(CART_RIDE_MS)
    })
    expect(screen.queryByTestId('cart-unicorn')).not.toBeInTheDocument()
  })
})
