ListWithCounter = require 'modules/general/views/menu/list_with_counter'
seeAll = require './templates/see_all'
seeAllData =
  pathname: 'notifications'
  text: 'see all'

module.exports = ListWithCounter.extend
  childView: require './notification_li'
  emptyView: require './no_notification'
  initialize: ->
    @initUpdaters()

    # wait for the notifications to be added and rendered
    app.request('waitForData')
    .delay 1000
    .then @updateSeeAllLink.bind(@)

  serializeData: ->
    icon: 'globe'
    label: _.i18n 'notifications'

  className: 'notifications has-dropdown not-click'
  events:
    'click .listWithCounter': 'markNotificationsAsRead'
    'click .seeAll': 'showAllNotification'

  markNotificationsAsRead: -> @collection.markAsRead()
  count: -> @collection.unread().length

  filter: (child, index, collection)->
    if child.isUnread() then true
    else -1 < index < 5

  # to be shown and hidden by Foundation with the notification list
  # the see_all element has to be integrated to the ul.dropdown
  updateSeeAllLink: ->
    # it isnt clear why, but sometimes @ui.list.append throws a TypeError
    # TypeError: this.ui.list.append is not a function'
    # so if those conditions aren't satisfied yet, retry later
    if @ui?.list.append? and _.isFunction @ui.list.append
      # make sure it is added last
      @ui.list.append seeAll(seeAllData)
    else
      setTimeout @updateSeeAllLink, 3000

  showAllNotification: -> app.execute 'show:notifications'
