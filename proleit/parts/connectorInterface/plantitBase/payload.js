'use strict';

var accordionFactory = require('../../../factory/AccordionEntryFactory');
var OpenApiSpecificationService = require('../../../service/openApiSpecificationService');
var ObjectConverterService = require('../../../service/objectConverterService');

var forEach = require('lodash/forEach');

function getUpdatePathParameter(element, plantitBaseConnectorService, method) {
  return function(updatedEntry) {
    var pathValue = plantitBaseConnectorService.getPlantitBasePath(element);
    var newValue = OpenApiSpecificationService.setPathParameter(method, pathValue, updatedEntry);
    return plantitBaseConnectorService.setPlantitBasePath(element, newValue);
  };
}

function getUpdateQueryParameter(element, plantitBaseConnectorService) {
  return function(updatedEntry) {
    var pathValue = plantitBaseConnectorService.getPlantitBasePath(element);
    var newValue = OpenApiSpecificationService.setQueryParameter(pathValue, updatedEntry);
    return plantitBaseConnectorService.setPlantitBasePath(element, newValue);
  }
}

function getUpdateHeaderParameter(element, plantitBaseConnectorService) {
  return function(updatedEntry) {
    return plantitBaseConnectorService.setHeaderEntry(element, updatedEntry);
  }
}

function updateEntryValue(entry, newProperty) {
  var rawValue = ObjectConverterService.resolveValue(entry.value, entry.type);
  if (!rawValue || typeof rawValue === 'string') {
    rawValue = {};
  }
  rawValue[newProperty.name] = ObjectConverterService.resolveValue(newProperty.value, newProperty.type);
  if (!entry.additionalProperties) {
    var validPropertyKeys = Object.keys(entry.properties);
    var invalidPropertyKeys = Object.keys(rawValue).filter(key => !validPropertyKeys.includes(key));
    invalidPropertyKeys.forEach(key => delete rawValue[key]);
  }
  return ObjectConverterService.compressValue(rawValue, entry);
}

function createPropertyEntry(property, name, parent, recursiveLevel = 5, parentIsExpression = false) {
  var entry = {
    additionalProperties: property.additionalProperties,
    disabled: parentIsExpression,
    name,
    properties: property.properties,
    required: property.required || false,
    type: property.type,
    typeDisplay: property.typeDisplay,
    value: property.value
  };

  entry.update = function(updatedEntry) {
    parent.value = updateEntryValue(parent, updatedEntry);
    return parent.update(parent);
  };

  if (OpenApiSpecificationService.isPredefinedObject(property) && recursiveLevel > 0) {
    entry.children = {};
    var parentOrValueIsExpression = parentIsExpression || ObjectConverterService.isExpression(entry.value);
    forEach(property.properties, function(propertyChild, propertyChildName) {
      entry.children[propertyChildName] = createPropertyEntry(
        propertyChild, propertyChildName, entry, recursiveLevel - 1, parentOrValueIsExpression
      );
    });
  }
  return entry;
}

function createParameterEntry(element, plantitBaseConnectorService, method, parameter) {
  var type = parameter.schema.type;
  var typeDisplay = parameter.schema.typeDisplay;
  var items = parameter.schema.items;
  var name = parameter.name;
  var value = parameter.schema.value;
  var required = parameter.required;
  var entry = { name, type, typeDisplay, items, value, required };

  entry.update = parameter.in === 'path' ? getUpdatePathParameter(element, plantitBaseConnectorService, method)
    : parameter.in === 'query' ? getUpdateQueryParameter(element, plantitBaseConnectorService)
    : parameter.in === 'header' ? getUpdateHeaderParameter(element, plantitBaseConnectorService)
    : function() {};

  if (OpenApiSpecificationService.isPredefinedObject(parameter.schema)) {
    entry.children = {};
    forEach(parameter.schema.properties, function(property, propertyName) {
      entry.children[propertyName] = createPropertyEntry(property, propertyName, entry, 4);
    });
  }

  return entry;
}

function getParameters(element, plantitBaseConnectorService) {
  var method = plantitBaseConnectorService.getPlantitBaseMethod(element);
  if (!method) {
    return [];
  }
  var catalog = plantitBaseConnectorService.getPlantitBaseControllerById(method.controllerId).catalog;
  var path = plantitBaseConnectorService.getPlantitBasePath(element);
  var headerEntries = plantitBaseConnectorService.getHeaderEntries(element);
  var parameters = OpenApiSpecificationService.getParameters(catalog, method.path, method.method, path, headerEntries);
  return parameters.map(parameter => createParameterEntry(element, plantitBaseConnectorService, method, parameter));
}

function getRequestBodyProperties(element, plantitBaseConnectorService) {
  var method = plantitBaseConnectorService.getPlantitBaseMethod(element);
  if (!method) {
    return [];
  }
  var catalog = plantitBaseConnectorService.getPlantitBaseControllerById(method.controllerId).catalog;
  var payloadValue = plantitBaseConnectorService.getPayloadValue(element);
  var requestBody = OpenApiSpecificationService.getRequestBody(catalog, method.path, method.method, payloadValue);
  if (!requestBody) {
    return [];
  }
  requestBody.update = (updatedEntry) => plantitBaseConnectorService.setPayloadValue(element, updatedEntry.value);
  var result = [];
  forEach(requestBody.properties, function(property, propertyName) {
    result.push(createPropertyEntry(property, propertyName, requestBody));
  });
  return result;
}

function getElements(element, plantitBaseConnectorService) {
  return [
    ...getParameters(element, plantitBaseConnectorService),
    ...getRequestBodyProperties(element, plantitBaseConnectorService)
  ]
}


module.exports = function(element, group, plantitBaseConnectorService, eventBus, translate) {
  const method = plantitBaseConnectorService.getPlantitBaseMethod(element);
  group.entries.push(accordionFactory(eventBus, {
    id: 'plantitBasePayload' + (method ? ('_' + method.method + '_' + method.path) : ''),
    modelProperties: ['typeDisplay', 'value'],
    labels: [
      translate('Type'),
      {
        text: translate('Variable Assignment Value'),
        info: translate('Start typing "${}" to create an expression or add a constant')
      }
    ],
    nameLabel: translate('Parameter'),
    getElements: (element, node) => getElements(element, plantitBaseConnectorService),
    editable: (element, entryNode, property, entry) => {
      return !entry.disabled && property === 'value';
    },
    setControlValue: undefined,
    show: (element, entryNode, node, scopeNode) => {
      return true;
    },
    validate: (element, value, node, idx) => {
      if (value.required) {
        return value.value && value.value !== '' ? undefined : {value: translate('Must provide a value')};
      }
      if (value.value && value.value !== '' && !OpenApiSpecificationService.valueMatchesType(value)) {
        return { value: translate(`Value must be of type ${value.typeDisplay} or an expression`) }
      }
      return undefined;
    }
  }));
}
