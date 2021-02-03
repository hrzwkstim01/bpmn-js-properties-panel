'use strict';

var addExecutionTime = require('../../parts/connectorInterface/workflowTransaction/executionTime');
var addObjectComment = require('../../parts/connectorInterface/workflowTransaction/objectComment');
var addSourceLink = require('../../parts/connectorInterface/workflowTransaction/sourceLink');
var addStatusCode = require('../../parts/connectorInterface/workflowTransaction/statusCode');
var addUser = require('../../parts/connectorInterface/workflowTransaction/user');
var addWorkflowTransaction = require('../../parts/connectorInterface/workflowTransaction/workflowTransaction');

function createWorkflowTransactionGroup(element, tab, workflowTransactionService, translate) {
  var workflowTransaction = workflowTransactionService.getWorkflowTransaction(element);
  var group = {
    id: 'connector-workflow-transaction',
    label: translate('Workflow Transaction') + ' - ' + workflowTransaction.sTransactionLink + ' - ' + translate('Others'),
    entries: []
  };
  addSourceLink(element, group, workflowTransactionService, translate);
  addStatusCode(element, group, workflowTransactionService, translate);
  addExecutionTime(element, group, workflowTransactionService, translate);
  addUser(element, group, workflowTransactionService, translate);
  addObjectComment(element, group, workflowTransactionService, translate);
  tab.groups.push(group);
}

module.exports = function WorkflowTransactionProvider(element, tab, detailGroupIndex, workflowTransactionService, translate) {
  addWorkflowTransaction(element, tab.groups[detailGroupIndex], workflowTransactionService, translate);
  if (workflowTransactionService.getWorkflowTransaction(element)) {
    createWorkflowTransactionGroup(element, tab, workflowTransactionService, translate);
  }
}
