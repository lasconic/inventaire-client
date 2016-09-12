__ = require '../root'

promises_ = __.require 'test', 'lib/promises'

should = require 'should'
sinon = require 'sinon'

global.dbs = {}
global._ = _ = require './utils_builder'

_.extend global,
  # /!\ level-test takes time to delete the previous instance
  # which might get some tests to timeout when run in watch mode
  LevelUp: require('level-test')({ mem: true })
  LevelJs: {}
  LevelMultiply: require 'level-multiply'
  Promise: require 'bluebird'
  localdb_: __.require 'lib', 'data/local_db'
  reportErr: _.noop

global.window = global

localCache = __.require 'lib', 'data/local_cache'

getOptions = ->
  spy = sinon.spy()
  options =
    name: _.uniqueId('fake_db_')
    remote:
      get: (ids)->
        spy()
        res = {}
        ids.forEach (id)-> res[id] = { label: "hello #{id}!" }
        return promises_.resolve(res)
    # parseData: (data)-> data
  return [options, spy]

describe 'Local Cache', ->
  describe 'env', ->
    it 'should find the lib', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      local.should.be.an.Object()
      done()

  describe 'get', ->
    it 'should accept one id or an Array ids', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      local.get('what').then.should.be.a.Function()
      local.get(['1','2','3']).then.should.be.a.Function()
      done()

    it 'should return a Promise', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      local.get.should.be.an.Function()
      local.get(['what']).then.should.be.a.Function()
      done()

    it 'should call remote.get ones', (done)->
      # console.time 'options'
      [opts, spy] = getOptions()
      # console.timeEnd 'options'
      # console.time 'LocalCache'
      local = localCache opts
      # console.timeEnd 'LocalCache'
      spy.callCount.should.equal 0
      # console.time 'get'
      local.get(['Atchoum','Joyeux','Simplet'])
      .then (res)->
        # console.timeEnd 'get'
        # console.time 'then'
        spy.callCount.should.equal 1
        # console.timeEnd 'then'
        done()
      .catch _.error.bind(_)

    it 'should not recall remote.get for the same ids', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      spy.callCount.should.equal 0
      local.get(['Hitchy', 'Scratchy'])
      .then (res)->
        spy.callCount.should.equal 1
        local.get(['Hitchy', 'Scratchy'])
        .then (res)->
          spy.callCount.should.equal 1
          done()
      .catch _.error.bind(_)

    it 'should recall remote.get for different ids', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      spy.callCount.should.equal 0
      local.get(['Melchior', 'Baltazar'])
      .then (res)->
        spy.callCount.should.equal 1
        local.get(['Gaspard', 'Kevin'])
        .then (res)->
          spy.callCount.should.equal 2
          done()
      .catch _.error.bind(_)

    it 'should return an indexed collection by default', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      local.get(['do', 're'])
      .then (res)->
        res.should.be.an.Object()
        _.objLength(res).should.equal 2
        res.do.label.should.equal "hello do!"
        res.re.label.should.equal "hello re!"
        local.get('stringinterface')
        .then (res2)->
          res2.should.be.an.Object()
          _.objLength(res2).should.equal 1
          res2.stringinterface.label.should.equal "hello stringinterface!"
          done()
      .catch _.error.bind(_)

    it 'should return a collection if requested in options', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      local.get(['mi', 'fa'], 'collection')
      .then (res)->
        res.should.be.an.Array()
        res.length.should.equal 2
        res[0].label.should.equal "hello mi!"
        res[1].label.should.equal "hello fa!"
        local.get('stringinterface', 'collection')
        .then (res2)->
          res2.should.be.an.Array()
          res2.length.should.equal 1
          res2[0].label.should.equal "hello stringinterface!"
          done()
      .catch _.error.bind(_)

    it 'should refresh when asked', (done)->
      [opts, spy] = getOptions()
      local = localCache opts
      spy.callCount.should.equal 0
      local.get(['sol', 'la'])
      .then (res)->
        spy.callCount.should.equal 1
        local.get(['sol', 'la'], 'index', true)
        .then (res)->
          spy.callCount.should.equal 2
          done()
      .catch _.error.bind(_)

