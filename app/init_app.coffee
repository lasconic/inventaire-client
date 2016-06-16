module.exports = ->
  app = require 'app'
  window.app = app

  _ = require('lib/builders/utils')()

  # gets all the routes used in the app
  app.API = require('api/api')(_)

  require('lib/handlebars_helpers/base').initialize(app.API)
  require('lib/global_libs_extender')(_)
  require('lib/global_helpers')(app, _)

  LocalDB = require('lib/data/local_db').build(window, _)
  # constructor for interactions between module and LevelDb/IndexedDb
  app.LocalCache = require('lib/data/local_cache')(LocalDB, _, _.preq)

  # setting reqres to trigger methods on data:ready events
  app.data = require('lib/data_state')
  app.data.initialize()

  # initialize all the modules and their routes before app.start()
  # the first routes initialized have the lowest priority

  # /!\ routes defined before Redirect will be overriden by the glob
  app.module 'Redirect', require 'modules/redirect'
  # Users and Entities need to be initialize for the Welcome item panel to work
  app.module 'Users', require 'modules/users/users'
  app.module 'Entities', require 'modules/entities/entities'
  app.module 'User', require 'modules/user/user'
  app.module 'Search', require 'modules/search/search'
  app.module 'Inventory', require 'modules/inventory/inventory'
  app.module 'Transactions', require 'modules/transactions/transactions'
  app.module 'Network', require 'modules/network/network'
  app.module 'Notifications', require 'modules/notifications/notifications'
  app.module 'Settings', require 'modules/settings/settings'
  require('modules/map/map')()
  require('modules/comments/comments')()

  AppLayout = require 'modules/general/views/app_layout'

  app.request 'waitForI18n'
  .then ->
    # Initialize the application on DOM ready event.
    $ ->
      # initialize layout after user to get i18n data
      app.layout = new AppLayout
      require('lib/foundation').initialize(app)
      app.execute 'show:user:menu:update'

      app.start()

      app.vent.trigger 'layout:ready'
      app.layout.ready = true

  require('lib/piwik')()
  require('lib/jquery-jk').initialize($)
