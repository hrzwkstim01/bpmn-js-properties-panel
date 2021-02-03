'use strict';

var connectorService = require('./connectorService');
var objectConverterService = require('./objectConverterService');
var forEach = require('lodash/forEach');

var ProleitRequestHeader = require('../const/header').ProleitRequestHeader;
var DefaultSourceLink = require('../const/workflowTransaction').DefaultSourceLink;
var DefaultWorkflowTransaction = require('../const/workflowTransaction').DefaultWorkflowTransaction;
var SchemaWorkflowTransaction = require('../const/workflowTransaction').SchemaWorkflowTransaction;

const WorkflowHeader = {
  [ProleitRequestHeader.module]: 'PITWFCLASSIC',
  [ProleitRequestHeader.service]: 'ExecutiveService',
  [ProleitRequestHeader.path]: '/api/v1/Jobs/DispatchedJobs',
  [ProleitRequestHeader.scopes]: 'WorkflowExecutive',
};

const sourceLinkScriptValue = 'sourceLink';
const sourceLinkUIValue = '"' + DefaultWorkflowTransaction.sSourceLink + '"';
const sourceLinkScriptKeyValue = '"sSourceLink":' + sourceLinkScriptValue;
const sourceLinkUIKeyValue = '"sSourceLink":' + sourceLinkUIValue;

function getPayloadScriptValue(element) {
  var payloadParameter = connectorService.getInputParameter(element, 'payload');
  if (!payloadParameter || !payloadParameter.definition || !payloadParameter.definition.value) {
    return undefined;
  } else {
    return payloadParameter.definition.value;
  }
}

function getPayloadFromScript(script) {
  if (!script) { return undefined; }
  var payloadMatch = script.match(/(var payload = (\{.*?\});)/s);
  if (!payloadMatch || payloadMatch.length < 3) { return undefined; }

  var payloadValue = payloadMatch[2].replace(sourceLinkScriptKeyValue, sourceLinkUIKeyValue);
  return objectConverterService.resolveValue(payloadValue, 'object', true);
}

function initPayload(transactionLink) {
  var payload = JSON.stringify({
    ...DefaultWorkflowTransaction,
    sTransactionLink: transactionLink
  });
  payload = payload.replace(sourceLinkUIValue, sourceLinkScriptValue);
  return `
${DefaultSourceLink}
var payload = ${payload};
JSON.stringify(payload);
  `;
}

module.exports = function ConnectorWorkflowTransactionService(bpmnFactory) {
  var service = {};

  service.getWorkflowTransaction = (element) => {
    var scriptValue = getPayloadScriptValue(element);
    return getPayloadFromScript(scriptValue);
  };

  service.setWorkflowTransactionLink = (element, transactionLink) => {
    var commands = [];
    forEach(WorkflowHeader, function(value, key) {
      connectorService.createOrUpdateInputParameterMapEntry(element, bpmnFactory, commands, 'headers',
        { key, value: transactionLink ? value : undefined });
    });
    connectorService.createOrUpdateInputParameter(element, bpmnFactory, commands, {
      name: 'method',
      value: transactionLink ? 'POST' : undefined
    });
    var payloadValue = initPayload(transactionLink);
    connectorService.createInputParameterScript(element, bpmnFactory, commands, 'payload', payloadValue);
    return commands;
  };

  service.setWorkflowProperty = (element, key, value) => {
    var commands = [];
    var script = getPayloadScriptValue(element);
    var payload = getPayloadFromScript(script);
    
    if (!payload) {
      return commands;
    }
    payload[key] = value;
    var payloadString = objectConverterService.compressValue(payload, SchemaWorkflowTransaction, true);
    payloadString = payloadString.replace(sourceLinkUIKeyValue, sourceLinkScriptKeyValue);
    script = script.replace(/(var payload = (\{.*?\});)/s, `var payload = ${payloadString};`);
    connectorService.createInputParameterScript(element, bpmnFactory, commands, 'payload', script)
    return commands;
  };

  return service;

}
