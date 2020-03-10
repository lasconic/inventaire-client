leven = require 'leven'

module.exports = (data)->
  { isbn, authors } = data
  # the window.ISBN lib is made available by the isbn2 asset that
  # should have be fetched by app/modules/inventory/views/add/import
  if isbn? and not window.ISBN.parse(isbn)?
    # Prevent accepting non-ISBN identifiers in place of ISBNs
    delete data.isbn

  if authors?
    data.authors = deduplicateAuthors authors

  return data

deduplicateAuthors = (authors)->
  return authors
  # Prevent names containing comma to pass as they will later be interpretted
  # as several names
  .filter containsNoComma
  .filter isFirstOccurence(authors)

containsNoComma = (str)-> str? and not /,/.test(str)

isFirstOccurence = (array)-> (str, index)->
  noramlizedStr = normalize str
  for previousStr in array[0...index]
    if leven(noramlizedStr, normalize(previousStr)) < 3 then return false
  return true

normalize = (str)->
  str
  .trim()
  .normalize()
  .toLowerCase()
  # Remove standalone initials
  .replace /\s\w{1}\.?\s/, ' '
  .replace /\W/g, ''
  .split ''
  # Sort letters to detect inverted names
  .sort (a, b)-> a.charCodeAt(0) - b.charCodeAt(0)
  .join ''
