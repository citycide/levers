'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const makeDir = require('make-dir')
const dotProp = require('dot-prop')
const appRoot = require('app-root-path')
const isPlainObject = require('is-plain-obj')

const empty = () => Object.create(null)

function levers (name, options) {
  options = Object.assign({}, options)

  let path = getFilePath(name, options)
  let getData = createGetter(path)
  let setData = createSetter(path)

  let store = Object.assign(empty(), options.defaults, getData())

  function get (key) {
    store = getData()
    return dotProp.get(store, key)
  }

  function getOr (key, defaultValue) {
    store = getData()
    return dotProp.get(store, key, defaultValue)
  }

  function set (key, value) {
    store = getData()
    dotProp.set(store, key, value)
    setData(store)
  }

  function merge (object) {
    store = getData()

    for (let k of Object.keys(object)) {
      dotProp.set(store, k, object[k])
    }

    setData(store)
  }

  function has (key) {
    store = getData()
    return dotProp.has(store, key)
  }

  function del (key) {
    store = getData()
    dotProp.delete(store, key)
    setData(store)
  }

  function clear () {
    store = empty()
    setData(store)
  }

  return {
    get: get,
    getOr,
    set: set,
    merge,
    has,
    del,
    clear,

    get size () {
      return Object.keys(store).length
    },

    get data () {
      return getData()
    },

    set data (content) {
      if (!isPlainObject(content)) return
      setData(content)
    },

    get path () {
      return path
    },

    * [Symbol.iterator] () {
      store = getData()
      for (let key of Object.keys(store)) {
        yield [key, store[key]]
      }
    }
  }
}

levers.exists = name => fs.existsSync(getFilePath(name))
levers.resolve = getFilePath

function getFilePath (name, options) {
  let fileName = path.basename(name, '.json') + '.json'

  if (options && options.dir) {
    return path.resolve(options.dir, fileName)
  }

  let pkgPath = path.resolve(`${appRoot}`, 'package.json')
  let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  let inHome = path.resolve.bind(null, os.homedir())

  if (process.platform === 'win32') {
    return inHome('AppData', 'Local', pkg.name, 'Data', fileName)
  }

  if (process.platform === 'darwin') {
    return inHome('Library', 'Application Support', pkg.name, fileName)
  }

  let root = process.env.XDG_DATA_HOME || inHome('.local', 'share')
  return path.resolve(root, pkg.name, fileName)
}

function createGetter (atPath) {
  return () => {
    try {
      let raw = fs.readFileSync(atPath, 'utf8')
      return Object.assign(empty(), JSON.parse(raw))
    } catch (err) {
      if (err.code === 'ENOENT') {
        makeDir.sync(path.dirname(atPath))
        return empty()
      }

      if (err.name === 'SyntaxError') {
        return empty()
      }

      throw err
    }
  }
}

function createSetter (atPath) {
  return data => {
    makeDir.sync(path.dirname(atPath))
    fs.writeFileSync(atPath, JSON.stringify(data, null, 2))
  }
}

module.exports = levers
