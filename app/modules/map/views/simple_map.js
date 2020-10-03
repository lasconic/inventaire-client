import map_ from '../lib/map'
const containerId = 'simpleMap'

export default Marionette.ItemView.extend({
  template: require('./templates/simple_map.hbs'),

  initialize () {
    return ({ models: this.models } = this.options)
  },

  behaviors: {
    PreventDefault: {}
  },

  onShow () {
    app.execute('modal:open', 'large', this.options.focus)
    // let the time to the modal to be fully open
    // so that the map can be drawned correctly
    this.setTimeout(this.initMap.bind(this), 500)
  },

  initMap () {
    const bounds = this.models.map(getPosition)

    const map = map_.draw({
      containerId,
      bounds,
      cluster: this.models.length > 2
    })

    return map_.showModelsOnMap(map, this.models)
  },

  events: {
    'click .userMarker a': 'showUser',
    'click .itemMarker a': 'showItem'
  },

  showUser (e) {
    if (_.isOpenedOutside(e)) return
    e.stopPropagation()
    const userId = e.currentTarget.attributes['data-user-id'].value
    app.execute('show:inventory:user', userId)
  },

  showItem (e) {
    if (_.isOpenedOutside(e)) return
    e.stopPropagation()
    const itemId = e.currentTarget.attributes['data-item-id'].value
    app.execute('show:item:byId', itemId)
  }
})

const getPosition = model => model.get('position') || model.position
