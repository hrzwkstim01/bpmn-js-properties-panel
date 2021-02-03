'use strict';

var connectorService = require('./connectorService');

function resetConnector(element, commands) {
  connectorService.setConnectorId(element, undefined, commands);
  connectorService.deleteInputOutput(element, commands);
}

function setConnectorInterface(element, bpmnFactory, commands, urlValue) {
  connectorService.setConnectorId(element, 'http-connector', commands);
  var inputOutput = connectorService.createInputOutput(element, bpmnFactory, commands);
  var inputParameterHeader = connectorService.createInputParameter(
    element, bpmnFactory, commands, { name: 'headers' }, inputOutput);
  connectorService.createInputParameterMap(
    element, bpmnFactory, commands, inputParameterHeader, undefined);
  connectorService.createInputParameter(
    element, bpmnFactory, commands, { name: 'url', value: urlValue }, inputOutput);
}

module.exports = function ConnectorInterfaceService(bpmnFactory, translate) {
  var service = {};

  var plantitBaseInterface = {
    name: translate('PlantiT base Service'),
    url: 'https://willbereplacedatruntime.invalid/',
    value: 'INTERFACE_PLANTIT_BASE',
  };
  var workflowTransactionInterface = {
    name: translate('Workflow Transaktion'),
    url: 'https://willbereplacedatruntime.workflow.invalid/',
    value: 'INTERFACE_WORKFLOW_TRANSACTION'
  };

  service.getAllInterfaceTypes = () => [plantitBaseInterface, workflowTransactionInterface];

  service.getInterfaceType = (element) => {
    var connectorId = connectorService.getConnectorId(element);
    if (connectorId !== 'http-connector') {
      return undefined;
    }
    var urlParameter = connectorService.getInputParameter(element, 'url');
    if (urlParameter && urlParameter.value === plantitBaseInterface.url) {
      return plantitBaseInterface;
    }
    if (urlParameter && urlParameter.value === workflowTransactionInterface.url) {
      return workflowTransactionInterface;
    }
    return undefined;
  };

  service.setInterfaceType = (element, interfaceTypeValue) => {
    var commands = [];
    var currentInterface = service.getInterfaceType(element);
    if (currentInterface && currentInterface.value === interfaceTypeValue) {
      return commands;
    }
    switch (interfaceTypeValue) {
      case plantitBaseInterface.value:
        setConnectorInterface(element, bpmnFactory, commands, plantitBaseInterface.url);
        break;
      case workflowTransactionInterface.value:
        setConnectorInterface(element, bpmnFactory, commands, workflowTransactionInterface.url);
        break;
      default:
        resetConnector(element, commands);
        break;
    }
    return commands;
  };

  return service;
}
