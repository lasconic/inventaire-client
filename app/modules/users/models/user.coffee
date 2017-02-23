UserCommons = require './user_commons'
map_ = require 'modules/map/lib/map'

module.exports = UserCommons.extend
  isMainUser: false
  initialize: ->
    @setPathname()

    if @hasPosition()
      @listenTo app.user, 'change:position', @calculateDistance.bind(@)
      @calculateDistance()

    @setInventoryStats()
    @calculateHighlightScore()

  serializeData: ->
    attrs = @toJSON()
    attrs.cid = @cid
    relationStatus = attrs.status
    # converting the status into a boolean for templates
    attrs[relationStatus] = true
    # nonRelationGroupUser status have the same behavior as public users for views
    if relationStatus is 'nonRelationGroupUser'
      attrs.public = true
    attrs.inventoryLength = @inventoryLength()
    return attrs

  inventoryLength: -> @itemsCount

  # caching the calculated distance to avoid recalculating it
  # at every item serializeData
  calculateDistance: ->
    unless app.user.has('position') and @has('position') then return

    a = app.user.getCoords()
    b = @getCoords()
    distance = @kmDistanceFormMainUser = map_.distanceBetween a, b
    # Under 20km, return a ~100m precision to signal the fact that location
    # aren't precise to the meter or anything close to it
    # Above, return a ~1km precision
    precision = if distance > 20 then 0 else 1
    @distanceFromMainUser = Number(distance.toFixed(precision)).toLocaleString()
    return

  calculateHighlightScore: ->
    { itemsCount, itemsLastTime } = @
    # Highlight users with the most known items
    # updated lately (add 1 to avoid dividing by 0)
    freshnessFactor = 100 / (_.daysAgo(itemsLastTime) + 1)
    # Highlight users nearby
    distanceFactor = if @kmDistanceFormMainUser? then 100 / (@kmDistanceFormMainUser + 1) else 0
    # Well, just highlight anyone actually but don't let that dum per-_id default
    # order. Adapt the multiplicator to let other factors keep the upper ground
    randomFactor = Math.random() * 50
    points = itemsCount + freshnessFactor + distanceFactor + randomFactor
    # negating to get the higher scores appear first in collections
    @set 'highlightScore', (- points)
