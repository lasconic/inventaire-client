// add name => creates group
// invite friends
// invite by email
import log_ from '#lib/loggers'
import createGroupLayoutTemplate from './templates/create_group_layout.hbs'
import { GroupLayoutView } from './group_views_commons.js'
import forms_ from '#general/lib/forms'
import groups_ from '../lib/groups.js'
import groupFormData from '../lib/group_form_data.js'
import GroupUrl from '../lib/group_url.js'
import '../scss/create_groupe_layout.scss'
import AlertBox from '#behaviors/alert_box'
import ElasticTextarea from '#behaviors/elastic_textarea'
import SuccessCheck from '#behaviors/success_check'
import Toggler from '#behaviors/toggler'

const {
  ui: groupUrlUi,
  events: groupUrlEvents,
  LazyUpdateUrl
} = GroupUrl

export default GroupLayoutView.extend({
  id: 'createGroupLayout',
  template: createGroupLayoutTemplate,
  tagName: 'form',
  behaviors: {
    AlertBox,
    ElasticTextarea,
    SuccessCheck,
    Toggler,
  },

  regions: {
    invite: '#invite'
  },

  ui: _.extend({}, groupUrlUi, {
    nameField: '#nameField',
    description: '#description',
    searchabilityToggler: '#searchabilityToggler',
    searchabilityWarning: '.searchability .warning',
    opennessToggler: '#opennessToggler',
    opennessWarning: '.openness .warning'
  }),

  initialize () {
    this._lazyUpdateUrl = LazyUpdateUrl(this)
  },

  onRender () { app.execute('modal:open', 'medium') },

  // Allows to define @_lazyUpdateUrl after events binding
  lazyUpdateUrl () { this._lazyUpdateUrl() },

  events: _.extend({}, groupUrlEvents, {
    'click #createGroup': 'createGroup',
    'change #searchabilityToggler': 'toggleSearchabilityWarning',
    'change #opennessToggler': 'toggleOpennessWarning'
  }),

  serializeData () {
    return {
      description: groupFormData.description(),
      searchability: groupFormData.searchability(),
      openness: groupFormData.openness()
    }
  },

  toggleSearchabilityWarning () {
    this.ui.searchabilityWarning.slideToggle()
  },

  toggleOpennessWarning () {
    this.ui.opennessWarning.slideToggle()
  },

  async createGroup (e) {
    const name = this.ui.nameField.val()
    const description = this.ui.description.val()

    const data = {
      name,
      description,
      searchable: this.ui.searchabilityToggler[0].checked,
      open: this.ui.opennessToggler[0].checked
    }

    log_.info(data, 'group data')

    try {
      groups_.validateName(name, '#nameField')
      groups_.validateDescription(description, '#description')
      const model = await groups_.createGroup(data)
      app.execute('show:group:board', model)
      app.execute('modal:close')
    } catch (err) {
      forms_.catchAlert(this, err)
    }
  }
})
