'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');
var ObjectConverterService = require('../../../service/objectConverterService');

module.exports = function(element, group, workflowTransactionService, translate) {
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'workflowTransactionObjectComment',
    label: translate('Object Comment'),
    modelProperty: 'objectComment',
    description: translate('Start typing "${}" to create an expression'),

    getProperty: function(element, node) {
      var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
      return (!workflowTransaction) ?
        '' : workflowTransaction.sInfo;
    },
    setProperty: function(element, values, node) {
      return workflowTransactionService.setWorkflowProperty(element, 'sInfo', values.objectComment);
    },
    validate: function(element, values, node) {
      if (!!values.objectComment && !ObjectConverterService.isExpression(values.objectComment)) {
        return { objectComment: translate('Added value must be an expression')};
      } else {
        return {};
      }
    }
  }));
}
