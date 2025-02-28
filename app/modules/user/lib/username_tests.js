import preq from '#lib/preq'
import forms_ from '#general/lib/forms'
import { Username } from '#lib/regex'
let username_

export default username_ = {
  pass (username, selector) {
    return forms_.pass({
      value: username,
      tests: usernameTests,
      selector
    })
  },

  verifyAvailability (username, selector) {
    return preq.get(app.API.auth.usernameAvailability(username))
    .catch(err => {
      err.selector = selector
      throw err
    })
  }
}

username_.verifyUsername = async (username, selector) => {
  username_.pass(username, selector)
  await username_.verifyAvailability(username, selector)
}

const usernameTests = {
  'username should be 2 characters minimum' (username) { return username.length < 2 },
  'username should be 20 characters maximum' (username) { return username.length > 20 },
  "username can't contain space" (username) { return /\s/.test(username) },
  'username can only contain letters, figures or _' (username) { return !Username.test(username) }
}
