'use strict';

var accordionFactory = require('../../../factory/AccordionEntryFactory');
var OpenApiSpecificationService = require('../../../service/openApiSpecificationService');

var forEach = require('lodash/forEach');

function getOutputName(outputParameters, scriptValue) {
  var outputParameter = outputParameters.length > 0 ? outputParameters.find(parameter => {
    if (parameter.definition) {
      return parameter.definition.value === scriptValue
    }
  }) : undefined;
  return outputParameter ? outputParameter.name : '';
}

function createEntry(property, name, outputParameters, update, recursiveLevel = 5) {
  var type = property.type;
  var typeDisplay = property.typeDisplay;
  var value = getOutputName(outputParameters, property.scriptValue);
  var scriptValue = property.scriptValue;
  var entry = { name, type, typeDisplay, value, scriptValue, update };

  if (OpenApiSpecificationService.isPredefinedObject(property) && recursiveLevel > 0) {
    entry.children = {};
    forEach(property.properties, function(propertyChild, propertyChildName) {
      entry.children[propertyChildName] =
        createEntry(propertyChild, propertyChildName, outputParameters, update, recursiveLevel - 1);
    });
  }
  return entry;
}

function getResponse(element, plantitBaseConnectorService, responseName) {
  var method = plantitBaseConnectorService.getPlantitBaseMethod(element);
  if (!method) {
    return [];
  }
  var catalog = plantitBaseConnectorService.getPlantitBaseControllerById(method.controllerId).catalog;
  var response = OpenApiSpecificationService.getResponse(catalog, method.path, method.method);
  if (!response) {
    return [];
  }
  var outputParameters = plantitBaseConnectorService.getOutputParameters(element);
  var update = function(updatedEntry) {
    return plantitBaseConnectorService.setOutputParameter(element, updatedEntry.value, updatedEntry.scriptValue);
  }
  var responseEntry = createEntry(response, responseName, outputParameters, update);
  return [responseEntry];
}


module.exports = function(element, group, plantitBaseConnectorService, eventBus, translate) {
  const method = plantitBaseConnectorService.getPlantitBaseMethod(element);
  group.entries.push(accordionFactory(eventBus, {
    id: 'plantitBaseResponse' + (method ? ('_' + method.method + '_' + method.path) : ''),
    modelProperties: ['typeDisplay', 'value'],
    labels: [
      translate('Type'),
      {
        text: translate('Variable Assignment Value'),
        info: translate('Add a variable of type "String"')
      }
    ],
    nameLabel: translate('Parameter'),
    getElements: (element, node) => getResponse(element, plantitBaseConnectorService, translate('Response')),
    editable: (element, entryNode, property, entry) => {
      return property === 'value';
    },
    show: (element, entryNode, node, scopeNode) => {
      return true;
    },
    validate: (element, value, node, idx) => {
      return undefined;
    }
  }));
}
