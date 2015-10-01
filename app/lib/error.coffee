error_ =
  new: (message, context)->
    err = new Error message
    err.context = context
    return err

  newWithSelector: (message, selector, context)->
    err = new Error message
    err.selector = selector
    err.context = context
    return err

  complete: (selector, err)->
    err.selector = selector
    return err

# /!\ throws the error while error_.complete only returns it.
# this difference is justified by the different use of both functions:
error_.Complete = (selector)->
  throw error_.complete.bind null, selector

module.exports = error_
