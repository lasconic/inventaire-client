module.exports = class VisibilityTabs extends Backbone.Marionette.ItemView
  template: require 'views/items/templates/visibility_tabs'
  events:
    'click #noVisibilityFilter, #private, #contacts, #public': 'updateVisibilityTabs'

  updateVisibilityTabs: (e)->
    visibility = $(e.currentTarget).attr 'id'
    if visibility is 'noVisibilityFilter'
      app.execute 'filter:visibility:reset'
    else
      app.execute 'filter:visibility', visibility

    $('#visibility-tabs li').removeClass 'active'
    $(e.currentTarget).find('li').addClass 'active'

  serializeData: ->
    listings: app.user.listings