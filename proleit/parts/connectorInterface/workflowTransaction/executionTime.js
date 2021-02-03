'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

module.exports = function(element, group, workflowTransactionService, translate) {
  group.entries.push(entryFactory.checkbox(translate, {
    id: 'workflowTransactionExecutionTime_UseSystemTime',
    label: translate('Use System Time'),
    modelProperty: 'useSystemTime',
    get: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return { useSystemTime: workflowTransaction ? workflowTransaction.useClientJobTime : undefined };
    },
    set: function(element, values, node) {
      return workflowTransactionService.setWorkflowProperty(element, 'useClientJobTime', values.useSystemTime);
    },
    disabled: function(element, node, input) {
      return true;
    }
  }));

  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'workflowTransactionExecutionTime_CustomTime',
    label: translate('Custom Time'),
    modelProperty: 'customTime',
    description: translate('Start typing "${}" to create an expression'),

    getProperty: function(element, node) {
      return undefined;
    },
    setProperty: function(element, values, node) {
      return [];
    },
    validate: function(element, values, node) {
      return {};
    },
    disabled: function(element, node, input) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return !workflowTransaction || workflowTransaction.useClientJobTime === true;
    }
  }));
}
