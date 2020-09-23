/* eslint-disable
    import/no-duplicates,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
import GroupViewsCommons from './group_views_commons'

const {
  GroupItemView
} = GroupViewsCommons

export default GroupItemView.extend({
  template: require('./templates/group_li'),
  className: 'groupLi',
  tagName: 'li',

  modelEvents: {
    // Using lazyRender instead of render allow to wait for group.mainUserStatus
    // to be ready (i.e. not to return 'none')
    change: 'lazyRender'
  },

  behaviors: {
    PreventDefault: {},
    SuccessCheck: {}
  }
})
