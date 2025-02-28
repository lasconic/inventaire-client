import folders from '../lib/folders.js'
import TransactionPreview from './transaction_preview.js'
import NoTransaction from './no_transaction.js'
import transactionsListTemplate from './templates/transactions_list.hbs'
import '../scss/transactions_list.scss'

export default Marionette.CollectionView.extend({
  template: transactionsListTemplate,
  className: 'transactionList',
  childViewContainer: '.transactions',
  childView: TransactionPreview,
  emptyView: NoTransaction,
  initialize () {
    this.folder = this.options.folder
    this.viewFilter = folders[this.folder].viewFilter
    this.listenTo(app.vent, 'transactions:folder:change', this.render.bind(this))
  },

  serializeData () {
    const attrs = {}
    attrs[this.folder] = true
    return attrs
  }
})
