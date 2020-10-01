const alwaysKeep = () => true

const redirectTest = section => allowRedirectPersistantQuery.includes(section)

const allowRedirectPersistantQuery = [
  'signup',
  'login'
]

export default {
  authors: alwaysKeep,
  debug: alwaysKeep,
  descriptions: alwaysKeep,
  editions: alwaysKeep,
  lang: alwaysKeep,
  large: alwaysKeep,
  redirect: redirectTest,
}
