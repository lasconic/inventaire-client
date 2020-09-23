/* eslint-disable
    import/no-duplicates,
    no-undef,
    no-var,
    prefer-arrow/prefer-arrow-functions,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
import { buildPath } from 'lib/location'

export default {
  // lang: the user's lang
  // original lang: the entity's original lang
  wikipedia (sitelinks, lang, originalLang) {
    // Wikimedia Commons is confusingly using a sitelink key that makes it look like
    // a Wikipedia sitelink - commonswiki - thus the need to omit it before proceeding
    // https://www.wikidata.org/wiki/Help:Sitelinks#Linking_to_Wikimedia_site_pages
    sitelinks = _.omit(sitelinks, 'commonswiki')
    return getBestWikiProjectInfo({
      sitelinks,
      projectBaseName: 'wiki',
      projectRoot: 'wikipedia',
      lang,
      originalLang
    })
  },

  wikisource (sitelinks, lang, originalLang) {
    const wsData = getBestWikiProjectInfo({
      sitelinks,
      projectBaseName: 'wikisource',
      projectRoot: 'wikisource',
      lang,
      originalLang
    })
    if (wsData != null) {
      wsData.epub = getEpubLink(wsData)
      return wsData
    }
  }
}

var getBestWikiProjectInfo = function (params) {
  const { sitelinks, projectBaseName, projectRoot, lang, originalLang } = params
  if (sitelinks == null) { return }

  const getTitleForLang = Lang => getWikiProjectTitle(sitelinks, projectBaseName, Lang)

  let [ title, langCode ] = Array.from([ getTitleForLang(lang), lang ])

  if ((originalLang != null) && (title == null)) {
    [ title, langCode ] = Array.from([ getTitleForLang(originalLang), originalLang ])
  }

  if (title == null) {
    [ title, langCode ] = Array.from([ getTitleForLang('en'), 'en' ])
  }

  if (title == null) {
    [ title, langCode ] = Array.from(pickOneWikiProjectTitle(sitelinks, projectBaseName))
  }

  if ((title != null) && langCode) {
    title = _.fixedEncodeURIComponent(title)
    const url = `https://${langCode}.${projectRoot}.org/wiki/${title}`
    return { title, lang: langCode, url }
  }
}

var getWikiProjectTitle = (sitelinks, projectBaseName, lang) => sitelinks[`${lang}${projectBaseName}`]

var pickOneWikiProjectTitle = function (sitelinks, projectBaseName) {
  for (const projectName in sitelinks) {
    const value = sitelinks[projectName]
    const match = projectName.split(projectBaseName)
    // ex: 'lawikisource'.split 'wikisource' == ['la', '']
    // The second part needs to be an empty string to avoid confusing
    // a sitelink like : for dewiki
    if ((match.length === 2) && (match[1] === '')) {
      const langCode = match[0]
      // Giving priority to 2 letters code languages
      if (langCode.length === 2) { return [ value, langCode ] }
    }
  }

  return []
}

var getEpubLink = function (wikisourceData) {
  const { title, lang } = wikisourceData
  return buildPath('http://wsexport.wmflabs.org/tool/book.php', {
    lang,
    format: 'epub',
    page: title
  }
  )
}
