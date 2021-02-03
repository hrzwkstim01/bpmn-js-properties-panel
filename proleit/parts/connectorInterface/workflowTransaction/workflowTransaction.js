'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

module.exports = function(element, group, workflowTransactionService, translate) {
  var selectOptions = [
    { value: '' },
    { value: '[Tx8300]', name: '[Tx8300] - Add material' }
  ];
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'workflowTransactionLink',
    label: translate('Workflow Transaction*'),
    selectOptions: selectOptions,
    modelProperty: 'transactionLink',

    get: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return { transactionLink: workflowTransaction ? workflowTransaction.sTransactionLink : '' };
    },
    set: function(element, values, node) {
      return workflowTransactionService.setWorkflowTransactionLink(element, values.transactionLink);
    }
  }));
}
