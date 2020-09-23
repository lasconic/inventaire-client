/* eslint-disable
    import/no-duplicates,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
import wdLang from 'wikidata-lang'
import languages from './languages_data'

const regionify = {}

for (const lang in languages) {
  const obj = languages[lang]
  obj.lang = lang
  obj.native = wdLang.byCode[lang].native
  regionify[lang] = obj.defaultRegion
}

const langs = Object.keys(languages)

export { languages, langs, regionify }
