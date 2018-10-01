import async from '~/components/async'

// object key must match chunk name
export default {
  homepage: async('Homepage', () => import(/* webpackChunkName: "homepage" */'./homepage'))
}
