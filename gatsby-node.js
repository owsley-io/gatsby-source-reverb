/**
 * You can uncomment the following line to verify that
 * your plugin is being loaded in your site.
 *
 * See: https://www.gatsbyjs.com/docs/creating-a-local-plugin/#developing-a-local-plugin-that-is-outside-your-project
 */
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)
const {flattenListings, getNextPage, getAllPages, getPage} = require('./lib/getShopListings')

const LISTING_TYPE = "ReverbListing"

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

exports.sourceNodes = async ({reporter, actions,createContentDigest, createNodeId}, {personalAccessToken, shopId}) => {
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


exports.onCreateNode = async ({
  actions: { createNode },
  getCache,
  createNodeId,
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
        node.listingImage = fileNode.id
        // OR with inference: link your source plugin's node to the File node without schemaCustomization like this, but creates a less sturdy schema
        node.listingImage___NODE = fileNode.id
      }
    }
  }
}
