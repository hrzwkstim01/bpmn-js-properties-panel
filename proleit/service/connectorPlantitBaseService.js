'use strict';

var forEach = require('lodash/forEach');
var connectorService = require('./connectorService');
var endpointCatalogService = require('./endpointCatalogService');
var OpenApiSpecificationService = require('./openApiSpecificationService');

var DefaultRequestHeader = require('../const/header').DefaultRequestHeader;
var ProleitRequestHeader = require('../const/header').ProleitRequestHeader;

function verifyRequestEndpointCatalog(eventBus, controller, plantitBaseOrigin, connectorPlantitBaseService) {
  if (controller && !controller.methods && !connectorPlantitBaseService.controllerCatalogLoading) {
    connectorPlantitBaseService.controllerCatalogLoading = true;
    endpointCatalogService.requestPlantitBaseControllerCatalog(eventBus, plantitBaseOrigin, connectorPlantitBaseService, controller);
  }
}

module.exports = function ConnectorPlantitBaseService(eventBus, bpmnFactory) {
  var service = {
    controllerCatalogLoading: undefined,
    controllers: [],
    editRequestHeaderElement: null,
    modulesLoading: true,
    modules: [],
    services: [],
  };

  // REPLACE WITH READ FROM CONFIG FILE
  // CARO VM 
  // const plantitBaseOrigin = 'https://desktop-c3iwsc:8777';
  const plantitBaseOrigin = 'https://hrzwksthb01.proleit-ag.local:8777';
  
  endpointCatalogService.requestPlantitBaseModules(eventBus, plantitBaseOrigin, service);

  service.getPlantitBaseModules = () => {
    return service.modules;
  };

  service.getPlantitBaseServices = () => {
    return service.services
  }

  service.getPlantitBaseControllers = () => {
    return service.controllers
  }

  service.getPlantitBaseModule = (element) => {
    var headerEntryModule = connectorService.getInputParameterMapEntry(element, 'headers', ProleitRequestHeader.module);
    if (!headerEntryModule) { return undefined; }
    return service.getPlantitBaseModules().find(module => module.value == headerEntryModule.value);
  };

  service.setPlantitBaseModule = (element, plantitBaseModuleValue, resetService = true) => {
    var commands = [];
    connectorService.createOrUpdateInputParameterMapEntry(element, bpmnFactory, commands, 'headers', {
      key: ProleitRequestHeader.module,
      value: plantitBaseModuleValue
    });
    var currentModule = service.getPlantitBaseModule(element);
    if (resetService && currentModule && currentModule.value !== plantitBaseModuleValue) {
      commands.push(service.setPlantitBaseService(element, undefined, true));
    }
    return commands;
  };

  service.getPlantitBaseService = (element) => {
    var headerEntryService = connectorService.getInputParameterMapEntry(element, 'headers', ProleitRequestHeader.service);
    if (!headerEntryService) { return undefined; }
    return service.getPlantitBaseServices().find(service => service.value == headerEntryService.value);
  };

  service.setPlantitBaseService = (element, plantitBaseServiceValue, resetController = true) => {
    var commands = [];
    connectorService.createOrUpdateInputParameterMapEntry(element, bpmnFactory, commands, 'headers', {
      key: ProleitRequestHeader.service,
      value: plantitBaseServiceValue
    });
    var newService = service.getPlantitBaseServices().find(service => service.value == plantitBaseServiceValue);
    if (newService && newService.module) {
      commands.push(service.setPlantitBaseModule(element, newService.module, false));
    }
    var currentService = service.getPlantitBaseService(element);
    if (resetController && currentService && currentService.value !== plantitBaseServiceValue) {
      commands.push(service.setPlantitBaseController(element, undefined, true));
    }
    return commands;
  };

  service.getPlantitBaseController = (element) => {
    var headerEntryApiName = connectorService.getInputParameterMapEntry(element, 'headers', ProleitRequestHeader.apiName);
    if (!headerEntryApiName) { return undefined; }
    var selectedController = service.getPlantitBaseControllers().find(controller => controller.value == headerEntryApiName.value);
    verifyRequestEndpointCatalog(eventBus, selectedController, plantitBaseOrigin, service);
    return selectedController;
  };

  service.getPlantitBaseControllerById = (controllerId) => {
    return service.controllers.find(controller => controller.id == controllerId);
  };

  service.setPlantitBaseController = (element, plantitBaseControllerValue) => {
    var commands = [];
    var controller = service.controllers.find(controller => controller.value == plantitBaseControllerValue);
    verifyRequestEndpointCatalog(eventBus, controller, plantitBaseOrigin, service);
    connectorService.createOrUpdateInputParameterMapEntry(element, bpmnFactory, commands, 'headers', {
      key: ProleitRequestHeader.apiName,
      value: plantitBaseControllerValue
    });
    if (controller) {
      commands.push(service.setPlantitBaseService(element, controller.service, false));
    } else {
      commands.push(service.setPlantitBaseModule(element, undefined, false));
      commands.push(service.setPlantitBaseService(element, undefined, false));
    }
    var currentController = service.getPlantitBaseController(element);
    if (currentController && currentController.value !== plantitBaseControllerValue) {
      commands.push(service.setPlantitBaseMethod(element, {}));
    }
    return commands;
  };

  service.getPlantitBaseControllerCatalog = (element) => {
    var controller = service.getPlantitBaseController(element);
    if (!controller || !controller.methods) {
      return undefined;
    }
    return controller.methods;
  }

  service.getPlantitBaseMethod = (element) => {
    var controller = service.getPlantitBaseController(element);
    var headerEntryPath = connectorService.getInputParameterMapEntry(element, 'headers', ProleitRequestHeader.initialPath);
    var parameterMethod = connectorService.getInputParameter(element, 'method');
    if (!controller || !controller.methods || !headerEntryPath || !parameterMethod) {
      return undefined;
    }
    return controller.methods.find(method =>
      headerEntryPath.value == method.path && parameterMethod.value.toLowerCase() == method.method);
  }

  service.setPlantitBaseMethod = (element, plantitBaseMethod) => {
    var commands = [];
    var header = {
      ...DefaultRequestHeader,
      [ProleitRequestHeader.path]: plantitBaseMethod.path,
      [ProleitRequestHeader.initialPath]: plantitBaseMethod.path,
      [ProleitRequestHeader.scopes]: plantitBaseMethod.security
    }
    forEach(header, function(value, key) {
      if (value) {
        connectorService.createOrUpdateInputParameterMapEntry(element, bpmnFactory, commands, 'headers', { key, value });
      } else {
        connectorService.deleteInputParameterMapEntryByName(element, commands, 'headers', key);
      }
    });
    
    connectorService.createOrUpdateInputParameter(element, bpmnFactory, commands, {
      name: 'method',
      value: plantitBaseMethod.method ? plantitBaseMethod.method.toUpperCase() : undefined
    });
    connectorService.createOrUpdateInputParameter(element, bpmnFactory, commands, {
      name: 'payload',
      value: ''
    });
    connectorService.deleteOutputParameter(element, commands);
    return commands;
  }

  service.getPlantitBaseMethodParameter = (element) => {
    var method = service.getPlantitBaseMethod(element);
    if (!method) {
      return [];
    }
    var catalog = service.getPlantitBaseControllerById(method.controllerId).catalog;
    var path = service.getPlantitBasePath(element);
    var headerEntries = connectorService.getInputParameterMapEntry(element, 'headers')
    return OpenApiSpecificationService.getParameters(catalog, method.path, method.method, path, headerEntries);
  };

  service.getRequestHeaderSelection = (element) => {
    if (service.editRequestHeaderElement == element.id) {
      return true;
    }
    var headerEntries = connectorService.getInputParameterMapEntry(element, 'headers') || [];
    var parameterHeader = service.getPlantitBaseMethodParameter(element)
      .filter(parameter => parameter.in === 'header')
      .map(parameter => parameter.name);
    var userDefinedHeader = headerEntries
      .filter(header => !Object.values(ProleitRequestHeader).includes(header.key))
      .filter(header => !Object.keys(DefaultRequestHeader).includes(header.key))
      .filter(header => !parameterHeader.includes(header.key));
    return userDefinedHeader.length > 0;
  };

  service.setRequestHeaderSelection = (element, editRequestHeader) => {
    var commands = [];
    if (editRequestHeader) {
      service.editRequestHeaderElement = element.id;
      return [];
    }
    service.editRequestHeaderElement = null;
    var headerEntries = connectorService.getInputParameterMapEntry(element, 'headers') || [];
    var parameterHeader = service.getPlantitBaseMethodParameter(element)
      .filter(parameter => parameter.in === 'header')
      .map(parameter => parameter.name);
    headerEntries
      .filter(entry => !Object.values(ProleitRequestHeader).includes(entry.key))
      .filter(entry => !Object.keys(DefaultRequestHeader).includes(entry.key))
      .filter(entry => !parameterHeader.includes(entry.key))
      .forEach(entry => connectorService.deleteInputParameterMapEntry(element, commands, 'headers', entry));
    Object.keys(DefaultRequestHeader)
      .filter(defaultKey => !headerEntries.some(entry => entry.key == defaultKey))
      .forEach(defaultKey => connectorService.createInputParameterMapEntry(element, bpmnFactory, commands, 'headers', {
        key: defaultKey,
        value: DefaultRequestHeader[defaultKey]
      }));
    return commands;
  };

  service.addRequestHeaderElement = (element)  => {
    var commands = [];
    connectorService.createInputParameterMapEntry(element, bpmnFactory, commands, 'headers', { key: '', value: '' });
    return commands;
  }

  service.getRequestHeaderElements = (element) => {
    var requestHeaderEntries = connectorService.getInputParameterMapEntry(element, 'headers') || [];;
    var parameterHeader = service.getPlantitBaseMethodParameter(element)
      .filter(parameter => parameter.in === 'header')
      .map(parameter => parameter.name);
    return requestHeaderEntries
      .filter(header => !Object.values(ProleitRequestHeader).includes(header.key))
      .filter(header => !parameterHeader.includes(header.key));
  }

  service.setRequestHeaderElement = (element, value, index) => {
    var commands = [];
    var requestHeaderEntry = service.getRequestHeaderElements(element)[index];
    connectorService.updateBusinessObject(element, requestHeaderEntry, commands, {
      value: value.value,
      key: value.key
    });
    return commands;
  }

  service.removeRequestHeaderElement = (element, index) => {
    var commands = [];
    var requestHeaderEntry = service.getRequestHeaderElements(element)[index];
    connectorService.deleteInputParameterMapEntry(element, commands, 'headers', requestHeaderEntry);
    return commands;
  }

  service.getResponseHeaderSelection = (element) => {
    return connectorService.getOutputParameterByValue(element, 'headers;');
  };

  service.setResponseHeaderSelection = (element, editResponseHeader) => {
    var commands = [];
    var responseHeaderParameter = service.getResponseHeaderSelection(element);
    if (!responseHeaderParameter && editResponseHeader) {
      connectorService.createOutputParameterScript(element, bpmnFactory, commands, '', 'headers;');
    } else if (responseHeaderParameter && !editResponseHeader) {
      connectorService.deleteOutputParameterByValue(element, commands, 'headers;');
    }
    return commands;
  };

  service.getResponseCodeSelection = (element) => {
    return connectorService.getOutputParameterByValue(element, 'statuscode;');
  };

  service.setResponseCodeSelection = (element, editResponseCode) => {
    var commands = [];
    var responseCodeParameter = service.getResponseCodeSelection(element);
    if (!responseCodeParameter && editResponseCode) {
      connectorService.createOutputParameterScript(element, bpmnFactory, commands, '', 'statuscode;');
    } else if (responseCodeParameter && !editResponseCode) {
      connectorService.deleteOutputParameterByValue(element, commands, 'statuscode;');
    }
    return commands;
  };

  service.getResponseCodeMapping = (element) => {
    var outputParameter = connectorService.getOutputParameterByValue(element, 'statuscode;');
    return outputParameter ? outputParameter.name : '';
  }

  service.setResponseCodeMapping = (element, responseCodeMap) => {
    var commands = [];
    var outputParameter = connectorService.getOutputParameterByValue(element, 'statuscode;');
    if (outputParameter) {
      connectorService.updateBusinessObject(element, outputParameter, commands, { name: responseCodeMap });
    } else {
      connectorService.createOutputParameterScript(element, bpmnFactory, commands, responseCodeMap, 'statuscode;');
    }
    return commands;
  }

  service.getResponseHeaderMapping = (element) => {
    var outputParameter = connectorService.getOutputParameterByValue(element, 'headers;');
    return outputParameter ? outputParameter.name : '';
  }

  service.setResponseHeaderMapping = (element, responseHeaderMap) => {
    var commands = [];
    var outputParameter = connectorService.getOutputParameterByValue(element, 'headers;');
    if (outputParameter) {
      connectorService.updateBusinessObject(element, outputParameter, commands, { name: responseHeaderMap });
    } else {
      connectorService.createOutputParameterScript(element, bpmnFactory, commands, responseHeaderMap, 'headers;');
    }
    return commands;
  }

  service.plantitBaseModulesLoading = () => service.modulesLoading;

  service.plantitBaseControllerCatalogLoading = () => service.controllerCatalogLoading;

  service.getPlantitBasePath = (element) => {
    var headerPath = connectorService.getInputParameterMapEntry(element, 'headers', ProleitRequestHeader.path);
    return headerPath && headerPath.value;
  };

  service.setPlantitBasePath = (element, value) => {
    var commands = [];
    connectorService.createOrUpdateInputParameterMapEntry(element, bpmnFactory, commands, 'headers', {
      key: ProleitRequestHeader.path,
      value
    });
    return commands;
  };

  service.getHeaderEntries = (element) => {
    return connectorService.getInputParameterMapEntry(element, 'headers');
  };

  service.setHeaderEntry = (element, newEntry) => {
    var commands = [];
    if (newEntry && newEntry.value !== '') {
      connectorService.createOrUpdateInputParameterMapEntry(element, bpmnFactory, commands, 'headers', {
        key: newEntry.name,
        value: newEntry.value
      });
    } else {
      connectorService.deleteInputParameterMapEntryByName(element, commands, 'headers', newEntry.name);
    }
    return commands;
  }

  service.getPayloadValue = (element) => {
    var payloadParameter = connectorService.getInputParameter(element, 'payload');
    return payloadParameter && payloadParameter.value;
  }

  service.setPayloadValue = (element, value) => {
    var commands = [];
    connectorService.createOrUpdateInputParameter(element, bpmnFactory, commands, {
      name: 'payload',
      value
    });
    return commands;
  };

  service.getOutputParameters = (element) => {
    return connectorService.getInputOutput(element).get('outputParameters') || [];
  };

  service.setOutputParameter = (element, name, scriptValue) => {
    var empty = !name || name === '';
    var commands = [];
    var outputParameter = connectorService.getOutputParameterByValue(element, scriptValue);
    
    if (empty) {
      connectorService.deleteOutputParameterByValue(element, commands, scriptValue);
    } else if (outputParameter) {
      connectorService.updateBusinessObject(element, outputParameter, commands, { name });
    } else {
      connectorService.createOutputParameterScript(element, bpmnFactory, commands, name, scriptValue);
    }
    return commands;
  };

  return service;

}
