const Parameter = require('./parameter')

class ParameterRegistry {
  constructor() {
    this._parametersByTypeName = new Map()
    this._parametersByCaptureGroupRegexp = new Map()
    this._parametersByConstructorName = new Map()

    const INTEGER_REGEXPS = [/-?\d+/, /\d+/]
    const FLOAT_REGEXPS = [/-?\d*\.?\d+/]

    this.addParameter(new Parameter('int', Number, INTEGER_REGEXPS, parseInt))
    this.addParameter(new Parameter('float', Number, FLOAT_REGEXPS, parseFloat))
  }

  get parameters() {
    return this._parametersByTypeName.values()
  }

  lookupByType(type) {
    if (typeof type === 'function') {
      return this.lookupByFunction(type)
    } else if (typeof type === 'string') {
      return this.lookupByTypeName(type)
    } else {
      throw new Error(`Type must be string or function, but was ${type} of type ${typeof type}`)
    }
  }

  lookupByFunction(fn) {
    if (fn.name) {
      const prefix = fn.name[0]
      const looksLikeConstructor = prefix.toUpperCase() === prefix

      let parameter
      if (looksLikeConstructor) {
        parameter = this._parametersByConstructorName.get(fn.name)
      }
      if (!parameter) {
        const factory = s => {
          if (looksLikeConstructor) {
            return new fn(s)
          } else {
            return fn(s)
          }
        }
        return this.createAnonymousLookup(factory)
      } else {
        return parameter
      }
    } else {
      return this.createAnonymousLookup(fn)
    }
  }

  lookupByTypeName(typeName) {
    return this._parametersByTypeName.get(typeName)
  }

  lookupByCaptureGroupRegexp(captureGroupRegexp) {
    return this._parametersByCaptureGroupRegexp.get(captureGroupRegexp)
  }

  createAnonymousLookup(fn) {
    return new Parameter(null, null, [".+"], fn)
  }

  addParameter(parameter) {
    this._parametersByConstructorName.set(parameter.constructorFunction.name, parameter)

    this._parametersByTypeName.set(parameter.typeName, parameter)

    for (let captureGroupRegexp of parameter.captureGroupRegexps) {
      this._parametersByCaptureGroupRegexp.set(captureGroupRegexp, parameter)
    }
  }
}

module.exports = ParameterRegistry
