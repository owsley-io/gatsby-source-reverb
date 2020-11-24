/**
 * You can uncomment the following line to verify that
 * your plugin is being loaded in your site.
 *
 * See: https://www.gatsbyjs.com/docs/creating-a-local-plugin/#developing-a-local-plugin-that-is-outside-your-project
 */
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)
const {flattenListings, getNextPage, getAllPages, getPage} = require('./lib/getShopListings')
const brandAssets = require('./brand-assets')

const LISTING_TYPE = "ReverbListing"
const BRAND_ASSET_TYPE = 'ReverbBrandAsset'

let isVerbose = false
const report = (str = '') => ['[gastby-source-reverb]', str].join(' ')
const verbose = (fn, str) => {
  if(isVerbose){
    fn(report(str))
  }
}

exports.onPreInit = ({reporter}, pluginOptions) => {
  isVerbose = pluginOptions.verbose
  if(!pluginOptions.shopId){
    reporter.panic(report("shopId option is required"))
  }
  if(!pluginOptions.personalAccessToken){
    reporter.panic(report("personalAccessToken option is required"))
  }
  verbose(reporter.success, "loaded")
}

const createListingNodes = async ({reporter, actions,createContentDigest, createNodeId}, {personalAccessToken, shopId}) => {
  const { createNode } = actions
  try {
    const pages = await getAllPages(getPage, {params: {personalAccessToken, shopId}, getNextPage})
    verbose(reporter.success, `getAllPages fetched ${pages.length} pages`)
    flattenListings(pages).forEach((listing) => {
      createNode({
        ...listing,
        id: createNodeId(`reverb-listing-${listing.id}`),
        parent: null,
        children: [],
        internal: {
          type: LISTING_TYPE,
          content: JSON.stringify(listing),
          contentDigest: createContentDigest(listing),
          mediaType: "application/json",
        },
      })
    })
  } catch (error){
    reporter.error(report(), error)
  }
  return

}


const createBrandAssetNodes = async ({
  actions: { createNode },
  createNodeId,
  createContentDigest,
  reporter,
  node,
}) => {
  Object
    .entries(brandAssets)
    .map(([name, url]) => ({name, url}))
    .map(async(props) => {
      const {name, url} = props
      verbose(reporter.success, `createBrandAssetNodes created ${name}`)
      createNode({
        name,
        url,
        id: createNodeId(`reverb-brand-asset-${name}`),
        parent: null,
        children: [],
        internal: {
          type: BRAND_ASSET_TYPE,
          content: JSON.stringify(props),
          contentDigest: createContentDigest(props),
          mediaType: 'application/json',
        }
        })
    })
  return
}

exports.sourceNodes = async (config, params) => {
  await createListingNodes(config, params)
  await createBrandAssetNodes(config, params)
}

const createListingTypePhotos = async ({
  actions: { createNode },
  getCache,
  createNodeId,
  reporter,
  node,
}) => {
  // because onCreateNode is called for all nodes, verify that you are only running this code on nodes created by your plugin
  if (node.internal.type === LISTING_TYPE) {
    // create a FileNode in Gatsby that gatsby-transformer-sharp will create optimized images for
    if(node._links.photo){
      const fileNode = await createRemoteFileNode({
        // the url of the remote image to generate a node for
        url: node._links.photo.href,
        getCache,
        createNode,
        createNodeId,
        parentNodeId: node.id,
      })
      if (fileNode) {
        // with schemaCustomization: add a field `remoteImage` to your source plugin's node from the File node
        verbose(reporter.success, `created file node for ${LISTING_TYPE}: ${fileNode.id}`)
        node.listingImage = fileNode.id
        // OR with inference: link your source plugin's node to the File node without schemaCustomization like this, but creates a less sturdy schema
        node.listingImage___NODE = fileNode.id
      }
    }
  }
}

const createBrandAssetTypePhotos = async ({
  actions: { createNode },
  getCache,
  reporter,
  createNodeId,
  node,
}) => {
  if (node.internal.type === BRAND_ASSET_TYPE) {
    const fileNode = await createRemoteFileNode({
      url: node.url,
      getCache,
      createNode,
      createNodeId,
      parentNodeId: node.id,
    })
    if (fileNode) {
      verbose(reporter.success, `created file node for ${BRAND_ASSET_TYPE}: ${fileNode.id}`)
      node.imageFile = fileNode.id
      node.imageFile___NODE = fileNode.id
    }
  }
}

exports.onCreateNode = async (props) => {
  const {reporter} = props;
  verbose(reporter.info, `onCreateNode start`)
  await createListingTypePhotos(props)
  await createBrandAssetTypePhotos(props)
  verbose(reporter.info, `onCreateNode finish`)
}
