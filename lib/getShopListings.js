const axios = require('axios')
const flat = require('array.prototype.flat');

const getPage = async ({shopId, personalAccessToken, page = 1}) => {
  const headers = {
      accept: 'application/json',
      'accept-version': '3.0',
      'pragma': 'no-cache',
      'x-display-currency': 'USD',
      authorization: `Bearer ${personalAccessToken}`
  }
  const params = {
    shop: shopId,
    page,
  }
  const url = 'https://reverb.com/api/listings'
  let response;
  try {
    response = await axios.get(url, {params, headers })
  } catch(error) {
    console.log(error)
  }
  return response.data
}

const getNextPage = (allPages) => {
  const {current_page, total_pages} = allPages[allPages.length - 1]
  return current_page < total_pages ? current_page + 1 : null
}

const getAllPages = async (queryFn, {params = {}, getNextPage = () => {}}) => {
  const pages = []
  let page = 1
  do {
    const response = await queryFn({...params, page})
    pages.push(response)
  } while(page = getNextPage(pages))
  return pages
}

const flattenListings = (allPages = []) => {
  return flat(allPages.map(({listings}) => listings), 1)
}

module.exports = {flattenListings, getNextPage, getPage, getAllPages}
