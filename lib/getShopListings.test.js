const {flattenListings, getAllPages, getNextPage} = require('./getShopListings');
const emptyPage = require('./__mocks__/emptyPage');
const singlePage = require('./__mocks__/singlePage');

describe('getAllPages', () =>{
  const queryFn = () => Promise.resolve("DONE")
  it('calls an initial time', async () => {
    const response = await getAllPages(queryFn)
    expect(response).toEqual(["DONE"])
  })

  it('calls for the number of pages', async () => {
    const response = await getAllPages(queryFn, {
      getNextPage: (pages) => pages.length < 3 ? pages.length : null
    })
    expect(response).toEqual(["DONE", "DONE", "DONE"])
  })

  it('calls for the number of pages', async () => {
    const response = await getAllPages(queryFn, {
      getNextPage: (pages) => pages.length < 3 ? pages.length : null
    })
    expect(response).toEqual(["DONE", "DONE", "DONE"])
  })
})

describe('getNextPage', () =>{
  it('returns null if it has a single page', () => {
    expect(getNextPage([{current_page: 1, total_pages: 1}])).toEqual(null)
  })

  it('returns the next page if available', () => {
    expect(getNextPage([{current_page: 1, total_pages: 2}])).toEqual(2)
  })
})

describe('flattenListings', () => {
  it('empty states', () => {
    expect(flattenListings()).toEqual([])
    expect(flattenListings([])).toEqual([])
    expect(flattenListings([emptyPage])).toEqual([])
  })

  it('flattens a single page', () => {
    expect(flattenListings([singlePage]).length).toEqual(1)
  })

  it('flattens multiple pages', () => {
    expect(flattenListings([singlePage, singlePage]).length).toEqual(2)
  })
})
