import { describe, expect, it, vi } from 'vitest'
import { addProduct, deleteProduct, fetchCatalog } from './api'

// Crée un faux fetch qui répond toujours la même chose.
function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('api.ts (appels à DummyJSON)', () => {
  it('R1 : fetchCatalog appelle la catégorie groceries et renvoie id + title', async () => {
    const fetchMock = mockFetch({
      products: [{ id: 16, title: 'Apple', price: 1.99 }],
    })
    const products = await fetchCatalog()
    expect(fetchMock.mock.calls[0][0]).toContain(
      'https://dummyjson.com/products/category/groceries',
    )
    expect(products).toEqual([{ id: 16, title: 'Apple' }])
  })

  it('R3 : fetchCatalog lance une erreur si la réponse n\'est pas OK', async () => {
    mockFetch({}, false)
    await expect(fetchCatalog()).rejects.toThrow()
  })

  it('R9 : addProduct envoie POST /products/add avec le titre', async () => {
    const fetchMock = mockFetch({ id: 195, title: 'Apple' })
    await addProduct('Apple')
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://dummyjson.com/products/add')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ title: 'Apple' })
  })

  it('R12 : addProduct lance une erreur si la réponse n\'est pas OK', async () => {
    mockFetch({}, false)
    await expect(addProduct('Apple')).rejects.toThrow()
  })

  it('R14 : deleteProduct envoie DELETE /products/:id', async () => {
    const fetchMock = mockFetch({ id: 16, isDeleted: true })
    await deleteProduct(16)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://dummyjson.com/products/16')
    expect(options.method).toBe('DELETE')
  })

  it('R15 : deleteProduct lance une erreur si la réponse n\'est pas OK', async () => {
    mockFetch({}, false)
    await expect(deleteProduct(16)).rejects.toThrow()
  })
})
