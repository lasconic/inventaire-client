/* eslint-disable
    import/no-duplicates,
    no-undef,
    no-var,
    prefer-arrow/prefer-arrow-functions,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
import Config from './config'

import buildMarker from './build_marker'

const {
  tileUrl,
  settings,
  defaultZoom
} = Config

export default function (params) {
  let { containerId, latLng, zoom, bounds, cluster } = params
  bounds = _.compact(bounds)

  if (bounds.length === 1) {
    latLng = bounds[0]
    zoom = 5
  }

  if (!zoom) { zoom = defaultZoom }

  const map = L.map(containerId)

  if (latLng != null) {
    map.setView(latLng, zoom)
  } else { map.fitBounds(bounds) }

  L.tileLayer(tileUrl, settings).addTo(map)

  if (_.isMobile) { map.scrollWheelZoom.disable() }

  if (cluster) {
    initWithCluster(map)
  } else { initWithoutCluster(map) }

  return map
}

var initWithCluster = function (map) {
  // See options https://github.com/Leaflet/Leaflet.markercluster#options
  const cluster = L.markerClusterGroup()
  cluster._knownObjectIds = {}
  map.addLayer(cluster)
  map.addMarker = addMarkerToCluster(cluster)
}

var initWithoutCluster = function (map) {
  map.addMarker = addMarkerToMap(map)
}

var addMarkerToMap = map => function (params) {
  const marker = buildMarker(params)
  marker.addTo(map)
  return marker
}

var addMarkerToCluster = cluster => function (params) {
  const { objectId } = params

  if (cluster._knownObjectIds[objectId]) {
    _.log(objectId, 'not re-adding known object')
    return
  }

  const marker = buildMarker(params)
  cluster.addLayer(marker)

  cluster._knownObjectIds[objectId] = true
  _.log(objectId, 'added unknown object')

  return marker
}
