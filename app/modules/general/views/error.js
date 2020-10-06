import { isOpenedOutside } from 'lib/utils'
import errorTemplate from './templates/error.hbs'

export default Marionette.LayoutView.extend({
  id: 'error',
  template: errorTemplate,
  behaviors: {
    PreventDefault: {}
  },

  serializeData () { return this.options },

  events: {
    'click .button': 'buttonAction'
  },

  ui: {
    errorBox: '.errorBox'
  },

  buttonAction (e) {
    if (!isOpenedOutside(e)) {
      const { buttonAction } = this.options.redirection
      if (_.isFunction(buttonAction)) buttonAction()
    }
  },

  onShow () {
    app.execute('background:cover')
    this.ui.errorBox.fadeIn()
  }
})
