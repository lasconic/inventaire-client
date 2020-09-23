/* eslint-disable
    import/no-duplicates,
    no-undef,
    no-unused-expressions,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
import should from 'should'
import __ from '../root'

const { parseQuery, buildPath } = __.require('lib', 'location')

describe('location utils', () => {
  const queries = {
    good: 'category=book&text=whatever&claim=youknowhat&answer=imhappy',
    goodToo: '?category=book&text=whatever&claim=youknowhat&answer=imhappy',
    goodEncoded: 'label=ench%C3%A2nt%C3%A9',
    uncompleteButGood: '?category=book&text=&claim=&answer=imhappy',
    goodWithObject: 'action=man&data={"a":["abc",2]}',
    goodWithEncodedObject: 'action=man&data={%22wdt:P50%22:[%22wd:Q535%22]}'
  }

  describe('parseQuery', () => {
    it('should return an object', done => {
      parseQuery(queries.good).should.be.an.Object()
      parseQuery(queries.goodToo).should.be.an.Object()
      parseQuery(queries.uncompleteButGood).should.be.an.Object()
      parseQuery().should.be.an.Object()
      parseQuery(null).should.be.an.Object()
      return done()
    })

    it("should forgive and forget the '?' before queries", done => {
      queries.goodToo[0].should.equal('?')
      const queryObj = parseQuery(queries.goodToo)
      for (const k in queryObj) {
        const v = queryObj[k]
        k[0].should.not.equal('?')
      }
      _.isEqual(parseQuery(queries.goodToo), parseQuery(queries.good)).should.be.true
      return done()
    })

    it('should decode encoded strings', done => {
      const queryObj = parseQuery(queries.goodEncoded)
      queryObj.should.deepEqual({ label: 'enchânté' })
      return done()
    })

    it('should parse JSON strings', done => {
      const queryObj = parseQuery(queries.goodWithObject)
      queryObj.should.deepEqual({ action: 'man', data: { a: [ 'abc', 2 ] } })
      return done()
    })

    return it('should parse and decode encoded JSON strings', done => {
      const queryObj = parseQuery(queries.goodWithEncodedObject)
      queryObj.should.deepEqual({ action: 'man', data: { 'wdt:P50': [ 'wd:Q535' ] } })
      return done()
    })
  })

  return describe('buildPath', () => {
    it('should return a string with parameters', done => {
      const path = buildPath('/api', { action: 'man' })
      path.should.be.a.String()
      path.should.equal('/api?action=man')
      return done()
    })

    it('should not add empty parameters', done => {
      const path = buildPath('/api', { action: 'man', boudu: null })
      path.should.equal('/api?action=man')
      return done()
    })

    it('should stringify object value', done => {
      const path = buildPath('/api', { action: 'man', data: { a: [ 'abc', 2 ] } })
      path.should.equal('/api?action=man&data={"a":["abc",2]}')
      return done()
    })

    return it('should URI encode object values problematic query string characters', done => {
      const data = { a: 'some string with ?!MM%** problematic characters' }
      const path = buildPath('/api', { data })
      path.should.equal('/api?data={"a":"some string with %3F!MM%** problematic characters"}')
      return done()
    })
  })
})
