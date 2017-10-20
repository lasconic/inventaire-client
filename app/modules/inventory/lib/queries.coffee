Item = require 'modules/inventory/models/item'
Items = require 'modules/inventory/collections/items'
error_ = require 'lib/error'

getById = (id)->
  ids = [ id ]
  _.preq.get app.API.items.byIds({ ids })
  .then (res)->
    { items, users } = res
    item = items[0]
    if item?
      app.execute 'users:add', users
      return new Item(item)
    else
      throw error_.new 'not found', 404, id
  # Maybe the item was deleted or its visibility changed?
  .catch _.ErrorRethrow('findItemById err')

# TODO: query multiple items in a single request
getByIds = (ids)-> Promise.all ids.map(getById)

getNetworkItems = (params)->
  app.request 'wait:for', 'users'
  .then ->
    networkIds = app.relations.network
    makeRequest params, 'byUsers', networkIds

getUserItems = (params)->
  userId = params.model.id
  makeRequest params, 'byUsers', [ userId ]

getGroupItems = (params)->
  makeRequest params, 'byUsers', params.model.allMembersIds(), 'group'

makeRequest = (params, endpoint, ids, filter)->
  if ids.length is 0 then return { items: [], total: 0 }
  { collection, limit, offset } = params
  _.preq.get app.API.items[endpoint]({ ids, limit, offset, filter })
  # Use tap to return the server response instead of the collection
  .tap addUsersAndItems(collection)

getNearbyItems = ->
  collection = new Items
  _.preq.get app.API.items.nearby()
  .then addUsersAndItems(collection)

getLastPublic = (params)->
  { collection, limit, offset, assertImage } = params
  _.preq.get app.API.items.lastPublic(limit, offset, assertImage)
  .then addUsersAndItems(collection)

getItemByQueryUrl = (queryUrl)->
  collection = new Items
  _.preq.get queryUrl
  .then addUsersAndItems(collection)

getByEntities = (uris)->
  getItemByQueryUrl app.API.items.byEntities({ ids: uris })

getByUserIdAndEntity = (userId, entityUri)->
  getItemByQueryUrl app.API.items.byUserAndEntity(userId, entityUri)

getByUsernameAndEntity = (username, entityUri)->
  getItemByQueryUrl app.API.items.byUsernameAndEntity(username, entityUri)

addUsersAndItems = (collection)-> (res)->
  { items, users } = res
  # Also accepts items indexed by listings: user, network, public
  unless _.isArray items then items = _.flatten _.values(items)
  unless items?.length > 0 then return collection

  app.execute 'users:add', users
  collection.add items
  return collection

module.exports = (app)->
  app.reqres.setHandlers
    'items:getByIds': getByIds
    'items:getByEntities': getByEntities
    'items:getNearbyItems': getNearbyItems
    'items:getLastPublic': getLastPublic
    'items:getNetworkItems': getNetworkItems
    'items:getUserItems': getUserItems
    'items:getGroupItems': getGroupItems
    'items:getByUserIdAndEntity': getByUserIdAndEntity
    'items:getByUsernameAndEntity': getByUsernameAndEntity

    # Using a different naming to match reqGrab requests style
    'get:item:model': getById
