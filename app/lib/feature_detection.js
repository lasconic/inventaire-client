import testVideoInput from 'lib/has_video_input'
import testLocalStorage from 'lib/local_storage'
import { wiki, roadmap, git } from 'lib/urls'

export default function () {
  if (window.env === 'prod') { sayHi() }
  ISODatePolyFill()
  startsWithPolyFill()
  testFlexSupport()
  testLocalStorage()
  testVideoInput()
  setDebugSetting()
};

const sayHi = () => console.log(`\
,___,
[-.-]   I've been expecting you, Mr Bond
/)__)
-"--"-
Want to make Inventaire better? Jump in!
Wiki: ${wiki}
Design: ${roadmap}
Code: ${git}/inventaire
------\
`
)

const testFlexSupport = function () {
  // detect CSS display:flex support in JavaScript
  // taken from http://stackoverflow.com/questions/14386133/are-there-any-javascript-code-polyfill-available-that-enable-flexbox-2012-cs/14389903#14389903
  const detector = document.createElement('detect')
  detector.style.display = 'flex'
  if (detector.style.display !== 'flex') {
    return console.warn('Flex is not supported')
  }
}

// from https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Date/toISOString
const ISODatePolyFill = function () {
  if (Date.prototype.toISOString == null) {
    const pad = function (number) {
      if (number < 10) { return '0' + number }
      return number
    }

    // eslint-disable-next-line no-extend-native
    Date.prototype.toISOString = () => {
      return this.getUTCFullYear() +
        '-' + pad(this.getUTCMonth() + 1) +
        '-' + pad(this.getUTCDate()) +
        'T' + pad(this.getUTCHours()) +
        ':' + pad(this.getUTCMinutes()) +
        ':' + pad(this.getUTCSeconds()) +
        '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
        'Z'
    }
  }
}

// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
const startsWithPolyFill = function () {
  if (String.prototype.startsWith == null) {
    // eslint-disable-next-line no-extend-native
    String.prototype.startsWith = function (search, pos) {
      const start = !pos || (pos < 0) ? 0 : +pos
      return this.substr(start, search.length) === search
    }
  }
}

const setDebugSetting = function () {
  const persistantDebug = window.localStorageBool.get('debug')
  const queryStringDebug = window.location.search.split('debug=true').length > 1
  const hostnameDebug = window.location.hostname === 'localhost'
  if (persistantDebug || queryStringDebug || hostnameDebug) {
    console.log('debug enabled')
    CONFIG.debug = true
  } else {
    console.warn(`'logs are disabled.
Activate logs by entering this command and reloading the page:
localStorage.setItem('debug', true)
Or activate logs once by adding debug=true as a query parameter`)
  }
}
