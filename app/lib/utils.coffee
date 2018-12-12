oneDay = 24 * 60 * 60 * 1000
error_ = requireProxy 'lib/error'

module.exports = (Backbone, _, $, app, window)->
  # Will be overriden in modules/user/lib/i18n.coffee as soon as possible
  i18n: _.identity
  I18n: (args...)-> _.capitalise _.i18n.apply(_, args)
  icon: (name, classes = '')-> "<i class='fa fa-#{name} #{classes}'></i>"

  parseQuery: (queryString)->
    query = {}
    if queryString?
      queryString
      .replace /^\?/, ''
      .split '&'
      .forEach ParseKeysValues(query)
    return query

  piped: (data)-> _.forceArray(data).join '|'

  inspect: (obj, label)->
    if _.isArguments obj then obj = _.toArray obj
    # remove after using as it keeps reference of the inspected object
    # making the garbage collection impossible
    if label?
      _.log obj, "#{label} added to window['#{label}'] for inspection"
      window[label] = obj
    else
      if window.current?
        window.previous or= []
        window.previous.unshift(window.current)
      window.current = obj

    return obj

  lastRouteMatch: (regex)->
    if Backbone.history.last?[1]?
      last = Backbone.history.last[1]
      return regex.test(last)
    else false

  isntEmpty: (array)-> not _.isEmpty(array)

  # /!\ window.screen.width is the screen's width not the current window width
  screenWidth: -> $(window).width()
  screenHeight: -> $(window).height()
  # keep in sync with app/modules/general/scss/_grid_and_media_query_ranges.scss
  smallScreen: (ceil = 1000)-> _.screenWidth() < ceil

  deepExtend: $.extend.bind($, yes)
  deepClone: (obj)->
    _.type obj, 'object'
    return JSON.parse JSON.stringify(obj)

  capitalise: (str)->
    if str is '' then return ''
    str[0].toUpperCase() + str[1..-1]

  isOpenedOutside: (e, ignoreMissingHref = false)->
    unless e?.ctrlKey?
      error_.report 'non-event object was passed to isOpenedOutside'
      # Better breaking an open outside behavior than not responding
      # to the event at all
      return false

    unless _.isNonEmptyString e.currentTarget?.href
      unless ignoreMissingHref
        error_.report "can't open anchor outside: href is missing"
      return false

    openInNewWindow = e.shiftKey
    # Anchor with a href are opened out of the current window when the ctrlKey is
    # pressed, or the metaKey (Command) in case its a Mac
    openInNewTabByKey = if isMac then e.metaKey else e.ctrlKey
    # Known case of missing currentTarget: leaflet formatted events
    openOutsideByTarget = e.currentTarget?.target is '_blank'
    return openInNewTabByKey or openInNewWindow or openOutsideByTarget

  noop: ->

  currentRoute: -> location.pathname.slice(1)
  setQuerystring: (url, key, value)->
    [ href, qs ] = url.split '?'
    qsObj = _.parseQuery qs
    # override the previous key/value
    qsObj[key] = value
    return _.buildPath href, qsObj

  # calling a section the first part of the route matching to a module
  # ex: for '/inventory/bla/bla', the section is 'inventory'
  routeSection: (route)->
    # split on the first non-alphabetical character
    route.split(/[^\w]/)[0]

  currentSection: -> _.routeSection _.currentRoute()

  # Scroll to the top of an $el
  # Increase marginTop to scroll to a point before the element top
  scrollTop: ($el, duration = 500, marginTop = 0)->
    # Polymorphism: accept jquery objects or selector strings as $el
    if _.isString then $el = $($el)
    top = $el.position().top - marginTop
    $('html, body').animate { scrollTop: top }, duration

  # Scroll to a given height
  scrollHeight: (height, ms = 500)->
    $('html, body').animate { scrollTop: height }, ms

  # Scroll to the top of an element inside a element with a scroll,
  # typically a list of search results partially hidden
  innerScrollTop: ($parent, $children)->
    if $children?.length > 0
      selectedTop = $children.position().top
      # Adjust scroll to the selected element
      scrollTop = $parent.scrollTop() + selectedTop - 50
    else
      scrollTop = 0
    $parent.animate { scrollTop }, { duration: 50, easing: 'swing' }

  # let the view call the plugin with the view as context
  # ex: module.exports = _.BasicPlugin events, handlers
  BasicPlugin: (events, handlers)->
    _.partial _.basicPlugin, events, handlers

  # expected to be passed a view as context, an events object
  # and the associated handlers
  # ex: _.basicPlugin.call @, events, handlers
  basicPlugin: (events, handlers)->
    @events or= {}
    _.extend @events, events
    _.extend @, handlers
    return

  cutBeforeWord: (text, limit)->
    shortenedText = text[0..limit]
    return shortenedText.replace /\s\w+$/, ''

  LazyRender: (view, timespan = 200, attachFocusHandler)->
    cautiousRender = (focusSelector)->
      unless view.isDestroyed
        view.render()
        if _.isString focusSelector then view.$el.find(focusSelector).focus()

    if attachFocusHandler
      view.LazyRenderFocus = (focusSelector)->
        return fn = -> view.lazyRender focusSelector

    return _.debounce cautiousRender, timespan

  invertAttr: ($target, a, b)->
    aVal = $target.attr a
    bVal = $target.attr b
    $target.attr a, bVal
    $target.attr b, aVal

  daysAgo: (epochTime)-> Math.floor(( Date.now() - epochTime ) / oneDay)

  timeSinceMidnight: ->
    today = _.simpleDay()
    midnight = new Date(today).getTime()
    return Date.now() - midnight

  # Returns a .catch function that execute the reverse action
  # then passes the error to the next .catch
  Rollback: (reverseAction, label)->
    return rollback = (err)->
      if label? then _.log "rollback: #{label}"
      reverseAction()
      throw err

  # Tests (compeling app/lib/shared/tests for the client needs)
  isModel: (obj)-> obj instanceof Backbone.Model
  isView: (obj)-> obj instanceof Backbone.View
  isCanvas: (obj)-> obj?.nodeName?.toLowerCase() is 'canvas'

  allValues: (obj)-> _.flatten _.values(obj)

  # Functions mimicking Lodash

  # Get the value from an object using a string
  # (equivalent to lodash deep 'get' function).
  get: (obj, prop)-> prop.split('.').reduce objectWalker, obj

  # adapted from lodash implementation
  values: (obj)->
    index = -1
    props = Object.keys obj
    length = props.length
    result = Array length

    while ++index < length
      result[index] = obj[props[index]]

    return result

  sum: (array)-> array.reduce add, 0

  trim: (str)-> str.trim()

  isPlainObject: (obj)-> _.typeOf(obj) is 'object'

  focusInput: ($el)->
    $el.focus()
    value = $el[0]?.value
    unless value? then return
    $el[0].setSelectionRange 0, value.length

  # adapted from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  hashCode: (string)->
    [ hash, i, len ] = [ 0, 0, string.length ]
    if len is 0 then return hash

    while i < len
      chr = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0 # Convert to 32bit integer
      i++
    Math.abs hash

  buildPath: (pathname, queryObj, escape)->
    queryObj = removeUndefined queryObj
    if not queryObj? or _.isEmpty(queryObj) then return pathname

    queryString = ''

    for key, value of queryObj
      if escape
        value = dropSpecialCharacters value
      if _.isObject value
        value = escapeQueryStringValue JSON.stringify(value)
      queryString += "&#{key}=#{value}"

    return pathname + '?' + queryString[1..-1]

  haveAMatch: (arrayA, arrayB)->
    unless _.isArray(arrayA) and _.isArray(arrayB) then return false
    for valueA in arrayA
      for valueB in arrayB
        # Return true as soon as possible
        if valueA is valueB then return true
    return false

  objLength: (obj)-> Object.keys(obj)?.length

  expired: (timestamp, ttl)-> Date.now() - timestamp > ttl

  shortLang: (lang)-> lang?[0..1]

  # encodeURIComponent ignores !, ', (, ), and *
  # cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
  fixedEncodeURIComponent: (str)->
    encodeURIComponent(str).replace /[!'()*]/g, encodeCharacter

  pickOne: (obj)->
    key = Object.keys(obj)[0]
    if key? then return obj[key]

  isDataUrl: (str)-> /^data:image/.test str

  parseBooleanString: (booleanString, defaultVal = false)->
    if defaultVal is false
      booleanString is 'true'
    else
      booleanString isnt 'false'

  simpleDay: (date)->
    if date? then new Date(date).toISOString().split('T')[0]
    else new Date().toISOString().split('T')[0]

encodeCharacter = (c)-> '%' + c.charCodeAt(0).toString(16)

removeUndefined = (obj)->
  newObj = {}
  for key, value of obj
    if value? then newObj[key] = value
  return newObj

dropSpecialCharacters = (str)->
  str
  .replace /\s+/g, ' '
  .replace /(\?|\:)/g, ''

# Only escape values that are problematic in a query string:
# for the moment, only '?'
escapeQueryStringValue = (str)-> str.replace /\?/g, '%3F'

add = (a, b)-> a + b

objectWalker = (subObject, property)-> subObject?[property]

# Polyfill if needed
Date.now or= -> new Date().getTime()

# source: http://stackoverflow.com/questions/10527983/best-way-to-detect-mac-os-x-or-windows-computers-with-javascript-or-jquery
isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

ParseKeysValues = (queryObj)-> (param)->
  pairs = param.split '='
  [ key, value ] = pairs
  if key?.length > 0 and value?
    # Try to parse the value, allowing JSON strings values
    # like data={%22wdt:P50%22:[%22wd:Q535%22]}
    value = permissiveJsonParse decodeURIComponent(value)
    # If a number string was parsed into a number, make it a string again
    # so that the output stays predictible
    if _.isNumber value then value = value.toString()
    queryObj[key] = value

permissiveJsonParse = (input)->
  try JSON.parse input
  catch err then input
