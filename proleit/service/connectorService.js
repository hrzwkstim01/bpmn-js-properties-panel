'use strict';

var ModelUtil = require('bpmn-js/lib/util/ModelUtil'),
    getBusinessObject = ModelUtil.getBusinessObject;

var cmdHelper = require('../../lib/helper/CmdHelper'),
    elementHelper = require('../../lib/helper/ElementHelper'),
    InputOutputHelper = require('../../lib/helper/InputOutputHelper');


function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

var ConnectorService = {};

module.exports = ConnectorService;

ConnectorService.getConnector = function(element) {
  var businessObject = getBusinessObject(element);
  return InputOutputHelper.getConnector(businessObject);
}

ConnectorService.getConnectorId = function(element) {
  var connector = ConnectorService.getConnector(element);
  return connector && connector.get('connectorId');
}

ConnectorService.setConnectorId = function(element, connectorId, commands) {
  var connector = ConnectorService.getConnector(element);
  commands.push(cmdHelper.updateBusinessObject(element, connector, { connectorId }));
  return connectorId;
}


ConnectorService.getInputOutput = function(element) {
  return InputOutputHelper.getInputOutput(element, true);
}

ConnectorService.createInputOutput = function(element, bpmnFactory, commands) {
  var connector = ConnectorService.getConnector(element);
  var inputOutput = createElement('camunda:InputOutput', connector, bpmnFactory, {
    inputParameters: [],
    outputParameters: []
  });
  commands.push(cmdHelper.updateBusinessObject(element, connector, { inputOutput }));
  return inputOutput;
}

ConnectorService.deleteInputOutput = function(element, commands) {
  var connector = ConnectorService.getConnector(element);
  commands.push(cmdHelper.updateBusinessObject(element, connector, { inputOutput: undefined }));
}


ConnectorService.getInputParameter = function(element, name, inputOutput = ConnectorService.getInputOutput(element)) {
  if (!inputOutput) {
    return undefined;
  }
  var inputParams = inputOutput.get('inputParameters');
  return inputParams.find(input => input.name && input.name == name);
}

ConnectorService.createInputParameter = function(element, bpmnFactory, commands, properties, inputOutput = ConnectorService.getInputOutput(element)) {
  if (!inputOutput) {
    return undefined;
  }
  var inputParameter = createElement('camunda:InputParameter', inputOutput, bpmnFactory, properties);
  commands.push(cmdHelper.addElementsTolist(element, inputOutput, 'inputParameters', [inputParameter]));
  return inputParameter;
}

ConnectorService.createOrUpdateInputParameter = function(element, bpmnFactory, commands, properties) {
  var parameter = ConnectorService.getInputParameter(element, properties.name);
  if (!parameter) {
    ConnectorService.createInputParameter(element, bpmnFactory, commands, properties);
  } else {
    commands.push(cmdHelper.updateBusinessObject(element, parameter, properties));
  }
  return parameter;
}


ConnectorService.createInputParameterMap = function(element, bpmnFactory, commands, inputParameter, properties) {
  if (typeof inputParameter === 'string') {
    inputParameter = ConnectorService.getInputParameter(element, inputParameter);
  }
  var inputParameterMap = createElement('camunda:Map', inputParameter, bpmnFactory, properties);
  commands.push(cmdHelper.updateBusinessObject(element, inputParameter, { definition: inputParameterMap }));
  return inputParameterMap;
}

ConnectorService.getInputParameterMapEntry = function(element, mapName, entryName = undefined) {
  var inputParameter = ConnectorService.getInputParameter(element, mapName);
  if (!inputParameter || !inputParameter.definition || !inputParameter.definition.entries) {
    return undefined;
  }
  if (!!entryName) {
    return inputParameter.definition.entries.find(entry => entry.key == entryName);
  } else {
    return inputParameter.definition.entries;
  }
}

ConnectorService.createInputParameterMapEntry = function(element, bpmnFactory, commands, mapName, properties) {
  var inputParameter = ConnectorService.getInputParameter(element, mapName);
  if (!inputParameter) {
    return undefined;
  }
  var entry = createElement('camunda:Entry', inputParameter, bpmnFactory, properties);
  commands.push(cmdHelper.addElementsTolist(element, inputParameter.definition, 'entries', [entry]));
}

ConnectorService.createOrUpdateInputParameterMapEntry = function(element, bpmnFactory, commands, mapName, properties) {
  var entry = ConnectorService.getInputParameterMapEntry(element, mapName, properties.key);
  if (!entry) {
    ConnectorService.createInputParameterMapEntry(element, bpmnFactory, commands, mapName, properties);
  } else {
    commands.push(cmdHelper.updateBusinessObject(element, entry, properties));
  }
  return entry;
}

ConnectorService.deleteInputParameterMapEntryByName = function(element, commands, mapName, entryName = undefined) {
  var inputParameterMap = ConnectorService.getInputParameter(element, mapName);
  var entriesToRemove = inputParameterMap.definition.entries;
  if (!!entryName) {
    entriesToRemove = entriesToRemove.filter(entry => entry.key == entryName);
  }
  commands.push(cmdHelper.removeElementsFromList(element, inputParameterMap.definition, 'entries', null, entriesToRemove));
}

ConnectorService.deleteInputParameterMapEntry = function(element, commands, mapName, entry) {
  var inputParameterMap = ConnectorService.getInputParameter(element, mapName);
  commands.push(cmdHelper.removeElementsFromList(element, inputParameterMap.definition, 'entries', null, [entry]));
}

ConnectorService.createInputParameterScript = function(element, bpmnFactory, commands, parameterName, value) {
  var inputParameter = ConnectorService.getInputParameter(element, parameterName);
  if (!inputParameter) {
    inputParameter = ConnectorService.createInputParameter(element, bpmnFactory, commands, { name: parameterName });
  }
  return ConnectorService.createParameterScript(element, bpmnFactory, commands, inputParameter, value);
}


ConnectorService.getOutputParameter = function(element, name) {
  var inputOutput = ConnectorService.getInputOutput(element);
  if (!inputOutput) {
    return undefined;
  }
  var outputParameters = inputOutput.get('outputParameters');
  return outputParameters.find(output => output.name && output.name == name);
}

ConnectorService.getOutputParameterByValue = function(element, value) {
  var inputOutput = ConnectorService.getInputOutput(element);
  if (!inputOutput) {
    return undefined;
  }
  var outputParameters = inputOutput.get('outputParameters');
  return outputParameters.find(output => output.definition && output.definition.value == value);
}

ConnectorService.createOutputParameter = function(element, bpmnFactory, commands, properties, inputOutput = ConnectorService.getInputOutput(element)) {
  if (!inputOutput) {
    return undefined;
  }
  var outputParameter = createElement('camunda:OutputParameter', inputOutput, bpmnFactory, properties);
  commands.push(cmdHelper.addElementsTolist(element, inputOutput, 'outputParameters', [outputParameter]));
  return outputParameter;
}

ConnectorService.deleteOutputParameter = function(element, commands, name = undefined) {
  var inputOutput = ConnectorService.getInputOutput(element);
  if (!inputOutput) {
    return undefined;
  }
  var parametersToRemove = inputOutput.get('outputParameters');
  if (!!name) {
    parametersToRemove = parametersToRemove.filter(parameter => parameter.name == name);
  }
  commands.push(cmdHelper.removeElementsFromList(element, inputOutput, 'outputParameters', null, parametersToRemove));
}

ConnectorService.deleteOutputParameterByValue = function(element, commands, value) {
  var inputOutput = ConnectorService.getInputOutput(element);
  if (!inputOutput) {
    return undefined;
  }
  var outputParameters = inputOutput.get('outputParameters');
  var outputParameter = outputParameters.find(output => output.definition && output.definition.value == value);
  if (outputParameter) {
    commands.push(cmdHelper.removeElementsFromList(element, inputOutput, 'outputParameters', null, [outputParameter]))
  }
}

ConnectorService.createOutputParameterScript = function(element, bpmnFactory, commands, parameterName, value) {
  var outputParameter = ConnectorService.getOutputParameter(element, parameterName);
  if (!outputParameter) {
    outputParameter = ConnectorService.createOutputParameter(element, bpmnFactory, commands, { name: parameterName });
  }
  return ConnectorService.createParameterScript(element, bpmnFactory, commands, outputParameter, value);
}


ConnectorService.createParameterScript = function(element, bpmnFactory, commands, parameter, value) {
  var script = createElement('camunda:Script', parameter, bpmnFactory, {
    scriptFormat: 'JavaScript',
    value
  });
  commands.push(cmdHelper.updateBusinessObject(element, parameter, { definition: script }));
  return script;
}


ConnectorService.updateBusinessObject = function(element, businessObject, commands, properties) {
  commands.push(cmdHelper.updateBusinessObject(element, businessObject, properties));
}
