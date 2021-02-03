'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');
var DefaultWorkflowTransaction = require('../../../const/workflowTransaction').DefaultWorkflowTransaction;
var ObjectConverterService = require('../../../service/objectConverterService');

module.exports = function(element, group, workflowTransactionService, translate) {
  group.entries.push(entryFactory.checkbox(translate, {
    id: 'workflowTransactionSourceLink_UseSourceLink',
    label: translate('Use Source Link'),
    modelProperty: 'useSourceLink',
    get: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return { useSourceLink: workflowTransaction ?
        workflowTransaction.sSourceLink === DefaultWorkflowTransaction.sSourceLink :
        undefined
      };
    },
    set: function(element, values, node) {
      var sourceLink = values.useSourceLink ? DefaultWorkflowTransaction.sSourceLink : '';
      return workflowTransactionService.setWorkflowProperty(element, 'sSourceLink', sourceLink);
    }
  }));

  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'workflowTransactionSourceLink_CustomSourceLink',
    label: translate('Custom Source Link (L-Job)'),
    modelProperty: 'customSourceLink',
    description: translate('Start typing "${}" to create an expression'),

    getProperty: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return (!workflowTransaction || workflowTransaction.sSourceLink === DefaultWorkflowTransaction.sSourceLink) ?
        '' : workflowTransaction.sSourceLink;
    },
    setProperty: function(element, values, node) {
      return workflowTransactionService.setWorkflowProperty(element, 'sSourceLink', values.customSourceLink);
    },
    validate: function(element, values, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      if (workflowTransaction && workflowTransaction.sSourceLink === DefaultWorkflowTransaction.sSourceLink) {
        return {}
      }
      if (!values.customSourceLink) {
        return { customSourceLink: translate('Must provide a value') };
      }
      if (!ObjectConverterService.isExpression(values.customSourceLink)) {
        return { customSourceLink: translate('Added value must be an expression')};
      } else {
        return {};
      }
    },
    disabled: function(element, node, input) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return !workflowTransaction || workflowTransaction.sSourceLink === DefaultWorkflowTransaction.sSourceLink;
    }
  }));
}
