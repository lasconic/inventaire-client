/* eslint-disable
    import/no-duplicates,
    prefer-arrow/prefer-arrow-functions,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
import { currentRoute } from 'lib/location'
const routeAllowlist = [
  'signup',
  'login',
  'login/reset-password'
]

export default function (e) {
  // Allow submit on singup and login to let password managers react to the submit event
  let needle
  if ((needle = currentRoute(), routeAllowlist.includes(needle))) { return }
  return e.preventDefault()
};
