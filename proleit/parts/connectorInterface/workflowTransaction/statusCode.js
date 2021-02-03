'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

module.exports = function(element, group, workflowTransactionService, translate) {
  var selectOptions = [
    { value: 0, name: translate('0 = initial')},
    { value: 1, name: translate('1 = immediate execution')},
    { value: 3, name: translate('3 = low priority execution')}
  ];

  group.entries.push(entryFactory.selectBox(translate, {
    id: 'workflowTransactionStatusCode',
    label: translate('Status Code'),
    selectOptions,
    modelProperty: 'statusCode',

    get: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return { statusCode: workflowTransaction ? workflowTransaction.nCode : undefined };
    },
    set: function(element, values, node) {
      return workflowTransactionService.setWorkflowProperty(element, 'nCode', Number(values.statusCode));
    }
  }));
}
