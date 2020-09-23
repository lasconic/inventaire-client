/* eslint-disable
    import/no-duplicates,
    no-return-assign,
    no-undef,
    no-unused-vars,
    no-var,
    prefer-arrow/prefer-arrow-functions,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
// internalized version of https://github.com/googleknowledge/qlabel

// How to:
// - Display html nodes with the hereafter defined class
//   and passing the node Qid as attribute
// - Trigger uriLabel.update to make it look for those elements
//   and replace their text by the best label it can find for the Qid

// keep in sync with app/modules/general/views/behaviors/templates/entity_value.hbs
import wd_ from 'lib/wikimedia/wikidata'
import getOriginalLang from 'modules/entities/lib/get_original_lang'

import LabelsHelpers from './labels_helpers'

import { get as getEntitiesModels } from 'modules/entities/lib/entities_models_index'

const className = 'uriLabel'
const selector = `.${className}`
const attribute = 'data-label-uri'

const {
  getLabel,
  setLabel,
  getKnownUris,
  resetLabels,
  addPreviouslyMissingUris,
  wasntPrevisoulyMissing
} = LabelsHelpers

const elements = null
let refresh = false

const getUris = el => el.getAttribute(attribute)
const getElements = () => document.querySelectorAll(selector)

const gatherRequiredUris = () => [].map.call(getElements(), getUris)

const display = function () {
  // new elements might have appeared since gatherRequiredUris
  // was fired, and they could possibly have known uri, thus the interest
  // of re-querying elements
  for (const el of getElements()) {
    const uri = getUris(el)
    if (uri != null) {
      const label = getLabel(uri)
      if (label != null) {
        el.textContent = label
        // remove the class so that it doesn't re-appear in the next queries
        el.className = el.className.replace(className, '')
      }
    }
  }
}

const getEntities = function (uris) {
  if (uris.length === 0) { return }

  return getEntitiesModels({ uris, refresh })
  .then(addEntitiesLabels)
  // /!\ Not waiting for the update to run
  // but simply calling the debounced function
  .then(debouncedUpdate)
  .catch(_.Error('uri_label getEntities err'))
}

var addEntitiesLabels = function (entitiesModels) {
  for (const uri in entitiesModels) {
    const entityModel = entitiesModels[uri]
    setLabel(uri, entityModel.get('label'))
  }
}

const getMissingEntities = function (uris) {
  const missingUris = _.difference(uris, getKnownUris())
  // Avoid refetching URIs: either the data is about to arrive
  // or the data is missing (in case of failing connection to Wikidata for instance)
  // and it would keep requesting it if not filtered-out
  const urisToFetch = missingUris.filter(wasntPrevisoulyMissing)
  addPreviouslyMissingUris(missingUris)
  if (urisToFetch.length > 0) {
    return getEntities(urisToFetch)
  } else { return Promise.resolve() }
}

const update = function () {
  const uris = gatherRequiredUris()

  // Do not trigger display when no uri was found at this stage
  if (uris.length === 0) { return }

  getMissingEntities(uris)
  // Trigger display even if missingUris.length is 0
  // has there might be new elements with a known uri
  // but that have not be displayed yet
  .then(display)
  .catch(_.Error('uriLabel err'))

  // no need to return the promise
  return null
}

// Due to the specific flow of uriLabel, which updates are triggered from
// several places, it would be hard to pass a 'refresh' argument,
// thus this slightly hacky solution: one can open a 5 seconds window
// during which, qlabels will be taken directly from Wikidata API,
// thank to getEntities passing the refresh request to the local cache
const refreshData = function () {
  refresh = true
  resetLabels()
  return setTimeout(endRefreshMode, 5000)
}

var endRefreshMode = () => refresh = false

var debouncedUpdate = _.debounce(update, 200)

export { debouncedUpdate as update, refreshData }
