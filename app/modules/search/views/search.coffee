ResultsList = require './results_list'
Entities = require 'modules/entities/collections/entities'
WikidataEntities = require 'modules/entities/collections/wikidata_entities'
IsbnEntities = require 'modules/entities/collections/isbn_entities'
EntityCreate = require 'modules/entities/views/entity_create'
wd_ = app.lib.wikidata

module.exports = class Search extends Backbone.Marionette.LayoutView
  id: 'searchLayout'
  template: require './templates/search'
  behaviors:
    AlertBox: {}
  serializeData: ->
    search:
      nameBase: 'search'
      field: {}
      button:
        icon: 'search'
        classes: 'secondary postfix'

  regions:
    inventoryItems: '#inventoryItems'
    authors: '#authors'
    books: '#books'
    editions: '#editions'
    createEntity: '#create'

  initialize: (params)->
    @query = params.query

  onShow: ->
    @updateSearchBar()
    app.request 'waitForFriendsItems', @showItems.bind(@)
    @searchEntities()
    @showEntityCreationForm()

  updateSearchBar: ->
    $('#searchField').val @query
    # app.execute 'search:field:maximize'

  showItems: ->
    collection = Items.filtered.resetFilters().filterByText @query
    if collection.length > 0
      view = new app.View.Items.List {collection: collection}
      @inventoryItems.show view

  sameAsPreviousQuery: ->
    # verifying that the query is not the same as the last one
    # and using the previous results if so
    if app.results.search is @query and app.results.books?.length > 0
      @displayResults()
      @authors.$el.hide().fadeIn(200)
      return true

  searchEntities: ->
    search = @query
    _.log search, 'search'
    app.results ||= {}
    app.execute 'show:loader', {region: @authors}
    unless @sameAsPreviousQuery()
      _.preq.get app.API.entities.search(search)
      .catch _.preq.catch404
      .then (res)=>
        # hiding the loader
        @authors.empty()
        if res?
          _.log res, 'query:searchEntities res'
          spreadResults(res)
        else return
      .then @displayResults.bind(@)
      .catch (err)=>
        # couldn't make the alert Behavior work properly
        # so the triggerMethod '404' thing is a provisory solution
        @.$el.trigger 'alert', {message: _.i18n 'no item found'}
        @displayResults()
        _.log err, 'searchEntities err'


  displayResults: ->
    {humans, authors, books, editions} = app.results

    @showAuthors(authors, humans)
    @showBooks(books)
    @showEditions(editions)

  showAuthors: (authors, humans)->
    if authors?.length is 0 then authors = humans
    if authors?.length > 0
      authorsList = new ResultsList {collection: authors, type: 'authors'}
      @authors.show authorsList

  showBooks: (books)->
    if books?.length > 0
      booksList = new ResultsList {collection: books, type: 'books', entity: 'Q571'}
      @books.show booksList

  showEditions: (editions)->
    if editions?.length > 0
      editionsList = new ResultsList {collection: editions, type: 'editions', entity: 'Q17902573'}
      @editions.show editionsList

  showEntityCreationForm: ->
    view = new EntityCreate {data: @query}
    _.inspect(@)
    @createEntity.show view
    @$el.find('h3.create').show()

spreadResults = (res)->
  _.log res, 'res at spreadResults'
  app.results =
    humans: new Entities
    authors: new Entities
    books: new Entities
    editions: new Entities
    search: res.search

  {wd, google} = res

  if wd? then addWikidataEntities wd.items
  if google? then addIsbnEntities google.items

addWikidataEntities = (resultsArray)->
  # instantiating generic wikidata entities first
  # and only upgrading later on more specific Models
  # as methods on WikidataEntities greatly ease the sorting process
  wdEntities = new WikidataEntities resultsArray
  wdEntities.models.map (model)->
    claims = model.get('claims')
    if _.isntEmpty(claims.P31)
      if wd_.isBook(claims.P31)
        app.results.books.add model

      if wd_.isHuman(claims.P31)
        app.results.humans.add model

    if _.isntEmpty(claims.P106)
      if wd_.isAuthor(claims.P106)
        app.results.authors.add model

addIsbnEntities = (resultsArray)->
  editions = new IsbnEntities resultsArray
  editions.models.map (el)-> app.results.editions.add el

