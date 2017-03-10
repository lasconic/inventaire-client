createEntities = require 'modules/entities/lib/create_entities'
forms_ = require 'modules/general/lib/forms'
error_ = require 'lib/error'
isbn_ = require 'lib/isbn'
isLoggedIn = require './is_logged_in'

createEditionEntityFromWork = (view, workModel, e)->
  unless isLoggedIn() then return

  $isbnField = $(e.currentTarget).parent('#isbnGroup').find('#isbnField')
  isbn = $isbnField.val()

  createEntities.workEdition workModel, isbn
  .catch RenameIsbnDuplicateErr(isbn)
  .then (editionModel)->
    # Special case of property_values collection
    if view.collection.addByValue?
      view.collection.addByValue editionModel.get('uri')
    # In other cases, the model being added to the work edition collection
    # by createEntities.workEdition is engouh
    $isbnField.val null
  .catch error_.Complete('#isbnField')
  .catch forms_.catchAlert.bind(null, view)

RenameIsbnDuplicateErr = (isbn)-> (err)->
  if err.responseJSON?.status_verbose is 'this property value is already used'
    normalizedIsbn = isbn_.normalizeIsbn isbn
    link = "<a href='/entity/isbn:#{normalizedIsbn}' class='showEntity'>#{normalizedIsbn}</a>"
    err.responseJSON.status_verbose = _.i18n('this ISBN already exist:') + " #{link}"
    err.i18n = false

  throw err

module.exports =
  'wdt:P747':
    partial: 'edition_creation'
    partialData: ->
      isbnInputData:
        nameBase: 'isbn'
        field:
          placeholder: _.i18n('ex:') + ' 2070368228'
          dotdotdot: ''
        button:
          icon: 'plus'
          text: 'add'
          classes: 'grey postfix sans-serif'
    clickEvents:
      isbnButton: createEditionEntityFromWork
