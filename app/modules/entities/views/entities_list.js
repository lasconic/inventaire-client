import loader from '#general/views/templates/loader.hbs'
import error_ from '#lib/error'
import EntitiesListAdder from './entities_list_adder.js'
import { currentRoute } from '#lib/location'
import entitiesListTemplate from './templates/entities_list.hbs'
import '../scss/entities_list.scss'
import Loading from '#behaviors/loading'
import PreventDefault from '#behaviors/prevent_default'

// TODO:
// - deduplicate series in sub series https://inventaire.io/entity/wd:Q740062
// - hide series parts when displayed as sub-series

// Work around circular dependencies
let viewByType
const lateImport = async () => {
  const [
    { default: SerieLayout },
    { default: WorkLi },
    { default: ArticleLi },
    { default: EditionLi },
    { default: AuthorLayout },
    { default: PublisherLayout },
    { default: CollectionLayout },
  ] = await Promise.all([
    import('./serie_layout.js'),
    import('./work_li.js'),
    import('./article_li.js'),
    import('./edition_li.js'),
    import('./author_layout.js'),
    import('./publisher_layout.js'),
    import('./collection_layout.js'),
  ])
  viewByType = {
    serie: SerieLayout,
    work: WorkLi,
    article: ArticleLi,
    edition: EditionLi,
    human: AuthorLayout,
    publisher: PublisherLayout,
    collection: CollectionLayout,
  }
}

let waitForLateImport
// Do not export the View itself, but this async function
// to force to wait for late imports
export default async function (params) {
  waitForLateImport = waitForLateImport || lateImport()
  await waitForLateImport
  return new EntitiesList(params)
}

const EntitiesList = Marionette.CollectionView.extend({
  template: entitiesListTemplate,
  className () {
    const standalone = this.options.standalone ? 'standalone' : ''
    return `entitiesList ${standalone}`
  },
  behaviors: {
    Loading,
    PreventDefault,
  },

  childViewContainer: '.container',

  childView (model) {
    const { type } = model
    const View = viewByType[type]
    if (View != null) return View
    const err = error_.new(`unknown entity type: ${type}`, model)
    // Weird: errors thrown here don't appear anyware
    // where are those silently catched?!?
    console.error('entities_list childView err', err, model)
    throw err
  },

  childViewOptions (model, index) {
    return {
      refresh: this.options.refresh,
      showActions: this.options.showActions,
      wrap: this.options.wrapWorks,
      compactMode: this.options.compactMode,
      tagName: 'li',
    }
  },

  ui: {
    counter: '.counter',
    more: '.displayMore',
    addOne: '.addOne',
    moreCounter: '.displayMore .counter'
  },

  initialize () {
    ({ parentModel: this.parentModel, addButtonLabel: this.addButtonLabel } = this.options)
    this.childrenClaimProperty = this.options.childrenClaimProperty || this.parentModel.childrenClaimProperty
    const initialLength = this.options.initialLength || 5
    this.batchLength = this.options.batchLength || 15

    this.fetchMore = this.collection.fetchMore.bind(this.collection)
    this.more = this.collection.more.bind(this.collection)

    this.collection.firstFetch(initialLength)
  },

  serializeData () {
    return {
      title: this.options.title,
      customTitle: this.options.customTitle,
      hideHeader: this.options.hideHeader,
      more: this.more(),
      totalLength: this.collection.totalLength,
      addButtonLabel: this.addButtonLabel
    }
  },

  events: {
    'click .displayMore': 'displayMore',
    'click .addOne': 'addOne'
  },

  displayMore () {
    this.startMoreLoading()

    return this.collection.fetchMore(this.batchLength)
    .then(() => {
      if (this.more()) {
        this.ui.moreCounter.text(this.more())
      } else {
        this.ui.more.hide()
        this.ui.addOne.removeClass('hidden')
      }
    })
  },

  startMoreLoading () {
    this.ui.moreCounter.html(loader())
  },

  addOne (e) {
    if (!app.request('require:loggedIn', currentRoute())) return
    const { type, parentModel } = this.options
    app.layout.showChildView('modal', new EntitiesListAdder({
      header: this.addOneLabel,
      type,
      childrenClaimProperty: this.childrenClaimProperty,
      canSearchListCandidatesFromLabel: this.options.canSearchListCandidatesFromLabel,
      parentModel,
      listCollection: this.collection,
    }))
    // Prevent nested entities list to trigger that same event on the parent list
    e.stopPropagation()
  }
})
