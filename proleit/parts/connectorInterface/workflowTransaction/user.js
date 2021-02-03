'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');
var DefaultWorkflowTransaction = require('../../../const/workflowTransaction').DefaultWorkflowTransaction;
var ObjectConverterService = require('../../../service/objectConverterService');

module.exports = function(element, group, workflowTransactionService, translate) {
  group.entries.push(entryFactory.checkbox(translate, {
    id: 'workflowTransactionUser_UseTechnicalUser',
    label: translate('Use Technical User'),
    modelProperty: 'useTechnicalUser',
    get: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return { useTechnicalUser: workflowTransaction ?
        workflowTransaction.sUser === DefaultWorkflowTransaction.sUser :
        undefined
      };
    },
    set: function(element, values, node) {
      var user = values.useTechnicalUser ? DefaultWorkflowTransaction.sUser : '';
      return workflowTransactionService.setWorkflowProperty(element, 'sUser', user);
    }
  }));

  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'workflowTransactionUser_CustomUser',
    label: translate('Custom User'),
    modelProperty: 'customUser',
    description: translate('Start typing "${}" to create an expression'),

    getProperty: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return (!workflowTransaction || workflowTransaction.sUser === DefaultWorkflowTransaction.sUser) ?
        '' : workflowTransaction.sUser;
    },
    setProperty: function(element, values, node) {
      return workflowTransactionService.setWorkflowProperty(element, 'sUser', values.customUser);
    },
    validate: function(element, values, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      if (workflowTransaction && workflowTransaction.sUser === DefaultWorkflowTransaction.sUser) {
        return {};
      }
      if (!ObjectConverterService.isExpression(values.customUser)) {
        return { customUser: translate('Added value must be an expression')};
      } else {
        return {};
      }
    },
    disabled: function(element, node, input) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return !workflowTransaction || workflowTransaction.sUser === DefaultWorkflowTransaction.sUser;
    }
  }));
}
